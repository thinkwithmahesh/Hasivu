"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceGeneratorHandler = void 0;
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
const invoiceGeneratorHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Invoice generator request started', {
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
                if (pathParameters.invoiceId) {
                    const invoice = await db.invoice.findUnique({
                        where: { id: pathParameters.invoiceId },
                        include: {
                            school: true,
                            invoiceItems: true
                        }
                    });
                    if (!invoice) {
                        return {
                            statusCode: 404,
                            body: JSON.stringify({
                                error: 'Invoice not found',
                                code: 'INVOICE_NOT_FOUND'
                            })
                        };
                    }
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            invoice: {
                                id: invoice.id,
                                number: invoice.invoiceNumber,
                                status: invoice.status,
                                amount: invoice.totalAmount,
                                dueDate: invoice.dueDate,
                                createdAt: invoice.createdAt,
                                school: {
                                    id: invoice.school.id,
                                    name: invoice.school.name,
                                    address: invoice.school.address
                                },
                                items: invoice.invoiceItems.map(item => ({
                                    id: item.id,
                                    description: item.description,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    total: item.totalPrice
                                }))
                            }
                        })
                    };
                }
                else {
                    const invoices = await db.invoice.findMany({
                        where: {
                            schoolId: authResult.schoolId || undefined
                        },
                        include: {
                            invoiceItems: {
                                select: {
                                    id: true,
                                    description: true,
                                    totalPrice: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    });
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            invoices: invoices.map(invoice => ({
                                id: invoice.id,
                                number: invoice.invoiceNumber,
                                status: invoice.status,
                                amount: invoice.totalAmount,
                                dueDate: invoice.dueDate,
                                createdAt: invoice.createdAt,
                                itemCount: invoice.invoiceItems.length
                            }))
                        })
                    };
                }
            case 'POST':
                try {
                    const requestBody = JSON.parse(event.body || '{}');
                    if (!requestBody.type || !requestBody.customerId || !requestBody.items?.length) {
                        return {
                            statusCode: 400,
                            body: JSON.stringify({
                                error: 'Invalid invoice data',
                                message: 'Type, customerId, and items are required',
                                code: 'VALIDATION_ERROR'
                            })
                        };
                    }
                    const subtotal = requestBody.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                    const invoiceCount = await db.invoice.count({
                        where: { schoolId: authResult.schoolId || undefined }
                    });
                    const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`;
                    const invoice = await db.invoice.create({
                        data: {
                            invoiceNumber: invoiceNumber,
                            schoolId: authResult.schoolId,
                            userId: requestBody.customerId,
                            status: 'draft',
                            totalAmount: subtotal,
                            subtotal: subtotal,
                            taxAmount: 0,
                            dueDate: requestBody.dueDate ? new Date(requestBody.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        }
                    });
                    await db.invoiceItem.createMany({
                        data: requestBody.items.map(item => ({
                            invoiceId: invoice.id,
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.quantity * item.unitPrice,
                            taxRate: item.taxRate || 0,
                            taxAmount: 0,
                            itemType: 'service'
                        }))
                    });
                    logger_1.logger.info('Invoice created successfully', {
                        invoiceId: invoice.id,
                        number: invoice.invoiceNumber,
                        amount: invoice.totalAmount,
                        userId: authResult.id
                    });
                    return {
                        statusCode: 201,
                        body: JSON.stringify({
                            message: 'Invoice created successfully',
                            invoice: {
                                id: invoice.id,
                                number: invoice.invoiceNumber,
                                status: invoice.status,
                                amount: invoice.totalAmount,
                                createdAt: invoice.createdAt
                            }
                        })
                    };
                }
                catch (parseError) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invalid JSON in request body',
                            code: 'PARSE_ERROR'
                        })
                    };
                }
            case 'PUT':
                if (!pathParameters.invoiceId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invoice ID is required for updates',
                            code: 'MISSING_INVOICE_ID'
                        })
                    };
                }
                let updateData;
                try {
                    updateData = JSON.parse(event.body || '{}');
                }
                catch (e) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invalid JSON in update request body',
                            code: 'PARSE_ERROR'
                        })
                    };
                }
                if (!['admin', 'finance_admin', 'school_admin'].includes(authResult.role)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            error: 'Insufficient permissions to update invoices',
                            code: 'INSUFFICIENT_PERMISSIONS'
                        })
                    };
                }
                const existingInvoice = await db.invoice.findFirst({
                    where: {
                        id: pathParameters.invoiceId,
                        schoolId: authResult.schoolId || undefined
                    }
                });
                if (!existingInvoice) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({
                            error: 'Invoice not found or access denied',
                            code: 'INVOICE_NOT_FOUND'
                        })
                    };
                }
                if (['PAID', 'CANCELLED', 'VOID'].includes(existingInvoice.status)) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: `Cannot update invoice in ${existingInvoice.status} status`,
                            code: 'INVALID_STATUS_FOR_UPDATE'
                        })
                    };
                }
                const updateFields = {};
                let shouldRecalculate = false;
                if (updateData.subtotal !== undefined) {
                    updateFields.subtotal = parseFloat(updateData.subtotal);
                    shouldRecalculate = true;
                }
                if (updateData.discountAmount !== undefined) {
                    updateFields.discountAmount = parseFloat(updateData.discountAmount);
                    shouldRecalculate = true;
                }
                if (updateData.gstRate !== undefined) {
                    updateFields.gstRate = parseFloat(updateData.gstRate);
                    shouldRecalculate = true;
                }
                if (shouldRecalculate) {
                    const subtotal = updateFields.subtotal ?? existingInvoice.subtotal;
                    const discountAmount = updateFields.discountAmount ?? existingInvoice.discountAmount;
                    const gstRate = updateFields.gstRate ?? existingInvoice.gstRate;
                    const discountedSubtotal = subtotal - discountAmount;
                    const taxAmount = (discountedSubtotal * gstRate) / 100;
                    const totalAmount = discountedSubtotal + taxAmount;
                    updateFields.taxAmount = taxAmount;
                    updateFields.totalAmount = totalAmount;
                }
                if (updateData.status && ['DRAFT', 'SENT', 'OVERDUE', 'PAID', 'CANCELLED'].includes(updateData.status)) {
                    updateFields.status = updateData.status;
                    if (updateData.status === 'SENT' && !existingInvoice.sentDate) {
                        updateFields.sentDate = new Date();
                    }
                }
                if (updateData.dueDate) {
                    updateFields.dueDate = new Date(updateData.dueDate);
                }
                if (updateData.gstNumber !== undefined)
                    updateFields.gstNumber = updateData.gstNumber;
                if (updateData.hsnCode !== undefined)
                    updateFields.hsnCode = updateData.hsnCode;
                if (updateData.placeOfSupply !== undefined)
                    updateFields.placeOfSupply = updateData.placeOfSupply;
                const updatedInvoice = await db.invoice.update({
                    where: { id: pathParameters.invoiceId },
                    data: updateFields,
                    include: {
                        invoiceItems: true,
                        school: { select: { name: true } },
                        user: { select: { firstName: true, lastName: true, email: true } }
                    }
                });
                logger_1.logger.info('Invoice updated successfully', {
                    requestId,
                    invoiceId: updatedInvoice.id,
                    invoiceNumber: updatedInvoice.invoiceNumber,
                    updatedBy: authResult.id,
                    fieldsUpdated: Object.keys(updateFields),
                    oldStatus: existingInvoice.status,
                    newStatus: updatedInvoice.status
                });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'Invoice updated successfully',
                        invoice: {
                            id: updatedInvoice.id,
                            invoiceNumber: updatedInvoice.invoiceNumber,
                            invoiceDate: updatedInvoice.invoiceDate,
                            dueDate: updatedInvoice.dueDate,
                            subtotal: updatedInvoice.subtotal,
                            taxAmount: updatedInvoice.taxAmount,
                            discountAmount: updatedInvoice.discountAmount,
                            totalAmount: updatedInvoice.totalAmount,
                            currency: updatedInvoice.currency,
                            status: updatedInvoice.status,
                            sentDate: updatedInvoice.sentDate,
                            gstNumber: updatedInvoice.gstNumber,
                            gstRate: updatedInvoice.gstRate,
                            hsnCode: updatedInvoice.hsnCode,
                            placeOfSupply: updatedInvoice.placeOfSupply,
                            createdAt: updatedInvoice.createdAt,
                            updatedAt: updatedInvoice.updatedAt,
                            school: updatedInvoice.school,
                            user: updatedInvoice.user,
                            items: updatedInvoice.invoiceItems.map(item => ({
                                id: item.id,
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.totalPrice,
                                taxRate: item.taxRate,
                                taxAmount: item.taxAmount,
                                itemType: item.itemType,
                                itemCode: item.itemCode,
                                hsnCode: item.hsnCode
                            }))
                        }
                    })
                };
            case 'DELETE':
                if (!pathParameters.invoiceId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invoice ID is required for deletion',
                            code: 'MISSING_INVOICE_ID'
                        })
                    };
                }
                await db.invoice.update({
                    where: { id: pathParameters.invoiceId },
                    data: { status: 'cancelled' }
                });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'Invoice cancelled successfully'
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
        logger_1.logger.error('Invoice generator request failed', {
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
exports.invoiceGeneratorHandler = invoiceGeneratorHandler;
exports.default = exports.invoiceGeneratorHandler;
//# sourceMappingURL=invoice-generator.js.map