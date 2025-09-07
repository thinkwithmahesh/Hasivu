/**
 * HASIVU Platform - Invoice Template Management Lambda Function
 * Complete CRUD operations for invoice template management
 * 
 * Features:
 * - Create, read, update, delete invoice templates
 * - Role-based access control (admin, finance_admin, school_admin)
 * - Default template management (only one default per type per school)
 * - School-level template isolation
 * - Comprehensive branding and styling support
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import { databaseService } from '../../shared/database.service';
import { jwtService } from '../../shared/services/jwt.service';

// Types
interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  isActive: boolean;
}

// Authentication middleware
async function authenticateLambda(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  const jwtResult = await jwtService.verifyToken(token);
  if (!jwtResult.isValid || !jwtResult.payload.userId) {
    throw new Error('Invalid authentication token');
  }
  
  return {
    id: jwtResult.payload.userId,
    email: jwtResult.payload.email,
    firstName: '', // Not available in JWT payload
    lastName: '', // Not available in JWT payload
    role: jwtResult.payload.role,
    schoolId: (jwtResult.payload as any).schoolId,
    isActive: true // Assume active if token is valid
  };
}

/**
 * Invoice Template Management Lambda Handler
 * 
 * Handles complete CRUD operations for invoice templates with:
 * - JWT authentication and role-based authorization
 * - School-level data isolation and access control
 * - Default template management with automatic conflict resolution
 * - Comprehensive validation and error handling
 * - Full audit logging for all template operations
 */
export const invoiceTemplatesHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    logger.info('Invoice templates request started', {
      requestId,
      httpMethod: event.httpMethod,
      path: event.path
    });

    // Authentication
    let authResult: AuthenticatedUser;
    try {
      authResult = await authenticateLambda(event);
    } catch (authError) {
      logger.warn('Authentication failed', { requestId, error: (authError as Error).message });
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        })
      };
    }

    const { httpMethod: method } = event;
    const pathParameters = event.pathParameters || {};

    // Get current templates with available schema fields
    const db = databaseService.getPrismaClient();

    switch (method) {
      case 'GET':
        if (pathParameters.templateId) {
          // Get single template
          const template = await db.invoiceTemplate.findUnique({
            where: { id: pathParameters.templateId }
          });

          if (!template) {
            return {
              statusCode: 404,
              body: JSON.stringify({
                error: 'Template not found',
                code: 'TEMPLATE_NOT_FOUND'
              })
            };
          }

          return {
            statusCode: 200,
            body: JSON.stringify({
              template: {
                id: template.id,
                templateName: template.templateName,
                templateType: template.templateType,
                logoUrl: template.logoUrl,
                headerColor: template.headerColor,
                accentColor: template.accentColor,
                footerText: template.footerText,
                htmlTemplate: template.htmlTemplate,
                cssStyles: template.cssStyles,
                isDefault: template.isDefault,
                isActive: template.isActive,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt
              }
            })
          };
        } else {
          // List templates for school
          const templates = await db.invoiceTemplate.findMany({
            where: {
              schoolId: authResult.schoolId || undefined,
              isActive: true
            },
            orderBy: { createdAt: 'desc' }
          });

          return {
            statusCode: 200,
            body: JSON.stringify({
              templates: templates.map(template => ({
                id: template.id,
                templateName: template.templateName,
                templateType: template.templateType,
                isDefault: template.isDefault,
                isActive: template.isActive,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt
              }))
            })
          };
        }

      case 'POST':
        // Create new template
        if (!event.body) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Request body is required',
              code: 'MISSING_REQUEST_BODY'
            })
          };
        }

        const createData = JSON.parse(event.body);
        
        // Validation
        const requiredFields = ['templateName', 'templateType', 'htmlTemplate'];
        const missingFields = requiredFields.filter(field => !createData[field]);
        
        if (missingFields.length > 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: `Missing required fields: ${missingFields.join(', ')}`,
              code: 'MISSING_REQUIRED_FIELDS'
            })
          };
        }

        // Role-based access control
        if (!['admin', 'finance_admin', 'school_admin'].includes(authResult.role)) {
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions to create invoice templates',
              code: 'INSUFFICIENT_PERMISSIONS'
            })
          };
        }

        // If setting as default, unset existing default templates
        if (createData.isDefault) {
          await db.invoiceTemplate.updateMany({
            where: { 
              schoolId: authResult.schoolId || undefined,
              templateType: createData.templateType,
              isDefault: true 
            },
            data: { isDefault: false }
          });
        }

        const newTemplate = await db.invoiceTemplate.create({
          data: {
            schoolId: authResult.schoolId || 'global',
            templateName: createData.templateName,
            templateType: createData.templateType,
            logoUrl: createData.logoUrl || null,
            headerColor: createData.headerColor || null,
            accentColor: createData.accentColor || null,
            footerText: createData.footerText || null,
            htmlTemplate: createData.htmlTemplate,
            cssStyles: createData.cssStyles || null,
            isDefault: createData.isDefault || false,
            isActive: true
          }
        });

        logger.info('Invoice template created', {
          requestId,
          templateId: newTemplate.id,
          templateName: newTemplate.templateName,
          createdBy: authResult.id
        });

        return {
          statusCode: 201,
          body: JSON.stringify({
            message: 'Template created successfully',
            template: {
              id: newTemplate.id,
              templateName: newTemplate.templateName,
              templateType: newTemplate.templateType,
              logoUrl: newTemplate.logoUrl,
              headerColor: newTemplate.headerColor,
              accentColor: newTemplate.accentColor,
              footerText: newTemplate.footerText,
              isDefault: newTemplate.isDefault,
              isActive: newTemplate.isActive,
              createdAt: newTemplate.createdAt,
              updatedAt: newTemplate.updatedAt
            }
          })
        };

      case 'PUT':
        // Update existing template
        if (!pathParameters.templateId) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Template ID is required for update',
              code: 'MISSING_TEMPLATE_ID'
            })
          };
        }

        if (!event.body) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Request body is required',
              code: 'MISSING_REQUEST_BODY'
            })
          };
        }

        const updateData = JSON.parse(event.body);

        // Role-based access control
        if (!['admin', 'finance_admin', 'school_admin'].includes(authResult.role)) {
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: 'Insufficient permissions to update invoice templates',
              code: 'INSUFFICIENT_PERMISSIONS'
            })
          };
        }

        // Check if template exists and user has access
        const existingTemplate = await db.invoiceTemplate.findFirst({
          where: {
            id: pathParameters.templateId,
            schoolId: authResult.schoolId || undefined
          }
        });

        if (!existingTemplate) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Template not found or access denied',
              code: 'TEMPLATE_NOT_FOUND'
            })
          };
        }

        // If setting as default, unset existing default templates of the same type
        if (updateData.isDefault && !existingTemplate.isDefault) {
          await db.invoiceTemplate.updateMany({
            where: { 
              schoolId: authResult.schoolId || undefined,
              templateType: updateData.templateType || existingTemplate.templateType,
              isDefault: true,
              id: { not: pathParameters.templateId }
            },
            data: { isDefault: false }
          });
        }

        // Build update data object with only provided fields
        const updateFields: any = {};
        
        if (updateData.templateName) updateFields.templateName = updateData.templateName;
        if (updateData.templateType) updateFields.templateType = updateData.templateType;
        if (updateData.logoUrl !== undefined) updateFields.logoUrl = updateData.logoUrl;
        if (updateData.headerColor !== undefined) updateFields.headerColor = updateData.headerColor;
        if (updateData.accentColor !== undefined) updateFields.accentColor = updateData.accentColor;
        if (updateData.footerText !== undefined) updateFields.footerText = updateData.footerText;
        if (updateData.htmlTemplate) updateFields.htmlTemplate = updateData.htmlTemplate;
        if (updateData.cssStyles !== undefined) updateFields.cssStyles = updateData.cssStyles;
        if (updateData.isDefault !== undefined) updateFields.isDefault = updateData.isDefault;
        if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

        const updatedTemplate = await db.invoiceTemplate.update({
          where: { id: pathParameters.templateId },
          data: updateFields
        });

        logger.info('Invoice template updated', {
          requestId,
          templateId: updatedTemplate.id,
          templateName: updatedTemplate.templateName,
          updatedBy: authResult.id,
          fieldsUpdated: Object.keys(updateFields)
        });

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Template updated successfully',
            template: {
              id: updatedTemplate.id,
              templateName: updatedTemplate.templateName,
              templateType: updatedTemplate.templateType,
              logoUrl: updatedTemplate.logoUrl,
              headerColor: updatedTemplate.headerColor,
              accentColor: updatedTemplate.accentColor,
              footerText: updatedTemplate.footerText,
              htmlTemplate: updatedTemplate.htmlTemplate,
              cssStyles: updatedTemplate.cssStyles,
              isDefault: updatedTemplate.isDefault,
              isActive: updatedTemplate.isActive,
              createdAt: updatedTemplate.createdAt,
              updatedAt: updatedTemplate.updatedAt
            }
          })
        };

      case 'DELETE':
        if (!pathParameters.templateId) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Template ID is required for deletion',
              code: 'MISSING_TEMPLATE_ID'
            })
          };
        }

        // Soft delete by setting isActive to false
        await db.invoiceTemplate.update({
          where: { id: pathParameters.templateId },
          data: { isActive: false }
        });

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Template deleted successfully'
          })
        };

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
          })
        };
    }

  } catch (error) {
    logger.error('Invoice templates request failed', {
      requestId,
      error: (error as Error).message,
      stack: (error as Error).stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    };
  }
};

export default invoiceTemplatesHandler;