import { test, expect } from '@playwright/test';

test(_'Safari Debug - Basic Login Page Navigation', _async ({ page }) => {
  console.log('Starting Safari debug test...');
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3002/auth/login');
    
    // Wait for page to load
    console.log('Waiting for page load...');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    console.log('Checking page title...');
    const _title =  await page.title();
    console.log('Page title:', title);
    
    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'safari-debug-screenshot.png' });
    
    // Check if any elements exist
    console.log('Checking for basic elements...');
    const _body =  await page.locator('body');
    const _bodyText =  await body.textContent();
    console.log('Body text length:', bodyText?.length || 0);
    
    // Look for any form elements
    console.log('Looking for form elements...');
    const _inputs =  await page.locator('input').count();
    console.log('Number of input elements found:', inputs);
    
    // Look for specific login elements
    const _emailInput =  await page.locator('[data-testid
    const _roleSelector =  await page.locator('[data-testid
    console.log('Email input found:', emailInput);
    console.log('Role selector found:', roleSelector);
    
    console.log('Safari debug test completed successfully');
    
  } catch (error) {
    console.error('Safari debug test failed:', error);
    throw error;
  }
});
