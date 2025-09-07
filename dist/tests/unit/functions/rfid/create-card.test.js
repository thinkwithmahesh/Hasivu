"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_card_1 = require("../../../../src/functions/rfid/create-card");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        rFIDCard: {
            findUnique: jest.fn(),
            create: jest.fn()
        },
        user: {
            findUnique: jest.fn()
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
    createErrorResponse: jest.fn((message, statusCode, errorCode) => ({
        statusCode,
        body: JSON.stringify({ error: message, errorCode })
    })),
    handleError: jest.fn((error, message) => ({
        statusCode: 500,
        body: JSON.stringify({ error: message })
    }))
}));
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-1234'
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../../src/shared/middleware/lambda-auth.middleware');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');
describe('RFID Create Card Lambda Function', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'rfid-create-card',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:rfid-create-card',
        memoryLimitInMB: '256',
        awsRequestId: 'test-request-id',
        logGroupName: '/aws/lambda/rfid-create-card',
        logStreamName: '2024/01/01/[1]abcdef123456',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockAuthenticatedUser = {
        id: 'user-123',
        email: 'admin@school.com',
        role: 'school_admin',
        schoolId: '550e8400-e29b-41d4-a716-446655440002'
    };
    const mockStudent = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@school.com',
        grade: '10th',
        section: 'A',
        schoolId: '550e8400-e29b-41d4-a716-446655440002',
        rfidCards: [],
        school: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Test School',
            code: 'TEST001',
            isActive: true
        }
    };
    const mockRFIDCard = {
        id: 'test-uuid-1234',
        cardNumber: 'RFID-TEST001-1234567890-ABCD',
        studentId: '550e8400-e29b-41d4-a716-446655440001',
        schoolId: '550e8400-e29b-41d4-a716-446655440002',
        isActive: true,
        issuedAt: new Date('2024-01-01T10:00:00Z'),
        expiresAt: new Date('2025-01-01T00:00:00Z'),
        metadata: JSON.stringify({ cardType: 'student', grade: '10th' }),
        student: mockStudent,
        school: mockStudent.school
    };
    const validEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
            studentId: '550e8400-e29b-41d4-a716-446655440001',
            expiresAt: '2025-01-01T00:00:00Z',
            metadata: { cardType: 'student', grade: '10th' }
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
        mockPrisma.user.findUnique.mockResolvedValue(mockStudent);
        mockPrisma.rFIDCard.findUnique.mockResolvedValue(null);
        mockPrisma.rFIDCard.create.mockResolvedValue(mockRFIDCard);
    });
    describe('Valid RFID Card Creation', () => {
        it('should create RFID card successfully with all validations', async () => {
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            console.log('Result:', result);
            expect(result.statusCode).toBe(200);
            expect(authenticateLambda).toHaveBeenCalledWith(validEvent);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: '550e8400-e29b-41d4-a716-446655440001' },
                include: {
                    school: {
                        select: { id: true, name: true, code: true, isActive: true }
                    },
                    rfidCards: { where: { isActive: true } }
                }
            });
            expect(mockPrisma.rFIDCard.findUnique).toHaveBeenCalledWith({
                where: { cardNumber: expect.any(String) }
            });
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalledWith({
                data: {
                    id: 'test-uuid-1234',
                    cardNumber: expect.any(String),
                    studentId: '550e8400-e29b-41d4-a716-446655440001',
                    schoolId: '550e8400-e29b-41d4-a716-446655440002',
                    isActive: true,
                    issuedAt: expect.any(Date),
                    expiresAt: new Date('2025-01-01T00:00:00Z'),
                    metadata: JSON.stringify({ cardType: 'student', grade: '10th' })
                },
                include: {
                    student: {
                        include: { school: true }
                    }
                }
            });
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'RFID card created successfully',
                data: expect.objectContaining({
                    id: 'test-uuid-1234',
                    cardNumber: expect.any(String),
                    studentId: '550e8400-e29b-41d4-a716-446655440001',
                    schoolId: '550e8400-e29b-41d4-a716-446655440002',
                    isActive: true
                })
            });
        });
        it('should create card without expiration date', async () => {
            const eventWithoutExpiry = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: '550e8400-e29b-41d4-a716-446655440001',
                    metadata: { cardType: 'student' }
                })
            };
            await (0, create_card_1.createRfidCardHandler)(eventWithoutExpiry, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    expiresAt: null
                }),
                include: expect.any(Object)
            });
        });
        it('should create card with minimal metadata', async () => {
            const eventMinimal = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: '550e8400-e29b-41d4-a716-446655440001'
                })
            };
            await (0, create_card_1.createRfidCardHandler)(eventMinimal, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: JSON.stringify({})
                }),
                include: expect.any(Object)
            });
        });
    });
    describe('HTTP Method Validation', () => {
        it('should reject non-POST requests', async () => {
            const getEvent = { ...validEvent, httpMethod: 'GET' };
            const result = await (0, create_card_1.createRfidCardHandler)(getEvent, mockContext);
            expect(result.statusCode).toBe(405);
            expect(createErrorResponse).toHaveBeenCalledWith('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
            expect(mockPrisma.rFIDCard.create).not.toHaveBeenCalled();
        });
        it('should reject PUT requests', async () => {
            const putEvent = { ...validEvent, httpMethod: 'PUT' };
            const result = await (0, create_card_1.createRfidCardHandler)(putEvent, mockContext);
            expect(result.statusCode).toBe(405);
        });
        it('should reject DELETE requests', async () => {
            const deleteEvent = { ...validEvent, httpMethod: 'DELETE' };
            const result = await (0, create_card_1.createRfidCardHandler)(deleteEvent, mockContext);
            expect(result.statusCode).toBe(405);
        });
    });
    describe('Authentication and Authorization', () => {
        it('should reject unauthenticated requests', async () => {
            authenticateLambda.mockRejectedValue(new Error('Invalid token'));
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create RFID card');
        });
        it('should reject users without school_admin or admin role', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'student'
            });
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to create RFID cards', 403, 'UNAUTHORIZED');
        });
        it('should reject cross-school card creation', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                schoolId: 'different-school-123'
            });
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Cannot create RFID card for student from different school', 403, 'UNAUTHORIZED');
        });
        it('should allow super_admin to create cards for any school', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'super_admin',
                schoolId: 'different-school-123'
            });
            await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalled();
        });
        it('should allow admin to create cards for any school', async () => {
            authenticateLambda.mockResolvedValue({
                ...mockAuthenticatedUser,
                role: 'admin',
                schoolId: 'different-school-123'
            });
            await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalled();
        });
    });
    describe('Input Validation', () => {
        it('should reject missing request body', async () => {
            const eventWithoutBody = { ...validEvent, body: null };
            const result = await (0, create_card_1.createRfidCardHandler)(eventWithoutBody, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid JSON body', async () => {
            const eventWithInvalidJson = { ...validEvent, body: '{ invalid json' };
            const result = await (0, create_card_1.createRfidCardHandler)(eventWithInvalidJson, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create RFID card');
        });
        it('should reject missing studentId', async () => {
            const eventMissingStudentId = {
                ...validEvent,
                body: JSON.stringify({
                    cardNumber: 'CARD123456789ABC'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventMissingStudentId, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject missing cardNumber', async () => {
            const eventMissingCardNumber = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventMissingCardNumber, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid studentId format', async () => {
            const eventInvalidStudentId = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: '',
                    cardNumber: 'CARD123456789ABC'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventInvalidStudentId, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid cardNumber format', async () => {
            const eventInvalidCardNumber = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: '123'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventInvalidCardNumber, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject invalid expiration date format', async () => {
            const eventInvalidExpiry = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: 'CARD123456789ABC',
                    expiresAt: 'invalid-date'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventInvalidExpiry, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should reject expiration date in the past', async () => {
            const eventPastExpiry = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: 'CARD123456789ABC',
                    expiresAt: '2020-01-01T00:00:00Z'
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(eventPastExpiry, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
    });
    describe('Business Logic Validation', () => {
        it('should reject non-existent student', async () => {
            mockPrisma.student.findUnique.mockResolvedValue(null);
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Student not found', 404, 'STUDENT_NOT_FOUND');
            expect(mockPrisma.rFIDCard.create).not.toHaveBeenCalled();
        });
        it('should reject duplicate card number', async () => {
            mockPrisma.rFIDCard.findFirst.mockResolvedValue({
                id: 'existing-card-123',
                cardNumber: 'CARD123456789ABC'
            });
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('RFID card number already exists', 409, 'CARD_NUMBER_EXISTS');
            expect(mockPrisma.rFIDCard.create).not.toHaveBeenCalled();
        });
        it('should reject student with existing active card', async () => {
            mockPrisma.rFIDCard.findFirst.mockResolvedValue({
                id: 'existing-card-123',
                studentId: 'student-123',
                isActive: true
            });
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Student already has an active RFID card', 409, 'STUDENT_HAS_ACTIVE_CARD');
            expect(mockPrisma.rFIDCard.create).not.toHaveBeenCalled();
        });
    });
    describe('Database Error Handling', () => {
        it('should handle student lookup database errors', async () => {
            mockPrisma.student.findUnique.mockRejectedValue(new Error('Database connection failed'));
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create RFID card');
        });
        it('should handle card creation database errors', async () => {
            mockPrisma.rFIDCard.create.mockRejectedValue(new Error('Card creation failed'));
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create RFID card');
        });
        it('should handle duplicate key database errors', async () => {
            mockPrisma.rFIDCard.create.mockRejectedValue(new Error('Unique constraint failed'));
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create RFID card');
        });
        it('should ensure database disconnection on success', async () => {
            await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
        it('should ensure database disconnection on error', async () => {
            mockPrisma.student.findUnique.mockRejectedValue(new Error('Database error'));
            await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
    });
    describe('Response Format Validation', () => {
        it('should return properly formatted success response', async () => {
            const result = await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'RFID card created successfully',
                data: expect.objectContaining({
                    id: expect.any(String),
                    cardNumber: expect.any(String),
                    studentId: expect.any(String),
                    schoolId: expect.any(String),
                    isActive: expect.any(Boolean),
                    student: expect.objectContaining({
                        id: expect.any(String),
                        firstName: expect.any(String),
                        lastName: expect.any(String)
                    }),
                    school: expect.objectContaining({
                        id: expect.any(String),
                        name: expect.any(String),
                        code: expect.any(String)
                    })
                })
            });
        });
        it('should include all required fields in response', async () => {
            await (0, create_card_1.createRfidCardHandler)(validEvent, mockContext);
            expect(createSuccessResponse).toHaveBeenCalledWith({
                message: 'RFID card created successfully',
                data: expect.objectContaining({
                    id: 'test-uuid-1234',
                    cardNumber: 'CARD123456789ABC',
                    studentId: 'student-123',
                    schoolId: 'school-123',
                    isActive: true,
                    issuedAt: expect.any(Date),
                    expiresAt: expect.any(Date),
                    metadata: expect.any(Object),
                    student: expect.objectContaining({
                        id: 'student-123',
                        firstName: 'John',
                        lastName: 'Doe'
                    }),
                    school: expect.objectContaining({
                        id: 'school-123',
                        name: 'Test School',
                        code: 'TEST001'
                    })
                })
            });
        });
    });
    describe('Edge Cases', () => {
        it('should handle extremely long card numbers', async () => {
            const longCardEvent = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: 'A'.repeat(50)
                })
            };
            const result = await (0, create_card_1.createRfidCardHandler)(longCardEvent, mockContext);
            expect(createErrorResponse).toHaveBeenCalledWith('Invalid request data', 400, 'VALIDATION_ERROR');
        });
        it('should handle special characters in metadata', async () => {
            const specialCharEvent = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: 'CARD123456789ABC',
                    metadata: {
                        description: 'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?',
                        emoji: '🎓📚✏️'
                    }
                })
            };
            await (0, create_card_1.createRfidCardHandler)(specialCharEvent, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: JSON.stringify({
                        description: 'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?',
                        emoji: '🎓📚✏️'
                    })
                }),
                include: expect.any(Object)
            });
        });
        it('should handle null metadata gracefully', async () => {
            const nullMetadataEvent = {
                ...validEvent,
                body: JSON.stringify({
                    studentId: 'student-123',
                    cardNumber: 'CARD123456789ABC',
                    metadata: null
                })
            };
            await (0, create_card_1.createRfidCardHandler)(nullMetadataEvent, mockContext);
            expect(mockPrisma.rFIDCard.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    metadata: JSON.stringify({})
                }),
                include: expect.any(Object)
            });
        });
    });
});
//# sourceMappingURL=create-card.test.js.map