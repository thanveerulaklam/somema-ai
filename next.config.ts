import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure images
  images: {
    domains: ['localhost', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    ],
  },
  
  // Configure webpack for Fabric.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Vercel optimizations
  serverExternalPackages: ['sharp'],
  
  // Ensure proper output for Vercel
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
