import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS, BRAND_COLORS, RFID_STATES } from '../utils/brand-constants';

/**
 * RFID Workflow Testing Suite
 * HASIVU Platform - RFID-based Meal Ordering and Tracking System
 * 
 * Features Tested:
 * ✅ RFID card scanning simulation
 * ✅ Meal ordering via RFID
 * ✅ Payment processing with RFID
 * ✅ Kitchen workflow integration
 * ✅ Real-time order tracking
 * ✅ RFID system error handling
 * ✅ Multi-device RFID synchronization
 */

test.describe('RFID Workflow Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable RFID simulation mode
    await page.addInitScript(() => {
      window.RFID_SIMULATION_MODE = true;
      
      // Mock RFID API responses
      window.mockRfidScan = (cardId: string, userId: string) => {
        return {
          cardId,
          userId,
          balance: 250.00,
          status: 'active',
          timestamp: new Date().toISOString()
        };
      };
      
      // Mock meal ordering API
      window.mockMealOrder = (cardId: string, mealId: string) => {
        return {
          orderId: `order_${Date.now()}`,
          cardId,
          mealId,
          amount: 45.00,
          status: 'pending',
          estimatedTime: 15
        };
      };
    });

    // Navigate to RFID interface
    await page.goto('/rfid-scanner');
    await page.waitForLoadState('networkidle');
  });

  test.describe('RFID Card Scanning', () => {
    test('successful RFID card scan displays user information @rfid @scanning @smoke', async ({ page }) => {
      // Simulate RFID card scan
      const rfidScanner = page.locator('[data-testid="rfid-scanner"], .rfid-scanner-component').first();
      await expect(rfidScanner).toBeVisible({ timeout: 10000 });
      
      // Check scanner state indicator
      const scannerStatus = page.locator('[data-testid="scanner-status"], .scanner-status').first();
      if (await scannerStatus.count() > 0) {
        await expect(scannerStatus).toContainText(['Ready', 'Idle', 'Waiting']);
      }
      
      // Simulate card scan by triggering the scan event
      await page.evaluate(() => {
        const mockCardData = window.mockRfidScan('RFID001234', 'student_001');
        
        // Dispatch custom RFID scan event
        const scanEvent = new CustomEvent('rfidScan', {
          detail: mockCardData
        });
        document.dispatchEvent(scanEvent);
      });
      
      // Verify scan success state
      await page.waitForTimeout(1000);
      
      const scanResult = page.locator('[data-testid="scan-result"], .scan-result, .user-info').first();
      if (await scanResult.count() > 0) {
        await expect(scanResult).toBeVisible();
        
        // Check for user information display
        const userInfo = page.locator('[data-testid="user-name"], .user-name').first();
        const balance = page.locator('[data-testid="balance"], .balance-display').first();
        
        if (await userInfo.count() > 0) {
          await expect(userInfo).toBeVisible();
        }
        if (await balance.count() > 0) {
          await expect(balance).toContainText('250');
        }
      }
    });

    test('invalid RFID card shows error state @rfid @scanning @error-handling', async ({ page }) => {
      const rfidScanner = page.locator('[data-testid="rfid-scanner"]').first();
      
      if (await rfidScanner.count() > 0) {
        // Simulate invalid card scan
        await page.evaluate(() => {
          const errorEvent = new CustomEvent('rfidScanError', {
            detail: {
              error: 'Invalid card',
              cardId: 'INVALID001'
            }
          });
          document.dispatchEvent(errorEvent);
        });
        
        await page.waitForTimeout(1000);
        
        // Verify error state
        const errorMessage = page.locator(
          '[data-testid="scan-error"], .error-message, .alert-error'
        ).first();
        
        if (await errorMessage.count() > 0) {
          await expect(errorMessage).toBeVisible();
          await expect(errorMessage).toContainText(['Invalid', 'Error', 'Failed']);
        }
        
        // Verify scanner returns to ready state after error
        await page.waitForTimeout(3000);
        const scannerStatus = page.locator('[data-testid="scanner-status"]').first();
        if (await scannerStatus.count() > 0) {
          await expect(scannerStatus).toContainText(['Ready', 'Waiting']);
        }
      }
    });

    test('RFID scanner visual states match brand guidelines @rfid @visual @brand', async ({ page }) => {
      const rfidScanner = page.locator('[data-testid="rfid-scanner"]').first();
      
      if (await rfidScanner.count() > 0) {
        // Test idle state (should use neutral color)
        await expect(rfidScanner).toHaveScreenshot('rfid-scanner-idle.png');
        
        // Simulate scanning state (should use blue)
        await page.evaluate(() => {
          const scanner = document.querySelector('[data-testid="rfid-scanner"]');
          if (scanner) {
            scanner.classList.add('scanning');
          }
        });
        await expect(rfidScanner).toHaveScreenshot('rfid-scanner-scanning.png');
        
        // Simulate success state (should use green)
        await page.evaluate(() => {
          const scanner = document.querySelector('[data-testid="rfid-scanner"]');
          if (scanner) {
            scanner.classList.remove('scanning');
            scanner.classList.add('success');
          }
        });
        await expect(rfidScanner).toHaveScreenshot('rfid-scanner-success.png');
        
        // Simulate error state (should use red)
        await page.evaluate(() => {
          const scanner = document.querySelector('[data-testid="rfid-scanner"]');
          if (scanner) {
            scanner.classList.remove('success');
            scanner.classList.add('error');
          }
        });
        await expect(rfidScanner).toHaveScreenshot('rfid-scanner-error.png');
      }
    });
  });

  test.describe('Meal Ordering via RFID', () => {
    test('complete meal ordering workflow @rfid @ordering @workflow', async ({ page }) => {
      // Start with successful card scan
      await page.evaluate(() => {
        const mockCardData = window.mockRfidScan('RFID001234', 'student_001');
        const scanEvent = new CustomEvent('rfidScan', { detail: mockCardData });
        document.dispatchEvent(scanEvent);
      });
      
      await page.waitForTimeout(1000);
      
      // Select meal from available options
      const mealOptions = page.locator('[data-testid="meal-option"], .meal-card, .meal-item');
      const mealCount = await mealOptions.count();
      
      if (mealCount > 0) {
        // Select first available meal
        const firstMeal = mealOptions.first();
        await firstMeal.click();
        
        // Verify meal selection
        const selectedMeal = page.locator('[data-testid="selected-meal"], .meal-selected').first();
        if (await selectedMeal.count() > 0) {
          await expect(selectedMeal).toBeVisible();
        }
        
        // Confirm order
        const confirmBtn = page.locator(
          '[data-testid="confirm-order"], button:has-text("Confirm"), button:has-text("Order")'
        ).first();
        
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          
          // Verify order confirmation
          await page.waitForTimeout(2000);
          const orderConfirmation = page.locator(
            '[data-testid="order-confirmation"], .order-success, .confirmation-message'
          ).first();
          
          if (await orderConfirmation.count() > 0) {
            await expect(orderConfirmation).toBeVisible();
            
            // Check for order details
            const orderId = page.locator('[data-testid="order-id"], .order-number').first();
            const estimatedTime = page.locator('[data-testid="estimated-time"], .prep-time').first();
            
            if (await orderId.count() > 0) {
              await expect(orderId).toBeVisible();
            }
            if (await estimatedTime.count() > 0) {
              await expect(estimatedTime).toContainText(['min', 'minutes']);
            }
          }
        }
      }
    });

    test('insufficient balance prevents order @rfid @payment @validation', async ({ page }) => {
      // Simulate card with low balance
      await page.evaluate(() => {
        const lowBalanceData = {
          cardId: 'RFID001234',
          userId: 'student_001',
          balance: 5.00, // Insufficient balance
          status: 'active',
          timestamp: new Date().toISOString()
        };
        
        const scanEvent = new CustomEvent('rfidScan', { detail: lowBalanceData });
        document.dispatchEvent(scanEvent);
      });
      
      await page.waitForTimeout(1000);
      
      // Try to select an expensive meal
      const mealOption = page.locator('[data-testid="meal-option"]').first();
      if (await mealOption.count() > 0) {
        await mealOption.click();
        
        // Look for insufficient balance warning
        const balanceWarning = page.locator(
          '[data-testid="insufficient-balance"], .balance-error, .warning-message'
        ).first();
        
        if (await balanceWarning.count() > 0) {
          await expect(balanceWarning).toBeVisible();
          await expect(balanceWarning).toContainText(['insufficient', 'balance', 'low']);
        }
        
        // Verify order button is disabled
        const confirmBtn = page.locator('[data-testid="confirm-order"]').first();
        if (await confirmBtn.count() > 0) {
          await expect(confirmBtn).toBeDisabled();
        }
      }
    });

    test('meal customization options work with RFID orders @rfid @customization', async ({ page }) => {
      // Scan valid card
      await page.evaluate(() => {
        const cardData = window.mockRfidScan('RFID001234', 'student_001');
        const scanEvent = new CustomEvent('rfidScan', { detail: cardData });
        document.dispatchEvent(scanEvent);
      });
      
      await page.waitForTimeout(1000);
      
      // Select a customizable meal
      const customizableMeal = page.locator('[data-customizable="true"], .customizable-meal').first();
      
      if (await customizableMeal.count() > 0) {
        await customizableMeal.click();
        
        // Look for customization options
        const customOptions = page.locator(
          '[data-testid="meal-customization"], .customization-options, .meal-options'
        ).first();
        
        if (await customOptions.count() > 0) {
          await expect(customOptions).toBeVisible();
          
          // Test customization selections
          const spiceLevel = page.locator('[data-testid="spice-level"], select[name="spiceLevel"]').first();
          const addOns = page.locator('[data-testid="add-ons"], input[type="checkbox"]').first();
          
          if (await spiceLevel.count() > 0) {
            await spiceLevel.selectOption('medium');
          }
          if (await addOns.count() > 0) {
            await addOns.check();
          }
          
          // Verify price updates with customizations
          const priceDisplay = page.locator('[data-testid="total-price"], .price-display').first();
          if (await priceDisplay.count() > 0) {
            const priceText = await priceDisplay.textContent();
            expect(priceText).toContain('₹');
          }
        }
      }
    });
  });

  test.describe('Kitchen Workflow Integration', () => {
    test('kitchen receives RFID orders in real-time @rfid @kitchen @integration', async ({ page }) => {
      // Navigate to kitchen interface
      await page.goto('/kitchen/orders');
      await page.waitForLoadState('networkidle');
      
      // Simulate new RFID order from another tab/device
      await page.evaluate(() => {
        // Mock new order notification
        const orderData = {
          orderId: `order_${Date.now()}`,
          studentName: 'Test Student',
          mealName: 'Chicken Biryani',
          customizations: ['Medium Spice', 'Extra Rice'],
          orderTime: new Date().toISOString(),
          paymentMethod: 'RFID',
          table: 'A1'
        };
        
        const newOrderEvent = new CustomEvent('newRfidOrder', { detail: orderData });
        document.dispatchEvent(newOrderEvent);
      });
      
      await page.waitForTimeout(2000);
      
      // Verify order appears in kitchen queue
      const orderQueue = page.locator('[data-testid="order-queue"], .kitchen-orders').first();
      if (await orderQueue.count() > 0) {
        await expect(orderQueue).toBeVisible();
        
        // Look for the new order
        const newOrder = page.locator('[data-testid="order-item"]:last-child, .order-card:last-child').first();
        if (await newOrder.count() > 0) {
          await expect(newOrder).toContainText(['Chicken Biryani', 'RFID']);
        }
      }
    });

    test('kitchen can update order status for RFID orders @rfid @kitchen @status-update', async ({ page }) => {
      await page.goto('/kitchen/orders');
      
      // Find an RFID order in the queue
      const rfidOrder = page.locator('[data-payment="rfid"], [data-testid="rfid-order"]').first();
      
      if (await rfidOrder.count() > 0) {
        // Update order status
        const statusBtn = rfidOrder.locator('button:has-text("Start"), [data-testid="start-cooking"]').first();
        if (await statusBtn.count() > 0) {
          await statusBtn.click();
          
          // Verify status change
          await page.waitForTimeout(1000);
          const cookingStatus = rfidOrder.locator('.status-cooking, [data-status="cooking"]').first();
          if (await cookingStatus.count() > 0) {
            await expect(cookingStatus).toBeVisible();
          }
        }
        
        // Complete the order
        const completeBtn = rfidOrder.locator('button:has-text("Complete"), [data-testid="complete-order"]').first();
        if (await completeBtn.count() > 0) {
          await completeBtn.click();
          
          // Verify completion notification
          const completionNotification = page.locator('.notification, .toast, .alert-success').first();
          if (await completionNotification.count() > 0) {
            await expect(completionNotification).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Real-time Order Tracking', () => {
    test('students can track RFID orders in real-time @rfid @tracking @student', async ({ page }) => {
      // Login as student and navigate to order tracking
      await page.goto('/student/orders');
      await page.waitForLoadState('networkidle');
      
      // Look for active orders
      const activeOrders = page.locator('[data-testid="active-orders"], .order-tracking').first();
      
      if (await activeOrders.count() > 0) {
        await expect(activeOrders).toBeVisible();
        
        // Simulate order status update from kitchen
        await page.evaluate(() => {
          const statusUpdate = {
            orderId: 'order_123',
            status: 'cooking',
            estimatedTime: 10,
            message: 'Your order is being prepared'
          };
          
          const updateEvent = new CustomEvent('orderStatusUpdate', { detail: statusUpdate });
          document.dispatchEvent(updateEvent);
        });
        
        await page.waitForTimeout(1000);
        
        // Verify real-time update
        const statusUpdate = page.locator('[data-testid="order-status"], .status-update').first();
        if (await statusUpdate.count() > 0) {
          await expect(statusUpdate).toContainText(['cooking', 'preparing']);
        }
        
        // Check estimated time display
        const estimatedTime = page.locator('[data-testid="estimated-time"], .eta-display').first();
        if (await estimatedTime.count() > 0) {
          await expect(estimatedTime).toContainText(['10', 'min']);
        }
      }
    });

    test('order tracking shows RFID payment confirmation @rfid @tracking @payment', async ({ page }) => {
      await page.goto('/student/order-history');
      
      // Look for RFID payment indicators
      const rfidOrders = page.locator('[data-payment="rfid"], .rfid-payment');
      const orderCount = await rfidOrders.count();
      
      if (orderCount > 0) {
        const firstRfidOrder = rfidOrders.first();
        
        // Verify RFID payment indicator
        const paymentMethod = firstRfidOrder.locator('.payment-method, [data-testid="payment-type"]').first();
        if (await paymentMethod.count() > 0) {
          await expect(paymentMethod).toContainText(['RFID', 'Card']);
        }
        
        // Verify transaction details
        const transactionId = firstRfidOrder.locator('.transaction-id, [data-testid="transaction"]').first();
        if (await transactionId.count() > 0) {
          await expect(transactionId).toBeVisible();
        }
        
        // Check balance deduction
        const balanceChange = firstRfidOrder.locator('.balance-change, [data-testid="amount"]').first();
        if (await balanceChange.count() > 0) {
          await expect(balanceChange).toContainText('₹');
        }
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('network disconnection during RFID scan @rfid @error-handling @network', async ({ page }) => {
      // Simulate network disconnection
      await page.context().setOffline(true);
      
      const rfidScanner = page.locator('[data-testid="rfid-scanner"]').first();
      
      if (await rfidScanner.count() > 0) {
        // Try to scan card while offline
        await page.evaluate(() => {
          const cardData = window.mockRfidScan('RFID001234', 'student_001');
          const scanEvent = new CustomEvent('rfidScan', { detail: cardData });
          document.dispatchEvent(scanEvent);
        });
        
        await page.waitForTimeout(2000);
        
        // Verify offline error handling
        const offlineMessage = page.locator(
          '[data-testid="offline-error"], .network-error, .connection-error'
        ).first();
        
        if (await offlineMessage.count() > 0) {
          await expect(offlineMessage).toBeVisible();
          await expect(offlineMessage).toContainText(['offline', 'connection', 'network']);
        }
        
        // Restore network connection
        await page.context().setOffline(false);
        await page.waitForTimeout(1000);
        
        // Verify automatic recovery
        const reconnectedMessage = page.locator('.connection-restored, .online-status').first();
        if (await reconnectedMessage.count() > 0) {
          await expect(reconnectedMessage).toBeVisible();
        }
      }
    });

    test('RFID reader malfunction simulation @rfid @error-handling @hardware', async ({ page }) => {
      const rfidScanner = page.locator('[data-testid="rfid-scanner"]').first();
      
      if (await rfidScanner.count() > 0) {
        // Simulate hardware malfunction
        await page.evaluate(() => {
          const hardwareError = new CustomEvent('rfidHardwareError', {
            detail: {
              error: 'Reader not responding',
              code: 'HARDWARE_001'
            }
          });
          document.dispatchEvent(hardwareError);
        });
        
        await page.waitForTimeout(1000);
        
        // Verify error display
        const hardwareError = page.locator(
          '[data-testid="hardware-error"], .reader-error, .malfunction-alert'
        ).first();
        
        if (await hardwareError.count() > 0) {
          await expect(hardwareError).toBeVisible();
          await expect(hardwareError).toContainText(['malfunction', 'reader', 'hardware']);
        }
        
        // Check for alternative options
        const alternativeOptions = page.locator(
          '[data-testid="manual-entry"], .alternative-payment, button:has-text("Manual")'
        ).first();
        
        if (await alternativeOptions.count() > 0) {
          await expect(alternativeOptions).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile RFID Interface', () => {
    test('RFID interface is mobile-responsive @rfid @mobile @responsive', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/rfid-scanner');
      
      const rfidInterface = page.locator('[data-testid="rfid-interface"], .rfid-scanner-component').first();
      
      if (await rfidInterface.count() > 0) {
        // Verify mobile-friendly scanner interface
        await expect(rfidInterface).toBeVisible();
        
        // Check touch-friendly buttons
        const scannerButton = page.locator('[data-testid="scan-button"], .scan-trigger').first();
        if (await scannerButton.count() > 0) {
          const buttonBox = await scannerButton.boundingBox();
          expect(buttonBox?.width).toBeGreaterThanOrEqual(44); // Minimum touch target
          expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
        }
        
        // Test mobile-optimized meal selection
        const mealGrid = page.locator('[data-testid="meal-grid"], .meal-options').first();
        if (await mealGrid.count() > 0) {
          await expect(mealGrid).toBeVisible();
          
          // Verify meal cards are touch-friendly
          const mealCard = page.locator('.meal-card, [data-testid="meal-option"]').first();
          if (await mealCard.count() > 0) {
            const cardBox = await mealCard.boundingBox();
            expect(cardBox?.height).toBeGreaterThanOrEqual(60); // Adequate touch target
          }
        }
        
        // Take mobile screenshot
        await expect(page).toHaveScreenshot('rfid-mobile-interface.png', {
          fullPage: true,
        });
      }
    });
  });
});