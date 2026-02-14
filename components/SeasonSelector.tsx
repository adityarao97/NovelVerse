"use client";

import { useState } from "react";
import type { Season } from "@/types/anime";

interface SeasonSelectorProps {
    seasons: Season[];
    selected: number | null;
    onChange: (season: number | null) => void;
}

export default function SeasonSelector({
    seasons,
    selected,
    onChange,
}: SeasonSelectorProps) {
    return (
        <div className="mb-6">
            {/* Desktop: Tabs */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => onChange(null)}
                    className={`season-tab px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${selected === null
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                >
                    All Episodes
                </button>
                {seasons.map((season) => (
                    <button
                        key={season.number}
                        onClick={() => onChange(season.number)}
                        className={`season-tab px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${selected === season.number
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                    >
                        <span>{season.name}</span>
                        <span className="text-sm ml-2 opacity-75">
                            ({season.episodeRange.start}-{season.episodeRange.end})
                        </span>
                    </button>
                ))}
            </div>

            {/* Mobile: Dropdown */}
            <div className="md:hidden">
                <select
                    value={selected === null ? "all" : selected}
                    onChange={(e) =>
                        onChange(e.target.value === "all" ? null : parseInt(e.target.value))
                    }
                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Episodes</option>
                    {seasons.map((season) => (
                        <option key={season.number} value={season.number}>
                            {season.name} (Episodes {season.episodeRange.start}-
                            {season.episodeRange.end})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
