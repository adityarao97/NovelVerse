import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, Tv } from "lucide-react";
import type { Anime } from "@/types/anime";
import { getAnimeTitle, formatScore, getAnimeImageUrl } from "@/lib/jikan";
import FavoriteButton from "./FavoriteButton";

interface AnimeCardProps {
    anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
    const title = getAnimeTitle(anime);
    const imageUrl = getAnimeImageUrl(anime);
    const score = formatScore(anime.score);

    return (
        <Link href={`/anime/${anime.mal_id}`} className="block">
            <div className="group bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1">
                {/* Image Container */}
                <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={false}
                    />

                    {/* Score Badge */}
                    {anime.score && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold shadow-lg">
                            <Star size={14} fill="currentColor" />
                            <span>{score}</span>
                        </div>
                    )}

                    {/* Favorite Button */}
                    <div className="absolute top-2 left-2 z-10">
                        <FavoriteButton animeId={anime.mal_id} size={24} />
                    </div>

                    {/* Airing Badge */}
                    {anime.airing && (
                        <div className="absolute top-12 left-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-lg uppercase">
                            Airing
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-white line-clamp-2 min-h-[3rem] group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>

                    {/* Info Row */}
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                        {anime.type && (
                            <div className="flex items-center gap-1">
                                <Tv size={14} />
                                <span>{anime.type}</span>
                            </div>
                        )}

                        {anime.episodes && <span>• {anime.episodes} eps</span>}

                        {anime.year && (
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{anime.year}</span>
                            </div>
                        )}
                    </div>

                    {/* Genres */}
                    {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {anime.genres.slice(0, 3).map((genre) => (
                                <span
                                    key={genre.mal_id}
                                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Synopsis */}
                    {anime.synopsis && (
                        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                            {anime.synopsis}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
