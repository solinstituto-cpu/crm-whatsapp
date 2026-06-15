/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "your-nextauth-secret-key-here-change-in-production",
    // When NEXT_PUBLIC_API_URL is not set (e.g. on Vercel), default to empty string
    // so API calls use relative paths that go through the rewrite proxy
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
  },
  async rewrites() {
    // Backend URL for server-side proxy
    // On Vercel: always use the correct Render API service (crm-api-laxv)
    // Locally: use API_URL env var or localhost
    const backendUrl = process.env.VERCEL
      ? 'https://crm-api-laxv.onrender.com'
      : (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    console.log('[next.config] Rewrite proxy -> ', backendUrl)
    return {
      // NextAuth API routes are handled by Next.js (takes priority over rewrites)
      // All other /api/* calls are proxied to the Render backend
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    }
  },
}

module.exports = nextConfig