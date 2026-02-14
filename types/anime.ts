// Anime data types from Jikan API v4
export interface AnimeImage {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
}

export interface AnimeImages {
    jpg: AnimeImage;
    webp: AnimeImage;
}

export interface AnimeGenre {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}

export interface AnimeStudio {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}

export interface Anime {
    mal_id: number;
    url: string;
    images: AnimeImages;
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    type: string;
    episodes: number | null;
    status: string;
    airing: boolean;
    score: number | null;
    scored_by: number | null;
    rank: number | null;
    popularity: number;
    synopsis: string | null;
    season: string | null;
    year: number | null;
    genres: AnimeGenre[];
    studios: AnimeStudio[];
}

export interface JikanResponse<T> {
    data: T;
    pagination?: {
        last_visible_page: number;
        has_next_page: boolean;
        current_page: number;
        items: {
            count: number;
            total: number;
            per_page: number;
        };
    };
}

// TMDB (The Movie Database) Types
export interface TMDBSearchResult {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
}

export interface TMDBEpisode {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string;
    vote_average: number;
    season_number: number;
}

export interface TMDBSeason {
    season_number: number;
    episode_count: number;
    name: string;
    overview: string;
    poster_path: string | null;
}

export interface TMDBShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: TMDBSeason[];
    first_air_date: string;
    vote_average: number;
}

// Enhanced Episode combining Jikan + TMDB data
export interface EnhancedEpisode {
    mal_id: number;
    title: string;
    title_japanese: string | null;
    aired: string | null;
    score: number | null;
    filler: boolean;
    recap: boolean;
    synopsis: string | null;
    // TMDB enhancements
    tmdb_image?: string;
    tmdb_overview?: string;
}

// Season grouping for episode filtering
export interface Season {
    number: number;
    name: string;
    episodeRange: {
        start: number;
        end: number;
    };
}

// Anime Relations (Sequels, Prequels, etc.)
export interface AnimeRelation {
    relation: string; // "Sequel", "Prequel", "Side story", etc.
    entry: Array<{
        mal_id: number;
        type: string;
        name: string;
        url: string;
    }>;
}

// Anime Season for navigation
export interface AnimeSeason {
    mal_id: number;
    title: string;
    type: string; // "Sequel", "Prequel", "Main", etc.
    order: number; // Display order
}
