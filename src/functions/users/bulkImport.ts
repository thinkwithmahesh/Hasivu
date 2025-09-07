/**
 * HASIVU Platform - Bulk Import Users Lambda Function
 * Import users from CSV with comprehensive validation and error handling
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService, CreateUserRequest } from '../../services/user.service';
import { LoggerService } from '../shared/logger.service';
import { ValidationService } from '../shared/validation.service';
import { handleError, createSuccessResponse } from '../shared/response.utils';
import Joi from 'joi';

// CSV import request schema
const bulkImportSchema = Joi.object({
  csvData: Joi.string().required().max(10 * 1024 * 1024), // 10MB max
  schoolId: Joi.string().uuid().optional(),
  previewMode: Joi.boolean().optional().default(false),
  skipDuplicates: Joi.boolean().optional().default(true),
  updateExisting: Joi.boolean().optional().default(false)
});

// Expected CSV structure
interface CSVUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  parentEmail?: string;
}

/**
 * Bulk Import Users Lambda Handler
 * POST /api/v1/users/bulk-import
 * 
 * Request Body:
 * - csvData: CSV string with user data
 * - schoolId?: Target school ID (required for admin, auto-set for school_admin)
 * - previewMode?: Return validation results without creating users
 * - skipDuplicates?: Skip users with existing emails
 * - updateExisting?: Update existing users instead of skipping
 * 
 * CSV Format:
 * firstName,lastName,email,role,parentEmail(optional)
 */
export const bulkImportUsersHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const logger = LoggerService.getInstance();
  const requestId = context.awsRequestId;

  try {
    logger.info('Bulk import users request started', {
      requestId,
      userAgent: event.headers['User-Agent']
    });

    // Extract user context from authorizer
    const userContext = event.requestContext.authorizer;
    if (!userContext?.userId) {
      logger.warn('Unauthorized bulk import attempt', { requestId });
      return handleError(new Error('Unauthorized'), undefined, 401, requestId);
    }

    // Get requesting user for permission checks
    const requestingUser = await UserService.getUserById(userContext.userId);
    if (!requestingUser) {
      logger.error('Requesting user not found', {
        requestId,
        userId: userContext.userId
      });
      return handleError(new Error('Requesting user not found'), undefined, 404, requestId);
    }

    // Check bulk import permissions
    if (!['admin', 'super_admin', 'school_admin'].includes(requestingUser.role)) {
      logger.warn('Bulk import permission denied', {
        requestId,
        userId: userContext.userId,
        role: requestingUser.role
      });
      return handleError(new Error('Insufficient permissions for bulk import'), undefined, 403, requestId);
    }

    // Parse request body
    let importData: {
      csvData: string;
      schoolId?: string;
      previewMode?: boolean;
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    };
    
    try {
      importData = JSON.parse(event.body || '{}');
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', {
        requestId,
        error: (parseError as Error).message
      });
      return handleError(new Error('Invalid JSON in request body'), undefined, 400, requestId);
    }

    // Validate input data
    const validation = ValidationService.validateObject(importData, bulkImportSchema);
    if (!validation.isValid) {
      logger.warn('Invalid bulk import data', {
        requestId,
        errors: validation.errors
      });
      return handleError(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
    }

    // Determine school ID based on permissions
    let targetSchoolId = importData.schoolId;
    if (requestingUser.role === 'school_admin') {
      // School admins can only import to their own school
      targetSchoolId = requestingUser.schoolId;
    } else if (!targetSchoolId) {
      return handleError(new Error('School ID is required for admin users'), undefined, 400, requestId);
    }

    // Validate CSV data size
    const csvSizeBytes = Buffer.byteLength(importData.csvData, 'utf8');
    const maxSizeMB = 10;
    if (csvSizeBytes > maxSizeMB * 1024 * 1024) {
      return handleError(new Error(`CSV data too large. Maximum size: ${maxSizeMB}MB`), undefined, 400, requestId);
    }

    logger.info('Processing CSV data', {
      requestId,
      csvSizeBytes,
      schoolId: targetSchoolId,
      previewMode: importData.previewMode || false
    });

    // Parse CSV data
    const parseResult = await parseCSVData(importData.csvData, targetSchoolId);
    
    if (parseResult.errors.length > 0) {
      logger.warn('CSV parsing errors detected', {
        requestId,
        errorCount: parseResult.errors.length,
        errors: parseResult.errors.slice(0, 10) // Log first 10 errors
      });
    }

    // Preview mode - return validation results without creating users
    if (importData.previewMode) {
      logger.info('Bulk import preview completed', {
        requestId,
        validUsersCount: parseResult.validUsers.length,
        errorCount: parseResult.errors.length
      });

      return createSuccessResponse({
        previewMode: true,
        summary: {
          totalRows: parseResult.validUsers.length + parseResult.errors.length,
          validUsers: parseResult.validUsers.length,
          errors: parseResult.errors.length
        },
        validUsers: parseResult.validUsers,
        errors: parseResult.errors
      }, 'Preview processed successfully', 200, requestId);
    }

    // Actual import mode
    if (parseResult.validUsers.length === 0) {
      return handleError(new Error('No valid users found in CSV data'), undefined, 400, requestId);
    }

    // Perform bulk import
    const importResult = await UserService.bulkImportUsers(
      importData.csvData,
      userContext.userId,
      targetSchoolId
    );

    logger.info('Bulk import completed', {
      requestId,
      successCount: importResult.successCount,
      errorCount: importResult.errorCount,
      totalUsers: importResult.users.length
    });

    return createSuccessResponse({
      previewMode: false,
      summary: {
        totalProcessed: importResult.successCount + importResult.errorCount,
        successful: importResult.successCount,
        errors: importResult.errorCount,
        duplicates: 0 // Not supported in current interface
      },
      results: {
        successful: importResult.users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        })),
        errors: importResult.errors,
        duplicates: [] // Not supported in current interface
      },
      csvErrors: parseResult.errors
    }, 'Bulk import completed successfully', 200, requestId);

  } catch (error) {
    logger.error('Bulk import request failed', {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    return handleError(error as Error, undefined, 500, requestId);
  }
};

/**
 * Parse CSV data and validate user records
 */
async function parseCSVData(
  csvData: string,
  schoolId: string
): Promise<{
  validUsers: CreateUserRequest[];
  errors: Array<{ row: number; email?: string; error: string }>;
}> {
  const validUsers: CreateUserRequest[] = [];
  const errors: Array<{ row: number; email?: string; error: string }> = [];

  try {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['firstname', 'lastname', 'email', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
    }

    const validRoles = ['student', 'parent', 'teacher', 'staff'];
    const parentEmailIndex = headers.indexOf('parentemail');

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
        const userData: CSVUserData = {
          firstName: values[headers.indexOf('firstname')],
          lastName: values[headers.indexOf('lastname')],
          email: values[headers.indexOf('email')].toLowerCase(),
          role: values[headers.indexOf('role')].toLowerCase()
        };

        if (parentEmailIndex >= 0 && values[parentEmailIndex]) {
          userData.parentEmail = values[parentEmailIndex].toLowerCase();
        }

        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
          errors.push({
            row: i + 1,
            email: userData.email,
            error: 'Missing required fields (firstName, lastName, email, role)'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          errors.push({
            row: i + 1,
            email: userData.email,
            error: 'Invalid email format'
          });
          continue;
        }

        // Validate role
        if (!validRoles.includes(userData.role)) {
          errors.push({
            row: i + 1,
            email: userData.email,
            error: `Invalid role: ${userData.role}. Valid roles: ${validRoles.join(', ')}`
          });
          continue;
        }

        // Create user request object
        const createUserRequest: CreateUserRequest = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role as any,
          schoolId,
          isActive: true,
          metadata: {
            importedAt: new Date().toISOString(),
            csvRow: i + 1
          }
        };

        // Handle parent relationship if specified
        if (userData.parentEmail) {
          createUserRequest.metadata.parentEmail = userData.parentEmail;
        }

        validUsers.push(createUserRequest);

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

  return { validUsers, errors };
}

export default bulkImportUsersHandler;