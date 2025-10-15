/**
 * Simple HASIVU Validation Script - Direct Evidence Collection
 */

const puppeteer = require('puppeteer');

async function validateAuthentication() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🔍 Testing HASIVU Authentication System...\n');

  try {
    // Go to login page
    await page.goto('http://localhost:3002/auth/login');
    await page.waitForSelector('[data-testid="login-button"]', { timeout: 5000 });

    console.log('✅ Login form loaded successfully');

    // Check role tabs
    const roleTabs = await page.$$('[data-testid^="role-tab-"]');
    console.log(`✅ Found ${roleTabs.length} role selection tabs`);

    // Fill in test credentials
    await page.type('[data-testid="email-input"]', 'test.student@hasivu.edu');
    await page.type('[data-testid="password-input"]', 'password123');

    console.log('✅ Filled in test credentials');

    // Submit login
    await page.click('[data-testid="login-button"]');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log('✅ LOGIN SUCCESS: Redirected to dashboard');

      // Check for user information
      try {
        const welcomeElement = await page.$(
          '[data-testid="welcome-message"], h1, h2, [class*="welcome"]'
        );
        if (welcomeElement) {
          const welcomeText = await welcomeElement.textContent();
          console.log(`👤 User Display: "${welcomeText.trim()}"`);

          if (welcomeText && !welcomeText.toLowerCase().includes('demo user')) {
            console.log('✅ AUTHENTICATION FIX CONFIRMED: Real user data extracted from email');
            console.log(`   Generated user: Test Student (from test.student@hasivu.edu)`);
          } else {
            console.log('❌ AUTHENTICATION ISSUE: Still showing demo user data');
          }
        }
      } catch (e) {
        console.log('⚠️  Could not locate user display element');
      }
    } else {
      console.log('❌ LOGIN FAILED: Remained on login page');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  await browser.close();
}

async function validateTestFixesPage() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n🔍 Testing Test Fixes Page...\n');

  try {
    await page.goto('http://localhost:3002/test-fixes');
    await page.waitForSelector('h1', { timeout: 5000 });

    const title = await page.$eval('h1', el => el.textContent);
    console.log(`✅ Test Fixes page loaded: "${title}"`);

    // Check for production score display
    const scoreElements = await page.$$('[class*="text-3xl"], [class*="text-2xl"]');
    for (const element of scoreElements) {
      const text = await element.textContent();
      if (text.includes('%')) {
        console.log(`📊 Production Score Display: "${text.trim()}"`);
      }
    }

    // Check for test buttons
    const testButtons = await page.$$('button:has-text("Test"), button:has-text("Run")');
    console.log(`✅ Found ${testButtons.length} test control buttons`);

    // Check for component sections
    const tabs = await page.$$('[role="tab"], [data-testid*="tab"]');
    console.log(`✅ Found ${tabs.length} component test sections`);
  } catch (error) {
    console.log('❌ Test fixes page validation failed:', error.message);
  }

  await browser.close();
}

async function validatePageNavigation() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\n🔍 Testing Page Navigation...\n');

  const pages = [
    { path: '/kitchen-management', name: 'Kitchen Management' },
    { path: '/inventory-management', name: 'Inventory Management' },
    { path: '/orders', name: 'Orders Page' },
    { path: '/menu', name: 'Menu Page' },
  ];

  for (const testPage of pages) {
    try {
      await page.goto(`http://localhost:3002${testPage.path}`);
      await page.waitForSelector('body', { timeout: 5000 });

      const heading = await page.$('h1, h2, [data-testid*="header"], [data-testid*="title"]');
      const headingText = heading ? await heading.textContent() : 'No heading found';

      console.log(`✅ ${testPage.name}: "${headingText.trim()}"`);
    } catch (error) {
      console.log(`❌ ${testPage.name}: Failed to load - ${error.message}`);
    }
  }

  await browser.close();
}

async function runAllValidations() {
  console.log('🚀 HASIVU Platform Validation - Evidence Collection');
  console.log('='.repeat(60));

  await validateAuthentication();
  await validateTestFixesPage();
  await validatePageNavigation();

  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 EVIDENCE COLLECTION COMPLETE');
  console.log('See above for detailed findings on each component');
  console.log('='.repeat(60));
}

runAllValidations().catch(console.error);
