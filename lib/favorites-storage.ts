/**
 * Favorites Storage Helper
 * Manages anime favorites using localStorage
 */

const FAVORITES_KEY = 'anime_favorites';

export interface FavoriteAnime {
    id: number;
    title: string;
    imageUrl: string;
    addedAt: Date;
}

export class FavoritesStorage {
    /**
     * Get all favorite anime IDs
     */
    static getAll(): number[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(FAVORITES_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Add anime to favorites
     */
    static add(animeId: number): void {
        if (typeof window === 'undefined') return;
        const favorites = this.getAll();
        if (!favorites.includes(animeId)) {
            favorites.push(animeId);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    }

    /**
     * Remove anime from favorites
     */
    static remove(animeId: number): void {
        if (typeof window === 'undefined') return;
        const favorites = this.getAll().filter(id => id !== animeId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }

    /**
     * Check if anime is favorited
     */
    static isFavorite(animeId: number): boolean {
        return this.getAll().includes(animeId);
    }

    /**
     * Toggle favorite status
     * @returns new favorite status (true if now favorited, false if removed)
     */
    static toggle(animeId: number): boolean {
        if (this.isFavorite(animeId)) {
            this.remove(animeId);
            return false;
        } else {
            this.add(animeId);
            return true;
        }
    }

    /**
     * Get count of favorites
     */
    static count(): number {
        return this.getAll().length;
    }

    /**
     * Clear all favorites
     */
    static clear(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(FAVORITES_KEY);
    }
}
