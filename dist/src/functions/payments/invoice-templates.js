"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceTemplatesHandler = void 0;
const logger_1 = require("../../shared/utils/logger");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/services/jwt.service");
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    const jwtResult = await jwt_service_1.jwtService.verifyToken(token);
    if (!jwtResult.isValid || !jwtResult.payload.userId) {
        throw new Error('Invalid authentication token');
    }
    return {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        firstName: '',
        lastName: '',
        role: jwtResult.payload.role,
        schoolId: jwtResult.payload.schoolId,
        isActive: true
    };
}
const invoiceTemplatesHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Invoice templates request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path
        });
        let authResult;
        try {
            authResult = await authenticateLambda(event);
        }
        catch (authError) {
            logger_1.logger.warn('Authentication failed', { requestId, error: authError.message });
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
        const db = database_service_1.databaseService.getPrismaClient();
        switch (method) {
            case 'GET':
                if (pathParameters.templateId) {
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
                }
                else {
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
                if (!['admin', 'finance_admin', 'school_admin'].includes(authResult.role)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            error: 'Insufficient permissions to create invoice templates',
                            code: 'INSUFFICIENT_PERMISSIONS'
                        })
                    };
                }
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
                logger_1.logger.info('Invoice template created', {
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
                if (!['admin', 'finance_admin', 'school_admin'].includes(authResult.role)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            error: 'Insufficient permissions to update invoice templates',
                            code: 'INSUFFICIENT_PERMISSIONS'
                        })
                    };
                }
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
                const updateFields = {};
                if (updateData.templateName)
                    updateFields.templateName = updateData.templateName;
                if (updateData.templateType)
                    updateFields.templateType = updateData.templateType;
                if (updateData.logoUrl !== undefined)
                    updateFields.logoUrl = updateData.logoUrl;
                if (updateData.headerColor !== undefined)
                    updateFields.headerColor = updateData.headerColor;
                if (updateData.accentColor !== undefined)
                    updateFields.accentColor = updateData.accentColor;
                if (updateData.footerText !== undefined)
                    updateFields.footerText = updateData.footerText;
                if (updateData.htmlTemplate)
                    updateFields.htmlTemplate = updateData.htmlTemplate;
                if (updateData.cssStyles !== undefined)
                    updateFields.cssStyles = updateData.cssStyles;
                if (updateData.isDefault !== undefined)
                    updateFields.isDefault = updateData.isDefault;
                if (updateData.isActive !== undefined)
                    updateFields.isActive = updateData.isActive;
                const updatedTemplate = await db.invoiceTemplate.update({
                    where: { id: pathParameters.templateId },
                    data: updateFields
                });
                logger_1.logger.info('Invoice template updated', {
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
    }
    catch (error) {
        logger_1.logger.error('Invoice templates request failed', {
            requestId,
            error: error.message,
            stack: error.stack
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
exports.invoiceTemplatesHandler = invoiceTemplatesHandler;
exports.default = exports.invoiceTemplatesHandler;
//# sourceMappingURL=invoice-templates.js.map