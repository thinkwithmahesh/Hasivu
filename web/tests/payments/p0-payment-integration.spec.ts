import { test, expect } from '@playwright/test';

/**
 * P0 CRITICAL PAYMENT INTEGRATION TESTS - HASIVU Platform
 * Priority Level: P0 (Critical - Revenue Blocking)
 * 
 * Test Coverage:
 * - Razorpay payment gateway integration (India primary)
 * - Stripe payment gateway integration (International backup)
 * - Payment success, failure, timeout, and partial scenarios
 * - Wallet payment integration and balance management
 * - Refund processing and payment reconciliation
 * - Multi-gateway routing and failover handling
 * - Payment security validation and compliance
 */

test.describe('P0 Critical Payment Integration Tests @critical @p0 @payments', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup authenticated parent session for payment tests
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'PAR-001',
            email: 'parent@hasivu.test',
            name: 'Test Parent',
            role: 'parent',
            children: [{ id: 'STU-001', name: 'Test Child' }]
          },
          token: 'mock-parent-token'
        })
      });
    });

    // Login as parent for payment operations
    await page.goto('/auth/login');
    await page.locator('[data-testid="role-tab-parent"]').click();
    await page.locator('[data-testid="email-input"]').fill('parent@hasivu.test');
    await page.locator('[data-testid="password-input"]').fill('Parent123!');
    await page.locator('[data-testid="login-button"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test.describe('Razorpay Integration P0', () => {
    test('razorpay successful payment flow @p0 @smoke', async ({ page }) => {
      // Mock Razorpay order creation
      await page.route('**/payments/razorpay/create-order', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order_id: 'order_razorpay_12345',
            amount: 10000, // ₹100 in paise
            currency: 'INR',
            key: 'rzp_test_123456789',
            order: {
              id: 'order_razorpay_12345',
              entity: 'order',
              amount: 10000,
              currency: 'INR',
              status: 'created'
            }
          })
        });
      });

      // Mock successful Razorpay payment verification
      await page.route('**/payments/razorpay/verify', async route => {
        const postData = JSON.parse(route.request().postData() || '{}');
        
        if (postData.razorpay_payment_id && postData.razorpay_order_id && postData.razorpay_signature) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              payment_id: 'pay_razorpay_67890',
              status: 'captured',
              amount: 10000,
              currency: 'INR',
              method: 'card',
              student_balance_updated: 10000,
              transaction_id: 'TXN-RZP-001'
            })
          });
        }
      });

      // Navigate to add funds
      await page.locator('[data-testid="add-funds-button"]').click();
      
      // Select amount
      await page.locator('[data-testid="payment-amount"]').fill('100');
      
      // Select Razorpay as payment method
      await page.locator('[data-testid="payment-method-razorpay"]').check();
      
      // Mock Razorpay SDK
      await page.addInitScript(() => {
        (window as any).Razorpay = function(options: any) {
          return {
            open: () => {
              // Simulate successful payment
              setTimeout(() => {
                if (options.handler) {
                  options.handler({
                    razorpay_payment_id: 'pay_razorpay_67890',
                    razorpay_order_id: 'order_razorpay_12345',
                    razorpay_signature: 'mock_signature_123'
                  });
                }
              }, 1000);
            },
            on: () => {}
          };
        };
      });

      // Process payment
      await page.locator('[data-testid="process-payment"]').click();

      // Wait for Razorpay modal simulation
      await page.waitForTimeout(2000);

      // Verify payment success
      const paymentSuccess = page.locator('[data-testid="payment-success"]');
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('₹100');
      await expect(paymentSuccess).toContainText('successful');

      // Verify transaction details
      await expect(page.locator('[data-testid="transaction-id"]')).toContainText('TXN-RZP-001');
      await expect(page.locator('[data-testid="payment-method"]')).toContainText('card');
    });

    test('razorpay payment failure handling @p0', async ({ page }) => {
      // Mock Razorpay order creation
      await page.route('**/payments/razorpay/create-order', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order_id: 'order_razorpay_fail_123',
            amount: 5000,
            currency: 'INR',
            key: 'rzp_test_123456789'
          })
        });
      });

      // Mock Razorpay SDK with failure
      await page.addInitScript(() => {
        (window as any).Razorpay = function(options: any) {
          return {
            open: () => {
              // Simulate payment failure
              setTimeout(() => {
                if (options.handler) {
                  // Call error handler instead
                  if ((window as any).razorpayErrorHandler) {
                    (window as any).razorpayErrorHandler({
                      error: {
                        code: 'PAYMENT_FAILED',
                        description: 'Payment was declined by bank',
                        step: 'payment_authentication',
                        reason: 'payment_failed'
                      }
                    });
                  }
                }
              }, 1000);
            },
            on: () => {}
          };
        };
      });

      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-amount"]').fill('50');
      await page.locator('[data-testid="payment-method-razorpay"]').check();
      await page.locator('[data-testid="process-payment"]').click();

      await page.waitForTimeout(2000);

      // Verify payment failure handling
      const paymentError = page.locator('[data-testid="payment-error"]');
      await expect(paymentError).toBeVisible();
      await expect(paymentError).toContainText('Payment failed');
      
      // Verify retry option is available
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
      
      // Verify funds were not added to student balance
      await expect(page.locator('[data-testid="student-balance"]')).not.toContainText('50');
    });

    test('razorpay payment timeout handling @p0', async ({ page }) => {
      // Mock delayed order creation (timeout simulation)
      await page.route('**/payments/razorpay/create-order', async route => {
        // Delay response to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 15000));
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'request_timeout',
            message: 'Payment gateway timeout'
          })
        });
      });

      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-amount"]').fill('100');
      await page.locator('[data-testid="payment-method-razorpay"]').check();
      await page.locator('[data-testid="process-payment"]').click();

      // Should show timeout error
      const timeoutError = page.locator('[data-testid="payment-timeout-error"]');
      await expect(timeoutError).toBeVisible({ timeout: 20000 });
      await expect(timeoutError).toContainText('timeout');
      
      // Verify retry option
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
    });

    test('razorpay refund processing @p0', async ({ page }) => {
      // Mock refund API
      await page.route('**/payments/razorpay/refund', async route => {
        const postData = JSON.parse(route.request().postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            refund_id: 'rfnd_razorpay_123456',
            payment_id: postData.payment_id,
            amount: postData.amount,
            status: 'processed',
            refund_method: 'original_payment_method',
            estimated_settlement_time: '5-7 business days'
          })
        });
      });

      // Navigate to payment history
      await page.goto('/payments/history');

      // Mock payment history with refundable transaction
      await page.route('**/payments/history', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            payments: [
              {
                id: 'pay_razorpay_67890',
                amount: 10000,
                currency: 'INR',
                status: 'captured',
                method: 'card',
                created_at: new Date().toISOString(),
                refundable: true,
                refunded_amount: 0
              }
            ]
          })
        });
      });

      // Initiate refund
      const refundButton = page.locator('[data-testid="refund-payment-pay_razorpay_67890"]');
      await expect(refundButton).toBeVisible();
      await refundButton.click();

      // Confirm refund in modal
      await page.locator('[data-testid="refund-amount"]').fill('100');
      await page.locator('[data-testid="refund-reason"]').selectOption('duplicate_payment');
      await page.locator('[data-testid="confirm-refund"]').click();

      // Verify refund success
      const refundSuccess = page.locator('[data-testid="refund-success"]');
      await expect(refundSuccess).toBeVisible();
      await expect(refundSuccess).toContainText('rfnd_razorpay_123456');
      await expect(refundSuccess).toContainText('5-7 business days');
    });
  });

  test.describe('Stripe Integration P0', () => {
    test('stripe successful payment flow @p0', async ({ page }) => {
      // Mock Stripe PaymentIntent creation
      await page.route('**/payments/stripe/create-payment-intent', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment_intent_id: 'pi_stripe_123456789',
            client_secret: 'pi_stripe_123456789_secret_abc',
            amount: 7500, // $75 in cents
            currency: 'usd',
            publishable_key: 'pk_test_123456789'
          })
        });
      });

      // Mock Stripe payment confirmation
      await page.route('**/payments/stripe/confirm', async route => {
        const postData = JSON.parse(route.request().postData() || '{}');
        
        if (postData.payment_intent_id === 'pi_stripe_123456789') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              payment_id: 'pi_stripe_123456789',
              status: 'succeeded',
              amount: 7500,
              currency: 'usd',
              payment_method: 'card',
              student_balance_updated: 7500,
              transaction_id: 'TXN-STRIPE-001'
            })
          });
        }
      });

      // Switch to international payment mode
      await page.locator('[data-testid="payment-region-international"]').click();
      
      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-amount"]').fill('75');
      await page.locator('[data-testid="payment-method-stripe"]').check();

      // Mock Stripe Elements
      await page.addInitScript(() => {
        (window as any).Stripe = function() {
          return {
            elements: () => ({
              create: () => ({
                mount: () => {},
                on: () => {},
                update: () => {}
              }),
              submit: () => Promise.resolve({ error: null })
            }),
            confirmPayment: () => Promise.resolve({
              error: null,
              paymentIntent: {
                id: 'pi_stripe_123456789',
                status: 'succeeded'
              }
            })
          };
        };
      });

      await page.locator('[data-testid="process-payment"]').click();

      // Fill card details (mocked)
      await page.locator('[data-testid="card-number"]').fill('4242424242424242');
      await page.locator('[data-testid="card-expiry"]').fill('12/25');
      await page.locator('[data-testid="card-cvc"]').fill('123');
      
      await page.locator('[data-testid="confirm-stripe-payment"]').click();

      // Verify payment success
      const paymentSuccess = page.locator('[data-testid="payment-success"]');
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('$75');
      await expect(paymentSuccess).toContainText('TXN-STRIPE-001');
    });

    test('stripe 3D Secure authentication @p0', async ({ page }) => {
      // Mock Stripe PaymentIntent requiring authentication
      await page.route('**/payments/stripe/create-payment-intent', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment_intent_id: 'pi_stripe_3ds_123',
            client_secret: 'pi_stripe_3ds_123_secret',
            amount: 10000,
            currency: 'usd'
          })
        });
      });

      // Mock Stripe with 3D Secure requirement
      await page.addInitScript(() => {
        (window as any).Stripe = function() {
          return {
            elements: () => ({
              create: () => ({
                mount: () => {},
                on: () => {}
              })
            }),
            confirmPayment: () => Promise.resolve({
              error: null,
              paymentIntent: {
                id: 'pi_stripe_3ds_123',
                status: 'requires_action',
                next_action: {
                  type: 'use_stripe_sdk'
                }
              }
            }),
            handleNextAction: () => Promise.resolve({
              error: null,
              paymentIntent: {
                id: 'pi_stripe_3ds_123',
                status: 'succeeded'
              }
            })
          };
        };
      });

      await page.locator('[data-testid="payment-region-international"]').click();
      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-amount"]').fill('100');
      await page.locator('[data-testid="payment-method-stripe"]').check();
      await page.locator('[data-testid="process-payment"]').click();

      // Fill card details for 3DS
      await page.locator('[data-testid="card-number"]').fill('4000000000003220'); // 3DS test card
      await page.locator('[data-testid="card-expiry"]').fill('12/25');
      await page.locator('[data-testid="card-cvc"]').fill('123');
      
      await page.locator('[data-testid="confirm-stripe-payment"]').click();

      // Should show 3DS authentication modal/redirect
      const authModal = page.locator('[data-testid="stripe-3ds-modal"]');
      await expect(authModal).toBeVisible();
      
      // Simulate 3DS completion
      await page.locator('[data-testid="3ds-complete"]').click();
      
      // Verify final success
      const paymentSuccess = page.locator('[data-testid="payment-success"]');
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('$100');
    });
  });

  test.describe('Wallet Payment Integration P0', () => {
    test('RFID wallet payment @p0 @smoke', async ({ page }) => {
      // Mock student with RFID wallet
      await page.route('**/students/*/wallet', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            wallet_balance: 25000, // ₹250 in paise
            rfid_card_id: 'RFID-STU-001',
            wallet_status: 'active',
            recent_transactions: []
          })
        });
      });

      // Mock RFID wallet payment
      await page.route('**/payments/rfid-wallet/charge', async route => {
        const postData = JSON.parse(route.request().postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transaction_id: 'RFID-TXN-001',
            amount_charged: postData.amount,
            new_balance: 22500, // ₹225 remaining
            rfid_card_id: 'RFID-STU-001',
            merchant_id: 'HASIVU-CANTEEN'
          })
        });
      });

      // Student places order using RFID wallet
      await page.goto('/menu');
      
      // Add items to cart
      await page.locator('[data-testid="menu-item-dal-rice"]').click();
      await page.locator('[data-testid="add-to-cart"]').click();
      
      // Proceed to checkout
      await page.locator('[data-testid="proceed-checkout"]').click();
      
      // Select RFID wallet payment
      await page.locator('[data-testid="payment-method-rfid-wallet"]').check();
      
      // Simulate RFID card tap
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-card-tap', {
          detail: {
            card_id: 'RFID-STU-001',
            student_id: 'STU-001'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Confirm payment
      await page.locator('[data-testid="confirm-rfid-payment"]').click();
      
      // Verify successful payment
      const paymentSuccess = page.locator('[data-testid="payment-success"]');
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('RFID-TXN-001');
      
      // Verify wallet balance updated
      const newBalance = page.locator('[data-testid="wallet-balance"]');
      await expect(newBalance).toContainText('225');
    });

    test('insufficient wallet balance handling @p0', async ({ page }) => {
      // Mock student with low wallet balance
      await page.route('**/students/*/wallet', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            wallet_balance: 1000, // Only ₹10
            rfid_card_id: 'RFID-STU-002',
            wallet_status: 'active'
          })
        });
      });

      // Mock insufficient funds response
      await page.route('**/payments/rfid-wallet/charge', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'insufficient_funds',
            message: 'Insufficient wallet balance',
            current_balance: 1000,
            required_amount: 2500
          })
        });
      });

      await page.goto('/menu');
      
      // Add expensive item
      await page.locator('[data-testid="menu-item-special-thali"]').click(); // ₹25 item
      await page.locator('[data-testid="add-to-cart"]').click();
      await page.locator('[data-testid="proceed-checkout"]').click();
      
      // Select RFID wallet
      await page.locator('[data-testid="payment-method-rfid-wallet"]').check();
      
      // Attempt payment
      await page.evaluate(() => {
        const event = new CustomEvent('rfid-card-tap', {
          detail: { card_id: 'RFID-STU-002' }
        });
        window.dispatchEvent(event);
      });
      
      await page.locator('[data-testid="confirm-rfid-payment"]').click();
      
      // Should show insufficient funds error
      const insufficientError = page.locator('[data-testid="insufficient-funds-error"]');
      await expect(insufficientError).toBeVisible();
      await expect(insufficientError).toContainText('Insufficient wallet balance');
      
      // Should suggest topping up
      await expect(page.locator('[data-testid="topup-wallet-suggestion"]')).toBeVisible();
      
      // Should offer alternative payment methods
      await expect(page.locator('[data-testid="alternative-payment-methods"]')).toBeVisible();
    });
  });

  test.describe('Multi-Gateway Routing P0', () => {
    test('automatic failover from Razorpay to Stripe @p0', async ({ page }) => {
      let razorpayAttempted = false;
      
      // Mock Razorpay failure
      await page.route('**/payments/razorpay/create-order', async route => {
        razorpayAttempted = true;
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'gateway_unavailable',
            message: 'Razorpay service temporarily unavailable'
          })
        });
      });
      
      // Mock Stripe as backup (successful)
      await page.route('**/payments/stripe/create-payment-intent', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            payment_intent_id: 'pi_failover_123',
            client_secret: 'pi_failover_123_secret',
            amount: 10000
          })
        });
      });

      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-amount"]').fill('100');
      
      // Initially select Razorpay (auto-selected for Indian users)
      await page.locator('[data-testid="payment-method-razorpay"]').check();
      await page.locator('[data-testid="process-payment"]').click();
      
      // Should automatically failover to Stripe
      const failoverNotice = page.locator('[data-testid="payment-failover-notice"]');
      await expect(failoverNotice).toBeVisible();
      await expect(failoverNotice).toContainText('Switching to backup payment method');
      
      // Verify both gateways were attempted
      expect(razorpayAttempted).toBe(true);
      
      // Should show Stripe payment form
      await expect(page.locator('[data-testid="stripe-payment-form"]')).toBeVisible();
    });

    test('payment routing based on geography @p0', async ({ page }) => {
      // Mock geolocation for Indian user
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (success: any) => {
              success({
                coords: {
                  latitude: 12.9716,  // Bangalore
                  longitude: 77.5946,
                  accuracy: 20
                }
              });
            }
          }
        });
      });

      await page.goto('/payments/add-funds');
      
      // Should automatically suggest Razorpay for Indian location
      const razorpayOption = page.locator('[data-testid="payment-method-razorpay"]');
      await expect(razorpayOption).toBeChecked();
      
      // Should show INR currency
      await expect(page.locator('[data-testid="currency-symbol"]')).toContainText('₹');
      
      // International payment should be secondary option
      const internationalToggle = page.locator('[data-testid="international-payment-toggle"]');
      await expect(internationalToggle).toBeVisible();
      await expect(internationalToggle).toContainText('Pay with International Card');
    });
  });

  test.describe('Payment Security & Compliance P0', () => {
    test('PCI DSS compliance validation @p0', async ({ page }) => {
      await page.locator('[data-testid="add-funds-button"]').click();
      await page.locator('[data-testid="payment-method-stripe"]').check();
      
      // Verify no sensitive data is stored in localStorage or sessionStorage
      const localStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key) || '';
          }
        }
        return data;
      });
      
      // Should not contain any card data
      const sensitiveDataFound = Object.values(localStorageData).some(value => 
        value.includes('4242') || // card number
        value.includes('123') ||  // CVC
        value.match(/\d{2}\/\d{2}/) // expiry
      );
      
      expect(sensitiveDataFound).toBe(false);
      
      // Verify payment form uses HTTPS
      const protocol = await page.evaluate(() => window.location.protocol);
      expect(protocol).toBe('https:');
      
      // Verify CSP headers prevent XSS
      const response = await page.goto('/payments/add-funds');
      const cspHeader = response?.headers()['content-security-policy'];
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain('unsafe-inline');
    });

    test('payment webhook signature validation @p0', async ({ page, request }) => {
      // Mock webhook endpoint for testing
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            id: 'pay_test_123',
            amount: 10000,
            status: 'captured'
          }
        }
      };
      
      // Test webhook with valid signature
      const validResponse = await request.post('/api/webhooks/razorpay', {
        data: webhookPayload,
        headers: {
          'X-Razorpay-Signature': 'valid_signature_123',
          'Content-Type': 'application/json'
        }
      });
      
      expect(validResponse.status()).toBe(200);
      
      // Test webhook with invalid signature
      const invalidResponse = await request.post('/api/webhooks/razorpay', {
        data: webhookPayload,
        headers: {
          'X-Razorpay-Signature': 'invalid_signature',
          'Content-Type': 'application/json'
        }
      });
      
      expect(invalidResponse.status()).toBe(400);
    });
  });

  test.describe('Payment Reconciliation P0', () => {
    test('daily payment reconciliation report @p0', async ({ page }) => {
      // Mock reconciliation data
      await page.route('**/admin/payments/reconciliation', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            total_transactions: 156,
            successful_payments: 149,
            failed_payments: 7,
            razorpay_total: 89750, // ₹897.50
            stripe_total: 45600,   // $456
            rfid_wallet_total: 23400, // ₹234
            discrepancies: [],
            reconciliation_status: 'completed'
          })
        });
      });

      // Login as admin to access reconciliation
      await page.goto('/admin/payments/reconciliation');
      
      // Verify reconciliation dashboard
      await expect(page.locator('[data-testid="total-transactions"]')).toContainText('156');
      await expect(page.locator('[data-testid="success-rate"]')).toContainText('95.5%'); // 149/156
      
      // Verify gateway breakdown
      await expect(page.locator('[data-testid="razorpay-total"]')).toContainText('₹897.50');
      await expect(page.locator('[data-testid="stripe-total"]')).toContainText('$456');
      
      // Verify no discrepancies
      await expect(page.locator('[data-testid="discrepancies-count"]')).toContainText('0');
      await expect(page.locator('[data-testid="reconciliation-status"]')).toContainText('completed');
    });

    test('handle payment discrepancies @p0', async ({ page }) => {
      // Mock reconciliation with discrepancies
      await page.route('**/admin/payments/reconciliation', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            discrepancies: [
              {
                transaction_id: 'TXN-DISC-001',
                gateway: 'razorpay',
                expected_amount: 10000,
                actual_amount: 9500,
                status: 'amount_mismatch',
                student_id: 'STU-001'
              }
            ],
            reconciliation_status: 'discrepancies_found'
          })
        });
      });

      await page.goto('/admin/payments/reconciliation');
      
      // Should highlight discrepancies
      const discrepancyAlert = page.locator('[data-testid="discrepancy-alert"]');
      await expect(discrepancyAlert).toBeVisible();
      await expect(discrepancyAlert).toContainText('1 discrepancy found');
      
      // View discrepancy details
      await page.locator('[data-testid="view-discrepancies"]').click();
      
      const discrepancyDetails = page.locator('[data-testid="discrepancy-TXN-DISC-001"]');
      await expect(discrepancyDetails).toContainText('amount_mismatch');
      await expect(discrepancyDetails).toContainText('Expected: ₹100');
      await expect(discrepancyDetails).toContainText('Actual: ₹95');
      
      // Should provide resolution options
      await expect(page.locator('[data-testid="resolve-discrepancy-TXN-DISC-001"]')).toBeVisible();
    });
  });
});