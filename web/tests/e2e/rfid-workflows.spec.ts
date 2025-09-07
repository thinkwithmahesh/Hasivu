import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { MenuPage } from '../pages/menu.page';

/**
 * RFID Workflow Automation Tests for HASIVU Platform
 * Tests RFID-based ordering, tracking, and payment workflows
 */

test.describe('RFID Workflow Automation', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let menuPage: MenuPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    menuPage = new MenuPage(page);
    
    // Mock RFID system availability
    await page.route('**/rfid/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'connected',
          signal_strength: 'strong',
          last_heartbeat: new Date().toISOString(),
          supported_protocols: ['ISO14443A', 'ISO15693'],
          active_readers: [
            { id: 'READER-001', location: 'Cafeteria Entry', status: 'active' },
            { id: 'READER-002', location: 'Kitchen Counter', status: 'active' }
          ]
        })
      });
    });
  });

  test.describe('Student RFID Quick Order Workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Use pre-authenticated student state
      await page.context().addCookies([
        {
          name: 'auth_token',
          value: 'mock-student-jwt-token',
          domain: 'localhost',
          path: '/'
        }
      ]);
      
      // Mock student RFID profile
      await page.route('**/rfid/student/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            student_id: 'STU-12345',
            name: 'Test Student',
            class: '10th Grade',
            rfid_id: 'RFID-STU-12345',
            meal_balance: 150.00,
            dietary_restrictions: ['vegetarian'],
            preset_orders: [
              {
                id: 'preset-1',
                name: 'Daily Lunch',
                items: [
                  { name: 'Dal Rice', quantity: 1, price: 25.00 },
                  { name: 'Sambar', quantity: 1, price: 15.00 },
                  { name: 'Curd', quantity: 1, price: 10.00 }
                ],
                total: 50.00,
                is_default: true
              },
              {
                id: 'preset-2',
                name: 'Light Snack',
                items: [
                  { name: 'Idli', quantity: 2, price: 20.00 },
                  { name: 'Chutney', quantity: 1, price: 5.00 }
                ],
                total: 25.00,
                is_default: false
              }
            ]
          })
        });
      });
    });

    test('should process RFID tap for quick default order', async ({ page }) => {
      await menuPage.goto();
      
      // Mock RFID scan event
      await page.route('**/rfid/scan', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student_id: 'STU-12345',
            scan_time: new Date().toISOString(),
            reader_id: 'READER-001',
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
            rfid_id: 'RFID-STU-12345',
            reader_location: 'Cafeteria Entry'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify RFID scan indicator appears
      const scanIndicator = page.locator('[data-testid="rfid-scan-indicator"]');
      await expect(scanIndicator).toBeVisible();
      await expect(scanIndicator).toContainText('STU-12345');
      
      // Verify quick order notification
      const quickOrderNotification = page.locator('[data-testid="quick-order-notification"]');
      await expect(quickOrderNotification).toBeVisible();
      await expect(quickOrderNotification).toContainText('Daily Lunch');
      await expect(quickOrderNotification).toContainText('₹50.00');
      
      // Click confirm quick order
      const confirmButton = page.locator('[data-testid="confirm-quick-order"]');
      await confirmButton.click();
      
      // Mock order creation
      await page.route('**/orders', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-RFID-001',
              status: 'confirmed',
              items: [
                { name: 'Dal Rice', quantity: 1, price: 25.00 },
                { name: 'Sambar', quantity: 1, price: 15.00 },
                { name: 'Curd', quantity: 1, price: 10.00 }
              ],
              total: 50.00,
              payment_method: 'rfid_wallet',
              estimated_time: '15 minutes',
              pickup_location: 'Kitchen Counter'
            })
          });
        }
      });
      
      // Wait for order confirmation
      const orderConfirmation = page.locator('[data-testid="order-confirmation"]');
      await expect(orderConfirmation).toBeVisible();
      await expect(orderConfirmation).toContainText('ORD-RFID-001');
      await expect(orderConfirmation).toContainText('15 minutes');
      
      // Verify balance deduction
      const balanceUpdate = page.locator('[data-testid="balance-update"]');
      await expect(balanceUpdate).toBeVisible();
      await expect(balanceUpdate).toContainText('₹100.00'); // 150 - 50
    });

    test('should handle RFID scan with insufficient balance', async ({ page }) => {
      // Mock student with low balance
      await page.route('**/rfid/student/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            student_id: 'STU-12345',
            meal_balance: 25.00, // Insufficient for default order (50.00)
            preset_orders: [{
              id: 'preset-1',
              name: 'Daily Lunch',
              total: 50.00,
              is_default: true
            }]
          })
        });
      });
      
      await menuPage.goto();
      
      // Mock RFID scan
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-scan', {
          detail: { student_id: 'STU-12345' }
        });
        window.dispatchEvent(event);
      });
      
      // Mock insufficient balance response
      await page.route('**/rfid/scan', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'insufficient_balance',
            message: 'Insufficient meal balance for default order',
            current_balance: 25.00,
            required_amount: 50.00,
            suggested_actions: ['add_money', 'select_smaller_order', 'contact_parent']
          })
        });
      });
      
      // Verify insufficient balance notification
      const balanceError = page.locator('[data-testid="insufficient-balance-error"]');
      await expect(balanceError).toBeVisible();
      await expect(balanceError).toContainText('Insufficient balance');
      await expect(balanceError).toContainText('₹25.00');
      
      // Verify suggested actions are displayed
      const addMoneyButton = page.locator('[data-testid="add-money-button"]');
      const selectSmallerOrderButton = page.locator('[data-testid="select-smaller-order"]');
      await expect(addMoneyButton).toBeVisible();
      await expect(selectSmallerOrderButton).toBeVisible();
    });

    test('should allow RFID order customization', async ({ page }) => {
      await menuPage.goto();
      
      // Simulate RFID scan
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-scan', {
          detail: { student_id: 'STU-12345' }
        });
        window.dispatchEvent(event);
      });
      
      // Mock scan response with multiple presets
      await page.route('**/rfid/scan', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student_id: 'STU-12345',
            preset_orders: [
              { id: 'preset-1', name: 'Daily Lunch', total: 50.00, is_default: true },
              { id: 'preset-2', name: 'Light Snack', total: 25.00, is_default: false },
              { id: 'preset-3', name: 'Breakfast Special', total: 30.00, is_default: false }
            ]
          })
        });
      });
      
      // Click customize order instead of quick confirm
      const customizeButton = page.locator('[data-testid="customize-rfid-order"]');
      await customizeButton.click();
      
      // Verify preset selection modal
      const presetModal = page.locator('[data-testid="rfid-preset-modal"]');
      await expect(presetModal).toBeVisible();
      
      // Verify all presets are displayed
      const presetOptions = page.locator('[data-testid="preset-option"]');
      await expect(presetOptions).toHaveCount(3);
      
      // Select different preset
      const lightSnackOption = page.locator('[data-testid="preset-option"][data-preset-id="preset-2"]');
      await lightSnackOption.click();
      
      // Verify preset details shown
      await expect(page.locator('[data-testid="preset-total"]')).toContainText('₹25.00');
      
      // Confirm selection
      const confirmPresetButton = page.locator('[data-testid="confirm-preset-selection"]');
      await confirmPresetButton.click();
      
      // Mock order creation for custom preset
      await page.route('**/orders', async route => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          expect(body.preset_id).toBe('preset-2');
          
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-RFID-002',
              preset_name: 'Light Snack',
              total: 25.00
            })
          });
        }
      });
      
      // Verify order created with selected preset
      const confirmation = page.locator('[data-testid="order-confirmation"]');
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toContainText('Light Snack');
    });

    test('should track RFID order status in real-time', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock active RFID order
      await page.route('**/orders/active', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            order_id: 'ORD-RFID-003',
            status: 'preparing',
            items: ['Dal Rice', 'Sambar'],
            total: 40.00,
            estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
            kitchen_notes: 'Extra spicy requested',
            rfid_pickup: true,
            pickup_location: 'Kitchen Counter - READER-002'
          })
        });
      });
      
      // Verify active order display
      const activeOrder = page.locator('[data-testid="active-rfid-order"]');
      await expect(activeOrder).toBeVisible();
      await expect(activeOrder).toContainText('ORD-RFID-003');
      await expect(activeOrder).toContainText('preparing');
      
      // Verify pickup location with RFID reader info
      const pickupLocation = page.locator('[data-testid="pickup-location"]');
      await expect(pickupLocation).toContainText('Kitchen Counter - READER-002');
      
      // Simulate order status update via WebSocket/SSE
      await page.evaluate(() => {
        const event = new CustomEvent('order-status-update', {
          detail: {
            order_id: 'ORD-RFID-003',
            status: 'ready',
            notification_message: 'Your order is ready for RFID pickup!'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify status updated
      await expect(activeOrder).toContainText('ready');
      
      // Verify notification
      const readyNotification = page.locator('[data-testid="order-ready-notification"]');
      await expect(readyNotification).toBeVisible();
      await expect(readyNotification).toContainText('ready for RFID pickup');
    });
  });

  test.describe('Kitchen RFID Order Management', () => {
    test.beforeEach(async ({ page }) => {
      // Use kitchen staff authentication
      await page.context().addCookies([
        {
          name: 'auth_token',
          value: 'mock-kitchen-jwt-token',
          domain: 'localhost',
          path: '/'
        }
      ]);
    });

    test('should manage RFID orders in preparation queue', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock kitchen dashboard with RFID orders
      await page.route('**/kitchen/orders', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rfid_orders: [
              {
                order_id: 'ORD-RFID-004',
                student_name: 'Test Student A',
                student_id: 'STU-11111',
                rfid_id: 'RFID-STU-11111',
                items: [
                  { name: 'Dal Rice', quantity: 1, special_instructions: 'Less salt' }
                ],
                priority: 'high',
                order_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
                dietary_restrictions: ['vegetarian']
              },
              {
                order_id: 'ORD-RFID-005',
                student_name: 'Test Student B',
                student_id: 'STU-22222',
                rfid_id: 'RFID-STU-22222',
                items: [
                  { name: 'Curd Rice', quantity: 1 }
                ],
                priority: 'normal',
                order_time: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 min ago
              }
            ]
          })
        });
      });
      
      // Verify RFID orders section
      const rfidOrdersSection = page.locator('[data-testid="rfid-orders-section"]');
      await expect(rfidOrdersSection).toBeVisible();
      
      // Verify orders displayed with RFID identifiers
      const orderItems = page.locator('[data-testid="rfid-order-item"]');
      await expect(orderItems).toHaveCount(2);
      
      // Verify RFID IDs displayed
      await expect(page.locator('[data-testid="rfid-id-STU-11111"]')).toContainText('RFID-STU-11111');
      await expect(page.locator('[data-testid="rfid-id-STU-22222"]')).toContainText('RFID-STU-22222');
      
      // Test marking order as ready
      const firstOrderReadyButton = orderItems.first().locator('[data-testid="mark-ready"]');
      await firstOrderReadyButton.click();
      
      // Mock order status update
      await page.route('**/kitchen/orders/*/ready', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-RFID-004',
              status: 'ready',
              ready_time: new Date().toISOString(),
              pickup_notification_sent: true
            })
          });
        }
      });
      
      // Verify order moved to ready section
      const readyOrders = page.locator('[data-testid="ready-orders-section"]');
      await expect(readyOrders.locator('[data-testid="order-ORD-RFID-004"]')).toBeVisible();
      
      // Verify RFID pickup instructions displayed
      const pickupInstructions = page.locator('[data-testid="rfid-pickup-instructions"]');
      await expect(pickupInstructions).toBeVisible();
      await expect(pickupInstructions).toContainText('Student will scan RFID at Kitchen Counter');
    });

    test('should handle RFID order pickup scanning', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock ready orders
      await page.route('**/kitchen/orders/ready', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ready_orders: [
              {
                order_id: 'ORD-RFID-006',
                student_name: 'Test Student C',
                rfid_id: 'RFID-STU-33333',
                items: ['Dal Rice', 'Sambar'],
                ready_time: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3 min ago
              }
            ]
          })
        });
      });
      
      // Mock RFID pickup scan
      await page.route('**/rfid/pickup-scan', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order_id: 'ORD-RFID-006',
            student_id: 'STU-33333',
            rfid_id: 'RFID-STU-33333',
            pickup_time: new Date().toISOString(),
            reader_location: 'Kitchen Counter',
            order_complete: true
          })
        });
      });
      
      // Simulate RFID pickup scan
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-pickup-scan', {
          detail: {
            rfid_id: 'RFID-STU-33333',
            reader_id: 'READER-002',
            scan_type: 'pickup'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify pickup scan indicator
      const pickupScanIndicator = page.locator('[data-testid="pickup-scan-indicator"]');
      await expect(pickupScanIndicator).toBeVisible();
      await expect(pickupScanIndicator).toContainText('RFID-STU-33333');
      
      // Verify order completed and removed from ready queue
      const completedNotification = page.locator('[data-testid="order-completed-notification"]');
      await expect(completedNotification).toBeVisible();
      await expect(completedNotification).toContainText('ORD-RFID-006');
      await expect(completedNotification).toContainText('picked up successfully');
      
      // Verify order removed from ready orders section
      await expect(page.locator('[data-testid="order-ORD-RFID-006"]')).toBeHidden();
    });

    test('should handle RFID pickup verification errors', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock RFID pickup scan with wrong student
      await page.route('**/rfid/pickup-scan', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'order_mismatch',
            message: 'RFID card does not match any ready orders',
            scanned_rfid: 'RFID-STU-99999',
            available_orders: [
              { order_id: 'ORD-RFID-007', rfid_id: 'RFID-STU-44444', student_name: 'Different Student' }
            ]
          })
        });
      });
      
      // Simulate wrong RFID scan
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-pickup-scan', {
          detail: {
            rfid_id: 'RFID-STU-99999', // Wrong RFID
            reader_id: 'READER-002'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Verify error notification
      const errorNotification = page.locator('[data-testid="pickup-error-notification"]');
      await expect(errorNotification).toBeVisible();
      await expect(errorNotification).toContainText('RFID card does not match');
      await expect(errorNotification).toContainText('RFID-STU-99999');
      
      // Verify suggested orders shown
      const suggestedOrders = page.locator('[data-testid="suggested-orders"]');
      await expect(suggestedOrders).toBeVisible();
      await expect(suggestedOrders).toContainText('RFID-STU-44444');
      await expect(suggestedOrders).toContainText('Different Student');
      
      // Test manual order assignment
      const manualAssignButton = page.locator('[data-testid="manual-assign-order"]');
      await manualAssignButton.click();
      
      const orderDropdown = page.locator('[data-testid="order-selection-dropdown"]');
      await orderDropdown.selectOption('ORD-RFID-007');
      
      const confirmAssignButton = page.locator('[data-testid="confirm-manual-assignment"]');
      await confirmAssignButton.click();
      
      // Mock successful manual assignment
      await page.route('**/kitchen/orders/*/manual-pickup', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              order_id: 'ORD-RFID-007',
              status: 'completed',
              pickup_method: 'manual_assignment',
              completed_by_staff: 'KIT-001'
            })
          });
        }
      });
      
      // Verify manual assignment success
      const assignmentSuccess = page.locator('[data-testid="manual-assignment-success"]');
      await expect(assignmentSuccess).toBeVisible();
      await expect(assignmentSuccess).toContainText('ORD-RFID-007');
      await expect(assignmentSuccess).toContainText('manually assigned');
    });
  });

  test.describe('RFID System Health Monitoring', () => {
    test('should monitor RFID reader status', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock RFID system health check
      await page.route('**/rfid/health', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            overall_status: 'healthy',
            readers: [
              {
                id: 'READER-001',
                location: 'Cafeteria Entry',
                status: 'active',
                signal_strength: 'strong',
                last_scan: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
                scan_count_today: 145
              },
              {
                id: 'READER-002',
                location: 'Kitchen Counter',
                status: 'warning',
                signal_strength: 'weak',
                last_scan: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
                scan_count_today: 89,
                issues: ['Signal strength below optimal', 'Last scan 30 minutes ago']
              }
            ],
            system_metrics: {
              total_scans_today: 234,
              successful_orders: 198,
              failed_scans: 6,
              success_rate: '97.4%'
            }
          })
        });
      });
      
      // Verify RFID health dashboard
      const rfidHealthSection = page.locator('[data-testid="rfid-health-section"]');
      await expect(rfidHealthSection).toBeVisible();
      
      // Verify overall status
      const overallStatus = page.locator('[data-testid="rfid-overall-status"]');
      await expect(overallStatus).toContainText('healthy');
      
      // Verify individual reader status
      const reader001 = page.locator('[data-testid="reader-READER-001"]');
      await expect(reader001).toContainText('active');
      await expect(reader001).toContainText('strong');
      
      const reader002 = page.locator('[data-testid="reader-READER-002"]');
      await expect(reader002).toContainText('warning');
      await expect(reader002).toContainText('weak');
      
      // Verify issues displayed
      const reader002Issues = reader002.locator('[data-testid="reader-issues"]');
      await expect(reader002Issues).toContainText('Signal strength below optimal');
      
      // Verify system metrics
      const systemMetrics = page.locator('[data-testid="rfid-system-metrics"]');
      await expect(systemMetrics).toContainText('234'); // Total scans
      await expect(systemMetrics).toContainText('97.4%'); // Success rate
    });

    test('should alert on RFID system failures', async ({ page }) => {
      await dashboardPage.goto();
      
      // Mock RFID system with critical issues
      await page.route('**/rfid/health', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            overall_status: 'critical',
            readers: [
              {
                id: 'READER-001',
                status: 'offline',
                issues: ['No response from reader', 'Connection timeout']
              }
            ],
            system_alerts: [
              {
                level: 'critical',
                message: 'READER-001 offline - Students cannot place RFID orders',
                timestamp: new Date().toISOString(),
                action_required: true
              }
            ]
          })
        });
      });
      
      // Verify critical alert notification
      const criticalAlert = page.locator('[data-testid="rfid-critical-alert"]');
      await expect(criticalAlert).toBeVisible();
      await expect(criticalAlert).toContainText('READER-001 offline');
      await expect(criticalAlert).toContainText('action required');
      
      // Verify fallback options displayed
      const fallbackOptions = page.locator('[data-testid="rfid-fallback-options"]');
      await expect(fallbackOptions).toBeVisible();
      await expect(fallbackOptions).toContainText('Manual order entry available');
      
      // Test alert acknowledgment
      const acknowledgeButton = page.locator('[data-testid="acknowledge-alert"]');
      await acknowledgeButton.click();
      
      // Mock alert acknowledgment
      await page.route('**/rfid/alerts/*/acknowledge', async route => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              acknowledged: true,
              acknowledged_by: 'KIT-001',
              acknowledged_at: new Date().toISOString()
            })
          });
        }
      });
      
      // Verify acknowledgment
      const acknowledgedAlert = page.locator('[data-testid="acknowledged-alert"]');
      await expect(acknowledgedAlert).toBeVisible();
      await expect(acknowledgedAlert).toContainText('acknowledged by KIT-001');
    });
  });

  test.describe('RFID Performance and Load Testing', () => {
    test('should handle high-volume RFID scanning', async ({ page }) => {
      await menuPage.goto();
      
      // Simulate multiple rapid RFID scans
      const scanPromises = [];
      for (let i = 0; i < 10; i++) {
        scanPromises.push(
          page.evaluate((index) => {
            return new Promise(resolve => {
              setTimeout(() => {
                const event = new CustomEvent('rfid-scan', {
                  detail: {
                    student_id: `STU-${1000 + index}`,
                    rfid_id: `RFID-STU-${1000 + index}`,
                    scan_time: new Date().toISOString()
                  }
                });
                window.dispatchEvent(event);
                resolve(true);
              }, index * 100); // Stagger scans by 100ms
            });
          }, i)
        );
      }
      
      // Mock backend handling multiple scans
      await page.route('**/rfid/scan', async route => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            processed: true,
            queue_position: Math.floor(Math.random() * 5) + 1
          })
        });
      });
      
      // Execute all scans
      await Promise.all(scanPromises);
      
      // Verify system handles load gracefully
      const scanQueue = page.locator('[data-testid="rfid-scan-queue"]');
      if (await scanQueue.isVisible()) {
        // If queuing is implemented
        await expect(scanQueue).toBeVisible();
        const queueCount = await scanQueue.locator('[data-testid="queue-count"]').textContent();
        expect(parseInt(queueCount || '0')).toBeLessThanOrEqual(10);
      }
      
      // Verify no errors occurred
      const errorIndicators = page.locator('[data-testid="rfid-error"]');
      await expect(errorIndicators).toHaveCount(0);
      
      // Verify performance metrics
      const responseTime = await page.evaluate(() => {
        // Check if performance metrics are tracked
        return (window as any).rfidPerformanceMetrics?.averageResponseTime || 0;
      });
      
      expect(responseTime).toBeLessThan(500); // Under 500ms average response time
    });
  });
});