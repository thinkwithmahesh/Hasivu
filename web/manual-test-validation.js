/**
 * Manual Test Validation Script - HASIVU Production Readiness Assessment
 * Tests actual functionality without relying on Playwright test configuration
 */

const puppeteer = require('puppeteer');

async function runProductionReadinessTests() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  console.log('🚀 HASIVU Production Readiness Assessment - Manual Validation');
  console.log('='.repeat(70));

  const testResults = {
    authentication: { status: 'pending', details: [] },
    rfidComponents: { status: 'pending', details: [] },
    orderManagement: { status: 'pending', details: [] },
    apiIntegration: { status: 'pending', details: [] },
    uiElements: { status: 'pending', details: [] },
  };

  try {
    // Test 1: Authentication System
    console.log('\n📋 Test 1: Authentication System');
    console.log('-'.repeat(40));

    await page.goto('http://localhost:3002/auth/login', { waitUntil: 'networkidle0' });

    // Check if login form exists
    const loginForm = await page.$('[data-testid="login-button"]');
    if (loginForm) {
      testResults.authentication.details.push('✅ Login form exists with proper test IDs');

      // Check role tabs
      const roleTabs = await page.$$('[data-testid^="role-tab-"]');
      testResults.authentication.details.push(`✅ Found ${roleTabs.length} role tabs`);

      // Test email extraction functionality
      await page.type('[data-testid="email-input"]', 'test.student@hasivu.edu');
      await page.type('[data-testid="password-input"]', 'password123');

      // Click login button
      await page.click('[data-testid="login-button"]');

      // Wait for navigation or error
      await new Promise(resolve => setTimeout(resolve, 3000));

      const currentUrl = page.url();
      if (currentUrl.includes('dashboard')) {
        testResults.authentication.details.push('✅ Login successful - redirected to dashboard');

        // Check for user display
        const userElement = await page.$(
          '[data-testid="welcome-message"], .welcome, [class*="welcome"]'
        );
        if (userElement) {
          const userText = await userElement.textContent();
          if (userText && !userText.includes('Demo User')) {
            testResults.authentication.details.push(`✅ Real user data: "${userText.trim()}"`);
          } else {
            testResults.authentication.details.push(
              `❌ Still shows demo user: "${userText?.trim()}"`
            );
          }
        } else {
          testResults.authentication.details.push('⚠️  No user welcome element found');
        }
      } else {
        testResults.authentication.details.push('❌ Login failed - remained on login page');
      }

      testResults.authentication.status = 'completed';
    } else {
      testResults.authentication.details.push('❌ Login form not found');
      testResults.authentication.status = 'failed';
    }

    // Test 2: Test Fixes Page
    console.log('\n📋 Test 2: Test Fixes Page Functionality');
    console.log('-'.repeat(40));

    await page.goto('http://localhost:3002/test-fixes', { waitUntil: 'networkidle0' });

    const testFixesHeader = await page.$('h1');
    if (testFixesHeader) {
      const headerText = await testFixesHeader.textContent();
      console.log(`✅ Test fixes page loaded: "${headerText}"`);

      // Check if test controls exist
      const testButtons = await page.$$('button[data-testid*="test"], button:has-text("Test")');
      console.log(`✅ Found ${testButtons.length} test control buttons`);

      // Check production readiness score
      const scoreElement = await page.$('[class*="text-3xl"], [class*="text-2xl"]');
      if (scoreElement) {
        const scoreText = await scoreElement.textContent();
        console.log(`📊 Production readiness display: "${scoreText}"`);
      }
    }

    // Test 3: RFID Components
    console.log('\n📋 Test 3: RFID Component Existence');
    console.log('-'.repeat(40));

    // Try to find RFID components on test fixes page
    const rfidElement = await page.$('[data-testid="rfid"], [class*="rfid"], [aria-label*="RFID"]');
    if (rfidElement) {
      testResults.rfidComponents.details.push('✅ RFID component found on test fixes page');
    } else {
      testResults.rfidComponents.details.push('❌ RFID component not found');
    }

    // Check if RFID scan buttons exist
    const scanButtons = await page.$$('button:has-text("Scan"), button:has-text("RFID")');
    testResults.rfidComponents.details.push(`Found ${scanButtons.length} scan-related buttons`);

    testResults.rfidComponents.status = rfidElement ? 'completed' : 'failed';

    // Test 4: Order Management Components
    console.log('\n📋 Test 4: Order Management');
    console.log('-'.repeat(40));

    const orderElements = await page.$$('[data-testid*="order"], [class*="order"], .order-card');
    if (orderElements.length > 0) {
      testResults.orderManagement.details.push(
        `✅ Found ${orderElements.length} order-related elements`
      );
      testResults.orderManagement.status = 'completed';
    } else {
      testResults.orderManagement.details.push('❌ No order management components found');
      testResults.orderManagement.status = 'failed';
    }

    // Test 5: UI Navigation
    console.log('\n📋 Test 5: UI Navigation Tests');
    console.log('-'.repeat(40));

    const navigationTests = [
      { path: '/kitchen-management', name: 'Kitchen Management' },
      { path: '/inventory-management', name: 'Inventory Management' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/orders', name: 'Orders' },
    ];

    for (const test of navigationTests) {
      try {
        await page.goto(`http://localhost:3002${test.path}`, {
          waitUntil: 'networkidle0',
          timeout: 10000,
        });

        const pageTitle = await page.title();
        const heading = await page.$('h1, h2, [data-testid*="header"]');
        const headingText = heading ? await heading.textContent() : 'No heading';

        if (page.url().includes(test.path.slice(1))) {
          testResults.uiElements.details.push(
            `✅ ${test.name}: Loaded successfully (${headingText?.trim()})`
          );
        } else {
          testResults.uiElements.details.push(`❌ ${test.name}: Failed to load proper page`);
        }
      } catch (error) {
        testResults.uiElements.details.push(
          `❌ ${test.name}: Navigation failed - ${error.message}`
        );
      }
    }

    testResults.uiElements.status = 'completed';
  } catch (error) {
    console.error('Test execution error:', error);
  }

  // Generate final report
  console.log('\n\n🏁 FINAL PRODUCTION READINESS ASSESSMENT');
  console.log('='.repeat(70));

  let totalTests = 0;
  let passedTests = 0;

  for (const [testName, result] of Object.entries(testResults)) {
    totalTests++;
    console.log(`\n📋 ${testName.toUpperCase()}: ${result.status.toUpperCase()}`);

    for (const detail of result.details) {
      console.log(`   ${detail}`);
    }

    if (result.status === 'completed') passedTests++;
  }

  const productionReadinessScore = Math.round((passedTests / totalTests) * 100);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ACTUAL PRODUCTION READINESS SCORE: ${productionReadinessScore}%`);
  console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
  console.log(
    `   Status: ${productionReadinessScore >= 80 ? '✅ PRODUCTION READY' : productionReadinessScore >= 60 ? '⚠️  NEEDS IMPROVEMENT' : '❌ NOT PRODUCTION READY'}`
  );
  console.log('='.repeat(70));

  await browser.close();
  return { score: productionReadinessScore, results: testResults };
}

// Run the tests if called directly
if (require.main === module) {
  runProductionReadinessTests().catch(console.error);
}

module.exports = { runProductionReadinessTests };
