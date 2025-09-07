# Advanced Playwright Automation Framework Generation Prompt

## OBJECTIVE
Generate a production-grade, enterprise-level Playwright testing framework for a modern React-based food ordering platform with complex UI animations, multi-role authentication, and payment processing capabilities.

## PRIORITY MATRIX
### P0 - Critical (Must pass for deployment)
- Authentication flows for all 5 roles
- Payment processing (Razorpay integration)
- Order lifecycle (create → pay → fulfill)
- Data integrity (menu/inventory sync)
- Core accessibility (WCAG AA)

### P1 - High (Block release if >2 fail)
- Shader/animation rendering
- Responsive breakpoints (320px-4K)
- Visual regression (±5% threshold)
- API error handling
- Session management

### P2 - Medium (Track but don't block)
- Micro-interactions
- Performance metrics
- Cross-browser compatibility
- Network resilience

## COMPREHENSIVE TEST REQUIREMENTS

### A. VISUAL & ANIMATION FRAMEWORK
```typescript
interface ShaderTestConfig {
  backgrounds: {
    meshGradient: {
      primary: { speed: [0.1-0.5], opacity: [0.3-0.8] },
      secondary: { blendMode: string[], fallbacks: string[] }
    },
    validation: {
      renderTime: <100ms,
      gpuAcceleration: required,
      memoryLeaks: monitor
    }
  },
  animations: {
    framerMotion: {
      entrance: { duration: [0.3-0.8], easing: string[] },
      exit: { cleanupValidation: boolean },
      gestures: { magnetic: boolean, elastic: boolean }
    },
    performance: {
      fps: >=60,
      jank: <5%,
      paintTime: <16ms
    }
  }
}
```

**Test Requirements:**
- Validate ALL shader configurations across light/dark themes
- Test animation sequences: entrance → interaction → exit
- Capture performance metrics during complex animations
- Verify GPU acceleration and fallback mechanisms
- Test memory cleanup after component unmounting
- Validate responsive scaling of visual effects

### B. FUNCTIONAL WORKFLOW TESTING

#### Authentication Matrix
```typescript
type UserRole = 'parent' | 'student' | 'staff' | 'admin' | 'superAdmin';
type AuthScenario = {
  role: UserRole;
  permissions: string[];
  restrictedRoutes: string[];
  dataAccess: Record<string, 'read' | 'write' | 'none'>;
  sessionDuration: number;
  refreshStrategy: 'sliding' | 'fixed';
};
```

**Test Scenarios:**
1. **Happy Path**: Login → Navigate → Perform Actions → Logout
2. **Edge Cases**: 
   - Concurrent sessions
   - Token expiry during transaction
   - Role elevation/demotion
   - Account switching
   - OAuth fallback
3. **Security**: 
   - CSRF protection
   - XSS prevention
   - SQL injection attempts
   - Rate limiting

#### Order Lifecycle Testing
```typescript
interface OrderTestFlow {
  creation: {
    validations: ['inventory', 'pricing', 'schedule'],
    constraints: ['minOrder', 'maxItems', 'cutoffTime']
  },
  payment: {
    providers: ['razorpay', 'stripe', 'wallet'],
    scenarios: ['success', 'failure', 'timeout', 'partial'],
    webhooks: ['confirmation', 'refund', 'dispute']
  },
  fulfillment: {
    states: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    notifications: ['email', 'sms', 'push', 'inApp'],
    tracking: ['realtime', 'historical']
  }
}
```

### C. ADVANCED QA FRAMEWORK

#### Accessibility Testing
- **WCAG 2.1 AA Compliance**
  - Color contrast ratios (4.5:1 normal, 3:1 large)
  - Keyboard navigation (tab order, focus management)
  - Screen reader compatibility (NVDA, JAWS, VoiceOver)
  - ARIA attributes validation
  - Form error handling and announcements

#### Visual Regression Strategy
```typescript
interface VisualRegressionConfig {
  baseline: {
    creation: 'onMergeToMain',
    storage: 'aws-s3-bucket',
    retention: '30-days'
  },
  comparison: {
    threshold: 5, // percentage
    ignoreRegions: ['.dynamic-timestamp', '.user-avatar'],
    animations: 'disabled' | 'paused',
    fonts: 'waitForLoad'
  },
  reporting: {
    format: 'html' | 'json' | 'slack',
    artifacts: ['diff', 'baseline', 'actual']
  }
}
```

#### Performance Benchmarks
- **Core Web Vitals**
  - LCP: <2.5s
  - FID: <100ms
  - CLS: <0.1
  - TTI: <3.8s
- **Custom Metrics**
  - API response time: p95 <500ms
  - Animation smoothness: 60fps
  - Memory usage: <150MB
  - Bundle size: <300KB gzipped

### D. TEST ARCHITECTURE

#### Directory Structure
```
/tests
├── /e2e
│   ├── /auth
│   │   ├── login.spec.ts
│   │   ├── registration.spec.ts
│   │   ├── role-switching.spec.ts
│   │   └── session-management.spec.ts
│   ├── /orders
│   │   ├── creation.spec.ts
│   │   ├── payment.spec.ts
│   │   ├── fulfillment.spec.ts
│   │   └── history.spec.ts
│   ├── /menu
│   │   ├── crud-operations.spec.ts
│   │   ├── scheduling.spec.ts
│   │   └── nutritional-info.spec.ts
│   └── /rfid
│       ├── card-linking.spec.ts
│       └── tap-to-order.spec.ts
├── /visual
│   ├── /components
│   ├── /pages
│   └── /animations
├── /api
│   ├── /endpoints
│   └── /webhooks
├── /accessibility
│   ├── wcag-compliance.spec.ts
│   └── screen-reader.spec.ts
├── /performance
│   ├── load-testing.spec.ts
│   └── stress-testing.spec.ts
├── /fixtures
│   ├── auth.fixture.ts
│   ├── data.fixture.ts
│   └── network.fixture.ts
├── /utils
│   ├── selectors.ts
│   ├── helpers.ts
│   └── custom-matchers.ts
└── /config
    ├── playwright.config.ts
    ├── environments.ts
    └── reporters.ts
```

#### Code Standards
```typescript
// Example Test Structure
import { test, expect } from '@playwright/test';
import { AuthFixture } from '@fixtures/auth';
import { OrderPage } from '@pages/order';
import { mockPaymentAPI } from '@mocks/payment';

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup: Authentication, data seeding, network mocks
    await context.addCookies(AuthFixture.parentUser);
    await mockPaymentAPI(page);
  });

  test('should complete order with Razorpay payment', async ({ page }) => {
    // Arrange
    const orderPage = new OrderPage(page);
    const testData = {
      items: ['item1', 'item2'],
      quantity: [2, 1],
      deliveryDate: '2024-01-15'
    };

    // Act
    await orderPage.goto();
    await orderPage.addItems(testData.items, testData.quantity);
    await orderPage.selectDeliveryDate(testData.deliveryDate);
    await orderPage.proceedToCheckout();

    // Assert
    await expect(orderPage.orderSummary).toBeVisible();
    await expect(orderPage.totalAmount).toContainText('₹450');
    
    // Payment flow
    const paymentFrame = await orderPage.initiatePayment();
    await paymentFrame.completeRazorpayFlow();
    
    // Verify order confirmation
    await expect(page).toHaveURL(/\/order\/confirmation/);
    await expect(orderPage.confirmationNumber).toMatch(/ORD-\d{10}/);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Cleanup: Screenshots, traces, test artifacts
    if (testInfo.status !== 'passed') {
      await page.screenshot({ path: `artifacts/${testInfo.title}.png` });
    }
  });
});
```

### E. AUTOMATION INFRASTRUCTURE

#### Network Mocking Strategy
```typescript
interface NetworkMockConfig {
  scenarios: {
    success: { status: 200, delay: 0 },
    slowNetwork: { status: 200, delay: 3000 },
    timeout: { status: 408, delay: 30000 },
    serverError: { status: 500, body: ErrorResponse },
    rateLimited: { status: 429, headers: { 'Retry-After': '60' } }
  },
  intercepts: {
    api: '**\/api\/**',
    cdn: '**\/cdn\/**',
    thirdParty: ['razorpay.com', 'analytics.google.com']
  }
}
```

#### CI/CD Integration
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *' # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e -- --shard=${{ matrix.shard }} --browser=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

#### Environment Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['slack', { webhookUrl: process.env.SLACK_WEBHOOK }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
});
```

### F. ERROR HANDLING & RECOVERY

```typescript
interface ErrorRecoveryStrategy {
  network: {
    retryCount: 3,
    retryDelay: [1000, 2000, 4000],
    fallbackBehavior: 'gracefulDegradation'
  },
  element: {
    waitStrategies: ['visible', 'attached', 'stable'],
    timeout: 30000,
    polling: 100
  },
  data: {
    validation: 'schema-based',
    sanitization: 'automatic',
    recovery: 'lastKnownGood'
  }
}
```

### G. REPORTING & ANALYTICS

```typescript
interface TestMetrics {
  execution: {
    totalTests: number,
    passed: number,
    failed: number,
    skipped: number,
    flaky: number,
    duration: number
  },
  coverage: {
    features: percentage,
    code: percentage,
    api: percentage,
    ui: percentage
  },
  trends: {
    failureRate: number[],
    executionTime: number[],
    flakyTests: string[]
  }
}
```

## DELIVERABLES

1. **Complete Test Suite** - 200+ test cases covering all P0/P1 scenarios
2. **Page Object Models** - Reusable components for all major UI elements
3. **Custom Fixtures** - Auth, data, network mocking utilities
4. **CI/CD Pipeline** - GitHub Actions workflow with parallel execution
5. **Documentation** - Setup guide, best practices, troubleshooting
6. **Performance Dashboard** - Real-time test metrics and trends
7. **Visual Regression Baseline** - Initial snapshots for all components

## SUCCESS CRITERIA

- **Coverage**: >90% feature coverage, >80% code coverage
- **Reliability**: <5% flaky tests, >95% consistent pass rate
- **Performance**: Full suite execution <15 minutes
- **Maintenance**: <2 hours/week maintenance effort
- **ROI**: 70% reduction in manual QA effort

## IMPLEMENTATION TIMELINE

- **Week 1**: Core framework setup, authentication tests
- **Week 2**: Order flow, payment integration tests
- **Week 3**: UI/animation, visual regression tests
- **Week 4**: Performance, accessibility, CI/CD integration
- **Week 5**: Documentation, training, handover

## NOTES FOR IMPLEMENTATION

- Prioritize selector stability using data-testid attributes
- Implement retry logic for network-dependent tests
- Use environment-specific configurations
- Maintain test data isolation between runs
- Document flaky tests and create stabilization tickets
- Regular review of test execution metrics
- Quarterly update of visual regression baselines