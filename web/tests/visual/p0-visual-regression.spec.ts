import { test, expect, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

test.describe('P0 Critical Visual Regression Tests @critical @p0 @visual', () => {
  
  // Test configuration
  const VISUAL_THRESHOLD = 0.05; // 5% visual difference threshold
  const S3_BUCKET = 'hasivu-visual-baselines';
  const TEST_ENVIRONMENTS = ['chrome', 'firefox', 'safari', 'mobile-chrome', 'tablet-safari'];
  
  const testUsers = {
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
      const command = `aws s3 cp "${screenshotPath}" s3://${S3_BUCKET}/baselines/${baselineName}.png --region us-east-1`;
      await execAsync(command);
      console.log(`Uploaded baseline: ${baselineName}`);
    } catch (error) {
      console.error(`Failed to upload baseline ${baselineName}:`, error);
    }
  }

  async function downloadBaseline(baselineName: string, localPath: string): Promise<boolean> {
    try {
      const command = `aws s3 cp s3://${S3_BUCKET}/baselines/${baselineName}.png "${localPath}" --region us-east-1`;
      await execAsync(command);
      return true;
    } catch (error) {
      console.log(`Baseline ${baselineName} not found in S3, will create new baseline`);
      return false;
    }
  }

  async function compareWithBaseline(page: Page, screenshotName: string, options: any = {}): Promise<void> {
    const environment = process.env.BROWSER_NAME || 'chrome';
    const viewport = `${page.viewportSize()?.width}x${page.viewportSize()?.height}`;
    const baselineName = `${screenshotName}_${environment}_${viewport}`;
    const localBaselinePath = `./tests/visual/baselines/${baselineName}.png`;
    
    // Download baseline from S3 if exists
    const baselineExists = await downloadBaseline(baselineName, localBaselinePath);
    
    if (baselineExists) {
      // Compare with existing baseline
      await expect(page).toHaveScreenshot(`${baselineName}.png`, {
        threshold: VISUAL_THRESHOLD,
        ...options
      });
    } else {
      // Create new baseline
      const screenshot = await page.screenshot({ fullPage: true });
      await page.screenshot({ path: localBaselinePath, fullPage: true });
      await uploadBaseline(localBaselinePath, baselineName);
      console.log(`Created new baseline: ${baselineName}`);
    }
  }

  test.beforeEach(async ({ page }) => {
    // Mock all critical APIs for consistent visual testing
    await page.route('**/auth/login', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      const userMap = {
        [testUsers.student.email]: testUsers.student,
        [testUsers.parent.email]: testUsers.parent,
        [testUsers.admin.email]: testUsers.admin
      };
      
      const user = userMap[postData.email];
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
    await page.route('**/api/menu/today', async route => {
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
              image_url: 'https://images.unsplash.com/photo-1562440499-64c9a74f0650?w=400',
              available: true,
              nutrition: { calories: 320, protein: 12, carbs: 55, fat: 8 },
              allergens: ['gluten'],
              preparation_time: 15
            },
            {
              id: 'MENU-002', 
              name: 'North Indian Lunch',
              description: 'Roti, dal, sabzi, rice and pickle',
              price: 65.00,
              image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
              available: true,
              nutrition: { calories: 450, protein: 18, carbs: 68, fat: 12 },
              allergens: ['dairy'],
              preparation_time: 25
            },
            {
              id: 'MENU-003',
              name: 'Evening Snacks',
              description: 'Samosa, pakora with mint and tamarind chutney',
              price: 35.00,
              image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
              available: false,
              nutrition: { calories: 280, protein: 8, carbs: 35, fat: 15 },
              allergens: ['gluten'],
              preparation_time: 10
            }
          ],
          date: '2025-09-05'
        })
      });
    });

    // Mock notification API for consistent counts
    await page.route('**/api/notifications**', async route => {
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

  test.describe('Student Dashboard Visual Tests', () => {
    
    test('student dashboard desktop layout @p0 @student @desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for dashboard to fully load
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-balance"]')).toContainText('₹150.00');
      
      // Wait for animations to settle
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_desktop', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('student dashboard mobile layout @p0 @student @mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_mobile', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('student dashboard tablet layout @p0 @student @tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_tablet', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('student menu page with items @p0 @student @menu', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      // Navigate to menu
      await page.click('[data-testid="menu-nav-link"]');
      await expect(page.locator('[data-testid="menu-page"]')).toBeVisible();
      
      // Wait for menu items to load
      await expect(page.locator('[data-testid="menu-item-MENU-001"]')).toBeVisible();
      await expect(page.locator('[data-testid="menu-item-MENU-002"]')).toBeVisible();
      await expect(page.locator('[data-testid="menu-item-MENU-003"]')).toBeVisible();
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await compareWithBaseline(page, 'student_menu_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Parent Dashboard Visual Tests', () => {
    
    test('parent dashboard with child management @p0 @parent @dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock children data
      await page.route('**/api/parent/children', async route => {
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
      await page.locator('[data-testid="role-tab-parent"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.parent.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="parent-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="child-card-STU-001"]')).toBeVisible();
      await expect(page.locator('[data-testid="child-card-STU-002"]')).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'parent_dashboard_with_children', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('parent mobile dashboard @p0 @parent @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.route('**/api/parent/children', async route => {
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
      await page.locator('[data-testid="role-tab-parent"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.parent.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="parent-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'parent_dashboard_mobile', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Admin Dashboard Visual Tests', () => {
    
    test('admin analytics dashboard @p0 @admin @analytics', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock analytics data
      await page.route('**/api/admin/analytics**', async route => {
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
      await page.locator('[data-testid="role-tab-admin"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.admin.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.admin.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="analytics-cards"]')).toBeVisible();
      
      // Wait for charts to render
      await page.waitForTimeout(3000);
      
      await compareWithBaseline(page, 'admin_analytics_dashboard', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Order Flow Visual Tests', () => {
    
    test('checkout page with payment options @p0 @checkout @payment', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      // Add items to cart
      await page.click('[data-testid="menu-nav-link"]');
      await page.locator('[data-testid="add-to-cart-MENU-001"]').click();
      await page.locator('[data-testid="add-to-cart-MENU-002"]').click();
      
      // Go to checkout
      await page.click('[data-testid="cart-button"]');
      await page.click('[data-testid="proceed-to-checkout"]');
      
      await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-options"]')).toBeVisible();
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'checkout_payment_options', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('order confirmation page @p0 @order @confirmation', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock order confirmation
      await page.route('**/api/orders/create', async route => {
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
      
      await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-number"]')).toContainText('H001234');
      
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'order_confirmation_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Error State Visual Tests', () => {
    
    test('404 error page @p0 @error @404', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/non-existent-page');
      
      await expect(page.locator('[data-testid="error-404"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, '404_error_page', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('network error state @p0 @error @network', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock network error
      await page.route('**/api/**', async route => {
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
      
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'network_error_state', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('insufficient balance error @p0 @error @balance', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock low balance user
      await page.route('**/auth/login', async route => {
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
      await page.route('**/api/payments/**', async route => {
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
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      // Try to make order
      await page.click('[data-testid="menu-nav-link"]');
      await page.locator('[data-testid="add-to-cart-MENU-002"]').click(); // Expensive item
      await page.click('[data-testid="proceed-to-checkout"]');
      await page.click('[data-testid="confirm-payment"]');
      
      await expect(page.locator('[data-testid="insufficient-balance-error"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'insufficient_balance_error', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Theme Variations', () => {
    
    test('dark theme student dashboard @p0 @theme @dark', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Enable dark theme
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_dark_theme', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('high contrast theme accessibility @p0 @theme @accessibility', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Enable high contrast theme
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'high-contrast');
        document.documentElement.classList.add('high-contrast');
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_high_contrast', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Component Isolation Visual Tests', () => {
    
    test('menu item card component @p0 @component @menu-card', async ({ page }) => {
      await page.setViewportSize({ width: 400, height: 600 });
      
      // Navigate to isolated component view
      await page.goto('/components/menu-item-card?id=MENU-001');
      
      await expect(page.locator('[data-testid="menu-item-card"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'menu_item_card_component', {
        animations: 'disabled'
      });
    });

    test('order status tracker component @p0 @component @order-tracker', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 400 });
      
      await page.goto('/components/order-status-tracker?status=preparing');
      
      await expect(page.locator('[data-testid="order-status-tracker"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'order_status_tracker_component', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Animation States', () => {
    
    test('loading states animation @p0 @animation @loading', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Mock slow loading for animation capture
      await page.route('**/api/menu/today', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, menu: [] })
        });
      });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await page.click('[data-testid="menu-nav-link"]');
      
      // Capture loading state
      await expect(page.locator('[data-testid="menu-loading"]')).toBeVisible();
      
      await compareWithBaseline(page, 'menu_loading_state', {
        animations: 'allow' // Allow animations for loading states
      });
    });
  });

  test.describe('Responsive Breakpoint Tests', () => {
    
    test('320px mobile viewport @p0 @responsive @320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_320px', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('4K desktop viewport @p0 @responsive @4k', async ({ page }) => {
      await page.setViewportSize({ width: 3840, height: 2160 });
      
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
      await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await compareWithBaseline(page, 'student_dashboard_4k', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  // Utility function to generate baselines for all environments
  test.describe('Baseline Generation', () => {
    
    test.skip('generate all baselines @baseline @skip', async ({ page, browserName }) => {
      // This test is normally skipped but can be run manually to generate new baselines
      // Run with: npm run test:visual -- --grep="generate all baselines"
      
      const viewports = [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 },
        { name: '4k', width: 3840, height: 2160 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Generate student dashboard baseline
        await page.goto('/auth/login');
        await page.locator('[data-testid="role-tab-student"]').click();
        await page.locator('[data-testid="email-input"]').fill(testUsers.student.email);
        await page.locator('[data-testid="password-input"]').fill(testUsers.student.password);
        await page.locator('[data-testid="login-button"]').click();
        
        await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
        await page.waitForTimeout(1000);
        
        const baselineName = `student_dashboard_${viewport.name}_${browserName}`;
        const screenshotPath = `./tests/visual/baselines/${baselineName}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        await uploadBaseline(screenshotPath, baselineName);
      }
    });
  });
});