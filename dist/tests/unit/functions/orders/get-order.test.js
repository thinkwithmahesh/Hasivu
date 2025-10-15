"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_order_1 = require("../../../../src/functions/orders/get-order");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        order: {
            findUnique: jest.fn(),
        },
        $disconnect: jest.fn(),
    })),
}));
jest.mock('../../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        logFunctionStart: jest.fn(),
        logFunctionEnd: jest.fn(),
    },
}));
jest.mock('../../../../src/shared/response.utils', () => ({
    createSuccessResponse: jest.fn(),
    createErrorResponse: jest.fn(),
    handleError: jest.fn(),
}));
describe('Get Order Lambda Function', () => {
    let mockPrisma;
    let mockCreateSuccessResponse;
    let mockCreateErrorResponse;
    let mockHandleError;
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new client_1.PrismaClient();
        mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
        mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
        mockHandleError = require('../../../../src/shared/response.utils').handleError;
        mockCreateSuccessResponse.mockReturnValue({
            statusCode: 200,
            body: JSON.stringify({ message: 'Order retrieved successfully' }),
        });
    });
    describe('Input Validation', () => {
        test('should reject non-GET methods', async () => {
            const event = {
                httpMethod: 'POST',
                pathParameters: { orderId: 'test-order-id' },
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            });
            const result = await (0, get_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        });
        test('should reject missing orderId', async () => {
            const event = {
                httpMethod: 'GET',
                pathParameters: {},
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing orderId' }),
            });
            const result = await (0, get_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        });
        test('should reject missing authentication', async () => {
            const event = {
                httpMethod: 'GET',
                pathParameters: { orderId: 'test-order-id' },
                headers: {},
                requestContext: {},
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 401,
                body: JSON.stringify({ error: 'Authentication required' }),
            });
            const result = await (0, get_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        });
    });
    describe('Order Retrieval', () => {
        beforeEach(() => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'test-order-id',
                orderNumber: 'ORD20241201120000TEST',
                userId: 'test-user-id',
                studentId: 'test-student-id',
                schoolId: 'test-school-id',
                deliveryDate: new Date('2024-12-01'),
                status: 'pending',
                paymentStatus: 'pending',
                totalAmount: 100,
                currency: 'INR',
                specialInstructions: 'No onions',
                allergyInfo: 'Peanut allergy',
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 'test-user-id',
                    firstName: 'John',
                    lastName: 'Parent',
                },
                student: {
                    id: 'test-student-id',
                    firstName: 'Jane',
                    lastName: 'Student',
                    grade: '5',
                    section: 'A',
                    parentId: 'test-user-id',
                    schoolId: 'test-school-id',
                },
                school: {
                    id: 'test-school-id',
                    name: 'Test School',
                    address: '123 Test St',
                },
                orderItems: [
                    {
                        id: 'test-item-id',
                        orderId: 'test-order-id',
                        menuItemId: 'test-menu-item-id',
                        quantity: 2,
                        unitPrice: 50,
                        totalPrice: 100,
                        notes: 'Extra spicy',
                        customizations: '{"spicy": true}',
                        menuItem: {
                            id: 'test-menu-item-id',
                            name: 'Test Item',
                            nutritionalInfo: '{"calories": 200}',
                            allergens: '["nuts"]',
                        },
                    },
                ],
                payments: [
                    {
                        id: 'test-payment-id',
                        status: 'paid',
                        amount: 100,
                        razorpayPaymentId: 'rzp_test_123',
                        paidAt: new Date(),
                    },
                ],
            });
        });
        test('should retrieve order successfully for authorized user', async () => {
            const event = {
                httpMethod: 'GET',
                pathParameters: { orderId: 'test-order-id' },
                headers: { 'x-user-id': 'test-user-id' },
            };
            await (0, get_order_1.handler)(event, {});
            expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
                where: { id: 'test-order-id' },
                include: expect.any(Object),
            });
            expect(mockCreateSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    order: expect.objectContaining({
                        id: 'test-order-id',
                        orderNumber: 'ORD20241201120000TEST',
                        totalAmount: 100,
                    }),
                },
                message: 'Order details retrieved successfully',
            }), 200);
        });
        test('should reject non-existent order', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            const event = {
                httpMethod: 'GET',
                pathParameters: { orderId: 'non-existent-order' },
                headers: { 'x-user-id': 'test-user-id' },
            };
            await (0, get_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Order not found',
            }));
        });
        test('should reject unauthorized access', async () => {
            const orderFindUniqueMock = mockPrisma.order.findUnique;
            const previousMockValue = orderFindUniqueMock.mock.results[0]?.value || {
                id: 'test-order-id',
                orderNumber: 'ORD20241201120000TEST',
                userId: 'test-user-id',
                student: {
                    id: 'test-student-id',
                    firstName: 'Jane',
                    lastName: 'Student',
                    parentId: 'test-user-id',
                },
            };
            orderFindUniqueMock.mockResolvedValue({
                ...previousMockValue,
                student: {
                    ...previousMockValue.student,
                    parentId: 'different-parent-id',
                },
            });
            const event = {
                httpMethod: 'GET',
                pathParameters: { orderId: 'test-order-id' },
                headers: { 'x-user-id': 'unauthorized-user' },
            };
            await (0, get_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authorized to view this order',
            }));
        });
    });
    describe('Error Handling', () => {
        test('should handle database errors', async () => {
            mockPrisma.order.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const event = {
                httpMethod: 'GET',
                pathParameters: { orderId: 'test-order-id' },
                headers: { 'x-user-id': 'test-user-id' },
            };
            await (0, get_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Database connection failed',
            }));
        });
    });
});
//# sourceMappingURL=get-order.test.js.map