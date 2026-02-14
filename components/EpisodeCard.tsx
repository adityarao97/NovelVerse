import Image from "next/image";
import { Calendar, Star } from "lucide-react";
import type { EnhancedEpisode } from "@/types/anime";
import NovelGenerator from "./NovelGenerator";

interface EpisodeCardProps {
    episode: EnhancedEpisode;
    animeImage: string;
    animeId: number;
    animeTitle: string;
}

export default function EpisodeCard({ episode, animeImage, animeId, animeTitle }: EpisodeCardProps) {
    const imageUrl = episode.tmdb_image || animeImage;
    const description = episode.tmdb_overview || episode.synopsis || "No description available.";

    return (
        <div className="group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300">
            {/* Episode Image */}
            <div className="relative aspect-video overflow-hidden bg-gray-900">
                <Image
                    src={imageUrl}
                    alt={episode.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Episode Number Badge */}
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-md font-bold text-sm shadow-lg">
                    Episode {episode.mal_id}
                </div>

                {/* Filler/Recap Badges */}
                {episode.filler && (
                    <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        FILLER
                    </div>
                )}
                {episode.recap && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                        RECAP
                    </div>
                )}

                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
            </div>

            {/* Episode Content */}
            <div className="p-4 space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-white line-clamp-2 min-h-[3rem] group-hover:text-blue-400 transition-colors">
                    {episode.title}
                </h3>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    {episode.aired && (
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date(episode.aired).toLocaleDateString()}</span>
                        </div>
                    )}

                    {episode.score && (
                        <div className="flex items-center gap-1">
                            <Star size={14} fill="currentColor" className="text-yellow-500" />
                            <span>{episode.score.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                    {description}
                </p>

                {/* Generate Novel Button */}
                <div className="pt-2">
                    <NovelGenerator
                        animeId={animeId}
                        animeTitle={animeTitle}
                        episodes={[episode]}
                    />
                </div>
            </div>
        </div>
    );
}
