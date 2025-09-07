/**
 * HASIVU Enterprise Role-Based Access Control Tests
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a) 
 * 🔐 Comprehensive RBAC testing for 7 user roles
 * 🛡️ Security validation and permission enforcement
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { UserRole, Permission } from '../../src/types/auth';

// Test user credentials for each role
const TEST_USERS = {
  [UserRole.ADMIN]: {
    email: 'admin@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/admin',
    permissions: ['ADMIN_ACCESS', 'MANAGE_USERS', 'MANAGE_MENU', 'VIEW_ANALYTICS']
  },
  [UserRole.PARENT]: {
    email: 'parent@hasivu.test', 
    password: 'Test123!',
    expectedDashboard: '/dashboard/parent',
    permissions: ['MANAGE_CHILDREN', 'PLACE_ORDERS', 'VIEW_ORDER_HISTORY']
  },
  [UserRole.TEACHER]: {
    email: 'teacher@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/teacher',
    permissions: ['VIEW_STUDENT_ORDERS', 'MANAGE_CLASS_MENU', 'VIEW_NUTRITION_INFO']
  },
  [UserRole.STUDENT]: {
    email: 'student@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/student', 
    permissions: ['VIEW_MENU', 'PLACE_ORDERS']
  },
  [UserRole.KITCHEN_STAFF]: {
    email: 'kitchen@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/kitchen',
    permissions: ['KITCHEN_ACCESS', 'VIEW_KITCHEN_QUEUE', 'UPDATE_ORDER_STATUS']
  },
  [UserRole.VENDOR]: {
    email: 'vendor@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/vendor',
    permissions: ['MANAGE_PRODUCTS', 'VIEW_VENDOR_ANALYTICS']
  },
  [UserRole.SCHOOL_ADMIN]: {
    email: 'schooladmin@hasivu.test',
    password: 'Test123!',
    expectedDashboard: '/dashboard/school-admin',
    permissions: ['SCHOOL_ADMIN_ACCESS', 'MANAGE_SCHOOL_USERS', 'VIEW_SCHOOL_ANALYTICS']
  }
};

// Protected routes and their required permissions
const PROTECTED_ROUTES = [
  { path: '/dashboard/admin', requiredRoles: [UserRole.ADMIN, UserRole.SCHOOL_ADMIN] },
  { path: '/dashboard/parent', requiredRoles: [UserRole.PARENT] },
  { path: '/dashboard/teacher', requiredRoles: [UserRole.TEACHER] },
  { path: '/dashboard/student', requiredRoles: [UserRole.STUDENT] },
  { path: '/dashboard/kitchen', requiredRoles: [UserRole.KITCHEN_STAFF] },
  { path: '/dashboard/vendor', requiredRoles: [UserRole.VENDOR] },
  { path: '/admin/users', requiredRoles: [UserRole.ADMIN] },
  { path: '/admin/analytics', requiredRoles: [UserRole.ADMIN, UserRole.SCHOOL_ADMIN] },
  { path: '/kitchen/queue', requiredRoles: [UserRole.KITCHEN_STAFF] },
  { path: '/vendor/products', requiredRoles: [UserRole.VENDOR] }
];

test.describe('HASIVU Role-Based Access Control', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.goto('/auth/logout');
  });

  test.describe('Authentication Flow', () => {
    
    Object.entries(TEST_USERS).forEach(([role, userData]) => {
      test(`${role} login flow and dashboard access`, async ({ page }) => {
        // Navigate to login page
        await page.goto('/auth/login');
        
        // Verify login page loads with brand colors
        await expect(page).toHaveTitle(/login/i);
        
        // Fill login form
        await page.fill('[data-testid="email-input"]', userData.email);
        await page.fill('[data-testid="password-input"]', userData.password);
        
        // Submit login form
        await page.click('[data-testid="login-button"]');
        
        // Wait for redirect and verify landing on correct dashboard
        await page.waitForURL('**/dashboard/**');
        expect(page.url()).toContain('/dashboard');
        
        // Verify user info is displayed
        await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-role"]')).toContainText(role);
        
        // Verify role-specific dashboard elements
        await validateRoleDashboard(page, role as UserRole);
        
        // Take screenshot for visual regression
        await page.screenshot({
          path: `test-results/screenshots/${role}-dashboard.png`,
          fullPage: true
        });
      });
    });

  });

  test.describe('Authorization Enforcement', () => {

    // Test that users can only access routes they have permission for
    PROTECTED_ROUTES.forEach(({ path, requiredRoles }) => {
      
      test(`Route ${path} access control`, async ({ browser }) => {
        
        // Test authorized access
        for (const allowedRole of requiredRoles) {
          const context = await browser.newContext();
          const page = await context.newPage();
          
          // Login as authorized user
          await loginAs(page, allowedRole);
          
          // Try to access protected route
          await page.goto(path);
          
          // Should not be redirected to login
          await page.waitForTimeout(1000);
          expect(page.url()).not.toContain('/auth/login');
          expect(page.url()).not.toContain('/403');
          
          await context.close();
        }
        
        // Test unauthorized access
        const unauthorizedRoles = Object.keys(TEST_USERS).filter(
          role => !requiredRoles.includes(role as UserRole)
        ) as UserRole[];
        
        for (const unauthorizedRole of unauthorizedRoles.slice(0, 2)) { // Test 2 for performance
          const context = await browser.newContext();
          const page = await context.newPage();
          
          // Login as unauthorized user  
          await loginAs(page, unauthorizedRole);
          
          // Try to access protected route
          const response = await page.goto(path);
          
          // Should be redirected or blocked
          await page.waitForTimeout(1000);
          const currentUrl = page.url();
          
          // Should either redirect to login, 403 error, or their dashboard
          const isBlocked = currentUrl.includes('/auth/login') || 
                           currentUrl.includes('/403') ||
                           currentUrl.includes('/dashboard') && !currentUrl.includes(path);
          
          expect(isBlocked).toBe(true);
          
          await context.close();
        }
      });
    });

  });

  test.describe('Permission Validation', () => {

    test('Admin permissions - full system access', async ({ page }) => {
      await loginAs(page, UserRole.ADMIN);
      
      // Admin should have access to user management
      await page.goto('/admin/users');
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
      
      // Admin should have access to analytics
      await page.goto('/admin/analytics');
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      
      // Admin should see admin-only UI elements
      await page.goto('/dashboard/admin');
      await expect(page.locator('[data-testid="admin-controls"]')).toBeVisible();
    });

    test('Parent permissions - child and order management', async ({ page }) => {
      await loginAs(page, UserRole.PARENT);
      
      await page.goto('/dashboard/parent');
      
      // Parent should see children management
      await expect(page.locator('[data-testid="children-section"]')).toBeVisible();
      
      // Parent should see order placement
      await expect(page.locator('[data-testid="place-order-button"]')).toBeVisible();
      
      // Parent should see payment methods
      await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible();
      
      // Parent should NOT see admin controls
      await expect(page.locator('[data-testid="admin-controls"]')).not.toBeVisible();
    });

    test('Kitchen Staff permissions - order queue management', async ({ page }) => {
      await loginAs(page, UserRole.KITCHEN_STAFF);
      
      await page.goto('/dashboard/kitchen');
      
      // Kitchen staff should see preparation queue
      await expect(page.locator('[data-testid="preparation-queue"]')).toBeVisible();
      
      // Kitchen staff should see inventory
      await expect(page.locator('[data-testid="inventory-section"]')).toBeVisible();
      
      // Kitchen staff should be able to update order status
      await expect(page.locator('[data-testid="update-status-button"]')).toBeVisible();
      
      // Kitchen staff should NOT see admin functions
      await expect(page.locator('[data-testid="user-management"]')).not.toBeVisible();
    });

    test('Student permissions - limited menu access', async ({ page }) => {
      await loginAs(page, UserRole.STUDENT);
      
      await page.goto('/dashboard/student');
      
      // Student should see limited menu access
      await expect(page.locator('[data-testid="student-menu"]')).toBeVisible();
      
      // Student should NOT see payment methods (parents handle payments)
      await expect(page.locator('[data-testid="payment-methods"]')).not.toBeVisible();
      
      // Student should NOT see administrative functions
      await expect(page.locator('[data-testid="admin-controls"]')).not.toBeVisible();
    });

  });

  test.describe('Security Features', () => {

    test('Session timeout handling', async ({ page }) => {
      await loginAs(page, UserRole.PARENT);
      
      // Simulate session expiry by clearing auth tokens
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        sessionStorage.removeItem('auth-session');
      });
      
      // Try to access protected page
      await page.goto('/dashboard/parent');
      
      // Should redirect to login
      await page.waitForURL('**/auth/login**');
      expect(page.url()).toContain('/auth/login');
    });

    test('Concurrent session handling', async ({ browser }) => {
      // Create two contexts for same user
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Login with same user in both contexts
      await loginAs(page1, UserRole.PARENT);
      await loginAs(page2, UserRole.PARENT);
      
      // Both sessions should work (concurrent sessions allowed)
      await page1.goto('/dashboard/parent');
      await page2.goto('/dashboard/parent');
      
      await expect(page1.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(page2.locator('[data-testid="user-name"]')).toBeVisible();
      
      await context1.close();
      await context2.close();
    });

    test('CSRF protection', async ({ page }) => {
      await loginAs(page, UserRole.ADMIN);
      
      // Try to make request without CSRF token (if implemented)
      const response = await page.request.post('/api/admin/users', {
        data: { name: 'Test User', email: 'test@example.com' },
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Should be rejected if CSRF protection is enabled
      // This test depends on your CSRF implementation
      expect([400, 401, 403, 422]).toContain(response.status());
    });

  });

  test.describe('UI Accessibility by Role', () => {

    test('Role-specific navigation menus', async ({ page }) => {
      // Test different navigation menus for each role
      const rolesToTest = [UserRole.ADMIN, UserRole.PARENT, UserRole.KITCHEN_STAFF];
      
      for (const role of rolesToTest) {
        await loginAs(page, role);
        
        // Check navigation menu has role-appropriate items
        const navItems = await page.locator('[data-testid="nav-menu"] a').count();
        expect(navItems).toBeGreaterThan(0);
        
        // Verify no unauthorized nav items are visible
        await validateNavigationMenu(page, role);
        
        await page.goto('/auth/logout');
      }
    });

    test('Role-based UI element visibility', async ({ page }) => {
      // Test that UI elements show/hide based on user permissions
      await loginAs(page, UserRole.PARENT);
      
      await page.goto('/dashboard/parent');
      
      // Elements that should be visible for parents
      await expect(page.locator('[data-testid="place-order-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="children-list"]')).toBeVisible();
      
      // Elements that should NOT be visible for parents  
      await expect(page.locator('[data-testid="admin-panel-link"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="kitchen-queue-link"]')).not.toBeVisible();
    });

  });

});

/**
 * Helper function to login as a specific user role
 */
async function loginAs(page: Page, role: UserRole) {
  const userData = TEST_USERS[role];
  
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', userData.email);
  await page.fill('[data-testid="password-input"]', userData.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for authentication to complete
  await page.waitForURL('**/dashboard/**');
}

/**
 * Validate role-specific dashboard content
 */
async function validateRoleDashboard(page: Page, role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Admin');
      break;
      
    case UserRole.PARENT:
      await expect(page.locator('[data-testid="children-section"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Parent');
      break;
      
    case UserRole.KITCHEN_STAFF:
      await expect(page.locator('[data-testid="preparation-queue"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Kitchen');
      break;
      
    case UserRole.TEACHER:
      await expect(page.locator('h1')).toContainText('Teacher');
      break;
      
    case UserRole.STUDENT: 
      await expect(page.locator('h1')).toContainText('Student');
      break;
      
    case UserRole.VENDOR:
      await expect(page.locator('h1')).toContainText('Vendor');
      break;
      
    case UserRole.SCHOOL_ADMIN:
      await expect(page.locator('h1')).toContainText('School Admin');
      break;
  }
}

/**
 * Validate navigation menu contains appropriate items for role
 */
async function validateNavigationMenu(page: Page, role: UserRole) {
  const navLinks = await page.locator('[data-testid="nav-menu"] a').allTextContents();
  
  switch (role) {
    case UserRole.ADMIN:
      expect(navLinks.some(link => link.includes('Admin'))).toBe(true);
      expect(navLinks.some(link => link.includes('Analytics'))).toBe(true);
      break;
      
    case UserRole.PARENT:
      expect(navLinks.some(link => link.includes('Children'))).toBe(true);
      expect(navLinks.some(link => link.includes('Orders'))).toBe(true);
      expect(navLinks.some(link => link.includes('Admin'))).toBe(false);
      break;
      
    case UserRole.KITCHEN_STAFF:
      expect(navLinks.some(link => link.includes('Kitchen'))).toBe(true);
      expect(navLinks.some(link => link.includes('Queue'))).toBe(true);
      expect(navLinks.some(link => link.includes('Admin'))).toBe(false);
      break;
  }
}