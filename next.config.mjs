/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable linting during production builds on Vercel to prevent config incompat errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

export default nextConfig
