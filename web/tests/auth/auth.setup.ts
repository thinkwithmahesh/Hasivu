import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';

/**
 * Authentication setup for different user roles
 * Creates authenticated browser states for reuse across tests
 */

// Define test user credentials for each role
const testUsers = {
  student: {
    email: 'student@hasivu.test',
    password: 'Student123!',
    role: 'student' as const,
    authFile: 'tests/auth/.auth/student.json'
  },
  parent: {
    email: 'parent@hasivu.test',
    password: 'Parent123!',
    role: 'parent' as const,
    authFile: 'tests/auth/.auth/parent.json'
  },
  admin: {
    email: 'admin@hasivu.test',
    password: 'Admin123!',
    role: 'admin' as const,
    authFile: 'tests/auth/.auth/admin.json'
  },
  kitchen: {
    email: 'kitchen@hasivu.test',
    password: 'Kitchen123!',
    role: 'kitchen' as const,
    authFile: 'tests/auth/.auth/kitchen.json'
  },
  vendor: {
    email: 'vendor@hasivu.test',
    password: 'Vendor123!',
    role: 'vendor' as const,
    authFile: 'tests/auth/.auth/vendor.json'
  }
};

/**
 * Setup authenticated state for Student role
 */
setup('authenticate as student', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  console.log('🎓 Setting up Student authentication...');
  
  // Mock successful login response
  await page.route('**/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.email === testUsers.student.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'STU-001',
            email: testUsers.student.email,
            name: 'Test Student',
            role: 'student',
            student_id: 'STU-12345',
            class: '10th Grade',
            school: 'HASIVU Test School'
          },
          token: 'mock-student-jwt-token',
          refresh_token: 'mock-student-refresh-token'
        })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock user profile endpoint
  await page.route('**/auth/profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'STU-001',
        email: testUsers.student.email,
        name: 'Test Student',
        role: 'student',
        student_id: 'STU-12345',
        meal_balance: 150.00,
        dietary_preferences: ['vegetarian'],
        allergies: ['nuts']
      })
    });
  });
  
  // Perform login
  await loginPage.login(
    testUsers.student.email, 
    testUsers.student.password, 
    testUsers.student.role
  );
  
  // Verify successful login by checking redirect to dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
  
  // Verify student-specific elements are visible
  await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="meal-balance"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: testUsers.student.authFile });
  
  console.log('✅ Student authentication setup complete');
});

/**
 * Setup authenticated state for Parent role
 */
setup('authenticate as parent', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  console.log('👨‍👩‍👧‍👦 Setting up Parent authentication...');
  
  // Mock successful login response
  await page.route('**/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.email === testUsers.parent.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'PAR-001',
            email: testUsers.parent.email,
            name: 'Test Parent',
            role: 'parent',
            children: [
              { id: 'STU-001', name: 'Child One', class: '8th Grade' },
              { id: 'STU-002', name: 'Child Two', class: '6th Grade' }
            ]
          },
          token: 'mock-parent-jwt-token',
          refresh_token: 'mock-parent-refresh-token'
        })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock parent dashboard data
  await page.route('**/parent/dashboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        children: [
          {
            id: 'STU-001',
            name: 'Child One',
            meal_balance: 120.00,
            recent_orders: 5,
            favorite_meal: 'Dal Rice'
          },
          {
            id: 'STU-002', 
            name: 'Child Two',
            meal_balance: 95.00,
            recent_orders: 3,
            favorite_meal: 'Curd Rice'
          }
        ],
        total_spent_this_month: 450.00,
        upcoming_payments: []
      })
    });
  });
  
  // Perform login
  await loginPage.login(
    testUsers.parent.email,
    testUsers.parent.password,
    testUsers.parent.role
  );
  
  // Verify successful login
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('[data-testid="parent-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="child-selector"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: testUsers.parent.authFile });
  
  console.log('✅ Parent authentication setup complete');
});

/**
 * Setup authenticated state for Admin role
 */
setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  console.log('👨‍💼 Setting up Admin authentication...');
  
  // Mock successful login response
  await page.route('**/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.email === testUsers.admin.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'ADM-001',
            email: testUsers.admin.email,
            name: 'Test Admin',
            role: 'admin',
            permissions: ['user_management', 'system_config', 'reports', 'analytics'],
            school_id: 'SCH-001'
          },
          token: 'mock-admin-jwt-token',
          refresh_token: 'mock-admin-refresh-token'
        })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock admin dashboard data
  await page.route('**/admin/dashboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        stats: {
          total_students: 1250,
          total_parents: 980,
          daily_orders: 856,
          monthly_revenue: 125000,
          active_kitchen_staff: 12,
          pending_approvals: 3
        },
        recent_activities: [
          { type: 'user_registered', count: 5, timestamp: new Date().toISOString() },
          { type: 'orders_completed', count: 156, timestamp: new Date().toISOString() }
        ],
        system_health: {
          status: 'healthy',
          uptime: '99.8%',
          response_time: '145ms'
        }
      })
    });
  });
  
  // Perform login
  await loginPage.login(
    testUsers.admin.email,
    testUsers.admin.password,
    testUsers.admin.role
  );
  
  // Verify successful login
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="system-stats"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: testUsers.admin.authFile });
  
  console.log('✅ Admin authentication setup complete');
});

/**
 * Setup authenticated state for Kitchen role
 */
setup('authenticate as kitchen', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  console.log('👨‍🍳 Setting up Kitchen authentication...');
  
  // Mock successful login response
  await page.route('**/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.email === testUsers.kitchen.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'KIT-001',
            email: testUsers.kitchen.email,
            name: 'Test Kitchen Staff',
            role: 'kitchen',
            kitchen_id: 'KIT-MAIN',
            shift: 'morning',
            permissions: ['order_management', 'inventory_update']
          },
          token: 'mock-kitchen-jwt-token',
          refresh_token: 'mock-kitchen-refresh-token'
        })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock kitchen dashboard data
  await page.route('**/kitchen/dashboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        active_orders: [
          { id: 'ORD-001', items: ['Dal Rice', 'Sambar'], status: 'preparing', time_left: '5 min' },
          { id: 'ORD-002', items: ['Curd Rice'], status: 'ready', time_left: '0 min' }
        ],
        preparation_queue: 12,
        completed_today: 156,
        inventory_alerts: [
          { item: 'Rice', level: 'low', quantity: '5 kg remaining' }
        ]
      })
    });
  });
  
  // Perform login
  await loginPage.login(
    testUsers.kitchen.email,
    testUsers.kitchen.password,
    testUsers.kitchen.role
  );
  
  // Verify successful login
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('[data-testid="kitchen-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="active-orders"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: testUsers.kitchen.authFile });
  
  console.log('✅ Kitchen authentication setup complete');
});

/**
 * Setup authenticated state for Vendor role
 */
setup('authenticate as vendor', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  console.log('🏪 Setting up Vendor authentication...');
  
  // Mock successful login response
  await page.route('**/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.email === testUsers.vendor.email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'VEN-001',
            email: testUsers.vendor.email,
            name: 'Test Vendor',
            role: 'vendor',
            company: 'HASIVU Food Supplies',
            vendor_id: 'VEN-FOOD-001',
            categories: ['vegetables', 'grains', 'dairy']
          },
          token: 'mock-vendor-jwt-token',
          refresh_token: 'mock-vendor-refresh-token'
        })
      });
    } else {
      await route.continue();
    }
  });
  
  // Mock vendor dashboard data
  await page.route('**/vendor/dashboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sales_summary: {
          today: 2500.00,
          this_week: 15600.00,
          this_month: 67800.00
        },
        pending_orders: [
          { id: 'PO-001', school: 'HASIVU School A', items: 5, total: 1200.00, due: '2024-09-06' }
        ],
        product_performance: [
          { name: 'Basmati Rice', sold: 50, revenue: 1500.00 },
          { name: 'Dal', sold: 30, revenue: 900.00 }
        ]
      })
    });
  });
  
  // Perform login
  await loginPage.login(
    testUsers.vendor.email,
    testUsers.vendor.password,
    testUsers.vendor.role
  );
  
  // Verify successful login
  await expect(page).toHaveURL(/.*\/dashboard/);
  await expect(page.locator('[data-testid="vendor-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-testid="sales-dashboard"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: testUsers.vendor.authFile });
  
  console.log('✅ Vendor authentication setup complete');
});

// Export test users for use in other test files
export { testUsers };