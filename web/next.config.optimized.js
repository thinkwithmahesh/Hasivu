/**
 * Optimized Next.js Configuration
 * Performance-focused configuration for HASIVU Platform
 *
 * Key Optimizations:
 * - Bundle analyzer integration
 * - PWA support with strategic caching
 * - Advanced webpack splitting
 * - CSS optimization
 * - Package import optimization
 * - Production console removal
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Cache menu API responses
    {
      urlPattern: /^https:\/\/api\.hasivu\.com\/menu/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'menu-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache static menu images
    {
      urlPattern: /^https:\/\/(cdn\.hasivu\.com|hasivu\.com)\/.*\.(png|jpg|jpeg|webp|avif)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        },
      },
    },
    // Network-first for other API calls
    {
      urlPattern: /^https:\/\/api\.hasivu\.com\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60, // 1 minute
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Performance optimizations
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Experimental features for performance
  experimental: {
    // Enable CSS optimization
    optimizeCss: true,

    // Optimize package imports - reduces bundle size by tree-shaking
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dropdown-menu',
      'date-fns',
    ],
  },

  // Image optimization
  images: {
    domains: ['localhost', 'hasivu.com', 'cdn.hasivu.com'],
    formats: ['image/avif', 'image/webp'], // Modern formats first
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Compression (gzip + brotli)
  compress: true,

  // Output configuration - smaller Docker images
  output: 'standalone',

  // Security headers
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Trailing slash handling
  trailingSlash: false,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Advanced webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Tree-shaking optimization
    config.optimization.usedExports = true;

    // Only apply advanced optimizations in production client-side builds
    if (!isServer && !dev) {
      // Advanced chunk splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Disable default groups
          default: false,
          vendors: false,

          // React + React-DOM in separate chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react',
            priority: 20,
            reuseExistingChunk: true,
          },

          // UI libraries (Radix UI)
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'ui',
            priority: 15,
            reuseExistingChunk: true,
          },

          // Form libraries
          forms: {
            test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
            name: 'forms',
            priority: 12,
            reuseExistingChunk: true,
          },

          // Vendor chunk for other libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },

          // Commons chunk for shared app components
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Minimize bundle size
      config.optimization.minimize = true;
    }

    return config;
  },

  // Production-ready security headers and CSP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' data: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "connect-src 'self' https://api.hasivu.com https://api.razorpay.com https://www.google-analytics.com wss:",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      // Static assets - aggressive caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images - medium-term caching
      {
        source: '/:path*.{jpg,jpeg,png,webp,avif,gif,svg,ico}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // API routes - no caching
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard/admin',
        permanent: true,
      },
    ];
  },

  // API rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
};

// Apply plugins in order
module.exports = withPWA(withBundleAnalyzer(nextConfig));
