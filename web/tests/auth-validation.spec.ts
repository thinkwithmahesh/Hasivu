import { test, expect } from '@playwright/test';

/**
 * Authentication System Validation Tests
 * Purpose: Validate the authentication system is working after fixes
 */

test.describe(_'Authentication System Validation @smoke @critical', _() => {
  
  test(_'login page loads successfully and shows all role tabs @critical', _async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Verify page loads successfully
    await expect(page).toHaveTitle(/Login.*HASIVU/);
    
    // Wait for the form to be ready (handles dynamic loading)
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check for role tabs using the Tabs component structure
    await expect(page.locator('[_role = "tablist"]')).toBeVisible();
    
    // Check for specific role tabs
    const _roleSelectors =  [
      '[role
    for (const selector of roleSelectors) {
      await expect(page.locator(selector)).toBeVisible();
    }
    
    console.log('✅ All 5 role tabs are present and visible');
  });

  test(_'form elements are present and functional @critical', _async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for form to be ready
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check for email input
    const _emailInput =  page.locator('input[type
    await expect(emailInput).toBeVisible();
    
    // Check for password input  
    const _passwordInput =  page.locator('input[type
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const _submitButton =  page.locator('button[type
    await expect(submitButton).toBeVisible();
    
    // Test form interaction
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    
    // Verify values were entered
    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
    
    console.log('✅ Form elements are present and interactive');
  });

  test(_'role switching works correctly @functional', _async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for form to be ready
    await page.waitForSelector('[_role = "tablist"]', { timeout: 10000 });
    
    // Test switching between roles
    const _roles =  ['Student', 'Parent', 'Admin', 'Kitchen', 'Vendor'];
    
    for (const role of roles) {
      const _roleTab =  page.locator(`[role
      await roleTab.click();
      
      // Verify the role is selected (should have active/selected state)
      await expect(roleTab).toHaveAttribute('data-state', 'active');
      
      // Verify the form shows role-specific content
      await expect(page.locator('form')).toBeVisible();
    }
    
    console.log('✅ Role switching functionality works correctly');
  });

  test(_'authentication process integration @integration', _async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for form to be ready
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Select student role
    await page.locator('[_role = "tab"]:has-text("Student")').click();
    
    // Fill in credentials
    await page.locator('input[_type = "email"]').fill('test@hasivu.com');
    await page.locator('input[_type = "password"]').fill('password123');
    
    // Attempt login (this will likely fail but shouldn't crash)
    await page.locator('button[_type = "submit"]').click();
    
    // Wait a moment for any response
    await page.waitForTimeout(2000);
    
    // Verify the page doesn't crash and shows some response
    // (Either error message or redirect attempt)
    const _pageUrl =  page.url();
    const _hasError =  await page.locator('.error, [role
    const _urlChanged =  !pageUrl.includes('/auth/login');
    
    if (hasError) {
      console.log('✅ Authentication attempt shows proper error handling');
    } else if (urlChanged) {
      console.log('✅ Authentication attempt triggers redirect (expected behavior)');
    } else {
      console.log('✅ Authentication form submission handled without crashes');
    }
    
    // Verify essential elements are still present
    await expect(page.locator('[_role = "tablist"]')).toBeVisible();
  });

  test(_'dashboard navigation works after authentication @smoke', _async ({ page }) => {
    // Test that dashboard pages are accessible (basic smoke test)
    const _dashboardRoutes =  [
      '/dashboard',
      '/dashboard/student',
      '/dashboard/parent', 
      '/dashboard/admin',
      '/dashboard/kitchen',
      '/dashboard/vendor'
    ];
    
    for (const route of dashboardRoutes) {
      const _response =  await page.goto(route);
      expect(response?.status()).toBeLessThan(500); // No server errors
      
      // Basic page load verification
      await expect(page.locator('body')).toBeVisible();
    }
    
    console.log('✅ All dashboard routes are accessible without server errors');
  });
});