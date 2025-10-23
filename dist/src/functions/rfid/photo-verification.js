"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhotoHandler = exports.uploadRequestHandler = exports.handler = exports.getPhotoVerificationHandler = exports.photoUploadRequestHandler = exports.photoVerificationHandler = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const secure_regex_1 = require("../../utils/secure-regex");
const Joi = __importStar(require("joi"));
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const photoVerificationSchema = Joi.object({
    verificationId: Joi.string().uuid().required(),
    photoData: Joi.string().required(),
    photoMetadata: Joi.object({
        width: Joi.number().optional(),
        height: Joi.number().optional(),
        size: Joi.number().optional(),
        type: Joi.string().optional(),
        timestamp: Joi.string().optional(),
        location: Joi.object({
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
        }).optional(),
    })
        .optional()
        .default({}),
    verificationNotes: Joi.string().max(500).optional(),
});
const photoUploadRequestSchema = Joi.object({
    verificationId: Joi.string().uuid().required(),
    contentType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required(),
    fileSize: Joi.number()
        .max(10 * 1024 * 1024)
        .required(),
});
async function validateDeliveryVerification(verificationId, user) {
    const verification = await prisma.deliveryVerification.findUnique({
        where: { id: verificationId },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    schoolId: true,
                    parentId: true,
                },
            },
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    userId: true,
                },
            },
            reader: {
                select: {
                    id: true,
                    name: true,
                    location: true,
                    schoolId: true,
                },
            },
        },
    });
    if (!verification) {
        throw new Error('Delivery verification not found');
    }
    const userRole = user.role;
    const userId = user.id;
    if (['super_admin', 'admin'].includes(userRole || '')) {
        return verification;
    }
    if (['school_admin', 'staff', 'teacher'].includes(userRole || '')) {
        if (verification.student.schoolId === user.schoolId || undefined) {
            return verification;
        }
    }
    if (userRole === 'parent') {
        if (verification.student.parentId === userId || verification.order?.userId === userId) {
            return verification;
        }
    }
    throw new Error('Insufficient permissions to access this verification');
}
function validatePhotoData(photoData) {
    try {
        if (photoData.length > 15000000) {
            return {
                isValid: false,
                buffer: Buffer.alloc(0),
                contentType: '',
                size: 0,
                error: 'Photo data too large. Maximum size is 10MB.',
            };
        }
        const testResult = secure_regex_1.secureRegex.test(secure_regex_1.SafeRegexPatterns.dataUrl, photoData);
        if (!testResult.isMatch) {
            return {
                isValid: false,
                buffer: Buffer.alloc(0),
                contentType: '',
                size: 0,
                error: testResult.error ||
                    'Invalid photo data format. Must be a base64 data URL with supported image type (jpeg, jpg, png, webp).',
            };
        }
        const dataUrlResult = photoData.match(secure_regex_1.SafeRegexPatterns.dataUrl);
        if (!dataUrlResult || !dataUrlResult[1] || !dataUrlResult[2]) {
            return {
                isValid: false,
                buffer: Buffer.alloc(0),
                contentType: '',
                size: 0,
                error: 'Invalid photo data format. Must be a base64 data URL with supported image type (jpeg, jpg, png, webp).',
            };
        }
        const mimeType = dataUrlResult[1];
        const base64Data = dataUrlResult[2];
        const contentType = `image/${mimeType}`;
        const buffer = Buffer.from(base64Data, 'base64');
        const size = buffer.length;
        const maxSize = 10 * 1024 * 1024;
        if (size > maxSize) {
            return {
                isValid: false,
                buffer: Buffer.alloc(0),
                contentType: '',
                size: 0,
                error: `Photo size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
            };
        }
        if (size < 1024) {
            return {
                isValid: false,
                buffer: Buffer.alloc(0),
                contentType: '',
                size: 0,
                error: 'Photo size too small. Minimum size is 1KB.',
            };
        }
        return {
            isValid: true,
            buffer,
            contentType,
            size,
        };
    }
    catch (error) {
        return {
            isValid: false,
            buffer: Buffer.alloc(0),
            contentType: '',
            size: 0,
            error: 'Failed to process photo data',
        };
    }
}
async function uploadPhotoToS3(photoBuffer, contentType, verificationId, photoId) {
    const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';
    const key = `delivery-photos/${verificationId}/${photoId}.${contentType.split('/')[1]}`;
    try {
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: photoBuffer,
            ContentType: contentType,
            Metadata: {
                verificationId,
                photoId,
                uploadedAt: new Date().toISOString(),
            },
            ServerSideEncryption: 'AES256',
        });
        await s3Client.send(uploadCommand);
        return key;
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to upload photo to S3', error instanceof Error ? error : new Error(String(error)), {
            verificationId,
            photoId,
            bucketName,
            key,
        });
        throw new Error('Failed to upload photo');
    }
}
async function generatePhotoUrl(s3Key) {
    try {
        const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: 3600,
        });
        return signedUrl;
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to generate photo URL', error instanceof Error ? error : new Error(String(error)), { s3Key });
        throw new Error('Failed to generate photo URL');
    }
}
async function analyzePhoto(photoBuffer) {
    const analysis = {
        confidence: 0.85,
        detectedObjects: ['food', 'plate', 'hand'],
        qualityScore: 0.9,
        isValid: true,
        issues: [],
    };
    const size = photoBuffer.length;
    if (size < 10 * 1024) {
        analysis.isValid = false;
        analysis.issues?.push('Photo appears to be corrupted or too small');
        analysis.qualityScore = 0.2;
    }
    if (size > 5 * 1024 * 1024) {
        analysis.issues?.push('Photo is very large, consider compressing for faster uploads');
        analysis.qualityScore -= 0.1;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return analysis;
}
async function savePhotoVerification(verificationId, photoId, s3Key, photoMetadata, verificationNotes, analysis) {
    try {
        await prisma.$transaction(async (tx) => {
            await tx.deliveryVerification.update({
                where: { id: verificationId },
                data: {
                    deliveryPhoto: s3Key,
                    verificationNotes,
                    verificationData: JSON.stringify({
                        ...JSON.parse((await tx.deliveryVerification.findUnique({
                            where: { id: verificationId },
                            select: { verificationData: true },
                        }))?.verificationData || '{}'),
                        photoVerification: {
                            photoId,
                            s3Key,
                            metadata: photoMetadata,
                            analysis,
                            uploadedAt: new Date().toISOString(),
                        },
                    }),
                    updatedAt: new Date(),
                },
            });
            logger_service_1.LoggerService.getInstance().info('Photo verification saved', {
                verificationId,
                photoId,
                s3Key,
                analysisValid: analysis.isValid,
                qualityScore: analysis.qualityScore,
            });
        });
    }
    catch (error) {
        logger_service_1.LoggerService.getInstance().error('Failed to save photo verification', error instanceof Error ? error : new Error(String(error)), {
            verificationId,
            photoId,
            s3Key,
        });
        throw new Error('Failed to save photo verification');
    }
}
const photoVerificationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const startTime = Date.now();
    try {
        logger.info('Photo verification request started', {
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
            path: event.path,
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        const requestBody = JSON.parse(event.body || '{}');
        const { error, value: photoData } = photoVerificationSchema.validate(requestBody);
        if (error) {
            logger.warn('Invalid photo verification request data', {
                requestId: context.awsRequestId,
                error: error.details,
            });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request data', 400, error.details);
        }
        const { verificationId, photoData: photoDataB64, photoMetadata, verificationNotes, } = photoData;
        const verification = await validateDeliveryVerification(verificationId, authenticatedUser);
        const photoValidation = validatePhotoData(photoDataB64);
        if (!photoValidation.isValid) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid photo data', 400, {
                error: photoValidation.error,
            });
        }
        const photoId = (0, uuid_1.v4)();
        const s3Key = await uploadPhotoToS3(photoValidation.buffer, photoValidation.contentType, verificationId, photoId);
        const analysis = await analyzePhoto(photoValidation.buffer);
        await savePhotoVerification(verificationId, photoId, s3Key, {
            ...photoMetadata,
            contentType: photoValidation.contentType,
            size: photoValidation.size,
            uploadedBy: authenticatedUser.id,
        }, verificationNotes, analysis);
        const photoUrl = await generatePhotoUrl(s3Key);
        const response = {
            success: true,
            photoId,
            photoUrl,
            verificationId,
            uploadedAt: new Date(),
            analysis,
            deliveryVerification: {
                id: verification.id,
                status: verification.status,
                studentName: `${verification.student.firstName} ${verification.student.lastName}`,
                orderNumber: verification.order?.orderNumber || 'N/A',
                location: verification.location || verification.reader?.location || 'Unknown',
                verifiedAt: verification.verifiedAt,
            },
        };
        const duration = Date.now() - startTime;
        logger.info('Photo verification completed successfully', {
            photoId,
            verificationId,
            s3Key,
            analysisValid: analysis.isValid,
            duration,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Photo verification uploaded successfully',
            data: response,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Photo verification failed', error instanceof Error ? error : new Error(String(error)), {
            duration,
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)), 'Failed to process photo verification');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.photoVerificationHandler = photoVerificationHandler;
const photoUploadRequestHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        logger.info('Photo upload request started', {
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
        });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        const requestBody = JSON.parse(event.body || '{}');
        const { error, value: uploadRequest } = photoUploadRequestSchema.validate(requestBody);
        if (error) {
            logger.warn('Invalid photo upload request data', {
                requestId: context.awsRequestId,
                error: error.details,
            });
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invalid request data', 400, error.details);
        }
        const { verificationId, contentType, fileSize } = uploadRequest;
        const verification = await validateDeliveryVerification(verificationId, authenticatedUser);
        const photoId = (0, uuid_1.v4)();
        const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';
        const key = `delivery-photos/${verificationId}/${photoId}.${contentType.split('/')[1]}`;
        const uploadCommand = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
            Metadata: {
                verificationId,
                photoId,
                uploadedBy: authenticatedUser.id || 'unknown',
                uploadedAt: new Date().toISOString(),
            },
            ServerSideEncryption: 'AES256',
        });
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, uploadCommand, {
            expiresIn: 300,
        });
        logger.info('Photo upload URL generated', {
            photoId,
            verificationId,
            contentType,
            fileSize,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Photo upload URL generated successfully',
            data: {
                photoId,
                uploadUrl: presignedUrl,
                expiresIn: 300,
                maxFileSize: 10 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                metadata: {
                    verificationId,
                    bucket: bucketName,
                    key,
                },
            },
        });
    }
    catch (error) {
        logger.error('Photo upload request failed', error instanceof Error ? error : new Error(String(error)), {
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)), 'Failed to generate photo upload URL');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.photoUploadRequestHandler = photoUploadRequestHandler;
const getPhotoVerificationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        logger.info('Get photo verification request started', {
            requestId: context.awsRequestId,
            httpMethod: event.httpMethod,
        });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!authResult.success || !authResult.user) {
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication failed', 401);
        }
        const authenticatedUser = authResult.user;
        const verificationId = event.pathParameters?.verificationId;
        if (!verificationId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Missing verification ID', 400, undefined);
        }
        const verification = await validateDeliveryVerification(verificationId, authenticatedUser);
        if (!verification.deliveryPhoto) {
            return (0, response_utils_1.createErrorResponse)('NOT_FOUND', 'No photo found for this verification', 404, undefined);
        }
        const photoUrl = await generatePhotoUrl(verification.deliveryPhoto);
        const verificationData = verification.verificationData || {};
        const photoVerification = verificationData.photoVerification || {};
        const response = {
            success: true,
            photoId: photoVerification.photoId,
            photoUrl,
            verificationId: verification.id,
            uploadedAt: photoVerification.uploadedAt,
            metadata: photoVerification.metadata,
            analysis: photoVerification.analysis,
            verificationNotes: verification.verificationNotes,
            deliveryVerification: {
                id: verification.id,
                status: verification.status,
                studentName: `${verification.student.firstName} ${verification.student.lastName}`,
                orderNumber: verification.order?.orderNumber || 'N/A',
                location: verification.location || verification.reader?.location || 'Unknown',
                verifiedAt: verification.verifiedAt,
            },
        };
        logger.info('Photo verification retrieved successfully', {
            verificationId,
            hasPhoto: !!verification.deliveryPhoto,
            photoId: photoVerification.photoId,
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Photo verification retrieved successfully',
            data: response,
        });
    }
    catch (error) {
        logger.error('Get photo verification failed', error instanceof Error ? error : new Error(String(error)), {
            requestId: context.awsRequestId,
        });
        return (0, response_utils_1.handleError)(error instanceof Error ? error : new Error(String(error)), 'Failed to retrieve photo verification');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.getPhotoVerificationHandler = getPhotoVerificationHandler;
exports.handler = exports.photoVerificationHandler;
exports.uploadRequestHandler = exports.photoUploadRequestHandler;
exports.getPhotoHandler = exports.getPhotoVerificationHandler;
//# sourceMappingURL=photo-verification.js.map