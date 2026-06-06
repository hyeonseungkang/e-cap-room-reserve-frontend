/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    async rewrites() {
        return [
            {
                source: '/api/proxy/:path*',
                destination: `${process.env.BACKEND_URL}/:path*`,
            },
        ]
    },
}

export default nextConfig
