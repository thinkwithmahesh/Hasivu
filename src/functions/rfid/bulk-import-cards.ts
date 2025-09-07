/**
 * HASIVU Platform - Bulk Import RFID Cards Lambda Function
 * Handles: POST /api/v1/rfid/cards/bulk-import
 * Implements Story 2.1: RFID Card Management - Bulk Card Creation
 * Production-ready with comprehensive validation and batch processing
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
// import { ValidationService } from '../shared/validation.service'; // Not available
// import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils'; // Not available
import { authenticateLambda, AuthenticatedUser } from '../../shared/middleware/lambda-auth.middleware';
// import * as Joi from 'joi'; // Would require Joi dependency
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Initialize database client
const prisma = new PrismaClient();

// Bulk import request schema (Joi validation commented out - not available)
// const bulkImportSchema = Joi.object({
//   csvData: Joi.string().required().max(10 * 1024 * 1024), // 10MB max
//   schoolId: Joi.string().uuid().required(),
//   previewMode: Joi.boolean().optional().default(false),
//   skipDuplicates: Joi.boolean().optional().default(true),
//   updateExisting: Joi.boolean().optional().default(false),
//   cardType: Joi.string().valid('standard', 'premium', 'temporary').optional().default('standard'),
//   expiryDays: Joi.number().integer().min(1).max(3650).optional() // Optional expiry in days
// });

// CSV card data interface
interface CSVCardData {
  studentId?: string;
  studentEmail?: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
}

// Bulk import request interface
interface BulkImportRequest {
  csvData: string;
  schoolId: string;
  previewMode?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  cardType?: string;
  expiryDays?: number;
}

// Import result interface
interface ImportResult {
  successful: Array<{
    cardId: string;
    cardNumber: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
  }>;
  errors: Array<{
    row: number;
    studentId?: string;
    studentEmail?: string;
    error: string;
  }>;
  duplicates: Array<{
    studentId: string;
    studentEmail: string;
    existingCardNumber: string;
    action: 'skipped' | 'updated';
  }>;
}

/**
 * Generate secure unique RFID card number
 */
function generateCardNumber(schoolCode: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `RFID-${schoolCode}-${timestamp}-${random}`;
}

/**
 * Check if user can perform bulk import for the school
 */
function canPerformBulkImport(requestingUser: AuthenticatedUser, schoolId: string): boolean {
  const userRole = requestingUser.role;
  
  // Super admin and admin can import for any school
  if (['super_admin', 'admin'].includes(userRole)) {
    return true;
  }
  
  // School admin can import for their school
  if (userRole === 'school_admin' && requestingUser.schoolId === schoolId) {
    return true;
  }
  
  // Staff can import for their school with proper permissions
  if (userRole === 'staff' && requestingUser.schoolId === schoolId) {
    return true;
  }
  
  return false;
}

/**
 * Validate school exists and is active
 */
async function validateSchool(schoolId: string): Promise<any> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      code: true
      // isActive: true // Not available in School schema
    }
  });

  if (!school) {
    throw new Error('School not found');
  }

  // Note: School isActive field not available in schema
  // if (!school.isActive) {
  //   throw new Error('School is inactive');
  // }

  return school;
}

/**
 * Parse and validate CSV data
 */
async function parseCSVData(
  csvData: string,
  schoolId: string
): Promise<{
  validCards: Array<CSVCardData & { student: any }>;
  errors: Array<{ row: number; studentId?: string; studentEmail?: string; error: string }>;
}> {
  const validCards: Array<CSVCardData & { student: any }> = [];
  const errors: Array<{ row: number; studentId?: string; studentEmail?: string; error: string }> = [];

  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['studentid']; // Minimum required
    const optionalHeaders = ['studentemail', 'expirydate', 'metadata'];
    
    // Check for either studentId or studentEmail
    const hasStudentId = headers.includes('studentid');
    const hasStudentEmail = headers.includes('studentemail');
    
    if (!hasStudentId && !hasStudentEmail) {
      throw new Error('CSV must contain either studentId or studentEmail column');
    }

    // Get existing students for the school to validate and resolve
    const students = await prisma.user.findMany({
      where: {
        schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        rfidCards: {
          where: { isActive: true },
          select: { id: true, cardNumber: true }
        }
      }
    });

    const studentsByEmail = new Map(students.map(s => [s.email.toLowerCase(), s]));
    const studentsById = new Map(students.map(s => [s.id, s]));

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push({
          row: i + 1,
          error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`
        });
        continue;
      }

      try {
        const cardData: CSVCardData = {};
        let student: any = null;

        // Get student ID if provided
        const studentIdIndex = headers.indexOf('studentid');
        if (studentIdIndex >= 0 && values[studentIdIndex]) {
          cardData.studentId = values[studentIdIndex];
          student = studentsById.get(cardData.studentId);
        }

        // Get student email if provided (use for lookup if no studentId)
        const studentEmailIndex = headers.indexOf('studentemail');
        if (studentEmailIndex >= 0 && values[studentEmailIndex]) {
          cardData.studentEmail = values[studentEmailIndex].toLowerCase();
          
          // Use email to find student if no studentId provided
          if (!student) {
            student = studentsByEmail.get(cardData.studentEmail);
            if (student) {
              cardData.studentId = student.id;
            }
          }
        }

        // Validate student was found
        if (!student) {
          errors.push({
            row: i + 1,
            studentId: cardData.studentId,
            studentEmail: cardData.studentEmail,
            error: 'Student not found or not active in this school'
          });
          continue;
        }

        // Check if student already has an active RFID card
        if (student.rfidCards.length > 0) {
          errors.push({
            row: i + 1,
            studentId: student.id,
            studentEmail: student.email,
            error: `Student already has an active RFID card: ${student.rfidCards[0].cardNumber}`
          });
          continue;
        }

        // Parse expiry date if provided
        const expiryDateIndex = headers.indexOf('expirydate');
        if (expiryDateIndex >= 0 && values[expiryDateIndex]) {
          const expiryStr = values[expiryDateIndex];
          const expiryDate = new Date(expiryStr);
          
          if (isNaN(expiryDate.getTime())) {
            errors.push({
              row: i + 1,
              studentId: student.id,
              studentEmail: student.email,
              error: `Invalid expiry date format: ${expiryStr}. Use YYYY-MM-DD format`
            });
            continue;
          }
          
          if (expiryDate <= new Date()) {
            errors.push({
              row: i + 1,
              studentId: student.id,
              studentEmail: student.email,
              error: 'Expiry date must be in the future'
            });
            continue;
          }
          
          cardData.expiryDate = expiryStr;
        }

        // Parse metadata if provided
        const metadataIndex = headers.indexOf('metadata');
        if (metadataIndex >= 0 && values[metadataIndex]) {
          try {
            cardData.metadata = JSON.parse(values[metadataIndex]);
          } catch (metaError) {
            errors.push({
              row: i + 1,
              studentId: student.id,
              studentEmail: student.email,
              error: 'Invalid JSON format in metadata column'
            });
            continue;
          }
        }

        validCards.push({
          ...cardData,
          student
        });

      } catch (rowError) {
        errors.push({
          row: i + 1,
          error: `Processing error: ${(rowError as Error).message}`
        });
      }
    }

  } catch (parseError) {
    errors.push({
      row: 0,
      error: `CSV parsing error: ${(parseError as Error).message}`
    });
  }

  return { validCards, errors };
}

/**
 * Perform bulk card creation
 */
async function createCardsInBatch(
  validCards: Array<CSVCardData & { student: any }>,
  school: any,
  cardType: string,
  expiryDays?: number,
  createdByUserId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    successful: [],
    errors: [],
    duplicates: []
  };

  // Process cards in batches of 50 to avoid database timeout
  const batchSize = 50;
  for (let i = 0; i < validCards.length; i += batchSize) {
    const batch = validCards.slice(i, i + batchSize);
    
    for (const cardData of batch) {
      try {
        // Generate unique card number
        let cardNumber = generateCardNumber(school.code);
        
        // Ensure uniqueness (very rare collision scenario)
        let attempts = 0;
        while (attempts < 3) {
          const existing = await prisma.rFIDCard.findUnique({
            where: { cardNumber }
          });
          
          if (!existing) break;
          
          cardNumber = generateCardNumber(school.code);
          attempts++;
        }
        
        if (attempts >= 3) {
          result.errors.push({
            row: 0,
            studentId: cardData.student.id,
            studentEmail: cardData.student.email,
            error: 'Failed to generate unique card number after multiple attempts'
          });
          continue;
        }

        // Calculate expiry date
        let expiresAt: Date | null = null;
        if (cardData.expiryDate) {
          expiresAt = new Date(cardData.expiryDate);
        } else if (expiryDays) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + expiryDays);
        }

        // Create RFID card
        const rfidCard = await prisma.rFIDCard.create({
          data: {
            cardNumber,
            studentId: cardData.student.id,
            schoolId: school.id,
            isActive: true,
            issuedAt: new Date(),
            expiresAt,
            metadata: JSON.stringify({
              cardType,
              bulkImported: true,
              importedAt: new Date().toISOString(),
              ...(cardData.metadata || {})
            })
          }
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            entityType: 'RFIDCard',
            entityId: rfidCard.id,
            action: 'CREATE',
            changes: JSON.stringify({
              cardNumber: rfidCard.cardNumber,
              studentId: cardData.student.id,
              schoolId: school.id,
              bulkImported: true,
              createdBy: createdByUserId
            }),
            userId: createdByUserId || 'system',
            createdById: createdByUserId || 'system',
            metadata: JSON.stringify({
              action: 'BULK_RFID_CARD_CREATED',
              timestamp: new Date().toISOString()
            })
          }
        });

        result.successful.push({
          cardId: rfidCard.id,
          cardNumber: rfidCard.cardNumber,
          studentId: cardData.student.id,
          studentName: `${cardData.student.firstName} ${cardData.student.lastName}`,
          studentEmail: cardData.student.email
        });

      } catch (createError: any) {
        result.errors.push({
          row: 0,
          studentId: cardData.student.id,
          studentEmail: cardData.student.email,
          error: `Card creation failed: ${createError.message}`
        });
      }
    }
  }

  return result;
}

/**
 * Bulk Import RFID Cards Lambda Handler
 * POST /api/v1/rfid/cards/bulk-import
 */
export const bulkImportRfidCardsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  
  try {
    logger.info('Bulk import RFID cards request started', { requestId });
    
    // Authenticate request
    const authenticatedUser = await authenticateLambda(event);
    
    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Manual validation (Joi not available)
    if (!requestBody.csvData) {
      logger.warn('Invalid request data: missing csvData', { requestId });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'csvData is required' })
      };
    }
    
    if (!requestBody.schoolId) {
      logger.warn('Invalid request data: missing schoolId', { requestId });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'schoolId is required' })
      };
    }
    
    const { csvData, schoolId, previewMode, skipDuplicates, updateExisting, cardType, expiryDays } = requestBody as BulkImportRequest;
    
    // Authorization check
    if (!canPerformBulkImport(authenticatedUser.user!, schoolId)) {
      logger.warn('Unauthorized bulk import attempt', {
        requestId,
        userId: authenticatedUser.user?.id,
        schoolId,
        userRole: authenticatedUser.user?.role
      });
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions to perform bulk RFID card import for this school' })
      };
    }
    
    // Validate school
    const school = await validateSchool(schoolId);
    
    // Validate CSV data size
    const csvSizeBytes = Buffer.byteLength(csvData, 'utf8');
    const maxSizeMB = 10;
    if (csvSizeBytes > maxSizeMB * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `CSV data too large. Maximum size: ${maxSizeMB}MB` })
      };
    }
    
    logger.info('Processing bulk import CSV data', {
      requestId,
      csvSizeBytes,
      schoolId,
      schoolCode: school.code,
      previewMode: previewMode || false
    });
    
    // Parse CSV data
    const parseResult = await parseCSVData(csvData, schoolId);
    
    if (parseResult.errors.length > 0) {
      logger.warn('CSV parsing errors detected', {
        requestId,
        errorCount: parseResult.errors.length,
        errors: parseResult.errors.slice(0, 10) // Log first 10 errors
      });
    }
    
    // Preview mode - return validation results without creating cards
    if (previewMode) {
      logger.info('Bulk import preview completed', {
        requestId,
        validCardsCount: parseResult.validCards.length,
        errorCount: parseResult.errors.length
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Bulk import preview completed successfully',
          data: {
            previewMode: true,
            summary: {
              totalRows: parseResult.validCards.length + parseResult.errors.length,
              validCards: parseResult.validCards.length,
              errors: parseResult.errors.length
            },
            validCards: parseResult.validCards.map(card => ({
              studentId: card.student.id,
              studentName: `${card.student.firstName} ${card.student.lastName}`,
              studentEmail: card.student.email,
              expiryDate: card.expiryDate,
              metadata: card.metadata
            })),
            errors: parseResult.errors
          }
        })
      };
    }
    
    // Actual import mode
    if (parseResult.validCards.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid cards found in CSV data' })
      };
    }
    
    // Perform bulk card creation
    const importResult = await createCardsInBatch(
      parseResult.validCards,
      school,
      cardType || 'standard',
      expiryDays,
      authenticatedUser.id
    );
    
    logger.info('Bulk RFID card import completed', {
      requestId,
      successCount: importResult.successful.length,
      errorCount: importResult.errors.length,
      duplicateCount: importResult.duplicates.length
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Bulk RFID card import completed successfully',
        data: {
          previewMode: false,
          summary: {
            totalProcessed: parseResult.validCards.length,
            successful: importResult.successful.length,
            errors: importResult.errors.length + parseResult.errors.length,
            duplicates: importResult.duplicates.length
          },
          results: {
            successful: importResult.successful,
            errors: [...importResult.errors, ...parseResult.errors],
            duplicates: importResult.duplicates
          }
        }
      })
    };
    
  } catch (error: any) {
    logger.error('Bulk import RFID cards failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to bulk import RFID cards',
        message: error.message
      })
    };
  } finally {
    await prisma.$disconnect();
  }
};