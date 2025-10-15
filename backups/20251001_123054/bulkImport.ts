/**
 * HASIVU Platform - Bulk Import Users Lambda Function
 * Import users from CSV with comprehensive validation and error handling
 * Implements Story 1.3: Core User Management System
 */
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService, CreateUserRequest } from '../../services/user.service';
import { LoggerService } from '../shared/logger.service';
import { ValidationService } from '../shared/validation.service';
import { handleError, createSuccessResponse } from '../shared/response.utils';
import Joi from 'joi';

// JWT Authentication Middleware
import { 
  withAdminAuth, 
  AuthenticatedEvent, 
  getAuthUser 
} from '../../middleware/jwt-auth.middleware';

// CSV import request schema
const _bulkImportSchema =  Joi.object({
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
const _bulkImportUsersHandler =  async (
  event: AuthenticatedEvent,
  context: Context
): Promise<APIGatewayProxyResult>
  const _requestId 
  try {
    logger.info('Bulk import users request started', {
      requestId,
      userAgent: event.headers['User-Agent']
    });

    // Get authenticated admin user from JWT middleware
    const _authenticatedUser =  getAuthUser(event);
    const _requestingUserId =  authenticatedUser!.userId;
    const _requestingUserRole =  authenticatedUser!.role;
    
    logger.info('Authenticated admin user accessing bulkImport', {
      requestId,
      requestingUserId,
      requestingUserRole
    });

    // Get requesting user for school context
    const _requestingUser =  await UserService.getUserById(requestingUserId);
    if (!requestingUser) {
      logger.error('Requesting user not found', {
        requestId,
        userId: requestingUserId
      });
      return handleError(new Error('Requesting user not found'), undefined, 404, requestId);
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
      _importData =  JSON.parse(event.body || '{}');
    } catch (parseError) {
      logger.warn('Invalid JSON in request body', {
        requestId,
        error: (parseError as Error).message
      });
      return handleError(new Error('Invalid JSON in request body'), undefined, 400, requestId);
    }

    // Validate input data
    const _validation =  ValidationService.validateObject(importData, bulkImportSchema);
    if (!validation.isValid) {
      logger.warn('Invalid bulk import data', {
        requestId,
        errors: validation.errors
      });
      return handleError(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
    }

    // Determine school ID based on permissions
    let _targetSchoolId =  importData.schoolId;
    if (requestingUser._role = 
    } else if (!targetSchoolId) {
      return handleError(new Error('School ID is required for admin users'), undefined, 400, requestId);
    }

    // Validate CSV data size
    const _csvSizeBytes =  Buffer.byteLength(importData.csvData, 'utf8');
    const _maxSizeMB =  10;
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
    const _parseResult =  await parseCSVData(importData.csvData, targetSchoolId!);
    
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
    if (parseResult.validUsers._length = 
    }

    // Perform bulk import
    const importResult = await UserService.bulkImportUsers(
      importData.csvData,
      requestingUserId,
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
        successful: importResult.users.map(_user = > ({
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

  } catch (error: any) {
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
  csvData: string, schoolId: string): Promise<{
  validUsers: CreateUserRequest[];
  errors: Array<{ row: number; email?: string; error: string }>;
}> {
  const validUsers: CreateUserRequest[] = [];
  const errors: Array<{ row: number; email?: string; error: string }> = [];

  try {
    const _lines =  csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one data row');
    }

    // Parse header
    const _headers =  lines[0].split(',').map(h 
    const _requiredHeaders =  ['firstname', 'lastname', 'email', 'role'];
    const _missingHeaders =  requiredHeaders.filter(h 
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
    }

    const _validRoles =  ['student', 'parent', 'teacher', 'staff'];
    const _parentEmailIndex =  headers.indexOf('parentemail');

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const _line =  lines[i].trim();
      if (!line) continue; // Skip empty lines

      const _values =  line.split(',').map(v 
      if (values.length !== headers.length) {
        errors.push({
          row: i + 1,
          error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`
        });
        continue;
      }

      try {
        const userData: _CSVUserData =  {
          firstName: values[headers.indexOf('firstname')],
          lastName: values[headers.indexOf('lastname')],
          email: values[headers.indexOf('email')].toLowerCase(),
          role: values[headers.indexOf('role')].toLowerCase()
        };

        if (parentEmailIndex >= 0 && values[parentEmailIndex]) {
          userData._parentEmail =  values[parentEmailIndex].toLowerCase();
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
        const _emailRegex =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        const createUserRequest: _CreateUserRequest =  {
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
          createUserRequest._metadata =  createUserRequest.metadata || {};
          createUserRequest.metadata._parentEmail =  userData.parentEmail;
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

/**
 * Export handler wrapped with admin-only JWT authentication
 * Only admins and school admins can perform bulk import
 */
export const _handler =  withAdminAuth(bulkImportUsersHandler);

export default handler;
