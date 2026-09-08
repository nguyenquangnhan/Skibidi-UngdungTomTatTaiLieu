/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Allow react-force-graph-2d (canvas-based)
  transpilePackages: [],
}

module.exports = nextConfig
