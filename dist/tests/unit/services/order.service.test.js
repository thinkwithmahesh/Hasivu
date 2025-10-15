"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_service_1 = require("../../../src/services/order.service");
const order_repository_1 = require("../../../src/repositories/order.repository");
const orderItem_repository_1 = require("../../../src/repositories/orderItem.repository");
const paymentOrder_repository_1 = require("../../../src/repositories/paymentOrder.repository");
const menuItem_repository_1 = require("../../../src/repositories/menuItem.repository");
const user_repository_1 = require("../../../src/repositories/user.repository");
const database_service_1 = require("../../../src/services/database.service");
const payment_service_1 = require("../../../src/services/payment.service");
const notification_service_1 = require("../../../src/services/notification.service");
const redis_service_1 = require("../../../src/services/redis.service");
const cache_1 = require("../../../src/utils/cache");
jest.mock('../../../src/repositories/order.repository');
jest.mock('../../../src/repositories/orderItem.repository');
jest.mock('../../../src/repositories/paymentOrder.repository');
jest.mock('../../../src/repositories/menuItem.repository');
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/database.service');
jest.mock('../../../src/services/payment.service', () => ({
    PaymentService: {
        processPayment: jest.fn(),
        refundPayment: jest.fn()
    }
}));
jest.mock('../../../src/services/notification.service');
jest.mock('../../../src/services/redis.service');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/cache', () => ({
    cache: {
        get: jest.fn(),
        setex: jest.fn()
    }
}));
describe('OrderService', () => {
    const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        userId: 'parent-123',
        studentId: 'student-123',
        schoolId: 'school-123',
        status: 'PENDING',
        totalAmount: 375,
        currency: 'INR',
        orderDate: new Date(),
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        deliveredAt: null,
        specialInstructions: 'Handle with care',
        allergyInfo: null,
        paymentStatus: 'pending',
        metadata: '{}',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const mockMenuItem1 = {
        id: 'item-1',
        name: 'Delicious Meal',
        price: 150,
        available: true,
        allergens: null,
        tags: null
    };
    const mockMenuItem2 = {
        id: 'item-2',
        name: 'Healthy Snack',
        price: 75,
        available: true,
        allergens: null,
        tags: null
    };
    const mockUser = {
        id: 'student-123',
        dietaryRestrictions: null,
        allergies: null
    };
    const mockPaymentOrder = {
        id: 'payment-123',
        orderId: 'order-123',
        amount: 375,
        status: 'pending'
    };
    beforeEach(() => {
        jest.clearAllMocks();
        database_service_1.DatabaseService.transaction.mockImplementation(async (callback) => {
            return await callback({
                order: {
                    create: jest.fn().mockResolvedValue(mockOrder)
                },
                orderItem: {
                    createMany: jest.fn().mockResolvedValue({ count: 2 })
                }
            });
        });
    });
    describe('Order Creation', () => {
        it('should create order successfully with valid data', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [
                    { menuItemId: 'item-1', quantity: 2, specialInstructions: 'No onions' },
                    { menuItemId: 'item-2', quantity: 1, specialInstructions: undefined }
                ],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deliveryType: 'delivery',
                deliveryAddress: '123 Main St'
            };
            const mockMenuItems = {
                items: [mockMenuItem1, mockMenuItem2],
                total: 2
            };
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue(mockMenuItems);
            user_repository_1.UserRepository.findById.mockResolvedValue(mockUser);
            redis_service_1.RedisService.del.mockResolvedValue(true);
            notification_service_1.NotificationService.sendOrderConfirmation.mockResolvedValue(true);
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(true);
            expect(result.data?.totalAmount).toBe(375);
            expect(result.data?.status).toBe('PENDING');
            expect(menuItem_repository_1.MenuItemRepository.findMany).toHaveBeenCalledWith({
                filters: { schoolId: 'school-123', available: true },
                ids: ['item-1', 'item-2']
            });
        });
        it('should reject order with unavailable menu items', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [
                    { menuItemId: 'unavailable-item', quantity: 1 }
                ],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deliveryType: 'delivery'
            };
            const mockMenuItems = {
                items: [],
                total: 0
            };
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue(mockMenuItems);
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('not available');
            expect(result.error?.code).toBe('ITEMS_UNAVAILABLE');
        });
        it('should validate delivery date is not in the past', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [{ menuItemId: 'item-1', quantity: 1 }],
                deliveryDate: new Date('2020-01-01'),
                deliveryType: 'delivery'
            };
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('Delivery date cannot be in the past');
            expect(result.error?.code).toBe('INVALID_DELIVERY_DATE');
        });
        it('should apply dietary restrictions and allergies', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [{ menuItemId: 'item-1', quantity: 1 }],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deliveryType: 'delivery'
            };
            const studentWithAllergies = {
                id: 'student-123',
                dietaryRestrictions: null,
                allergies: JSON.stringify(['nuts', 'dairy'])
            };
            const menuItemWithNuts = {
                id: 'item-1',
                name: 'Nutty Delight',
                price: 150,
                available: true,
                allergens: JSON.stringify(['nuts']),
                tags: null
            };
            const mockMenuItems = {
                items: [menuItemWithNuts],
                total: 1
            };
            user_repository_1.UserRepository.findById.mockResolvedValue(studentWithAllergies);
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue(mockMenuItems);
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('dietary restrictions or allergies');
            expect(result.error?.code).toBe('DIETARY_RESTRICTION_CONFLICT');
        });
    });
    describe('Cart Management', () => {
        describe('addToCart', () => {
            it('should add item to empty cart', async () => {
                const cartData = {
                    studentId: 'student-123',
                    menuItemId: 'item-1',
                    quantity: 2,
                    specialInstructions: 'Extra sauce'
                };
                menuItem_repository_1.MenuItemRepository.findById.mockResolvedValue(mockMenuItem1);
                redis_service_1.RedisService.get.mockResolvedValue(null);
                redis_service_1.RedisService.set.mockResolvedValue('OK');
                const result = await order_service_1.OrderService.addToCart(cartData);
                expect(result.success).toBe(true);
                expect(result.data?.items).toHaveLength(1);
                expect(result.data?.items[0].quantity).toBe(2);
                expect(result.data?.totalAmount).toBe(300);
                expect(redis_service_1.RedisService.set).toHaveBeenCalledWith('cart:student-123', expect.any(String), 3600);
            });
            it('should update quantity if item already in cart', async () => {
                const cartData = {
                    studentId: 'student-123',
                    menuItemId: 'item-1',
                    quantity: 1
                };
                const existingCart = {
                    items: [
                        { menuItemId: 'item-1', quantity: 2, price: 150 }
                    ],
                    totalAmount: 300,
                    lastUpdated: new Date(),
                    expiresAt: new Date(Date.now() + 3600000)
                };
                menuItem_repository_1.MenuItemRepository.findById.mockResolvedValue(mockMenuItem1);
                redis_service_1.RedisService.get.mockResolvedValue(JSON.stringify(existingCart));
                redis_service_1.RedisService.set.mockResolvedValue('OK');
                const result = await order_service_1.OrderService.addToCart(cartData);
                expect(result.success).toBe(true);
                expect(result.data?.items[0].quantity).toBe(3);
                expect(result.data?.totalAmount).toBe(450);
            });
        });
    });
    describe('Order Status Management', () => {
        it('should update order status successfully', async () => {
            const orderId = 'order-123';
            const newStatus = order_service_1.OrderStatus.CONFIRMED;
            const updatedOrder = {
                ...mockOrder,
                status: newStatus,
                statusHistory: JSON.stringify([
                    { status: 'PENDING', timestamp: new Date('2024-01-01T10:00:00Z') },
                    { status: newStatus, timestamp: expect.any(Date) }
                ])
            };
            order_repository_1.OrderRepository.findById.mockResolvedValue(mockOrder);
            order_repository_1.OrderRepository.update.mockResolvedValue(updatedOrder);
            notification_service_1.NotificationService.sendOrderStatusUpdate.mockResolvedValue(true);
            const result = await order_service_1.OrderService.updateOrderStatus(orderId, newStatus);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe(newStatus);
            expect(order_repository_1.OrderRepository.update).toHaveBeenCalledWith(orderId, expect.objectContaining({
                status: newStatus,
                statusHistory: expect.any(String),
                updatedAt: expect.any(Date)
            }));
            expect(notification_service_1.NotificationService.sendOrderStatusUpdate).toHaveBeenCalledWith({
                orderId,
                studentId: mockOrder.studentId,
                parentId: mockOrder.userId,
                newStatus,
                message: undefined
            });
        });
        it('should validate status transitions', async () => {
            const orderId = 'order-123';
            const invalidStatus = order_service_1.OrderStatus.DELIVERED;
            order_repository_1.OrderRepository.findById.mockResolvedValue(mockOrder);
            const result = await order_service_1.OrderService.updateOrderStatus(orderId, invalidStatus);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('Invalid status transition');
            expect(result.error?.code).toBe('INVALID_STATUS_TRANSITION');
            expect(order_repository_1.OrderRepository.update).not.toHaveBeenCalled();
        });
    });
    describe('Payment Integration', () => {
        it('should process payment successfully', async () => {
            const paymentData = {
                orderId: 'order-123',
                paymentMethod: 'razorpay',
                paymentDetails: { cardNumber: '**** 1234' }
            };
            const mockPaymentResult = {
                success: true,
                data: { paymentId: 'pay_123', status: 'captured' }
            };
            order_repository_1.OrderRepository.findById.mockResolvedValue(mockOrder);
            paymentOrder_repository_1.PaymentOrderRepository.create.mockResolvedValue(mockPaymentOrder);
            payment_service_1.PaymentService.processPayment.mockResolvedValue(mockPaymentResult);
            paymentOrder_repository_1.PaymentOrderRepository.update.mockResolvedValue({
                ...mockPaymentOrder,
                status: 'captured',
                paymentId: 'pay_123'
            });
            jest.spyOn(order_service_1.OrderService, 'updateOrderStatus').mockResolvedValue({
                success: true,
                data: { ...mockOrder, status: 'CONFIRMED' }
            });
            const result = await order_service_1.OrderService.processOrderPayment(paymentData);
            expect(result.success).toBe(true);
            expect(result.data?.paymentStatus).toBe('captured');
            expect(paymentOrder_repository_1.PaymentOrderRepository.create).toHaveBeenCalledWith(expect.objectContaining({
                orderId: 'order-123',
                amount: 375,
                method: 'razorpay'
            }));
        });
        it('should handle payment failures gracefully', async () => {
            const paymentData = {
                orderId: 'order-123',
                paymentMethod: 'razorpay'
            };
            const mockPaymentResult = {
                success: false,
                error: { message: 'Payment declined', code: 'CARD_DECLINED' }
            };
            order_repository_1.OrderRepository.findById.mockResolvedValue(mockOrder);
            paymentOrder_repository_1.PaymentOrderRepository.create.mockResolvedValue(mockPaymentOrder);
            payment_service_1.PaymentService.processPayment.mockResolvedValue(mockPaymentResult);
            const result = await order_service_1.OrderService.processOrderPayment(paymentData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('Payment declined');
            expect(result.error?.code).toBe('PAYMENT_FAILED');
        });
    });
    describe('Order Tracking', () => {
        it('should return order tracking information', async () => {
            const orderId = 'order-123';
            const orderWithIncludes = {
                ...mockOrder,
                orderItems: [
                    {
                        id: 'item-1',
                        menuItem: { id: 'menu-1', name: 'Test Item' },
                        quantity: 2
                    }
                ],
                deliveryVerifications: []
            };
            order_repository_1.OrderRepository.findByIdWithIncludes.mockResolvedValue(orderWithIncludes);
            const result = await order_service_1.OrderService.getOrderTracking(orderId);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('PENDING');
            expect(result.data?.timeline).toBeDefined();
            expect(result.data?.estimatedDelivery).toBeDefined();
            expect(result.data?.canCancel).toBe(true);
        });
        it('should include delivery verification details when available', async () => {
            const orderId = 'order-123';
            const orderWithDelivery = {
                ...mockOrder,
                status: 'DELIVERED',
                orderItems: [],
                deliveryVerifications: [
                    {
                        id: 'verification-123',
                        verifiedAt: new Date(),
                        rfidCard: { id: 'card-123', cardNumber: 'A1B2C3D4E5F6' },
                        rfidReader: { id: 'reader-123', location: 'Main Entrance' }
                    }
                ]
            };
            cache_1.cache.get.mockResolvedValue(null);
            order_repository_1.OrderRepository.findByIdWithIncludes.mockResolvedValue(orderWithDelivery);
            const result = await order_service_1.OrderService.getOrderTracking(orderId);
            expect(result.success).toBe(true);
            expect(result.data?.deliveryDetails).toBeDefined();
            expect(result.data?.deliveryDetails?.verifiedAt).toBeDefined();
            expect(result.data?.deliveryDetails?.location).toBe('Main Entrance');
        });
    });
    describe('getOrdersByStudent', () => {
        it('should return paginated orders for student', async () => {
            const studentId = 'student-123';
            const query = { page: 1, limit: 10, status: order_service_1.OrderStatus.DELIVERED };
            const mockOrders = [mockOrder, { ...mockOrder, id: 'order-456' }];
            order_repository_1.OrderRepository.findMany.mockResolvedValue({
                items: mockOrders,
                total: 2
            });
            order_repository_1.OrderRepository.count.mockResolvedValue(2);
            const result = await order_service_1.OrderService.getOrdersByStudent(studentId, query);
            expect(result.success).toBe(true);
            expect(result.data?.orders).toHaveLength(2);
            expect(result.data?.pagination.total).toBe(2);
            expect(result.data?.pagination.page).toBe(1);
            expect(order_repository_1.OrderRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
                filters: { studentId, status: 'DELIVERED' },
                skip: 0,
                take: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }));
        });
    });
    describe('Order Cancellation', () => {
        it('should cancel order and process refund', async () => {
            const orderId = 'order-123';
            const cancellationReason = 'Change of plans';
            const refundResult = {
                success: true,
                data: { refundId: 'refund-123', status: 'processed' }
            };
            order_repository_1.OrderRepository.findById.mockResolvedValue(mockOrder);
            paymentOrder_repository_1.PaymentOrderRepository.findByOrderId.mockResolvedValue({
                ...mockPaymentOrder,
                status: 'captured',
                paymentId: 'pay_123'
            });
            payment_service_1.PaymentService.refundPayment.mockResolvedValue(refundResult);
            jest.spyOn(order_service_1.OrderService, 'updateOrderStatus').mockResolvedValue({
                success: true,
                data: { ...mockOrder, status: 'CANCELLED' }
            });
            const result = await order_service_1.OrderService.cancelOrder(orderId, cancellationReason);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('CANCELLED');
            expect(result.data?.paymentStatus).toBe('refunded');
            expect(payment_service_1.PaymentService.refundPayment).toHaveBeenCalledWith({
                paymentId: 'pay_123',
                amount: 375,
                reason: cancellationReason
            });
        });
        it('should not allow cancellation of delivered orders', async () => {
            const orderId = 'order-123';
            const deliveredOrder = { ...mockOrder, status: 'DELIVERED' };
            order_repository_1.OrderRepository.findById.mockResolvedValue(deliveredOrder);
            const result = await order_service_1.OrderService.cancelOrder(orderId, 'Change of mind');
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('cannot be cancelled');
            expect(result.error?.code).toBe('CANCELLATION_NOT_ALLOWED');
        });
    });
    describe('Analytics and Reporting', () => {
        it('should return order analytics', async () => {
            const analyticsQuery = {
                schoolId: 'school-123',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            };
            const mockAnalytics = {
                totalOrders: 50,
                totalRevenue: 67500,
                deliveredOrders: 45,
                cancelledOrders: 5,
                ordersByStatus: {
                    PENDING: 5,
                    CONFIRMED: 10,
                    PREPARING: 8,
                    READY: 2,
                    OUT_FOR_DELIVERY: 0,
                    DELIVERED: 45,
                    CANCELLED: 5
                },
                revenueByDay: []
            };
            order_repository_1.OrderRepository.getAnalytics.mockResolvedValue(mockAnalytics);
            const result = await order_service_1.OrderService.getOrderAnalytics(analyticsQuery);
            expect(result.success).toBe(true);
            expect(result.data?.totalOrders).toBe(50);
            expect(result.data?.totalRevenue).toBe(67500);
            expect(result.data?.deliveryRate).toBe(90);
            expect(result.data?.cancellationRate).toBe(10);
            expect(result.data?.averageOrderValue).toBe(1350);
        });
        describe('getPopularItems', () => {
            it('should return popular menu items', async () => {
                const query = {
                    schoolId: 'school-123',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                    limit: 5
                };
                const mockPopularItems = [
                    {
                        menuItemId: 'item-1',
                        menuItemName: 'Popular Meal',
                        totalQuantity: 120,
                        orderCount: 45,
                        revenue: 18000
                    },
                    {
                        menuItemId: 'item-2',
                        menuItemName: 'Favorite Snack',
                        totalQuantity: 80,
                        orderCount: 30,
                        revenue: 6000
                    }
                ];
                orderItem_repository_1.OrderItemRepository.getPopularItems.mockResolvedValue(mockPopularItems);
                const result = await order_service_1.OrderService.getPopularItems(query);
                expect(result.success).toBe(true);
                expect(result.data).toHaveLength(2);
                expect(result.data?.[0].totalQuantity).toBe(120);
                expect(result.data?.[0].orderCount).toBe(45);
                expect(result.data?.[0].revenue).toBe(18000);
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle database constraint errors', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [{ menuItemId: 'item-1', quantity: 1 }],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deliveryType: 'delivery'
            };
            const constraintError = new Error('Unique constraint failed');
            constraintError.message = 'Unique constraint failed on the fields: (`id`)';
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue({
                items: [mockMenuItem1],
                total: 1
            });
            user_repository_1.UserRepository.findById.mockResolvedValue(mockUser);
            database_service_1.DatabaseService.transaction.mockRejectedValue(constraintError);
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_ORDER');
        });
        it('should handle inventory shortage gracefully', async () => {
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [{ menuItemId: 'item-1', quantity: 100 }],
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deliveryType: 'delivery'
            };
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('exceeds maximum allowed');
            expect(result.error?.code).toBe('QUANTITY_EXCEEDED');
        });
        it('should validate order timing restrictions', async () => {
            const deliveryDate = new Date('2024-02-01T10:00:00Z');
            const orderData = {
                studentId: 'student-123',
                parentId: 'parent-123',
                schoolId: 'school-123',
                items: [{ menuItemId: 'item-1', quantity: 1 }],
                deliveryDate,
                deliveryType: 'delivery'
            };
            const mockMenuItems = {
                items: [mockMenuItem1],
                total: 1
            };
            menuItem_repository_1.MenuItemRepository.findMany.mockResolvedValue(mockMenuItems);
            user_repository_1.UserRepository.findById.mockResolvedValue(mockUser);
            const mockNow = new Date('2024-02-01T09:00:00Z');
            const OriginalDate = global.Date;
            global.Date = class extends Date {
                constructor(...args) {
                    if (args.length === 0) {
                        super(mockNow.getTime());
                    }
                    else {
                        super(args[0]);
                    }
                }
                static now() {
                    return mockNow.getTime();
                }
            };
            const result = await order_service_1.OrderService.createOrder(orderData);
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('Order cutoff time has passed');
            expect(result.error?.code).toBe('ORDER_CUTOFF_PASSED');
            global.Date = OriginalDate;
        });
    });
});
//# sourceMappingURL=order.service.test.js.map