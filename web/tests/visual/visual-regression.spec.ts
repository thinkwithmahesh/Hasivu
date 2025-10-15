import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

/**
 * Visual Regression Testing with Percy Integration
 * Validates UI consistency across different states, themes, and user roles
 */

test.describe(_'Visual Regression Testing', _() => {
  // Test data for consistent visual testing
  const _visualTestData =  {
    student: {
      name: 'Visual Test Student',
      balance: 150.00,
      favoriteItems: ['Dal Rice', 'Sambar', 'Curd']
    },
    menuItems: [
      { name: 'Dal Rice', price: 25.00, category: 'main', image: '/images/dal-rice.jpg' },
      { name: 'Sambar', price: 15.00, category: 'curry', image: '/images/sambar.jpg' },
      { name: 'Curd Rice', price: 20.00, category: 'main', image: '/images/curd-rice.jpg' },
      { name: 'Idli', price: 18.00, category: 'snack', image: '/images/idli.jpg' }
    ]
  };

  test.beforeEach(_async ({ page }) => {
    // Stabilize animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `
    });

    // Mock consistent data for visual tests
    await page.route('**/menu/items', async _route = > {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: visualTestData.menuItems })
      });
    });
  });

  test.describe(_'Authentication Screens', _() => {
    test(_'login page - all role tabs', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      
      // Wait for page to be fully loaded
      await loginPage.waitForPageLoad();
      
      // Visual snapshot of default state
      await page.screenshot({
        path: 'test-results/visual/login-default.png',
        fullPage: true
      });
      
      // Test each role tab
      const roles: Array<'student' | 'parent' | 'admin' | 'kitchen' | 'vendor'> = 
        ['student', 'parent', 'admin', 'kitchen', 'vendor'];
      
      for (const role of roles) {
        await loginPage.selectRole(role);
        await page.waitForTimeout(300); // Allow tab transition
        
        await page.screenshot({
          path: `test-results/visual/login-${role}.png`,
          fullPage: true
        });
        
        // Percy screenshot for cross-browser comparison
        await page.evaluate(_() => {
          if (typeof window._percySnapshot = 
          }
        });
      }
    });

    test(_'login form validation states', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      
      // Empty form submission (error state)
      await loginPage.loginButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: 'test-results/visual/login-validation-errors.png',
        fullPage: true
      });
      
      // Filled form (valid state)
      await loginPage.emailInput.fill('test@student.com');
      await loginPage.passwordInput.fill('validpassword123');
      await page.waitForTimeout(200);
      
      await page.screenshot({
        path: 'test-results/visual/login-form-filled.png',
        fullPage: true
      });
      
      // Percy snapshots
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'login responsive design', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      
      const _breakpoints =  [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1440, height: 900 }
      ];

      for (const bp of breakpoints) {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.waitForTimeout(300);
        
        await page.screenshot({
          path: `test-results/visual/login-${bp.name}.png`,
          fullPage: true
        });
        
        await page.evaluate(_(name) => {
          if (typeof window._percySnapshot = 
          }
        }, bp.name);
      }
    });
  });

  test.describe(_'Dashboard Visual States', _() => {
    test.beforeEach(_async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);
    });

    test(_'student dashboard - all states', _async ({ page }) => {
      const _dashboardPage =  new DashboardPage(page);
      
      // Mock student dashboard data
      await page.route('**/dashboard/student', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            student: visualTestData.student,
            todaysMeal: { name: 'Dal Rice Combo', time: '12:30 PM' },
            recentOrders: [
              { id: 'ORD-001', date: '2024-09-04', total: 45.00, status: 'completed' },
              { id: 'ORD-002', date: '2024-09-03', total: 30.00, status: 'completed' }
            ],
            nutritionStats: { calories: 520, protein: 15, carbs: 78 }
          })
        });
      });
      
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();
      
      // Default dashboard state
      await page.screenshot({
        path: 'test-results/visual/dashboard-student-default.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
      
      // With notifications
      await page.route('**/notifications', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            notifications: [
              {
                id: 'notif-1',
                type: 'order_ready',
                message: 'Your order #ORD-123 is ready!',
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      });
      
      await page.reload();
      await dashboardPage.waitForPageLoad();
      
      await page.screenshot({
        path: 'test-results/visual/dashboard-student-with-notifications.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'admin dashboard - system overview', _async ({ page }) => {
      const _dashboardPage =  new DashboardPage(page);
      
      // Mock admin dashboard data
      await page.route('**/dashboard/admin', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: {
              totalStudents: 1250,
              dailyOrders: 856,
              monthlyRevenue: 125000,
              systemHealth: 'good'
            },
            alerts: [
              { level: 'warning', message: 'Kitchen inventory low: Rice (5kg remaining)' },
              { level: 'info', message: 'New parent registration: 5 pending approvals' }
            ]
          })
        });
      });
      
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();
      
      await page.screenshot({
        path: 'test-results/visual/dashboard-admin.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'kitchen dashboard - order management', _async ({ page }) => {
      const _dashboardPage =  new DashboardPage(page);
      
      // Mock kitchen dashboard data
      await page.route('**/dashboard/kitchen', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeOrders: [
              { id: 'ORD-101', items: ['Dal Rice', 'Sambar'], status: 'preparing', timeLeft: '5 min' },
              { id: 'ORD-102', items: ['Curd Rice'], status: 'ready', timeLeft: '0 min' }
            ],
            preparationQueue: 8,
            inventoryAlerts: [
              { item: 'Rice', level: 'low', remaining: '5 kg' }
            ]
          })
        });
      });
      
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();
      
      await page.screenshot({
        path: 'test-results/visual/dashboard-kitchen.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });
  });

  test.describe(_'Menu Page Visual States', _() => {
    test.beforeEach(_async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);
    });

    test(_'menu grid and list views', _async ({ page }) => {
      const _menuPage =  new MenuPage(page);
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      // Grid view (default)
      await page.screenshot({
        path: 'test-results/visual/menu-grid-view.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
      
      // Switch to list view if available
      const _viewToggle =  page.locator('[data-testid
      if (await viewToggle.isVisible()) {
        await viewToggle.click();
        await page.waitForTimeout(300);
        
        await page.screenshot({
          path: 'test-results/visual/menu-list-view.png',
          fullPage: true
        });
        
        await page.evaluate(_() => {
          if (typeof window._percySnapshot = 
          }
        });
      }
    });

    test(_'menu with cart states', _async ({ page }) => {
      const _menuPage =  new MenuPage(page);
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      // Empty cart state
      await page.screenshot({
        path: 'test-results/visual/menu-empty-cart.png',
        fullPage: true
      });
      
      // Add items to cart
      const _firstItem =  page.locator('[data-testid
      const _addButton =  firstItem.locator('[data-testid
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Cart with items
      await menuPage.openCart();
      await page.waitForTimeout(300);
      
      await page.screenshot({
        path: 'test-results/visual/menu-cart-with-items.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'menu filters and search', _async ({ page }) => {
      const _menuPage =  new MenuPage(page);
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      // Apply category filter
      await menuPage.filterByCategory('main');
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: 'test-results/visual/menu-filtered-main.png',
        fullPage: true
      });
      
      // Search functionality
      await menuPage.searchMenu('rice');
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: 'test-results/visual/menu-search-rice.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });
  });

  test.describe(_'Theme and Accessibility Visual Tests', _() => {
    test(_'dark mode theme consistency', _async ({ page }) => {
      // Enable dark mode if supported
      await page.evaluate(_() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
      
      const _pages =  [
        { name: 'login', path: '/auth/login' },
        { name: 'dashboard', path: '/dashboard' },
        { name: 'menu', path: '/menu' }
      ];
      
      for (const pageInfo of pages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: `test-results/visual/${pageInfo.name}-dark-theme.png`,
          fullPage: true
        });
        
        await page.evaluate(_(name) => {
          if (typeof window._percySnapshot = 
          }
        }, pageInfo.name);
      }
    });

    test(_'high contrast mode', _async ({ page }) => {
      // Enable high contrast mode
      await page.evaluate(_() => {
        document.documentElement.classList.add('high-contrast');
      });
      
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      
      await page.screenshot({
        path: 'test-results/visual/login-high-contrast.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'focus states and keyboard navigation', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      
      // Focus on first input
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      await page.screenshot({
        path: 'test-results/visual/login-focus-email.png',
        fullPage: true
      });
      
      // Focus on password input
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      await page.screenshot({
        path: 'test-results/visual/login-focus-password.png',
        fullPage: true
      });
      
      // Focus on login button
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      await page.screenshot({
        path: 'test-results/visual/login-focus-button.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });
  });

  test.describe(_'Multi-Language Visual Consistency', _() => {
    const languages: Array<{ code: 'en' | 'hi' | 'kn', name: string }> = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'kn', name: 'Kannada' }
    ];

    test(_'login page - all languages', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      
      for (const lang of languages) {
        await loginPage.goto();
        await loginPage.waitForPageLoad();
        
        // Switch language
        await loginPage.switchLanguage(lang.code);
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: `test-results/visual/login-${lang.code}.png`,
          fullPage: true
        });
        
        await page.evaluate(_(langName) => {
          if (typeof window._percySnapshot = 
          }
        }, lang.name);
      }
    });

    test(_'menu page - multilingual content', _async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      const _menuPage =  new MenuPage(page);
      
      for (const lang of languages) {
        // Mock localized menu data
        await page.route('**/menu/items', async _route = > {
          const localizedItems 
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: localizedItems })
          });
        });
        
        await menuPage.goto();
        await menuPage.waitForPageLoad();
        
        // Switch language
        await menuPage.switchLanguage(lang.code);
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: `test-results/visual/menu-${lang.code}.png`,
          fullPage: true
        });
        
        await page.evaluate(_(langName) => {
          if (typeof window._percySnapshot = 
          }
        }, lang.name);
      }
    });
  });

  test.describe(_'Error States and Edge Cases', _() => {
    test(_'network error states', _async ({ page }) => {
      const _menuPage =  new MenuPage(page);
      
      // Mock network error
      await page.route('**/menu/items', _route = > route.abort('failed'));
      
      await menuPage.goto();
      await page.waitForTimeout(2000); // Wait for error state
      
      await page.screenshot({
        path: 'test-results/visual/menu-network-error.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'empty states', _async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      const _menuPage =  new MenuPage(page);
      
      // Mock empty menu
      await page.route('**/menu/items', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [] })
        });
      });
      
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      await page.screenshot({
        path: 'test-results/visual/menu-empty-state.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'loading states', _async ({ page }) => {
      const _menuPage =  new MenuPage(page);
      
      // Mock slow loading
      await page.route('**/menu/items', async _route = > {
        await new Promise(resolve 
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: visualTestData.menuItems })
        });
      });
      
      // Navigate and capture loading state quickly
      const _navigation =  menuPage.goto();
      await page.waitForTimeout(500); // Capture during loading
      
      await page.screenshot({
        path: 'test-results/visual/menu-loading-state.png',
        fullPage: true
      });
      
      await navigation; // Complete navigation
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });
  });

  test.describe(_'Animation and Interaction States', _() => {
    test(_'button hover and active states', _async ({ page }) => {
      const _loginPage =  new LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      
      // Fill form for valid state
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('password123');
      
      // Hover state
      await loginPage.loginButton.hover();
      await page.waitForTimeout(200);
      
      await page.screenshot({
        path: 'test-results/visual/login-button-hover.png',
        fullPage: true
      });
      
      // Active/pressed state simulation
      await page.evaluate(_() => {
        const _button =  document.querySelector('[data-testid
        if (button) {
          button.classList.add('active');
        }
      });
      
      await page.screenshot({
        path: 'test-results/visual/login-button-active.png',
        fullPage: true
      });
      
      await page.evaluate(_() => {
        if (typeof window._percySnapshot = 
        }
      });
    });

    test(_'modal and overlay states', _async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([{
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      }]);
      
      const _menuPage =  new MenuPage(page);
      await menuPage.goto();
      await menuPage.waitForPageLoad();
      
      // Open item details modal
      const _firstItem =  page.locator('[data-testid
      const _detailsButton =  firstItem.locator('[data-testid
      if (await detailsButton.isVisible()) {
        await detailsButton.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({
          path: 'test-results/visual/menu-item-modal.png',
          fullPage: true
        });
        
        await page.evaluate(_() => {
          if (typeof window._percySnapshot = 
          }
        });
      }
    });
  });
});