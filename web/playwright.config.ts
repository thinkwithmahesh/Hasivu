import { defineConfig, devices } from '@playwright/test';

/**
 * HASIVU Enterprise Playwright Testing Framework
 * 🚀 Cutting-edge automation framework for school meal management system
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * 🏗️ Enterprise Features: Multi-role testing, RFID workflows, visual regression
 * 📱 Mobile-First: Responsive testing with accessibility validation (WCAG AA)
 * ⚡ Performance: Core Web Vitals monitoring with Percy integration
 * 🔒 Security: Role-based test scenarios for 7 user types
 * 📊 Analytics: Comprehensive reporting with CI/CD pipeline integration
 */

export default defineConfig({
  // Test directory structure
  testDir: './tests',

  // Global test settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Use 4 workers for parallel execution in local development

  // Enterprise reporter configuration with comprehensive analytics
  reporter: [
    [
      'html',
      {
        outputDir: 'test-results/html-report',
        open: 'never',
        attachmentsBaseURL: process.env.PLAYWRIGHT_ATTACHMENTS_URL,
      },
    ],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['blob', { outputDir: 'test-results/blob-report' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',

  // Enterprise global test configuration
  use: {
    // Base URL for all tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Browser settings optimized for enterprise testing
    headless: !!process.env.CI,
    ignoreHTTPSErrors: true,

    // Enhanced screenshot and video settings for debugging
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },
    trace: 'retain-on-failure',

    // Responsive viewport settings (mobile-first approach)
    viewport: { width: 1280, height: 720 },

    // Performance-optimized timing settings
    actionTimeout: 15000,
    navigationTimeout: 45000,
    expect: { timeout: 10000 },

    // Bangalore/Karnataka localization
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',

    // Enhanced test selectors for enterprise applications
    testIdAttribute: 'data-testid',

    // Brand color constants available in tests
    colorScheme: 'light',

    // Enterprise security headers
    extraHTTPHeaders: {
      'X-Test-Environment': 'playwright',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  },

  // Project configurations for different test scenarios
  projects: [
    // Desktop Chrome - Primary testing browser
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        channel: 'chrome',
      },
      testDir: './tests/e2e',
      testMatch: ['**/*.spec.ts', '**/*.test.ts'],
      dependencies: [],
    },

    // Desktop Firefox - Cross-browser compatibility
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      testDir: './tests/e2e',
      testMatch: ['**/*.spec.ts'],
    },

    // Desktop Safari - WebKit testing
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      testDir: './tests/e2e',
      testMatch: ['**/*.spec.ts'],
    },

    // Mobile Chrome - Primary mobile testing
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'], // Popular Android device in India
      },
      testDir: './tests/mobile',
      testMatch: ['**/*.mobile.spec.ts'],
    },

    // iPhone - iOS testing for broader compatibility
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'], // Common iPhone model
      },
      testDir: './tests/mobile',
      testMatch: ['**/*.mobile.spec.ts'],
    },

    // Visual Regression Testing with Percy Integration
    {
      name: 'Visual Regression',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }, // High resolution for visual tests
        // Brand-consistent visual testing
        colorScheme: 'light',
        // Percy integration settings
        launchOptions: {
          args: ['--force-color-profile=srgb', '--disable-web-security', '--disable-dev-shm-usage'],
        },
      },
      testDir: './tests/visual',
      testMatch: ['**/*.visual.spec.ts'],
      dependencies: [],
      metadata: {
        brandColors: {
          primary: '#2563eb', // Vibrant Blue
          secondary: '#16a34a', // Deep Green
          accent: '#dc2626', // Error Red
          warning: '#f59e0b', // Warning Amber
        },
      },
    },

    // Performance Testing with Core Web Vitals
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        // Performance testing with Core Web Vitals monitoring
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-precise-memory-info',
            '--memory-pressure-off',
          ],
        },
        // Performance budgets for enterprise applications
        navigationTimeout: 10000, // 10s max page load
        actionTimeout: 5000, // 5s max action timeout
      },
      testDir: './tests/performance',
      testMatch: ['**/*.performance.spec.ts'],
      metadata: {
        coreWebVitals: {
          LCP: 2500, // Largest Contentful Paint < 2.5s
          FID: 100, // First Input Delay < 100ms
          CLS: 0.1, // Cumulative Layout Shift < 0.1
        },
      },
    },

    // Accessibility Testing (WCAG AA Compliance)
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // WCAG AA compliance testing settings
        extraHTTPHeaders: {
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
        // Accessibility-focused browser settings
        launchOptions: {
          args: ['--force-prefers-reduced-motion', '--enable-experimental-accessibility-features'],
        },
        // High contrast mode testing
        forcedColors: 'active',
      },
      testDir: './tests/accessibility',
      testMatch: ['**/*.accessibility.spec.ts'],
      metadata: {
        wcagLevel: 'AA',
        compliance: {
          colorContrast: 4.5, // WCAG AA contrast ratio
          keyboardNavigation: true,
          screenReader: true,
          focusManagement: true,
        },
      },
    },

    // API Testing (for backend integration)
    {
      name: 'API',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3001/api',
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      testDir: './tests/api',
      testMatch: ['**/*.api.spec.ts'],
    },

    // RFID Simulation Tests
    {
      name: 'RFID Workflow',
      use: {
        ...devices['Desktop Chrome'],
        // RFID specific settings
        permissions: ['camera'], // For QR code scanning simulation
      },
      testDir: './tests/rfid',
      testMatch: ['**/*.rfid.spec.ts'],
    },

    // Multi-language Testing
    {
      name: 'Hindi Localization',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'hi-IN',
        extraHTTPHeaders: {
          'Accept-Language': 'hi,en;q=0.9',
        },
      },
      testDir: './tests/localization',
      testMatch: ['**/*.l10n.spec.ts'],
    },

    // Network Resilience Testing
    {
      name: 'Network Conditions',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate different network conditions
        launchOptions: {
          args: ['--disable-web-security', '--throttling=3G'],
        },
      },
      testDir: './tests/network',
      testMatch: ['**/*.network.spec.ts'],
    },
  ],

  // Enterprise web server configuration - enable during local/dev runs
  webServer: process.env.CI
    ? undefined
    : [
        {
          command:
            'NODE_ENV=test NEXT_PUBLIC_API_BASE_URL=http://localhost:3002/api next dev -p 3002',
          url: 'http://localhost:3002',
          reuseExistingServer: true,
          timeout: 180000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      ],

  // Expect configuration for assertions
  expect: {
    // Screenshot comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: { animations: 'disabled' },
    // Visual comparison settings
    toMatchSnapshot: { threshold: 0.3 },
  },

  // Enterprise global setup and teardown
  globalSetup: require.resolve('./tests/config/global-setup.ts'),
  globalTeardown: require.resolve('./tests/config/global-teardown.ts'),

  // Enterprise test metadata
  metadata: {
    framework: 'HASIVU Enterprise Playwright Framework v2.0',
    brandColors: {
      primary: '#2563eb',
      secondary: '#16a34a',
      accent: '#dc2626',
      warning: '#f59e0b',
    },
    testEnvironment: {
      ci: !!process.env.CI,
      baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002',
      apiUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
    },
  },
});
