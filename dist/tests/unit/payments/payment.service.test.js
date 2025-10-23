"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_service_1 = require("../../../src/services/payment.service");
const database_service_1 = require("../../../src/services/database.service");
const redis_service_1 = require("../../../src/services/redis.service");
const crypto_1 = __importDefault(require("crypto"));
jest.mock('../../../src/services/database.service');
jest.mock('../../../src/services/redis.service');
jest.mock('../../../src/utils/logger');
jest.mock('razorpay');
describe('Payment Service - Comprehensive Tests', () => {
    let paymentService;
    let mockDatabaseService;
    let mockRedisService;
    let mockRazorpay;
    beforeEach(() => {
        jest.clearAllMocks();
        mockDatabaseService = {
            client: {
                user: {
                    findUnique: jest.fn()
                },
                paymentOrder: {
                    create: jest.fn(),
                    findUnique: jest.fn(),
                    update: jest.fn()
                },
                paymentTransaction: {
                    create: jest.fn(),
                    findUnique: jest.fn(),
                    updateMany: jest.fn()
                },
                paymentRefund: {
                    create: jest.fn(),
                    updateMany: jest.fn()
                },
                subscriptionPlan: {
                    create: jest.fn(),
                    findUnique: jest.fn()
                },
                paymentSubscription: {
                    create: jest.fn(),
                    updateMany: jest.fn()
                }
            },
            transaction: jest.fn()
        };
        database_service_1.DatabaseService.client = mockDatabaseService.client;
        database_service_1.DatabaseService.transaction = mockDatabaseService.transaction;
        mockRedisService = {
            setex: jest.fn(),
            get: jest.fn(),
            del: jest.fn()
        };
        redis_service_1.RedisService.setex = mockRedisService.setex;
        redis_service_1.RedisService.get = mockRedisService.get;
        redis_service_1.RedisService.del = mockRedisService.del;
        mockRazorpay = {
            orders: {
                create: jest.fn(),
                all: jest.fn()
            },
            payments: {
                fetch: jest.fn(),
                capture: jest.fn(),
                refund: jest.fn()
            },
            plans: {
                create: jest.fn()
            },
            subscriptions: {
                create: jest.fn()
            }
        };
        paymentService = new payment_service_1.PaymentService();
        paymentService.razorpay = mockRazorpay;
        paymentService.webhookSecret = 'test-webhook-secret';
    });
    describe('Service Initialization', () => {
        test('should initialize successfully', async () => {
            mockRazorpay.orders.all.mockResolvedValue([]);
            await expect(paymentService.initialize()).resolves.not.toThrow();
            expect(mockRazorpay.orders.all).toHaveBeenCalledWith({ count: 1 });
        });
        test('should handle initialization failure', async () => {
            mockRazorpay.orders.all.mockRejectedValue(new Error('Razorpay connection failed'));
            await expect(paymentService.initialize()).rejects.toThrow('Payment service initialization failed');
        });
    });
    describe('Create Payment Order', () => {
        const validOrderData = {
            userId: 'user-123',
            amount: 50000,
            currency: 'INR',
            notes: { productId: 'product-123' },
            receipt: 'receipt-123'
        };
        test('should create payment order successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                phone: '+91-9876543210'
            };
            const mockRazorpayOrder = {
                id: 'order_razorpay_123',
                amount: 50000,
                currency: 'INR',
                receipt: 'receipt-123'
            };
            const mockDatabaseOrder = {
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                userId: 'user-123',
                amount: 50000,
                currency: 'INR',
                status: 'created',
                notes: { productId: 'product-123' },
                receipt: 'receipt-123',
                expiresAt: expect.any(Date)
            };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            mockRazorpay.orders.create.mockResolvedValue(mockRazorpayOrder);
            mockDatabaseService.client.paymentOrder.create.mockResolvedValue(mockDatabaseOrder);
            mockRedisService.setex.mockResolvedValue('OK');
            const result = await paymentService.createPaymentOrder(validOrderData);
            expect(result).toMatchObject({
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                userId: 'user-123',
                amount: 50000,
                currency: 'INR',
                status: 'created'
            });
            expect(mockRazorpay.orders.create).toHaveBeenCalledWith({
                amount: 50000,
                currency: 'INR',
                receipt: 'receipt-123',
                notes: {
                    productId: 'product-123',
                    userId: 'user-123',
                    userEmail: 'test@example.com'
                }
            });
            expect(mockRedisService.setex).toHaveBeenCalledWith('payment_order:order_razorpay_123', 900, JSON.stringify(mockDatabaseOrder));
        });
        test('should reject order with amount less than ₹1', async () => {
            const invalidOrderData = {
                ...validOrderData,
                amount: 50
            };
            await expect(paymentService.createPaymentOrder(invalidOrderData))
                .rejects.toThrow('Amount must be at least ₹1 (100 paise)');
        });
        test('should reject order for non-existent user', async () => {
            mockDatabaseService.client.user.findUnique.mockResolvedValue(null);
            await expect(paymentService.createPaymentOrder(validOrderData))
                .rejects.toThrow('User not found');
        });
        test('should handle Razorpay order creation failure', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com', phone: '+91-9876543210' };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            mockRazorpay.orders.create.mockRejectedValue(new Error('Razorpay API error'));
            await expect(paymentService.createPaymentOrder(validOrderData))
                .rejects.toThrow('Razorpay API error');
        });
    });
    describe('Payment Signature Verification', () => {
        test('should verify valid payment signature', () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const body = `${orderId}|${paymentId}`;
            const signature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(body)
                .digest('hex');
            const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, signature);
            expect(isValid).toBe(true);
        });
        test('should reject invalid payment signature', () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const invalidSignature = 'invalid_signature';
            const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, invalidSignature);
            expect(isValid).toBe(false);
        });
        test('should handle signature verification errors gracefully', () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            const malformedSignature = null;
            const isValid = paymentService.verifyPaymentSignature(orderId, paymentId, malformedSignature);
            expect(isValid).toBe(false);
        });
    });
    describe('Capture Payment', () => {
        const validCaptureData = {
            orderId: 'order_razorpay_123',
            paymentId: 'pay_razorpay_123',
            signature: 'valid_signature'
        };
        test('should capture authorized payment successfully', async () => {
            const mockOrder = {
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                userId: 'user-123',
                amount: 50000
            };
            const mockRazorpayPayment = {
                id: 'pay_razorpay_123',
                status: 'authorized',
                method: 'card',
                amount: 50000,
                currency: 'INR',
                fee: 1000,
                tax: 180,
                notes: {}
            };
            const mockCapturedPayment = {
                ...mockRazorpayPayment,
                status: 'captured'
            };
            const mockTransaction = {
                id: 'transaction-123',
                orderId: 'db-order-123',
                razorpayPaymentId: 'pay_razorpay_123',
                amount: 50000,
                status: 'captured'
            };
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockOrder);
            const body = `${validCaptureData.orderId}|${validCaptureData.paymentId}`;
            const validSignature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(body)
                .digest('hex');
            jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
            mockRazorpay.payments.fetch.mockResolvedValue(mockRazorpayPayment);
            mockRazorpay.payments.capture.mockResolvedValue(mockCapturedPayment);
            mockDatabaseService.client.paymentTransaction.create.mockResolvedValue(mockTransaction);
            mockDatabaseService.client.paymentOrder.update.mockResolvedValue({});
            mockRedisService.del.mockResolvedValue(1);
            const result = await paymentService.capturePayment(validCaptureData.orderId, validCaptureData.paymentId, validSignature);
            expect(result).toMatchObject({
                id: 'transaction-123',
                orderId: 'db-order-123',
                razorpayPaymentId: 'pay_razorpay_123',
                amount: 50000,
                status: 'captured'
            });
            expect(mockRazorpay.payments.capture).toHaveBeenCalledWith('pay_razorpay_123', 50000);
            expect(mockDatabaseService.client.paymentOrder.update).toHaveBeenCalledWith({
                where: { id: 'db-order-123' },
                data: { status: 'paid' }
            });
        });
        test('should handle already captured payment', async () => {
            const mockOrder = {
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                userId: 'user-123',
                amount: 50000
            };
            const mockCapturedPayment = {
                id: 'pay_razorpay_123',
                status: 'captured',
                method: 'card',
                amount: 50000,
                currency: 'INR'
            };
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockOrder);
            jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
            mockRazorpay.payments.fetch.mockResolvedValue(mockCapturedPayment);
            mockDatabaseService.client.paymentTransaction.create.mockResolvedValue({
                id: 'transaction-123',
                status: 'captured'
            });
            const result = await paymentService.capturePayment('order_razorpay_123', 'pay_razorpay_123', 'valid_signature');
            expect(result.status).toBe('captured');
            expect(mockRazorpay.payments.capture).not.toHaveBeenCalled();
        });
        test('should reject capture with invalid signature', async () => {
            const mockOrder = {
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                userId: 'user-123',
                amount: 50000
            };
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockOrder);
            jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(false);
            await expect(paymentService.capturePayment('order_razorpay_123', 'pay_razorpay_123', 'invalid_signature')).rejects.toThrow('Invalid payment signature');
        });
        test('should reject capture for non-existent order', async () => {
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(null);
            await expect(paymentService.capturePayment('non_existent_order', 'pay_razorpay_123', 'signature')).rejects.toThrow('Payment order not found');
        });
        test('should reject capture for failed payment', async () => {
            const mockOrder = {
                id: 'db-order-123',
                razorpayOrderId: 'order_razorpay_123',
                amount: 50000
            };
            const mockFailedPayment = {
                id: 'pay_razorpay_123',
                status: 'failed'
            };
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockOrder);
            jest.spyOn(paymentService, 'verifyPaymentSignature').mockReturnValue(true);
            mockRazorpay.payments.fetch.mockResolvedValue(mockFailedPayment);
            await expect(paymentService.capturePayment('order_razorpay_123', 'pay_razorpay_123', 'valid_signature')).rejects.toThrow('Payment not successful. Status: failed');
        });
    });
    describe('Create Refund', () => {
        test('should create full refund successfully', async () => {
            const mockTransaction = {
                id: 'transaction-123',
                razorpayPaymentId: 'pay_razorpay_123',
                amount: 50000,
                currency: 'INR'
            };
            const mockRazorpayRefund = {
                id: 'rfnd_razorpay_123',
                amount: 50000,
                currency: 'INR',
                status: 'pending'
            };
            const mockRefund = {
                id: 'refund-123',
                paymentId: 'transaction-123',
                razorpayRefundId: 'rfnd_razorpay_123',
                amount: 50000,
                currency: 'INR',
                status: 'pending',
                reason: 'Customer request'
            };
            mockDatabaseService.client.paymentTransaction.findUnique.mockResolvedValue(mockTransaction);
            mockRazorpay.payments.refund.mockResolvedValue(mockRazorpayRefund);
            mockDatabaseService.client.paymentRefund.create.mockResolvedValue(mockRefund);
            const result = await paymentService.createRefund('pay_razorpay_123', undefined, 'Customer request');
            expect(result).toMatchObject({
                id: 'refund-123',
                paymentId: 'transaction-123',
                amount: 50000,
                status: 'pending',
                reason: 'Customer request'
            });
            expect(mockRazorpay.payments.refund).toHaveBeenCalledWith('pay_razorpay_123', {
                amount: 50000,
                notes: { reason: 'Customer request' }
            });
        });
        test('should create partial refund successfully', async () => {
            const mockTransaction = {
                id: 'transaction-123',
                razorpayPaymentId: 'pay_razorpay_123',
                amount: 50000,
                currency: 'INR'
            };
            const partialAmount = 25000;
            const mockRazorpayRefund = {
                id: 'rfnd_razorpay_123',
                amount: partialAmount,
                currency: 'INR'
            };
            mockDatabaseService.client.paymentTransaction.findUnique.mockResolvedValue(mockTransaction);
            mockRazorpay.payments.refund.mockResolvedValue(mockRazorpayRefund);
            mockDatabaseService.client.paymentRefund.create.mockResolvedValue({
                id: 'refund-123',
                amount: partialAmount
            });
            const result = await paymentService.createRefund('pay_razorpay_123', partialAmount, 'Partial refund');
            expect(result.amount).toBe(partialAmount);
            expect(mockRazorpay.payments.refund).toHaveBeenCalledWith('pay_razorpay_123', {
                amount: partialAmount,
                notes: { reason: 'Partial refund' }
            });
        });
        test('should reject refund for non-existent payment', async () => {
            mockDatabaseService.client.paymentTransaction.findUnique.mockResolvedValue(null);
            await expect(paymentService.createRefund('non_existent_payment'))
                .rejects.toThrow('Payment transaction not found');
        });
    });
    describe('Subscription Management', () => {
        test('should create subscription plan successfully', async () => {
            const planData = {
                interval: 'monthly',
                period: 1,
                amount: 99900,
                currency: 'INR'
            };
            const mockRazorpayPlan = {
                id: 'plan_razorpay_123',
                interval: 'monthly',
                period: 1,
                item: {
                    amount: 99900,
                    currency: 'INR'
                }
            };
            mockRazorpay.plans.create.mockResolvedValue(mockRazorpayPlan);
            mockDatabaseService.client.subscriptionPlan.create.mockResolvedValue({
                id: 'plan-123',
                razorpayPlanId: 'plan_razorpay_123'
            });
            const result = await paymentService.createSubscriptionPlan(planData);
            expect(result).toMatchObject({
                id: 'plan_razorpay_123',
                interval: 'monthly',
                period: 1
            });
            expect(mockRazorpay.plans.create).toHaveBeenCalledWith({
                period: 1,
                interval: 'monthly',
                item: {
                    name: 'HASIVU monthly plan',
                    amount: 99900,
                    currency: 'INR',
                    description: 'HASIVU school food delivery monthly subscription'
                },
                notes: {}
            });
        });
        test('should create subscription successfully', async () => {
            const subscriptionData = {
                userId: 'user-123',
                planId: 'plan-123'
            };
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com'
            };
            const mockPlan = {
                id: 'plan-123',
                razorpayPlanId: 'plan_razorpay_123'
            };
            const mockRazorpaySubscription = {
                id: 'sub_razorpay_123',
                plan_id: 'plan_razorpay_123',
                current_start: Math.floor(Date.now() / 1000),
                current_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            };
            const mockSubscription = {
                id: 'subscription-123',
                razorpaySubscriptionId: 'sub_razorpay_123',
                userId: 'user-123',
                planId: 'plan-123',
                status: 'created'
            };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            mockDatabaseService.client.subscriptionPlan.findUnique.mockResolvedValue(mockPlan);
            mockRazorpay.subscriptions.create.mockResolvedValue(mockRazorpaySubscription);
            mockDatabaseService.client.paymentSubscription.create.mockResolvedValue(mockSubscription);
            const result = await paymentService.createSubscription(subscriptionData);
            expect(result).toMatchObject({
                id: 'subscription-123',
                userId: 'user-123',
                planId: 'plan-123',
                status: 'created'
            });
        });
    });
    describe('Webhook Handling', () => {
        test('should handle payment.captured webhook', async () => {
            const webhookBody = JSON.stringify({
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_razorpay_123',
                            status: 'captured'
                        }
                    }
                }
            });
            const signature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(webhookBody)
                .digest('hex');
            mockDatabaseService.client.paymentTransaction.updateMany.mockResolvedValue({ count: 1 });
            const result = await paymentService.handleWebhook(webhookBody, signature);
            expect(result).toEqual({
                success: true,
                message: 'Webhook processed successfully'
            });
            expect(mockDatabaseService.client.paymentTransaction.updateMany).toHaveBeenCalledWith({
                where: { razorpayPaymentId: 'pay_razorpay_123' },
                data: {
                    status: 'captured',
                    capturedAt: expect.any(Date)
                }
            });
        });
        test('should reject webhook with invalid signature', async () => {
            const webhookBody = JSON.stringify({
                event: 'payment.captured',
                payload: {}
            });
            const result = await paymentService.handleWebhook(webhookBody, 'invalid_signature');
            expect(result).toEqual({
                success: false,
                message: 'Invalid webhook signature'
            });
        });
        test('should handle unknown webhook events gracefully', async () => {
            const webhookBody = JSON.stringify({
                event: 'unknown.event',
                payload: {}
            });
            const signature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(webhookBody)
                .digest('hex');
            const result = await paymentService.handleWebhook(webhookBody, signature);
            expect(result).toEqual({
                success: true,
                message: 'Webhook processed successfully'
            });
        });
    });
    describe('Payment Order Retrieval', () => {
        test('should retrieve order from cache', async () => {
            const mockOrder = {
                id: 'order-123',
                razorpayOrderId: 'order_razorpay_123',
                status: 'created'
            };
            mockRedisService.get.mockResolvedValue(JSON.stringify(mockOrder));
            const result = await paymentService.getPaymentOrder('order_razorpay_123');
            expect(result).toEqual(mockOrder);
            expect(mockRedisService.get).toHaveBeenCalledWith('payment_order:order_razorpay_123');
            expect(mockDatabaseService.client.paymentOrder.findUnique).not.toHaveBeenCalled();
        });
        test('should retrieve order from database when not cached', async () => {
            const mockOrder = {
                id: 'order-123',
                razorpayOrderId: 'order_razorpay_123',
                status: 'created'
            };
            mockRedisService.get.mockResolvedValue(null);
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(mockOrder);
            mockRedisService.setex.mockResolvedValue('OK');
            const result = await paymentService.getPaymentOrder('order_razorpay_123');
            expect(result).toEqual(mockOrder);
            expect(mockDatabaseService.client.paymentOrder.findUnique).toHaveBeenCalledWith({
                where: { razorpayOrderId: 'order_razorpay_123' }
            });
            expect(mockRedisService.setex).toHaveBeenCalledWith('payment_order:order_razorpay_123', 300, JSON.stringify(mockOrder));
        });
        test('should return null for non-existent order', async () => {
            mockRedisService.get.mockResolvedValue(null);
            mockDatabaseService.client.paymentOrder.findUnique.mockResolvedValue(null);
            const result = await paymentService.getPaymentOrder('non_existent_order');
            expect(result).toBeNull();
        });
    });
    describe('Error Handling and Edge Cases', () => {
        test('should handle database connection errors gracefully', async () => {
            mockDatabaseService.client.user.findUnique.mockRejectedValue(new Error('Database connection failed'));
            await expect(paymentService.createPaymentOrder({
                userId: 'user-123',
                amount: 50000
            })).rejects.toThrow('Database connection failed');
        });
        test('should handle Redis connection errors gracefully', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };
            const mockRazorpayOrder = { id: 'order_123' };
            const mockDatabaseOrder = { id: 'db-order-123' };
            mockDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
            mockRazorpay.orders.create.mockResolvedValue(mockRazorpayOrder);
            mockDatabaseService.client.paymentOrder.create.mockResolvedValue(mockDatabaseOrder);
            mockRedisService.setex.mockRejectedValue(new Error('Redis connection failed'));
            const result = await paymentService.createPaymentOrder({
                userId: 'user-123',
                amount: 50000
            });
            expect(result).toBeDefined();
        });
        test('should handle malformed webhook payloads', async () => {
            const malformedBody = 'invalid json';
            const signature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(malformedBody)
                .digest('hex');
            const result = await paymentService.handleWebhook(malformedBody, signature);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unexpected token');
        });
    });
    describe('Security Tests', () => {
        test('should use timing-safe signature comparison', () => {
            const orderId = 'order_123';
            const paymentId = 'pay_123';
            jest.spyOn(crypto_1.default, 'timingSafeEqual');
            const body = `${orderId}|${paymentId}`;
            const validSignature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(body)
                .digest('hex');
            paymentService.verifyPaymentSignature(orderId, paymentId, validSignature);
            expect(crypto_1.default.timingSafeEqual).toHaveBeenCalled();
        });
        test('should validate webhook signatures with timing-safe comparison', async () => {
            const webhookBody = JSON.stringify({ event: 'test' });
            jest.spyOn(crypto_1.default, 'timingSafeEqual');
            const validSignature = crypto_1.default
                .createHmac('sha256', 'test-webhook-secret')
                .update(webhookBody)
                .digest('hex');
            await paymentService.handleWebhook(webhookBody, validSignature);
            expect(crypto_1.default.timingSafeEqual).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=payment.service.test.js.map