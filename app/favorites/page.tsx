"use client";

import { useState, useEffect } from 'react';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import { FavoritesStorage } from '@/lib/favorites-storage';
import { getAnimeById } from '@/lib/jikan';
import Link from 'next/link';
import type { Anime } from '@/types/anime';
import AnimeGrid from '@/components/AnimeGrid';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Anime[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setIsLoading(true);
        setError(false);

        try {
            const favoriteIds = FavoritesStorage.getAll();

            if (favoriteIds.length === 0) {
                setFavorites([]);
                setIsLoading(false);
                return;
            }

            // Fetch anime details for each favorite
            const animePromises = favoriteIds.map(id => getAnimeById(id));
            const animeData = await Promise.all(animePromises);

            setFavorites(animeData);
        } catch (err) {
            console.error('Error loading favorites:', err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Heart className="w-10 h-10 text-red-500 fill-red-500" />
                        My Favorites
                    </h1>
                    <p className="text-gray-400">
                        Your collection of favorite anime
                    </p>
                </div>

                {/* Stats */}
                {!isLoading && favorites.length > 0 && (
                    <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg p-4 inline-block">
                        <div className="flex items-center gap-3">
                            <Heart className="w-6 h-6 text-red-500" />
                            <div>
                                <div className="text-2xl font-bold">{favorites.length}</div>
                                <div className="text-sm text-gray-400">
                                    Favorite{favorites.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                        <p className="text-gray-400">Loading your favorites...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                            Error loading favorites
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Please try again later
                        </p>
                        <button
                            onClick={loadFavorites}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && favorites.length === 0 && (
                    <div className="text-center py-16">
                        <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                            No favorites yet
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Start adding anime to your favorites by clicking the heart icon
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
                        >
                            <span>Browse Anime</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}

                {/* Favorites Grid */}
                {!isLoading && !error && favorites.length > 0 && (
                    <AnimeGrid anime={favorites} />
                )}
            </div>
        </main>
    );
}
