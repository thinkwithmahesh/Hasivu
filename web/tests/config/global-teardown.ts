import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('[global-teardown] Test run complete');
}

export default globalTeardown;
