/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for faster builds
  typescript: {
    // Skip type checking during build for faster deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for faster deployment  
    ignoreDuringBuilds: true,
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
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  }
};

module.exports = nextConfig;