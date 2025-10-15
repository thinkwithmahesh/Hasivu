"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getPaymentMethods = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const DatabaseManager_1 = require("@/database/DatabaseManager");
const uuid_1 = require("uuid");
function validatePaymentMethodData(data) {
    const { methodType, provider } = data;
    if (!methodType || !provider) {
        throw new Error('methodType and provider are required');
    }
    const validMethodTypes = ['card', 'upi', 'wallet', 'bank_transfer'];
    if (!validMethodTypes.includes(methodType)) {
        throw new Error(`Invalid methodType. Must be one of: ${validMethodTypes.join(', ')}`);
    }
    switch (methodType) {
        case 'card':
            if (!data.cardLast4 || !data.cardBrand) {
                throw new Error('cardLast4 and cardBrand are required for card payments');
            }
            break;
        case 'upi':
            if (!data.upiHandle) {
                throw new Error('upiHandle is required for UPI payments');
            }
            break;
        case 'wallet':
            if (!data.walletProvider) {
                throw new Error('walletProvider is required for wallet payments');
            }
            break;
    }
}
const getPaymentMethods = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('getPaymentMethods', { event, context });
    try {
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const paymentMethods = await DatabaseManager_1.prisma.paymentMethod.findMany({
            where: {
                userId,
                isActive: true,
            },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
        const response = paymentMethods.map(method => ({
            id: method.id,
            methodType: method.methodType,
            provider: method.provider,
            cardLast4: method.cardLast4 || undefined,
            cardBrand: method.cardBrand || undefined,
            cardNetwork: method.cardNetwork || undefined,
            cardType: method.cardType || undefined,
            upiHandle: method.upiHandle || undefined,
            walletProvider: method.walletProvider || undefined,
            isDefault: method.isDefault,
            isActive: method.isActive,
            createdAt: method.createdAt,
            updatedAt: method.updatedAt,
        }));
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('getPaymentMethods', {
            statusCode: 200,
            duration,
            count: response.length,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                paymentMethods: response,
            },
            message: `Retrieved ${response.length} payment methods`,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('getPaymentMethods', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve payment methods');
    }
};
exports.getPaymentMethods = getPaymentMethods;
const createPaymentMethod = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('createPaymentMethod', { event, context });
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing create payment method request', {
            userId,
            methodType: body.methodType,
        });
        validatePaymentMethodData(body);
        if (body.isDefault) {
            await DatabaseManager_1.prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const paymentMethodData = {
            id: (0, uuid_1.v4)(),
            userId,
            methodType: body.methodType,
            provider: body.provider,
            isDefault: body.isDefault || false,
            isActive: true,
        };
        if (body.providerMethodId)
            paymentMethodData.providerMethodId = body.providerMethodId;
        if (body.cardLast4)
            paymentMethodData.cardLast4 = body.cardLast4;
        if (body.cardBrand)
            paymentMethodData.cardBrand = body.cardBrand;
        if (body.cardNetwork)
            paymentMethodData.cardNetwork = body.cardNetwork;
        if (body.cardType)
            paymentMethodData.cardType = body.cardType;
        if (body.upiHandle)
            paymentMethodData.upiHandle = body.upiHandle;
        if (body.walletProvider)
            paymentMethodData.walletProvider = body.walletProvider;
        const paymentMethod = await DatabaseManager_1.prisma.paymentMethod.create({
            data: paymentMethodData,
        });
        const response = {
            id: paymentMethod.id,
            methodType: paymentMethod.methodType,
            provider: paymentMethod.provider,
            cardLast4: paymentMethod.cardLast4 || undefined,
            cardBrand: paymentMethod.cardBrand || undefined,
            cardNetwork: paymentMethod.cardNetwork || undefined,
            cardType: paymentMethod.cardType || undefined,
            upiHandle: paymentMethod.upiHandle || undefined,
            walletProvider: paymentMethod.walletProvider || undefined,
            isDefault: paymentMethod.isDefault,
            isActive: paymentMethod.isActive,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('createPaymentMethod', {
            statusCode: 201,
            duration,
            paymentMethodId: paymentMethod.id,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                paymentMethod: response,
            },
            message: 'Payment method created successfully',
        }, 201);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('createPaymentMethod', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to create payment method');
    }
};
exports.createPaymentMethod = createPaymentMethod;
const updatePaymentMethod = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('updatePaymentMethod', { event, context });
    try {
        if (event.httpMethod !== 'PUT') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const paymentMethodId = event.pathParameters?.paymentMethodId;
        if (!paymentMethodId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_PAYMENT_METHOD_ID', 'Payment method ID required', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const body = JSON.parse(event.body || '{}');
        if (body.isDefault) {
            await DatabaseManager_1.prisma.paymentMethod.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }
        const paymentMethod = await DatabaseManager_1.prisma.paymentMethod.update({
            where: {
                id: paymentMethodId,
                userId,
            },
            data: {
                providerMethodId: body.providerMethodId,
                cardLast4: body.cardLast4,
                cardBrand: body.cardBrand,
                cardNetwork: body.cardNetwork,
                cardType: body.cardType,
                upiHandle: body.upiHandle,
                walletProvider: body.walletProvider,
                isDefault: body.isDefault,
                updatedAt: new Date(),
            },
        });
        const response = {
            id: paymentMethod.id,
            methodType: paymentMethod.methodType,
            provider: paymentMethod.provider,
            cardLast4: paymentMethod.cardLast4 || undefined,
            cardBrand: paymentMethod.cardBrand || undefined,
            cardNetwork: paymentMethod.cardNetwork || undefined,
            cardType: paymentMethod.cardType || undefined,
            upiHandle: paymentMethod.upiHandle || undefined,
            walletProvider: paymentMethod.walletProvider || undefined,
            isDefault: paymentMethod.isDefault,
            isActive: paymentMethod.isActive,
            createdAt: paymentMethod.createdAt,
            updatedAt: paymentMethod.updatedAt,
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('updatePaymentMethod', { statusCode: 200, duration, paymentMethodId });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                paymentMethod: response,
            },
            message: 'Payment method updated successfully',
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('updatePaymentMethod', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to update payment method');
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
const deletePaymentMethod = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('deletePaymentMethod', { event, context });
    try {
        if (event.httpMethod !== 'DELETE') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const paymentMethodId = event.pathParameters?.paymentMethodId;
        if (!paymentMethodId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_PAYMENT_METHOD_ID', 'Payment method ID required', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const activeSubscriptions = await DatabaseManager_1.prisma.subscription.count({
            where: {
                userId,
                paymentMethodId,
                status: { in: ['active', 'trial'] },
            },
        });
        if (activeSubscriptions > 0) {
            return (0, response_utils_1.createErrorResponse)('PAYMENT_METHOD_IN_USE', 'Cannot delete payment method currently used by active subscriptions', 400);
        }
        await DatabaseManager_1.prisma.paymentMethod.update({
            where: {
                id: paymentMethodId,
                userId,
            },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('deletePaymentMethod', { statusCode: 200, duration, paymentMethodId });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Payment method deleted successfully',
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('deletePaymentMethod', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to delete payment method');
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
const handler = async (event, context) => {
    const { httpMethod, path } = event;
    if (httpMethod === 'GET' && path.endsWith('/methods')) {
        return (0, exports.getPaymentMethods)(event, context);
    }
    if (httpMethod === 'POST' && path.endsWith('/methods')) {
        return (0, exports.createPaymentMethod)(event, context);
    }
    if (httpMethod === 'PUT' && path.includes('/methods/')) {
        return (0, exports.updatePaymentMethod)(event, context);
    }
    if (httpMethod === 'DELETE' && path.includes('/methods/')) {
        return (0, exports.deletePaymentMethod)(event, context);
    }
    return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed for this endpoint', 405);
};
exports.handler = handler;
//# sourceMappingURL=manage-payment-methods.js.map