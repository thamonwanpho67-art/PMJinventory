import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize chunk loading and prevent chunk errors
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  // Configure image domains if needed
  images: {
    domains: ['localhost', 'pmj-inventory.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Production output configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
