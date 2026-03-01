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

// Enrichment context from external sources
export interface EpisodeEnrichment {
    subtitleDialogue?: string | null;  // From OpenSubtitles
    wikipediaPlot?: string | null;     // From Wikipedia
}

// Word count targets
const LENGTH_TARGETS = {
    short: 1000,
    medium: 2500,
    long: 5000,
};

/**
 * Build context for novel generation
 * Now accepts optional enrichment data for higher accuracy
 */
export function buildEpisodeContext(
    anime: Anime,
    episode: EnhancedEpisode,
    allEpisodes: EnhancedEpisode[],
    enrichment?: EpisodeEnrichment
): string {
    const episodeIndex = allEpisodes.findIndex(ep => ep.mal_id === episode.mal_id);
    const previousEpisode = episodeIndex > 0 ? allEpisodes[episodeIndex - 1] : null;
    const genres = anime.genres?.map(g => g.name).join(', ') || 'Unknown';

    const hasSubtitles = enrichment?.subtitleDialogue && enrichment.subtitleDialogue.trim().length > 50;
    const hasWikipedia = enrichment?.wikipediaPlot && enrichment.wikipediaPlot.trim().length > 50;

    // Trim subtitle dialogue to avoid exceeding context window (~4000 chars is ~1 episode)
    const subtitleTrimmed = hasSubtitles
        ? enrichment!.subtitleDialogue!.substring(0, 8000)
        : null;

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
${episode.tmdb_overview ? `Episode Description: ${episode.tmdb_overview}` : episode.synopsis ? `Episode Synopsis: ${episode.synopsis}` : ''}

${previousEpisode ? `PREVIOUS EPISODE CONTEXT:
Episode ${previousEpisode.mal_id}: ${previousEpisode.title || `Episode ${previousEpisode.mal_id}`}
${previousEpisode.synopsis ? `Synopsis: ${previousEpisode.synopsis}` : ''}
` : 'This is the first episode of the series.'}

${hasWikipedia ? `
## PLOT SUMMARY (Wikipedia — High Accuracy)
The following is an accurate plot summary from Wikipedia. Use this as the primary story source:

${enrichment!.wikipediaPlot}
` : ''}

${hasSubtitles ? `
## EPISODE TRANSCRIPT (Actual Dialogue — Highest Accuracy)
The following is the actual dialogue and narration from this episode. 
Write the novel to faithfully reflect these events and conversations:

${subtitleTrimmed}
` : ''}

ADDITIONAL CONTEXT:
- Episode ${episode.mal_id} of ${allEpisodes.length} total episodes
- ${episode.filler ? 'This is a filler episode' : 'This is a canon episode'}
- ${episode.recap ? 'This episode contains recap elements' : ''}
- Context quality: ${hasSubtitles ? '🎬 Full transcript available' : hasWikipedia ? '📖 Wikipedia plot available' : '📝 Basic synopsis only'}
`.trim();

    return context;
}

/**
 * Generate novel prompt based on context and options
 */
export function buildNovelPrompt(
    context: string,
    options: NovelGenerationOptions,
    hasEnrichment: boolean
): string {
    const wordTarget = LENGTH_TARGETS[options.length];
    const style = options.style || 'auto';

    const styleGuidance = style === 'auto'
        ? "Match the tone and pacing to the anime's genre and this episode's content."
        : `Write in a ${style} style with appropriate pacing and tension.`;

    const faithfulnessInstruction = hasEnrichment
        ? `CRITICAL: A transcript and/or plot summary has been provided above. Your novel MUST faithfully adapt the actual events, dialogue, and plot beats from those sources. Do NOT invent plot points, events, or dialogue that are not present in the provided transcript/summary. You may expand scenes with internal monologue and descriptive language, but the core plot must match exactly.`
        : `Draw on your knowledge of ${context.split('\n')[2]?.replace('Title: ', '') || 'the anime'} to fill in details, but stay consistent with the episode information provided.`;

    return `You are a talented light novel author specializing in anime adaptations. Your task is to write a compelling web novel chapter based on an anime episode.

${context}

TASK: Write a ${options.length}-length (approximately ${wordTarget} words) web novel chapter that brings this anime episode to life as a written narrative.

${faithfulnessInstruction}

STYLE REQUIREMENTS:
- Write in third-person limited perspective
- Use rich, descriptive language to paint vivid scenes
- Include character thoughts and internal monologue where appropriate
- Match the pacing and tone of the anime
- Create engaging dialogue that feels natural and mirrors the source material
- ${styleGuidance}
- Build tension and dramatic moments as they appear in the source
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
 * Now accepts optional enrichment for higher accuracy
 */
export async function generateNovel(
    anime: Anime,
    episode: EnhancedEpisode,
    allEpisodes: EnhancedEpisode[],
    options: NovelGenerationOptions = { length: 'medium' },
    enrichment?: EpisodeEnrichment
): Promise<{
    content: string;
    wordCount: number;
    title: string;
}> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const hasEnrichment = !!(enrichment?.subtitleDialogue || enrichment?.wikipediaPlot);

    // Build context and prompt
    const context = buildEpisodeContext(anime, episode, allEpisodes, enrichment);
    const prompt = buildNovelPrompt(context, options, hasEnrichment);

    const enrichmentSummary = hasEnrichment
        ? `[Wikipedia: ${enrichment?.wikipediaPlot ? '✅' : '❌'}, Subtitles: ${enrichment?.subtitleDialogue ? '✅' : '❌'}]`
        : '[No enrichment]';

    console.log(`🤖 Generating ${options.length} novel for Episode ${episode.mal_id} ${enrichmentSummary}...`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: hasEnrichment ? 0.7 : 0.9,  // Less creative when we have real source material
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

    console.log(`✅ Generated ${wordCount} words for "${title}" ${enrichmentSummary}`);

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
    onProgress?: (current: number, total: number) => void,
    enrichments?: EpisodeEnrichment[]
): Promise<Array<{ content: string; wordCount: number; title: string; episode: EnhancedEpisode }>> {
    const results: Array<{ content: string; wordCount: number; title: string; episode: EnhancedEpisode }> = [];

    for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];
        const enrichment = enrichments?.[i];

        console.log(`📚 Generating novel ${i + 1}/${episodes.length}...`);
        if (onProgress) onProgress(i + 1, episodes.length);

        const novel = await generateNovel(anime, episode, allEpisodes, options, enrichment);
        results.push({ ...novel, episode });

        // Add delay to respect rate limits (15 RPM)
        if (i < episodes.length - 1) {
            console.log('⏳ Rate limit delay...');
            await new Promise(resolve => setTimeout(resolve, 4500));
        }
    }

    return results;
}
