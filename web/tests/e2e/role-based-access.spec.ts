/**
 * HASIVU Enterprise Role-Based Access Control Tests
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a) 
 * 🔐 Comprehensive RBAC testing for 7 user roles
 * 🛡️ Security validation and permission enforcement
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { UserRole, Permission } from '../../src/types/auth';

// Test user credentials for each role
const _TEST_USERS =  {
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
const _PROTECTED_ROUTES =  [
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

test.describe(_'HASIVU Role-Based Access Control', _() => {

  test.beforeEach(_async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.goto('/auth/logout');
  });

  test.describe(_'Authentication Flow', _() => {
    
    Object.entries(TEST_USERS).forEach(_([role, _userData]) => {
      test(_`${role} login flow and dashboard access`, _async ({ page }) => {
        // Navigate to login page
        await page.goto('/auth/login');
        
        // Verify login page loads with brand colors
        await expect(page).toHaveTitle(/login/i);
        
        // Fill login form
        await page.fill('[data-_testid = "email-input"]', userData.email);
        await page.fill('[data-_testid = "password-input"]', userData.password);
        
        // Submit login form
        await page.click('[data-_testid = "login-button"]');
        
        // Wait for redirect and verify landing on correct dashboard
        await page.waitForURL('**/dashboard/**');
        expect(page.url()).toContain('/dashboard');
        
        // Verify user info is displayed
        await expect(page.locator('[data-_testid = "user-name"]')).toBeVisible();
        await expect(page.locator('[data-_testid = "user-role"]')).toContainText(role);
        
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

  test.describe(_'Authorization Enforcement', _() => {

    // Test that users can only access routes they have permission for
    PROTECTED_ROUTES.forEach(_({ path, _requiredRoles }) => {
      
      test(_`Route ${path} access control`, _async ({ browser }) => {
        
        // Test authorized access
        for (const allowedRole of requiredRoles) {
          const _context =  await browser.newContext();
          const _page =  await context.newPage();
          
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
        const _unauthorizedRoles =  Object.keys(TEST_USERS).filter(
          role 
        for (const unauthorizedRole of unauthorizedRoles.slice(0, 2)) { // Test 2 for performance
          const _context =  await browser.newContext();
          const _page =  await context.newPage();
          
          // Login as unauthorized user  
          await loginAs(page, unauthorizedRole);
          
          // Try to access protected route
          const _response =  await page.goto(path);
          
          // Should be redirected or blocked
          await page.waitForTimeout(1000);
          const _currentUrl =  page.url();
          
          // Should either redirect to login, 403 error, or their dashboard
          const _isBlocked =  currentUrl.includes('/auth/login') || 
                           currentUrl.includes('/403') ||
                           currentUrl.includes('/dashboard') && !currentUrl.includes(path);
          
          expect(isBlocked).toBe(true);
          
          await context.close();
        }
      });
    });

  });

  test.describe(_'Permission Validation', _() => {

    test(_'Admin permissions - full system access', _async ({ page }) => {
      await loginAs(page, UserRole.ADMIN);
      
      // Admin should have access to user management
      await page.goto('/admin/users');
      await expect(page.locator('[data-_testid = "user-management"]')).toBeVisible();
      
      // Admin should have access to analytics
      await page.goto('/admin/analytics');
      await expect(page.locator('[data-_testid = "analytics-dashboard"]')).toBeVisible();
      
      // Admin should see admin-only UI elements
      await page.goto('/dashboard/admin');
      await expect(page.locator('[data-_testid = "admin-controls"]')).toBeVisible();
    });

    test(_'Parent permissions - child and order management', _async ({ page }) => {
      await loginAs(page, UserRole.PARENT);
      
      await page.goto('/dashboard/parent');
      
      // Parent should see children management
      await expect(page.locator('[data-_testid = "children-section"]')).toBeVisible();
      
      // Parent should see order placement
      await expect(page.locator('[data-_testid = "place-order-button"]')).toBeVisible();
      
      // Parent should see payment methods
      await expect(page.locator('[data-_testid = "payment-methods"]')).toBeVisible();
      
      // Parent should NOT see admin controls
      await expect(page.locator('[data-_testid = "admin-controls"]')).not.toBeVisible();
    });

    test(_'Kitchen Staff permissions - order queue management', _async ({ page }) => {
      await loginAs(page, UserRole.KITCHEN_STAFF);
      
      await page.goto('/dashboard/kitchen');
      
      // Kitchen staff should see preparation queue
      await expect(page.locator('[data-_testid = "preparation-queue"]')).toBeVisible();
      
      // Kitchen staff should see inventory
      await expect(page.locator('[data-_testid = "inventory-section"]')).toBeVisible();
      
      // Kitchen staff should be able to update order status
      await expect(page.locator('[data-_testid = "update-status-button"]')).toBeVisible();
      
      // Kitchen staff should NOT see admin functions
      await expect(page.locator('[data-_testid = "user-management"]')).not.toBeVisible();
    });

    test(_'Student permissions - limited menu access', _async ({ page }) => {
      await loginAs(page, UserRole.STUDENT);
      
      await page.goto('/dashboard/student');
      
      // Student should see limited menu access
      await expect(page.locator('[data-_testid = "student-menu"]')).toBeVisible();
      
      // Student should NOT see payment methods (parents handle payments)
      await expect(page.locator('[data-_testid = "payment-methods"]')).not.toBeVisible();
      
      // Student should NOT see administrative functions
      await expect(page.locator('[data-_testid = "admin-controls"]')).not.toBeVisible();
    });

  });

  test.describe(_'Security Features', _() => {

    test(_'Session timeout handling', _async ({ page }) => {
      await loginAs(page, UserRole.PARENT);
      
      // Simulate session expiry by clearing auth tokens
      await page.evaluate(_() => {
        localStorage.removeItem('auth-token');
        sessionStorage.removeItem('auth-session');
      });
      
      // Try to access protected page
      await page.goto('/dashboard/parent');
      
      // Should redirect to login
      await page.waitForURL('**/auth/login**');
      expect(page.url()).toContain('/auth/login');
    });

    test(_'Concurrent session handling', _async ({ browser }) => {
      // Create two contexts for same user
      const _context1 =  await browser.newContext();
      const _context2 =  await browser.newContext();
      
      const _page1 =  await context1.newPage();
      const _page2 =  await context2.newPage();
      
      // Login with same user in both contexts
      await loginAs(page1, UserRole.PARENT);
      await loginAs(page2, UserRole.PARENT);
      
      // Both sessions should work (concurrent sessions allowed)
      await page1.goto('/dashboard/parent');
      await page2.goto('/dashboard/parent');
      
      await expect(page1.locator('[data-_testid = "user-name"]')).toBeVisible();
      await expect(page2.locator('[data-_testid = "user-name"]')).toBeVisible();
      
      await context1.close();
      await context2.close();
    });

    test(_'CSRF protection', _async ({ page }) => {
      await loginAs(page, UserRole.ADMIN);
      
      // Try to make request without CSRF token (if implemented)
      const _response =  await page.request.post('/api/admin/users', {
        data: { name: 'Test User', email: 'test@example.com' },
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Should be rejected if CSRF protection is enabled
      // This test depends on your CSRF implementation
      expect([400, 401, 403, 422]).toContain(response.status());
    });

  });

  test.describe(_'UI Accessibility by Role', _() => {

    test(_'Role-specific navigation menus', _async ({ page }) => {
      // Test different navigation menus for each role
      const _rolesToTest =  [UserRole.ADMIN, UserRole.PARENT, UserRole.KITCHEN_STAFF];
      
      for (const role of rolesToTest) {
        await loginAs(page, role);
        
        // Check navigation menu has role-appropriate items
        const _navItems =  await page.locator('[data-testid
        expect(navItems).toBeGreaterThan(0);
        
        // Verify no unauthorized nav items are visible
        await validateNavigationMenu(page, role);
        
        await page.goto('/auth/logout');
      }
    });

    test(_'Role-based UI element visibility', _async ({ page }) => {
      // Test that UI elements show/hide based on user permissions
      await loginAs(page, UserRole.PARENT);
      
      await page.goto('/dashboard/parent');
      
      // Elements that should be visible for parents
      await expect(page.locator('[data-_testid = "place-order-button"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "children-list"]')).toBeVisible();
      
      // Elements that should NOT be visible for parents  
      await expect(page.locator('[data-_testid = "admin-panel-link"]')).not.toBeVisible();
      await expect(page.locator('[data-_testid = "kitchen-queue-link"]')).not.toBeVisible();
    });

  });

});

/**
 * Helper function to login as a specific user role
 */
async function loginAs(page: Page, role: UserRole) {
  const _userData =  TEST_USERS[role];
  
  await page.goto('/auth/login');
  await page.fill('[data-_testid = "email-input"]', userData.email);
  await page.fill('[data-_testid = "password-input"]', userData.password);
  await page.click('[data-_testid = "login-button"]');
  
  // Wait for authentication to complete
  await page.waitForURL('**/dashboard/**');
}

/**
 * Validate role-specific dashboard content
 */
async function validateRoleDashboard(page: Page, role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      await expect(page.locator('[data-_testid = "admin-stats"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Admin');
      break;
      
    case UserRole.PARENT:
      await expect(page.locator('[data-_testid = "children-section"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Parent');
      break;
      
    case UserRole.KITCHEN_STAFF:
      await expect(page.locator('[data-_testid = "preparation-queue"]')).toBeVisible();
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
  const _navLinks =  await page.locator('[data-testid
  switch (role) {
    case UserRole.ADMIN:
      expect(navLinks.some(_link = > link.includes('Admin'))).toBe(true);
      expect(navLinks.some(_link = > link.includes('Analytics'))).toBe(true);
      break;
      
    case UserRole.PARENT:
      expect(navLinks.some(_link = > link.includes('Children'))).toBe(true);
      expect(navLinks.some(_link = > link.includes('Orders'))).toBe(true);
      expect(navLinks.some(_link = > link.includes('Admin'))).toBe(false);
      break;
      
    case UserRole.KITCHEN_STAFF:
      expect(navLinks.some(_link = > link.includes('Kitchen'))).toBe(true);
      expect(navLinks.some(_link = > link.includes('Queue'))).toBe(true);
      expect(navLinks.some(_link = > link.includes('Admin'))).toBe(false);
      break;
  }
}