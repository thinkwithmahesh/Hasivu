"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONFIG = exports.e2eHelpers = void 0;
const globals_1 = require("@jest/globals");
const playwright_1 = require("playwright");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
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
exports.TEST_CONFIG = TEST_CONFIG;
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Setting up E2E test environment...');
    global.testState = {
        browser: null,
        context: null,
        page: null,
        baseUrl: TEST_CONFIG.baseUrl,
        apiBaseUrl: TEST_CONFIG.apiBaseUrl,
        testUser: TEST_CONFIG.testUser
    };
    try {
        global.testState.browser = await playwright_1.chromium.launch({
            headless: TEST_CONFIG.headless,
            slowMo: TEST_CONFIG.slowMo,
            args: [
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        console.log('✅ Browser launched successfully');
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
    }
    catch (error) {
        console.error('❌ Failed to setup E2E environment:', error);
        throw error;
    }
}, 60000);
(0, globals_1.beforeEach)(async () => {
    if (!global.testState.context) {
        throw new Error('Browser context not available');
    }
    global.testState.page = await global.testState.context.newPage();
    global.testState.page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('Browser console error:', msg.text());
        }
    });
    global.testState.page.on('pageerror', error => {
        console.log('Page error:', error instanceof Error ? error.message : String(error));
    });
    global.testState.page.setDefaultTimeout(TEST_CONFIG.timeout.default);
    global.testState.page.setDefaultNavigationTimeout(TEST_CONFIG.timeout.navigation);
});
(0, globals_1.afterEach)(async () => {
    if (global.testState.page) {
        await global.testState.page.close();
        global.testState.page = null;
    }
});
(0, globals_1.afterAll)(async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    try {
        if (global.testState.context) {
            await global.testState.context.close();
        }
        if (global.testState.browser) {
            await global.testState.browser.close();
        }
        console.log('✅ E2E cleanup completed');
    }
    catch (error) {
        console.error('❌ E2E cleanup failed:', error);
    }
});
exports.e2eHelpers = {
    async login(email = TEST_CONFIG.testUser.email, password = TEST_CONFIG.testUser.password) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        await page.goto(`${TEST_CONFIG.baseUrl}/login`);
        await page.fill('[data-testid="email-input"]', email);
        await page.fill('[data-testid="password-input"]', password);
        await page.click('[data-testid="login-button"]');
        await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`);
    },
    async logout() {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');
        await page.waitForURL(`${TEST_CONFIG.baseUrl}/login`);
    },
    async navigateToPage(path) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        await page.goto(`${TEST_CONFIG.baseUrl}${path}`);
        await page.waitForLoadState('networkidle');
    },
    async makeApiRequest(endpoint, options = {}) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        return await page.request.fetch(`${TEST_CONFIG.apiBaseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    },
    async waitForText(selector, text, timeout = TEST_CONFIG.timeout.assertion) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        await page.waitForSelector(selector, { timeout });
        await page.waitForFunction(({ selector, text }) => {
            const element = document.querySelector(selector);
            return element && element.textContent?.includes(text);
        }, { selector, text }, { timeout });
    },
    async measurePageLoadTime(url) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        const startTime = Date.now();
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const endTime = Date.now();
        return endTime - startTime;
    },
    async takeScreenshot(name) {
        const { page } = global.testState;
        if (!page)
            throw new Error('Page not available');
        await page.screenshot({
            path: `./test-results/screenshots/${name}-${Date.now()}.png`,
            fullPage: true
        });
    }
};
//# sourceMappingURL=setup-e2e.js.map