import { test, expect, Page } from '@playwright/test';

/**
 * P0 Critical Data Integrity & Session Management Tests for HASIVU Platform
 * 
 * Ensures data consistency, session security, and state management across the application
 * Critical for preventing data corruption, unauthorized access, and maintaining user trust
 * 
 * Covers:
 * - User session management and authentication state
 * - Data consistency across concurrent operations
 * - State persistence and recovery
 * - Role-based data access control
 * - Real-time data synchronization
 * - Session timeout and security
 * - Cross-tab session coordination
 * - Data validation and sanitization
 */

test.describe(_'P0 Critical Data Integrity Tests @critical @p0 @data', _() => {
  
  const _testUsers =  {
    student: {
      id: 'STU-001',
      email: 'student@hasivu.test',
      name: 'Test Student',
      role: 'student',
      meal_balance: 150.00,
      rfid_card: 'RFID-STU-001',
      permissions: ['view_menu', 'place_orders', 'view_balance']
    },
    parent: {
      id: 'PAR-001', 
      email: 'parent@hasivu.test',
      name: 'Test Parent',
      role: 'parent',
      wallet_balance: 500.00,
      children: ['STU-001'],
      permissions: ['manage_children', 'view_reports', 'make_payments']
    },
    admin: {
      id: 'ADM-001',
      email: 'admin@hasivu.test', 
      name: 'Test Admin',
      role: 'admin',
      permissions: ['manage_users', 'view_analytics', 'system_config', 'financial_reports']
    }
  };

  test.beforeEach(_async ({ page }) => {
    // Mock authentication API with session tracking
    await page.route('**/auth/login', async _route = > {
      const request 
      const _postData =  JSON.parse(request.postData() || '{}');
      
      const _userMap =  {
        'student@hasivu.test': testUsers.student,
        'parent@hasivu.test': testUsers.parent,
        'admin@hasivu.test': testUsers.admin
      };
      
      const _user =  userMap[postData.email];
      if (user) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Set-Cookie': `hasivu_session=${user.id}_session_token; Path=/; HttpOnly; Secure`
          },
          body: JSON.stringify({
            success: true,
            user: user,
            token: `jwt_token_${user.id}`,
            session_id: `${user.id}_session_token`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          })
        });
      }
    });

    // Mock session validation API
    await page.route('**/auth/validate-session', async _route = > {
      const authHeader 
      if (authHeader && authHeader.includes('jwt_token_')) {
        const _userId =  authHeader.split('jwt_token_')[1];
        const _user =  Object.values(testUsers).find(u 
        if (user) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              valid: true,
              user: user,
              session_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
          });
        }
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            valid: false,
            error: 'INVALID_SESSION'
          })
        });
      }
    });
  });

  test.describe(_'Session Management & Authentication State', _() => {
    
    test(_'session persistence across page refreshes @p0 @session @persistence', _async ({ page }) => {
      // Login as student
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Verify login success
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "user-name"]')).toContainText(testUsers.student.name);
      
      // Store session data for verification
      const _sessionData =  await page.evaluate(() 
      });
      
      expect(sessionData.token).toBeTruthy();
      expect(sessionData.user.email).toBe(testUsers.student.email);
      
      // Refresh page
      await page.reload();
      
      // Verify session restored automatically
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "user-name"]')).toContainText(testUsers.student.name);
      
      // Verify session data integrity
      const _restoredSessionData =  await page.evaluate(() 
      });
      
      expect(restoredSessionData.token).toBe(sessionData.token);
      expect(restoredSessionData.user.id).toBe(sessionData.user.id);
    });

    test(_'session timeout and automatic logout @p0 @session @timeout', _async ({ page }) => {
      // Mock short session timeout for testing
      await page.route('**/auth/validate-session', async _route = > {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            valid: false,
            error: 'SESSION_EXPIRED',
            expired_at: new Date(Date.now() - 1000).toISOString()
          })
        });
      });
      
      // Login first
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      
      // Trigger session validation (simulate API call)
      await page.reload();
      
      // Verify automatic logout
      await expect(page.locator('[data-_testid = "login-form"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "session-expired-message"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "session-expired-message"]')).toContainText('Your session has expired');
      
      // Verify session data cleared
      const _sessionData =  await page.evaluate(() 
      });
      
      expect(sessionData.token).toBeNull();
      expect(sessionData.user).toBeNull();
    });

    test(_'cross-tab session coordination @p0 @session @multi-tab', _async ({ context, _page }) => {
      // Login in first tab
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      
      // Open second tab
      const _secondPage =  await context.newPage();
      await secondPage.goto('/dashboard');
      
      // Verify session shared across tabs
      await expect(secondPage.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      await expect(secondPage.locator('[data-_testid = "user-name"]')).toContainText(testUsers.student.name);
      
      // Logout from first tab
      await page.locator('[data-_testid = "user-menu"]').click();
      await page.locator('[data-_testid = "logout-button"]').click();
      
      // Mock logout API
      await page.route('**/auth/logout', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Logged out successfully'
          })
        });
      });
      
      // Verify first tab redirected to login
      await expect(page.locator('[data-_testid = "login-form"]')).toBeVisible();
      
      // Verify second tab also logs out (session coordination)
      await secondPage.reload();
      await expect(secondPage.locator('[data-_testid = "login-form"]')).toBeVisible();
    });

    test(_'role-based access control validation @p0 @rbac @security', _async ({ page }) => {
      // Login as student
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      await expect(page.locator('[data-_testid = "student-dashboard"]')).toBeVisible();
      
      // Mock role-based API endpoint access
      await page.route('**/api/admin/users', async _route = > {
        const authHeader 
        if (!authHeader || !authHeader.includes('STU-001')) {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'INSUFFICIENT_PERMISSIONS',
              message: 'Access denied: Admin role required'
            })
          });
        }
      });
      
      // Attempt to access admin endpoint (should fail)
      const _response =  await page.evaluate(async () 
        return fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(_r = > r.json());
      });
      
      expect(response.error).toBe('INSUFFICIENT_PERMISSIONS');
      
      // Verify student can access allowed endpoints
      await page.route('**/api/student/menu', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            menu: [{ id: 'MENU-001', name: 'Breakfast', price: 45.00 }]
          })
        });
      });
      
      // Test allowed endpoint access
      await page.goto('/menu');
      await expect(page.locator('[data-_testid = "menu-list"]')).toBeVisible();
    });
  });

  test.describe(_'Data Consistency & Concurrent Operations', _() => {
    
    test(_'concurrent order operations data consistency @p0 @concurrency @orders', _async ({ page, _context }) => {
      // Setup two concurrent sessions for same student
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      const _secondPage =  await context.newPage();
      await secondPage.goto('/dashboard');
      
      // Mock balance endpoint with concurrency handling
      let _balanceUpdateCount =  0;
      await page.route('**/api/student/balance', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            balance: 150.00,
            last_updated: new Date().toISOString(),
            version: ++balanceUpdateCount
          })
        });
      });
      
      // Mock order creation with race condition protection
      let _orderCreationAttempts =  0;
      await page.route('**/api/orders/create', async _route = > {
        orderCreationAttempts++;
        
        if (_orderCreationAttempts = 
        } else {
          // Concurrent request fails with conflict
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'CONCURRENT_ORDER_CONFLICT',
              message: 'An order is already in progress',
              existing_order_id: 'ORD-RACE-001'
            })
          });
        }
      });
      
      // Attempt to create order from both tabs simultaneously
      const [firstResult, secondResult] = await Promise.all(_[
        page.evaluate(async () => {
          const _token =  localStorage.getItem('auth_token');
          return fetch('/api/orders/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{ menu_id: 'MENU-001', quantity: 1, price: 45.00 }]
            })
          }).then(_r = > r.json());
        }),
        secondPage.evaluate(_async () => {
          const _token =  localStorage.getItem('auth_token');
          return fetch('/api/orders/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{ menu_id: 'MENU-001', quantity: 1, price: 45.00 }]
            })
          }).then(_r = > r.json());
        })
      ]);
      
      // Verify only one order succeeded
      const _successfulOrders =  [firstResult, secondResult].filter(r 
      const _failedOrders =  [firstResult, secondResult].filter(r 
      expect(successfulOrders).toHaveLength(1);
      expect(failedOrders).toHaveLength(1);
      expect(failedOrders[0].error).toBe('CONCURRENT_ORDER_CONFLICT');
    });

    test(_'parent-child balance synchronization @p0 @sync @balance', _async ({ page, _context }) => {
      // Parent and student contexts
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      const _studentPage =  await context.newPage();
      await studentPage.goto('/auth/login');
      await studentPage.locator('[data-_testid = "role-tab-student"]').click();
      await studentPage.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await studentPage.locator('[data-_testid = "password-input"]').fill('password123');
      await studentPage.locator('[data-_testid = "login-button"]').click();
      
      // Mock balance top-up API with real-time sync
      await page.route('**/api/parent/topup-child', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transaction: {
              id: 'TXN-TOPUP-123',
              amount: 100.00,
              child_id: testUsers.student.id,
              parent_balance: 400.00, // 500 - 100
              child_new_balance: 250.00, // 150 + 100
              timestamp: new Date().toISOString()
            }
          })
        });
      });
      
      // Mock WebSocket for real-time balance updates
      await studentPage.route('**/ws/balance-updates', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'balance_update',
            user_id: testUsers.student.id,
            new_balance: 250.00,
            change_amount: 100.00,
            change_type: 'topup',
            timestamp: new Date().toISOString()
          })
        });
      });
      
      // Parent initiates top-up
      await page.locator('[data-_testid = "child-selector"]').selectOption(testUsers.student.id);
      await page.click('[data-_testid = "topup-balance-button"]');
      await page.locator('[data-_testid = "topup-amount"]').fill('100');
      await page.click('[data-_testid = "confirm-topup"]');
      
      // Verify parent sees updated balances
      await expect(page.locator('[data-_testid = "parent-balance"]')).toContainText('₹400.00');
      await expect(page.locator('[data-_testid = "child-balance"]')).toContainText('₹250.00');
      
      // Verify student receives real-time balance update
      await expect(studentPage.locator('[data-_testid = "balance-update-notification"]')).toBeVisible();
      await expect(studentPage.locator('[data-_testid = "meal-balance"]')).toContainText('₹250.00');
    });

    test(_'order status synchronization across roles @p0 @sync @order-status', _async ({ page, _context }) => {
      // Kitchen staff context
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-kitchen"]').click();
      await page.locator('[data-_testid = "email-input"]').fill('kitchen@hasivu.test');
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Student context
      const _studentPage =  await context.newPage();
      await studentPage.goto('/auth/login');
      await studentPage.locator('[data-_testid = "role-tab-student"]').click();
      await studentPage.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await studentPage.locator('[data-_testid = "password-input"]').fill('password123');
      await studentPage.locator('[data-_testid = "login-button"]').click();
      
      // Mock order with real-time status updates
      const _testOrderId =  'ORD-STATUS-SYNC-001';
      
      await page.route('**/api/kitchen/orders/pending', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            orders: [{
              id: testOrderId,
              student_name: testUsers.student.name,
              student_id: testUsers.student.id,
              items: [{ name: 'Breakfast', price: 45.00 }],
              status: 'pending_kitchen_acceptance',
              created_at: new Date(Date.now() - 5 * 60000).toISOString()
            }]
          })
        });
      });
      
      // Kitchen accepts order
      await page.route(`**/api/kitchen/orders/${testOrderId}/accept`, async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: testOrderId,
              status: 'kitchen_accepted',
              accepted_at: new Date().toISOString(),
              estimated_completion: new Date(Date.now() + 15 * 60000).toISOString()
            }
          })
        });
      });
      
      // Mock WebSocket for real-time order updates
      await studentPage.route('**/ws/order-updates', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'order_status_update',
            order_id: testOrderId,
            status: 'kitchen_accepted',
            estimated_completion: new Date(Date.now() + 15 * 60000).toISOString(),
            timestamp: new Date().toISOString()
          })
        });
      });
      
      // Kitchen accepts order
      await expect(page.locator('[data-_testid = "pending-orders"]')).toBeVisible();
      await page.locator(`[data-_testid = "accept-order-${testOrderId}"]`).click();
      
      // Verify kitchen sees updated status
      await expect(page.locator('[data-_testid = "order-accepted-toast"]')).toBeVisible();
      
      // Verify student receives real-time status update
      await expect(studentPage.locator('[data-_testid = "order-status-notification"]')).toBeVisible();
      await expect(studentPage.locator('[data-_testid = "order-status-notification"]')).toContainText('kitchen_accepted');
    });
  });

  test.describe(_'State Persistence & Recovery', _() => {
    
    test(_'cart state persistence during interruption @p0 @cart @persistence', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Add items to cart
      await page.goto('/menu');
      
      // Mock menu API
      await page.route('**/api/menu/today', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            menu: [
              { id: 'MENU-001', name: 'Breakfast', price: 45.00, available: true },
              { id: 'MENU-002', name: 'Lunch', price: 65.00, available: true }
            ]
          })
        });
      });
      
      // Add items to cart
      await page.locator('[data-_testid = "add-to-cart-MENU-001"]').click();
      await page.locator('[data-_testid = "add-to-cart-MENU-002"]').click();
      
      // Verify cart contents
      await expect(page.locator('[data-_testid = "cart-items-count"]')).toContainText('2');
      await expect(page.locator('[data-_testid = "cart-total"]')).toContainText('₹110.00');
      
      // Store cart state
      const _cartState =  await page.evaluate(() 
      });
      
      expect(cartState.items).toHaveLength(2);
      expect(cartState.total).toBe(110.00);
      
      // Simulate interruption (network disconnection)
      await page.context().setOffline(true);
      
      // Navigate away and back
      await page.goto('/dashboard');
      await page.goto('/menu');
      
      // Restore network
      await page.context().setOffline(false);
      
      // Verify cart state restored
      await expect(page.locator('[data-_testid = "cart-items-count"]')).toContainText('2');
      await expect(page.locator('[data-_testid = "cart-total"]')).toContainText('₹110.00');
      
      // Verify cart recovery notification
      await expect(page.locator('[data-_testid = "cart-restored-notification"]')).toBeVisible();
    });

    test(_'form data recovery after browser crash @p0 @forms @recovery', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.admin.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Navigate to complex form (e.g., menu creation)
      await page.goto('/admin/menu/create');
      
      // Fill complex form
      await page.locator('[data-_testid = "menu-name"]').fill('New Special Menu');
      await page.locator('[data-_testid = "menu-description"]').fill('A delicious new menu for students');
      await page.locator('[data-_testid = "menu-price"]').fill('75.00');
      await page.locator('[data-_testid = "preparation-time"]').fill('20');
      
      // Add menu items
      await page.locator('[data-_testid = "add-menu-item"]').click();
      await page.locator('[data-_testid = "item-name-0"]').fill('Special Rice');
      await page.locator('[data-_testid = "item-description-0"]').fill('Aromatic basmati rice');
      
      await page.locator('[data-_testid = "add-menu-item"]').click();
      await page.locator('[data-_testid = "item-name-1"]').fill('Curry');
      await page.locator('[data-_testid = "item-description-1"]').fill('Traditional vegetable curry');
      
      // Verify auto-save functionality
      await page.waitForTimeout(2000); // Allow auto-save to trigger
      
      const _savedFormData =  await page.evaluate(() 
      });
      
      expect(savedFormData.menu_name).toBe('New Special Menu');
      expect(savedFormData.items).toHaveLength(2);
      
      // Simulate browser crash/refresh
      await page.reload();
      
      // Login again
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.admin.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Navigate back to form
      await page.goto('/admin/menu/create');
      
      // Verify draft recovery notification
      await expect(page.locator('[data-_testid = "draft-recovery-notification"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "restore-draft-button"]')).toBeVisible();
      
      // Restore draft
      await page.locator('[data-_testid = "restore-draft-button"]').click();
      
      // Verify form data restored
      await expect(page.locator('[data-_testid = "menu-name"]')).toHaveValue('New Special Menu');
      await expect(page.locator('[data-_testid = "menu-price"]')).toHaveValue('75.00');
      await expect(page.locator('[data-_testid = "item-name-0"]')).toHaveValue('Special Rice');
      await expect(page.locator('[data-_testid = "item-name-1"]')).toHaveValue('Curry');
    });
  });

  test.describe(_'Data Validation & Sanitization', _() => {
    
    test(_'input sanitization and XSS prevention @p0 @security @xss', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Test XSS attempt in order special instructions
      await page.goto('/menu');
      await page.locator('[data-_testid = "add-to-cart-MENU-001"]').click();
      await page.locator('[data-_testid = "proceed-to-checkout"]').click();
      
      // Mock order creation with sanitization
      await page.route('**/api/orders/create', async _route = > {
        const request 
        const _orderData =  JSON.parse(request.postData() || '{}');
        
        // Verify server-side sanitization
        const _sanitizedInstructions =  orderData.special_instructions
          ?.replace(/<script[^>]*>.*?<\/script>/gi, '')
          ?.replace(/<[^>]*>/g, '')
          ?.trim();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-XSS-TEST-001',
              special_instructions: sanitizedInstructions,
              created_at: new Date().toISOString()
            }
          })
        });
      });
      
      // Attempt XSS injection in special instructions
      const _maliciousInput =  '<script>alert("XSS")</script>Please add extra spice';
      await page.locator('[data-_testid = "special-instructions"]').fill(maliciousInput);
      await page.locator('[data-_testid = "confirm-order"]').click();
      
      // Verify no script execution
      const _alerts =  [];
      page.on('dialog', _dialog = > {
        alerts.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0); // No alert should have been triggered
      
      // Verify sanitized data in order confirmation
      await expect(page.locator('[data-_testid = "order-instructions"]')).toContainText('Please add extra spice');
      await expect(page.locator('[data-_testid = "order-instructions"]')).not.toContainText('<script>');
    });

    test(_'SQL injection prevention @p0 @security @sql-injection', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-admin"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.admin.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Test SQL injection in user search
      await page.goto('/admin/users');
      
      // Mock user search with SQL injection attempt
      await page.route('**/api/admin/users/search', async _route = > {
        const request 
        const _url =  new URL(request.url());
        const _query =  url.searchParams.get('q');
        
        // Verify parameterized query behavior (server should not execute SQL)
        if (query?.includes("'; DROP TABLE users; --")) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'INVALID_SEARCH_QUERY',
              message: 'Search query contains invalid characters'
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              users: [],
              message: 'No users found'
            })
          });
        }
      });
      
      // Attempt SQL injection in search
      const sqlInjection = "test'; DROP TABLE users; --";
      await page.locator('[data-_testid = "user-search-input"]').fill(sqlInjection);
      await page.locator('[data-_testid = "search-button"]').click();
      
      // Verify error response
      await expect(page.locator('[data-_testid = "search-error"]')).toBeVisible();
      await expect(page.locator('[data-_testid = "search-error"]')).toContainText('invalid characters');
    });

    test(_'data type validation and constraints @p0 @validation @constraints', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Test balance top-up validation
      await page.locator('[data-_testid = "child-selector"]').selectOption(testUsers.student.id);
      await page.click('[data-_testid = "topup-balance-button"]');
      
      // Mock validation API
      await page.route('**/api/parent/topup-child', async _route = > {
        const request 
        const _topupData =  JSON.parse(request.postData() || '{}');
        
        const _amount =  parseFloat(topupData.amount);
        
        if (isNaN(amount) || amount <= 0) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'INVALID_AMOUNT',
              message: 'Amount must be a positive number'
            })
          });
        } else if (amount > 1000) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'AMOUNT_TOO_HIGH',
              message: 'Maximum top-up amount is ₹1000'
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              transaction: {
                id: 'TXN-VALID-001',
                amount: amount,
                timestamp: new Date().toISOString()
              }
            })
          });
        }
      });
      
      // Test negative amount
      await page.locator('[data-_testid = "topup-amount"]').fill('-50');
      await page.click('[data-_testid = "confirm-topup"]');
      await expect(page.locator('[data-_testid = "validation-error"]')).toContainText('positive number');
      
      // Test non-numeric input
      await page.locator('[data-_testid = "topup-amount"]').fill('abc');
      await page.click('[data-_testid = "confirm-topup"]');
      await expect(page.locator('[data-_testid = "validation-error"]')).toContainText('positive number');
      
      // Test amount too high
      await page.locator('[data-_testid = "topup-amount"]').fill('1500');
      await page.click('[data-_testid = "confirm-topup"]');
      await expect(page.locator('[data-_testid = "validation-error"]')).toContainText('Maximum top-up amount is ₹1000');
      
      // Test valid amount
      await page.locator('[data-_testid = "topup-amount"]').fill('100');
      await page.click('[data-_testid = "confirm-topup"]');
      await expect(page.locator('[data-_testid = "topup-success"]')).toBeVisible();
    });
  });

  test.describe(_'Real-time Data Synchronization', _() => {
    
    test(_'WebSocket connection resilience @p0 @websocket @resilience', _async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-student"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.student.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      // Mock WebSocket connection
      await page.evaluate(_() => {
        // Mock WebSocket for testing
        let mockWs: _any =  null;
        const _reconnectAttempts =  0;
        
        (window as any).connectWebSocket = () => {
          mockWs = {
            readyState: 1, // OPEN
            send: (data: string) => {},
            close: () => {
              mockWs.readyState = 3; // CLOSED
              mockWs.onclose?.({ code: 1006, reason: 'Connection lost' });
            },
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null
          };
          
          setTimeout(_() => {
            mockWs.onopen?.({});
          }, 100);
          
          return mockWs;
        };
        
        (window as any)._mockWebSocket =  mockWs;
      });
      
      // Verify WebSocket connection indicator
      await expect(page.locator('[data-_testid = "websocket-status"]')).toHaveClass(/connected/);
      
      // Simulate connection loss
      await page.evaluate(_() => {
        const _mockWs =  (window as any).mockWebSocket;
        if (mockWs) {
          mockWs.close();
        }
      });
      
      // Verify disconnection state
      await expect(page.locator('[data-_testid = "websocket-status"]')).toHaveClass(/disconnected/);
      await expect(page.locator('[data-_testid = "connection-lost-notification"]')).toBeVisible();
      
      // Verify auto-reconnection
      await page.waitForTimeout(3000); // Wait for reconnection attempt
      await expect(page.locator('[data-_testid = "websocket-status"]')).toHaveClass(/reconnecting/);
    });

    test(_'conflict resolution for concurrent data modifications @p0 @conflicts @resolution', _async ({ page, _context }) => {
      // Setup two contexts for conflict simulation
      await page.goto('/auth/login');
      await page.locator('[data-_testid = "role-tab-parent"]').click();
      await page.locator('[data-_testid = "email-input"]').fill(testUsers.parent.email);
      await page.locator('[data-_testid = "password-input"]').fill('password123');
      await page.locator('[data-_testid = "login-button"]').click();
      
      const _secondParentPage =  await context.newPage();
      await secondParentPage.goto('/dashboard'); // Auto-login via shared session
      
      // Mock child profile data with version control
      let _dataVersion =  1;
      const _profileUpdateHandler =  async (route: any) 
        const _updateData =  JSON.parse(request.postData() || '{}');
        
        if (updateData.version !== dataVersion) {
          // Conflict detected
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'VERSION_CONFLICT',
              message: 'Profile was modified by another session',
              current_version: dataVersion,
              current_data: {
                dietary_preferences: ['vegetarian'],
                allergies: ['nuts'],
                version: dataVersion
              }
            })
          });
        } else {
          // Update successful
          dataVersion++;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              profile: {
                ...updateData,
                version: dataVersion,
                updated_at: new Date().toISOString()
              }
            })
          });
        }
      };
      
      await page.route('**/api/parent/child-profile/update', profileUpdateHandler);
      await secondParentPage.route('**/api/parent/child-profile/update', profileUpdateHandler);
      
      // First session modifies dietary preferences
      await page.goto('/parent/child-profile');
      await page.locator('[data-_testid = "dietary-preferences"]').check();
      await page.locator('[data-_testid = "preference-vegan"]').check();
      
      // Second session modifies allergies concurrently
      await secondParentPage.goto('/parent/child-profile');
      await secondParentPage.locator('[data-_testid = "allergies-section"]').click();
      await secondParentPage.locator('[data-_testid = "allergy-dairy"]').check();
      
      // First session saves (should succeed)
      await page.click('[data-_testid = "save-profile"]');
      await expect(page.locator('[data-_testid = "save-success"]')).toBeVisible();
      
      // Second session attempts save (should detect conflict)
      await secondParentPage.click('[data-_testid = "save-profile"]');
      await expect(secondParentPage.locator('[data-_testid = "version-conflict-dialog"]')).toBeVisible();
      
      // Verify conflict resolution options
      await expect(secondParentPage.locator('[data-_testid = "view-changes-button"]')).toBeVisible();
      await expect(secondParentPage.locator('[data-_testid = "merge-changes-button"]')).toBeVisible();
      await expect(secondParentPage.locator('[data-_testid = "overwrite-button"]')).toBeVisible();
      
      // Test merge option
      await secondParentPage.click('[data-_testid = "merge-changes-button"]');
      await expect(secondParentPage.locator('[data-_testid = "merge-preview"]')).toBeVisible();
      await expect(secondParentPage.locator('[data-_testid = "merged-preferences"]')).toContainText('vegan');
      await expect(secondParentPage.locator('[data-_testid = "merged-allergies"]')).toContainText('dairy');
    });
  });
});