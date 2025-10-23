"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_order_1 = require("../../../../src/functions/orders/update-order");
jest.mock('@/functions/shared/database.service', () => ({
    DatabaseService: {
        prisma: {
            order: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            user: {
                findFirst: jest.fn(),
            },
        },
        transaction: jest.fn(),
    },
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
describe('Update Order Lambda Function', () => {
    const mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
    const mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
    const mockHandleError = require('@/shared/response.utils').handleError;
    const mockPrisma = require('@/functions/shared/database.service').DatabaseService.prisma;
    const mockTransaction = require('@/functions/shared/database.service').DatabaseService.transaction;
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateSuccessResponse.mockReturnValue({
            statusCode: 200,
            body: JSON.stringify({ message: 'Order updated successfully' }),
        });
    });
    describe('Input Validation', () => {
        test('should reject non-PUT methods', async () => {
            const event = { httpMethod: 'POST' };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 405 });
            await (0, update_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        });
        test('should reject missing orderId', async () => {
            const event = { httpMethod: 'PUT', pathParameters: {} };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 400 });
            await (0, update_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        });
    });
    describe('Order Update', () => {
        beforeEach(() => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order1',
                status: 'pending',
                userId: 'user1',
                studentId: 'student1',
                schoolId: 'school1',
            });
            mockTransaction.mockImplementation(async (callback) => callback(mockPrisma));
            mockPrisma.order.update.mockResolvedValue({
                id: 'order1',
                specialInstructions: 'Updated instructions',
                updatedAt: new Date(),
            });
        });
        test('should update order successfully', async () => {
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                headers: { 'x-user-id': 'user1' },
                body: JSON.stringify({
                    specialInstructions: 'Updated instructions',
                }),
            };
            await (0, update_order_1.handler)(event, {});
            expect(mockCreateSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Order updated successfully',
            }), 200);
        });
        test('should reject unauthorized updates', async () => {
            mockPrisma.user.findFirst.mockResolvedValue(null);
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                headers: { 'x-user-id': 'unauthorized-user' },
                body: JSON.stringify({ specialInstructions: 'Test' }),
            };
            await (0, update_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authorized to update this order',
            }));
        });
    });
});
//# sourceMappingURL=update-order.test.js.map