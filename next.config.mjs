/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true,
    },
    allowedDevOrigins: ['f8a4-210-103-76-249.ngrok-free.app'],
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
