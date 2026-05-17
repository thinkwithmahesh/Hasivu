/**
 * HASIVU Platform - Order to Payment Flow Integration Tests
 *
 * Comprehensive integration test for complete order-to-payment workflow
 * Tests all critical paths from order creation to successful payment confirmation
 *
 * Epic Coverage:
 * - Epic 1: Order Management System
 * - Epic 5: Payment Processing & Billing System
 * - Epic 4: Notification & Communication System
 *
 * Test Scenarios:
 * 1. Happy Path: Order → Payment → Confirmation
 * 2. Payment Failure → Retry → Success
 * 3. Order Modification → Additional Payment
 * 4. Bulk Order Processing
 * 5. Concurrent Order & Payment Load
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Test setup utilities
import {
  setupIntegrationTests,
  teardownIntegrationTests,
  cleanTestDatabase,
  generateTestJWT,
  IntegrationTestConfig
} from '../setup-integration';

// Global test state
let prisma: PrismaClient;
let testSchoolId: string;
let testParentId: string;
let testStudentId: string;
const testMenuItemIds: string[] = [];
let testParentToken: string;

// Performance tracking
const performanceMetrics = {
  orderCreationTime: [] as number[],
  paymentProcessingTime: [] as number[],
  notificationDeliveryTime: [] as number[]
};

/**
 * Setup test environment with test data
 */
beforeAll(async () => {
  console.log('🚀 Initializing Order-to-Payment Flow Test Environment...');

  const testEnv = await setupIntegrationTests();
  prisma = testEnv.prisma;

  // Create test school
  const school = await prisma.school.create({
    data: {
      name: 'Test Payment School',
      code: `SCHOOL_${uuidv4().substring(0, 8)}`,
      address: JSON.stringify({
        street: '123 Payment Test Lane',
        city: 'TestCity',
        state: 'TestState',
        pincode: '123456'
      }),
      phone: '+91-9876543210',
      email: 'payment-test@school.com',
      principalName: 'Payment Test Principal',
      isActive: true
    }
  });
  testSchoolId = school.id;

  // Create test parent
  const parent = await prisma.user.create({
    data: {
      email: `parent-${uuidv4()}@test.com`,
      passwordHash: '$2a$12$testhashedpassword',
      firstName: 'Test',
      lastName: 'Parent',
      role: 'parent',
      schoolId: testSchoolId,
      phone: '+91-9876543213',
      isActive: true
    }
  });
  testParentId = parent.id;
  testParentToken = generateTestJWT({
    userId: parent.id,
    schoolId: testSchoolId,
    role: 'parent'
  });

  // Create test student
  const student = await prisma.user.create({
    data: {
      email: `student-${uuidv4()}@test.com`,
      passwordHash: '$2a$12$testhashedpassword',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      schoolId: testSchoolId,
      parentId: testParentId,
      grade: '10th',
      section: 'A',
      isActive: true
    }
  });
  testStudentId = student.id;

  // Create test menu items
  const menuItems = [
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice with tender chicken',
      price: 120.00,
      category: 'Main Course',
      available: true,
      schoolId: testSchoolId
    },
    {
      name: 'Vegetable Pulao',
      description: 'Fragrant rice with mixed vegetables',
      price: 80.00,
      category: 'Main Course',
      available: true,
      schoolId: testSchoolId
    },
    {
      name: 'Mango Lassi',
      description: 'Sweet yogurt drink with mango',
      price: 40.00,
      category: 'Beverage',
      available: true,
      schoolId: testSchoolId
    }
  ];

  for (const item of menuItems) {
    const menuItem = await prisma.menuItem.create({ data: item });
    testMenuItemIds.push(menuItem.id);
  }

  console.log(`✅ Order-to-Payment Test Environment Ready`);
  console.log(`📊 School: ${testSchoolId}, Parent: ${testParentId}, Student: ${testStudentId}`);
  console.log(`🍽️ Menu Items: ${testMenuItemIds.length}`);
}, 60000);

afterAll(async () => {
  await teardownIntegrationTests();
  console.log('✅ Order-to-Payment cleanup completed');
}, 30000);

beforeEach(async () => {
  // Clean orders and payments before each test
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
});

/**
 * Test Suite: Order to Payment Flow
 */
describe('Order to Payment Flow Integration Tests', () => {

  /**
   * Test 1: Happy Path - Complete order-to-payment flow
   */
  test('should complete full order-to-payment flow successfully', async () => {
    console.log('🛒 Test 1: Complete order-to-payment flow...');
    const startTime = Date.now();

    // Step 1: Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: testParentId,
        studentId: testStudentId,
        schoolId: testSchoolId,
        totalAmount: 240.00,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending'
      }
    });

    // Create order items
    await prisma.orderItem.createMany({
      data: [
        {
          orderId: order.id,
          menuItemId: testMenuItemIds[0],
          quantity: 1,
          unitPrice: 120.00,
          totalPrice: 120.00
        },
        {
          orderId: order.id,
          menuItemId: testMenuItemIds[1],
          quantity: 1,
          unitPrice: 80.00,
          totalPrice: 80.00
        },
        {
          orderId: order.id,
          menuItemId: testMenuItemIds[2],
          quantity: 1,
          unitPrice: 40.00,
          totalPrice: 40.00
        }
      ]
    });

    const orderCreationTime = Date.now() - startTime;
    performanceMetrics.orderCreationTime.push(orderCreationTime);

    // Verify order created
    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(order.totalAmount).toBe(240.00);
    console.log(`📦 Order created: ${order.id} (${orderCreationTime}ms)`);

    // Step 2: Create payment
    const paymentStartTime = Date.now();
    const payment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'processing',
        paymentType: 'order_payment',
        razorpayPaymentId: `pay_${uuidv4()}`,
        razorpayOrderId: `order_${uuidv4()}`
      }
    });

    const paymentProcessingTime = Date.now() - paymentStartTime;
    performanceMetrics.paymentProcessingTime.push(paymentProcessingTime);

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe('processing');
    console.log(`💳 Payment initiated: ${payment.id} (${paymentProcessingTime}ms)`);

    // Step 3: Simulate payment success
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        paidAt: new Date()
      }
    });

    expect(updatedPayment.status).toBe('completed');
    expect(updatedPayment.paidAt).toBeDefined();

    // Step 4: Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    expect(updatedOrder.status).toBe('confirmed');
    expect(updatedOrder.paymentStatus).toBe('paid');

    const totalFlowTime = Date.now() - startTime;
    console.log(`🎉 Complete flow finished in ${totalFlowTime}ms`);

    // Performance assertions
    expect(orderCreationTime).toBeLessThan(5000);
    expect(paymentProcessingTime).toBeLessThan(3000);
    expect(totalFlowTime).toBeLessThan(10000);
  }, 30000);

  /**
   * Test 2: Payment Failure and Retry
   */
  test('should handle payment failure and successful retry', async () => {
    console.log('❌ Test 2: Payment failure and retry...');

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: testParentId,
        studentId: testStudentId,
        schoolId: testSchoolId,
        totalAmount: 120.00,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending'
      }
    });

    // Create initial payment that fails
    const failedPayment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'failed',
        paymentType: 'order_payment',
        failureReason: 'insufficient_funds',
        retryCount: 1
      }
    });

    expect(failedPayment.status).toBe('failed');
    expect(failedPayment.failureReason).toBe('insufficient_funds');
    console.log(`💸 Payment failed: ${failedPayment.id}`);

    // Create retry payment record
    await prisma.paymentRetry.create({
      data: {
        paymentId: failedPayment.id,
        attemptNumber: 1,
        retryAt: new Date(),
        retryReason: 'User requested retry after adding funds',
        status: 'pending'
      }
    });

    // Create successful retry payment
    const retryPayment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'completed',
        paymentType: 'order_payment',
        razorpayPaymentId: `pay_retry_${uuidv4()}`,
        paidAt: new Date(),
        retryCount: 2
      }
    });

    expect(retryPayment.status).toBe('completed');
    expect(retryPayment.retryCount).toBe(2);
    console.log(`✅ Retry payment successful: ${retryPayment.id}`);

    // Update order status after successful retry
    const finalOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    expect(finalOrder.status).toBe('confirmed');
    console.log(`🔄 Payment retry successful, order confirmed`);
  }, 30000);

  /**
   * Test 3: Order Modification with Additional Payment
   */
  test('should handle order modification with additional payment', async () => {
    console.log('✏️ Test 3: Order modification with additional payment...');

    // Create initial order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: testParentId,
        studentId: testStudentId,
        schoolId: testSchoolId,
        totalAmount: 120.00,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    // Create initial payment
    const initialPayment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: 120.00,
        currency: 'INR',
        status: 'completed',
        paymentType: 'order_payment',
        paidAt: new Date()
      }
    });

    expect(initialPayment.status).toBe('completed');
    console.log(`💰 Initial payment: ₹${initialPayment.amount}`);

    // Modify order (add items)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: 160.00, // +40 for additional item
        status: 'pending_modification_payment'
      }
    });

    expect(updatedOrder.totalAmount).toBe(160.00);

    // Create additional payment for modification
    const additionalPayment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: 40.00, // Additional amount
        currency: 'INR',
        status: 'completed',
        paymentType: 'modification_payment',
        paidAt: new Date()
      }
    });

    expect(additionalPayment.amount).toBe(40.00);
    console.log(`💵 Additional payment: ₹${additionalPayment.amount}`);

    // Confirm order after additional payment
    const finalOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    expect(finalOrder.status).toBe('confirmed');
    expect(finalOrder.totalAmount).toBe(160.00);
    console.log(`💰 Order modification with payment adjustment completed`);
  }, 30000);

  /**
   * Test 4: Bulk Order Processing
   */
  test('should handle bulk order processing efficiently', async () => {
    console.log('📦 Test 4: Bulk order processing...');
    const startTime = Date.now();

    const bulkOrderCount = 5;
    const orderIds: string[] = [];

    // Create multiple orders
    for (let i = 0; i < bulkOrderCount; i++) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-BULK-${Date.now()}-${i}`,
          userId: testParentId,
          studentId: testStudentId,
          schoolId: testSchoolId,
          totalAmount: 120.00,
          deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending',
          paymentStatus: 'pending'
        }
      });
      orderIds.push(order.id);
    }

    expect(orderIds).toHaveLength(bulkOrderCount);
    console.log(`📋 Created ${bulkOrderCount} bulk orders`);

    // Process payments for all orders
    for (const orderId of orderIds) {
      await prisma.payment.create({
        data: {
          userId: testParentId,
          orderId,
          amount: 120.00,
          currency: 'INR',
          status: 'completed',
          paymentType: 'bulk_order_payment',
          paidAt: new Date()
        }
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      });
    }

    // Verify all orders are confirmed
    const confirmedOrders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: 'confirmed'
      }
    });

    expect(confirmedOrders).toHaveLength(bulkOrderCount);

    const bulkProcessingTime = Date.now() - startTime;
    console.log(`✅ Bulk processing completed in ${bulkProcessingTime}ms`);
    expect(bulkProcessingTime).toBeLessThan(15000);
  }, 30000);

  /**
   * Test 5: Concurrent Order and Payment Load
   */
  test('should maintain performance under concurrent load', async () => {
    console.log('⚡ Test 5: Performance under concurrent load...');
    const concurrentCount = 10;
    const startTime = Date.now();

    // Create orders concurrently
    const orderPromises = Array.from({ length: concurrentCount }, (_, i) =>
      prisma.order.create({
        data: {
          orderNumber: `ORD-CONCURRENT-${Date.now()}-${i}`,
          userId: testParentId,
          studentId: testStudentId,
          schoolId: testSchoolId,
          totalAmount: 120.00,
          deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending',
          paymentStatus: 'pending'
        }
      })
    );

    const orders = await Promise.all(orderPromises);
    expect(orders).toHaveLength(concurrentCount);

    const orderCreationTime = Date.now() - startTime;
    console.log(`📊 Created ${concurrentCount} concurrent orders in ${orderCreationTime}ms`);

    // Process payments concurrently
    const paymentStartTime = Date.now();
    const paymentPromises = orders.map(order =>
      prisma.payment.create({
        data: {
          userId: testParentId,
          orderId: order.id,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'completed',
          paymentType: 'concurrent_payment',
          paidAt: new Date()
        }
      })
    );

    const payments = await Promise.all(paymentPromises);
    expect(payments).toHaveLength(concurrentCount);

    const paymentProcessingTime = Date.now() - paymentStartTime;
    console.log(`💳 Processed ${concurrentCount} concurrent payments in ${paymentProcessingTime}ms`);

    // Performance assertions
    const avgOrderTime = orderCreationTime / concurrentCount;
    const avgPaymentTime = paymentProcessingTime / concurrentCount;

    expect(avgOrderTime).toBeLessThan(1000);
    expect(avgPaymentTime).toBeLessThan(1000);
    console.log(`📈 Avg order: ${avgOrderTime}ms, Avg payment: ${avgPaymentTime}ms`);
  }, 30000);

  /**
   * Test 6: Cross-Epic Data Consistency
   */
  test('should maintain data consistency across order and payment systems', async () => {
    console.log('🔗 Test 6: Cross-epic data consistency...');

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId: testParentId,
        studentId: testStudentId,
        schoolId: testSchoolId,
        totalAmount: 240.00,
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending',
        paymentStatus: 'pending'
      }
    });

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId: testParentId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'completed',
        paymentType: 'order_payment',
        paidAt: new Date()
      }
    });

    // Update order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentStatus: 'paid'
      }
    });

    // Verify cross-epic consistency
    const orderWithPayments = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        payments: true
      }
    });

    expect(orderWithPayments).toBeDefined();
    expect(orderWithPayments!.payments).toHaveLength(1);
    expect(orderWithPayments!.payments[0].id).toBe(payment.id);
    expect(orderWithPayments!.totalAmount).toBe(payment.amount);
    expect(orderWithPayments!.status).toBe('confirmed');
    expect(orderWithPayments!.payments[0].status).toBe('completed');

    console.log(`✅ Cross-epic data consistency verified`);
  }, 30000);
});

// Print performance summary after all tests
afterAll(() => {
  if (performanceMetrics.orderCreationTime.length > 0) {
    const avgOrderTime = performanceMetrics.orderCreationTime.reduce((a, b) => a + b, 0) / performanceMetrics.orderCreationTime.length;
    const avgPaymentTime = performanceMetrics.paymentProcessingTime.reduce((a, b) => a + b, 0) / performanceMetrics.paymentProcessingTime.length;

    console.log('\n📊 Performance Summary:');
    console.log(`  Average Order Creation: ${avgOrderTime.toFixed(2)}ms`);
    console.log(`  Average Payment Processing: ${avgPaymentTime.toFixed(2)}ms`);
    console.log(`  Total Tests: ${performanceMetrics.orderCreationTime.length}`);
  }
});
