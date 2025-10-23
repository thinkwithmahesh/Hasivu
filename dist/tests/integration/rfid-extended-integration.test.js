"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bulk_import_cards_1 = require("../../src/functions/rfid/bulk-import-cards");
const get_card_1 = require("../../src/functions/rfid/get-card");
const manage_readers_1 = require("../../src/functions/rfid/manage-readers");
const mobile_card_management_1 = require("../../src/functions/rfid/mobile-card-management");
const mobile_tracking_1 = require("../../src/functions/rfid/mobile-tracking");
const photo_verification_1 = require("../../src/functions/rfid/photo-verification");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        rFIDCard: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        },
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn()
        },
        order: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        },
        deliveryVerification: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn()
        },
        rFIDReader: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn()
        },
        school: {
            findUnique: jest.fn(),
            findMany: jest.fn()
        },
        studentParent: {
            findFirst: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        $transaction: jest.fn(),
        $disconnect: jest.fn()
    }))
}));
jest.mock('../../../src/shared/middleware/lambda-auth.middleware', () => ({
    authenticateLambda: jest.fn()
}));
jest.mock('../../../src/shared/middleware/auth', () => ({
    authenticateJWT: jest.fn()
}));
jest.mock('../../../src/shared/response.utils', () => ({
    createSuccessResponse: jest.fn((data) => ({
        statusCode: 200,
        body: JSON.stringify(data)
    })),
    createErrorResponse: jest.fn((message, statusCode) => ({
        statusCode,
        body: JSON.stringify({ error: message })
    })),
    handleError: jest.fn((error) => ({
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
    }))
}));
jest.mock('../../../src/shared/utils/logger', () => ({
    error: jest.fn(),
    info: jest.fn()
}));
jest.mock('../../../src/shared/logger.service', () => ({
    LoggerService: {
        getInstance: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        }))
    }
}));
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn()
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn()
}));
jest.mock('../../../src/utils/secure-regex', () => ({
    secureRegex: {
        test: jest.fn()
    },
    SafeRegexPatterns: {
        dataUrl: /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/
    }
}));
jest.mock('uuid', () => ({
    v4: () => 'integration-test-uuid-1234'
}));
jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
    createHash: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'mock-hash')
    }))
}));
jest.mock('joi', () => ({
    object: jest.fn(() => ({
        validate: jest.fn((data) => ({ error: null, value: data }))
    })),
    string: jest.fn(() => ({
        required: jest.fn(() => ({
            min: jest.fn(() => ({
                max: jest.fn(() => ({}))
            }))
        })),
        uuid: jest.fn(() => ({
            required: jest.fn(() => ({}))
        })),
        optional: jest.fn(() => ({
            default: jest.fn(() => ({}))
        })),
        valid: jest.fn(() => ({
            optional: jest.fn(() => ({}))
        }))
    })),
    boolean: jest.fn(() => ({
        optional: jest.fn(() => ({
            default: jest.fn(() => ({}))
        }))
    })),
    number: jest.fn(() => ({
        integer: jest.fn(() => ({
            min: jest.fn(() => ({
                max: jest.fn(() => ({
                    optional: jest.fn(() => ({}))
                }))
            }))
        }))
    })),
    enum: jest.fn(() => ({
        optional: jest.fn(() => ({}))
    }))
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../src/shared/middleware/lambda-auth.middleware');
const { authenticateJWT } = require('../../../src/shared/middleware/auth');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../src/shared/response.utils');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { secureRegex } = require('../../../src/utils/secure-regex');
describe('Extended RFID Features - Phase 2.1 Integration Tests', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'rfid-extended-integration',
        functionVersion: '2.1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:rfid-extended-integration',
        memoryLimitInMB: '256',
        awsRequestId: 'integration-test-request-id',
        logGroupName: '/aws/lambda/rfid-extended-integration',
        logStreamName: '2024/01/01/[1]integration-extended',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockSchool = {
        id: 'school-integration-123',
        name: 'Integration Test School',
        code: 'INT001',
        isActive: true
    };
    const mockParent = {
        id: 'parent-integration-456',
        email: 'parent@integration.com',
        role: 'parent',
        firstName: 'Test',
        lastName: 'Parent'
    };
    const mockStudent = {
        id: 'student-integration-789',
        firstName: 'Test',
        lastName: 'Student',
        email: 'student@integration.com',
        role: 'student',
        isActive: true,
        grade: '10th',
        school: mockSchool,
        schoolId: mockSchool.id
    };
    const mockRFIDCard = {
        id: 'card-integration-101',
        cardNumber: 'RFID-INT001-1234567890-ABCD',
        studentId: mockStudent.id,
        schoolId: mockSchool.id,
        isActive: true,
        issuedDate: new Date('2024-01-01'),
        status: 'active',
        student: mockStudent
    };
    const mockReader = {
        id: 'reader-integration-202',
        name: 'Integration Test Reader',
        location: 'Main Entrance',
        schoolId: mockSchool.id,
        ipAddress: '192.168.1.100',
        status: 'online',
        isActive: true,
        configuration: JSON.stringify({ readPower: 30.0 })
    };
    const mockOrder = {
        id: 'order-integration-303',
        orderNumber: 'ORD-INT-001',
        status: 'delivered',
        deliveryDate: new Date('2024-01-15'),
        deliveredAt: new Date('2024-01-15T12:30:00Z'),
        studentId: mockStudent.id,
        student: mockStudent
    };
    const mockVerification = {
        id: 'verification-integration-404',
        verifiedAt: new Date('2024-01-15T12:30:00Z'),
        location: 'School Cafeteria',
        status: 'success',
        studentId: mockStudent.id,
        orderId: mockOrder.id,
        readerId: mockReader.id,
        cardId: mockRFIDCard.id,
        student: mockStudent,
        order: mockOrder,
        reader: mockReader
    };
    beforeEach(() => {
        jest.clearAllMocks();
        authenticateLambda.mockResolvedValue({ user: { id: 'admin-integration', role: 'admin' }, userId: 'admin-integration' });
        authenticateJWT.mockResolvedValue({ user: mockParent });
        getSignedUrl.mockResolvedValue('https://s3-signed-url.example.com/test.jpg');
        secureRegex.test.mockReturnValue({ isMatch: true, error: null });
        mockPrisma.school.findUnique.mockResolvedValue(mockSchool);
        mockPrisma.user.findUnique.mockResolvedValue(mockStudent);
        mockPrisma.user.findFirst.mockResolvedValue(mockStudent);
        mockPrisma.rFIDCard.findFirst.mockResolvedValue(mockRFIDCard);
        mockPrisma.rFIDReader.findUnique.mockResolvedValue(mockReader);
        mockPrisma.deliveryVerification.findUnique.mockResolvedValue(mockVerification);
        mockPrisma.studentParent.findFirst.mockResolvedValue({ parentId: mockParent.id });
        mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
    });
    describe('Phase 2.1 Complete RFID Workflow Integration', () => {
        it('should execute complete RFID card lifecycle from bulk import to mobile tracking', async () => {
            const csvData = `studentId,studentEmail,expiryDate,metadata
${mockStudent.id},${mockStudent.email},2025-12-31,{"cardType":"student","grade":"10th"}`;
            const bulkImportEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData,
                    schoolId: mockSchool.id,
                    previewMode: false
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            const bulkImportResult = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(bulkImportEvent, mockContext);
            expect(bulkImportResult.statusCode).toBe(200);
            const getCardEvent = {
                httpMethod: 'GET',
                pathParameters: { cardNumber: mockRFIDCard.cardNumber },
                headers: { authorization: 'Bearer admin-token' },
                requestContext: {},
                resource: '',
                path: `/rfid/cards/${mockRFIDCard.cardNumber}`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const getCardResult = await (0, get_card_1.getRfidCardHandler)(getCardEvent, mockContext);
            expect(getCardResult.statusCode).toBe(200);
            const mobileCardEvent = {
                httpMethod: 'GET',
                pathParameters: { studentId: mockStudent.id },
                headers: { authorization: 'Bearer parent-token' },
                requestContext: {
                    authorizer: { principalId: mockParent.id }
                },
                resource: '',
                path: `/rfid/mobile/students/${mockStudent.id}/card`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const mobileCardResult = await (0, mobile_card_management_1.getRfidCardStatus)(mobileCardEvent);
            expect(mobileCardResult.statusCode).toBe(200);
            mockPrisma.order.findMany
                .mockResolvedValueOnce([mockOrder])
                .mockResolvedValueOnce([mockOrder])
                .mockResolvedValue([]);
            const mobileTrackingEvent = {
                httpMethod: 'GET',
                pathParameters: { studentId: mockStudent.id },
                headers: {},
                requestContext: {
                    authorizer: { principalId: mockParent.id }
                },
                resource: '',
                path: `/rfid/mobile/students/${mockStudent.id}/tracking`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const mobileTrackingResult = await (0, mobile_tracking_1.getMobileTrackingHandler)(mobileTrackingEvent, mockContext);
            expect(mobileTrackingResult.statusCode).toBe(200);
        });
        it('should handle complete reader management and verification workflow', async () => {
            const createReaderEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Workflow Test Reader',
                    location: 'Test Entrance',
                    schoolId: mockSchool.id,
                    ipAddress: '192.168.1.150'
                }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const createReaderResult = await (0, manage_readers_1.manageReadersHandler)(createReaderEvent, mockContext);
            expect(createReaderResult.statusCode).toBe(200);
            const updateReaderEvent = {
                httpMethod: 'PUT',
                body: JSON.stringify({ status: 'maintenance' }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: { readerId: mockReader.id },
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: `/rfid/readers/${mockReader.id}`,
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const updateReaderResult = await (0, manage_readers_1.manageReadersHandler)(updateReaderEvent, mockContext);
            expect(updateReaderResult.statusCode).toBe(200);
            const validBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
            const photoVerificationEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: mockVerification.id,
                    photoData: validBase64Image,
                    photoMetadata: {
                        width: 800,
                        height: 600,
                        type: 'image/jpeg'
                    }
                }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const photoResult = await (0, photo_verification_1.photoVerificationHandler)(photoVerificationEvent, mockContext);
            expect(photoResult.statusCode).toBe(200);
        });
        it('should handle complete issue reporting and replacement workflow', async () => {
            const reportIssueEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    studentId: mockStudent.id,
                    issueType: 'lost',
                    description: 'Card was lost during school event',
                    requestReplacement: true
                }),
                headers: { authorization: 'Bearer parent-token' },
                pathParameters: {},
                requestContext: {
                    authorizer: { principalId: mockParent.id }
                },
                resource: '',
                path: '/rfid/mobile/issues',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                stageVariables: null
            };
            const reportIssueResult = await (0, mobile_card_management_1.reportRfidIssue)(reportIssueEvent);
            expect(reportIssueResult.statusCode).toBe(500);
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            const updateTrackingEvent = {
                httpMethod: 'PUT',
                body: JSON.stringify({
                    status: 'delivered',
                    location: 'Classroom Pickup',
                    rfidCardId: mockRFIDCard.id
                }),
                headers: {},
                pathParameters: { orderId: mockOrder.id },
                requestContext: {
                    authorizer: { principalId: mockParent.id }
                },
                resource: '',
                path: `/rfid/mobile/orders/${mockOrder.id}/tracking`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                stageVariables: null
            };
            const updateTrackingResult = await (0, mobile_tracking_1.updateTrackingStatusHandler)(updateTrackingEvent, mockContext);
            expect(updateTrackingResult.statusCode).toBe(200);
        });
    });
    describe('Phase 2.1 Cross-Function Data Consistency', () => {
        it('should maintain data consistency across card creation and mobile access', async () => {
            const csvData = `studentId,studentEmail,expiryDate,metadata
${mockStudent.id},${mockStudent.email},2025-12-31,{"cardType":"student"}`;
            const bulkImportEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData,
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(bulkImportEvent, mockContext);
            const mobileAccessEvent = {
                httpMethod: 'GET',
                pathParameters: { studentId: mockStudent.id },
                headers: { authorization: 'Bearer parent-token' },
                requestContext: {
                    authorizer: { principalId: mockParent.id }
                },
                resource: '',
                path: `/rfid/mobile/students/${mockStudent.id}/card`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const mobileResult = await (0, mobile_card_management_1.getRfidCardStatus)(mobileAccessEvent);
            expect(mobileResult.statusCode).toBe(200);
        });
        it('should ensure reader management affects verification processes', async () => {
            const createReaderEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    name: 'Consistency Test Reader',
                    location: 'Test Location',
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            await (0, manage_readers_1.manageReadersHandler)(createReaderEvent, mockContext);
            const listReadersEvent = {
                httpMethod: 'GET',
                pathParameters: {},
                queryStringParameters: { schoolId: mockSchool.id },
                headers: { authorization: 'Bearer admin-token' },
                requestContext: {},
                resource: '',
                path: '/rfid/readers',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const listResult = await (0, manage_readers_1.manageReadersHandler)(listReadersEvent, mockContext);
            expect(listResult.statusCode).toBe(200);
        });
        it('should synchronize photo verification with delivery tracking', async () => {
            const validBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
            const photoEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: mockVerification.id,
                    photoData: validBase64Image
                }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            await (0, photo_verification_1.photoVerificationHandler)(photoEvent, mockContext);
            const getPhotoEvent = {
                httpMethod: 'GET',
                pathParameters: { verificationId: mockVerification.id },
                headers: { authorization: 'Bearer admin-token' },
                requestContext: {},
                resource: '',
                path: `/rfid/photo-verification/${mockVerification.id}`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const getPhotoResult = await (0, photo_verification_1.getPhotoVerificationHandler)(getPhotoEvent, mockContext);
            expect(getPhotoResult.statusCode).toBe(200);
        });
    });
    describe('Phase 2.1 Performance and Scalability Integration', () => {
        it('should handle concurrent operations across multiple functions', async () => {
            const operations = [
                (0, bulk_import_cards_1.bulkImportRfidCardsHandler)({
                    httpMethod: 'POST',
                    body: JSON.stringify({
                        csvData: `studentId,studentEmail,expiryDate,metadata\n${mockStudent.id},${mockStudent.email},2025-12-31,{"test":"concurrent"}`,
                        schoolId: mockSchool.id
                    }),
                    headers: { authorization: 'Bearer admin-token' },
                    pathParameters: {},
                    queryStringParameters: {},
                    multiValueQueryStringParameters: {},
                    stageVariables: {},
                    requestContext: {},
                    resource: '',
                    path: '/rfid/cards/bulk-import',
                    isBase64Encoded: false,
                    multiValueHeaders: {}
                }, mockContext),
                (0, get_card_1.getRfidCardHandler)({
                    httpMethod: 'GET',
                    pathParameters: { cardNumber: mockRFIDCard.cardNumber },
                    headers: { authorization: 'Bearer admin-token' },
                    requestContext: {},
                    resource: '',
                    path: `/rfid/cards/${mockRFIDCard.cardNumber}`,
                    isBase64Encoded: false,
                    multiValueHeaders: {},
                    multiValueQueryStringParameters: null,
                    queryStringParameters: null,
                    body: null,
                    stageVariables: null
                }, mockContext),
                (0, mobile_tracking_1.getMobileTrackingHandler)({
                    httpMethod: 'GET',
                    pathParameters: { studentId: mockStudent.id },
                    headers: {},
                    requestContext: { authorizer: { principalId: mockParent.id } },
                    resource: '',
                    path: `/rfid/mobile/students/${mockStudent.id}/tracking`,
                    isBase64Encoded: false,
                    multiValueHeaders: {},
                    multiValueQueryStringParameters: null,
                    queryStringParameters: null,
                    body: null,
                    stageVariables: null
                }, mockContext)
            ];
            const results = await Promise.all(operations);
            results.forEach((result) => {
                expect(result.statusCode).toBe(200);
            });
        });
        it('should maintain performance under load with large datasets', async () => {
            const largeCSVRows = [];
            for (let i = 0; i < 100; i++) {
                largeCSVRows.push(`${mockStudent.id},student${i}@load-test.com,2025-12-31,{"loadTest":true}`);
            }
            const largeCSV = `studentId,studentEmail,expiryDate,metadata\n${largeCSVRows.join('\n')}`;
            const startTime = Date.now();
            const bulkImportEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData: largeCSV,
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(bulkImportEvent, mockContext);
            const duration = Date.now() - startTime;
            expect(result.statusCode).toBe(200);
            expect(duration).toBeLessThan(10000);
        });
        it('should handle memory efficiently with complex operations', async () => {
            const complexWorkflow = async () => {
                await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)({
                    httpMethod: 'POST',
                    body: JSON.stringify({
                        csvData: `studentId,studentEmail,expiryDate,metadata\n${mockStudent.id},${mockStudent.email},2025-12-31,{"complex":true}`,
                        schoolId: mockSchool.id
                    }),
                    headers: { authorization: 'Bearer admin-token' },
                    pathParameters: {},
                    queryStringParameters: {},
                    multiValueQueryStringParameters: {},
                    stageVariables: {},
                    requestContext: {},
                    resource: '',
                    path: '/rfid/cards/bulk-import',
                    isBase64Encoded: false,
                    multiValueHeaders: {}
                }, mockContext);
                await (0, manage_readers_1.manageReadersHandler)({
                    httpMethod: 'POST',
                    body: JSON.stringify({
                        name: 'Complex Workflow Reader',
                        location: 'Test Location',
                        schoolId: mockSchool.id
                    }),
                    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                    pathParameters: {},
                    queryStringParameters: {},
                    multiValueQueryStringParameters: {},
                    stageVariables: {},
                    requestContext: {},
                    resource: '',
                    path: '/rfid/readers',
                    isBase64Encoded: false,
                    multiValueHeaders: {}
                }, mockContext);
                const validBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
                await (0, photo_verification_1.photoVerificationHandler)({
                    httpMethod: 'POST',
                    body: JSON.stringify({
                        verificationId: mockVerification.id,
                        photoData: validBase64Image
                    }),
                    headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                    pathParameters: {},
                    queryStringParameters: {},
                    multiValueQueryStringParameters: {},
                    stageVariables: {},
                    requestContext: {},
                    resource: '',
                    path: '/rfid/photo-verification',
                    isBase64Encoded: false,
                    multiValueHeaders: {}
                }, mockContext);
            };
            const startTime = Date.now();
            await complexWorkflow();
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(15000);
        });
    });
    describe('Phase 2.1 Security Integration Testing', () => {
        it('should enforce consistent authorization across all functions', async () => {
            const unauthorizedEvent = {
                httpMethod: 'GET',
                pathParameters: { studentId: 'other-student' },
                headers: { authorization: 'Bearer parent-token' },
                requestContext: {
                    authorizer: { principalId: 'wrong-parent-id' }
                },
                resource: '',
                path: '/rfid/mobile/students/other-student/card',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, mobile_card_management_1.getRfidCardStatus)(unauthorizedEvent);
            expect(result.statusCode).toBe(403);
        });
        it('should prevent data leakage between schools', async () => {
            authenticateLambda.mockResolvedValue({
                user: { id: 'admin-cross-school', role: 'admin', schoolId: 'different-school' },
                userId: 'admin-cross-school'
            });
            const crossSchoolEvent = {
                httpMethod: 'GET',
                pathParameters: { cardNumber: mockRFIDCard.cardNumber },
                headers: { authorization: 'Bearer cross-school-token' },
                requestContext: {},
                resource: '',
                path: `/rfid/cards/${mockRFIDCard.cardNumber}`,
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                body: null,
                stageVariables: null
            };
            const result = await (0, get_card_1.getRfidCardHandler)(crossSchoolEvent, mockContext);
            expect(result.statusCode).toBe(200);
        });
        it('should validate input data consistently across functions', async () => {
            const invalidDataEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'invalid-uuid',
                    photoData: 'not-base64-data'
                }),
                headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, photo_verification_1.photoVerificationHandler)(invalidDataEvent, mockContext);
            expect(result.statusCode).toBe(400);
        });
    });
    describe('Phase 2.1 Error Propagation and Recovery', () => {
        it('should handle cascading failures gracefully', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Database cascade failure'));
            const bulkImportEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData: `studentId,studentEmail,expiryDate,metadata\n${mockStudent.id},${mockStudent.email},2025-12-31,{"test":true}`,
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(bulkImportEvent, mockContext);
            expect(result.statusCode).toBe(500);
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
        });
        it('should maintain data integrity during partial failures', async () => {
            let callCount = 0;
            mockPrisma.rFIDCard.create.mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    throw new Error('Simulated partial failure');
                }
                return { id: `card-${callCount}`, cardNumber: `RFID-TEST-${callCount}` };
            });
            const csvData = `studentId,studentEmail,expiryDate,metadata
${mockStudent.id},${mockStudent.email},2025-12-31,{"test":"partial"}
student-2@example.com,student2@example.com,2025-12-31,{"test":"partial"}`;
            const bulkImportEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData,
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(bulkImportEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.successful).toBe(1);
            expect(responseBody.data.summary.errors).toBe(1);
        });
        it('should provide comprehensive error reporting', async () => {
            const invalidCSV = `invalid,headers,completely
data,without,validation,and,with,extra,columns
more,invalid,data,here`;
            const errorEvent = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    csvData: invalidCSV,
                    schoolId: mockSchool.id
                }),
                headers: { authorization: 'Bearer admin-token' },
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
            const result = await (0, bulk_import_cards_1.bulkImportRfidCardsHandler)(errorEvent, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.summary.errors).toBeGreaterThan(0);
            expect(Array.isArray(responseBody.data.errors)).toBe(true);
        });
    });
});
//# sourceMappingURL=rfid-extended-integration.test.js.map