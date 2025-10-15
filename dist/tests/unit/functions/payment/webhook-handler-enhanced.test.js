"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const webhook_handler_1 = require("../../../../src/functions/payment/webhook-handler");
const DatabaseManager_1 = require("../../../../src/database/DatabaseManager");
const razorpay_service_1 = require("../../../../src/functions/shared/razorpay.service");
jest.mock('../../../../src/database/DatabaseManager', () => ({
    prisma: {
        paymentTransaction: {
            updateMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        paymentOrder: {
            updateMany: jest.fn(),
            findFirst: jest.fn(),
        },
        order: {
            update: jest.fn(),
        },
        subscription: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        billingCycle: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        paymentRefund: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    },
}));
jest.mock('../../../../src/functions/shared/razorpay.service', () => ({
    razorpayService: {
        verifyWebhookSignature: jest.fn(),
    },
}));
(0, globals_1.describe)('Enhanced Webhook Handler', () => {
    const mockContext = {
        awsRequestId: 'test-request-id',
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'webhook-handler',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:region:account:function:webhook-handler',
        memoryLimitInMB: '512',
        logGroupName: '/aws/lambda/webhook-handler',
        logStreamName: '2024/01/01/[$LATEST]test',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn(),
    };
    (0, globals_1.beforeEach)(() => {
        jest.clearAllMocks();
        process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
    });
    (0, globals_1.afterEach)(() => {
        delete process.env.RAZORPAY_WEBHOOK_SECRET;
    });
    (0, globals_1.describe)('Security - Signature Verification', () => {
        (0, globals_1.it)('should reject requests without signature header', async () => {
            const event = {
                httpMethod: 'POST',
                headers: {},
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_test_123',
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(400);
            (0, globals_1.expect)(JSON.parse(result.body).error).toContain('signature');
        });
        (0, globals_1.it)('should reject requests with invalid signature', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(false);
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'invalid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_test_123',
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(401);
            (0, globals_1.expect)(JSON.parse(result.body).error).toContain('signature');
        });
        (0, globals_1.it)('should accept requests with valid signature', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                orderId: 'meal_order_123',
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_test_123',
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_123',
                            amount: 50000,
                            status: 'captured',
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(razorpay_service_1.razorpayService.verifyWebhookSignature).toHaveBeenCalledWith(event.body, 'valid_signature', 'test_webhook_secret');
        });
    });
    (0, globals_1.describe)('Security - Replay Attack Protection', () => {
        (0, globals_1.it)('should process webhook only once (replay protection)', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                orderId: 'meal_order_123',
            });
            const webhookBody = {
                event: 'payment.captured',
                id: 'webhook_test_replay',
                payment: {
                    entity: {
                        id: 'pay_123',
                        order_id: 'order_123',
                        amount: 50000,
                    },
                },
            };
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify(webhookBody),
            };
            const result1 = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result1.statusCode).toBe(200);
            (0, globals_1.expect)(JSON.parse(result1.body).message).toBe('Webhook processed successfully');
            jest.clearAllMocks();
            const result2 = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result2.statusCode).toBe(200);
            (0, globals_1.expect)(JSON.parse(result2.body).message).toBe('Webhook already processed');
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentTransaction.updateMany).not.toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('Event Processing - Payment Captured', () => {
        (0, globals_1.it)('should update payment transaction and order status on payment.captured', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                orderId: 'meal_order_123',
                subscriptionId: null,
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_captured_123',
                    payment: {
                        entity: {
                            id: 'pay_123',
                            order_id: 'order_razorpay_123',
                            amount: 50000,
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentTransaction.updateMany).toHaveBeenCalledWith({
                where: { razorpayPaymentId: 'pay_123' },
                data: globals_1.expect.objectContaining({
                    status: 'captured',
                }),
            });
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentOrder.updateMany).toHaveBeenCalledWith({
                where: { razorpayOrderId: 'order_razorpay_123' },
                data: { status: 'captured' },
            });
            (0, globals_1.expect)(DatabaseManager_1.prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'meal_order_123' },
                data: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                },
            });
            (0, globals_1.expect)(DatabaseManager_1.prisma.auditLog.create).toHaveBeenCalled();
        });
        (0, globals_1.it)('should update subscription billing cycle on subscription payment captured', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                subscriptionId: 'sub_123',
                orderId: null,
            });
            jest.mocked(DatabaseManager_1.prisma.billingCycle.findFirst).mockResolvedValue({
                id: 'cycle_123',
                subscriptionId: 'sub_123',
                status: 'processing',
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_sub_captured_123',
                    payment: {
                        entity: {
                            id: 'pay_sub_123',
                            order_id: 'order_razorpay_123',
                            amount: 500000,
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.billingCycle.update).toHaveBeenCalledWith({
                where: { id: 'cycle_123' },
                data: globals_1.expect.objectContaining({
                    status: 'paid',
                    paymentId: 'order_123',
                }),
            });
            (0, globals_1.expect)(DatabaseManager_1.prisma.subscription.update).toHaveBeenCalledWith({
                where: { id: 'sub_123' },
                data: globals_1.expect.objectContaining({
                    status: 'active',
                    dunningAttempts: 0,
                }),
            });
        });
    });
    (0, globals_1.describe)('Event Processing - Payment Failed', () => {
        (0, globals_1.it)('should cancel order on payment.failed', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                orderId: 'meal_order_123',
                subscriptionId: null,
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.failed',
                    id: 'webhook_failed_123',
                    payment: {
                        entity: {
                            id: 'pay_failed_123',
                            order_id: 'order_razorpay_123',
                            error_code: 'BAD_REQUEST_ERROR',
                            error_description: 'Payment failed',
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.order.update).toHaveBeenCalledWith({
                where: { id: 'meal_order_123' },
                data: {
                    paymentStatus: 'failed',
                    status: 'cancelled',
                },
            });
        });
        (0, globals_1.it)('should handle subscription dunning on payment failure', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentOrder.findFirst).mockResolvedValue({
                id: 'order_123',
                razorpayOrderId: 'order_razorpay_123',
                subscriptionId: 'sub_123',
                orderId: null,
            });
            jest.mocked(DatabaseManager_1.prisma.subscription.findUnique).mockResolvedValue({
                id: 'sub_123',
                dunningAttempts: 2,
                maxDunningAttempts: 3,
                status: 'active',
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.failed',
                    id: 'webhook_sub_failed_123',
                    payment: {
                        entity: {
                            id: 'pay_sub_failed_123',
                            order_id: 'order_razorpay_123',
                            error_code: 'GATEWAY_ERROR',
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.subscription.update).toHaveBeenCalledWith({
                where: { id: 'sub_123' },
                data: globals_1.expect.objectContaining({
                    dunningAttempts: 3,
                    status: 'suspended',
                    suspendedAt: globals_1.expect.any(Date),
                }),
            });
        });
    });
    (0, globals_1.describe)('Event Processing - Refund Created', () => {
        (0, globals_1.it)('should create refund record on refund.created', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentRefund.findUnique).mockResolvedValue(null);
            jest.mocked(DatabaseManager_1.prisma.paymentTransaction.findFirst).mockResolvedValue({
                id: 'payment_txn_123',
                razorpayPaymentId: 'pay_123',
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'refund.created',
                    id: 'webhook_refund_123',
                    refund: {
                        entity: {
                            id: 'rfnd_123',
                            payment_id: 'pay_123',
                            amount: 50000,
                            currency: 'INR',
                            status: 'processed',
                            notes: { reason: 'Customer request' },
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentRefund.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    razorpayRefundId: 'rfnd_123',
                    paymentId: 'payment_txn_123',
                    amount: 50000,
                    currency: 'INR',
                    status: 'processed',
                }),
            });
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentTransaction.update).toHaveBeenCalledWith({
                where: { id: 'payment_txn_123' },
                data: globals_1.expect.objectContaining({
                    refundedAt: globals_1.expect.any(Date),
                }),
            });
        });
        (0, globals_1.it)('should skip creating duplicate refund records', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentRefund.findUnique).mockResolvedValue({
                id: 'existing_refund_123',
                razorpayRefundId: 'rfnd_123',
            });
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'refund.created',
                    id: 'webhook_duplicate_refund',
                    refund: {
                        entity: {
                            id: 'rfnd_123',
                            payment_id: 'pay_123',
                            amount: 50000,
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(DatabaseManager_1.prisma.paymentRefund.create).not.toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('Method Validation', () => {
        (0, globals_1.it)('should only accept POST requests', async () => {
            const event = {
                httpMethod: 'GET',
                headers: {},
                body: null,
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(405);
            (0, globals_1.expect)(JSON.parse(result.body).error).toContain('Method not allowed');
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should return 200 even on processing errors (idempotency)', async () => {
            jest.mocked(razorpay_service_1.razorpayService.verifyWebhookSignature).mockReturnValue(true);
            jest.mocked(DatabaseManager_1.prisma.paymentTransaction.updateMany).mockRejectedValue(new Error('Database error'));
            const event = {
                httpMethod: 'POST',
                headers: {
                    'x-razorpay-signature': 'valid_signature',
                },
                body: JSON.stringify({
                    event: 'payment.captured',
                    id: 'webhook_error_123',
                    payment: {
                        entity: {
                            id: 'pay_error_123',
                            order_id: 'order_error_123',
                            amount: 50000,
                        },
                    },
                }),
            };
            const result = await (0, webhook_handler_1.handler)(event, mockContext);
            (0, globals_1.expect)(result.statusCode).toBe(200);
            (0, globals_1.expect)(JSON.parse(result.body).message).toContain('failed, but acknowledged');
        });
    });
});
//# sourceMappingURL=webhook-handler-enhanced.test.js.map