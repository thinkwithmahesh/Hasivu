"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_payment_order_1 = require("../../../../src/functions/payment/create-payment-order");
const razorpay_service_1 = require("../../../../src/functions/shared/razorpay.service");
const client_1 = require("@prisma/client");
jest.mock('../../../../src/functions/shared/razorpay.service');
jest.mock('../../../../src/utils/logger');
jest.mock('../../../../src/shared/response.utils');
jest.mock('@prisma/client');
const mockPrisma = {
    order: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    paymentOrder: {
        create: jest.fn()
    },
    user: {
        findFirst: jest.fn()
    }
};
client_1.PrismaClient.mockImplementation(() => mockPrisma);
describe('Create Payment Order Lambda Function', () => {
    let mockEvent;
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockEvent = {
            httpMethod: 'POST',
            body: JSON.stringify({
                orderId: 'order-123',
                amount: 50000
            }),
            requestContext: {
                authorizer: {
                    userId: 'user-123'
                }
            }
        };
        mockContext = {
            awsRequestId: 'test-request-id'
        };
        jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
            authenticateLambda: jest.fn().mockResolvedValue({
                user: { id: 'user-123' }
            })
        }));
        razorpay_service_1.razorpayService.createOrder.mockResolvedValue({
            id: 'order_razorpay_123',
            amount: 50000,
            currency: 'INR',
            status: 'created'
        });
    });
    describe('Input Validation', () => {
        it('should return 405 for non-POST methods', async () => {
            mockEvent.httpMethod = 'GET';
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(405);
            expect(JSON.parse(result.body).message).toContain('Only POST method is allowed');
        });
        it('should return 400 when orderId is missing', async () => {
            mockEvent.body = JSON.stringify({});
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('orderId is required');
        });
        it('should return 401 when user is not authenticated', async () => {
            mockEvent.requestContext.authorizer = undefined;
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(401);
        });
    });
    describe('Order Validation', () => {
        it('should return 404 when order does not exist', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(404);
            expect(JSON.parse(result.body).message).toContain('Order not found');
        });
        it('should return 403 when user does not own the order', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'different-user',
                status: 'pending',
                totalAmount: 500,
                currency: 'INR',
                paymentStatus: 'pending'
            });
            mockPrisma.user.findFirst.mockResolvedValue(null);
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(403);
            expect(JSON.parse(result.body).message).toContain('Not authorized');
        });
        it('should return 400 when order is not in payable status', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'user-123',
                status: 'completed',
                totalAmount: 500,
                currency: 'INR',
                paymentStatus: 'pending'
            });
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('Order cannot be paid for');
        });
        it('should return 400 when order is already paid', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'user-123',
                status: 'pending',
                totalAmount: 500,
                currency: 'INR',
                paymentStatus: 'pending',
                payments: [{ id: 'payment-1', status: 'paid' }]
            });
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('Order has already been paid');
        });
    });
    describe('Payment Order Creation', () => {
        beforeEach(() => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'user-123',
                status: 'pending',
                totalAmount: 500,
                currency: 'INR',
                paymentStatus: 'pending',
                orderNumber: 'ORD-001',
                student: { firstName: 'John', lastName: 'Doe' },
                school: { name: 'Test School' },
                payments: []
            });
            mockPrisma.paymentOrder.create.mockResolvedValue({
                id: 'order_razorpay_123',
                razorpayOrderId: 'order_razorpay_123',
                amount: 50000,
                currency: 'INR',
                status: 'created',
                userId: 'user-123',
                orderId: 'order-123',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                createdAt: new Date()
            });
        });
        it('should create payment order successfully', async () => {
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(razorpay_service_1.razorpayService.createOrder).toHaveBeenCalledWith({
                amount: 50000,
                currency: 'INR',
                receipt: 'order_ORD-001',
                payment_capture: true,
                notes: {
                    orderId: 'order-123',
                    orderNumber: 'ORD-001',
                    userId: 'user-123',
                    studentId: undefined,
                    schoolId: undefined
                }
            });
            const response = JSON.parse(result.body);
            expect(response.data.paymentOrder.id).toBe('order_razorpay_123');
            expect(response.data.paymentOrder.amount).toBe(50000);
            expect(response.data.razorpayKey).toBeDefined();
        });
        it('should use custom amount when provided', async () => {
            mockEvent.body = JSON.stringify({
                orderId: 'order-123',
                amount: 30000
            });
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(razorpay_service_1.razorpayService.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 30000 }));
        });
        it('should update order payment status to processing', async () => {
            await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(mockPrisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-123' },
                data: { paymentStatus: 'processing' }
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle Razorpay service errors', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'user-123',
                status: 'pending',
                totalAmount: 500,
                currency: 'INR',
                paymentStatus: 'pending',
                payments: []
            });
            razorpay_service_1.razorpayService.createOrder.mockRejectedValue(new Error('Razorpay service unavailable'));
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(JSON.parse(result.body).message).toContain('Failed to create payment order');
        });
        it('should handle database errors', async () => {
            mockPrisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(500);
        });
    });
    describe('Security', () => {
        it('should validate minimum amount', async () => {
            mockEvent.body = JSON.stringify({
                orderId: 'order-123',
                amount: 50
            });
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order-123',
                userId: 'user-123',
                status: 'pending',
                totalAmount: 0.5,
                currency: 'INR',
                paymentStatus: 'pending',
                payments: []
            });
            const result = await (0, create_payment_order_1.handler)(mockEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(JSON.parse(result.body).message).toContain('Amount must be at least ₹1');
        });
    });
});
//# sourceMappingURL=create-payment-order.test.js.map