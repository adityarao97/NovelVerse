"use client";

import { useState } from "react";
import type { EnhancedEpisode, Season } from "@/types/anime";
import EpisodeCard from "./EpisodeCard";
import SeasonSelector from "./SeasonSelector";
import NovelGenerator from "./NovelGenerator";

interface EpisodeListProps {
    episodes: EnhancedEpisode[];
    seasons: Season[];
    animeImage: string;
    animeId: number;
    animeTitle: string;
}

export default function EpisodeList({
    episodes,
    seasons,
    animeImage,
    animeId,
    animeTitle,
}: EpisodeListProps) {
    const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

    // Filter episodes by selected season
    const filteredEpisodes = selectedSeason
        ? episodes.filter((ep) => {
            const season = seasons.find((s) => s.number === selectedSeason);
            if (!season) return false;
            return (
                ep.mal_id >= season.episodeRange.start &&
                ep.mal_id <= season.episodeRange.end
            );
        })
        : episodes;

    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Episodes</h2>

                {/* Novel Generator Button */}
                <NovelGenerator
                    animeId={animeId}
                    animeTitle={animeTitle}
                    episodes={filteredEpisodes}
                />
            </div>

            {/* Season Selector */}
            {seasons.length > 1 && (
                <SeasonSelector
                    seasons={seasons}
                    selected={selectedSeason}
                    onChange={setSelectedSeason}
                />
            )}

            {/* Episodes Grid */}
            {filteredEpisodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEpisodes.map((episode) => (
                        <EpisodeCard
                            key={episode.mal_id}
                            episode={episode}
                            animeImage={animeImage}
                            animeId={animeId}
                            animeTitle={animeTitle}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-2xl text-gray-500">No episodes available</p>
                </div>
            )}
        </div>
    );
}
