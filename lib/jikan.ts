import type { Anime, JikanResponse, EnhancedEpisode, Season, TMDBSearchResult, AnimeRelation, AnimeSeason } from "@/types/anime";
import { searchTMDBAnime, getTMDBSeasonEpisodes, getTMDBImageUrl, getTMDBShowDetails } from "./tmdb";

const JIKAN_API_BASE = "https://api.jikan.moe/v4";

// In-memory cache for anime relations to reduce API calls
const relationsCache = new Map<number, AnimeRelation[]>();
// In-memory cache for anime details
const animeCache = new Map<number, Anime>();

/**
 * Fetch anime from the current season
 * @param limit - Number of anime to fetch (default: 24)
 */
export async function getSeasonalAnime(limit: number = 24): Promise<Anime[]> {
    try {
        const response = await fetch(`${JIKAN_API_BASE}/seasons/now?limit=${limit}`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<Anime[]> = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching seasonal anime:", error);
        throw error;
    }
}

/**
 * Fetch top airing anime
 * @param limit - Number of anime to fetch (default: 24)
 */
export async function getTopAiringAnime(limit: number = 24): Promise<Anime[]> {
    try {
        const response = await fetch(
            `${JIKAN_API_BASE}/top/anime?filter=airing&limit=${limit}`,
            {
                next: { revalidate: 3600 }, // Revalidate every hour
            }
        );

        if (!response.ok) {
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<Anime[]> = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching top airing anime:", error);
        throw error;
    }
}

/**
 * Get display title for anime (prefer English, fallback to original)
 */
export function getAnimeTitle(anime: Anime): string {
    return anime.title_english || anime.title;
}

/**
 * Format anime score for display
 */
export function formatScore(score: number | null): string {
    if (!score) return "N/A";
    return score.toFixed(1);
}

/**
 * Get anime image URL (prefer large webp, fallback to jpg)
 */
export function getAnimeImageUrl(anime: Anime): string {
    return anime.images.webp.large_image_url || anime.images.jpg.large_image_url;
}

/**
 * Fetch anime by ID
 * @param id - MyAnimeList anime ID
 */
export async function getAnimeById(id: number): Promise<Anime> {
    // Check cache first
    if (animeCache.has(id)) {
        console.log(`✅ Cache hit for anime ${id}`);
        return animeCache.get(id)!;
    }

    try {
        const response = await fetch(`${JIKAN_API_BASE}/anime/${id}`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            // Handle rate limiting gracefully
            if (response.status === 429) {
                console.log(`⚠️  Rate limited when fetching anime ${id}`);
                throw new Error('Rate limited - please wait a moment and refresh');
            }
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<Anime> = await response.json();

        // Cache the result
        animeCache.set(id, data.data);
        console.log(`📦 Cached anime ${id}`);

        return data.data;
    } catch (error) {
        console.error("Error fetching anime by ID:", error);
        throw error;
    }
}

/**
 * Fetch episodes for an anime
 * @param id - MyAnimeList anime ID
 * @param page - Page number (optional, fetches all if not specified)
 */
export async function getAnimeEpisodes(id: number, page: number = 1): Promise<any[]> {
    try {
        const response = await fetch(`${JIKAN_API_BASE}/anime/${id}/episodes?page=${page}`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            // Handle rate limiting gracefully
            if (response.status === 429) {
                console.log(`⚠️  Rate limited when fetching episodes for anime ${id}`);
                return [];
            }
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<any[]> = await response.json();

        // Fetch additional pages if they exist
        if (data.pagination?.has_next_page) {
            const nextPageEpisodes = await getAnimeEpisodes(id, page + 1);
            return [...data.data, ...nextPageEpisodes];
        }

        return data.data;
    } catch (error) {
        console.error("Error fetching anime episodes:", error);
        return [];
    }
}

/**
 * Helper to generate title variations for better TMDB matching
 */
function getTitleVariations(title: string): string[] {
    const variations = [title]; // Start with original title

    // Remove common suffixes and parts
    const patterns = [
        /:\s*Part\s+\d+/i,           // ": Part 1", ": Part 2"
        /:\s*Season\s+\d+/i,         // ": Season 2"
        /:\s*\d+(st|nd|rd|th)\s+Season/i, // ": 2nd Season"
        /:\s*The\s+\w+\s+Game/i,     // ": The Culling Game"
        /\s*-\s*Part\s+\d+/i,        // "- Part 1"
        /\s*Part\s+\d+$/i,           // "Part 1" at end
        /:\s*.+$/,                   // Everything after colon
    ];

    let workingTitle = title;
    for (const pattern of patterns) {
        const cleaned = workingTitle.replace(pattern, '').trim();
        if (cleaned && cleaned !== workingTitle && !variations.includes(cleaned)) {
            variations.push(cleaned);
            workingTitle = cleaned; // Continue cleaning from this version
        }
    }

    return variations;
}

/**
 * Detect season number from anime title
 */
function detectSeasonNumber(title: string): number {
    // Look for patterns like "Season 2", "2nd Season", "Part 2", etc.
    const patterns = [
        /Season\s+(\d+)/i,
        /(\d+)(?:st|nd|rd|th)\s+Season/i,
        /Part\s+(\d+)/i,
        /:\s*(\d+)/,  // Sometimes just ": 2"
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match && match[1]) {
            const seasonNum = parseInt(match[1]);
            if (seasonNum > 0 && seasonNum <= 10) {
                return seasonNum;
            }
        }
    }

    return 1; // Default to season 1
}

/**
 * Search TMDB with fallback to title variations
 */
async function searchTMDBWithFallback(title: string): Promise<TMDBSearchResult[]> {
    const variations = getTitleVariations(title);

    console.log(`Trying ${variations.length} title variations for TMDB search:`, variations);

    for (const variation of variations) {
        const results = await searchTMDBAnime(variation);
        if (results && results.length > 0) {
            console.log(`✅ TMDB match found using: "${variation}"`);
            return results;
        }
    }

    console.log(`❌ No TMDB match found for any variation of: ${title}`);
    return [];
}

/**
 * Enhance episodes with TMDB data (images and better descriptions)
 * @param anime - Anime data from Jikan
 * @param jikanEpisodes - Episodes from Jikan API
 */
export async function getEnhancedEpisodes(
    anime: Anime,
    jikanEpisodes: any[]
): Promise<EnhancedEpisode[]> {
    try {
        // Search TMDB by anime title with fallback variations
        const searchTitle = anime.title_english || anime.title;
        const tmdbResults = await searchTMDBWithFallback(searchTitle);

        if (!tmdbResults || tmdbResults.length === 0) {
            console.log(`No TMDB match for: ${searchTitle}`);
            // No TMDB match, return Jikan data only
            return jikanEpisodes.map(ep => ({
                mal_id: ep.mal_id,
                title: ep.title || `Episode ${ep.mal_id}`,
                title_japanese: ep.title_japanese,
                aired: ep.aired,
                score: ep.score,
                filler: ep.filler || false,
                recap: ep.recap || false,
                synopsis: ep.synopsis,
            }));
        }

        // Get TMDB show
        const tmdbShow = tmdbResults[0];
        console.log(`TMDB match found: ${tmdbShow.name} (ID: ${tmdbShow.id})`);

        // Strategy: Fetch ALL TMDB seasons and match by episode offset
        // TMDB might have all episodes in Season 1, or split across multiple seasons
        // We need to figure out which TMDB episodes correspond to these Jikan episodes

        const allTMDBEpisodes: any[] = [];
        const totalEpisodes = jikanEpisodes.length;

        // Fetch TMDB seasons until we have enough episodes
        // Try up to 10 seasons
        for (let seasonNum = 1; seasonNum <= 10; seasonNum++) {
            try {
                const seasonEpisodes = await getTMDBSeasonEpisodes(tmdbShow.id, seasonNum);
                if (seasonEpisodes && seasonEpisodes.length > 0) {
                    allTMDBEpisodes.push(...seasonEpisodes);
                    console.log(`Fetched ${seasonEpisodes.length} episodes from TMDB Season ${seasonNum} (total so far: ${allTMDBEpisodes.length})`);

                    // Keep fetching until we have enough episodes to cover potential offset
                    // We need to account for the fact that this might be Season 3 with episodes 48-54
                    if (allTMDBEpisodes.length >= 100) {
                        break; // Cap at 100 episodes to avoid fetching too much
                    }
                } else {
                    break; // No more seasons
                }
            } catch (error) {
                console.log(`No TMDB Season ${seasonNum} available`);
                break; // Stop if season doesn't exist
            }
        }

        console.log(`Total TMDB episodes fetched: ${allTMDBEpisodes.length} for ${totalEpisodes} Jikan episodes`);

        // Now we need to find the offset - which TMDB episodes match these Jikan episodes?
        // Strategy: Try to match by episode title similarity
        // If first Jikan episode title matches TMDB episode 48, offset = 47

        let episodeOffset = 0;
        if (jikanEpisodes.length > 0 && jikanEpisodes[0].title && allTMDBEpisodes.length > totalEpisodes) {
            const firstJikanTitle = jikanEpisodes[0].title.toLowerCase();

            // Search for best matching TMDB episode by title
            let bestMatchIndex = 0;
            let bestMatchScore = 0;

            for (let i = 0; i < Math.min(allTMDBEpisodes.length, 100); i++) {
                const tmdbTitle = (allTMDBEpisodes[i].name || '').toLowerCase();
                if (tmdbTitle && firstJikanTitle) {
                    // Simple similarity: count matching words
                    const jikanWords = firstJikanTitle.split(/\s+/);
                    const tmdbWords = tmdbTitle.split(/\s+/);
                    const matchingWords = jikanWords.filter((w: string) => tmdbWords.includes(w)).length;
                    const score = matchingWords / Math.max(jikanWords.length, 1);

                    if (score > bestMatchScore) {
                        bestMatchScore = score;
                        bestMatchIndex = i;
                    }
                }
            }

            if (bestMatchScore > 0.3) { // At least 30% word match
                episodeOffset = bestMatchIndex;
                console.log(`📍 Found episode offset: ${episodeOffset} (matched "${jikanEpisodes[0].title}" with "${allTMDBEpisodes[bestMatchIndex]?.name}", score: ${bestMatchScore.toFixed(2)})`);
            }
        }

        console.log(`Using episode offset: ${episodeOffset}`);

        // Merge Jikan + TMDB data using the calculated offset
        return jikanEpisodes.map((ep, idx) => {
            // Use offset to find the correct TMDB episode
            const tmdbEp = allTMDBEpisodes[episodeOffset + idx];

            if (tmdbEp && tmdbEp.still_path) {
                console.log(`Episode ${ep.mal_id}: Matched with TMDB ep ${episodeOffset + idx + 1} - "${tmdbEp.name}"`);
            }

            return {
                mal_id: ep.mal_id,
                title: ep.title || tmdbEp?.name || `Episode ${ep.mal_id}`,
                title_japanese: ep.title_japanese,
                aired: ep.aired || tmdbEp?.air_date,
                score: ep.score || tmdbEp?.vote_average,
                filler: ep.filler || false,
                recap: ep.recap || false,
                synopsis: ep.synopsis,
                tmdb_image: tmdbEp?.still_path ? getTMDBImageUrl(tmdbEp.still_path, "w780") || undefined : undefined,
                tmdb_overview: tmdbEp?.overview,
            };
        });
    } catch (error) {
        console.error("Error enhancing episodes with TMDB:", error);
        // Fallback to Jikan data only
        return jikanEpisodes.map(ep => ({
            mal_id: ep.mal_id,
            title: ep.title || `Episode ${ep.mal_id}`,
            title_japanese: ep.title_japanese,
            aired: ep.aired,
            score: ep.score,
            filler: ep.filler || false,
            recap: ep.recap || false,
            synopsis: ep.synopsis,
        }));
    }
}

/**
 * Generate season groups (12 episodes per season)
 * @param totalEpisodes - Total number of episodes
 */
export function generateSeasons(totalEpisodes: number): Season[] {
    const seasons: Season[] = [];
    const episodesPerSeason = 12;
    const numSeasons = Math.ceil(totalEpisodes / episodesPerSeason);

    for (let i = 0; i < numSeasons; i++) {
        const start = i * episodesPerSeason + 1;
        const end = Math.min((i + 1) * episodesPerSeason, totalEpisodes);

        seasons.push({
            number: i + 1,
            name: `Season ${i + 1}`,
            episodeRange: { start, end },
        });
    }

    return seasons;
}

/**
 * Fetch anime relations (sequels, prequels, etc.)
 * @param id - MyAnimeList anime ID
 */
export async function getAnimeRelations(id: number): Promise<AnimeRelation[]> {
    // Check cache first
    if (relationsCache.has(id)) {
        console.log(`✅ Cache hit for anime ${id} relations`);
        return relationsCache.get(id)!;
    }

    try {
        const response = await fetch(`${JIKAN_API_BASE}/anime/${id}/relations`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            // If rate limited, return empty array instead of crashing
            if (response.status === 429) {
                console.log(`⚠️  Rate limited when fetching relations for anime ${id}`);
                return [];
            }
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<AnimeRelation[]> = await response.json();

        // Cache the result
        relationsCache.set(id, data.data);
        console.log(`📦 Cached relations for anime ${id}`);

        return data.data;
    } catch (error) {
        console.error("Error fetching anime relations:", error);
        return [];
    }
}

/**
 * Build season list from anime relations for navigation
 * Recursively traverses the entire prequel/sequel chain to find all seasons
 * @param currentAnime - Current anime data
 * @param relations - Anime relations for the current anime
 */
export async function buildSeasonList(
    currentAnime: Anime,
    relations: AnimeRelation[]
): Promise<AnimeSeason[]> {
    const seasonMap = new Map<number, AnimeSeason>();
    const visited = new Set<number>();

    // Helper to delay between API calls to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Recursive function to traverse the chain
    async function traverseChain(animeId: number, currentOrder: number, depth: number = 0) {
        if (visited.has(animeId) || depth > 10) return;
        visited.add(animeId);

        // Add delay to avoid hitting Jikan rate limit
        if (depth > 0) {
            await delay(350); // 350ms = ~2.8 req/sec
        }

        try {
            // Fetch relations for this anime
            const animeRelations = await getAnimeRelations(animeId);

            // Find prequel (go backwards in the chain)
            const prequels = animeRelations.find(r => r.relation === "Prequel")?.entry.filter(e => e.type === "anime") || [];
            for (const prequel of prequels) {
                if (!visited.has(prequel.mal_id)) {
                    seasonMap.set(prequel.mal_id, {
                        mal_id: prequel.mal_id,
                        title: prequel.name,
                        type: "Prequel",
                        order: currentOrder - 1,
                    });
                    await traverseChain(prequel.mal_id, currentOrder - 1, depth + 1);
                }
            }

            // Find sequels (go forward in the chain)
            const sequels = animeRelations.find(r => r.relation === "Sequel")?.entry.filter(e => e.type === "anime") || [];
            for (const sequel of sequels) {
                if (!visited.has(sequel.mal_id)) {
                    seasonMap.set(sequel.mal_id, {
                        mal_id: sequel.mal_id,
                        title: sequel.name,
                        type: "Sequel",
                        order: currentOrder + 1,
                    });
                    await traverseChain(sequel.mal_id, currentOrder + 1, depth + 1);
                }
            }
        } catch (error) {
            console.log(`⚠️  Stopped season traversal: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Add current anime
    seasonMap.set(currentAnime.mal_id, {
        mal_id: currentAnime.mal_id,
        title: currentAnime.title_english || currentAnime.title,
        type: "Current",
        order: 0,
    });

    // Traverse the entire chain starting from current anime
    await traverseChain(currentAnime.mal_id, 0);

    // Convert map to array and sort by order
    const seasons = Array.from(seasonMap.values());
    seasons.sort((a, b) => a.order - b.order);

    // Renumber to be sequential (1, 2, 3...)
    seasons.forEach((season, idx) => {
        season.order = idx;
    });

    console.log(`📺 Found ${seasons.length} seasons in the series`);

    return seasons;
}
/**
 * Get high-quality images for anime from TMDB
 * @param anime - Anime data from Jikan
 * @returns Object with poster and backdrop URLs (fallback to Jikan if TMDB not available)
 */
export async function getAnimeImages(anime: Anime): Promise<{
    poster: string;
    backdrop: string;
}> {
    const jikanImage = getAnimeImageUrl(anime);
    const defaultImages = { poster: jikanImage, backdrop: jikanImage };

    console.log(`🖼️  Fetching high-res images for: ${anime.title_english || anime.title}`);

    try {
        const searchTitle = anime.title_english || anime.title;
        const tmdbResults = await searchTMDBWithFallback(searchTitle);

        if (!tmdbResults || tmdbResults.length === 0) {
            console.log(`No TMDB results for images, using Jikan fallback`);
            return defaultImages;
        }

        const tmdbShow = await getTMDBShowDetails(tmdbResults[0].id);
        if (!tmdbShow) {
            console.log(`Failed to get TMDB show details, using Jikan fallback`);
            return defaultImages;
        }

        const result = {
            poster: tmdbShow.poster_path ? getTMDBImageUrl(tmdbShow.poster_path, "w780") || jikanImage : jikanImage,
            backdrop: tmdbShow.backdrop_path ? getTMDBImageUrl(tmdbShow.backdrop_path, "original") || jikanImage : jikanImage,
        };

        console.log(`✅ Using TMDB images:`);
        console.log(`   Poster: ${tmdbShow.poster_path ? 'TMDB w500' : 'Jikan fallback'}`);
        console.log(`   Backdrop: ${tmdbShow.backdrop_path ? 'TMDB original (full res)' : 'Jikan fallback'}`);

        return result;
    } catch (error) {
        console.error("Error fetching TMDB images:", error);
        return defaultImages;
    }
}

/**
 * Search for anime by query string
 * @param query - Search query
 * @returns Array of matching anime
 */
export async function searchAnime(query: string): Promise<Anime[]> {
    try {
        const response = await fetch(
            `${JIKAN_API_BASE}/anime?q=${encodeURIComponent(query)}&limit=20`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            if (response.status === 429) {
                console.log(`⚠️  Rate limited when searching for "${query}"`);
                return [];
            }
            throw new Error(`Jikan API error: ${response.status}`);
        }

        const data: JikanResponse<Anime[]> = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error searching anime:", error);
        return [];
    }
}
