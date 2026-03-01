import { NextRequest, NextResponse } from 'next/server';
import { getAnimeById, getAnimeEpisodes, getEnhancedEpisodes, getAnimeRelations } from '@/lib/jikan';
import { generateNovel, generateBatchNovels, type NovelLength, type EpisodeEnrichment } from '@/lib/novel-generator';
import { fetchEpisodeSubtitleContext } from '@/lib/subtitles';
import { fetchWikipediaEpisodePlot } from '@/lib/wikipedia';

/**
 * Get the base/root show title, stripping season-specific subtitles.
 * e.g. "Jujutsu Kaisen: The Culling Game Part 1" → "Jujutsu Kaisen"
 *       "Attack on Titan: The Final Season" → "Attack on Titan"
 *       "Demon Slayer" → "Demon Slayer"
 */
function getBaseTitle(title: string): string {
    // Strip everything after a colon (season-specific subtitle)
    const colonIdx = title.indexOf(':');
    if (colonIdx > 0) {
        return title.substring(0, colonIdx).trim();
    }
    return title;
}

/**
 * Determine the TRUE ordinal season number by traversing the prequel chain.
 * Only traverses TV series prequels — skips movies, OVAs, specials.
 * 
 * Why: JJK S1 has "Jujutsu Kaisen 0 Movie" as a prequel (type: anime).
 * Without filtering, S3 would be counted as S4.
 * 
 * Season 1 has no TV prequels → depth 1
 * Season 2 has S1 as prequel → depth 2
 * Season 3 has S2 → S2 has S1 → depth 3
 */
async function getSeriesSeasonNumber(animeId: number): Promise<number> {
    const visited = new Set<number>();
    let depth = 1;

    // Cache a minimal set of anime types from Jikan
    const typeCache = new Map<number, string>();

    async function getAnimeType(id: number): Promise<string> {
        if (typeCache.has(id)) return typeCache.get(id)!;
        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, { next: { revalidate: 86400 } });
            if (!res.ok) return 'Unknown';
            const data = await res.json();
            const type: string = data.data?.type || 'Unknown';
            typeCache.set(id, type);
            return type;
        } catch {
            return 'Unknown';
        }
    }

    async function countPrequels(id: number): Promise<void> {
        if (visited.has(id)) return;
        visited.add(id);

        try {
            const relations = await getAnimeRelations(id);
            const prequelRelation = relations.find(r => r.relation === 'Prequel');
            const animePrequels = prequelRelation?.entry.filter(e => e.type === 'anime') || [];

            for (const prequel of animePrequels) {
                if (visited.has(prequel.mal_id)) continue;

                // Only count TV series prequels — skip movies, OVAs, Specials
                const prequelType = await getAnimeType(prequel.mal_id);
                if (prequelType !== 'TV') {
                    console.log(`⏭️  Skipping non-TV prequel: "${prequel.name}" [${prequelType}]`);
                    continue;
                }

                depth++;
                await countPrequels(prequel.mal_id);
                break; // Only follow the first TV prequel to avoid branching
            }
        } catch {
            // Silently fail, use what we have
        }
    }

    await countPrequels(animeId);
    console.log(`📺 Detected season number for anime ${animeId}: Season ${depth}`);
    return depth;
}

/**
 * Fetch enrichment context (subtitles + Wikipedia) for a single episode
 * Both are fetched in parallel and degrade gracefully on failure
 */
async function fetchEnrichment(
    baseTitle: string,        // Root show name, e.g., "Jujutsu Kaisen"
    seasonNumber: number,     // True ordinal season in the series, e.g., 3
    episodeNumber: number,    // Episode number within this season (Jikan's mal_id), e.g., 2
    episodeTitle?: string
): Promise<EpisodeEnrichment> {
    console.log(`🔍 Enrichment: "${baseTitle}" S${seasonNumber}E${episodeNumber} ("${episodeTitle || 'Unknown'}")`);

    const [subtitleResult, wikiResult] = await Promise.allSettled([
        fetchEpisodeSubtitleContext(baseTitle, seasonNumber, episodeNumber),
        fetchWikipediaEpisodePlot(baseTitle, seasonNumber, episodeNumber, episodeTitle),
    ]);

    return {
        subtitleDialogue: subtitleResult.status === 'fulfilled' ? subtitleResult.value : null,
        wikipediaPlot: wikiResult.status === 'fulfilled' ? wikiResult.value : null,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { animeId, episodeIds, length = 'medium' } = body;

        if (!animeId) {
            return NextResponse.json({ error: 'animeId is required' }, { status: 400 });
        }

        if (!episodeIds || !Array.isArray(episodeIds) || episodeIds.length === 0) {
            return NextResponse.json({ error: 'episodeIds array is required and must not be empty' }, { status: 400 });
        }

        console.log(`📖 Novel generation request: Anime ${animeId}, Episodes: ${episodeIds.join(', ')}, Length: ${length}`);

        // Fetch anime data
        const anime = await getAnimeById(animeId);
        const jikanEpisodes = await getAnimeEpisodes(animeId);
        const allEpisodes = await getEnhancedEpisodes(anime, jikanEpisodes);

        // Filter requested episodes
        const selectedEpisodes = allEpisodes.filter(ep => episodeIds.includes(ep.mal_id));

        if (selectedEpisodes.length === 0) {
            return NextResponse.json({ error: 'No matching episodes found' }, { status: 404 });
        }

        const animeDisplayTitle = anime.title_english || anime.title;

        // --- FIX: Get base title (strip subtitle) and TRUE season number from prequel chain ---
        const baseTitle = getBaseTitle(animeDisplayTitle);
        const seasonNumber = await getSeriesSeasonNumber(animeId);

        console.log(`🔍 Enrichment config: base="${baseTitle}", season=${seasonNumber} (from="${animeDisplayTitle}")`);

        // Generate novels
        let novels;

        if (selectedEpisodes.length === 1) {
            const ep = selectedEpisodes[0];
            const enrichment = await fetchEnrichment(baseTitle, seasonNumber, ep.mal_id, ep.title || undefined);

            console.log(`📊 Enrichment result — Wikipedia: ${enrichment.wikipediaPlot ? '✅' : '❌'}, Subtitles: ${enrichment.subtitleDialogue ? '✅' : '❌'}`);

            const novel = await generateNovel(
                anime,
                ep,
                allEpisodes,
                { length: length as NovelLength },
                enrichment
            );
            novels = [{ ...novel, episode: ep }];
        } else {
            console.log(`⚡ Fetching enrichment for ${selectedEpisodes.length} episodes in parallel...`);

            const enrichmentResults = await Promise.allSettled(
                selectedEpisodes.map(ep =>
                    fetchEnrichment(baseTitle, seasonNumber, ep.mal_id, ep.title || undefined)
                )
            );

            const enrichments: EpisodeEnrichment[] = enrichmentResults.map(r =>
                r.status === 'fulfilled' ? r.value : {}
            );

            novels = await generateBatchNovels(
                anime,
                selectedEpisodes,
                allEpisodes,
                { length: length as NovelLength },
                undefined,
                enrichments
            );
        }

        // Prepare response
        const response = {
            animeId,
            animeTitle: animeDisplayTitle,
            episodeIds,
            length,
            novels: novels.map(n => ({
                episodeId: n.episode.mal_id,
                episodeTitle: n.episode.title,
                title: n.title,
                content: n.content,
                wordCount: n.wordCount,
            })),
            totalWordCount: novels.reduce((sum, n) => sum + n.wordCount, 0),
            generatedAt: new Date().toISOString(),
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error generating novel:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate novel',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
