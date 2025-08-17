/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict type checking and linting for production safety
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Experimental features for faster builds
  experimental: {
    turbo: {
      rules: {
        '*.ts': ['ts-loader'],
        '*.tsx': ['ts-loader'],
      },
    },
  },
  // Optimize bundle
  swcMinify: true,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NODE_ENV === 'production' ? 'https://kyb-lite-guevtq6ai-bakkaiahs-projects.vercel.app' : 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  }
};

module.exports = nextConfig;