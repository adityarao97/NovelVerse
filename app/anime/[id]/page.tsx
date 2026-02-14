import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, Calendar, Tv, TrendingUp } from "lucide-react";
import {
    getAnimeById,
    getAnimeEpisodes,
    getEnhancedEpisodes,
    generateSeasons,
    getAnimeImageUrl,
    getAnimeTitle,
    formatScore,
    getAnimeRelations,
    buildSeasonList,
    getAnimeImages,
} from "@/lib/jikan";
import EpisodeList from "@/components/EpisodeList";
import AnimeSeasonSelector from "@/components/AnimeSeasonSelector";

interface AnimeDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
        notFound();
    }

    let anime, jikanEpisodes, episodes, relations, animeSeasons, animeImages;

    try {
        // Fetch anime details, episodes, and relations
        [anime, jikanEpisodes, relations] = await Promise.all([
            getAnimeById(animeId),
            getAnimeEpisodes(animeId),
            getAnimeRelations(animeId),
        ]);

        // Enhance episodes with TMDB data and get high-res images in parallel
        [episodes, animeImages] = await Promise.all([
            getEnhancedEpisodes(anime, jikanEpisodes),
            getAnimeImages(anime),
        ]);

        // Build season list for navigation
        animeSeasons = await buildSeasonList(anime, relations);
    } catch (error) {
        console.error("Error fetching anime details:", error);
        notFound();
    }

    const title = getAnimeTitle(anime);
    const score = formatScore(anime.score);
    const seasons = generateSeasons(episodes.length);

    return (
        <main className="min-h-screen">
            {/* Hero Section with Background */}
            <div className="relative h-[400px] md:h-[500px]">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={animeImages.backdrop}
                        alt={title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative h-full max-w-7xl mx-auto px-8 flex items-end pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center w-full">
                        {/* Poster */}
                        <div className="relative w-48 h-72 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
                            <Image
                                src={animeImages.poster}
                                alt={title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                                {title}
                            </h1>

                            {anime.title_japanese && (
                                <p className="text-xl text-gray-300">{anime.title_japanese}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-white">
                                {anime.score && (
                                    <div className="flex items-center gap-2 bg-blue-600 px-3 py-1.5 rounded-md">
                                        <Star size={18} fill="currentColor" />
                                        <span className="font-bold">{score}</span>
                                    </div>
                                )}

                                {anime.rank && (
                                    <div className="flex items-center gap-2 bg-purple-600 px-3 py-1.5 rounded-md">
                                        <TrendingUp size={18} />
                                        <span className="font-semibold">#{anime.rank}</span>
                                    </div>
                                )}

                                {anime.type && (
                                    <div className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-md">
                                        <Tv size={18} />
                                        <span>{anime.type}</span>
                                    </div>
                                )}

                                {anime.episodes && (
                                    <span className="text-gray-300">{anime.episodes} Episodes</span>
                                )}

                                {anime.status && (
                                    <span className="text-gray-300">{anime.status}</span>
                                )}
                            </div>

                            {/* Genres */}
                            {anime.genres && anime.genres.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {anime.genres.map((genre) => (
                                        <span
                                            key={genre.mal_id}
                                            className="px-3 py-1 bg-gray-800/80 text-gray-200 rounded-full text-sm"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Season Navigation */}
                {animeSeasons && animeSeasons.length > 1 && (
                    <AnimeSeasonSelector
                        seasons={animeSeasons}
                        currentAnimeId={animeId}
                    />
                )}

                {/* Synopsis */}
                {anime.synopsis && (
                    <section>
                        <h2 className="text-3xl font-bold mb-4 text-white">Synopsis</h2>
                        <p className="text-lg text-gray-300 leading-relaxed">
                            {anime.synopsis}
                        </p>
                    </section>
                )}

                {/* Additional Info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {anime.studios && anime.studios.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 text-white">Studios</h3>
                            <p className="text-gray-300">
                                {anime.studios.map((s) => s.name).join(", ")}
                            </p>
                        </div>
                    )}

                    {(anime.season || anime.year) && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 text-white">Aired</h3>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Calendar size={18} />
                                <span>
                                    {anime.season && anime.season.charAt(0).toUpperCase() + anime.season.slice(1)}
                                    {anime.year && ` ${anime.year}`}
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Episodes */}
                {episodes.length > 0 && (
                    <EpisodeList
                        episodes={episodes}
                        seasons={seasons}
                        animeImage={animeImages.poster}
                        animeId={animeId}
                        animeTitle={title}
                    />
                )}
            </div>
        </main>
    );
}
