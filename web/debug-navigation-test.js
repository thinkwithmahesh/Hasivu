// Manual navigation test to verify all management pages
const { chromium } = require('playwright');

async function testNavigation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR]`, msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  const sections = [
    { path: '/kitchen-management', text: 'Kitchen Management', testId: 'kitchen-header' },
    { path: '/order-workflow', text: 'Order Workflow', testId: null },
    { path: '/inventory-management', text: 'Inventory Management', testId: 'inventory-header' },
  ];

  try {
    for (const section of sections) {
      console.log(`\n🧪 Testing: ${section.path}`);
      await page.goto(`http://localhost:3002${section.path}`);

      // Wait for page load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Check for application error first
      const hasError = await page
        .getByText('Application error')
        .isVisible()
        .catch(() => false);
      if (hasError) {
        console.log(`❌ Application error found on ${section.path}`);
        continue;
      }

      // Try to find the expected element
      let found = false;
      if (section.testId) {
        try {
          await page.waitForSelector(`[data-testid="${section.testId}"]`, { timeout: 5000 });
          found = true;
          console.log(`✅ Found test ID: ${section.testId}`);
        } catch (e) {
          console.log(`❌ Test ID not found: ${section.testId}`);
        }
      }

      if (!found) {
        try {
          await page.waitForSelector(`text=${section.text}`, { timeout: 5000 });
          found = true;
          console.log(`✅ Found text: ${section.text}`);
        } catch (e) {
          console.log(`❌ Text not found: ${section.text}`);
        }
      }

      const title = await page.title();
      console.log(`📄 Page title: ${title}`);

      if (!found) {
        // Take screenshot for debugging
        await page.screenshot({ path: `debug-${section.path.replace('/', '')}.png` });
        console.log(`📸 Screenshot saved: debug-${section.path.replace('/', '')}.png`);
      }
    }
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
  } finally {
    await browser.close();
  }
}

testNavigation();
