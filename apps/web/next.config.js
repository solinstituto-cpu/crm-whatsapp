/** @type {import('next').NextConfig} */

// URL do backend correto no Render
const RENDER_API_URL = 'https://crm-drm.onrender.com'

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
    // On Vercel: MUST be empty so frontend uses relative paths (/api/*)
    // which go through the Vercel proxy to the Render backend.
    // Direct cross-origin calls break authentication (401).
    NEXT_PUBLIC_API_URL: process.env.VERCEL ? '' : (process.env.NEXT_PUBLIC_API_URL || ''),
  },
  async rewrites() {
    // Rewrite proxy for local development and fallback
    const backendUrl = process.env.VERCEL
      ? RENDER_API_URL
      : (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    return {
      // NextAuth API routes are handled by Next.js (takes priority over rewrites)
      // All other /api/* calls are proxied to the backend
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