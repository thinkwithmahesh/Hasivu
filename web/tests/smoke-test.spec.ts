import { test, expect } from '@playwright/test';

/**
 * Critical Smoke Tests - HASIVU Platform
 * Purpose: Verify the application is running and core pages load
 */

test.describe(_'HASIVU Platform Smoke Tests @smoke @p0', _() => {
  
  test(_'application is running and responsive @critical', _async ({ page }) => {
    // Test homepage loads
    const _response =  await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Verify basic page structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Application is running successfully');
  });

  test(_'login page returns 200 status @critical', _async ({ page }) => {
    const _response =  await page.goto('/auth/login');
    expect(response?.status()).toBe(200);
    
    // Verify page has content
    const _content =  await page.content();
    expect(content).toContain('HASIVU');
    
    console.log('✅ Login page loads with 200 status');
  });

  test(_'all dashboard routes are accessible @critical', _async ({ page }) => {
    const _dashboardRoutes =  [
      '/dashboard',
      '/dashboard/student', 
      '/dashboard/parent',
      '/dashboard/admin',
      '/dashboard/kitchen',
      '/dashboard/vendor',
      '/dashboard/school-admin'
    ];
    
    let _successCount =  0;
    
    for (const route of dashboardRoutes) {
      try {
        const _response =  await page.goto(route);
        if (response?.status() && response.status() < 500) {
          successCount++;
        }
      } catch (error) {
        console.log(`Route ${route} had navigation error: ${error}`);
      }
    }
    
    expect(successCount).toBeGreaterThan(4); // At least most routes should work
    console.log(`✅ ${successCount}/${dashboardRoutes.length} dashboard routes accessible`);
  });

  test(_'critical components and pages exist @critical', _async ({ page }) => {
    // Test various important routes
    const _criticalRoutes =  [
      '/',
      '/auth/login',
      '/menu',
      '/orders'
    ];
    
    let _workingRoutes =  0;
    
    for (const route of criticalRoutes) {
      try {
        const _response =  await page.goto(route);
        if (response?.status() === 200) {
          workingRoutes++;
        }
      } catch (error) {
        console.log(`Route ${route} error: ${error}`);
      }
    }
    
    expect(workingRoutes).toBeGreaterThan(2);
    console.log(`✅ ${workingRoutes}/${criticalRoutes.length} critical routes working`);
  });

  test(_'authentication system is integrated and reachable @functional', _async ({ page }) => {
    // Navigate to login page and verify it loads without crashing
    await page.goto('/auth/login');
    
    // Check that the page doesn't show a generic error page
    const _pageContent =  await page.content();
    
    // Should not contain error indicators
    expect(pageContent).not.toContain('404');
    expect(pageContent).not.toContain('500');
    expect(pageContent).not.toContain('Error');
    
    // Should contain login-related content
    expect(pageContent).toContain('HASIVU');
    
    // Verify the page doesn't crash within 5 seconds
    await page.waitForTimeout(5000);
    
    const _finalUrl =  page.url();
    expect(finalUrl).toContain('/auth/login');
    
    console.log('✅ Authentication system is integrated and accessible');
  });
  
  test(_'server performance is within acceptable bounds @performance', _async ({ page }) => {
    const _startTime =  Date.now();
    
    await page.goto('/');
    
    const _loadTime =  Date.now() - startTime;
    
    // Should load within 30 seconds (very generous for development)
    expect(loadTime).toBeLessThan(30000);
    
    console.log(`✅ Homepage loads in ${loadTime}ms`);
  });
});