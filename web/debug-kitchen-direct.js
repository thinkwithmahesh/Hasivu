// Direct debug script to test the kitchen management page with error capture
const { chromium } = require('playwright');

async function debugKitchenPageWithErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages and errors
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    console.log('[STACK]', error.stack);
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

    // Check for error messages
    const errorElement = await page.$('text=Application error');
    if (errorElement) {
      console.log('Found application error element');
      const errorText = await errorElement.textContent();
      console.log('Error text:', errorText);
    }

    // Check for kitchen header
    const kitchenHeader = await page.locator('[data-testid="kitchen-header"]').count();
    console.log('Kitchen header count:', kitchenHeader);

    const kitchenText = await page.getByText('Kitchen Management').count();
    console.log('Kitchen Management text count:', kitchenText);

    // Check the actual body content
    const bodyText = await page.textContent('body');
    console.log('Body text preview:', bodyText?.substring(0, 500));

    // Take screenshot
    await page.screenshot({ path: 'debug-kitchen-direct.png', fullPage: true });
    console.log('Screenshot saved as debug-kitchen-direct.png');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugKitchenPageWithErrors();
