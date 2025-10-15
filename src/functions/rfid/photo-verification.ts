/**
 * HASIVU Platform - Photo Verification Lambda Function
 * Optional photo verification for RFID deliveries
 * Story 2.3: Real-time Delivery Verification
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LoggerService } from '../shared/logger.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import {
  authenticateLambda,
  AuthenticatedUser,
  AuthenticatedEvent,
} from '../../shared/middleware/lambda-auth.middleware';
import { secureRegex, SafeRegexPatterns } from '../../utils/secure-regex';
import * as Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

// Initialize database client and AWS services
const prisma = new PrismaClient();
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

/**
 * Photo verification request schema
 */
const photoVerificationSchema = Joi.object({
  verificationId: Joi.string().uuid().required(),
  photoData: Joi.string().required(), // Base64 encoded image
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

/**
 * Photo upload request schema
 */
const photoUploadRequestSchema = Joi.object({
  verificationId: Joi.string().uuid().required(),
  contentType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required(),
  fileSize: Joi.number()
    .max(10 * 1024 * 1024)
    .required(), // Max 10MB
});

/**
 * Photo verification request interface
 */
interface PhotoVerificationRequest {
  verificationId: string;
  photoData: string;
  photoMetadata?: {
    width?: number;
    height?: number;
    size?: number;
    type?: string;
    timestamp?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
  };
  verificationNotes?: string;
}

/**
 * Photo upload request interface
 */
interface PhotoUploadRequest {
  verificationId: string;
  contentType: string;
  fileSize: number;
}

/**
 * Photo verification response interface
 */
interface PhotoVerificationResponse {
  success: boolean;
  photoId: string;
  photoUrl: string;
  verificationId: string;
  uploadedAt: Date;
  analysis?: {
    confidence: number;
    detectedObjects: string[];
    qualityScore: number;
    isValid: boolean;
    issues?: string[];
  };
  deliveryVerification: {
    id: string;
    status: string;
    studentName: string;
    orderNumber: string;
    location: string;
    verifiedAt: Date;
  };
}

/**
 * Validate delivery verification exists and is accessible
 */
async function validateDeliveryVerification(
  verificationId: string,
  user: AuthenticatedUser
): Promise<any> {
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

  // Authorization check
  const userRole = user.role;
  const userId = user.id;

  // Super admin and admin can access all verifications
  if (['super_admin', 'admin'].includes(userRole || '')) {
    return verification;
  }

  // School admin and staff can access verifications in their school
  if (['school_admin', 'staff', 'teacher'].includes(userRole || '')) {
    if (verification.student.schoolId === user.schoolId || undefined) {
      return verification;
    }
  }

  // Parents can access their children's verifications
  if (userRole === 'parent') {
    if (verification.student.parentId === userId || verification.order?.userId === userId) {
      return verification;
    }
  }

  throw new Error('Insufficient permissions to access this verification');
}

/**
 * Validate and process photo data
 */
function validatePhotoData(photoData: string): {
  isValid: boolean;
  buffer: Buffer;
  contentType: string;
  size: number;
  error?: string;
} {
  try {
    // Input length validation (prevent ReDoS on large inputs)
    if (photoData.length > 15000000) {
      // ~11MB base64 encoded (after overhead)
      return {
        isValid: false,
        buffer: Buffer.alloc(0),
        contentType: '',
        size: 0,
        error: 'Photo data too large. Maximum size is 10MB.',
      };
    }

    // Use secure regex to prevent ReDoS attacks
    const testResult = secureRegex.test(SafeRegexPatterns.dataUrl, photoData);

    if (!testResult.isMatch) {
      return {
        isValid: false,
        buffer: Buffer.alloc(0),
        contentType: '',
        size: 0,
        error:
          testResult.error ||
          'Invalid photo data format. Must be a base64 data URL with supported image type (jpeg, jpg, png, webp).',
      };
    }

    // Extract content type and base64 data using native match (after security validation)
    const dataUrlResult = photoData.match(SafeRegexPatterns.dataUrl);
    if (!dataUrlResult || !dataUrlResult[1] || !dataUrlResult[2]) {
      return {
        isValid: false,
        buffer: Buffer.alloc(0),
        contentType: '',
        size: 0,
        error:
          'Invalid photo data format. Must be a base64 data URL with supported image type (jpeg, jpg, png, webp).',
      };
    }

    const mimeType = dataUrlResult[1];
    const base64Data = dataUrlResult[2];
    const contentType = `image/${mimeType}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const size = buffer.length;

    // Validate file size (max 10MB)
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

    // Validate minimum size (1KB)
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
  } catch (error: unknown) {
    return {
      isValid: false,
      buffer: Buffer.alloc(0),
      contentType: '',
      size: 0,
      error: 'Failed to process photo data',
    };
  }
}

/**
 * Upload photo to S3
 */
async function uploadPhotoToS3(
  photoBuffer: Buffer,
  contentType: string,
  verificationId: string,
  photoId: string
): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';
  const key = `delivery-photos/${verificationId}/${photoId}.${contentType.split('/')[1]}`;

  try {
    const uploadCommand = new PutObjectCommand({
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
  } catch (error: unknown) {
    LoggerService.getInstance().error(
      'Failed to upload photo to S3',
      error instanceof Error ? error : new Error(String(error)),
      {
        verificationId,
        photoId,
        bucketName,
        key,
      }
    );
    throw new Error('Failed to upload photo');
  }
}

/**
 * Generate signed URL for photo access
 */
async function generatePhotoUrl(s3Key: string): Promise<string> {
  try {
    const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  } catch (error: unknown) {
    LoggerService.getInstance().error(
      'Failed to generate photo URL',
      error instanceof Error ? error : new Error(String(error)),
      { s3Key }
    );
    throw new Error('Failed to generate photo URL');
  }
}

/**
 * Analyze photo for quality and content validation
 */
async function analyzePhoto(photoBuffer: Buffer): Promise<{
  confidence: number;
  detectedObjects: string[];
  qualityScore: number;
  isValid: boolean;
  issues?: string[];
}> {
  // This is a simplified implementation
  // In production, you would integrate with AWS Rekognition or similar service

  const analysis = {
    confidence: 0.85,
    detectedObjects: ['food', 'plate', 'hand'],
    qualityScore: 0.9,
    isValid: true,
    issues: [] as string[],
  };

  // Basic validation checks
  const size = photoBuffer.length;

  // Check if photo is too small (likely corrupted)
  if (size < 10 * 1024) {
    analysis.isValid = false;
    analysis.issues?.push('Photo appears to be corrupted or too small');
    analysis.qualityScore = 0.2;
  }

  // Check if photo is extremely large (might be raw/uncompressed)
  if (size > 5 * 1024 * 1024) {
    analysis.issues?.push('Photo is very large, consider compressing for faster uploads');
    analysis.qualityScore -= 0.1;
  }

  // Simulate AI analysis delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return analysis;
}

/**
 * Save photo verification to database
 */
async function savePhotoVerification(
  verificationId: string,
  photoId: string,
  s3Key: string,
  photoMetadata: any,
  verificationNotes: string | undefined,
  analysis: any
): Promise<void> {
  try {
    await prisma.$transaction(async tx => {
      // Update delivery verification with photo information
      await tx.deliveryVerification.update({
        where: { id: verificationId },
        data: {
          deliveryPhoto: s3Key,
          verificationNotes,
          verificationData: JSON.stringify({
            ...JSON.parse(
              (
                await tx.deliveryVerification.findUnique({
                  where: { id: verificationId },
                  select: { verificationData: true },
                })
              )?.verificationData || '{}'
            ),
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

      // Log the photo verification
      LoggerService.getInstance().info('Photo verification saved', {
        verificationId,
        photoId,
        s3Key,
        analysisValid: analysis.isValid,
        qualityScore: analysis.qualityScore,
      });
    });
  } catch (error: unknown) {
    LoggerService.getInstance().error(
      'Failed to save photo verification',
      error instanceof Error ? error : new Error(String(error)),
      {
        verificationId,
        photoId,
        s3Key,
      }
    );
    throw new Error('Failed to save photo verification');
  }
}

/**
 * Photo Verification Lambda Function Handler
 * POST /api/v1/rfid/photo-verification
 */
export const photoVerificationHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const startTime = Date.now();

  try {
    logger.info('Photo verification request started', {
      requestId: context.awsRequestId,
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Authenticate request
    const authResult = await authenticateLambda(event);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication failed', 401);
    }
    const authenticatedUser = authResult.user;

    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: photoData } = photoVerificationSchema.validate(requestBody);

    if (error) {
      logger.warn('Invalid photo verification request data', {
        requestId: context.awsRequestId,
        error: error.details,
      });
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', 400, error.details);
    }

    const {
      verificationId,
      photoData: photoDataB64,
      photoMetadata,
      verificationNotes,
    } = photoData as PhotoVerificationRequest;

    // Validate delivery verification
    const verification = await validateDeliveryVerification(verificationId, authenticatedUser);

    // Validate and process photo data
    const photoValidation = validatePhotoData(photoDataB64);

    if (!photoValidation.isValid) {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid photo data', 400, {
        error: photoValidation.error,
      });
    }

    // Generate unique photo ID
    const photoId = uuidv4();

    // Upload photo to S3
    const s3Key = await uploadPhotoToS3(
      photoValidation.buffer,
      photoValidation.contentType,
      verificationId,
      photoId
    );

    // Analyze photo
    const analysis = await analyzePhoto(photoValidation.buffer);

    // Save photo verification to database
    await savePhotoVerification(
      verificationId,
      photoId,
      s3Key,
      {
        ...photoMetadata,
        contentType: photoValidation.contentType,
        size: photoValidation.size,
        uploadedBy: authenticatedUser.id,
      },
      verificationNotes,
      analysis
    );

    // Generate photo URL for response
    const photoUrl = await generatePhotoUrl(s3Key);

    const response: PhotoVerificationResponse = {
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

    return createSuccessResponse({
      message: 'Photo verification uploaded successfully',
      data: response,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.error(
      'Photo verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        duration,
        requestId: context.awsRequestId,
      }
    );
    return handleError(
      error instanceof Error ? error : new Error(String(error)),
      'Failed to process photo verification'
    );
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Photo Upload Request Handler
 * POST /api/v1/rfid/photo-verification/upload-url
 */
export const photoUploadRequestHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();

  try {
    logger.info('Photo upload request started', {
      requestId: context.awsRequestId,
      httpMethod: event.httpMethod,
    });

    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Authenticate request
    const authResult = await authenticateLambda(event);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication failed', 401);
    }
    const authenticatedUser = authResult.user;

    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: uploadRequest } = photoUploadRequestSchema.validate(requestBody);

    if (error) {
      logger.warn('Invalid photo upload request data', {
        requestId: context.awsRequestId,
        error: error.details,
      });
      return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', 400, error.details);
    }

    const { verificationId, contentType, fileSize } = uploadRequest as PhotoUploadRequest;

    // Validate delivery verification
    const verification = await validateDeliveryVerification(verificationId, authenticatedUser);

    // Generate unique photo ID and S3 key
    const photoId = uuidv4();
    const bucketName = process.env.S3_BUCKET_NAME || 'hasivu-dev-uploads';
    const key = `delivery-photos/${verificationId}/${photoId}.${contentType.split('/')[1]}`;

    // Generate presigned URL for direct upload
    const uploadCommand = new PutObjectCommand({
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

    const presignedUrl = await getSignedUrl(s3Client, uploadCommand, {
      expiresIn: 300, // 5 minutes
    });

    logger.info('Photo upload URL generated', {
      photoId,
      verificationId,
      contentType,
      fileSize,
    });

    return createSuccessResponse({
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
  } catch (error: unknown) {
    logger.error(
      'Photo upload request failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId: context.awsRequestId,
      }
    );
    return handleError(
      error instanceof Error ? error : new Error(String(error)),
      'Failed to generate photo upload URL'
    );
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Get Photo Verification Handler
 * GET /api/v1/rfid/photo-verification/{verificationId}
 */
export const getPhotoVerificationHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();

  try {
    logger.info('Get photo verification request started', {
      requestId: context.awsRequestId,
      httpMethod: event.httpMethod,
    });

    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Authenticate request
    const authResult = await authenticateLambda(event);
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('UNAUTHORIZED', 'Authentication failed', 401);
    }
    const authenticatedUser = authResult.user;

    // Get verification ID from path parameters
    const verificationId = event.pathParameters?.verificationId;

    if (!verificationId) {
      return createErrorResponse('VALIDATION_ERROR', 'Missing verification ID', 400, undefined);
    }

    // Validate delivery verification
    const verification = await validateDeliveryVerification(verificationId, authenticatedUser);

    // Check if photo exists
    if (!verification.deliveryPhoto) {
      return createErrorResponse(
        'NOT_FOUND',
        'No photo found for this verification',
        404,
        undefined
      );
    }

    // Generate photo URL
    const photoUrl = await generatePhotoUrl(verification.deliveryPhoto);

    // Extract photo verification data
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

    return createSuccessResponse({
      message: 'Photo verification retrieved successfully',
      data: response,
    });
  } catch (error: unknown) {
    logger.error(
      'Get photo verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        requestId: context.awsRequestId,
      }
    );
    return handleError(
      error instanceof Error ? error : new Error(String(error)),
      'Failed to retrieve photo verification'
    );
  } finally {
    await prisma.$disconnect();
  }
};

// Export handlers
export const handler = photoVerificationHandler;
export const uploadRequestHandler = photoUploadRequestHandler;
export const getPhotoHandler = getPhotoVerificationHandler;
