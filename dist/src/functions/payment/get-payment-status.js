"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const handler = async (event, context) => {
    try {
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 'Only GET method is allowed', 405);
        }
        const paymentId = event.pathParameters?.paymentId;
        if (!paymentId) {
            return (0, response_utils_1.createErrorResponse)('Missing payment ID', 'paymentId is required in path', 400);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Getting payment status', { paymentId, userId });
        const paymentTransaction = await prisma.paymentTransaction.findUnique({
            where: { id: paymentId },
            include: {
                paymentOrder: true,
            },
        });
        if (!paymentTransaction) {
            return (0, response_utils_1.createErrorResponse)('Payment not found', 'Payment transaction not found', 404);
        }
        if (paymentTransaction.paymentOrder?.userId !== userId) {
            const order = paymentTransaction.paymentOrder?.orderId
                ? await prisma.order.findUnique({
                    where: { id: paymentTransaction.paymentOrder.orderId },
                })
                : null;
            const adminUser = await prisma.user.findFirst({
                where: {
                    id: userId,
                    schoolId: order?.schoolId,
                    role: { in: ['school_admin', 'admin', 'super_admin'] },
                    isActive: true,
                },
            });
            if (!adminUser) {
                return (0, response_utils_1.createErrorResponse)('Access denied', 'Not authorized to view this payment', 403);
            }
        }
        const response = {
            id: paymentTransaction.id,
            razorpayOrderId: paymentTransaction.paymentOrderId,
            razorpayPaymentId: paymentTransaction.razorpayPaymentId,
            orderId: paymentTransaction.paymentOrder?.orderId || undefined,
            amount: Number(paymentTransaction.amount),
            currency: paymentTransaction.currency,
            status: paymentTransaction.status,
            method: paymentTransaction.method || undefined,
            capturedAt: paymentTransaction.capturedAt || undefined,
            refundedAt: paymentTransaction.refundedAt || undefined,
            createdAt: paymentTransaction.createdAt,
        };
        logger_1.logger.info('Payment status retrieved', {
            paymentId,
            status: paymentTransaction.status,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                payment: response,
            },
            message: 'Payment status retrieved successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment status', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=get-payment-status.js.map