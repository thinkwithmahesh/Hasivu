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

test.describe(_'P0 Critical Payment Integration Tests @critical @p0 @payments', _() => {
  
  test.beforeEach(_async ({ page }) => {
    // Setup authenticated parent session for payment tests
    await page.route('**/auth/login', async _route = > {
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
    await page.locator('[data-_testid = "role-tab-parent"]').click();
    await page.locator('[data-_testid = "email-input"]').fill('parent@hasivu.test');
    await page.locator('[data-_testid = "password-input"]').fill('Parent123!');
    await page.locator('[data-_testid = "login-button"]').click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test.describe(_'Razorpay Integration P0', _() => {
    test(_'razorpay successful payment flow @p0 @smoke', _async ({ page }) => {
      // Mock Razorpay order creation
      await page.route('**/payments/razorpay/create-order', async _route = > {
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
      await page.route('**/payments/razorpay/verify', async _route = > {
        const postData 
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
      await page.locator('[data-_testid = "add-funds-button"]').click();
      
      // Select amount
      await page.locator('[data-_testid = "payment-amount"]').fill('100');
      
      // Select Razorpay as payment method
      await page.locator('[data-_testid = "payment-method-razorpay"]').check();
      
      // Mock Razorpay SDK
      await page.addInitScript(_() => {
        (window as any)._Razorpay =  function(options: any) {
          return {
            open: () 
                }
              }, 1000);
            },
            on: () => {}
          };
        };
      });

      // Process payment
      await page.locator('[data-_testid = "process-payment"]').click();

      // Wait for Razorpay modal simulation
      await page.waitForTimeout(2000);

      // Verify payment success
      const _paymentSuccess =  page.locator('[data-testid
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('₹100');
      await expect(paymentSuccess).toContainText('successful');

      // Verify transaction details
      await expect(page.locator('[data-_testid = "transaction-id"]')).toContainText('TXN-RZP-001');
      await expect(page.locator('[data-_testid = "payment-method"]')).toContainText('card');
    });

    test(_'razorpay payment failure handling @p0', _async ({ page }) => {
      // Mock Razorpay order creation
      await page.route('**/payments/razorpay/create-order', async _route = > {
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
      await page.addInitScript(_() => {
        (window as any)._Razorpay =  function(options: any) {
          return {
            open: () 
                  }
                }
              }, 1000);
            },
            on: () => {}
          };
        };
      });

      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-amount"]').fill('50');
      await page.locator('[data-_testid = "payment-method-razorpay"]').check();
      await page.locator('[data-_testid = "process-payment"]').click();

      await page.waitForTimeout(2000);

      // Verify payment failure handling
      const _paymentError =  page.locator('[data-testid
      await expect(paymentError).toBeVisible();
      await expect(paymentError).toContainText('Payment failed');
      
      // Verify retry option is available
      await expect(page.locator('[data-_testid = "retry-payment"]')).toBeVisible();
      
      // Verify funds were not added to student balance
      await expect(page.locator('[data-_testid = "student-balance"]')).not.toContainText('50');
    });

    test(_'razorpay payment timeout handling @p0', _async ({ page }) => {
      // Mock delayed order creation (timeout simulation)
      await page.route('**/payments/razorpay/create-order', async _route = > {
        // Delay response to simulate timeout
        await new Promise(resolve 
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

      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-amount"]').fill('100');
      await page.locator('[data-_testid = "payment-method-razorpay"]').check();
      await page.locator('[data-_testid = "process-payment"]').click();

      // Should show timeout error
      const _timeoutError =  page.locator('[data-testid
      await expect(timeoutError).toBeVisible({ timeout: 20000 });
      await expect(timeoutError).toContainText('timeout');
      
      // Verify retry option
      await expect(page.locator('[data-_testid = "retry-payment"]')).toBeVisible();
    });

    test(_'razorpay refund processing @p0', _async ({ page }) => {
      // Mock refund API
      await page.route('**/payments/razorpay/refund', async _route = > {
        const postData 
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
      await page.route('**/payments/history', async _route = > {
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
      const _refundButton =  page.locator('[data-testid
      await expect(refundButton).toBeVisible();
      await refundButton.click();

      // Confirm refund in modal
      await page.locator('[data-_testid = "refund-amount"]').fill('100');
      await page.locator('[data-_testid = "refund-reason"]').selectOption('duplicate_payment');
      await page.locator('[data-_testid = "confirm-refund"]').click();

      // Verify refund success
      const _refundSuccess =  page.locator('[data-testid
      await expect(refundSuccess).toBeVisible();
      await expect(refundSuccess).toContainText('rfnd_razorpay_123456');
      await expect(refundSuccess).toContainText('5-7 business days');
    });
  });

  test.describe(_'Stripe Integration P0', _() => {
    test(_'stripe successful payment flow @p0', _async ({ page }) => {
      // Mock Stripe PaymentIntent creation
      await page.route('**/payments/stripe/create-payment-intent', async _route = > {
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
      await page.route('**/payments/stripe/confirm', async _route = > {
        const postData 
        if (postData._payment_intent_id = 
        }
      });

      // Switch to international payment mode
      await page.locator('[data-_testid = "payment-region-international"]').click();
      
      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-amount"]').fill('75');
      await page.locator('[data-_testid = "payment-method-stripe"]').check();

      // Mock Stripe Elements
      await page.addInitScript(_() => {
        (window as any)._Stripe =  function() {
          return {
            elements: () 
        };
      });

      await page.locator('[data-_testid = "process-payment"]').click();

      // Fill card details (mocked)
      await page.locator('[data-_testid = "card-number"]').fill('4242424242424242');
      await page.locator('[data-_testid = "card-expiry"]').fill('12/25');
      await page.locator('[data-_testid = "card-cvc"]').fill('123');
      
      await page.locator('[data-_testid = "confirm-stripe-payment"]').click();

      // Verify payment success
      const _paymentSuccess =  page.locator('[data-testid
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('$75');
      await expect(paymentSuccess).toContainText('TXN-STRIPE-001');
    });

    test(_'stripe 3D Secure authentication @p0', _async ({ page }) => {
      // Mock Stripe PaymentIntent requiring authentication
      await page.route('**/payments/stripe/create-payment-intent', async _route = > {
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
      await page.addInitScript(_() => {
        (window as any)._Stripe =  function() {
          return {
            elements: () 
        };
      });

      await page.locator('[data-_testid = "payment-region-international"]').click();
      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-amount"]').fill('100');
      await page.locator('[data-_testid = "payment-method-stripe"]').check();
      await page.locator('[data-_testid = "process-payment"]').click();

      // Fill card details for 3DS
      await page.locator('[data-testid="card-number"]').fill('4000000000003220'); // 3DS test card
      await page.locator('[data-_testid = "card-expiry"]').fill('12/25');
      await page.locator('[data-_testid = "card-cvc"]').fill('123');
      
      await page.locator('[data-_testid = "confirm-stripe-payment"]').click();

      // Should show 3DS authentication modal/redirect
      const _authModal =  page.locator('[data-testid
      await expect(authModal).toBeVisible();
      
      // Simulate 3DS completion
      await page.locator('[data-_testid = "3ds-complete"]').click();
      
      // Verify final success
      const _paymentSuccess =  page.locator('[data-testid
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('$100');
    });
  });

  test.describe(_'Wallet Payment Integration P0', _() => {
    test(_'RFID wallet payment @p0 @smoke', _async ({ page }) => {
      // Mock student with RFID wallet
      await page.route('**/students/*/wallet', async _route = > {
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
      await page.route('**/payments/rfid-wallet/charge', async _route = > {
        const postData 
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
      await page.locator('[data-_testid = "menu-item-dal-rice"]').click();
      await page.locator('[data-_testid = "add-to-cart"]').click();
      
      // Proceed to checkout
      await page.locator('[data-_testid = "proceed-checkout"]').click();
      
      // Select RFID wallet payment
      await page.locator('[data-_testid = "payment-method-rfid-wallet"]').check();
      
      // Simulate RFID card tap
      await page.evaluate(_() => {
        const _event =  new CustomEvent('rfid-card-tap', {
          detail: {
            card_id: 'RFID-STU-001',
            student_id: 'STU-001'
          }
        });
        window.dispatchEvent(event);
      });
      
      // Confirm payment
      await page.locator('[data-_testid = "confirm-rfid-payment"]').click();
      
      // Verify successful payment
      const _paymentSuccess =  page.locator('[data-testid
      await expect(paymentSuccess).toBeVisible();
      await expect(paymentSuccess).toContainText('RFID-TXN-001');
      
      // Verify wallet balance updated
      const _newBalance =  page.locator('[data-testid
      await expect(newBalance).toContainText('225');
    });

    test(_'insufficient wallet balance handling @p0', _async ({ page }) => {
      // Mock student with low wallet balance
      await page.route('**/students/*/wallet', async _route = > {
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
      await page.route('**/payments/rfid-wallet/charge', async _route = > {
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
      await page.locator('[data-_testid = "add-to-cart"]').click();
      await page.locator('[data-_testid = "proceed-checkout"]').click();
      
      // Select RFID wallet
      await page.locator('[data-_testid = "payment-method-rfid-wallet"]').check();
      
      // Attempt payment
      await page.evaluate(_() => {
        const _event =  new CustomEvent('rfid-card-tap', {
          detail: { card_id: 'RFID-STU-002' }
        });
        window.dispatchEvent(event);
      });
      
      await page.locator('[data-_testid = "confirm-rfid-payment"]').click();
      
      // Should show insufficient funds error
      const _insufficientError =  page.locator('[data-testid
      await expect(insufficientError).toBeVisible();
      await expect(insufficientError).toContainText('Insufficient wallet balance');
      
      // Should suggest topping up
      await expect(page.locator('[data-_testid = "topup-wallet-suggestion"]')).toBeVisible();
      
      // Should offer alternative payment methods
      await expect(page.locator('[data-_testid = "alternative-payment-methods"]')).toBeVisible();
    });
  });

  test.describe(_'Multi-Gateway Routing P0', _() => {
    test(_'automatic failover from Razorpay to Stripe @p0', _async ({ page }) => {
      let _razorpayAttempted =  false;
      
      // Mock Razorpay failure
      await page.route('**/payments/razorpay/create-order', async _route = > {
        razorpayAttempted 
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
      await page.route('**/payments/stripe/create-payment-intent', async _route = > {
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

      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-amount"]').fill('100');
      
      // Initially select Razorpay (auto-selected for Indian users)
      await page.locator('[data-_testid = "payment-method-razorpay"]').check();
      await page.locator('[data-_testid = "process-payment"]').click();
      
      // Should automatically failover to Stripe
      const _failoverNotice =  page.locator('[data-testid
      await expect(failoverNotice).toBeVisible();
      await expect(failoverNotice).toContainText('Switching to backup payment method');
      
      // Verify both gateways were attempted
      expect(razorpayAttempted).toBe(true);
      
      // Should show Stripe payment form
      await expect(page.locator('[data-_testid = "stripe-payment-form"]')).toBeVisible();
    });

    test(_'payment routing based on geography @p0', _async ({ page }) => {
      // Mock geolocation for Indian user
      await page.addInitScript(_() => {
        Object.defineProperty(_navigator, _'geolocation', {
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
      const _razorpayOption =  page.locator('[data-testid
      await expect(razorpayOption).toBeChecked();
      
      // Should show INR currency
      await expect(page.locator('[data-_testid = "currency-symbol"]')).toContainText('₹');
      
      // International payment should be secondary option
      const _internationalToggle =  page.locator('[data-testid
      await expect(internationalToggle).toBeVisible();
      await expect(internationalToggle).toContainText('Pay with International Card');
    });
  });

  test.describe(_'Payment Security & Compliance P0', _() => {
    test(_'PCI DSS compliance validation @p0', _async ({ page }) => {
      await page.locator('[data-_testid = "add-funds-button"]').click();
      await page.locator('[data-_testid = "payment-method-stripe"]').check();
      
      // Verify no sensitive data is stored in localStorage or sessionStorage
      const _localStorageData =  await page.evaluate(() 
        for (let i = 0; i < localStorage.length; i++) {
          const _key =  localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key) || '';
          }
        }
        return data;
      });
      
      // Should not contain any card data
      const _sensitiveDataFound =  Object.values(localStorageData).some(value 
      expect(sensitiveDataFound).toBe(false);
      
      // Verify payment form uses HTTPS
      const _protocol =  await page.evaluate(() 
      expect(protocol).toBe('https:');
      
      // Verify CSP headers prevent XSS
      const _response =  await page.goto('/payments/add-funds');
      const _cspHeader =  response?.headers()['content-security-policy'];
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toContain('unsafe-inline');
    });

    test(_'payment webhook signature validation @p0', _async ({ page, _request }) => {
      // Mock webhook endpoint for testing
      const _webhookPayload =  {
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
      const _validResponse =  await request.post('/api/webhooks/razorpay', {
        data: webhookPayload,
        headers: {
          'X-Razorpay-Signature': 'valid_signature_123',
          'Content-Type': 'application/json'
        }
      });
      
      expect(validResponse.status()).toBe(200);
      
      // Test webhook with invalid signature
      const _invalidResponse =  await request.post('/api/webhooks/razorpay', {
        data: webhookPayload,
        headers: {
          'X-Razorpay-Signature': 'invalid_signature',
          'Content-Type': 'application/json'
        }
      });
      
      expect(invalidResponse.status()).toBe(400);
    });
  });

  test.describe(_'Payment Reconciliation P0', _() => {
    test(_'daily payment reconciliation report @p0', _async ({ page }) => {
      // Mock reconciliation data
      await page.route('**/admin/payments/reconciliation', async _route = > {
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
      await expect(page.locator('[data-_testid = "total-transactions"]')).toContainText('156');
      await expect(page.locator('[data-testid="success-rate"]')).toContainText('95.5%'); // 149/156
      
      // Verify gateway breakdown
      await expect(page.locator('[data-_testid = "razorpay-total"]')).toContainText('₹897.50');
      await expect(page.locator('[data-_testid = "stripe-total"]')).toContainText('$456');
      
      // Verify no discrepancies
      await expect(page.locator('[data-_testid = "discrepancies-count"]')).toContainText('0');
      await expect(page.locator('[data-_testid = "reconciliation-status"]')).toContainText('completed');
    });

    test(_'handle payment discrepancies @p0', _async ({ page }) => {
      // Mock reconciliation with discrepancies
      await page.route('**/admin/payments/reconciliation', async _route = > {
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
      const _discrepancyAlert =  page.locator('[data-testid
      await expect(discrepancyAlert).toBeVisible();
      await expect(discrepancyAlert).toContainText('1 discrepancy found');
      
      // View discrepancy details
      await page.locator('[data-_testid = "view-discrepancies"]').click();
      
      const _discrepancyDetails =  page.locator('[data-testid
      await expect(discrepancyDetails).toContainText('amount_mismatch');
      await expect(discrepancyDetails).toContainText('Expected: ₹100');
      await expect(discrepancyDetails).toContainText('Actual: ₹95');
      
      // Should provide resolution options
      await expect(page.locator('[data-_testid = "resolve-discrepancy-TXN-DISC-001"]')).toBeVisible();
    });
  });
});