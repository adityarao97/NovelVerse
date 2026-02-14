export default function AnimeCardSkeleton() {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-[2/3] bg-gray-700" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title skeleton */}
                <div className="h-5 bg-gray-700 rounded w-3/4" />

                {/* Info row skeleton */}
                <div className="flex items-center gap-3">
                    <div className="h-4 bg-gray-700 rounded w-16" />
                    <div className="h-4 bg-gray-700 rounded w-20" />
                </div>

                {/* Synopsis skeleton */}
                <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-700 rounded w-5/6" />
                </div>
            </div>
        </div>
    );
}
