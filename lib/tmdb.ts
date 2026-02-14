import type { TMDBSearchResult, TMDBShow, TMDBEpisode } from "@/types/anime";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/**
 * Search TMDB for TV shows by title
 * @param query - Search query (anime title)
 * @returns Array of matching TV shows
 */
export async function searchTMDBAnime(query: string): Promise<TMDBSearchResult[]> {
    if (!TMDB_API_KEY) {
        console.warn("TMDB_API_KEY not configured");
        return [];
    }

    try {
        const url = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error searching TMDB:", error);
        return [];
    }
}

/**
 * Get TV show details by TMDB ID
 * @param tmdbId - TMDB TV show ID
 * @returns TV show details with seasons
 */
export async function getTMDBShowDetails(tmdbId: number): Promise<TMDBShow | null> {
    if (!TMDB_API_KEY) {
        console.warn("TMDB_API_KEY not configured");
        return null;
    }

    try {
        const url = `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data: TMDBShow = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching TMDB show details:", error);
        return null;
    }
}

/**
 * Get episodes for a specific season
 * @param tmdbId - TMDB TV show ID
 * @param seasonNumber - Season number (1-indexed)
 * @returns Array of episodes for the season
 */
export async function getTMDBSeasonEpisodes(
    tmdbId: number,
    seasonNumber: number
): Promise<TMDBEpisode[]> {
    if (!TMDB_API_KEY) {
        console.warn("TMDB_API_KEY not configured");
        return [];
    }

    try {
        const url = `${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`;
        const response = await fetch(url, {
            next: { revalidate: 86400 }, // Cache for 24 hours
        });

        if (!response.ok) {
            // Return empty array instead of throwing - season might not exist
            console.log(`TMDB Season ${seasonNumber} not found (${response.status})`);
            return [];
        }

        const data = await response.json();
        return data.episodes || [];
    } catch (error) {
        console.error(`Error fetching TMDB Season ${seasonNumber}:`, error);
        return []; // Return empty array on any error
    }
}

/**
 * Get TMDB image URL
 * @param path - Image path from TMDB API
 * @param size - Image size (w300, w780, original)
 * @returns Full image URL
 */
export function getTMDBImageUrl(
    path: string | null,
    size: "w300" | "w780" | "original" = "w300"
): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
