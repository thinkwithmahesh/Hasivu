/**
 * HASIVU Order Management API Test Suite
 * Use this once backend is implemented to validate order workflow
 */

const HASIVUAPITester = require('./api-tester');

class OrderWorkflowTester extends HASIVUAPITester {
  constructor(baseURL = 'http://localhost:8000') {
    super(baseURL);
    this.testOrderId = null;
    this.testUserId = 'student-test-001';
  }

  // Test complete order workflow
  async testOrderLifecycle() {
    this.log('INFO', '=== Testing Complete Order Lifecycle ===');

    // 1. Create Order
    const orderData = {
      userId: this.testUserId,
      schoolId: this.schoolTenantId,
      items: [
        { id: '1', name: 'Mini Idli with Sambar', quantity: 2, price: 45 },
        { id: '4', name: 'Dal Rice', quantity: 1, price: 25 },
      ],
      totalAmount: 115,
      deliveryType: 'pickup',
      paymentMethod: 'wallet',
      deliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    };

    const createResponse = await this.makeRequest('POST', '/api/orders', orderData);
    if (createResponse?.data?.data?.id) {
      this.testOrderId = createResponse.data.data.id;
      this.log('SUCCESS', `Order created with ID: ${this.testOrderId}`);
    } else {
      this.log('ERROR', 'Failed to create test order');
      return;
    }

    // 2. Verify Order Creation
    await this.makeRequest('GET', `/api/orders/${this.testOrderId}`);

    // 3. Test Order Status Updates
    const statusUpdates = ['confirmed', 'preparing', 'ready', 'delivered'];
    for (const status of statusUpdates) {
      await this.makeRequest('PATCH', `/api/orders/${this.testOrderId}/status`, { status });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    // 4. Test Order History
    await this.makeRequest('GET', `/api/orders/user/${this.testUserId}`);

    this.log('SUCCESS', 'Order lifecycle test completed');
  }

  // Test kitchen workflow integration
  async testKitchenIntegration() {
    this.log('INFO', '=== Testing Kitchen Workflow Integration ===');

    if (!this.testOrderId) {
      this.log('WARNING', 'No test order available for kitchen tests');
      return;
    }

    // Kitchen receives order
    await this.makeRequest('GET', '/api/kitchen/orders/pending');

    // Start preparing order
    await this.makeRequest('POST', `/api/kitchen/orders/${this.testOrderId}/start`);

    // Set preparation time
    await this.makeRequest('POST', '/api/kitchen/prep-time', {
      orderId: this.testOrderId,
      estimatedTime: 15,
    });

    // Complete order
    await this.makeRequest('POST', `/api/kitchen/orders/${this.testOrderId}/complete`);

    // Check kitchen analytics
    await this.makeRequest('GET', '/api/kitchen/analytics');
  }

  // Test payment integration
  async testPaymentWorkflow() {
    this.log('INFO', '=== Testing Payment Workflow ===');

    // Check wallet balance
    await this.makeRequest('GET', `/api/wallet/balance/${this.testUserId}`);

    // Top up wallet
    await this.makeRequest('POST', '/api/wallet/topup', {
      userId: this.testUserId,
      amount: 500,
      paymentMethod: 'razorpay',
    });

    // Process order payment
    if (this.testOrderId) {
      await this.makeRequest('POST', '/api/payments/create', {
        orderId: this.testOrderId,
        amount: 115,
        paymentMethod: 'wallet',
      });
    }

    // Check payment history
    await this.makeRequest('GET', `/api/payments/history/${this.testUserId}`);
  }

  // Test error scenarios
  async testErrorScenarios() {
    this.log('INFO', '=== Testing Error Scenarios ===');

    // Test invalid order creation
    await this.makeRequest('POST', '/api/orders', {
      // Missing required fields
      userId: this.testUserId,
    });

    // Test invalid order ID
    await this.makeRequest('GET', '/api/orders/invalid-order-id');

    // Test unauthorized access
    await this.makeRequest('GET', '/api/orders', null, { 'X-Tenant-ID': 'wrong-school' });

    // Test insufficient wallet balance
    await this.makeRequest('POST', '/api/wallet/deduct', {
      userId: this.testUserId,
      amount: 99999,
      orderId: 'test-order',
    });
  }

  // Performance test under load
  async testOrderCreationLoad() {
    this.log('INFO', '=== Testing Order Creation Under Load ===');

    const concurrentOrders = 5;
    const promises = [];

    for (let i = 0; i < concurrentOrders; i++) {
      const orderData = {
        userId: `student-load-test-${i}`,
        schoolId: this.schoolTenantId,
        items: [{ id: '1', name: 'Test Meal', quantity: 1, price: 50 }],
        totalAmount: 50,
        deliveryType: 'pickup',
        paymentMethod: 'wallet',
      };

      promises.push(this.makeRequest('POST', '/api/orders', orderData));
    }

    const startTime = performance.now();
    const results = await Promise.all(promises);
    const endTime = performance.now();

    const successCount = results.filter(r => r?.status === 200 || r?.status === 201).length;

    this.log(
      'INFO',
      `Load test completed: ${successCount}/${concurrentOrders} orders created in ${(endTime - startTime).toFixed(2)}ms`
    );
  }

  // Run all order-specific tests
  async runOrderTests() {
    this.log('INFO', '🚀 Starting HASIVU Order Management API Tests');

    try {
      await this.testOrderLifecycle();
      await this.testKitchenIntegration();
      await this.testPaymentWorkflow();
      await this.testErrorScenarios();
      await this.testOrderCreationLoad();

      // Run parent class tests for complete coverage
      await this.runComprehensiveTests();

      this.log('SUCCESS', '✅ All order management tests completed');
    } catch (error) {
      this.log('ERROR', '❌ Order management tests failed', error.message);
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseURL = process.argv[2] || 'http://localhost:8000';
  const tester = new OrderWorkflowTester(baseURL);

  tester
    .runOrderTests()
    .then(report => {
      console.log('\n🎯 Order Management API Testing Complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Order Management API Testing Failed:', error);
      process.exit(1);
    });
}

module.exports = OrderWorkflowTester;
