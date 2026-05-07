import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.your-cdn.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/:path*`,
      },
    ]
  },
}

export default nextConfig
