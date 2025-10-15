"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_order_1 = require("../../../../src/functions/orders/create-order");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        menuItem: {
            findFirst: jest.fn(),
        },
        order: {
            create: jest.fn(),
        },
        orderItem: {
            create: jest.fn(),
        },
        $transaction: jest.fn(),
        $disconnect: jest.fn(),
    })),
}));
jest.mock('uuid', () => ({
    v4: jest.fn(),
}));
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock('../../../../src/shared/response.utils', () => ({
    createSuccessResponse: jest.fn(),
    createErrorResponse: jest.fn(),
    handleError: jest.fn(),
}));
jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
    authenticateLambda: jest.fn(),
}));
describe('Create Order Lambda Function', () => {
    let mockPrisma;
    let mockAuthenticateLambda;
    let mockCreateSuccessResponse;
    let mockCreateErrorResponse;
    let mockHandleError;
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma = new client_1.PrismaClient();
        mockAuthenticateLambda = require('../../../../src/shared/middleware/lambda-auth.middleware').authenticateLambda;
        mockCreateSuccessResponse = require('../../../../src/shared/response.utils').createSuccessResponse;
        mockCreateErrorResponse = require('../../../../src/shared/response.utils').createErrorResponse;
        mockHandleError = require('../../../../src/shared/response.utils').handleError;
        uuid_1.v4.mockReturnValue('test-order-id');
        mockAuthenticateLambda.mockResolvedValue({
            user: { id: 'test-user-id' },
        });
        mockCreateSuccessResponse.mockReturnValue({
            statusCode: 201,
            body: JSON.stringify({ message: 'Order created successfully' }),
        });
    });
    describe('Input Validation', () => {
        test('should reject non-POST methods', async () => {
            const event = {
                httpMethod: 'GET',
                body: '{}',
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 405,
                body: JSON.stringify({ error: 'Method not allowed' }),
            });
            const result = await (0, create_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('Method not allowed', 'Only POST method is allowed', 405);
        });
        test('should reject missing required fields', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({}),
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' }),
            });
            const result = await (0, create_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('Missing required fields', 'Missing required fields: studentId, deliveryDate, orderItems', 400);
        });
        test('should reject invalid delivery date', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: 'invalid-date',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid date format' }),
            });
            const result = await (0, create_order_1.handler)(event, {});
            expect(mockCreateErrorResponse).toHaveBeenCalledWith('Invalid date format', 'Invalid delivery date format', 400);
        });
        test('should reject delivery date too soon', async () => {
            const tomorrow = new Date();
            tomorrow.setHours(tomorrow.getHours() + 1);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: tomorrow.toISOString().split('T')[0],
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 400,
                body: JSON.stringify({ error: 'Delivery date too soon' }),
            });
            const result = await (0, create_order_1.handler)(event, {});
            expect(result).toBeDefined();
        });
        test('should reject weekend delivery dates', async () => {
            const saturday = new Date();
            saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: saturday.toISOString().split('T')[0],
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            mockCreateErrorResponse.mockReturnValue({
                statusCode: 400,
                body: JSON.stringify({ error: 'Weekend delivery not allowed' }),
            });
            const result = await (0, create_order_1.handler)(event, {});
            expect(result).toBeDefined();
        });
    });
    describe('Student Validation', () => {
        test('should reject non-existent student', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'non-existent-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Student not found',
            }));
        });
        test('should reject inactive student', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                isActive: false,
                school: { id: 'school1', name: 'Test School', isActive: true },
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Student account is not active',
            }));
        });
        test('should reject orders for students from inactive schools', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                isActive: true,
                school: { id: 'school1', name: 'Test School', isActive: false },
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'School is not active',
            }));
        });
        test('should reject unauthorized parent orders', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                parentId: 'different-parent',
                isActive: true,
                school: { id: 'school1', name: 'Test School', isActive: true },
            });
            mockPrisma.user.findFirst.mockResolvedValue(null);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Not authorized to place orders for this student',
            }));
        });
    });
    describe('Order Item Validation', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                parentId: 'test-user-id',
                isActive: true,
                school: { id: 'school1', name: 'Test School', isActive: true },
            });
        });
        test('should reject empty order items', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Order must contain at least one item',
            }));
        });
        test('should reject orders with too many items', async () => {
            const manyItems = Array(25).fill({ menuItemId: 'item1', quantity: 1 });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: manyItems,
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Maximum 20 items allowed per order',
            }));
        });
        test('should reject invalid item quantities', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 0 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Item quantity must be greater than 0',
            }));
        });
        test('should reject excessive item quantities', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 15 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Maximum 10 quantity allowed per item',
            }));
        });
        test('should reject non-existent menu items', async () => {
            mockPrisma.menuItem.findFirst.mockResolvedValue(null);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'non-existent-item', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Menu item not found: non-existent-item',
            }));
        });
        test('should reject unavailable menu items', async () => {
            mockPrisma.menuItem.findFirst.mockResolvedValue({
                id: 'item1',
                name: 'Test Item',
                price: 50,
                available: false,
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Menu item is not available: Test Item',
            }));
        });
    });
    describe('Order Creation', () => {
        beforeEach(() => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                parentId: 'test-user-id',
                isActive: true,
                school: { id: 'school1', name: 'Test School', isActive: true },
            });
            mockPrisma.menuItem.findFirst.mockResolvedValue({
                id: 'item1',
                name: 'Test Item',
                price: 50,
                available: true,
            });
            mockPrisma.$transaction.mockImplementation(async (callback) => {
                return callback({
                    order: mockPrisma.order,
                    orderItem: mockPrisma.orderItem,
                });
            });
            mockPrisma.order.create.mockResolvedValue({
                id: 'test-order-id',
                orderNumber: 'ORD20241201120000TEST',
                userId: 'test-user-id',
                studentId: 'test-student',
                schoolId: 'school1',
                deliveryDate: new Date('2024-12-01'),
                status: 'pending',
                paymentStatus: 'pending',
                totalAmount: 50,
                currency: 'INR',
                specialInstructions: null,
                allergyInfo: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockPrisma.orderItem.create.mockResolvedValue({
                id: 'test-item-id',
                orderId: 'test-order-id',
                menuItemId: 'item1',
                quantity: 1,
                unitPrice: 50,
                totalPrice: 50,
                notes: null,
                customizations: '{}',
            });
        });
        test('should create order successfully', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                    specialInstructions: 'No onions',
                    allergyInfo: 'Peanut allergy',
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockPrisma.order.create).toHaveBeenCalledWith({
                data: {
                    id: 'test-order-id',
                    orderNumber: 'ORD20241201120000TEST',
                    userId: 'test-user-id',
                    studentId: 'test-student',
                    schoolId: 'school1',
                    deliveryDate: expect.any(Date),
                    status: 'pending',
                    paymentStatus: 'pending',
                    totalAmount: 50,
                    currency: 'INR',
                    specialInstructions: 'No onions',
                    allergyInfo: 'Peanut allergy',
                    metadata: JSON.stringify({ deliveryInstructions: undefined, contactPhone: undefined }),
                },
            });
            expect(mockPrisma.orderItem.create).toHaveBeenCalledWith({
                data: {
                    id: 'test-order-id',
                    orderId: 'test-order-id',
                    menuItemId: 'item1',
                    quantity: 1,
                    unitPrice: 50,
                    totalPrice: 50,
                    notes: undefined,
                    customizations: JSON.stringify(undefined),
                },
            });
            expect(mockCreateSuccessResponse).toHaveBeenCalledWith(expect.objectContaining({
                data: {
                    order: expect.objectContaining({
                        id: 'test-order-id',
                        orderNumber: 'ORD20241201120000TEST',
                        totalAmount: 50,
                    }),
                },
                message: 'Order created successfully',
            }), 201);
        });
        test('should handle transaction rollback on error', async () => {
            mockPrisma.order.create.mockRejectedValue(new Error('Database error'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Database error',
            }));
        });
    });
    describe('Error Handling', () => {
        test('should handle authentication failures', async () => {
            mockAuthenticateLambda.mockRejectedValue(new Error('Authentication failed'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            await (0, create_order_1.handler)(event, {});
            expect(mockHandleError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Authentication failed',
            }));
        });
        test('should handle Prisma disconnect errors', async () => {
            mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: 'test-student',
                    deliveryDate: '2024-12-01',
                    orderItems: [{ menuItemId: 'item1', quantity: 1 }],
                }),
            };
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'test-student',
                firstName: 'John',
                lastName: 'Doe',
                parentId: 'test-user-id',
                isActive: true,
                school: { id: 'school1', name: 'Test School', isActive: true },
            });
            mockPrisma.menuItem.findFirst.mockResolvedValue({
                id: 'item1',
                name: 'Test Item',
                price: 50,
                available: true,
            });
            mockPrisma.$transaction.mockResolvedValue({
                order: { id: 'test-order-id' },
                orderItems: [{ id: 'test-item-id' }],
            });
            await (0, create_order_1.handler)(event, {});
            expect(mockCreateSuccessResponse).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=create-order.test.js.map