import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  env: {
    // Set at build time based on whether Google OAuth is configured
    NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'true' : 'false',
  },
}

export default nextConfig
