import type { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";
import AnimeCardSkeleton from "./AnimeCardSkeleton";

interface AnimeGridProps {
    anime: Anime[];
    loading?: boolean;
}

export default function AnimeGrid({ anime, loading = false }: AnimeGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <AnimeCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (anime.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-2xl text-gray-500">No anime found</p>
                <p className="text-gray-400 mt-2">Try checking back later</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {anime.map((item) => (
                <AnimeCard key={item.mal_id} anime={item} />
            ))}
        </div>
    );
}
