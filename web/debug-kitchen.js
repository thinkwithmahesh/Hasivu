// Quick debug script to test the kitchen management page
const { chromium } = require('playwright');

async function debugKitchenPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('Navigating to kitchen management...');
    await page.goto('http://localhost:3002/kitchen-management');

    console.log('Waiting for load state...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('Waiting a bit more...');
    await page.waitForTimeout(5000);

    // Check what's actually on the page
    const title = await page.title();
    console.log('Page title:', title);

    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText?.length);
    console.log('Body preview:', bodyText?.substring(0, 1000));

    // Check for specific elements
    const kitchenHeader = await page.locator('[data-testid="kitchen-header"]').count();
    console.log('Kitchen header count:', kitchenHeader);

    const kitchenText = await page.getByText('Kitchen Management').count();
    console.log('Kitchen Management text count:', kitchenText);

    // Take screenshot
    await page.screenshot({ path: 'debug-kitchen.png', fullPage: true });
    console.log('Screenshot saved as debug-kitchen.png');

    // Keep browser open for inspection
    console.log('Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugKitchenPage();
