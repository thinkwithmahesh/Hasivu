import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // For preview/staging checks, validate the app root is reachable.
    // Some environments do not expose a common /api/status endpoint.
    await page.goto(baseURL, { timeout: 30000, waitUntil: 'domcontentloaded' });
    console.log('[global-setup] App reachable at', baseURL);
  } catch (err) {
    console.error('[global-setup] App not reachable:', err);
    throw new Error(`App not reachable at ${baseURL}. Is the stack running?`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
