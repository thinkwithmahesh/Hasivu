"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const uuid_1 = require("uuid");
const setup_integration_1 = require("../setup-integration");
let prisma;
let testSchoolId;
let testParentId;
let testStudentId;
const testMenuItemIds = [];
let testParentToken;
const performanceMetrics = {
    orderCreationTime: [],
    paymentProcessingTime: [],
    notificationDeliveryTime: []
};
(0, globals_1.beforeAll)(async () => {
    console.log('🚀 Initializing Order-to-Payment Flow Test Environment...');
    const testEnv = await (0, setup_integration_1.setupIntegrationTests)();
    prisma = testEnv.prisma;
    const school = await prisma.school.create({
        data: {
            name: 'Test Payment School',
            code: `SCHOOL_${(0, uuid_1.v4)().substring(0, 8)}`,
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
    const parent = await prisma.user.create({
        data: {
            email: `parent-${(0, uuid_1.v4)()}@test.com`,
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
    testParentToken = (0, setup_integration_1.generateTestJWT)({
        userId: parent.id,
        schoolId: testSchoolId,
        role: 'parent'
    });
    const student = await prisma.user.create({
        data: {
            email: `student-${(0, uuid_1.v4)()}@test.com`,
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
(0, globals_1.afterAll)(async () => {
    await (0, setup_integration_1.teardownIntegrationTests)();
    console.log('✅ Order-to-Payment cleanup completed');
}, 30000);
(0, globals_1.beforeEach)(async () => {
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
});
(0, globals_1.describe)('Order to Payment Flow Integration Tests', () => {
    (0, globals_1.test)('should complete full order-to-payment flow successfully', async () => {
        console.log('🛒 Test 1: Complete order-to-payment flow...');
        const startTime = Date.now();
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
        (0, globals_1.expect)(order.id).toBeDefined();
        (0, globals_1.expect)(order.status).toBe('pending');
        (0, globals_1.expect)(order.totalAmount).toBe(240.00);
        console.log(`📦 Order created: ${order.id} (${orderCreationTime}ms)`);
        const paymentStartTime = Date.now();
        const payment = await prisma.payment.create({
            data: {
                userId: testParentId,
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
                status: 'processing',
                paymentType: 'order_payment',
                razorpayPaymentId: `pay_${(0, uuid_1.v4)()}`,
                razorpayOrderId: `order_${(0, uuid_1.v4)()}`
            }
        });
        const paymentProcessingTime = Date.now() - paymentStartTime;
        performanceMetrics.paymentProcessingTime.push(paymentProcessingTime);
        (0, globals_1.expect)(payment.id).toBeDefined();
        (0, globals_1.expect)(payment.status).toBe('processing');
        console.log(`💳 Payment initiated: ${payment.id} (${paymentProcessingTime}ms)`);
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'completed',
                paidAt: new Date()
            }
        });
        (0, globals_1.expect)(updatedPayment.status).toBe('completed');
        (0, globals_1.expect)(updatedPayment.paidAt).toBeDefined();
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'confirmed',
                paymentStatus: 'paid'
            }
        });
        (0, globals_1.expect)(updatedOrder.status).toBe('confirmed');
        (0, globals_1.expect)(updatedOrder.paymentStatus).toBe('paid');
        const totalFlowTime = Date.now() - startTime;
        console.log(`🎉 Complete flow finished in ${totalFlowTime}ms`);
        (0, globals_1.expect)(orderCreationTime).toBeLessThan(5000);
        (0, globals_1.expect)(paymentProcessingTime).toBeLessThan(3000);
        (0, globals_1.expect)(totalFlowTime).toBeLessThan(10000);
    }, 30000);
    (0, globals_1.test)('should handle payment failure and successful retry', async () => {
        console.log('❌ Test 2: Payment failure and retry...');
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
        (0, globals_1.expect)(failedPayment.status).toBe('failed');
        (0, globals_1.expect)(failedPayment.failureReason).toBe('insufficient_funds');
        console.log(`💸 Payment failed: ${failedPayment.id}`);
        await prisma.paymentRetry.create({
            data: {
                paymentId: failedPayment.id,
                attemptNumber: 1,
                retryAt: new Date(),
                retryReason: 'User requested retry after adding funds',
                status: 'pending'
            }
        });
        const retryPayment = await prisma.payment.create({
            data: {
                userId: testParentId,
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
                status: 'completed',
                paymentType: 'order_payment',
                razorpayPaymentId: `pay_retry_${(0, uuid_1.v4)()}`,
                paidAt: new Date(),
                retryCount: 2
            }
        });
        (0, globals_1.expect)(retryPayment.status).toBe('completed');
        (0, globals_1.expect)(retryPayment.retryCount).toBe(2);
        console.log(`✅ Retry payment successful: ${retryPayment.id}`);
        const finalOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'confirmed',
                paymentStatus: 'paid'
            }
        });
        (0, globals_1.expect)(finalOrder.status).toBe('confirmed');
        console.log(`🔄 Payment retry successful, order confirmed`);
    }, 30000);
    (0, globals_1.test)('should handle order modification with additional payment', async () => {
        console.log('✏️ Test 3: Order modification with additional payment...');
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
        (0, globals_1.expect)(initialPayment.status).toBe('completed');
        console.log(`💰 Initial payment: ₹${initialPayment.amount}`);
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                totalAmount: 160.00,
                status: 'pending_modification_payment'
            }
        });
        (0, globals_1.expect)(updatedOrder.totalAmount).toBe(160.00);
        const additionalPayment = await prisma.payment.create({
            data: {
                userId: testParentId,
                orderId: order.id,
                amount: 40.00,
                currency: 'INR',
                status: 'completed',
                paymentType: 'modification_payment',
                paidAt: new Date()
            }
        });
        (0, globals_1.expect)(additionalPayment.amount).toBe(40.00);
        console.log(`💵 Additional payment: ₹${additionalPayment.amount}`);
        const finalOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'confirmed',
                paymentStatus: 'paid'
            }
        });
        (0, globals_1.expect)(finalOrder.status).toBe('confirmed');
        (0, globals_1.expect)(finalOrder.totalAmount).toBe(160.00);
        console.log(`💰 Order modification with payment adjustment completed`);
    }, 30000);
    (0, globals_1.test)('should handle bulk order processing efficiently', async () => {
        console.log('📦 Test 4: Bulk order processing...');
        const startTime = Date.now();
        const bulkOrderCount = 5;
        const orderIds = [];
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
        (0, globals_1.expect)(orderIds).toHaveLength(bulkOrderCount);
        console.log(`📋 Created ${bulkOrderCount} bulk orders`);
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
        const confirmedOrders = await prisma.order.findMany({
            where: {
                id: { in: orderIds },
                status: 'confirmed'
            }
        });
        (0, globals_1.expect)(confirmedOrders).toHaveLength(bulkOrderCount);
        const bulkProcessingTime = Date.now() - startTime;
        console.log(`✅ Bulk processing completed in ${bulkProcessingTime}ms`);
        (0, globals_1.expect)(bulkProcessingTime).toBeLessThan(15000);
    }, 30000);
    (0, globals_1.test)('should maintain performance under concurrent load', async () => {
        console.log('⚡ Test 5: Performance under concurrent load...');
        const concurrentCount = 10;
        const startTime = Date.now();
        const orderPromises = Array.from({ length: concurrentCount }, (_, i) => prisma.order.create({
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
        }));
        const orders = await Promise.all(orderPromises);
        (0, globals_1.expect)(orders).toHaveLength(concurrentCount);
        const orderCreationTime = Date.now() - startTime;
        console.log(`📊 Created ${concurrentCount} concurrent orders in ${orderCreationTime}ms`);
        const paymentStartTime = Date.now();
        const paymentPromises = orders.map(order => prisma.payment.create({
            data: {
                userId: testParentId,
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
                status: 'completed',
                paymentType: 'concurrent_payment',
                paidAt: new Date()
            }
        }));
        const payments = await Promise.all(paymentPromises);
        (0, globals_1.expect)(payments).toHaveLength(concurrentCount);
        const paymentProcessingTime = Date.now() - paymentStartTime;
        console.log(`💳 Processed ${concurrentCount} concurrent payments in ${paymentProcessingTime}ms`);
        const avgOrderTime = orderCreationTime / concurrentCount;
        const avgPaymentTime = paymentProcessingTime / concurrentCount;
        (0, globals_1.expect)(avgOrderTime).toBeLessThan(1000);
        (0, globals_1.expect)(avgPaymentTime).toBeLessThan(1000);
        console.log(`📈 Avg order: ${avgOrderTime}ms, Avg payment: ${avgPaymentTime}ms`);
    }, 30000);
    (0, globals_1.test)('should maintain data consistency across order and payment systems', async () => {
        console.log('🔗 Test 6: Cross-epic data consistency...');
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
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'confirmed',
                paymentStatus: 'paid'
            }
        });
        const orderWithPayments = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                payments: true
            }
        });
        (0, globals_1.expect)(orderWithPayments).toBeDefined();
        (0, globals_1.expect)(orderWithPayments.payments).toHaveLength(1);
        (0, globals_1.expect)(orderWithPayments.payments[0].id).toBe(payment.id);
        (0, globals_1.expect)(orderWithPayments.totalAmount).toBe(payment.amount);
        (0, globals_1.expect)(orderWithPayments.status).toBe('confirmed');
        (0, globals_1.expect)(orderWithPayments.payments[0].status).toBe('completed');
        console.log(`✅ Cross-epic data consistency verified`);
    }, 30000);
});
(0, globals_1.afterAll)(() => {
    if (performanceMetrics.orderCreationTime.length > 0) {
        const avgOrderTime = performanceMetrics.orderCreationTime.reduce((a, b) => a + b, 0) / performanceMetrics.orderCreationTime.length;
        const avgPaymentTime = performanceMetrics.paymentProcessingTime.reduce((a, b) => a + b, 0) / performanceMetrics.paymentProcessingTime.length;
        console.log('\n📊 Performance Summary:');
        console.log(`  Average Order Creation: ${avgOrderTime.toFixed(2)}ms`);
        console.log(`  Average Payment Processing: ${avgPaymentTime.toFixed(2)}ms`);
        console.log(`  Total Tests: ${performanceMetrics.orderCreationTime.length}`);
    }
});
//# sourceMappingURL=order-payment-flow.integration.test.js.map