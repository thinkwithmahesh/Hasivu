"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const verify_card_1 = require("../../../../src/functions/rfid/verify-card");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        rFIDCard: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        rFIDReader: {
            findUnique: jest.fn()
        },
        order: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        deliveryVerification: {
            create: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        $disconnect: jest.fn()
    }))
}));
jest.mock('../../../../src/shared/middleware/lambda-auth.middleware', () => ({
    authenticateLambda: jest.fn()
}));
jest.mock('../../../../src/shared/response.utils', () => ({
    createSuccessResponse: jest.fn((data) => ({
        statusCode: 200,
        body: JSON.stringify(data)
    })),
    createErrorResponse: jest.fn((code, message, statusCode, details) => ({
        statusCode,
        body: JSON.stringify({ error: message, errorCode: code })
    })),
    handleError: jest.fn((error, message) => ({
        statusCode: 500,
        body: JSON.stringify({ error: message || (error instanceof Error ? error.message : 'An error occurred') })
    }))
}));
jest.mock('../../../../src/shared/logger.service', () => ({
    LoggerService: {
        getInstance: () => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        })
    }
}));
jest.mock('uuid', () => ({
    v4: () => 'verification-uuid-5678'
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../../src/shared/middleware/lambda-auth.middleware');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');
describe('RFID Verify Card Lambda Function', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'rfid-verify-card',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:rfid-verify-card',
        memoryLimitInMB: '256',
        awsRequestId: 'verify-request-id',
        logGroupName: '/aws/lambda/rfid-verify-card',
        logStreamName: '2024/01/01/[1]verify123456',
        getRemainingTimeInMillis: () => 20000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockAuthenticatedUser = {
        id: 'teacher-123',
        email: 'teacher@school.com',
        role: 'teacher',
        schoolId: 'school-123'
    };
    const mockRFIDCard = {
        id: 'card-456',
        cardNumber: 'RFID-ABCD1234EFGH',
        isActive: true,
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        studentId: 'student-456',
        schoolId: 'school-123',
        student: {
            id: 'student-456',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@student.com',
            role: 'student',
            isActive: true,
            schoolId: 'school-123',
            rfidCards: [
                { cardNumber: 'RFID-ABCD1234EFGH' }
            ]
        },
        school: {
            id: 'school-123',
            name: 'Secondary School',
            code: 'SEC001',
            isActive: true
        }
    };
    const mockRFIDReader = {
        id: 'reader-456',
        name: 'Library Reader',
        location: 'Main Library',
        status: 'online',
        isActive: true,
        schoolId: 'school-123',
        lastHeartbeat: new Date()
    };
    const mockOrder = {
        id: 'order-456',
        orderNumber: 'ORD-2024-002',
        status: 'ready',
        studentId: 'student-456',
        deliveryDate: new Date(),
        totalAmount: 150,
        student: {
            schoolId: 'school-123',
            rfidCards: [
                { cardNumber: 'RFID-ABCD1234EFGH' }
            ]
        },
        school: {
            id: 'school-123',
            name: 'Secondary School',
            code: 'SEC001'
        }
    };
    const mockDeliveryVerification = {
        id: 'verification-uuid-5678',
        cardId: 'card-456',
        studentId: 'student-456',
        readerId: 'reader-456',
        orderId: 'order-456',
        status: 'verified',
        metadata: JSON.stringify({
            location: 'Main Library',
            verificationData: {}
        }),
        verifiedAt: new Date()
    };
    const validEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
            cardNumber: 'RFID-ABCD1234EFGH',
            readerId: 'reader-456',
            orderId: 'order-456',
            location: 'Main Library',
            verificationData: {
                timestamp: new Date().toISOString(),
                source: 'manual_verification'
            }
        }),
        headers: {
            'authorization': 'Bearer valid-token'
        },
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {},
        resource: '',
        path: '',
        isBase64Encoded: false,
        multiValueHeaders: {}
    };
    beforeEach(() => {
        jest.clearAllMocks();
        authenticateLambda.mockResolvedValue(mockAuthenticatedUser);
        mockPrisma.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
        mockPrisma.rFIDReader.findUnique.mockResolvedValue(mockRFIDReader);
        mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
        mockPrisma.deliveryVerification.create.mockResolvedValue(mockDeliveryVerification);
        mockPrisma.rFIDCard.update.mockResolvedValue({
            ...mockRFIDCard,
            lastUsedAt: new Date()
        });
        mockPrisma.order.update.mockResolvedValue({
            ...mockOrder,
            status: 'delivered',
            deliveredAt: new Date()
        });
        mockPrisma.auditLog.create.mockResolvedValue({});
    });
    describe('Valid Card Verification', () => {
        it('should verify RFID card successfully with all components', async () => {
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('Verification completed successfully');
            expect(authenticateLambda).toHaveBeenCalledWith(validEvent);
            expect(mockPrisma.rFIDCard.findUnique).toHaveBeenCalledWith({
                where: { cardNumber: 'RFID-ABCD1234EFGH' },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            isActive: true,
                            schoolId: true
                        }
                    },
                    school: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            isActive: true
                        }
                    }
                }
            });
            expect(mockPrisma.rFIDReader.findUnique).toHaveBeenCalledWith({
                where: { id: 'reader-456' },
                select: {
                    id: true,
                    name: true,
                    location: true,
                    status: true,
                    isActive: true,
                    schoolId: true,
                    lastHeartbeat: true
                }
            });
            expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
                where: { id: 'order-456' },
                include: {
                    student: {
                        include: {
                            rfidCards: {
                                where: {
                                    OR: [
                                        { expiresAt: null },
                                        { expiresAt: { gt: expect.any(Date) } }
                                    ],
                                    isActive: true
                                },
                                select: {
                                    cardNumber: true
                                }
                            }
                        }
                    },
                    school: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    }
                }
            });
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: {
                    cardId: 'card-456',
                    studentId: 'student-456',
                    readerId: 'reader-456',
                    orderId: 'order-456',
                    status: 'verified',
                    metadata: JSON.stringify({
                        location: 'Main Library',
                        verificationData: {
                            timestamp: expect.any(String),
                            source: 'manual_verification'
                        }
                    }),
                    verifiedAt: expect.any(Date)
                }
            });
            expect(mockPrisma.rFIDCard.update).toHaveBeenCalledWith({
                where: { id: 'card-456' },
                data: { lastUsedAt: expect.any(Date) }
            });
            expect(mockPrisma.order.update).toHaveBeenCalledWith({
                where: { id: 'order-456' },
                data: {
                    status: 'delivered',
                    deliveredAt: expect.any(Date)
                }
            });
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: {
                    entityType: 'DeliveryVerification',
                    entityId: 'verification-uuid-5678',
                    action: 'CREATE',
                    changes: JSON.stringify({
                        cardNumber: 'RFID-ABCD1234EFGH',
                        studentId: 'student-456',
                        schoolId: 'school-123',
                        orderId: 'order-456',
                        readerId: 'reader-456',
                        location: 'Main Library',
                        verifiedBy: 'teacher@school.com',
                        timestamp: expect.any(String)
                    }),
                    userId: 'teacher-123',
                    createdById: 'teacher-123',
                    metadata: JSON.stringify({
                        action: 'DELIVERY_VERIFIED',
                        timestamp: expect.any(String),
                        cardId: 'card-456'
                    })
                }
            });
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true,
                    cardId: 'card-456',
                    cardNumber: 'RFID-ABCD1234EFGH',
                    verificationId: 'verification-uuid-5678',
                    message: 'RFID card verified successfully',
                    student: expect.objectContaining({
                        id: 'student-456',
                        name: 'Jane Smith',
                        firstName: 'Jane',
                        lastName: 'Smith',
                        email: 'jane.smith@student.com',
                        role: 'student'
                    }),
                    school: expect.objectContaining({
                        id: 'school-123',
                        name: 'Secondary School',
                        code: 'SEC001'
                    }),
                    order: expect.objectContaining({
                        id: 'order-456',
                        orderNumber: 'ORD-2024-002',
                        status: 'delivered',
                        deliveryDate: expect.any(Date),
                        totalAmount: 150
                    }),
                    reader: expect.objectContaining({
                        id: 'reader-456',
                        name: 'Library Reader',
                        location: 'Main Library',
                        status: 'online'
                    })
                })
            });
        });
        it('should verify card without reader ID', async () => {
            const eventWithoutReader = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    orderId: 'order-456',
                    location: 'Main Library'
                })
            };
            await (0, verify_card_1.handler)(eventWithoutReader, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    readerId: null
                })
            });
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true,
                    reader: undefined
                })
            });
        });
        it('should verify card without order ID', async () => {
            const eventWithoutOrder = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    readerId: 'reader-456',
                    location: 'Main Library'
                })
            };
            await (0, verify_card_1.handler)(eventWithoutOrder, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    orderId: null
                })
            });
            expect(mockPrisma.order.update).not.toHaveBeenCalled();
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true,
                    order: undefined
                })
            });
        });
        it('should verify card with minimal data', async () => {
            const minimalEvent = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH'
                })
            };
            await (0, verify_card_1.handler)(minimalEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    readerId: null,
                    orderId: null,
                    metadata: JSON.stringify({
                        location: null,
                        verificationData: {}
                    })
                })
            });
        });
    });
    describe('Authentication and Authorization', () => {
        it('should reject unauthenticated requests', async () => {
            authenticateLambda.mockRejectedValue(new Error('Invalid token'));
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to verify RFID card');
        });
        it('should allow super_admin to verify anywhere', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'super_admin',
                schoolId: 'different-school'
            });
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalled();
        });
        it('should allow admin to verify anywhere', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'admin',
                schoolId: 'different-school'
            });
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalled();
        });
        it('should allow school_admin in same school', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'school_admin',
                schoolId: 'school-123'
            });
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalled();
        });
        it('should allow staff in same school', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'staff',
                schoolId: 'school-123'
            });
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalled();
        });
        it('should reject teacher from different school', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'teacher',
                schoolId: 'different-school-123'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to perform RFID verification', 403, 'UNAUTHORIZED');
        });
        it('should reject students attempting verification', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'student'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to perform RFID verification', 403, 'UNAUTHORIZED');
        });
        it('should reject parents attempting verification', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'parent'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to perform RFID verification', 403, 'UNAUTHORIZED');
        });
    });
    describe('Input Validation', () => {
        it('should reject missing request body', async () => {
            const eventWithoutBody = { ...validEvent, body: null };
            const result = await (0, verify_card_1.handler)(eventWithoutBody, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid JSON body', async () => {
            const eventWithInvalidJson = { ...validEvent, body: '{ invalid json' };
            const result = await (0, verify_card_1.handler)(eventWithInvalidJson, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to verify RFID card');
        });
        it('should reject missing cardNumber', async () => {
            const eventMissingCardNumber = {
                ...validEvent,
                body: JSON.stringify({
                    readerId: 'reader-456',
                    location: 'Main Library'
                })
            };
            const result = await (0, verify_card_1.handler)(eventMissingCardNumber, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid cardNumber format', async () => {
            const eventInvalidCardNumber = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'INVALID-FORMAT',
                    readerId: 'reader-456'
                })
            };
            const result = await (0, verify_card_1.handler)(eventInvalidCardNumber, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid readerId format', async () => {
            const eventInvalidReaderId = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    readerId: 'invalid-uuid-format'
                })
            };
            const result = await (0, verify_card_1.handler)(eventInvalidReaderId, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid orderId format', async () => {
            const eventInvalidOrderId = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    orderId: 'invalid-uuid-format'
                })
            };
            const result = await (0, verify_card_1.handler)(eventInvalidOrderId, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
    });
    describe('RFID Card Validation', () => {
        it('should reject non-existent card', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue(null);
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'RFID card not found'
                })
            });
        });
        it('should reject inactive card', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue({
                ...mockRFIDCard,
                isActive: false
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'RFID card is deactivated'
                })
            });
        });
        it('should reject expired card', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue({
                ...mockRFIDCard,
                expiresAt: new Date('2020-01-01T00:00:00Z')
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'RFID card has expired'
                })
            });
        });
        it('should reject card with inactive student', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue({
                ...mockRFIDCard,
                student: {
                    ...mockRFIDCard.student,
                    isActive: false
                }
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Student account is inactive'
                })
            });
        });
        it('should reject card with inactive school', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue({
                ...mockRFIDCard,
                school: {
                    ...mockRFIDCard.school,
                    isActive: false
                }
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'School is inactive'
                })
            });
        });
    });
    describe('RFID Reader Validation', () => {
        it('should reject non-existent reader when readerId provided', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue(null);
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'RFID reader not found'
                })
            });
        });
        it('should reject inactive reader', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue({
                ...mockRFIDReader,
                isActive: false
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'RFID reader is inactive'
                })
            });
        });
        it('should warn about offline reader but continue verification', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue({
                ...mockRFIDReader,
                status: 'offline'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true,
                    warnings: ['RFID reader belongs to a different school']
                })
            });
        });
        it('should add warning for reader from different school', async () => {
            mockPrisma.rFIDReader.findUnique.mockResolvedValue({
                ...mockRFIDReader,
                schoolId: 'different-school-456'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true,
                    warnings: ['RFID reader belongs to a different school']
                })
            });
        });
    });
    describe('Order Validation', () => {
        it('should reject non-existent order when orderId provided', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Order not found'
                })
            });
        });
        it('should reject order from different student', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                ...mockOrder,
                studentId: 'different-student-123'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Order does not belong to the specified student'
                })
            });
        });
        it('should reject order with invalid status', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                ...mockOrder,
                status: 'cancelled'
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Order cannot be delivered. Current status: cancelled'
                })
            });
        });
        it('should reject order not scheduled for today', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            mockPrisma.order.findUnique.mockResolvedValue({
                ...mockOrder,
                deliveryDate: tomorrow
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Order is not scheduled for delivery today'
                })
            });
        });
        it('should reject order from different school', async () => {
            mockPrisma.order.findUnique.mockResolvedValue({
                ...mockOrder,
                student: {
                    ...mockOrder.student,
                    schoolId: 'different-school-456'
                }
            });
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Order belongs to a different school'
                })
            });
        });
    });
    describe('Database Error Handling', () => {
        it('should handle card lookup database errors', async () => {
            mockPrisma.rFIDCard.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to verify RFID card');
        });
        it('should handle verification creation database errors', async () => {
            mockPrisma.deliveryVerification.create.mockRejectedValue(new Error('Verification creation failed'));
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification failed',
                data: expect.objectContaining({
                    success: false,
                    error: 'Verification creation failed'
                })
            });
        });
        it('should handle audit log creation failure gracefully', async () => {
            mockPrisma.auditLog.create.mockRejectedValue(new Error('Audit log failed'));
            const result = await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true
                })
            });
        });
        it('should ensure database disconnection on success', async () => {
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
        it('should ensure database disconnection on error', async () => {
            mockPrisma.rFIDCard.findUnique.mockRejectedValue(new Error('Database error'));
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
    });
    describe('Edge Cases', () => {
        it('should handle card without expiration date', async () => {
            mockPrisma.rFIDCard.findUnique.mockResolvedValue({
                ...mockRFIDCard,
                expiresAt: null
            });
            await (0, verify_card_1.handler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'Verification completed successfully',
                data: expect.objectContaining({
                    success: true
                })
            });
        });
        it('should handle verification data with special characters', async () => {
            const specialCharEvent = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    verificationData: {
                        notes: 'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?',
                        emoji: '📚🎓✏️'
                    }
                })
            };
            await (0, verify_card_1.handler)(specialCharEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: JSON.stringify({
                        location: null,
                        verificationData: {
                            notes: 'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?',
                            emoji: '📚🎓✏️'
                        }
                    })
                })
            });
        });
        it('should handle very long location strings', async () => {
            const longLocationEvent = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'RFID-ABCD1234EFGH',
                    location: 'A'.repeat(1000)
                })
            };
            await (0, verify_card_1.handler)(longLocationEvent, mockContext);
            expect(mockPrisma.deliveryVerification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: JSON.stringify({
                        location: 'A'.repeat(1000),
                        verificationData: {}
                    })
                })
            });
        });
    });
});
//# sourceMappingURL=verify-card.test.js.map