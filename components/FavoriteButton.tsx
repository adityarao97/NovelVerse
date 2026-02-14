"use client";

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { FavoritesStorage } from '@/lib/favorites-storage';

interface FavoriteButtonProps {
    animeId: number;
    size?: number;
    className?: string;
}

export default function FavoriteButton({ animeId, size = 20, className = '' }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsFavorite(FavoritesStorage.isFavorite(animeId));
    }, [animeId]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Don't navigate if inside Link
        e.stopPropagation(); // Don't trigger parent click handlers

        // Toggle favorite
        const newState = FavoritesStorage.toggle(animeId);
        setIsFavorite(newState);

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Don't render until mounted to prevent hydration errors
    if (!mounted) {
        return (
            <button
                className={`transition-all ${className}`}
                disabled
                aria-label="Loading favorite status"
            >
                <Heart
                    size={size}
                    className="text-gray-600"
                    fill="none"
                />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`transition-all hover:scale-110 ${isAnimating ? 'animate-pulse scale-125' : ''} ${className}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                size={size}
                className={`transition-all ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`}
                fill={isFavorite ? 'currentColor' : 'none'}
            />
        </button>
    );
}
