"use client";

import { useRouter } from "next/navigation";
import type { AnimeSeason } from "@/types/anime";

interface AnimeSeasonSelectorProps {
    seasons: AnimeSeason[];
    currentAnimeId: number;
}

export default function AnimeSeasonSelector({
    seasons,
    currentAnimeId,
}: AnimeSeasonSelectorProps) {
    const router = useRouter();

    if (seasons.length <= 1) {
        return null; // Don't show if only one season
    }

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        if (selectedId !== currentAnimeId) {
            router.push(`/anime/${selectedId}`);
        }
    };

    return (
        <div className="mb-6">
            <label htmlFor="anime-season-select" className="block text-sm font-medium text-gray-400 mb-2">
                Select Season / Series
            </label>

            <select
                id="anime-season-select"
                value={currentAnimeId}
                onChange={handleChange}
                className="w-full md:w-auto md:min-w-[400px] px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-750 transition-colors"
            >
                {seasons.map((season, idx) => (
                    <option key={season.mal_id} value={season.mal_id}>
                        {idx + 1}. {season.title}
                    </option>
                ))}
            </select>
        </div>
    );
}
