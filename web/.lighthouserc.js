/**
 * Lighthouse CI Configuration
 *
 * Automated performance testing for HASIVU Platform
 * Tests menu page and checkout flow for Core Web Vitals
 *
 * Usage:
 * - npm run lhci:collect  (collect metrics)
 * - npm run lhci:assert   (assert against thresholds)
 * - npm run lhci          (run both)
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/menu',
        'http://localhost:3000/checkout',
      ],

      // Run multiple times and take median
      numberOfRuns: 3,

      // Start development server before testing
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,

      // Chromium settings
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },

    assert: {
      preset: 'lighthouse:recommended',

      assertions: {
        // Performance category - must score 90+
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals - strict thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        interactive: ['error', { maxNumericValue: 3800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }], // 2MB
        'resource-summary:font:count': ['warn', { maxNumericValue: 4 }],
        'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 2 }],
        'resource-summary:third-party:count': ['warn', { maxNumericValue: 5 }],

        // Image optimization
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'offscreen-images': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],

        // JavaScript optimizations
        'unused-javascript': ['warn', { maxNumericValue: 100000 }], // 100KB max unused
        'unminified-javascript': 'off',
        'legacy-javascript': ['warn', { maxNumericValue: 0 }],
        'duplicated-javascript': 'off',

        // Network optimizations
        'uses-long-cache-ttl': ['warn', { minScore: 0.8 }],
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'off',
        'uses-rel-preload': 'off',

        // Rendering optimizations
        'bootup-time': ['warn', { maxNumericValue: 2500 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 3000 }],
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],

        // Best practices
        'errors-in-console': 'off', // Allow console errors in dev
        'valid-source-maps': 'off',
        'no-vulnerable-libraries': ['error', { minScore: 1 }],

        // PWA (warnings only)
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',

        // Accessibility (strict)
        'color-contrast': ['warn', { minScore: 0.9 }],
        'tap-targets': ['warn', { minScore: 0.9 }],
        'meta-viewport': 'error',
      },
    },

    upload: {
      // Store results temporarily
      target: 'temporary-public-storage',

      // Optional: Upload to Lighthouse CI server
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,

      // Optional: GitHub integration
      // githubToken: process.env.LHCI_GITHUB_APP_TOKEN,
      // githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
    },

    server: {
      // Optional: Local Lighthouse CI server configuration
      // port: 9001,
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDatabasePath: './lhci.db',
      // },
    },
  },
};
