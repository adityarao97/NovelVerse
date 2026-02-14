export default function Loading() {
    return (
        <main className="min-h-screen">
            {/* Hero Skeleton */}
            <div className="relative h-[400px] md:h-[500px] bg-gray-900 animate-pulse">
                <div className="relative h-full max-w-7xl mx-auto px-8 flex items-end pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-end md:items-center w-full">
                        {/* Poster Skeleton */}
                        <div className="w-48 h-72 bg-gray-800 rounded-lg" />

                        {/* Info Skeleton */}
                        <div className="flex-1 space-y-3">
                            <div className="h-12 bg-gray-800 rounded w-3/4" />
                            <div className="h-6 bg-gray-800 rounded w-1/2" />
                            <div className="flex gap-3">
                                <div className="h-8 w-20 bg-gray-800 rounded" />
                                <div className="h-8 w-20 bg-gray-800 rounded" />
                                <div className="h-8 w-24 bg-gray-800 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
                {/* Synopsis Skeleton */}
                <div className="space-y-4">
                    <div className="h-8 bg-gray-800 rounded w-32 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-800 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse" />
                    </div>
                </div>

                {/* Episodes Skeleton */}
                <div>
                    <div className="h-8 bg-gray-800 rounded w-40 mb-6 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                                <div className="aspect-video bg-gray-900" />
                                <div className="p-4 space-y-2">
                                    <div className="h-6 bg-gray-900 rounded w-3/4" />
                                    <div className="h-4 bg-gray-900 rounded w-1/2" />
                                    <div className="h-4 bg-gray-900 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
