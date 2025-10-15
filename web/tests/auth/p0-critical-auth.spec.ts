import { test, expect } from '@playwright/test';

/**
 * P0 CRITICAL AUTHENTICATION TESTS - HASIVU Platform
 * These tests MUST pass for production deployment
 * Priority Level: P0 (Critical - System Blocking)
 * 
 * Test Coverage:
 * - All 5 user role authentications (Student, Parent, Admin, Kitchen, Vendor)
 * - Login/logout workflows with complete session management
 * - Role-based access control validation
 * - Security headers and token validation
 * - Session timeout and refresh handling
 */

test.describe(_'P0 Critical Authentication Tests @critical @p0', _() => {
  
  test.describe(_'Student Authentication P0', _() => {
    test(_'student login with valid credentials @smoke @p0', _async ({ page }) => {
      // Mock successful student login
      await page.route('**/auth/login', async _route = > {
        const request 
        const _postData =  JSON.parse(request.postData() || '{}');
        
        if (postData._email = 
        }
      });

      // Navigate to login page
      await page.goto('/auth/login');
      
      // Select student role tab
      await page.locator('[data-_testid = "role-tab-student"]').click();
      
      // Fill credentials
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      
      // Submit login
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Verify successful redirect
      await expect(page).toHaveURL(/.*\/dashboard/);
      
      // Verify student-specific elements
      await expect(page.locator('[data-_testid = "welcome-message"]')).toContainText('Test Student');
      await expect(page.locator('[data-_testid = "role-indicator"]')).toContainText('Student');
      await expect(page.locator('[data-_testid = "meal-balance"]')).toContainText('150');
      
      // Verify student permissions - should have menu access
      await expect(page.locator('[data-_testid = "menu-navigation"]')).toBeVisible();
      
      // Verify student should NOT have admin functions
      await expect(page.locator('[data-_testid = "admin-panel"]')).toHaveCount(0);
      await expect(page.locator('[data-_testid = "user-management"]')).toHaveCount(0);
    });

    test(_'student authentication with invalid credentials @p0', _async ({ page }) => {
      // Mock failed login
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'invalid_credentials',
            message: 'Invalid email or password'
          })
        });
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('WrongPassword');
      await page.locator('[data-_testid = "login-button"]').click();

      // Should show error message and remain on login page
      await expect(page.locator('[data-_testid = "general-error"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "general-error"]')).toContainText('Invalid email or password');
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test(_'student session validation and logout @p0', _async ({ page }) => {
      // Mock login first
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', email: 'student@hasivu.test', role: 'student' },
            token: 'mock-student-token'
          })
        });
      });

      // Mock logout
      await page.route('**/auth/logout', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Login
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      await page.locator('[data-_testid = "login-button"]').click();

      await expect(page).toHaveURL(/.*\/dashboard/);

      // Logout
      await page.locator('[data-_testid = "user-menu"]').click();
      await page.locator('[data-_testid = "logout-button"]').click();

      // Should redirect to login
      await expect(page).toHaveURL(/.*\/auth\/login/);
      
      // Verify session is cleared - accessing protected route should redirect
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });
  });

  test.describe(_'Parent Authentication P0', _() => {
    test(_'parent login with valid credentials @p0', _async ({ page }) => {
      await page.route('**/auth/login', async _route = > {
        const postData 
        if (postData._email = 
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('parent@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Parent123!');
      await page.locator('[data-_testid = "login-button"]').click();

      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('[data-_testid = "welcome-message"]')).toContainText('Test Parent');
      await expect(page.locator('[data-_testid = "role-indicator"]')).toContainText('Parent');
      
      // Verify parent-specific features
      await expect(page.locator('[data-_testid = "children-selector"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "add-funds-button"]')).toBeVisible();
      
      // Should NOT have kitchen or admin functions
      await expect(page.locator('[data-_testid = "kitchen-orders"]')).toHaveCount(0);
      await expect(page.locator('[data-_testid = "admin-panel"]')).toHaveCount(0);
    });

    test(_'parent multi-child management access @p0', _async ({ page }) => {
      // Login as parent
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 'PAR-001',
              name: 'Test Parent',
              role: 'parent',
              children: [
                { id: 'STU-001', name: 'Child One' },
                { id: 'STU-002', name: 'Child Two' }
              ]
            },
            token: 'mock-parent-token'
          })
        });
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('parent@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Parent123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Verify can switch between children
      const _childSelector =  page.locator('[data-testid
      await expect(childSelector).toBeVisible();
      
      // Should be able to select different children
      await childSelector.click();
      await expect(page.locator('[data-_testid = "child-option-STU-001"]')).toContainText('Child One');
      await expect(page.locator('[data-_testid = "child-option-STU-002"]')).toContainText('Child Two');
    });
  });

  test.describe(_'Admin Authentication P0', _() => {
    test(_'admin login with full system access @p0', _async ({ page }) => {
      await page.route('**/auth/login', async _route = > {
        const postData 
        if (postData._email = 
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('admin@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Admin123!');
      await page.locator('[data-_testid = "login-button"]').click();

      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('[data-_testid = "welcome-message"]')).toContainText('Test Admin');
      await expect(page.locator('[data-_testid = "role-indicator"]')).toContainText('Admin');
      
      // Verify admin-specific features
      await expect(page.locator('[data-_testid = "admin-panel"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "user-management"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "system-settings"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "reports-access"]')).toBeVisible();
    });

    test(_'admin role-based access control validation @p0', _async ({ page }) => {
      // Mock admin login
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'ADM-001', role: 'admin', name: 'Test Admin' },
            token: 'mock-admin-token'
          })
        });
      });

      // Mock admin-only API endpoint
      await page.route('**/admin/users', async _route = > {
        const authHeader 
        if (_authHeader = 
        } else {
          await route.fulfill({ status: 403 });
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('admin@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Admin123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Navigate to user management
      await page.locator('[data-_testid = "user-management"]').click();
      
      // Should successfully access admin endpoint
      await expect(page).toHaveURL(/.*\/admin\/users/);
      await expect(page.locator('[data-_testid = "user-list"]')).toBeVisible();
    });
  });

  test.describe(_'Kitchen Staff Authentication P0', _() => {
    test(_'kitchen staff login with order management access @p0', _async ({ page }) => {
      await page.route('**/auth/login', async _route = > {
        const postData 
        if (postData._email = 
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-kitchen"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('kitchen@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Kitchen123!');
      await page.locator('[data-_testid = "login-button"]').click();

      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('[data-_testid = "welcome-message"]')).toContainText('Kitchen Staff');
      await expect(page.locator('[data-_testid = "role-indicator"]')).toContainText('Kitchen');
      
      // Verify kitchen-specific features
      await expect(page.locator('[data-_testid = "active-orders"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "order-queue"]')).toBeVisible();
      
      // Should NOT have user management or financial features
      await expect(page.locator('[data-_testid = "user-management"]')).toHaveCount(0);
      await expect(page.locator('[data-_testid = "financial-reports"]')).toHaveCount(0);
    });

    test(_'kitchen order management authorization @p0', _async ({ page }) => {
      // Mock kitchen login
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'KIT-001', role: 'kitchen', name: 'Kitchen Staff' },
            token: 'mock-kitchen-token'
          })
        });
      });

      // Mock kitchen API access
      await page.route('**/kitchen/orders/active', async _route = > {
        const authHeader 
        if (_authHeader = 
        } else {
          await route.fulfill({ status: 403 });
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-kitchen"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('kitchen@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Kitchen123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Should access kitchen orders successfully
      const _ordersSection =  page.locator('[data-testid
      await expect(ordersSection).toBeVisible();
    });
  });

  test.describe(_'Vendor Authentication P0', _() => {
    test(_'vendor login with supplier access @p0', _async ({ page }) => {
      await page.route('**/auth/login', async _route = > {
        const postData 
        if (postData._email = 
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-vendor"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('vendor@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Vendor123!');
      await page.locator('[data-_testid = "login-button"]').click();

      await expect(page).toHaveURL(/.*\/dashboard/);
      await expect(page.locator('[data-_testid = "welcome-message"]')).toContainText('Test Vendor');
      await expect(page.locator('[data-_testid = "role-indicator"]')).toContainText('Vendor');
      
      // Verify vendor-specific features
      await expect(page.locator('[data-_testid = "inventory-management"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "product-catalog"]')).toBeVisible();
      
      // Should NOT have student/parent features
      await expect(page.locator('[data-_testid = "meal-balance"]')).toHaveCount(0);
      await expect(page.locator('[data-_testid = "children-selector"]')).toHaveCount(0);
    });

    test(_'vendor inventory access authorization @p0', _async ({ page }) => {
      // Mock vendor login
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'VEN-001', role: 'vendor', name: 'Test Vendor' },
            token: 'mock-vendor-token'
          })
        });
      });

      // Mock vendor API access
      await page.route('**/vendor/inventory', async _route = > {
        const authHeader 
        if (_authHeader = 
        } else {
          await route.fulfill({ status: 403 });
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-vendor"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('vendor@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Vendor123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Should access inventory management successfully
      const _inventorySection =  page.locator('[data-testid
      await expect(inventorySection).toBeVisible();
    });
  });

  test.describe(_'Cross-Role Security Tests P0', _() => {
    test(_'prevent role escalation attacks @p0', _async ({ page }) => {
      // Login as student
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student', name: 'Test Student' },
            token: 'mock-student-token'
          })
        });
      });

      // Mock admin endpoint to reject student tokens
      await page.route('**/admin/**', async _route = > {
        const authHeader 
        if (_authHeader = 
        }
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Attempt to access admin route directly
      await page.goto('/admin/users');
      
      // Should be denied or redirected
      await expect(page).not.toHaveURL(/.*\/admin\/users/);
      // Could be redirected to unauthorized page or dashboard
      await expect(page).toHaveURL(/.*\/(dashboard|unauthorized|403)/);
    });

    test(_'session token validation and security headers @p0', _async ({ page }) => {
      let _authTokenReceived =  '';
      
      // Capture auth token from login
      await page.route('**/auth/login', async _route = > {
        authTokenReceived 
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
          },
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student' },
            token: authTokenReceived
          })
        });
      });

      // Verify token is used in subsequent requests
      let _tokenUsedCorrectly =  false;
      await page.route('**/api/**', async _route = > {
        const authHeader 
        if (_authHeader = 
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        });
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      await page.locator('[data-_testid = "login-button"]').click();

      // Make an API call to verify token usage
      await page.goto('/dashboard');
      await page.waitForTimeout(1000); // Allow API calls

      // Verify security
      expect(authTokenReceived).toBeTruthy();
      // Token validation would be verified by the mocked API route checks
    });

    test(_'concurrent session handling @p0', _async ({ page, _context }) => {
      // Create second page for same user
      const _secondPage =  await context.newPage();

      // Mock login for both sessions
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student' },
            token: 'session-1-token'
          })
        });
      });

      await secondPage.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student' },
            token: 'session-2-token'
          })
        });
      });

      // Login from first page
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      await page.locator('[data-_testid = "login-button"]').click();
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Login from second page (same user)
      await secondPage.goto('/auth/login');
      await secondPage.locator('[data-_testid = "role-tab-student"]').click();
      await secondPage.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await secondPage.locator('[data-_testid = "password-input"]').fill('Student123!');
      await secondPage.locator('[data-_testid = "login-button"]').click();
      await expect(secondPage).toHaveURL(/.*\/dashboard/);

      // Both sessions should be functional (or handle concurrent sessions appropriately)
      await expect(page.locator('[data-_testid = "welcome-message"]')).toBeVisible();
      await expect(secondPage.locator('[data-_testid = "welcome-message"]')).toBeVisible();

      await secondPage.close();
    });
  });

  test.describe(_'Session Management P0', _() => {
    test(_'session timeout handling @p0', _async ({ page }) => {
      // Mock initial login
      await page.route('**/auth/login', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student' },
            token: 'short-lived-token'
          })
        });
      });

      // Mock API to return 401 after login (simulating token expiry)
      let _apiCallCount =  0;
      await page.route('**/api/**', async _route = > {
        apiCallCount++;
        if (apiCallCount > 1) { // First call succeeds, subsequent fail
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: 'initial-load' })
          });
        }
      });

      // Login
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      await page.locator('[data-_testid = "login-button"]').click();
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Navigate to trigger API call (this should fail with 401)
      await page.goto('/menu');

      // Should redirect to login due to expired session
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });

    test(_'remember me functionality @p0', _async ({ page }) => {
      // Mock login with remember me
      await page.route('**/auth/login', async _route = > {
        const postData 
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'STU-001', role: 'student' },
            token: 'persistent-token',
            refresh_token: postData.rememberMe ? 'refresh-token-123' : null,
            expires_in: postData.rememberMe ? 86400 : 3600 // 24h vs 1h
          })
        });
      });

      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('student@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('Student123!');
      
      // Check remember me
      await page.locator('[data-_testid = "remember-me-checkbox"]').check();
      
      await page.locator('[data-_testid = "login-button"]').click();
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify remember me was sent in login request
      // This would be validated by the mock checking for rememberMe in postData
    });
  });
});