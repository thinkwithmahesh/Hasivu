/**
 * E2E Test Setup Configuration
 * Enhanced setup for end-to-end testing with Playwright integration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test state
interface GlobalTestState {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  baseUrl: string;
  apiBaseUrl: string;
  testUser: {
    email: string;
    password: string;
    role: string;
  };
}

declare global {
  var testState: GlobalTestState;
}

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.TEST_API_URL || 'http://localhost:3001',
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  timeout: {
    default: 30000,
    navigation: 60000,
    assertion: 10000
  },
  viewport: {
    width: 1280,
    height: 720
  },
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@hasivu.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    role: 'student'
  }
};

beforeAll(async () => {
  console.log('🚀 Setting up E2E test environment...');

  // Launch browser
  global.testState = {
    browser: null,
    context: null,
    page: null,
    baseUrl: TEST_CONFIG.baseUrl,
    apiBaseUrl: TEST_CONFIG.apiBaseUrl,
    testUser: TEST_CONFIG.testUser
  };

  try {
    global.testState.browser = await chromium.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    console.log('✅ Browser launched successfully');

    // Create persistent context
    global.testState.context = await global.testState.browser.newContext({
      viewport: TEST_CONFIG.viewport,
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: './test-results/videos/',
        size: TEST_CONFIG.viewport
      },
      recordHar: {
        path: './test-results/network.har'
      }
    });

    console.log('✅ Browser context created');

  } catch (error) {
    console.error('❌ Failed to setup E2E environment:', error);
    throw error;
  }
}, 60000);

beforeEach(async () => {
  if (!global.testState.context) {
    throw new Error('Browser context not available');
  }

  // Create new page for each test
  global.testState.page = await global.testState.context.newPage();

  // Set up page event listeners
  global.testState.page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  global.testState.page.on('pageerror', error => {
    console.log('Page error:', error instanceof Error ? error.message : String(error));
  });

  // Set default timeouts
  global.testState.page.setDefaultTimeout(TEST_CONFIG.timeout.default);
  global.testState.page.setDefaultNavigationTimeout(TEST_CONFIG.timeout.navigation);
});

afterEach(async () => {
  if (global.testState.page) {
    await global.testState.page.close();
    global.testState.page = null;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    if (global.testState.context) {
      await global.testState.context.close();
    }

    if (global.testState.browser) {
      await global.testState.browser.close();
    }

    console.log('✅ E2E cleanup completed');
  } catch (error) {
    console.error('❌ E2E cleanup failed:', error);
  }
});

// Helper functions for E2E tests
export const e2eHelpers = {
  // Authentication helpers
  async login(email: string = TEST_CONFIG.testUser.email, password: string = TEST_CONFIG.testUser.password) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`);
  },

  async logout() {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/login`);
  },

  // Navigation helpers
  async navigateToPage(path: string) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    await page.goto(`${TEST_CONFIG.baseUrl}${path}`);
    await page.waitForLoadState('networkidle');
  },

  // API helpers
  async makeApiRequest(endpoint: string, options: any = {}) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    return await page.request.fetch(`${TEST_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  },

  // Assertion helpers
  async waitForText(selector: string, text: string, timeout: number = TEST_CONFIG.timeout.assertion) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    await page.waitForSelector(selector, { timeout });
    await page.waitForFunction(
      ({ selector, text }) => {
        const element = document.querySelector(selector);
        return element && element.textContent?.includes(text);
      },
      { selector, text },
      { timeout }
    );
  },

  // Performance helpers
  async measurePageLoadTime(url: string) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();

    return endTime - startTime;
  },

  // Screenshot helpers
  async takeScreenshot(name: string) {
    const {page} = global.testState;
    if (!page) throw new Error('Page not available');

    await page.screenshot({
      path: `./test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }
};

// Export test configuration for use in tests
export { TEST_CONFIG };