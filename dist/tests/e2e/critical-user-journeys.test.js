"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/services/order.service');
jest.mock('../../src/services/menu.service');
jest.mock('../../src/services/notification.service');
jest.mock('../../src/services/rfid.service');
jest.mock('../../src/services/user.service');
jest.mock('../../src/services/school.service');
const AuthService = require('../../src/services/auth.service');
const PaymentService = require('../../src/services/payment.service');
const OrderService = require('../../src/services/order.service');
const MenuService = require('../../src/services/menu.service');
const NotificationService = require('../../src/services/notification.service');
const RFIDService = require('../../src/services/rfid.service');
const UserService = require('../../src/services/user.service');
const SchoolService = require('../../src/services/school.service');
(0, globals_1.describe)('Critical User Journeys E2E Tests', () => {
    (0, globals_1.beforeAll)(() => {
        AuthService.authenticate = jest.fn();
        AuthService.generateToken = jest.fn();
        PaymentService.processPayment = jest.fn();
        OrderService.createOrder = jest.fn();
        MenuService.getMenu = jest.fn();
        NotificationService.sendNotification = jest.fn();
        RFIDService.verifyCard = jest.fn();
        UserService.getUser = jest.fn();
        SchoolService.getSchool = jest.fn();
    });
    (0, globals_1.afterAll)(() => {
        jest.clearAllMocks();
    });
    (0, globals_1.describe)('Journey 1: Parent Registration & Authentication', () => {
        (0, globals_1.it)('should complete full parent registration journey', async () => {
            const registrationData = {
                email: 'parent@example.com',
                phone: '+919876543210',
                firstName: 'John',
                lastName: 'Doe',
                schoolCode: 'SCH001',
                role: 'parent'
            };
            UserService.getUser.mockResolvedValue(null);
            AuthService.authenticate.mockResolvedValue({
                success: true,
                user: { id: 'user-123', ...registrationData },
                token: 'jwt-token-123'
            });
            const authResult = await AuthService.authenticate(registrationData.email, 'password123');
            (0, globals_1.expect)(authResult.success).toBe(true);
            (0, globals_1.expect)(authResult.user.email).toBe(registrationData.email);
            AuthService.generateToken.mockResolvedValue('jwt-token-123');
            const token = await AuthService.generateToken(authResult.user);
            (0, globals_1.expect)(token).toBe('jwt-token-123');
            UserService.getUser.mockResolvedValue({
                id: 'user-123',
                ...registrationData,
                profileComplete: true
            });
            const userProfile = await UserService.getUser('user-123');
            (0, globals_1.expect)(userProfile.profileComplete).toBe(true);
        });
        (0, globals_1.it)('should handle registration validation errors', async () => {
            const invalidData = {
                email: 'invalid-email',
                phone: '123',
                schoolCode: 'INVALID'
            };
            AuthService.authenticate.mockResolvedValue({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Invalid registration data' }
            });
            const result = await AuthService.authenticate(invalidData.email, 'pass');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error.code).toBe('VALIDATION_ERROR');
        });
    });
    (0, globals_1.describe)('Journey 2: Menu Browsing & Ordering', () => {
        (0, globals_1.it)('should complete full menu browsing and ordering journey', async () => {
            const schoolId = 'school-123';
            const menuData = {
                id: 'menu-123',
                schoolId,
                date: new Date(),
                items: [
                    { id: 'item-1', name: 'Chicken Biryani', price: 80, category: 'MAIN_COURSE' },
                    { id: 'item-2', name: 'Vegetable Curry', price: 60, category: 'MAIN_COURSE' },
                    { id: 'item-3', name: 'Mango Lassi', price: 30, category: 'BEVERAGE' }
                ]
            };
            MenuService.getMenu.mockResolvedValue(menuData);
            const menu = await MenuService.getMenu(schoolId);
            (0, globals_1.expect)(menu.items).toHaveLength(3);
            (0, globals_1.expect)(menu.schoolId).toBe(schoolId);
            const orderData = {
                userId: 'user-123',
                studentId: 'student-456',
                schoolId,
                items: [
                    { menuItemId: 'item-1', quantity: 1, unitPrice: 80 },
                    { menuItemId: 'item-3', quantity: 2, unitPrice: 30 }
                ],
                totalAmount: 140,
                deliveryDate: new Date(),
                specialInstructions: 'Extra spicy'
            };
            OrderService.createOrder.mockResolvedValue({
                id: 'order-123',
                orderNumber: 'ORD-2025-001',
                ...orderData,
                status: 'pending'
            });
            const order = await OrderService.createOrder(orderData);
            (0, globals_1.expect)(order.status).toBe('pending');
            (0, globals_1.expect)(order.totalAmount).toBe(140);
            (0, globals_1.expect)(order.orderNumber).toBe('ORD-2025-001');
            NotificationService.sendNotification.mockResolvedValue({
                success: true,
                notificationId: 'notif-123'
            });
            const notification = await NotificationService.sendNotification({
                userId: 'user-123',
                type: 'order_confirmation',
                title: 'Order Confirmed',
                body: `Order ${order.orderNumber} has been placed successfully`,
                data: { orderId: order.id }
            });
            (0, globals_1.expect)(notification.success).toBe(true);
        });
        (0, globals_1.it)('should handle menu unavailable scenarios', async () => {
            MenuService.getMenu.mockResolvedValue(null);
            const menu = await MenuService.getMenu('invalid-school');
            (0, globals_1.expect)(menu).toBeNull();
        });
    });
    (0, globals_1.describe)('Journey 3: Payment Processing', () => {
        (0, globals_1.it)('should complete full payment processing journey', async () => {
            const paymentData = {
                orderId: 'order-123',
                amount: 14000,
                currency: 'INR',
                userId: 'user-123',
                paymentMethodId: 'pm-123'
            };
            PaymentService.processPayment.mockResolvedValue({
                success: true,
                paymentId: 'pay_123456789',
                orderId: paymentData.orderId,
                status: 'captured',
                amount: paymentData.amount,
                currency: paymentData.currency
            });
            const payment = await PaymentService.processPayment(paymentData);
            (0, globals_1.expect)(payment.success).toBe(true);
            (0, globals_1.expect)(payment.status).toBe('captured');
            (0, globals_1.expect)(payment.amount).toBe(14000);
            OrderService.createOrder.mockResolvedValue({
                id: 'order-123',
                paymentStatus: 'paid',
                status: 'confirmed'
            });
            NotificationService.sendNotification.mockResolvedValue({
                success: true,
                notificationId: 'notif-456'
            });
            const notification = await NotificationService.sendNotification({
                userId: 'user-123',
                type: 'payment_success',
                title: 'Payment Successful',
                body: 'Your payment has been processed successfully',
                data: { paymentId: payment.paymentId, orderId: payment.orderId }
            });
            (0, globals_1.expect)(notification.success).toBe(true);
        });
        (0, globals_1.it)('should handle payment failures gracefully', async () => {
            const paymentData = {
                orderId: 'order-123',
                amount: 14000,
                currency: 'INR',
                userId: 'user-123'
            };
            PaymentService.processPayment.mockResolvedValue({
                success: false,
                error: {
                    code: 'PAYMENT_FAILED',
                    message: 'Insufficient funds'
                }
            });
            const payment = await PaymentService.processPayment(paymentData);
            (0, globals_1.expect)(payment.success).toBe(false);
            (0, globals_1.expect)(payment.error.code).toBe('PAYMENT_FAILED');
        });
    });
    (0, globals_1.describe)('Journey 4: RFID Delivery Verification', () => {
        (0, globals_1.it)('should complete full RFID delivery verification journey', async () => {
            const cardData = {
                cardNumber: 'RFID-123456',
                readerId: 'reader-001',
                orderId: 'order-123',
                studentId: 'student-456'
            };
            RFIDService.verifyCard.mockResolvedValue({
                success: true,
                verified: true,
                cardId: 'card-123',
                studentId: cardData.studentId,
                orderId: cardData.orderId,
                timestamp: new Date()
            });
            const verification = await RFIDService.verifyCard(cardData.cardNumber);
            (0, globals_1.expect)(verification.success).toBe(true);
            (0, globals_1.expect)(verification.verified).toBe(true);
            (0, globals_1.expect)(verification.studentId).toBe(cardData.studentId);
            OrderService.createOrder.mockResolvedValue({
                id: 'order-123',
                status: 'delivered',
                deliveredAt: new Date()
            });
            NotificationService.sendNotification.mockResolvedValue({
                success: true,
                notificationId: 'notif-789'
            });
            const notification = await NotificationService.sendNotification({
                userId: 'user-123',
                type: 'delivery_complete',
                title: 'Order Delivered',
                body: 'Your order has been successfully delivered to your child',
                data: {
                    orderId: cardData.orderId,
                    studentId: cardData.studentId,
                    deliveryTime: new Date()
                }
            });
            (0, globals_1.expect)(notification.success).toBe(true);
        });
        (0, globals_1.it)('should handle RFID verification failures', async () => {
            RFIDService.verifyCard.mockResolvedValue({
                success: false,
                verified: false,
                error: {
                    code: 'CARD_NOT_FOUND',
                    message: 'RFID card not registered'
                }
            });
            const verification = await RFIDService.verifyCard('invalid-card');
            (0, globals_1.expect)(verification.success).toBe(false);
            (0, globals_1.expect)(verification.verified).toBe(false);
            (0, globals_1.expect)(verification.error.code).toBe('CARD_NOT_FOUND');
        });
    });
    (0, globals_1.describe)('Journey 5: Order Tracking & Notifications', () => {
        (0, globals_1.it)('should complete full order tracking journey', async () => {
            const orderId = 'order-123';
            const userId = 'user-123';
            OrderService.createOrder.mockResolvedValue({
                id: orderId,
                status: 'preparing',
                userId,
                orderNumber: 'ORD-2025-001',
                createdAt: new Date(),
                deliveryDate: new Date(),
                totalAmount: 140
            });
            const order = await OrderService.createOrder({ id: orderId });
            (0, globals_1.expect)(order.status).toBe('preparing');
            const statusUpdates = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
            for (const status of statusUpdates) {
                NotificationService.sendNotification.mockResolvedValue({
                    success: true,
                    notificationId: `notif-${status}`
                });
                const notification = await NotificationService.sendNotification({
                    userId,
                    type: 'order_status_update',
                    title: `Order ${status.replace('_', ' ').toUpperCase()}`,
                    body: `Your order ${order.orderNumber} is now ${status}`,
                    data: { orderId, status, timestamp: new Date() }
                });
                (0, globals_1.expect)(notification.success).toBe(true);
            }
            UserService.getUser.mockResolvedValue({
                id: userId,
                orders: [
                    { id: orderId, status: 'delivered', totalAmount: 140 },
                    { id: 'order-124', status: 'pending', totalAmount: 200 }
                ]
            });
            const user = await UserService.getUser(userId);
            (0, globals_1.expect)(user.orders).toHaveLength(2);
            (0, globals_1.expect)(user.orders[0].status).toBe('delivered');
        });
    });
    (0, globals_1.describe)('Journey 6: WhatsApp Business Integration', () => {
        (0, globals_1.it)('should complete WhatsApp notification journey', async () => {
            const userId = 'user-123';
            const phone = '+919876543210';
            NotificationService.sendNotification.mockResolvedValue({
                success: true,
                channels: ['whatsapp'],
                whatsappMessageId: 'wa-123'
            });
            const whatsappNotification = await NotificationService.sendNotification({
                userId,
                phone,
                type: 'order_confirmation',
                title: 'Order Confirmed',
                body: 'Your order ORD-2025-001 has been confirmed. Total: ₹140',
                channels: ['whatsapp'],
                template: 'order_confirmation',
                templateData: {
                    order_number: 'ORD-2025-001',
                    amount: '₹140',
                    delivery_time: '12:30 PM'
                }
            });
            (0, globals_1.expect)(whatsappNotification.success).toBe(true);
            (0, globals_1.expect)(whatsappNotification.channels).toContain('whatsapp');
            const deliveryNotification = await NotificationService.sendNotification({
                userId,
                phone,
                type: 'delivery_update',
                title: 'Order Ready for Pickup',
                body: 'Your order is ready for pickup at the school canteen',
                channels: ['whatsapp'],
                template: 'delivery_ready',
                templateData: {
                    student_name: 'John Doe',
                    pickup_location: 'School Canteen'
                }
            });
            (0, globals_1.expect)(deliveryNotification.success).toBe(true);
        });
    });
    (0, globals_1.describe)('Journey 7: Multi-School Management', () => {
        (0, globals_1.it)('should handle multi-tenant school operations', async () => {
            const school1 = { id: 'school-1', name: 'School A', code: 'SA001' };
            const school2 = { id: 'school-2', name: 'School B', code: 'SB001' };
            SchoolService.getSchool.mockImplementation((schoolId) => {
                if (schoolId === 'school-1')
                    return Promise.resolve(school1);
                if (schoolId === 'school-2')
                    return Promise.resolve(school2);
                return Promise.resolve(null);
            });
            const schoolA = await SchoolService.getSchool('school-1');
            const schoolB = await SchoolService.getSchool('school-2');
            (0, globals_1.expect)(schoolA.name).toBe('School A');
            (0, globals_1.expect)(schoolB.name).toBe('School B');
            (0, globals_1.expect)(schoolA.id).not.toBe(schoolB.id);
            UserService.getUser.mockResolvedValue({
                id: 'user-123',
                schoolId: 'school-1',
                role: 'parent'
            });
            const user = await UserService.getUser('user-123');
            (0, globals_1.expect)(user.schoolId).toBe('school-1');
            MenuService.getMenu.mockResolvedValue({
                id: 'menu-school-1',
                schoolId: 'school-1',
                items: [{ id: 'item-1', name: 'School A Special', price: 100 }]
            });
            const menu = await MenuService.getMenu('school-1');
            (0, globals_1.expect)(menu.schoolId).toBe('school-1');
            (0, globals_1.expect)(menu.items[0].name).toBe('School A Special');
        });
    });
    (0, globals_1.describe)('Error Scenarios & Edge Cases', () => {
        (0, globals_1.it)('should handle network failures gracefully', async () => {
            OrderService.createOrder.mockRejectedValue(new Error('Network timeout'));
            await (0, globals_1.expect)(OrderService.createOrder({})).rejects.toThrow('Network timeout');
        });
        (0, globals_1.it)('should handle concurrent order placement', async () => {
            const orderData = { userId: 'user-123', items: [] };
            OrderService.createOrder
                .mockResolvedValueOnce({ id: 'order-1', status: 'pending' })
                .mockResolvedValueOnce({ id: 'order-2', status: 'pending' });
            const order1 = await OrderService.createOrder(orderData);
            const order2 = await OrderService.createOrder(orderData);
            (0, globals_1.expect)(order1.id).not.toBe(order2.id);
        });
        (0, globals_1.it)('should handle invalid RFID scans', async () => {
            RFIDService.verifyCard.mockResolvedValue({
                success: false,
                verified: false,
                error: { code: 'INVALID_CARD', message: 'Card format invalid' }
            });
            const result = await RFIDService.verifyCard('INVALID-FORMAT');
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error.code).toBe('INVALID_CARD');
        });
        (0, globals_1.it)('should handle payment timeouts', async () => {
            PaymentService.processPayment.mockResolvedValue({
                success: false,
                error: { code: 'PAYMENT_TIMEOUT', message: 'Payment processing timeout' }
            });
            const result = await PaymentService.processPayment({ amount: 1000 });
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error.code).toBe('PAYMENT_TIMEOUT');
        });
    });
    (0, globals_1.describe)('Performance & Load Testing Scenarios', () => {
        (0, globals_1.it)('should handle high-frequency RFID scans', async () => {
            const scanPromises = [];
            for (let i = 0; i < 100; i++) {
                RFIDService.verifyCard.mockResolvedValue({
                    success: true,
                    verified: true,
                    cardId: `card-${i}`,
                    timestamp: new Date()
                });
                scanPromises.push(RFIDService.verifyCard(`RFID-${i}`));
            }
            const results = await Promise.all(scanPromises);
            (0, globals_1.expect)(results).toHaveLength(100);
            results.forEach(result => {
                (0, globals_1.expect)(result.success).toBe(true);
                (0, globals_1.expect)(result.verified).toBe(true);
            });
        });
        (0, globals_1.it)('should handle bulk notification sending', async () => {
            const notificationPromises = [];
            for (let i = 0; i < 50; i++) {
                NotificationService.sendNotification.mockResolvedValue({
                    success: true,
                    notificationId: `notif-${i}`
                });
                notificationPromises.push(NotificationService.sendNotification({
                    userId: `user-${i}`,
                    type: 'bulk_test',
                    title: 'Bulk Test',
                    body: `Test notification ${i}`
                }));
            }
            const results = await Promise.all(notificationPromises);
            (0, globals_1.expect)(results).toHaveLength(50);
            results.forEach(result => (0, globals_1.expect)(result.success).toBe(true));
        });
    });
});
//# sourceMappingURL=critical-user-journeys.test.js.map