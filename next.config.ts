/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.myanimelist.net',
                pathname: '/images/**',
            },
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                pathname: '/t/p/**',
            },
        ],
    },
    eslint: {
        // Ignore ESLint errors during build (for deployment)
        ignoreDuringBuilds: true,
    },
}

export default nextConfig
