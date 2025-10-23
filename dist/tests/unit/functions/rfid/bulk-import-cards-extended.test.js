"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bulk_import_cards_1 = require("../../../../src/functions/rfid/bulk-import-cards");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        rFIDCard: {
            findUnique: jest.fn(),
            create: jest.fn(),
            count: jest.fn()
        },
        user: {
            findMany: jest.fn(),
            count: jest.fn()
        },
        school: {
            findUnique: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        $transaction: jest.fn(),
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
    createErrorResponse: jest.fn((message, statusCode) => ({
        statusCode,
        body: JSON.stringify({ error: message })
    })),
    handleError: jest.fn((error, message) => ({
        statusCode: 500,
        body: JSON.stringify({ error: message })
    }))
}));
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-1234'
}));
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
    createHash: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'mock-hash')
    }))
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../../src/shared/middleware/lambda-auth.middleware');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');
describe('Extended Bulk Import RFID Cards Lambda Function - Phase 2.1', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'rfid-bulk-import-extended',
        functionVersion: '2.1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:rfid-bulk-import-extended',
        memoryLimitInMB: '256',
        awsRequestId: 'test-request-id-extended',
        logGroupName: '/aws/lambda/rfid-bulk-import-extended',
        logStreamName: '2024/01/01/[1]abcdef123456-extended',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockAuthenticatedUser = {
        id: 'user-123-extended',
        email: 'admin@school-extended.com',
        role: 'school_admin',
        schoolId: '550e8400-e29b-41d4-a716-446655440003'
    };
    const mockSchool = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Extended Test School',
        code: 'EXT001',
        isActive: true
    };
    const mockStudents = [
        {
            id: '550e8400-e29b-41d4-a716-446655440004',
            email: 'john.doe@extended-school.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student',
            isActive: true,
            grade: '10th',
            rfidCards: []
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440005',
            email: 'jane.smith@extended-school.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'student',
            isActive: true,
            grade: '9th',
            rfidCards: []
        }
    ];
    const validCSVData = `studentId,studentEmail,expiryDate,metadata
550e8400-e29b-41d4-a716-446655440004,john.doe@extended-school.com,2025-12-31,{"cardType":"student","grade":"10th"}
550e8400-e29b-41d4-a716-446655440005,jane.smith@extended-school.com,2025-12-31,{"cardType":"student","grade":"9th"}`;
    const validEvent = {
        httpMethod: 'POST',
        body: JSON.stringify({
            csvData: validCSVData,
            schoolId: '550e8400-e29b-41d4-a716-446655440003',
            previewMode: false,
            skipDuplicates: true,
            updateExisting: false,
            cardType: 'standard',
            expiryDays: 365
        }),
        headers: {
            'authorization': 'Bearer valid-extended-token',
            'content-type': 'application/json'
        },
        pathParameters: {},
        queryStringParameters: {},
        multiValueQueryStringParameters: {},
        stageVariables: {},
        requestContext: {},
        resource: '',
        path: '/rfid/cards/bulk-import',
        isBase64Encoded: false,
        multiValueHeaders: {}
    };
    beforeEach(() => {
        jest.clearAllMocks();
        authenticateLambda.mockResolvedValue({ user: mockAuthenticatedUser, userId: mockAuthenticatedUser.id });
        mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
        mockPrisma.user.findMany.mockResolvedValue(mockStudents);
        mockPrisma.rFIDCard.findUnique.mockResolvedValue(null);
        mockPrisma.rFIDCard.create.mockResolvedValue({
            id: 'test-card-id',
            cardNumber: 'RFID-EXT001-1234567890-ABCD',
            studentId: '550e8400-e29b-41d4-a716-446655440004',
            schoolId: '550e8400-e29b-41d4-a716-446655440003',
            isActive: true,
            issuedAt: new Date(),
            expiresAt: new Date('2025-12-31'),
            metadata: JSON.stringify({ cardType: 'student', grade: '10th' })
        });
        mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id' });
        mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
    });
    describe('Phase 2.1 Enhanced Bulk Import Features', () => {
        it('should successfully import cards with enhanced validation and transaction processing', async () => {
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.message).toBe('Bulk RFID card import completed successfully');
            expect(responseBody.data.summary.successful).toBe(2);
            expect(responseBody.data.summary.errors).toBe(0);
            expect(authenticateLambda).toHaveBeenCalledWith(validEvent);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
        it('should handle preview mode with detailed validation results', async () => {
            const previewEvent = {
                ...validEvent,
                body: JSON.stringify({
                    ...JSON.parse(validEvent.body),
                    previewMode: true
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(previewEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.previewMode).toBe(true);
            expect(responseBody.data.summary.validCards).toBe(2);
            expect(mockPrisma.rFIDCard.create).not.toHaveBeenCalled();
        });
        it('should validate CSV data format and content thoroughly', async () => {
            const invalidCSVEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: 'invalid,csv,data\nwithout,proper,headers',
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(invalidCSVEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.errors).toBeGreaterThan(0);
        });
        it('should handle large CSV files with proper batching', async () => {
            const largeCSVRows = [];
            for (let i = 0; i < 150; i++) {
                largeCSVRows.push(`550e8400-e29b-41d4-a716-44665544000${i % 2 + 4},student${i}@extended-school.com,2025-12-31,{"cardType":"student"}`);
            }
            const largeCSVData = `studentId,studentEmail,expiryDate,metadata\n${largeCSVRows.join('\n')}`;
            const largeEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: largeCSVData,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const largeMockStudents = [];
            for (let i = 0; i < 150; i++) {
                largeMockStudents.push({
                    id: `550e8400-e29b-41d4-a716-44665544000${i % 2 + 4}`,
                    email: `student${i}@extended-school.com`,
                    firstName: `Student${i}`,
                    lastName: 'Test',
                    role: 'student',
                    isActive: true,
                    rfidCards: []
                });
            }
            mockPrisma.user.findMany.mockResolvedValue(largeMockStudents);
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(largeEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
        it('should enforce proper authorization for bulk import operations', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, role: 'student' },
                userId: 'student-user-id'
            });
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(403);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to perform bulk RFID card import for this school', 403);
        });
        it('should handle database transaction failures gracefully', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should validate file size limits', async () => {
            const largeCSV = 'x'.repeat(11 * 1024 * 1024);
            const largeFileEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: largeCSV,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(largeFileEvent, mockContext);
            expect(result.statusCode).toBe(400);
            expect(createErrorResponse).toHaveBeenCalledWith('CSV data too large. Maximum size: 10MB', 400);
        });
        it('should handle duplicate student entries in CSV', async () => {
            const duplicateCSV = `studentId,studentEmail,expiryDate,metadata
550e8400-e29b-41d4-a716-446655440004,john.doe@extended-school.com,2025-12-31,{"cardType":"student"}
550e8400-e29b-41d4-a716-446655440004,john.doe@extended-school.com,2025-12-31,{"cardType":"student"}`;
            const duplicateEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: duplicateCSV,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(duplicateEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.successful).toBe(1);
            expect(responseBody.data.summary.errors).toBe(1);
        });
        it('should create comprehensive audit logs for bulk operations', async () => {
            await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    entityType: 'RFIDCard',
                    action: 'CREATE',
                    userId: mockAuthenticatedUser.id,
                    createdById: mockAuthenticatedUser.id,
                    metadata: expect.stringContaining('BULK_RFID_CARD_CREATED')
                })
            });
        });
        it('should handle mixed success and failure scenarios', async () => {
            const mixedStudents = [
                mockStudents[0],
                { ...mockStudents[1], isActive: false }
            ];
            mockPrisma.user.findMany.mockResolvedValue(mixedStudents);
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.successful).toBe(1);
            expect(responseBody.data.summary.errors).toBe(1);
        });
        it('should validate school existence and active status', async () => {
            mockPrisma.school.findUnique.mockResolvedValue(null);
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(createErrorResponse).toHaveBeenCalledWith('School not found', 500);
        });
        it('should handle card number collision resolution', async () => {
            let callCount = 0;
            mockPrisma.rFIDCard.findUnique.mockImplementation(() => {
                callCount++;
                return callCount === 1 ? { cardNumber: 'RFID-EXT001-1234567890-ABCD' } : null;
            });
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(mockPrisma.rFIDCard.findUnique).toHaveBeenCalledTimes(2);
        });
        it('should process cards in optimal batch sizes for performance', async () => {
            const batchStudents = [];
            for (let i = 0; i < 60; i++) {
                batchStudents.push({
                    id: `student-${i}`,
                    email: `student${i}@batch-test.com`,
                    firstName: `Student${i}`,
                    lastName: 'Batch',
                    role: 'student',
                    isActive: true,
                    rfidCards: []
                });
            }
            const batchCSVRows = batchStudents.map(student => `${student.id},${student.email},2025-12-31,{"cardType":"student"}`);
            const batchCSV = `studentId,studentEmail,expiryDate,metadata\n${batchCSVRows.join('\n')}`;
            const batchEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: batchCSV,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            mockPrisma.user.findMany.mockResolvedValue(batchStudents);
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(batchEvent, mockContext);
            expect(result.statusCode).toBe(200);
            expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
        });
    });
    describe('Phase 2.1 Security Enhancements', () => {
        it('should validate authentication thoroughly', async () => {
            authenticateLambda.mockRejectedValue(new Error('Invalid token'));
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should prevent cross-school data access', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, schoolId: 'different-school-id' },
                userId: 'different-user-id'
            });
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(403);
        });
        it('should handle malformed JSON input securely', async () => {
            const malformedEvent = {
                ...validEvent,
                body: '{ invalid json'
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(malformedEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should validate CSV content for malicious data', async () => {
            const maliciousCSV = `studentId,studentEmail,expiryDate,metadata
malicious-id,<script>alert('xss')</script>,2025-12-31,{"malicious":"data"}`;
            const maliciousEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: maliciousCSV,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(maliciousEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.errors).toBeGreaterThan(0);
        });
    });
    describe('Phase 2.1 Error Handling and Recovery', () => {
        it('should provide detailed error reporting', async () => {
            const invalidCSV = `invalid,headers,here
data,without,validation`;
            const errorEvent = {
                ...validEvent,
                body: JSON.stringify({
                    csvData: invalidCSV,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003'
                })
            };
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(errorEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.errors).toBeDefined();
            expect(Array.isArray(responseBody.data.errors)).toBe(true);
        });
        it('should handle partial failures gracefully', async () => {
            let createCallCount = 0;
            mockPrisma.rFIDCard.create.mockImplementation(() => {
                createCallCount++;
                if (createCallCount % 2 === 0) {
                    throw new Error('Simulated database error');
                }
                return {
                    id: `card-${createCallCount}`,
                    cardNumber: `RFID-EXT001-${createCallCount}`,
                    studentId: `student-${createCallCount}`,
                    schoolId: '550e8400-e29b-41d4-a716-446655440003',
                    isActive: true,
                    issuedAt: new Date(),
                    expiresAt: new Date('2025-12-31'),
                    metadata: JSON.stringify({})
                };
            });
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.successful).toBe(1);
            expect(responseBody.data.summary.errors).toBe(1);
        });
        it('should ensure database cleanup on errors', async () => {
            mockPrisma.rFIDCard.create.mockRejectedValue(new Error('Database failure'));
            await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
    });
    describe('Phase 2.1 Performance and Scalability', () => {
        it('should handle concurrent bulk import requests', async () => {
            const promises = [
                (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext),
                (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext),
                (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext)
            ];
            const results = await Promise.all(promises);
            results.forEach(result => {
                expect(result.statusCode).toBe(200);
            });
        });
        it('should optimize database queries for large datasets', async () => {
            await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    schoolId: '550e8400-e29b-41d4-a716-446655440003',
                    role: 'student',
                    isActive: true
                },
                include: expect.any(Object)
            });
        });
        it('should implement proper timeout handling', async () => {
            mockPrisma.user.findMany.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockStudents), 100)));
            const startTime = Date.now();
            await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(validEvent, mockContext);
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(5000);
        });
    });
});
//# sourceMappingURL=bulk-import-cards-extended.test.js.map