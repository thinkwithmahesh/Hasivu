"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
        orders: {
            create: jest.fn().mockResolvedValue({ id: 'order_test_123' })
        }
    }));
});
const order_service_1 = require("../../../src/services/order.service");
const menuItem_repository_1 = require("../../../src/repositories/menuItem.repository");
const payment_service_1 = require("../../../src/services/payment.service");
const paymentOrder_repository_1 = require("../../../src/repositories/paymentOrder.repository");
const notification_service_1 = require("../../../src/services/notification.service");
const redis_service_1 = require("../../../src/services/redis.service");
jest.mock('../../../src/repositories/menuItem.repository');
jest.mock('../../../src/services/payment.service');
jest.mock('../../../src/repositories/paymentOrder.repository');
jest.mock('../../../src/services/notification.service');
jest.mock('../../../src/services/redis.service', () => {
    return {
        RedisService: {
            get: jest.fn(),
            set: jest.fn(),
        }
    };
});
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            order: {
                findMany: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            },
            parentChild: {
                findMany: jest.fn().mockResolvedValue([]),
            }
        }))
    };
});
describe('OrderService Coverage Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createOrder', () => {
        it('should validate delivery date is not in the past', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const result = await order_service_1.OrderService.createOrder({
                studentId: '1',
                parentId: '2',
                schoolId: '3',
                items: [],
                deliveryDate: pastDate,
                deliveryType: 'delivery'
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_DELIVERY_DATE');
        });
        it('should validate menu item availability', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue({
                items: []
            });
            const result = await order_service_1.OrderService.createOrder({
                studentId: '1',
                parentId: '2',
                schoolId: '3',
                items: [{ menuItemId: 'item1', quantity: 1 }],
                deliveryDate: futureDate,
                deliveryType: 'delivery'
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ITEMS_UNAVAILABLE');
        });
        it('should create order successfully', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue({
                items: [{ id: 'item1', price: 100 }]
            });
            jest.spyOn(order_service_1.OrderService.getInstance(), 'create').mockResolvedValue({
                id: 'order1',
                totalAmount: 100,
            });
            const result = await order_service_1.OrderService.createOrder({
                studentId: '1',
                parentId: '2',
                schoolId: '3',
                items: [{ menuItemId: 'item1', quantity: 1 }],
                deliveryDate: futureDate,
                deliveryType: 'delivery'
            });
            expect(result.success).toBe(true);
            expect(result.data.id).toBe('order1');
        });
    });
    describe('addToCart', () => {
        beforeAll(() => {
            redis_service_1.RedisService.get = jest.fn();
            redis_service_1.RedisService.set = jest.fn();
        });
        it('should fail if menu item not available', async () => {
            menuItem_repository_1.MenuItemRepository.findById.mockResolvedValue(null);
            const result = await order_service_1.OrderService.addToCart({
                studentId: '1',
                menuItemId: 'item1',
                quantity: 1
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ITEM_UNAVAILABLE');
        });
        it('should add item to empty cart in Redis', async () => {
            menuItem_repository_1.MenuItemRepository.findById.mockResolvedValue({ available: true, price: 150 });
            redis_service_1.RedisService.get.mockResolvedValue(null);
            redis_service_1.RedisService.set.mockResolvedValue(true);
            const result = await order_service_1.OrderService.addToCart({
                studentId: '1',
                menuItemId: 'item1',
                quantity: 2
            });
            expect(result.success).toBe(true);
            expect(result.data.totalAmount).toBe(300);
            expect(result.data.items.length).toBe(1);
        });
        it('should update existing item in cart', async () => {
            menuItem_repository_1.MenuItemRepository.findById.mockResolvedValue({ available: true, price: 150 });
            const existingCart = {
                items: [{ menuItemId: 'item1', quantity: 1, price: 150 }],
                totalAmount: 150,
                lastUpdated: new Date(),
                expiresAt: new Date()
            };
            redis_service_1.RedisService.get.mockResolvedValue(JSON.stringify(existingCart));
            redis_service_1.RedisService.set.mockResolvedValue(true);
            const result = await order_service_1.OrderService.addToCart({
                studentId: '1',
                menuItemId: 'item1',
                quantity: 2
            });
            expect(result.success).toBe(true);
            expect(result.data.items[0].quantity).toBe(3);
            expect(result.data.totalAmount).toBe(450);
        });
    });
    describe('updateOrderStatus', () => {
        it('should fail if order not found', async () => {
            order_service_1.OrderService.getInstance().orderRepo = {
                findById: jest.fn().mockResolvedValue(null)
            };
            const result = await order_service_1.OrderService.updateOrderStatus('1', 'confirmed');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ORDER_NOT_FOUND');
        });
        it('should fail on invalid status transition', async () => {
            order_service_1.OrderService.getInstance().orderRepo = {
                findById: jest.fn().mockResolvedValue({ status: 'completed' })
            };
            const result = await order_service_1.OrderService.updateOrderStatus('1', 'pending');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_STATUS_TRANSITION');
        });
        it('should update status and send notification', async () => {
            const mockOrderRepo = {
                findById: jest.fn().mockResolvedValue({ status: 'pending', studentId: '1', userId: '2' }),
                updateStatus: jest.fn().mockResolvedValue({ id: 'order1', status: 'confirmed' })
            };
            order_service_1.OrderService.getInstance().orderRepo = mockOrderRepo;
            notification_service_1.NotificationService.sendOrderStatusUpdate.mockResolvedValue(true);
            const result = await order_service_1.OrderService.updateOrderStatus('order1', 'confirmed');
            expect(result.success).toBe(true);
            expect(notification_service_1.NotificationService.sendOrderStatusUpdate).toHaveBeenCalled();
        });
    });
    describe('processOrderPayment', () => {
        it('should fail if order not found', async () => {
            const mockOrderRepo = {
                findById: jest.fn().mockResolvedValue(null),
            };
            order_service_1.OrderService.getInstance().orderRepo = mockOrderRepo;
            const result = await order_service_1.OrderService.processOrderPayment({
                orderId: '1',
                paymentMethod: 'razorpay'
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ORDER_NOT_FOUND');
        });
        it('should process payment and update status', async () => {
            const mockOrderRepo = {
                findById: jest.fn().mockResolvedValue({ id: '1', totalAmount: 500, userId: '2' }),
                updateStatus: jest.fn().mockResolvedValue({ id: '1', status: 'confirmed' })
            };
            order_service_1.OrderService.getInstance().orderRepo = mockOrderRepo;
            paymentOrder_repository_1.PaymentOrderRepository.create.mockResolvedValue({ id: 'po1' });
            payment_service_1.PaymentService.processPayment.mockResolvedValue({ success: true, data: { paymentId: 'pay1' } });
            const result = await order_service_1.OrderService.processOrderPayment({
                orderId: '1',
                paymentMethod: 'razorpay'
            });
            expect(result.success).toBe(true);
            expect(result.data.paymentId).toBe('pay1');
            expect(paymentOrder_repository_1.PaymentOrderRepository.create).toHaveBeenCalled();
        });
    });
    describe('cancelOrder', () => {
        it('should fail if order not found', async () => {
            jest.spyOn(order_service_1.OrderService.getInstance(), 'findById').mockResolvedValue(null);
            const result = await order_service_1.OrderService.cancelOrder('1', 'reason');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ORDER_NOT_FOUND');
        });
        it('should fail if order is already completed', async () => {
            jest.spyOn(order_service_1.OrderService.getInstance(), 'findById').mockResolvedValue({ status: 'completed' });
            const result = await order_service_1.OrderService.cancelOrder('1', 'reason');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CANCELLATION_NOT_ALLOWED');
        });
        it('should cancel order and refund if captured', async () => {
            jest.spyOn(order_service_1.OrderService.getInstance(), 'findById').mockResolvedValue({ status: 'pending' });
            jest.spyOn(order_service_1.OrderService.getInstance(), 'updateStatus').mockResolvedValue({ status: 'cancelled' });
            paymentOrder_repository_1.PaymentOrderRepository.findByOrderId.mockResolvedValue({ id: 'po1', status: 'captured', amount: 50000 });
            payment_service_1.PaymentService.refundPayment.mockResolvedValue({ success: true });
            paymentOrder_repository_1.PaymentOrderRepository.update.mockResolvedValue(true);
            const result = await order_service_1.OrderService.cancelOrder('1', 'reason');
            expect(result.success).toBe(true);
            expect(result.data.paymentStatus).toBe('refunded');
            expect(payment_service_1.PaymentService.refundPayment).toHaveBeenCalled();
        });
    });
    describe('getOrderAnalytics', () => {
        it('should calculate analytics', async () => {
            const mockOrderRepo = {
                getAnalytics: jest.fn().mockResolvedValue({
                    totalOrders: 10,
                    deliveredOrders: 8,
                    cancelledOrders: 2,
                    totalRevenue: 1000
                })
            };
            order_service_1.OrderService.getInstance().orderRepo = mockOrderRepo;
            const result = await order_service_1.OrderService.getOrderAnalytics({ schoolId: '1' });
            expect(result.success).toBe(true);
            expect(result.data.deliveryRate).toBe(80);
            expect(result.data.cancellationRate).toBe(20);
            expect(result.data.averageOrderValue).toBe(100);
        });
    });
});
//# sourceMappingURL=order.service.coverage.test.js.map