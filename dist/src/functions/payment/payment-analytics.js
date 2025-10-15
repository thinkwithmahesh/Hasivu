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
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('Authentication required', 'User authentication required', 401);
        }
        logger_1.logger.info('Getting payment analytics', { userId });
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { schoolId: true, role: true },
        });
        if (!user) {
            return (0, response_utils_1.createErrorResponse)('User not found', 'User not found', 404);
        }
        let whereClause = {};
        if (!['admin', 'super_admin'].includes(user.role)) {
            whereClause = {
                paymentOrder: {
                    order: {
                        schoolId: user.schoolId,
                    },
                },
            };
        }
        const [totalPayments, successfulPayments, failedPayments, totalAmountResult, refundedAmountResult, paymentsByMethod, paymentsByStatus, recentPayments,] = await Promise.all([
            prisma.paymentTransaction.count({ where: whereClause }),
            prisma.paymentTransaction.count({
                where: {
                    ...whereClause,
                    status: 'captured',
                },
            }),
            prisma.paymentTransaction.count({
                where: {
                    ...whereClause,
                    status: 'failed',
                },
            }),
            prisma.paymentTransaction.aggregate({
                where: whereClause,
                _sum: { amount: true },
            }),
            prisma.paymentRefund.aggregate({
                _sum: { amount: true },
            }),
            prisma.paymentTransaction.groupBy({
                by: ['method'],
                where: whereClause,
                _count: true,
            }),
            prisma.paymentTransaction.groupBy({
                by: ['status'],
                where: whereClause,
                _count: true,
            }),
            prisma.paymentTransaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    method: true,
                    createdAt: true,
                },
            }),
        ]);
        const totalAmount = Number(totalAmountResult._sum.amount || 0);
        const refundedAmount = Number(refundedAmountResult._sum.amount || 0);
        const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
        const paymentsByMethodMap = {};
        paymentsByMethod.forEach(item => {
            paymentsByMethodMap[item.method || 'unknown'] = item._count;
        });
        const paymentsByStatusMap = {};
        paymentsByStatus.forEach(item => {
            paymentsByStatusMap[item.status] = item._count;
        });
        const response = {
            totalPayments,
            totalAmount,
            successfulPayments,
            failedPayments,
            refundedAmount,
            averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
            paymentsByMethod: paymentsByMethodMap,
            paymentsByStatus: paymentsByStatusMap,
            recentPayments: recentPayments.map(p => ({
                id: p.id,
                amount: Number(p.amount),
                status: p.status,
                method: p.method || undefined,
                createdAt: p.createdAt,
            })),
        };
        logger_1.logger.info('Payment analytics retrieved', {
            totalPayments,
            totalAmount,
            userId,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                analytics: response,
            },
            message: 'Payment analytics retrieved successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get payment analytics', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return (0, response_utils_1.handleError)(error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.handler = handler;
//# sourceMappingURL=payment-analytics.js.map