import { test, expect, Page } from '@playwright/test';

/**
 * P0 Critical Order Lifecycle E2E Tests for HASIVU Platform
 * 
 * Tests the complete order workflow: creation → payment → fulfillment → tracking → delivery
 * This is a revenue-critical flow that must work perfectly for business operation
 * 
 * Covers:
 * - Order creation with menu selection and customization
 * - Payment processing (Razorpay, Stripe, RFID wallet)  
 * - Kitchen fulfillment workflow
 * - Real-time order tracking
 * - Delivery confirmation and ratings
 * - Parent/Student coordination for orders
 * - Refund and cancellation flows
 */

test.describe('P0 Critical Order Lifecycle Tests @critical @p0 @orders', () => {
  
  // Test data setup
  const testUser = {
    student: {
      id: 'STU-001',
      email: 'student@hasivu.test',
      name: 'Test Student',
      meal_balance: 150.00,
      rfid_card: 'RFID-STU-001'
    },
    parent: {
      id: 'PAR-001', 
      email: 'parent@hasivu.test',
      name: 'Test Parent',
      wallet_balance: 500.00,
      children: ['STU-001']
    },
    kitchen: {
      id: 'KIT-001',
      email: 'kitchen@hasivu.test',
      name: 'Kitchen Staff',
      station: 'main_kitchen'
    }
  };

  const testMenu = {
    breakfast: {
      id: 'MENU-001',
      name: 'South Indian Breakfast',
      price: 45.00,
      items: [
        { id: 'ITEM-001', name: 'Idli (3 pcs)', customizable: true },
        { id: 'ITEM-002', name: 'Sambar', customizable: false },
        { id: 'ITEM-003', name: 'Coconut Chutney', customizable: false }
      ],
      available_time: '07:00-10:00',
      preparation_time: 15
    }
  };

  test.beforeEach(async ({ page }) => {
    // Mock authentication API
    await page.route('**/auth/login', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      let responseData;
      if (postData.role === 'student') {
        responseData = {
          success: true,
          user: testUser.student,
          token: 'mock-student-jwt-token'
        };
      } else if (postData.role === 'parent') {
        responseData = {
          success: true,
          user: testUser.parent,
          token: 'mock-parent-jwt-token'
        };
      } else if (postData.role === 'kitchen') {
        responseData = {
          success: true,
          user: testUser.kitchen,
          token: 'mock-kitchen-jwt-token'
        };
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      });
    });

    // Mock menu API
    await page.route('**/api/menu/today', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          menu: [testMenu.breakfast],
          date: new Date().toISOString().split('T')[0]
        })
      });
    });
  });

  test.describe('Complete Order Flow - Student Initiated', () => {
    
    test('student complete order lifecycle @p0 @smoke @student', async ({ page }) => {
      // 1. STUDENT LOGIN
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for dashboard
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="meal-balance"]')).toContainText('₹150.00');

      // 2. ORDER CREATION - Browse menu and create order
      await page.click('[data-testid="order-meal-button"]');
      await expect(page.locator('[data-testid="today-menu"]')).toBeVisible();
      
      // Select breakfast
      const breakfastCard = page.locator('[data-testid="menu-card-MENU-001"]');
      await expect(breakfastCard).toBeVisible();
      await expect(breakfastCard.locator('[data-testid="menu-name"]')).toContainText('South Indian Breakfast');
      await expect(breakfastCard.locator('[data-testid="menu-price"]')).toContainText('₹45.00');
      
      await breakfastCard.locator('[data-testid="add-to-cart-button"]').click();
      
      // Customize order
      await expect(page.locator('[data-testid="customization-modal"]')).toBeVisible();
      await page.locator('[data-testid="idli-quantity"]').fill('4'); // Extra idli
      await page.locator('[data-testid="spice-level-medium"]').check();
      await page.locator('[data-testid="special-instructions"]').fill('Extra sambar please');
      await page.locator('[data-testid="confirm-customization"]').click();
      
      // Verify cart
      await expect(page.locator('[data-testid="cart-items"]')).toContainText('1');
      await expect(page.locator('[data-testid="cart-total"]')).toContainText('₹50.00'); // +₹5 for extra idli
      
      await page.click('[data-testid="proceed-to-checkout"]');

      // 3. PAYMENT PROCESSING
      await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-summary"]')).toContainText('South Indian Breakfast');
      await expect(page.locator('[data-testid="total-amount"]')).toContainText('₹50.00');
      
      // Mock order creation API
      await page.route('**/api/orders/create', async route => {
        const request = route.request();
        const orderData = JSON.parse(request.postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-12345',
              student_id: testUser.student.id,
              items: orderData.items,
              total_amount: 50.00,
              status: 'pending_payment',
              created_at: new Date().toISOString(),
              delivery_time: new Date(Date.now() + 30 * 60000).toISOString(), // 30 mins
              customizations: {
                idli_quantity: 4,
                spice_level: 'medium',
                special_instructions: 'Extra sambar please'
              }
            }
          })
        });
      });
      
      // Mock RFID wallet payment
      await page.route('**/api/payments/rfid-wallet/charge', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transaction_id: 'TXN-RFID-789',
            order_id: 'ORD-12345',
            amount: 50.00,
            remaining_balance: 100.00, // ₹150 - ₹50
            status: 'completed',
            timestamp: new Date().toISOString()
          })
        });
      });
      
      // Select RFID wallet payment
      await page.locator('[data-testid="payment-method-rfid"]').check();
      await page.locator('[data-testid="confirm-payment-button"]').click();
      
      // Verify payment success
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-id"]')).toContainText('ORD-12345');
      await expect(page.locator('[data-testid="updated-balance"]')).toContainText('₹100.00');
      
      // 4. ORDER CONFIRMATION & TRACKING
      await page.click('[data-testid="track-order-button"]');
      await expect(page.locator('[data-testid="order-tracking"]')).toBeVisible();
      
      // Mock order status API for real-time tracking
      await page.route('**/api/orders/ORD-12345/status', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-12345',
              status: 'confirmed',
              estimated_delivery: new Date(Date.now() + 25 * 60000).toISOString(), // 25 mins
              current_stage: 'payment_confirmed',
              tracking_stages: [
                { stage: 'order_placed', completed: true, timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
                { stage: 'payment_confirmed', completed: true, timestamp: new Date().toISOString() },
                { stage: 'kitchen_accepted', completed: false, timestamp: null },
                { stage: 'preparing', completed: false, timestamp: null },
                { stage: 'ready_for_pickup', completed: false, timestamp: null },
                { stage: 'delivered', completed: false, timestamp: null }
              ]
            }
          })
        });
      });
      
      // Verify order status
      await expect(page.locator('[data-testid="order-status"]')).toContainText('confirmed');
      await expect(page.locator('[data-testid="estimated-delivery"]')).toContainText('25');
      await expect(page.locator('[data-testid="stage-payment_confirmed"]')).toHaveClass(/completed/);
      await expect(page.locator('[data-testid="stage-kitchen_accepted"]')).toHaveClass(/pending/);
      
      // Store order ID for kitchen workflow test
      await page.evaluate(() => {
        sessionStorage.setItem('test_order_id', 'ORD-12345');
      });
    });

    test('kitchen fulfillment workflow @p0 @kitchen @fulfillment', async ({ page }) => {
      // 5. KITCHEN FULFILLMENT WORKFLOW
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-kitchen"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.kitchen.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Wait for kitchen dashboard
      await expect(page.locator('[data-testid="kitchen-dashboard"]')).toBeVisible();
      
      // Mock pending orders API
      await page.route('**/api/kitchen/orders/pending', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            orders: [
              {
                id: 'ORD-12345',
                student_name: testUser.student.name,
                items: [
                  {
                    name: 'South Indian Breakfast',
                    customizations: {
                      idli_quantity: 4,
                      spice_level: 'medium',
                      special_instructions: 'Extra sambar please'
                    }
                  }
                ],
                order_time: new Date(Date.now() - 5 * 60000).toISOString(),
                estimated_prep_time: 15,
                priority: 'normal'
              }
            ]
          })
        });
      });
      
      // View pending orders
      await expect(page.locator('[data-testid="pending-orders-count"]')).toContainText('1');
      await page.click('[data-testid="pending-orders-tab"]');
      
      // Find and accept order
      const orderCard = page.locator('[data-testid="order-card-ORD-12345"]');
      await expect(orderCard).toBeVisible();
      await expect(orderCard.locator('[data-testid="student-name"]')).toContainText(testUser.student.name);
      await expect(orderCard.locator('[data-testid="special-instructions"]')).toContainText('Extra sambar please');
      
      // Mock kitchen acceptance API
      await page.route('**/api/kitchen/orders/ORD-12345/accept', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-12345',
              status: 'kitchen_accepted',
              accepted_by: testUser.kitchen.id,
              estimated_completion: new Date(Date.now() + 15 * 60000).toISOString()
            }
          })
        });
      });
      
      await orderCard.locator('[data-testid="accept-order-button"]').click();
      await expect(page.locator('[data-testid="order-accepted-toast"]')).toBeVisible();
      
      // Mark as preparing
      await page.route('**/api/kitchen/orders/ORD-12345/prepare', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-12345',
              status: 'preparing',
              started_preparation: new Date().toISOString()
            }
          })
        });
      });
      
      await orderCard.locator('[data-testid="start-preparation-button"]').click();
      await expect(orderCard.locator('[data-testid="order-status"]')).toContainText('Preparing');
      
      // Mark as ready for pickup
      await page.route('**/api/kitchen/orders/ORD-12345/ready', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-12345',
              status: 'ready_for_pickup',
              completed_at: new Date().toISOString(),
              pickup_code: '1234'
            }
          })
        });
      });
      
      await orderCard.locator('[data-testid="mark-ready-button"]').click();
      await expect(page.locator('[data-testid="order-ready-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="pickup-code"]')).toContainText('1234');
    });

    test('delivery and completion flow @p0 @delivery @completion', async ({ page }) => {
      // 6. DELIVERY & COMPLETION FLOW
      // Student checks order status and picks up
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="student-dashboard"]')).toBeVisible();
      
      // Check order notification
      await expect(page.locator('[data-testid="order-ready-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="pickup-code-display"]')).toContainText('1234');
      
      // Go to pickup location (simulate RFID scan)
      await page.click('[data-testid="pickup-order-button"]');
      
      // Mock RFID scan for pickup
      await page.route('**/api/orders/pickup/rfid-scan', async route => {
        const request = route.request();
        const scanData = JSON.parse(request.postData() || '{}');
        
        if (scanData.rfid_card === testUser.student.rfid_card && scanData.pickup_code === '1234') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              order: {
                id: 'ORD-12345',
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                delivered_to: testUser.student.id
              }
            })
          });
        }
      });
      
      // Simulate RFID scan
      await page.locator('[data-testid="rfid-card-input"]').fill(testUser.student.rfid_card);
      await page.locator('[data-testid="pickup-code-input"]').fill('1234');
      await page.locator('[data-testid="confirm-pickup-button"]').click();
      
      // Verify successful pickup
      await expect(page.locator('[data-testid="pickup-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toContainText('Delivered');
      
      // 7. POST-DELIVERY RATING & FEEDBACK
      await expect(page.locator('[data-testid="rating-modal"]')).toBeVisible();
      
      // Mock rating submission
      await page.route('**/api/orders/ORD-12345/rate', async route => {
        const request = route.request();
        const ratingData = JSON.parse(request.postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            rating: {
              order_id: 'ORD-12345',
              rating: ratingData.rating,
              feedback: ratingData.feedback,
              submitted_at: new Date().toISOString()
            }
          })
        });
      });
      
      // Submit rating
      await page.locator('[data-testid="star-4"]').click(); // 4-star rating
      await page.locator('[data-testid="feedback-input"]').fill('Food was delicious, arrived on time!');
      await page.locator('[data-testid="submit-rating-button"]').click();
      
      await expect(page.locator('[data-testid="rating-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-complete-message"]')).toContainText('Thank you for your feedback!');
    });
  });

  test.describe('Parent-Initiated Order Flow', () => {
    
    test('parent creates order for child @p0 @parent @proxy-order', async ({ page }) => {
      // Parent login and order creation for child
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-parent"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.parent.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      await expect(page.locator('[data-testid="parent-dashboard"]')).toBeVisible();
      
      // Select child
      await page.locator('[data-testid="child-selector"]').selectOption(testUser.student.id);
      await expect(page.locator('[data-testid="selected-child"]')).toContainText(testUser.student.name);
      await expect(page.locator('[data-testid="child-meal-balance"]')).toContainText('₹100.00'); // After previous order
      
      // Create order for child
      await page.click('[data-testid="order-for-child-button"]');
      await expect(page.locator('[data-testid="proxy-order-header"]')).toContainText(`Ordering for ${testUser.student.name}`);
      
      // Rest of order flow similar to student flow but with parent payment
      const breakfastCard = page.locator('[data-testid="menu-card-MENU-001"]');
      await breakfastCard.locator('[data-testid="add-to-cart-button"]').click();
      await page.locator('[data-testid="confirm-customization"]').click();
      await page.click('[data-testid="proceed-to-checkout"]');
      
      // Mock parent wallet payment
      await page.route('**/api/payments/parent-wallet/charge', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transaction_id: 'TXN-PAR-456',
            order_id: 'ORD-67890',
            amount: 45.00,
            parent_balance: 455.00, // ₹500 - ₹45
            child_balance: 100.00, // Unchanged - paid by parent
            status: 'completed'
          })
        });
      });
      
      await page.locator('[data-testid="payment-method-parent-wallet"]').check();
      await page.locator('[data-testid="confirm-payment-button"]').click();
      
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="parent-balance"]')).toContainText('₹455.00');
      
      // Verify child notification
      await expect(page.locator('[data-testid="child-notification-sent"]')).toContainText('Notification sent to Test Student');
    });
  });

  test.describe('Order Failure & Edge Cases', () => {
    
    test('payment failure handling @p0 @error-handling @payment-failure', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Create order
      await page.click('[data-testid="order-meal-button"]');
      const breakfastCard = page.locator('[data-testid="menu-card-MENU-001"]');
      await breakfastCard.locator('[data-testid="add-to-cart-button"]').click();
      await page.locator('[data-testid="confirm-customization"]').click();
      await page.click('[data-testid="proceed-to-checkout"]');
      
      // Mock payment failure
      await page.route('**/api/payments/rfid-wallet/charge', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'INSUFFICIENT_BALANCE',
            message: 'Insufficient balance in RFID wallet',
            current_balance: 30.00,
            required_amount: 45.00
          })
        });
      });
      
      await page.locator('[data-testid="payment-method-rfid"]').check();
      await page.locator('[data-testid="confirm-payment-button"]').click();
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient balance');
      await expect(page.locator('[data-testid="current-balance"]')).toContainText('₹30.00');
      await expect(page.locator('[data-testid="top-up-suggestion"]')).toBeVisible();
      
      // Test alternative payment method suggestion
      await expect(page.locator('[data-testid="alternative-payment-options"]')).toBeVisible();
    });

    test('order cancellation flow @p0 @cancellation @refund', async ({ page }) => {
      // Test order cancellation before kitchen acceptance
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Mock active order
      await page.route('**/api/orders/active', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            orders: [
              {
                id: 'ORD-CANCEL-123',
                status: 'pending_kitchen_acceptance',
                items: [{ name: 'South Indian Breakfast', price: 45.00 }],
                total_amount: 45.00,
                created_at: new Date(Date.now() - 5 * 60000).toISOString(),
                cancellable: true,
                refund_eligible: true
              }
            ]
          })
        });
      });
      
      await page.click('[data-testid="my-orders"]');
      await expect(page.locator('[data-testid="order-CANCEL-123"]')).toBeVisible();
      await expect(page.locator('[data-testid="cancel-order-button-CANCEL-123"]')).toBeVisible();
      
      // Mock cancellation API
      await page.route('**/api/orders/ORD-CANCEL-123/cancel', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ORD-CANCEL-123',
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              refund_amount: 45.00,
              refund_status: 'processing'
            }
          })
        });
      });
      
      await page.click('[data-testid="cancel-order-button-CANCEL-123"]');
      await page.click('[data-testid="confirm-cancellation"]');
      
      await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="refund-amount"]')).toContainText('₹45.00');
      await expect(page.locator('[data-testid="refund-timeline"]')).toContainText('2-3 business days');
    });

    test('kitchen capacity overflow handling @p0 @capacity @queue', async ({ page }) => {
      // Test behavior when kitchen is at capacity
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Mock kitchen capacity check
      await page.route('**/api/kitchen/capacity/check', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            capacity_status: 'at_limit',
            current_orders: 25,
            max_capacity: 25,
            estimated_wait_time: 45, // 45 minutes
            queue_position: null
          })
        });
      });
      
      await page.click('[data-testid="order-meal-button"]');
      
      // Verify capacity warning
      await expect(page.locator('[data-testid="capacity-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="estimated-wait"]')).toContainText('45 minutes');
      await expect(page.locator('[data-testid="queue-option"]')).toBeVisible();
      
      // Test queue joining
      await page.click('[data-testid="join-queue-button"]');
      await expect(page.locator('[data-testid="queue-confirmation"]')).toBeVisible();
    });
  });

  test.describe('Multi-User Coordination', () => {
    
    test('parent-student order coordination @p0 @coordination @notifications', async ({ page, browser }) => {
      // Test simultaneous parent and student actions
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();
      
      // Parent creates order for student
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-parent"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.parent.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Student logs in simultaneously
      await studentPage.goto('/auth/login');
      await studentPage.locator('[data-testid="role-tab-student"]').click();
      await studentPage.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await studentPage.locator('[data-testid="password-input"]').fill('password123');
      await studentPage.locator('[data-testid="login-button"]').click();
      
      // Parent creates order
      await page.locator('[data-testid="child-selector"]').selectOption(testUser.student.id);
      await page.click('[data-testid="order-for-child-button"]');
      
      // Mock real-time notification
      await studentPage.route('**/api/notifications/realtime', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            notification: {
              type: 'order_created_by_parent',
              order_id: 'ORD-PARENT-789',
              message: 'Your parent has ordered lunch for you',
              timestamp: new Date().toISOString()
            }
          })
        });
      });
      
      // Complete parent order
      const breakfastCard = page.locator('[data-testid="menu-card-MENU-001"]');
      await breakfastCard.locator('[data-testid="add-to-cart-button"]').click();
      await page.locator('[data-testid="confirm-customization"]').click();
      await page.click('[data-testid="proceed-to-checkout"]');
      await page.locator('[data-testid="payment-method-parent-wallet"]').check();
      await page.locator('[data-testid="confirm-payment-button"]').click();
      
      // Verify student receives notification
      await expect(studentPage.locator('[data-testid="parent-order-notification"]')).toBeVisible();
      await expect(studentPage.locator('[data-testid="notification-message"]')).toContainText('Your parent has ordered lunch for you');
      
      await studentContext.close();
    });
  });

  test.describe('Performance & Load Testing', () => {
    
    test('order system under load @p0 @performance @load', async ({ page }) => {
      // Simulate peak ordering time performance
      await page.goto('/auth/login');
      await page.locator('[data-testid="role-tab-student"]').click();
      await page.locator('[data-testid="email-input"]').fill(testUser.student.email);
      await page.locator('[data-testid="password-input"]').fill('password123');
      await page.locator('[data-testid="login-button"]').click();
      
      // Mock slower API responses (peak load simulation)
      await page.route('**/api/menu/today', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            menu: [testMenu.breakfast],
            date: new Date().toISOString().split('T')[0],
            server_load: 'high'
          })
        });
      });
      
      const startTime = Date.now();
      await page.click('[data-testid="order-meal-button"]');
      await expect(page.locator('[data-testid="today-menu"]')).toBeVisible({ timeout: 10000 });
      const endTime = Date.now();
      
      // Verify acceptable load times
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Max 5 seconds under load
      
      // Check for load indicators
      await expect(page.locator('[data-testid="high-traffic-notice"]')).toBeVisible();
    });
  });
});