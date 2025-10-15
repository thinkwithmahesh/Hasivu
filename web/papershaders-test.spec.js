const { test, expect } = require('@playwright/test');

test('Check papershaders background', async ({ page }) => {
  console.log('Navigating to landing page...');
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'papershaders-test.png', fullPage: true });

  console.log('Checking for red border test element...');
  const redBorder = page.locator('.border-red-500');
  const hasRedBorder = (await redBorder.count()) > 0;
  console.log('Red border test element found:', hasRedBorder);

  console.log('Checking for animated elements...');
  const animatedElements = await page.locator('[style*="animation"]').count();
  console.log('Elements with animation styles:', animatedElements);

  console.log('Checking page title...');
  const title = await page.title();
  console.log('Page title:', title);

  console.log('Checking for PapershadersBackground component wrapper...');
  const mainWrapper = page.locator('div').first();
  const wrapperClasses = await mainWrapper.getAttribute('class');
  console.log('Main wrapper classes:', wrapperClasses);

  console.log('Screenshot saved as papershaders-test.png');
});
