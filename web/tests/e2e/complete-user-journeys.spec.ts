import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

/**
 * Complete User Journey Tests
 * End-to-end workflows covering full user experiences across all roles
 * These tests validate the complete HASIVU platform functionality
 */

test.describe(_'Complete User Journeys @smoke', _() => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let menuPage: MenuPage;

  test.beforeEach(_async ({ page }) => {
    _loginPage =  new LoginPage(page);
    _dashboardPage =  new DashboardPage(page);
    _menuPage =  new MenuPage(page);
  });

  test.describe(_'Student Complete Journey', _() => {
    test(_'student meal ordering journey - login to pickup @regression', _async ({ page }) => {
      // Step 1: Login as student
      await test.step(_'Login as student', _async () => {
        await loginPage.login('student@hasivu.test', 'Student123!', 'student');
        await expect(page).toHaveURL(/.*\/dashboard/);
        await dashboardPage.verifyWelcomeMessage('Test Student', 'student');
      });

      // Step 2: Check meal balance and today's menu
      await test.step(_'Review dashboard and meal balance', _async () => {
        await dashboardPage.verifyRoleSpecificElements('student');
        
        // Verify meal balance is sufficient
        const _balance =  page.locator('[data-testid
        await expect(balance).toBeVisible();
        const _balanceText =  await balance.textContent();
        expect(parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(50);
      });

      // Step 3: Navigate to menu and browse items
      await test.step(_'Browse menu and select items', _async () => {
        await dashboardPage.navigateToMenu();
        await menuPage.waitForPageLoad();

        // Search for specific item
        await menuPage.searchMenu('dal');
        await page.waitForTimeout(1000);

        // Verify search results
        const _searchResults =  page.locator('[data-testid
        await expect(searchResults).toHaveCountGreaterThan(0);

        // View nutritional information
        await menuPage.viewNutritionInfo('Dal Rice');
        await expect(page.locator('[data-_testid = "nutrition-modal"]')).toBeVisible();
        await page.keyboard.press('Escape'); // Close modal
      });

      // Step 4: Add items to cart and customize order
      await test.step(_'Add items to cart and customize', _async () => {
        // Clear search to see all items
        await menuPage.searchMenu('');
        await page.waitForTimeout(500);

        // Add multiple items to cart
        await menuPage.addItemToCart('Dal Rice', 1);
        await menuPage.addItemToCart('Sambar', 1);
        await menuPage.addItemToCart('Curd', 1);

        // Open cart and verify items
        await menuPage.openCart();
        const _cartItems =  page.locator('[data-testid
        await expect(cartItems).toHaveCount(3);

        // Verify total calculation
        const _cartTotal =  page.locator('[data-testid
        await expect(cartTotal).toBeVisible();
        const _totalAmount =  await cartTotal.textContent();
        expect(parseFloat(totalAmount?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(40);
      });

      // Step 5: Proceed to checkout and place order
      await test.step(_'Checkout and place order', _async () => {
        await menuPage.proceedToCheckout();
        await expect(page).toHaveURL(/.*\/orders/);
        
        // Mock order creation
        await page.route('**/orders', async _route = > {
          if (route.request().method() 
          }
        });

        // Confirm order placement
        const _confirmButton =  page.locator('[data-testid
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Verify order confirmation
        const _orderConfirmation =  page.locator('[data-testid
        await expect(orderConfirmation).toBeVisible();
        await expect(orderConfirmation).toContainText('ORD-JOURNEY-001');
      });

      // Step 6: Track order status
      await test.step(_'Track order preparation', _async () => {
        // Mock order status updates
        await page.route('**/orders/*/status', async _route = > {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-JOURNEY-001',
              status: 'preparing',
              progress: 60,
              estimated_completion: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
              kitchen_notes: 'Order is being prepared fresh'
            })
          });
        });

        // Check order tracking
        const _trackingSection =  page.locator('[data-testid
        await expect(trackingSection).toBeVisible();
        await expect(trackingSection).toContainText('preparing');
      });

      // Step 7: Simulate order ready notification
      await test.step(_'Receive order ready notification', _async () => {
        // Simulate order ready status update
        await page.evaluate(_() => {
          const _event =  new CustomEvent('order-status-update', {
            detail: {
              order_id: 'ORD-JOURNEY-001',
              status: 'ready',
              notification_message: 'Your order is ready for pickup!'
            }
          });
          window.dispatchEvent(event);
        });

        // Verify notification appears
        const _readyNotification =  page.locator('[data-testid
        await expect(readyNotification).toBeVisible();
        await expect(readyNotification).toContainText('ready for pickup');
      });

      // Step 8: Verify updated meal balance
      await test.step(_'Verify meal balance deduction', _async () => {
        await page.goto('/dashboard');
        await dashboardPage.waitForPageLoad();

        const _updatedBalance =  page.locator('[data-testid
        await expect(updatedBalance).toBeVisible();
        const _newBalanceText =  await updatedBalance.textContent();
        const _newBalance =  parseFloat(newBalanceText?.replace(/[^\d.]/g, '') || '0');
        
        // Balance should be reduced by order amount (original 150 - _50 =  100)
        expect(newBalance).toBeLessThan(150);
        expect(newBalance).toBeGreaterThanOrEqual(100);
      });
    });

    test(_'student RFID quick order journey @smoke', _async ({ page }) => {
      // Login as student
      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Navigate to menu for RFID ordering
      await dashboardPage.navigateToMenu();
      await menuPage.waitForPageLoad();

      // Mock RFID scan with preset order
      await page.route('**/rfid/scan', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student_id: 'STU-12345',
            preset_order: {
              id: 'preset-1',
              name: 'Daily Lunch',
              items: [
                { name: 'Dal Rice', quantity: 1, price: 25.00 },
                { name: 'Sambar', quantity: 1, price: 15.00 },
                { name: 'Curd', quantity: 1, price: 10.00 }
              ],
              total: 50.00
            }
          })
        });
      });

      // Simulate RFID card tap
      await page.evaluate(_() => {
        const _event =  new CustomEvent('rfid-scan', {
          detail: {
            student_id: 'STU-12345',
            rfid_id: 'RFID-STU-12345'
          }
        });
        window.dispatchEvent(event);
      });

      // Verify RFID quick order flow
      const _quickOrderNotification =  page.locator('[data-testid
      await expect(quickOrderNotification).toBeVisible();
      await expect(quickOrderNotification).toContainText('Daily Lunch');

      // Confirm quick order
      const _confirmQuickOrder =  page.locator('[data-testid
      await confirmQuickOrder.click();

      // Mock order creation
      await page.route('**/orders', async _route = > {
        if (route.request().method() 
        }
      });

      // Verify order confirmation
      const _orderConfirmation =  page.locator('[data-testid
      await expect(orderConfirmation).toBeVisible();
      await expect(orderConfirmation).toContainText('ORD-RFID-JOURNEY-001');
    });
  });

  test.describe(_'Parent Complete Journey', _() => {
    test(_'parent monitoring and payment journey @regression', _async ({ page }) => {
      // Step 1: Login as parent
      await test.step(_'Login as parent', _async () => {
        await loginPage.login('parent@hasivu.test', 'Parent123!', 'parent');
        await expect(page).toHaveURL(/.*\/dashboard/);
        await dashboardPage.verifyWelcomeMessage('Test Parent', 'parent');
      });

      // Step 2: View children's meal activity
      await test.step(_'Monitor children meal activity', _async () => {
        await dashboardPage.verifyRoleSpecificElements('parent');

        // Mock children's meal data
        await page.route('**/parent/children/meals', async _route = > {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              children: [
                {
                  id: 'STU-001',
                  name: 'Child One',
                  today_meals: [
                    { time: '08:30', meal: 'Breakfast - Idli', calories: 150 },
                    { time: '12:30', meal: 'Lunch - Dal Rice', calories: 320 }
                  ],
                  weekly_nutrition: {
                    calories: 1850,
                    protein: 75,
                    vegetables: 14
                  }
                }
              ]
            })
          });
        });

        // Select child to monitor
        const _childSelector =  page.locator('[data-testid
        await expect(childSelector).toBeVisible();
        await childSelector.selectOption('STU-001');

        // Verify nutrition report
        const _nutritionReport =  page.locator('[data-testid
        await expect(nutritionReport).toBeVisible();
        await expect(nutritionReport).toContainText('1850'); // Calories
      });

      // Step 3: Add funds to child's meal account
      await test.step(_'Add funds to child account', _async () => {
        const _addFundsButton =  page.locator('[data-testid
        await addFundsButton.click();

        // Payment modal should appear
        const _paymentModal =  page.locator('[data-testid
        await expect(paymentModal).toBeVisible();

        // Select payment amount
        const _amountInput =  page.locator('[data-testid
        await amountInput.fill('100');

        // Mock payment processing
        await page.route('**/payments/process', async _route = > {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              payment_id: 'PAY-001',
              status: 'success',
              amount: 100.00,
              new_balance: 250.00
            })
          });
        });

        // Process payment
        const _processPaymentButton =  page.locator('[data-testid
        await processPaymentButton.click();

        // Verify payment success
        const _paymentSuccess =  page.locator('[data-testid
        await expect(paymentSuccess).toBeVisible();
        await expect(paymentSuccess).toContainText('₹100');
      });

      // Step 4: Set dietary preferences for child
      await test.step(_'Update child dietary preferences', _async () => {
        const _preferencesButton =  page.locator('[data-testid
        await preferencesButton.click();

        // Select dietary restrictions
        await page.locator('[data-_testid = "pref-vegetarian"]').check();
        await page.locator('[data-_testid = "pref-no-nuts"]').check();

        // Save preferences
        const _savePrefsButton =  page.locator('[data-testid
        await savePrefsButton.click();

        // Verify success message
        const _prefsSuccess =  page.locator('[data-testid
        await expect(prefsSuccess).toBeVisible();
      });

      // Step 5: Review payment history
      await test.step(_'Review payment history', _async () => {
        const _paymentHistory =  page.locator('[data-testid
        await expect(paymentHistory).toBeVisible();

        // Mock payment history data
        await page.route('**/parent/payments/history', async _route = > {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              payments: [
                {
                  id: 'PAY-001',
                  date: new Date().toISOString(),
                  amount: 100.00,
                  type: 'meal_credit',
                  status: 'completed'
                }
              ]
            })
          });
        });

        // Verify payment appears in history
        const _latestPayment =  page.locator('[data-testid
        await expect(latestPayment).toContainText('₹100');
        await expect(latestPayment).toContainText('completed');
      });
    });
  });

  test.describe(_'Admin Complete Journey', _() => {
    test(_'admin system management journey @smoke', _async ({ page }) => {
      // Login as admin
      await loginPage.login('admin@hasivu.test', 'Admin123!', 'admin');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify admin dashboard
      await dashboardPage.verifyRoleSpecificElements('admin');

      // Mock admin system data
      await page.route('**/admin/system-stats', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            stats: {
              total_students: 1250,
              active_today: 856,
              total_orders: 45600,
              system_health: 'good',
              rfid_readers_online: 15,
              average_meal_rating: 4.3
            },
            alerts: [
              { level: 'warning', message: 'Kitchen inventory low: Rice (5kg remaining)' }
            ]
          })
        });
      });

      // Review system statistics
      const _systemStats =  page.locator('[data-testid
      await expect(systemStats).toBeVisible();
      await expect(systemStats).toContainText('1250'); // Total students

      // Check system alerts
      const _alerts =  page.locator('[data-testid
      await expect(alerts).toBeVisible();
      await expect(alerts).toContainText('Rice (5kg remaining)');

      // Navigate to user management
      const _userManagement =  page.locator('[data-testid
      await userManagement.click();

      // Verify user management interface loaded
      await expect(page).toHaveURL(/.*\/admin\/users/);
      const _userList =  page.locator('[data-testid
      await expect(userList).toBeVisible();
    });
  });

  test.describe(_'Kitchen Staff Complete Journey', _() => {
    test(_'kitchen order processing journey @regression', _async ({ page }) => {
      // Login as kitchen staff
      await loginPage.login('kitchen@hasivu.test', 'Kitchen123!', 'kitchen');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify kitchen dashboard
      await dashboardPage.verifyRoleSpecificElements('kitchen');

      // Mock active orders
      await page.route('**/kitchen/orders/active', async _route = > {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orders: [
              {
                id: 'ORD-KITCHEN-001',
                student_name: 'Test Student A',
                items: [
                  { name: 'Dal Rice', quantity: 1, special_instructions: 'Less salt' }
                ],
                order_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                priority: 'normal'
              }
            ]
          })
        });
      });

      // Verify active orders display
      const _activeOrders =  page.locator('[data-testid
      await expect(activeOrders).toBeVisible();
      
      const _orderItem =  page.locator('[data-testid
      await expect(orderItem).toContainText('ORD-KITCHEN-001');
      await expect(orderItem).toContainText('Less salt');

      // Mark order as ready
      const _markReadyButton =  orderItem.locator('[data-testid
      await markReadyButton.click();

      // Mock order status update
      await page.route('**/kitchen/orders/*/ready', async _route = > {
        if (route.request().method() 
        }
      });

      // Verify order moved to ready section
      const _readyOrders =  page.locator('[data-testid
      await expect(readyOrders).toBeVisible();
      await expect(readyOrders).toContainText('ORD-KITCHEN-001');
    });
  });

  test.describe(_'Cross-Role Integration', _() => {
    test(_'complete meal cycle - student order to kitchen fulfillment @smoke', _async ({ page, _context }) => {
      // Create second page for kitchen staff
      const _kitchenPage =  await context.newPage();
      
      // Step 1: Student places order
      await test.step(_'Student places order', _async () => {
        await loginPage.login('student@hasivu.test', 'Student123!', 'student');
        await dashboardPage.navigateToMenu();
        await menuPage.addItemToCart('Dal Rice', 1);
        await menuPage.proceedToCheckout();

        // Mock order creation with shared ID
        await page.route('**/orders', async _route = > {
          if (route.request().method() 
          }
        });

        const _confirmButton =  page.locator('[data-testid
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      });

      // Step 2: Kitchen staff receives and processes order
      await test.step(_'Kitchen staff processes order', _async () => {
        const _kitchenLogin =  new LoginPage(kitchenPage);
        const _kitchenDashboard =  new DashboardPage(kitchenPage);

        await kitchenLogin.login('kitchen@hasivu.test', 'Kitchen123!', 'kitchen');
        
        // Mock the same order appearing in kitchen queue
        await kitchenPage.route('**/kitchen/orders/active', async _route = > {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              orders: [{
                id: 'ORD-INTEGRATION-001',
                student_name: 'Test Student',
                items: [{ name: 'Dal Rice', quantity: 1 }],
                status: 'preparing'
              }]
            })
          });
        });

        await kitchenDashboard.waitForPageLoad();
        
        // Verify order appears in kitchen
        const _kitchenOrder =  kitchenPage.locator('[data-testid
        await expect(kitchenOrder).toContainText('ORD-INTEGRATION-001');
      });

      // Step 3: Verify order status updates reach student
      await test.step(_'Student receives order status updates', _async () => {
        // Simulate order ready status update on student side
        await page.evaluate(_() => {
          const _event =  new CustomEvent('order-status-update', {
            detail: {
              order_id: 'ORD-INTEGRATION-001',
              status: 'ready'
            }
          });
          window.dispatchEvent(event);
        });

        // Navigate to orders page to check status
        await page.goto('/orders');
        const _orderStatus =  page.locator('[data-testid
        await expect(orderStatus).toContainText('ready');
      });

      await kitchenPage.close();
    });
  });

  test.describe(_'Error Handling and Edge Cases', _() => {
    test(_'handles network failures gracefully @smoke', _async ({ page }) => {
      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await dashboardPage.navigateToMenu();

      // Simulate network failure during order placement
      await page.route('**/orders', _route = > route.abort('failed'));

      await menuPage.addItemToCart('Dal Rice', 1);
      await menuPage.proceedToCheckout();

      const _confirmButton =  page.locator('[data-testid
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show network error message
      const _errorMessage =  page.locator('[data-testid
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/network|connection|offline/i);
    });

    test(_'handles insufficient balance scenario @regression', _async ({ page }) => {
      // Mock student with low balance
      await page.route('**/auth/login', async _route = > {
        const request 
        const _postData =  JSON.parse(request.postData() || '{}');
        
        if (postData._email = 
        }
      });

      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await dashboardPage.navigateToMenu();
      await menuPage.addItemToCart('Dal Rice', 2); // ₹50 order but only ₹10 balance

      await menuPage.proceedToCheckout();

      // Mock insufficient funds error
      await page.route('**/orders', async _route = > {
        if (route.request().method() 
        }
      });

      const _confirmButton =  page.locator('[data-testid
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show insufficient balance error
      const _balanceError =  page.locator('[data-testid
      await expect(balanceError).toBeVisible();
      await expect(balanceError).toContainText('Insufficient balance');
      
      // Should suggest adding funds
      const _addFundsButton =  page.locator('[data-testid
      await expect(addFundsButton).toBeVisible();
    });
  });
});