import { NextRequest, NextResponse } from 'next/server';
import { getAnimeById, getAnimeEpisodes, getEnhancedEpisodes } from '@/lib/jikan';
import { generateNovel, generateBatchNovels, type NovelLength, type EpisodeEnrichment } from '@/lib/novel-generator';
import { fetchEpisodeSubtitleContext } from '@/lib/subtitles';
import { fetchWikipediaEpisodePlot } from '@/lib/wikipedia';

/**
 * Detect which season number a given anime corresponds to.
 * Uses the jikan episode MAL IDs and the anime title to estimate season.
 * This is a heuristic — for JJK S3, the title "The Culling Game Part 1" implies season 3.
 */
function detectSeasonNumber(animeTitle: string): number {
    const patterns = [
        /Season\s+(\d+)/i,
        /(\d+)(?:st|nd|rd|th)\s+Season/i,
        /Part\s+(\d+)/i,
        /:\s*(\d+)$/,
    ];
    for (const p of patterns) {
        const m = animeTitle.match(p);
        if (m) return parseInt(m[1]);
    }
    return 1;
}

/**
 * Fetch enrichment context (subtitles + Wikipedia) for a single episode
 * Both are fetched in parallel and degrade gracefully on failure
 */
async function fetchEnrichment(
    animeTitle: string,
    seasonNumber: number,
    episodeNumber: number,
    episodeTitle?: string
): Promise<EpisodeEnrichment> {
    const [subtitleResult, wikiResult] = await Promise.allSettled([
        fetchEpisodeSubtitleContext(animeTitle, seasonNumber, episodeNumber),
        fetchWikipediaEpisodePlot(animeTitle, seasonNumber, episodeNumber, episodeTitle),
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

        // Determine season number for subtitle/Wikipedia lookups
        const animeDisplayTitle = anime.title_english || anime.title;
        const seasonNumber = detectSeasonNumber(animeDisplayTitle);

        console.log(`🔍 Enrichment lookup: "${animeDisplayTitle}" Season ${seasonNumber}`);

        // Generate novels
        let novels;

        if (selectedEpisodes.length === 1) {
            // Single episode: fetch enrichment then generate
            const ep = selectedEpisodes[0];
            console.log(`⚡ Fetching enrichment for Episode ${ep.mal_id}...`);

            const enrichment = await fetchEnrichment(
                animeDisplayTitle,
                seasonNumber,
                ep.mal_id, // Jikan uses absolute episode numbers (e.g. 1-12 for S3)
                ep.title || undefined
            );

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
            // Multiple episodes: fetch all enrichments in parallel (to save time)
            console.log(`⚡ Fetching enrichment for ${selectedEpisodes.length} episodes in parallel...`);

            const enrichmentResults = await Promise.allSettled(
                selectedEpisodes.map(ep =>
                    fetchEnrichment(animeDisplayTitle, seasonNumber, ep.mal_id, ep.title || undefined)
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
