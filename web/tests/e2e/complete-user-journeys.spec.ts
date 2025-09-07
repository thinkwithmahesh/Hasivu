import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

/**
 * Complete User Journey Tests
 * End-to-end workflows covering full user experiences across all roles
 * These tests validate the complete HASIVU platform functionality
 */

test.describe('Complete User Journeys @smoke', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    menuPage = new MenuPage(page);
  });

  test.describe('Student Complete Journey', () => {
    test('student meal ordering journey - login to pickup @regression', async ({ page }) => {
      // Step 1: Login as student
      await test.step('Login as student', async () => {
        await loginPage.login('student@hasivu.test', 'Student123!', 'student');
        await expect(page).toHaveURL(/.*\/dashboard/);
        await dashboardPage.verifyWelcomeMessage('Test Student', 'student');
      });

      // Step 2: Check meal balance and today's menu
      await test.step('Review dashboard and meal balance', async () => {
        await dashboardPage.verifyRoleSpecificElements('student');
        
        // Verify meal balance is sufficient
        const balance = page.locator('[data-testid="meal-balance"]');
        await expect(balance).toBeVisible();
        const balanceText = await balance.textContent();
        expect(parseFloat(balanceText?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(50);
      });

      // Step 3: Navigate to menu and browse items
      await test.step('Browse menu and select items', async () => {
        await dashboardPage.navigateToMenu();
        await menuPage.waitForPageLoad();

        // Search for specific item
        await menuPage.searchMenu('dal');
        await page.waitForTimeout(1000);

        // Verify search results
        const searchResults = page.locator('[data-testid="menu-item"]');
        await expect(searchResults).toHaveCountGreaterThan(0);

        // View nutritional information
        await menuPage.viewNutritionInfo('Dal Rice');
        await expect(page.locator('[data-testid="nutrition-modal"]')).toBeVisible();
        await page.keyboard.press('Escape'); // Close modal
      });

      // Step 4: Add items to cart and customize order
      await test.step('Add items to cart and customize', async () => {
        // Clear search to see all items
        await menuPage.searchMenu('');
        await page.waitForTimeout(500);

        // Add multiple items to cart
        await menuPage.addItemToCart('Dal Rice', 1);
        await menuPage.addItemToCart('Sambar', 1);
        await menuPage.addItemToCart('Curd', 1);

        // Open cart and verify items
        await menuPage.openCart();
        const cartItems = page.locator('[data-testid="cart-item"]');
        await expect(cartItems).toHaveCount(3);

        // Verify total calculation
        const cartTotal = page.locator('[data-testid="cart-total"]');
        await expect(cartTotal).toBeVisible();
        const totalAmount = await cartTotal.textContent();
        expect(parseFloat(totalAmount?.replace(/[^\d.]/g, '') || '0')).toBeGreaterThan(40);
      });

      // Step 5: Proceed to checkout and place order
      await test.step('Checkout and place order', async () => {
        await menuPage.proceedToCheckout();
        await expect(page).toHaveURL(/.*\/orders/);
        
        // Mock order creation
        await page.route('**/orders', async route => {
          if (route.request().method() === 'POST') {
            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({
                order_id: 'ORD-JOURNEY-001',
                status: 'confirmed',
                items: [
                  { name: 'Dal Rice', quantity: 1, price: 25.00 },
                  { name: 'Sambar', quantity: 1, price: 15.00 },
                  { name: 'Curd', quantity: 1, price: 10.00 }
                ],
                total: 50.00,
                estimated_time: '15 minutes',
                pickup_location: 'Kitchen Counter'
              })
            });
          }
        });

        // Confirm order placement
        const confirmButton = page.locator('[data-testid="confirm-order"]');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Verify order confirmation
        const orderConfirmation = page.locator('[data-testid="order-confirmation"]');
        await expect(orderConfirmation).toBeVisible();
        await expect(orderConfirmation).toContainText('ORD-JOURNEY-001');
      });

      // Step 6: Track order status
      await test.step('Track order preparation', async () => {
        // Mock order status updates
        await page.route('**/orders/*/status', async route => {
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
        const trackingSection = page.locator('[data-testid="order-tracking"]');
        await expect(trackingSection).toBeVisible();
        await expect(trackingSection).toContainText('preparing');
      });

      // Step 7: Simulate order ready notification
      await test.step('Receive order ready notification', async () => {
        // Simulate order ready status update
        await page.evaluate(() => {
          const event = new CustomEvent('order-status-update', {
            detail: {
              order_id: 'ORD-JOURNEY-001',
              status: 'ready',
              notification_message: 'Your order is ready for pickup!'
            }
          });
          window.dispatchEvent(event);
        });

        // Verify notification appears
        const readyNotification = page.locator('[data-testid="order-ready-notification"]');
        await expect(readyNotification).toBeVisible();
        await expect(readyNotification).toContainText('ready for pickup');
      });

      // Step 8: Verify updated meal balance
      await test.step('Verify meal balance deduction', async () => {
        await page.goto('/dashboard');
        await dashboardPage.waitForPageLoad();

        const updatedBalance = page.locator('[data-testid="meal-balance"]');
        await expect(updatedBalance).toBeVisible();
        const newBalanceText = await updatedBalance.textContent();
        const newBalance = parseFloat(newBalanceText?.replace(/[^\d.]/g, '') || '0');
        
        // Balance should be reduced by order amount (original 150 - 50 = 100)
        expect(newBalance).toBeLessThan(150);
        expect(newBalance).toBeGreaterThanOrEqual(100);
      });
    });

    test('student RFID quick order journey @smoke', async ({ page }) => {
      // Login as student
      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Navigate to menu for RFID ordering
      await dashboardPage.navigateToMenu();
      await menuPage.waitForPageLoad();

      // Mock RFID scan with preset order
      await page.route('**/rfid/scan', async route => {
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
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-scan', {
          detail: {
            student_id: 'STU-12345',
            rfid_id: 'RFID-STU-12345'
          }
        });
        window.dispatchEvent(event);
      });

      // Verify RFID quick order flow
      const quickOrderNotification = page.locator('[data-testid="quick-order-notification"]');
      await expect(quickOrderNotification).toBeVisible();
      await expect(quickOrderNotification).toContainText('Daily Lunch');

      // Confirm quick order
      const confirmQuickOrder = page.locator('[data-testid="confirm-quick-order"]');
      await confirmQuickOrder.click();

      // Mock order creation
      await page.route('**/orders', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-RFID-JOURNEY-001',
              status: 'confirmed',
              payment_method: 'rfid_wallet',
              total: 50.00
            })
          });
        }
      });

      // Verify order confirmation
      const orderConfirmation = page.locator('[data-testid="order-confirmation"]');
      await expect(orderConfirmation).toBeVisible();
      await expect(orderConfirmation).toContainText('ORD-RFID-JOURNEY-001');
    });
  });

  test.describe('Parent Complete Journey', () => {
    test('parent monitoring and payment journey @regression', async ({ page }) => {
      // Step 1: Login as parent
      await test.step('Login as parent', async () => {
        await loginPage.login('parent@hasivu.test', 'Parent123!', 'parent');
        await expect(page).toHaveURL(/.*\/dashboard/);
        await dashboardPage.verifyWelcomeMessage('Test Parent', 'parent');
      });

      // Step 2: View children's meal activity
      await test.step('Monitor children meal activity', async () => {
        await dashboardPage.verifyRoleSpecificElements('parent');

        // Mock children's meal data
        await page.route('**/parent/children/meals', async route => {
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
        const childSelector = page.locator('[data-testid="child-selector"]');
        await expect(childSelector).toBeVisible();
        await childSelector.selectOption('STU-001');

        // Verify nutrition report
        const nutritionReport = page.locator('[data-testid="nutrition-report"]');
        await expect(nutritionReport).toBeVisible();
        await expect(nutritionReport).toContainText('1850'); // Calories
      });

      // Step 3: Add funds to child's meal account
      await test.step('Add funds to child account', async () => {
        const addFundsButton = page.locator('[data-testid="add-funds-button"]');
        await addFundsButton.click();

        // Payment modal should appear
        const paymentModal = page.locator('[data-testid="payment-modal"]');
        await expect(paymentModal).toBeVisible();

        // Select payment amount
        const amountInput = page.locator('[data-testid="payment-amount"]');
        await amountInput.fill('100');

        // Mock payment processing
        await page.route('**/payments/process', async route => {
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
        const processPaymentButton = page.locator('[data-testid="process-payment"]');
        await processPaymentButton.click();

        // Verify payment success
        const paymentSuccess = page.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible();
        await expect(paymentSuccess).toContainText('₹100');
      });

      // Step 4: Set dietary preferences for child
      await test.step('Update child dietary preferences', async () => {
        const preferencesButton = page.locator('[data-testid="dietary-preferences"]');
        await preferencesButton.click();

        // Select dietary restrictions
        await page.locator('[data-testid="pref-vegetarian"]').check();
        await page.locator('[data-testid="pref-no-nuts"]').check();

        // Save preferences
        const savePrefsButton = page.locator('[data-testid="save-preferences"]');
        await savePrefsButton.click();

        // Verify success message
        const prefsSuccess = page.locator('[data-testid="preferences-success"]');
        await expect(prefsSuccess).toBeVisible();
      });

      // Step 5: Review payment history
      await test.step('Review payment history', async () => {
        const paymentHistory = page.locator('[data-testid="payment-history"]');
        await expect(paymentHistory).toBeVisible();

        // Mock payment history data
        await page.route('**/parent/payments/history', async route => {
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
        const latestPayment = page.locator('[data-testid="payment-item"]').first();
        await expect(latestPayment).toContainText('₹100');
        await expect(latestPayment).toContainText('completed');
      });
    });
  });

  test.describe('Admin Complete Journey', () => {
    test('admin system management journey @smoke', async ({ page }) => {
      // Login as admin
      await loginPage.login('admin@hasivu.test', 'Admin123!', 'admin');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify admin dashboard
      await dashboardPage.verifyRoleSpecificElements('admin');

      // Mock admin system data
      await page.route('**/admin/system-stats', async route => {
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
      const systemStats = page.locator('[data-testid="system-stats"]');
      await expect(systemStats).toBeVisible();
      await expect(systemStats).toContainText('1250'); // Total students

      // Check system alerts
      const alerts = page.locator('[data-testid="system-alerts"]');
      await expect(alerts).toBeVisible();
      await expect(alerts).toContainText('Rice (5kg remaining)');

      // Navigate to user management
      const userManagement = page.locator('[data-testid="user-management"]');
      await userManagement.click();

      // Verify user management interface loaded
      await expect(page).toHaveURL(/.*\/admin\/users/);
      const userList = page.locator('[data-testid="user-list"]');
      await expect(userList).toBeVisible();
    });
  });

  test.describe('Kitchen Staff Complete Journey', () => {
    test('kitchen order processing journey @regression', async ({ page }) => {
      // Login as kitchen staff
      await loginPage.login('kitchen@hasivu.test', 'Kitchen123!', 'kitchen');
      await expect(page).toHaveURL(/.*\/dashboard/);

      // Verify kitchen dashboard
      await dashboardPage.verifyRoleSpecificElements('kitchen');

      // Mock active orders
      await page.route('**/kitchen/orders/active', async route => {
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
      const activeOrders = page.locator('[data-testid="active-orders"]');
      await expect(activeOrders).toBeVisible();
      
      const orderItem = page.locator('[data-testid="order-item"]').first();
      await expect(orderItem).toContainText('ORD-KITCHEN-001');
      await expect(orderItem).toContainText('Less salt');

      // Mark order as ready
      const markReadyButton = orderItem.locator('[data-testid="mark-ready"]');
      await markReadyButton.click();

      // Mock order status update
      await page.route('**/kitchen/orders/*/ready', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-KITCHEN-001',
              status: 'ready',
              ready_time: new Date().toISOString()
            })
          });
        }
      });

      // Verify order moved to ready section
      const readyOrders = page.locator('[data-testid="ready-orders"]');
      await expect(readyOrders).toBeVisible();
      await expect(readyOrders).toContainText('ORD-KITCHEN-001');
    });
  });

  test.describe('Cross-Role Integration', () => {
    test('complete meal cycle - student order to kitchen fulfillment @smoke', async ({ page, context }) => {
      // Create second page for kitchen staff
      const kitchenPage = await context.newPage();
      
      // Step 1: Student places order
      await test.step('Student places order', async () => {
        await loginPage.login('student@hasivu.test', 'Student123!', 'student');
        await dashboardPage.navigateToMenu();
        await menuPage.addItemToCart('Dal Rice', 1);
        await menuPage.proceedToCheckout();

        // Mock order creation with shared ID
        await page.route('**/orders', async route => {
          if (route.request().method() === 'POST') {
            await route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({
                order_id: 'ORD-INTEGRATION-001',
                status: 'confirmed'
              })
            });
          }
        });

        const confirmButton = page.locator('[data-testid="confirm-order"]');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      });

      // Step 2: Kitchen staff receives and processes order
      await test.step('Kitchen staff processes order', async () => {
        const kitchenLogin = new LoginPage(kitchenPage);
        const kitchenDashboard = new DashboardPage(kitchenPage);

        await kitchenLogin.login('kitchen@hasivu.test', 'Kitchen123!', 'kitchen');
        
        // Mock the same order appearing in kitchen queue
        await kitchenPage.route('**/kitchen/orders/active', async route => {
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
        const kitchenOrder = kitchenPage.locator('[data-testid="order-item"]');
        await expect(kitchenOrder).toContainText('ORD-INTEGRATION-001');
      });

      // Step 3: Verify order status updates reach student
      await test.step('Student receives order status updates', async () => {
        // Simulate order ready status update on student side
        await page.evaluate(() => {
          const event = new CustomEvent('order-status-update', {
            detail: {
              order_id: 'ORD-INTEGRATION-001',
              status: 'ready'
            }
          });
          window.dispatchEvent(event);
        });

        // Navigate to orders page to check status
        await page.goto('/orders');
        const orderStatus = page.locator('[data-testid="order-status"]');
        await expect(orderStatus).toContainText('ready');
      });

      await kitchenPage.close();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('handles network failures gracefully @smoke', async ({ page }) => {
      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await dashboardPage.navigateToMenu();

      // Simulate network failure during order placement
      await page.route('**/orders', route => route.abort('failed'));

      await menuPage.addItemToCart('Dal Rice', 1);
      await menuPage.proceedToCheckout();

      const confirmButton = page.locator('[data-testid="confirm-order"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show network error message
      const errorMessage = page.locator('[data-testid="network-error"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/network|connection|offline/i);
    });

    test('handles insufficient balance scenario @regression', async ({ page }) => {
      // Mock student with low balance
      await page.route('**/auth/login', async route => {
        const request = route.request();
        const postData = JSON.parse(request.postData() || '{}');
        
        if (postData.email === 'student@hasivu.test') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: {
                id: 'STU-001',
                email: 'student@hasivu.test',
                name: 'Test Student',
                role: 'student',
                meal_balance: 10.00 // Very low balance
              },
              token: 'mock-student-jwt-token'
            })
          });
        }
      });

      await loginPage.login('student@hasivu.test', 'Student123!', 'student');
      await dashboardPage.navigateToMenu();
      await menuPage.addItemToCart('Dal Rice', 2); // ₹50 order but only ₹10 balance

      await menuPage.proceedToCheckout();

      // Mock insufficient funds error
      await page.route('**/orders', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'insufficient_balance',
              message: 'Insufficient meal balance',
              current_balance: 10.00,
              required_amount: 50.00
            })
          });
        }
      });

      const confirmButton = page.locator('[data-testid="confirm-order"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should show insufficient balance error
      const balanceError = page.locator('[data-testid="insufficient-balance-error"]');
      await expect(balanceError).toBeVisible();
      await expect(balanceError).toContainText('Insufficient balance');
      
      // Should suggest adding funds
      const addFundsButton = page.locator('[data-testid="add-funds-suggestion"]');
      await expect(addFundsButton).toBeVisible();
    });
  });
});