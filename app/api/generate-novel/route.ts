import { NextRequest, NextResponse } from 'next/server';
import { getAnimeById, getAnimeEpisodes, getEnhancedEpisodes } from '@/lib/jikan';
import { generateNovel, generateBatchNovels, type NovelLength } from '@/lib/novel-generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { animeId, episodeIds, length = 'medium' } = body;

        if (!animeId) {
            return NextResponse.json(
                { error: 'animeId is required' },
                { status: 400 }
            );
        }

        if (!episodeIds || !Array.isArray(episodeIds) || episodeIds.length === 0) {
            return NextResponse.json(
                { error: 'episodeIds array is required and must not be empty' },
                { status: 400 }
            );
        }

        console.log(`📖 Novel generation request: Anime ${animeId}, Episodes: ${episodeIds.join(', ')}, Length: ${length}`);

        // Fetch anime data
        const anime = await getAnimeById(animeId);
        const jikanEpisodes = await getAnimeEpisodes(animeId);
        const allEpisodes = await getEnhancedEpisodes(anime, jikanEpisodes);

        // Filter requested episodes
        const selectedEpisodes = allEpisodes.filter(ep =>
            episodeIds.includes(ep.mal_id)
        );

        if (selectedEpisodes.length === 0) {
            return NextResponse.json(
                { error: 'No matching episodes found' },
                { status: 404 }
            );
        }

        // Generate novels
        let novels;

        if (selectedEpisodes.length === 1) {
            // Single episode
            const novel = await generateNovel(
                anime,
                selectedEpisodes[0],
                allEpisodes,
                { length: length as NovelLength }
            );
            novels = [{ ...novel, episode: selectedEpisodes[0] }];
        } else {
            // Multiple episodes (batch)
            novels = await generateBatchNovels(
                anime,
                selectedEpisodes,
                allEpisodes,
                { length: length as NovelLength }
            );
        }

        // Prepare response
        const response = {
            animeId,
            animeTitle: anime.title_english || anime.title,
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
