import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize chunk loading and prevent chunk errors
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  // Configure image domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
  // Production output configuration
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
