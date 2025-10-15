"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managePaymentMethodsHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const database_service_1 = require("../shared/database.service");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const database = database_service_1.LambdaDatabaseService.getInstance();
const createPaymentMethodSchema = zod_1.z.object({
    methodType: zod_1.z.string().min(1).max(50),
    provider: zod_1.z.string().min(1).max(50),
    providerMethodId: zod_1.z.string().min(1).max(100),
    cardLast4: zod_1.z.string().regex(/^\d{4}$/).optional(),
    cardBrand: zod_1.z.string().max(50).optional(),
    cardNetwork: zod_1.z.string().max(50).optional(),
    cardType: zod_1.z.string().max(50).optional(),
    upiHandle: zod_1.z.string().max(100).optional(),
    walletProvider: zod_1.z.string().max(50).optional(),
    isDefault: zod_1.z.boolean().default(false)
});
const updatePaymentMethodSchema = zod_1.z.object({
    isDefault: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional()
});
const listPaymentMethodsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(50),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
    methodType: zod_1.z.string().optional(),
    provider: zod_1.z.string().max(50).optional(),
    includeInactive: zod_1.z.coerce.boolean().default(false)
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'student';
    if (!userId) {
        logger.warn('Payment method access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed'
        });
        throw new Error('Authentication required');
    }
    if (!schoolId) {
        throw new Error('School context required');
    }
    const user = await database.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true }
    });
    if (!user || user.status !== 'ACTIVE') {
        throw new Error('Access denied');
    }
    return { userId, schoolId, role };
}
async function getUserPaymentMethods(userId, schoolId, query, requestId) {
    try {
        const whereClause = { userId };
        if (!query.includeInactive) {
            whereClause.isActive = true;
        }
        if (query.methodType) {
            whereClause.methodType = query.methodType;
        }
        if (query.provider) {
            whereClause.provider = {
                contains: query.provider,
                mode: 'insensitive'
            };
        }
        const [paymentMethods, total] = await Promise.all([
            database.prisma.paymentMethod.findMany({
                where: whereClause,
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip: query.offset,
                take: query.limit
            }),
            database.prisma.paymentMethod.count({
                where: whereClause
            })
        ]);
        logger.info('Payment methods retrieved', {
            requestId,
            userId,
            total,
            returned: paymentMethods.length
        });
        return {
            paymentMethods: paymentMethods.map(pm => ({
                ...pm,
                upiHandle: pm.upiHandle ? pm.upiHandle.replace(/(.{2}).*(@.*)/, '$1***$2') : pm.upiHandle
            })),
            total
        };
    }
    catch (error) {
        logger.error('Failed to get payment methods', {
            requestId,
            userId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        throw error;
    }
}
async function createPaymentMethod(data, userId, schoolId, requestId) {
    try {
        const validatedData = createPaymentMethodSchema.parse(data);
        const existingCount = await database.prisma.paymentMethod.count({
            where: { userId, isActive: true }
        });
        if (existingCount >= 10) {
            throw new Error('Maximum payment methods limit (10) exceeded');
        }
        const result = await database.transaction(async (prisma) => {
            if (validatedData.isDefault) {
                await prisma.paymentMethod.updateMany({
                    where: { userId, isActive: true, isDefault: true },
                    data: { isDefault: false }
                });
            }
            return await prisma.paymentMethod.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId,
                    methodType: validatedData.methodType,
                    provider: validatedData.provider,
                    providerMethodId: validatedData.providerMethodId,
                    cardLast4: validatedData.cardLast4,
                    cardBrand: validatedData.cardBrand,
                    cardNetwork: validatedData.cardNetwork,
                    cardType: validatedData.cardType,
                    upiHandle: validatedData.upiHandle,
                    walletProvider: validatedData.walletProvider,
                    isDefault: validatedData.isDefault,
                    isActive: true
                }
            });
        });
        logger.info('Payment method created', {
            requestId,
            userId,
            paymentMethodId: result.id,
            methodType: validatedData.methodType
        });
        return result;
    }
    catch (error) {
        logger.error('Failed to create payment method', {
            requestId,
            userId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        throw error;
    }
}
async function updatePaymentMethod(methodId, data, userId, schoolId, requestId) {
    try {
        const validatedData = updatePaymentMethodSchema.parse(data);
        const existing = await database.prisma.paymentMethod.findFirst({
            where: { id: methodId, userId, isActive: true }
        });
        if (!existing) {
            throw new Error('Payment method not found');
        }
        const result = await database.transaction(async (prisma) => {
            if (validatedData.isDefault) {
                await prisma.paymentMethod.updateMany({
                    where: { userId, isActive: true, id: { not: methodId } },
                    data: { isDefault: false }
                });
            }
            return await prisma.paymentMethod.update({
                where: { id: methodId },
                data: validatedData
            });
        });
        logger.info('Payment method updated', {
            requestId,
            userId,
            methodId
        });
        return result;
    }
    catch (error) {
        logger.error('Failed to update payment method', {
            requestId,
            userId,
            methodId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        throw error;
    }
}
async function deletePaymentMethod(methodId, userId, schoolId, requestId) {
    try {
        const existing = await database.prisma.paymentMethod.findFirst({
            where: { id: methodId, userId, isActive: true }
        });
        if (!existing) {
            throw new Error('Payment method not found');
        }
        await database.prisma.paymentMethod.update({
            where: { id: methodId },
            data: {
                isActive: false,
                isDefault: false
            }
        });
        logger.info('Payment method deleted', {
            requestId,
            userId,
            methodId
        });
    }
    catch (error) {
        logger.error('Failed to delete payment method', {
            requestId,
            userId,
            methodId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        throw error;
    }
}
const managePaymentMethodsHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Payment method management request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        const { userId, schoolId } = await validateUserAccess(event, requestId);
        const methodId = event.pathParameters?.methodId;
        let result;
        switch (event.httpMethod) {
            case 'GET': {
                const queryParams = event.queryStringParameters || {};
                const listQuery = listPaymentMethodsQuerySchema.parse(queryParams);
                const { paymentMethods, total } = await getUserPaymentMethods(userId, schoolId, listQuery, requestId);
                result = {
                    paymentMethods,
                    total,
                    pagination: {
                        offset: listQuery.offset,
                        limit: listQuery.limit,
                        hasMore: (listQuery.offset + listQuery.limit) < total
                    },
                    defaultMethod: paymentMethods.find(pm => pm.isDefault) || null
                };
                break;
            }
            case 'POST': {
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const createData = JSON.parse(event.body);
                const newPaymentMethod = await createPaymentMethod(createData, userId, schoolId, requestId);
                result = {
                    paymentMethod: newPaymentMethod,
                    message: 'Payment method created successfully'
                };
                break;
            }
            case 'PUT': {
                if (!methodId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing methodId in path parameters', undefined, 'MISSING_METHOD_ID', requestId);
                }
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const updateData = JSON.parse(event.body);
                const updatedPaymentMethod = await updatePaymentMethod(methodId, updateData, userId, schoolId, requestId);
                result = {
                    paymentMethod: updatedPaymentMethod,
                    message: 'Payment method updated successfully'
                };
                break;
            }
            case 'DELETE':
                if (!methodId) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Missing methodId in path parameters', undefined, 'MISSING_METHOD_ID', requestId);
                }
                await deletePaymentMethod(methodId, userId, schoolId, requestId);
                result = {
                    message: 'Payment method deleted successfully',
                    methodId
                };
                break;
            default:
                return (0, response_utils_1.createErrorResponse)(405, `Method ${event.httpMethod} not allowed`, undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        const duration = Date.now() - startTime;
        logger.info('Payment method management request completed', {
            requestId,
            method: event.httpMethod,
            userId,
            schoolId,
            methodId,
            duration,
            success: true
        });
        const statusCode = event.httpMethod === 'POST' ? 201 : 200;
        return (0, response_utils_1.createSuccessResponse)(result, 'Payment method operation completed successfully', statusCode, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Payment method management request failed', {
            requestId,
            method: event.httpMethod,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            duration
        });
        if (error instanceof Error) {
            if (error instanceof Error ? error.message : String(error).includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('not found')) {
                return (0, response_utils_1.createErrorResponse)(404, 'Payment method not found', undefined, 'NOT_FOUND', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('limit exceeded')) {
                return (0, response_utils_1.createErrorResponse)(409, error instanceof Error ? error.message : String(error), undefined, 'LIMIT_EXCEEDED', requestId);
            }
        }
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
    }
};
exports.managePaymentMethodsHandler = managePaymentMethodsHandler;
//# sourceMappingURL=manage-payment-methods.js.map