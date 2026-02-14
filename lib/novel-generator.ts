import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Anime, EnhancedEpisode } from "@/types/anime";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export type NovelLength = 'short' | 'medium' | 'long';

interface NovelGenerationOptions {
    length: NovelLength;
    style?: 'action' | 'dramatic' | 'slice-of-life' | 'auto';
}

// Word count targets
const LENGTH_TARGETS = {
    short: 1000,
    medium: 2500,
    long: 5000,
};

/**
 * Build context for novel generation
 */
export function buildEpisodeContext(
    anime: Anime,
    episode: EnhancedEpisode,
    allEpisodes: EnhancedEpisode[]
): string {
    const episodeIndex = allEpisodes.findIndex(ep => ep.mal_id === episode.mal_id);
    const previousEpisode = episodeIndex > 0 ? allEpisodes[episodeIndex - 1] : null;

    // Determine primary genre/style
    const genres = anime.genres?.map(g => g.name).join(', ') || 'Unknown';

    const context = `
ANIME INFORMATION:
Title: ${anime.title_english || anime.title}
Japanese Title: ${anime.title_japanese || 'N/A'}
Genres: ${genres}
Synopsis: ${anime.synopsis || 'No synopsis available'}

EPISODE INFORMATION:
Episode Number: ${episode.mal_id}
Episode Title: ${episode.title || `Episode ${episode.mal_id}`}
Air Date: ${episode.aired || 'Unknown'}
${episode.synopsis ? `Episode Synopsis: ${episode.synopsis}` : ''}
${episode.tmdb_overview ? `Enhanced Description: ${episode.tmdb_overview}` : ''}

${previousEpisode ? `PREVIOUS EPISODE:
Episode ${previousEpisode.mal_id}: ${previousEpisode.title || `Episode ${previousEpisode.mal_id}`}
${previousEpisode.synopsis ? `Synopsis: ${previousEpisode.synopsis}` : ''}
` : 'This is the first episode of the series.'}

ADDITIONAL CONTEXT:
- Episode ${episode.mal_id} of ${allEpisodes.length} total episodes
- ${episode.filler ? 'This is a filler episode' : 'This is a canon episode'}
- ${episode.recap ? 'This episode contains recap elements' : ''}
`.trim();

    return context;
}

/**
 * Generate novel prompt based on context and options
 */
export function buildNovelPrompt(
    context: string,
    options: NovelGenerationOptions
): string {
    const wordTarget = LENGTH_TARGETS[options.length];
    const style = options.style || 'auto';

    const styleGuidance = style === 'auto'
        ? 'Match the tone and pacing to the anime\'s genre and this episode\'s content.'
        : `Write in a ${style} style with appropriate pacing and tension.`;

    return `You are a talented light novel author specializing in anime adaptations. Your task is to write a compelling web novel chapter based on an anime episode.

${context}

TASK: Write a ${options.length}-length (approximately ${wordTarget} words) web novel chapter that brings this anime episode to life as a written narrative.

STYLE REQUIREMENTS:
- Write in third-person limited perspective
- Use rich, descriptive language to paint vivid scenes
- Include character thoughts and internal monologue where appropriate
- Match the pacing and tone of the anime
- Create engaging dialogue that feels natural
- ${styleGuidance}
- Build tension and dramatic moments
- Maintain continuity with previous episodes when relevant

STRUCTURE REQUIREMENTS:
- Start with a compelling chapter title (format: "Chapter X: [Evocative Title]")
- Divide the story into 3-5 natural sections
- Use scene breaks (---) between major transitions
- Include a satisfying ending that either resolves the episode's arc or creates anticipation for the next

FORMAT:
- Pure narrative prose (no stage directions or screenplay format)
- Use proper paragraph breaks for readability
- Include sensory details (sights, sounds, emotions)
- Show character development and growth

IMPORTANT:
- DO NOT include meta-commentary or references to the anime format
- Write as if this is an original light novel, not an adaptation
- Focus on the story, characters, and worldbuilding
- Make it engaging enough that readers want to continue to the next chapter

BEGIN THE NOVEL CHAPTER NOW:`;
}

/**
 * Generate novel using Gemini API
 */
export async function generateNovel(
    anime: Anime,
    episode: EnhancedEpisode,
    allEpisodes: EnhancedEpisode[],
    options: NovelGenerationOptions = { length: 'medium' }
): Promise<{
    content: string;
    wordCount: number;
    title: string;
}> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build context and prompt
    const context = buildEpisodeContext(anime, episode, allEpisodes);
    const prompt = buildNovelPrompt(context, options);

    console.log(`🤖 Generating ${options.length} novel for Episode ${episode.mal_id}...`);

    // Use Gemini 1.5 Flash for fast, high-quality generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.9,  // Creative but coherent
            topK: 40,
            topP: 0.95,
            maxOutputTokens: options.length === 'long' ? 8000 : options.length === 'medium' ? 4000 : 2000,
        },
    });

    const response = result.response;
    const content = response.text();

    // Calculate word count
    const wordCount = content.split(/\s+/).length;

    // Extract chapter title
    const titleMatch = content.match(/^#?\s*Chapter \d+:\s*(.+)/m);
    const title = titleMatch
        ? titleMatch[1].trim()
        : episode.title || `Episode ${episode.mal_id}`;

    console.log(`✅ Generated ${wordCount} words for "${title}"`);

    return {
        content,
        wordCount,
        title,
    };
}

/**
 * Generate novels for multiple episodes (batch)
 */
export async function generateBatchNovels(
    anime: Anime,
    episodes: EnhancedEpisode[],
    allEpisodes: EnhancedEpisode[],
    options: NovelGenerationOptions = { length: 'medium' },
    onProgress?: (current: number, total: number) => void
): Promise<Array<{ content: string; wordCount: number; title: string; episode: EnhancedEpisode }>> {
    const results: Array<{ content: string; wordCount: number; title: string; episode: EnhancedEpisode }> = [];

    for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];

        console.log(`📚 Generating novel ${i + 1}/${episodes.length}...`);
        if (onProgress) {
            onProgress(i + 1, episodes.length);
        }

        const novel = await generateNovel(anime, episode, allEpisodes, options);
        results.push({ ...novel, episode });

        // Add delay to respect rate limits (15 RPM)
        if (i < episodes.length - 1) {
            console.log('⏳ Rate limit delay...');
            await new Promise(resolve => setTimeout(resolve, 4500)); // ~13 requests/minute
        }
    }

    return results;
}
