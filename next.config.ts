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
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Add error handling for build process
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Add environment-specific handling
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },

  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add experimental features for better build stability
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Add output configuration for better Vercel compatibility
  // output: 'standalone', // Commented out as it might cause Vercel build issues
  
  // Add trailing slash for better routing
  trailingSlash: false,
  
  // Add powered by header
  poweredByHeader: false,
  
  // Add security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: isDev 
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.replicate.com https://api.remove.bg https://api.canva.com https://graph.facebook.com https://api.razorpay.com https://*.razorpay.com https://*.supabase.co https://ipapi.co https://ipinfo.io; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://*.razorpay.com; object-src 'none'; base-uri 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
