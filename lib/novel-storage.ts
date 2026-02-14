/**
 * Database Schema for Generated Novels
 * 
 * This is a simple JSON-based local storage solution.
 * For production, replace with Prisma/Drizzle + PostgreSQL/SQLite
 */

export interface GeneratedNovel {
    id: string;
    animeId: number;
    animeTitle: string;
    episodeIds: number[];
    episodeTitle: string;
    title: string;  // "Anime Name - Episode X: Title"
    content: string;  // Full novel markdown
    htmlContent: string;  // Converted HTML for EPUB
    wordCount: number;
    length: 'short' | 'medium' | 'long';
    generatedAt: Date;
    readingProgress: number;  // 0-100%
    lastReadAt?: Date;
    epubGenerated: boolean;
}

// Local storage keys
export const NOVELS_STORAGE_KEY = 'anime_novels';
export const READING_PROGRESS_KEY = 'novel_progress';

/**
 * Local storage helper for novels
 */
export class NovelStorage {
    static getAll(): GeneratedNovel[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(NOVELS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static getById(id: string): GeneratedNovel | null {
        const novels = this.getAll();
        return novels.find(n => n.id === id) || null;
    }

    static save(novel: GeneratedNovel): void {
        const novels = this.getAll();
        const existingIndex = novels.findIndex(n => n.id === novel.id);

        if (existingIndex >= 0) {
            novels[existingIndex] = novel;
        } else {
            novels.push(novel);
        }

        localStorage.setItem(NOVELS_STORAGE_KEY, JSON.stringify(novels));
    }

    static delete(id: string): void {
        const novels = this.getAll().filter(n => n.id !== id);
        localStorage.setItem(NOVELS_STORAGE_KEY, JSON.stringify(novels));
    }

    static updateProgress(id: string, progress: number): void {
        const novel = this.getById(id);
        if (novel) {
            novel.readingProgress = progress;
            novel.lastReadAt = new Date();
            this.save(novel);
        }
    }
}
