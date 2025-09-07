"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentOrderRepository = exports.PaymentOrderRepository = exports.PaymentStatus = void 0;
const client_1 = require("@prisma/client");
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
class PaymentOrderRepository {
    static async create(data) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.create({
                data
            });
            logger_1.logger.debug('PaymentOrder created', { paymentOrderId: paymentOrder.id });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to create payment order', error, { data });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.findUnique({
                where: { id }
            });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment order by ID', error, { paymentOrderId: id });
            throw error;
        }
    }
    static async findByIdWithIncludes(id, include) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.findUnique({
                where: { id },
                include
            });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment order by ID with includes', error, { paymentOrderId: id });
            throw error;
        }
    }
    static async findByOrderId(orderId) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.findFirst({
                where: { orderId },
                orderBy: { createdAt: 'desc' }
            });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment order by order ID', error, { orderId });
            throw error;
        }
    }
    static async findByRazorpayOrderId(razorpayOrderId) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.findFirst({
                where: { razorpayOrderId }
            });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment order by Razorpay order ID', error, { razorpayOrderId });
            throw error;
        }
    }
    static async findMany(options = {}) {
        try {
            const { filters = {}, skip = 0, take = 20, sortBy = 'createdAt', sortOrder = 'desc', include } = options;
            const where = { ...filters };
            const orderBy = {
                [sortBy]: sortOrder
            };
            const [items, total] = await Promise.all([
                database_service_1.DatabaseService.client.paymentOrder.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    ...(include && { include })
                }),
                database_service_1.DatabaseService.client.paymentOrder.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment orders', error, { options });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.update({
                where: { id },
                data
            });
            logger_1.logger.debug('PaymentOrder updated', { paymentOrderId: paymentOrder.id });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to update payment order', error, { paymentOrderId: id, data });
            throw error;
        }
    }
    static async delete(id) {
        try {
            const paymentOrder = await database_service_1.DatabaseService.client.paymentOrder.delete({
                where: { id }
            });
            logger_1.logger.debug('PaymentOrder deleted', { paymentOrderId: paymentOrder.id });
            return paymentOrder;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete payment order', error, { paymentOrderId: id });
            throw error;
        }
    }
    static async count(filters = {}) {
        try {
            const count = await database_service_1.DatabaseService.client.paymentOrder.count({
                where: filters
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to count payment orders', error, { filters });
            throw error;
        }
    }
    static async findByStatus(status, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { status }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment orders by status', error, { status });
            throw error;
        }
    }
    static async findByMethod(method, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { method }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find payment orders by method', error, { method });
            throw error;
        }
    }
    static async findPendingPayments(options = {}) {
        try {
            return await this.findByStatus(PaymentStatus.PENDING, options);
        }
        catch (error) {
            logger_1.logger.error('Failed to find pending payment orders', error);
            throw error;
        }
    }
    static async findFailedPayments(filters = {}, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: {
                    ...filters,
                    status: 'failed'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find failed payment orders', error, { filters });
            throw error;
        }
    }
    static async getStatistics(filters = {}) {
        try {
            const where = { ...filters };
            const [stats, statusGroups] = await Promise.all([
                database_service_1.DatabaseService.client.paymentOrder.aggregate({
                    where,
                    _count: { id: true },
                    _sum: { amount: true },
                    _avg: { amount: true }
                }),
                database_service_1.DatabaseService.client.paymentOrder.groupBy({
                    by: ['status'],
                    where,
                    _count: { id: true }
                })
            ]);
            const statusCounts = {
                pending: 0,
                captured: 0,
                failed: 0
            };
            statusGroups.forEach(group => {
                statusCounts[group.status] = group._count.id;
            });
            const paymentsByMethod = {};
            const totalPayments = stats._count.id;
            const successfulPayments = statusCounts.captured;
            const failedPayments = statusCounts.failed;
            const pendingPayments = statusCounts.pending;
            return {
                totalPayments,
                totalAmount: Number(stats._sum.amount || 0),
                successfulPayments,
                failedPayments,
                pendingPayments,
                successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
                averageAmount: Number(stats._avg.amount || 0),
                paymentsByMethod
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get payment statistics', error, { filters });
            throw error;
        }
    }
    static async findByDateRange(startDate, endDate, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find payments by date range', error, { startDate, endDate });
            throw error;
        }
    }
    static async findSuccessfulPayments(startDate, endDate, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: {
                    status: 'captured',
                    paidAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find successful payments', error, { startDate, endDate });
            throw error;
        }
    }
    static async updateMany(where, data) {
        try {
            const result = await database_service_1.DatabaseService.client.paymentOrder.updateMany({
                where,
                data
            });
            logger_1.logger.debug('PaymentOrders updated in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update payment orders in batch', error, { where, data });
            throw error;
        }
    }
    static async getDailySummary(date, filters = {}) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const whereClause = {
                ...filters,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
            const stats = await this.getStatistics(whereClause);
            return {
                date: date.toISOString().split('T')[0],
                totalPayments: stats.totalPayments,
                totalAmount: stats.totalAmount,
                successfulPayments: stats.successfulPayments,
                failedPayments: stats.failedPayments,
                pendingPayments: stats.pendingPayments,
                successRate: stats.successRate
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get daily payment summary', error, { date, filters });
            throw error;
        }
    }
    static async findPaymentsForReconciliation(olderThan, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: {
                    status: 'pending',
                    createdAt: {
                        lt: olderThan
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find payments for reconciliation', error, { olderThan });
            throw error;
        }
    }
    static async getRevenueReport(startDate, endDate, groupBy = 'day') {
        try {
            let dateFormat;
            let dateGroup;
            switch (groupBy) {
                case 'week':
                    dateFormat = '%Y-%u';
                    dateGroup = 'YEARWEEK(paidAt)';
                    break;
                case 'month':
                    dateFormat = '%Y-%m';
                    dateGroup = 'DATE_FORMAT(paidAt, "%Y-%m")';
                    break;
                default:
                    dateFormat = '%Y-%m-%d';
                    dateGroup = 'DATE(paidAt)';
            }
            const results = await database_service_1.DatabaseService.client.$queryRaw `
        SELECT 
          DATE_FORMAT(paidAt, ${dateFormat}) as period,
          SUM(amount) as totalAmount,
          COUNT(*) as paymentCount,
          AVG(amount) as averageAmount
        FROM PaymentOrder
        WHERE status = 'captured' 
          AND paidAt >= ${startDate}
          AND paidAt <= ${endDate}
        GROUP BY ${client_1.Prisma.raw(dateGroup)}
        ORDER BY period ASC
      `;
            return results.map(result => ({
                period: result.period,
                totalAmount: parseFloat(result.totalAmount),
                paymentCount: parseInt(result.paymentCount),
                averageAmount: parseFloat(result.averageAmount)
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get revenue report', error, { startDate, endDate, groupBy });
            throw error;
        }
    }
}
exports.PaymentOrderRepository = PaymentOrderRepository;
exports.paymentOrderRepository = new PaymentOrderRepository();
//# sourceMappingURL=paymentOrder.repository.js.map