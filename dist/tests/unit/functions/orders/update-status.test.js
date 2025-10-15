"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_status_1 = require("../../../../src/functions/orders/update-status");
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
describe('Update Order Status Lambda Function', () => {
    const mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
    const mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
    const mockHandleError = require('@/shared/response.utils').handleError;
    const mockPrisma = require('@/functions/shared/database.service').DatabaseService.prisma;
    const mockTransaction = require('@/functions/shared/database.service').DatabaseService.transaction;
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateSuccessResponse.mockReturnValue({
            statusCode: 200,
            body: JSON.stringify({ message: 'Order status updated successfully' }),
        });
    });
    describe('Input Validation', () => {
        test('should reject non-PUT methods', async () => {
            const event = { httpMethod: 'POST' };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 405 });
            await (0, update_status_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        });
        test('should reject missing orderId', async () => {
            const event = { httpMethod: 'PUT', pathParameters: {} };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 400 });
            await (0, update_status_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('MISSING_ORDER_ID', 'Missing orderId in path parameters', 400);
        });
        test('should reject missing status', async () => {
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                body: JSON.stringify({}),
            };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 400 });
            await (0, update_status_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('MISSING_STATUS', 'Missing required field: status', 400);
        });
    });
    describe('Status Validation', () => {
        test('should reject invalid status transitions', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order1',
                status: 'delivered',
                userId: 'user1',
            });
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                headers: { 'x-user-id': 'user1' },
                body: JSON.stringify({ status: 'pending' }),
            };
            await (0, update_status_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Invalid status transition'),
            }));
        });
    });
    describe('Status Update', () => {
        beforeEach(() => {
            mockPrisma.order.findUnique.mockResolvedValue({
                id: 'order1',
                status: 'pending',
                userId: 'user1',
                studentId: 'student1',
                schoolId: 'school1',
                orderNumber: 'ORD001',
            });
            mockTransaction.mockImplementation(async (callback) => callback(mockPrisma));
            mockPrisma.order.update.mockResolvedValue({
                id: 'order1',
                status: 'confirmed',
                updatedAt: new Date(),
            });
        });
        test('should update status successfully', async () => {
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                headers: { 'x-user-id': 'user1' },
                body: JSON.stringify({ status: 'confirmed' }),
            };
            await (0, update_status_1.handler)(event, {});
            expect(mockCreateSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    orderStatus: expect.objectContaining({
                        orderId: 'order1',
                        previousStatus: 'pending',
                        newStatus: 'confirmed',
                    }),
                },
                message: expect.stringContaining('Order status updated'),
            }), 200);
        });
        test('should reject status unchanged', async () => {
            const event = {
                httpMethod: 'PUT',
                pathParameters: { orderId: 'order1' },
                headers: { 'x-user-id': 'user1' },
                body: JSON.stringify({ status: 'pending' }),
            };
            mockCreateErrorResponse.mockReturnValue({ statusCode: 400 });
            await (0, update_status_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('STATUS_UNCHANGED', expect.stringContaining('already in'), 400);
        });
    });
});
//# sourceMappingURL=update-status.test.js.map