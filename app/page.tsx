"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import AnimeGrid from "@/components/AnimeGrid";
import { getSeasonalAnime, searchAnime } from "@/lib/jikan";
import { AlertCircle, Search, X, Loader2 } from "lucide-react";
import type { Anime } from "@/types/anime";

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function Home() {
    const [latestAnime, setLatestAnime] = useState<Anime[]>([]);
    const [searchResults, setSearchResults] = useState<Anime[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load latest anime on mount
    useEffect(() => {
        getSeasonalAnime(24)
            .then(setLatestAnime)
            .catch(() => setError(true))
            .finally(() => setIsLoading(false));
    }, []);

    // Debounced search function
    const debouncedSearch = useMemo(
        () => debounce(async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const results = await searchAnime(query);
                setSearchResults(results);
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    // Handle search input change
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (value.trim()) {
            setIsSearching(true);
        }
        debouncedSearch(value);
    }, [debouncedSearch]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    }, []);

    // Determine which anime to display
    const displayAnime = searchQuery.trim() ? searchResults : latestAnime;
    const isShowingSearch = searchQuery.trim().length > 0;

    if (error) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <AlertCircle className="text-red-500 mb-4" size={48} />
                        <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Anime</h2>
                        <p className="text-gray-400">
                            Unable to fetch anime data. Please try again later.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        {isShowingSearch ? 'Search Results' : 'Latest Anime This Season'}
                    </h1>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search for anime by name..."
                            className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Info */}
                    {isShowingSearch && (
                        <div className="mt-3 text-gray-400 text-sm">
                            {isSearching ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Searching...</span>
                                </div>
                            ) : (
                                <span>
                                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                                </span>
                            )}
                        </div>
                    )}

                    {!isShowingSearch && (
                        <p className="mt-3 text-lg text-gray-400">
                            Discover the newest and most popular anime airing right now
                        </p>
                    )}
                </div>

                {/* Anime Grid or Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : displayAnime.length > 0 ? (
                    <AnimeGrid anime={displayAnime} />
                ) : isShowingSearch ? (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                            No anime found
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Try a different search term
                        </p>
                        <button
                            onClick={clearSearch}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
                        >
                            Browse Latest Anime
                        </button>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
