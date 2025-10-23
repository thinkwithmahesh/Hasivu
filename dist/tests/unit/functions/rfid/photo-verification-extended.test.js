"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const photo_verification_1 = require("../../../../src/functions/rfid/photo-verification");
const client_1 = require("@prisma/client");
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        deliveryVerification: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        user: {
            findUnique: jest.fn()
        },
        school: {
            findUnique: jest.fn()
        },
        $transaction: jest.fn(),
        $disconnect: jest.fn()
    }))
}));
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({})),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn()
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn()
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
jest.mock('../../../../src/utils/secure-regex', () => ({
    secureRegex: {
        test: jest.fn()
    },
    SafeRegexPatterns: {
        dataUrl: /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/
    }
}));
jest.mock('uuid', () => ({
    v4: () => 'photo-test-uuid-1234'
}));
const mockPrisma = new client_1.PrismaClient();
const { authenticateLambda } = require('../../../../src/shared/middleware/lambda-auth.middleware');
const { createSuccessResponse, createErrorResponse, handleError } = require('../../../../src/shared/response.utils');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { secureRegex } = require('../../../../src/utils/secure-regex');
describe('Extended Photo Verification - Phase 2.1', () => {
    const mockContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'photo-verification-extended',
        functionVersion: '2.1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:photo-verification-extended',
        memoryLimitInMB: '256',
        awsRequestId: 'photo-test-request-id',
        logGroupName: '/aws/lambda/photo-verification-extended',
        logStreamName: '2024/01/01/[1]photo-extended',
        getRemainingTimeInMillis: () => 30000,
        done: jest.fn(),
        fail: jest.fn(),
        succeed: jest.fn()
    };
    const mockAuthenticatedUser = {
        id: 'user-photo-123',
        email: 'staff@photo-school.com',
        role: 'staff',
        schoolId: 'school-photo-456'
    };
    const mockDeliveryVerification = {
        id: 'verification-photo-789',
        verifiedAt: new Date('2024-01-15T10:30:00Z'),
        location: 'School Cafeteria',
        status: 'success',
        studentId: 'student-photo-101',
        orderId: 'order-photo-202',
        readerId: 'reader-photo-303',
        verificationData: JSON.stringify({}),
        student: {
            id: 'student-photo-101',
            firstName: 'Jamie',
            lastName: 'Photo',
            schoolId: 'school-photo-456'
        },
        order: {
            id: 'order-photo-202',
            orderNumber: 'ORD-PHOTO-001'
        },
        reader: {
            id: 'reader-photo-303',
            name: 'Cafeteria Reader',
            location: 'Main Cafeteria'
        }
    };
    const validBase64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
    beforeEach(() => {
        jest.clearAllMocks();
        authenticateLambda.mockResolvedValue({ user: mockAuthenticatedUser, userId: mockAuthenticatedUser.id });
        mockPrisma.deliveryVerification.findUnique.mockResolvedValue(mockDeliveryVerification);
        mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
        getSignedUrl.mockResolvedValue('https://s3-signed-url.example.com/photo.jpg');
        secureRegex.test.mockReturnValue({ isMatch: true, error: null });
    });
    describe('Phase 2.1 Enhanced Photo Upload and Verification', () => {
        it('should successfully process and store photo verification', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image,
                    photoMetadata: {
                        width: 800,
                        height: 600,
                        size: 150000,
                        type: 'image/jpeg',
                        timestamp: '2024-01-15T10:30:00Z',
                        location: {
                            latitude: 40.7128,
                            longitude: -74.0060
                        }
                    },
                    verificationNotes: 'Photo verification for lunch delivery'
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.success).toBe(true);
            expect(responseBody.photoId).toBe('photo-test-uuid-1234');
            expect(responseBody.photoUrl).toBe('https://s3-signed-url.example.com/photo.jpg');
            expect(responseBody.analysis.isValid).toBe(true);
        });
        it('should validate photo data format and size constraints', async () => {
            const oversizedImage = `data:image/jpeg;base64,${'x'.repeat(12 * 1024 * 1024)}`;
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: oversizedImage
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(400);
            expect(createErrorResponse).toHaveBeenCalledWith('VALIDATION_ERROR', 'Invalid photo data', 400, expect.any(Object));
        });
        it('should perform AI-powered photo analysis', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image,
                    photoMetadata: {
                        width: 1920,
                        height: 1080,
                        size: 500000,
                        type: 'image/jpeg'
                    }
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            const responseBody = JSON.parse(createSuccessResponse.mock.calls[0][0]);
            expect(responseBody.analysis).toBeDefined();
            expect(responseBody.analysis.confidence).toBeDefined();
            expect(responseBody.analysis.qualityScore).toBeDefined();
            expect(responseBody.analysis.isValid).toBeDefined();
        });
        it('should handle photo upload request with presigned URLs', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    contentType: 'image/jpeg',
                    fileSize: 500000
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification/upload-url',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, photo_verification_1.photoUploadRequestHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.photoId).toBe('photo-test-uuid-1234');
            expect(responseBody.data.uploadUrl).toBe('https://s3-signed-url.example.com/photo.jpg');
            expect(responseBody.data.expiresIn).toBe(300);
        });
        it('should retrieve photo verification details', async () => {
            mockPrisma.deliveryVerification.findUnique.mockResolvedValue({
                ...mockDeliveryVerification,
                deliveryPhoto: 'delivery-photos/verification-photo-789/photo-test-uuid-1234.jpeg',
                verificationData: JSON.stringify({
                    photoVerification: {
                        photoId: 'photo-test-uuid-1234',
                        s3Key: 'delivery-photos/verification-photo-789/photo-test-uuid-1234.jpeg',
                        metadata: { width: 800, height: 600 },
                        analysis: { confidence: 0.95, qualityScore: 0.9, isValid: true },
                        uploadedAt: '2024-01-15T10:30:00Z'
                    }
                })
            });
            const event = {
                httpMethod: 'GET',
                pathParameters: { verificationId: 'verification-photo-789' },
                headers: {
                    'authorization': 'Bearer valid-photo-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification/verification-photo-789',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                stageVariables: null,
                body: null
            };
            const result = await (0, photo_verification_1.getPhotoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.data.photoId).toBe('photo-test-uuid-1234');
            expect(responseBody.data.photoUrl).toBe('https://s3-signed-url.example.com/photo.jpg');
            expect(responseBody.data.analysis.isValid).toBe(true);
        });
    });
    describe('Phase 2.1 Security and Access Control', () => {
        it('should enforce proper authorization for photo operations', async () => {
            authenticateLambda.mockResolvedValue({
                user: { ...mockAuthenticatedUser, role: 'student' },
                userId: 'student-user-id'
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer student-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
        });
        it('should validate delivery verification ownership', async () => {
            mockPrisma.deliveryVerification.findUnique.mockResolvedValue({
                ...mockDeliveryVerification,
                student: {
                    ...mockDeliveryVerification.student,
                    schoolId: 'different-school-id'
                }
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(createErrorResponse).toHaveBeenCalledWith('Insufficient permissions to access this verification', 500);
        });
        it('should prevent access to non-existent verifications', async () => {
            mockPrisma.deliveryVerification.findUnique.mockResolvedValue(null);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'nonexistent-verification',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(createErrorResponse).toHaveBeenCalledWith('Delivery verification not found', 500);
        });
        it('should validate photo content types', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    contentType: 'image/gif',
                    fileSize: 500000
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
                pathParameters: {},
                queryStringParameters: {},
                multiValueQueryStringParameters: {},
                stageVariables: {},
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification/upload-url',
                isBase64Encoded: false,
                multiValueHeaders: {}
            };
            const result = await (0, photo_verification_1.photoUploadRequestHandler)(event, mockContext);
            expect(result.statusCode).toBe(400);
            expect(createErrorResponse).toHaveBeenCalledWith('VALIDATION_ERROR', 'Invalid request data', 400, expect.any(Array));
        });
    });
    describe('Phase 2.1 Error Handling and Recovery', () => {
        it('should handle S3 upload failures gracefully', async () => {
            const mockS3Client = {
                send: jest.fn().mockRejectedValue(new Error('S3 upload failed'))
            };
            require('@aws-sdk/client-s3').S3Client.mockImplementation(() => mockS3Client);
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to process photo verification');
        });
        it('should handle database transaction failures', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
        it('should handle invalid base64 photo data', async () => {
            secureRegex.test.mockReturnValue({ isMatch: false, error: 'Invalid format' });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: 'invalid-base64-data'
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(400);
            expect(createErrorResponse).toHaveBeenCalledWith('VALIDATION_ERROR', 'Invalid photo data', 400, expect.any(Object));
        });
        it('should handle presigned URL generation failures', async () => {
            getSignedUrl.mockRejectedValue(new Error('URL generation failed'));
            const event = {
                httpMethod: 'GET',
                pathParameters: { verificationId: 'verification-photo-789' },
                headers: {
                    'authorization': 'Bearer valid-photo-token'
                },
                requestContext: {},
                resource: '',
                path: '/rfid/photo-verification/verification-photo-789',
                isBase64Encoded: false,
                multiValueHeaders: {},
                multiValueQueryStringParameters: null,
                queryStringParameters: null,
                stageVariables: null,
                body: null
            };
            const result = await (0, photo_verification_1.getPhotoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalledWith(expect.any(Error), 'Failed to retrieve photo verification');
        });
    });
    describe('Phase 2.1 Performance and Scalability', () => {
        it('should handle concurrent photo verification requests', async () => {
            const event1 = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer token-1',
                    'content-type': 'application/json'
                },
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
            const event2 = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-790',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer token-2',
                    'content-type': 'application/json'
                },
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
            const [result1, result2] = await Promise.all([
                (0, photo_verification_1.photoVerificationHandler)(event1, mockContext),
                (0, photo_verification_1.photoVerificationHandler)(event2, mockContext)
            ]);
            expect(result1.statusCode).toBe(200);
            expect(result2.statusCode).toBe(200);
        });
        it('should optimize database queries for photo operations', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(mockPrisma.deliveryVerification.findUnique).toHaveBeenCalledWith({
                where: { id: 'verification-photo-789' },
                include: expect.objectContaining({
                    student: expect.any(Object),
                    order: expect.any(Object),
                    reader: expect.any(Object)
                })
            });
        });
        it('should implement proper timeout handling', async () => {
            jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
                setImmediate(callback);
                return {};
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const startTime = Date.now();
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            const duration = Date.now() - startTime;
            expect(result.statusCode).toBe(200);
            expect(duration).toBeLessThan(10000);
        });
        it('should handle large photo uploads efficiently', async () => {
            const largeValidImage = `data:image/jpeg;base64,${'x'.repeat(5 * 1024 * 1024)}`;
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: largeValidImage
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(200);
            const responseBody = JSON.parse(result.body);
            expect(responseBody.success).toBe(true);
        });
    });
    describe('Phase 2.1 Data Integrity and Consistency', () => {
        it('should maintain data consistency with database transactions', async () => {
            let transactionExecuted = false;
            mockPrisma.$transaction.mockImplementation(async (callback) => {
                transactionExecuted = true;
                return await callback(mockPrisma);
            });
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(transactionExecuted).toBe(true);
            expect(mockPrisma.deliveryVerification.update).toHaveBeenCalled();
        });
        it('should create comprehensive audit trails', async () => {
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
        it('should handle partial failures in multi-step operations', async () => {
            mockPrisma.deliveryVerification.update.mockRejectedValue(new Error('Database update failed'));
            const event = {
                httpMethod: 'POST',
                body: JSON.stringify({
                    verificationId: 'verification-photo-789',
                    photoData: validBase64Image
                }),
                headers: {
                    'authorization': 'Bearer valid-photo-token',
                    'content-type': 'application/json'
                },
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
            const result = await (0, photo_verification_1.photoVerificationHandler)(event, mockContext);
            expect(result.statusCode).toBe(500);
            expect(handleError).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=photo-verification-extended.test.js.map