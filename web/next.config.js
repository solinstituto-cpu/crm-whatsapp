/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'crm-drm-nuyq.vercel.app'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    API_URL: process.env.API_URL,
  },
}

module.exports = nextConfig

