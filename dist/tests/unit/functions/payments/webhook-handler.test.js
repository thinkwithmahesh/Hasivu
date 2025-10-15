"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webhook_handler_1 = require("../../../../src/functions/payment/webhook-handler");
const razorpay_service_1 = require("../../../../src/functions/shared/razorpay.service");
const client_1 = require("@prisma/client");
jest.mock('../../../../src/functions/shared/razorpay.service');
jest.mock('../../../../src/utils/logger');
jest.mock('@prisma/client');
const mockPrisma = {
    paymentTransaction: {
        updateMany: jest.fn(),
        create: jest.fn()
    },
    paymentOrder: {
        updateMany: jest.fn(),
        findFirst: jest.fn()
    },
    order: {
        update: jest.fn()
    },
    paymentRefund: {
        create: jest.fn()
    },
    auditLog: {
        create: jest.fn()
    }
};
client_1.PrismaClient.mockImplementation(() => mockPrisma);
describe('Webhook Handler Lambda Function', () => {
    let mockEvent;
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockEvent = {
            httpMethod: 'POST',
            headers: {
                'x-razorpay-signature': 'test-signature'
            },
            body: JSON.stringify({
                event: 'payment.captured',
                id: 'evt_test_123',
                payload: {
                    payment: {
                        entity: {
                            id: 'pay_test_123',
                            order_id: 'order_test_123',
                            amount: 50000,
                            status: 'captured',
                            method: 'card'
                        }
                    }
                }
            })
        };
        mockContext = {
            awsRequestId: 'test-request-id'
        };
        razorpay_service_1.razorpayService.verifyWebhookSignature.mockReturnValue(true);
    });
    describe('Input Validation', () => {
        it('should return 405 for non-POST methods', async () => {
            mockEvent.httpMethod = 'GET';
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(405);
            expect(JSON.parse(result.body).message).toContain('Only POST method is allowed');
        });
        it('should return 400 when signature header is missing', async () => {
            delete mockEvent.headers['x-razorpay-signature'];
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('X-Razorpay-Signature header required');
        });
        it('should return 400 when request body is missing', async () => {
            mockEvent.body = null;
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('Request body required');
        });
        it('should return 401 for invalid webhook signature', async () => {
            razorpay_service_1.razorpayService.verifyWebhookSignature.mockReturnValue(false);
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(401);
            expect(JSON.parse(result.body).message).toContain('Webhook signature verification failed');
        });
    });
    describe('Event Processing', () => {
        it('should ignore unsupported events', async () => {
            mockEvent.body = JSON.stringify({
                event: 'unsupported.event',
                id: 'evt_test_123'
            });
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(JSON.parse(result.body).message).toContain('Event type not supported');
        });
        describe('Payment Captured Event', () => {
            beforeEach(() => {
                mockEvent.body = JSON.stringify({
                    event: 'payment.captured',
                    id: 'evt_test_123',
                    payload: {
                        payment: {
                            entity: {
                                id: 'pay_test_123',
                                order_id: 'order_test_123',
                                amount: 50000,
                                status: 'captured',
                                method: 'card'
                            }
                        }
                    }
                });
            });
            it('should process payment.captured event successfully', async () => {
                mockPrisma.paymentOrder.findFirst.mockResolvedValue({
                    id: 'order_test_123',
                    orderId: 'db_order_123'
                });
                const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
                expect(result.statusCode).toBe(200);
                expect(mockPrisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
                    where: { razorpayPaymentId: 'pay_test_123' },
                    data: {
                        status: 'captured',
                        capturedAt: expect.any(Date)
                    }
                });
                expect(mockPrisma.paymentOrder.updateMany).toHaveBeenCalledWith({
                    where: { razorpayOrderId: 'order_test_123' },
                    data: { status: 'captured' }
                });
                expect(mockPrisma.order.update).toHaveBeenCalledWith({
                    where: { id: 'db_order_123' },
                    data: {
                        paymentStatus: 'paid',
                        status: 'confirmed'
                    }
                });
            });
            it('should handle orders without associated database order', async () => {
                mockPrisma.paymentOrder.findFirst.mockResolvedValue(null);
                const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
                expect(result.statusCode).toBe(200);
                expect(mockPrisma.order.update).not.toHaveBeenCalled();
            });
        });
        describe('Payment Failed Event', () => {
            beforeEach(() => {
                mockEvent.body = JSON.stringify({
                    event: 'payment.failed',
                    id: 'evt_test_123',
                    payload: {
                        payment: {
                            entity: {
                                id: 'pay_test_123',
                                order_id: 'order_test_123',
                                amount: 50000,
                                error_code: 'PAYMENT_FAILED',
                                status: 'failed'
                            }
                        }
                    }
                });
            });
            it('should process payment.failed event successfully', async () => {
                mockPrisma.paymentOrder.findFirst.mockResolvedValue({
                    id: 'order_test_123',
                    orderId: 'db_order_123'
                });
                const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
                expect(result.statusCode).toBe(200);
                expect(mockPrisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
                    where: { razorpayPaymentId: 'pay_test_123' },
                    data: { status: 'failed' }
                });
                expect(mockPrisma.order.update).toHaveBeenCalledWith({
                    where: { id: 'db_order_123' },
                    data: {
                        paymentStatus: 'failed',
                        status: 'cancelled'
                    }
                });
            });
        });
        describe('Refund Events', () => {
            beforeEach(() => {
                mockEvent.body = JSON.stringify({
                    event: 'refund.created',
                    id: 'evt_test_123',
                    payload: {
                        refund: {
                            entity: {
                                id: 'rfnd_test_123',
                                payment_id: 'pay_test_123',
                                amount: 25000,
                                currency: 'INR',
                                status: 'processed',
                                notes: { reason: 'Customer request' }
                            }
                        }
                    }
                });
            });
            it('should process refund.created event successfully', async () => {
                const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
                expect(result.statusCode).toBe(200);
                expect(mockPrisma.paymentRefund.create).toHaveBeenCalledWith({
                    data: {
                        razorpayRefundId: 'rfnd_test_123',
                        paymentId: 'pay_test_123',
                        amount: 25000,
                        currency: 'INR',
                        status: 'processed',
                        reason: 'webhook_refund',
                        notes: JSON.stringify({ reason: 'Customer request' }),
                        processedAt: expect.any(Date)
                    }
                });
                expect(mockPrisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
                    where: { razorpayPaymentId: 'pay_test_123' },
                    data: { refundedAt: expect.any(Date) }
                });
            });
        });
    });
    describe('Audit Logging', () => {
        it('should create audit log for processed webhooks', async () => {
            mockPrisma.paymentOrder.findFirst.mockResolvedValue({
                id: 'order_test_123',
                orderId: 'db_order_123'
            });
            await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    entityType: 'Webhook',
                    entityId: 'evt_test_123',
                    action: 'WEBHOOK_RECEIVED',
                    changes: expect.objectContaining({
                        eventType: 'payment.captured',
                        eventId: 'evt_test_123'
                    }),
                    userId: 'system',
                    createdById: 'system',
                    metadata: expect.objectContaining({
                        source: 'razorpay'
                    })
                }
            });
        });
    });
    describe('Error Handling', () => {
        it('should return 200 even when processing fails to prevent retries', async () => {
            mockPrisma.paymentTransaction.updateMany.mockRejectedValue(new Error('Database connection failed'));
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(JSON.parse(result.body).message).toContain('Webhook processing failed, but acknowledged');
        });
        it('should handle malformed JSON in webhook body', async () => {
            mockEvent.body = 'invalid json';
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(JSON.parse(result.body).message).toContain('Webhook processing failed');
        });
    });
    describe('Security', () => {
        it('should validate webhook secret configuration', async () => {
            process.env.RAZORPAY_WEBHOOK_SECRET = '';
            const result = await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(JSON.parse(result.body).message).toContain('Webhook secret not configured');
        });
        it('should log partial signature for debugging', async () => {
            mockPrisma.paymentOrder.findFirst.mockResolvedValue({
                id: 'order_test_123',
                orderId: 'db_order_123'
            });
            await (0, webhook_handler_1.handler)(mockEvent, mockContext);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: expect.objectContaining({
                        signature: expect.stringMatching(/^.{0,10}\.\.\.$/)
                    })
                })
            });
        });
    });
});
//# sourceMappingURL=webhook-handler.test.js.map