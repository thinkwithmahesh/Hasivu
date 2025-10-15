import { test, expect, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const _execAsync =  promisify(exec);

/**
 * P0 Critical Visual Regression Tests with AWS S3 Baseline Storage for HASIVU Platform
 * 
 * Comprehensive visual testing to catch UI regressions, layout issues, and cross-browser inconsistencies
 * Uses AWS S3 for centralized baseline storage and automated comparison with 5% threshold
 * 
 * Covers:
 * - Critical user journey screenshots across all roles
 * - Responsive design validation (320px-4K)
 * - Cross-browser visual consistency
 * - Dark/light theme variations
 * - Mobile and tablet layouts
 * - Component isolation testing
 * - Animation and transition states
 * - Error state visualizations
 * - Multi-language layout verification
 */

test.describe(_'P0 Critical Visual Regression Tests @critical @p0 @visual', _() => {
  
  // Test configuration
  const VISUAL_THRESHOLD = 0.05; // 5% visual difference threshold
  const _S3_BUCKET =  'hasivu-visual-baselines';
  const _TEST_ENVIRONMENTS =  ['chrome', 'firefox', 'safari', 'mobile-chrome', 'tablet-safari'];
  
  const _testUsers =  {
    student: {
      email: 'student@hasivu.test',
      password: 'password123',
      name: 'Test Student',
      balance: 150.00
    },
    parent: {
      email: 'parent@hasivu.test', 
      password: 'password123',
      name: 'Test Parent',
      balance: 500.00
    },
    admin: {
      email: 'admin@hasivu.test',
      password: 'password123',
      name: 'Test Admin'
    }
  };

  // AWS S3 Baseline Management
  async function uploadBaseline(screenshotPath: string, baselineName: string): Promise<void> {
    try {
      const _command =  `aws s3 cp "${screenshotPath}" s3://${S3_BUCKET}/baselines/${baselineName}.png --region us-east-1`;
      await execAsync(command);
      console.log(`Uploaded baseline: ${baselineName}`);
    } catch (error) {
      console.error(`Failed to upload baseline ${baselineName}:`, error);
    }
  }

  async function downloadBaseline(baselineName: string, localPath: string): Promise<boolean> {
    try {
      const _command =  `aws s3 cp s3://${S3_BUCKET}/baselines/${baselineName}.png "${localPath}" --region us-east-1`;
      await execAsync(command);
      return true;
    } catch (error) {
      console.log(`Baseline ${baselineName} not found in S3, will create new baseline`);
      return false;
    }
  }

  async function compareWithBaseline(page: Page, screenshotName: string, options: _any =  {}): Promise<void> {
    const environment 
    const _viewport =  `${page.viewportSize()?.width}x${page.viewportSize()?.height}`;
    const _baselineName =  `${screenshotName}_${environment}_${viewport}`;
    const _localBaselinePath =  `./tests/visual/baselines/${baselineName}.png`;
    
    // Download baseline from S3 if exists
    const _baselineExists =  await downloadBaseline(baselineName, localBaselinePath);
    
    if (baselineExists) {
      // Compare with existing baseline
      await expect(page).toHaveScreenshot(`${baselineName}.png`, {
        threshold: VISUAL_THRESHOLD,
        ...options
      });
    } else {
      // Create new baseline
      const _screenshot =  await page.screenshot({ fullPage: true });
      await page.screenshot({ path: localBaselinePath, fullPage: true });
      await uploadBaseline(localBaselinePath, baselineName);
      console.log(`Created new baseline: ${baselineName}`);
    }
  }

  test.beforeEach(_async ({ page }) => {
    // Mock all critical APIs for consistent visual testing
    await page.route('**/auth/login', async _route = > {
      const request 
      const _postData =  JSON.parse(request.postData() || '{}');
      
      const _userMap =  {
        [testUsers.student.email]: testUsers.student,
        [testUsers.parent.email]: testUsers.parent,
        [testUsers.admin.email]: testUsers.admin
      };
      
      const _user =  userMap[postData.email];
      if (user) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: user,
            token: `jwt_token_${user.email.split('@')[0]}`
          })
        });
      }
    });

    // Mock menu API for consistent visuals
    await page.route('**/api/menu/today', async _route = > {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          menu: [
            {
              id: 'MENU-001',
              name: 'South Indian Breakfast',
              description: 'Traditional breakfast with idli, vada, sambar and chutney',
              price: 45.00,
              image_url: 'https://images.unsplash.com/photo-1562440499-64c9a74f0650?w
    });

    // Mock notification API for consistent counts
    await page.route('**/api/notifications**', async _route = > {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          notifications: [
            {
              id: 'NOTIF-001',
              type: 'order_ready',
              title: 'Your order is ready!',
              message: 'Order #ORD-12345 is ready for pickup',
              timestamp: '2025-09-05T10:30:00Z',
              read: false
            },
            {
              id: 'NOTIF-002', 
              type: 'balance_low',
              title: 'Low Balance Alert',
              message: 'Your meal balance is below ₹50',
              timestamp: '2025-09-05T09:15:00Z',
              read: true
            }
          ],
          unread_count: 1
        })
      });
    });
  });

  test.describe(_'Student Dashboard Visual Tests', _() => {
    
    test(_'student dashboard desktop layout @p0 @student @desktop', _async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Wait for dashboard to fully load
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "meal-balance"]')).toContainText('₹150.00');
      
      // Wait for animations to settle
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_desktop', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'student dashboard mobile layout @p0 @student @mobile', _async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_mobile', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'student dashboard tablet layout @p0 @student @tablet', _async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_tablet', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'student menu page with items @p0 @student @menu', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Navigate to menu
      await page.click('[data-_testid = "menu-nav-link"]');
      await expect(page.locator('[data-_testid = "menu-page"]')).toBeVisible();
      
      // Wait for menu items to load
      await expect(page.locator('[data-_testid = "menu-item-MENU-001"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "menu-item-MENU-002"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "menu-item-MENU-003"]')).toBeVisible();
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await compareWithBaseline(page, 'student_menu_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Parent Dashboard Visual Tests', _() => {
    
    test(_'parent dashboard with child management @p0 @parent @dashboard', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock children data
      await page.route('**/api/parent/children', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            children: [
              {
                id: 'STU-001',
                name: 'Arjun Kumar',
                class: '5-A',
                meal_balance: 150.00,
                last_meal: '2025-09-05T08:30:00Z',
                dietary_preferences: ['vegetarian'],
                allergies: ['nuts']
              },
              {
                id: 'STU-002',
                name: 'Priya Kumar', 
                class: '3-B',
                meal_balance: 85.00,
                last_meal: '2025-09-04T12:15:00Z',
                dietary_preferences: [],
                allergies: ['dairy']
              }
            ]
          })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.parent.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "parent-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "child-card-STU-001"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "child-card-STU-002"]')).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'parent_dashboard_with_children', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'parent mobile dashboard @p0 @parent @mobile', _async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.route('**/api/parent/children', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            children: [
              {
                id: 'STU-001',
                name: 'Arjun Kumar',
                class: '5-A', 
                meal_balance: 150.00
              }
            ]
          })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.parent.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "parent-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'parent_dashboard_mobile', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Admin Dashboard Visual Tests', _() => {
    
    test(_'admin analytics dashboard @p0 @admin @analytics', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock analytics data
      await page.route('**/api/admin/analytics**', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            analytics: {
              daily_orders: 245,
              total_revenue: 15750.00,
              active_users: 1250,
              menu_items_sold: {
                'South Indian Breakfast': 85,
                'North Indian Lunch': 120,
                'Evening Snacks': 40
              },
              revenue_trend: [
                { date: '2025-09-01', revenue: 12500 },
                { date: '2025-09-02', revenue: 13200 },
                { date: '2025-09-03', revenue: 14100 },
                { date: '2025-09-04', revenue: 13800 },
                { date: '2025-09-05', revenue: 15750 }
              ]
            }
          })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.admin.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.admin.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "admin-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "analytics-cards"]')).toBeVisible();
      
      // Wait for charts to render
      await page.waitForTimeout(3000);
      
      await compareWithBaseline(page, 'admin_analytics_dashboard', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Order Flow Visual Tests', _() => {
    
    test(_'checkout page with payment options @p0 @checkout @payment', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Add items to cart
      await page.click('[data-_testid = "menu-nav-link"]');
      await page.locator('[data-_testid = "add-to-cart-MENU-001"]').click();
      await page.locator('[data-_testid = "add-to-cart-MENU-002"]').click();
      
      // Go to checkout
      await page.click('[data-_testid = "cart-button"]');
      await page.click('[data-_testid = "proceed-to-checkout"]');
      
      await expect(page.locator('[data-_testid = "checkout-page"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "payment-options"]')).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'checkout_payment_options', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'order confirmation page @p0 @order @confirmation', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock order confirmation
      await page.route('**/api/orders/create', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-VISUAL-001',
              items: [
                { name: 'South Indian Breakfast', price: 45.00, quantity: 1 },
                { name: 'North Indian Lunch', price: 65.00, quantity: 1 }
              ],
              total: 110.00,
              status: 'confirmed',
              estimated_delivery: '2025-09-05T11:30:00Z',
              order_number: 'H001234'
            }
          })
        });
      });
      
      await page.goto('/orders/confirmation/ORD-VISUAL-001');
      
      await expect(page.locator('[data-_testid = "order-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "order-number"]')).toContainText('H001234');
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'order_confirmation_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Error State Visual Tests', _() => {
    
    test(_'404 error page @p0 @error @404', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/non-existent-page');
      
      await expect(page.locator('[data-_testid = "error-404"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, '404_error_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'network error state @p0 @error @network', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock network error
      await page.route('**/api/**', async _route = > {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'NETWORK_ERROR',
            message: 'Unable to connect to server'
          })
        });
      });
      
      await page.goto('/dashboard');
      
      await expect(page.locator('[data-_testid = "network-error"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'network_error_state', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'insufficient balance error @p0 @error @balance', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock low balance user
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              ...testUsers.student,
              balance: 10.00 // Low balance
            }
          })
        });
      });
      
      // Mock payment failure
      await page.route('**/api/payments/**', async _route = > {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'INSUFFICIENT_BALANCE',
            message: 'Insufficient balance for this transaction'
          })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Try to make order
      await page.click('[data-_testid = "menu-nav-link"]');
      await page.locator('[data-testid="add-to-cart-MENU-002"]').click(); // Expensive item
      await page.click('[data-_testid = "proceed-to-checkout"]');
      await page.click('[data-_testid = "confirm-payment"]');
      
      await expect(page.locator('[data-_testid = "insufficient-balance-error"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'insufficient_balance_error', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Theme Variations', _() => {
    
    test(_'dark theme student dashboard @p0 @theme @dark', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Enable dark theme
      await page.addInitScript(_() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_dark_theme', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'high contrast theme accessibility @p0 @theme @accessibility', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Enable high contrast theme
      await page.addInitScript(_() => {
        localStorage.setItem('theme', 'high-contrast');
        document.documentElement.classList.add('high-contrast');
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_high_contrast', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Component Isolation Visual Tests', _() => {
    
    test(_'menu item card component @p0 @component @menu-card', _async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      
      // Navigate to isolated component view
      await page.goto('/components/menu-item-card?_id = MENU-001');
      
      await expect(page.locator('[data-_testid = "menu-item-card"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'menu_item_card_component', {
        animations: 'disabled'
      });
    });

    test(_'order status tracker component @p0 @component @order-tracker', _async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 400 });
      
      await page.goto('/components/order-status-tracker?_status = preparing');
      
      await expect(page.locator('[data-_testid = "order-status-tracker"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'order_status_tracker_component', {
        animations: 'disabled'
      });
    });
  });

  test.describe(_'Animation States', _() => {
    
    test(_'loading states animation @p0 @animation @loading', _async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock slow loading for animation capture
      await page.route('**/api/menu/today', async _route = > {
        await new Promise(resolve 
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, menu: [] })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await page.click('[data-_testid = "menu-nav-link"]');
      
      // Capture loading state
      await expect(page.locator('[data-_testid = "menu-loading"]')).toBeVisible();
      
      await compareWithBaseline(page, 'menu_loading_state', {
        animations: 'allow' // Allow animations for loading states
      });
    });
  });

  test.describe(_'Responsive Breakpoint Tests', _() => {
    
    test(_'320px mobile viewport @p0 @responsive @320px', _async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_320px', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test(_'4K desktop viewport @p0 @responsive @4k', _async ({ page }) => {
      await page.setViewportSize({ width: 3840, height: 2160 });
      
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_4k', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  // Utility function to generate baselines for all environments
  test.describe(_'Baseline Generation', _() => {
    
    test.skip(_'generate all baselines @baseline @skip', _async ({ page, _browserName }) => {
      // This test is normally skipped but can be run manually to generate new baselines
      // Run with: npm run test:visual -- --_grep = "generate all baselines"
      
      const viewports 
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Generate student dashboard baseline
        await page.goto('/auth/login');
        await page.locator('[data-_testid = "role-tab-student"]').click();
        await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
        await page.locator('[data-_testid = "password-input"]').fill(testUsers.student.password);
        await page.locator('[data-_testid = "login-button"]').click();
        
        await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
        await page.waitForTimeout(1000);
        
        const _baselineName =  `student_dashboard_${viewport.name}_${browserName}`;
        const _screenshotPath =  `./tests/visual/baselines/${baselineName}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        await uploadBaseline(screenshotPath, baselineName);
      }
    });
  });
});