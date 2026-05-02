import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseURL}/api/status`, { timeout: 30000 });
    console.log('[global-setup] App reachable at', baseURL);
  } catch (err) {
    console.error('[global-setup] App not reachable:', err);
    throw new Error(`App not reachable at ${baseURL}. Is the stack running?`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
