"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRepository = exports.OrderRepository = exports.OrderStatus = void 0;
const client_1 = require("@prisma/client");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY"] = "ready";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
class OrderRepository {
    static async create(data) {
        try {
            const order = await database_service_1.DatabaseService.client.order.create({
                data
            });
            logger_1.logger.debug('Order created', { orderId: order.id });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to create order', error, { data });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const order = await database_service_1.DatabaseService.client.order.findUnique({
                where: { id }
            });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to find order by ID', error, { orderId: id });
            throw error;
        }
    }
    static async findByIdWithIncludes(id, include) {
        try {
            const order = await database_service_1.DatabaseService.client.order.findUnique({
                where: { id },
                include
            });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to find order by ID with includes', error, { orderId: id });
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
                database_service_1.DatabaseService.client.order.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    ...(include && { include })
                }),
                database_service_1.DatabaseService.client.order.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders', error, { options });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const order = await database_service_1.DatabaseService.client.order.update({
                where: { id },
                data
            });
            logger_1.logger.debug('Order updated', { orderId: order.id });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to update order', error, { orderId: id, data });
            throw error;
        }
    }
    static async delete(id) {
        try {
            const order = await database_service_1.DatabaseService.client.order.delete({
                where: { id }
            });
            logger_1.logger.debug('Order deleted', { orderId: order.id });
            return order;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete order', error, { orderId: id });
            throw error;
        }
    }
    static async count(filters = {}) {
        try {
            const count = await database_service_1.DatabaseService.client.order.count({
                where: filters
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to count orders', error, { filters });
            throw error;
        }
    }
    static async getAnalytics(filters = {}, groupBy) {
        try {
            const [orderStats, statusGroups] = await Promise.all([
                database_service_1.DatabaseService.client.order.aggregate({
                    where: filters,
                    _count: { id: true },
                    _sum: { totalAmount: true }
                }),
                database_service_1.DatabaseService.client.order.groupBy({
                    by: ['status'],
                    where: filters,
                    _count: { id: true }
                })
            ]);
            const ordersByStatus = {
                [OrderStatus.PENDING]: 0,
                [OrderStatus.CONFIRMED]: 0,
                [OrderStatus.PREPARING]: 0,
                [OrderStatus.READY]: 0,
                [OrderStatus.OUT_FOR_DELIVERY]: 0,
                [OrderStatus.DELIVERED]: 0,
                [OrderStatus.CANCELLED]: 0
            };
            statusGroups.forEach(group => {
                ordersByStatus[group.status] = group._count.id;
            });
            let revenueByDay = [];
            if (groupBy === 'day') {
                const dailyStats = await database_service_1.DatabaseService.client.$queryRaw `
          SELECT 
            DATE(createdAt) as date,
            SUM(totalAmount) as revenue,
            COUNT(*) as orders
          FROM Order 
          WHERE createdAt >= ${filters.createdAt?.gte} 
            AND createdAt <= ${filters.createdAt?.lte}
            ${filters.schoolId ? client_1.Prisma.sql `AND schoolId = ${filters.schoolId}` : client_1.Prisma.empty}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `;
                revenueByDay = dailyStats.map(stat => ({
                    date: stat.date,
                    revenue: Number(stat.revenue),
                    orders: Number(stat.orders)
                }));
            }
            return {
                totalOrders: orderStats._count.id,
                totalRevenue: Number(orderStats._sum.totalAmount || 0),
                deliveredOrders: ordersByStatus[OrderStatus.DELIVERED],
                cancelledOrders: ordersByStatus[OrderStatus.CANCELLED],
                ordersByStatus,
                revenueByDay
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get order analytics', error, { filters });
            throw error;
        }
    }
    static async findByStudentId(studentId, options = {}) {
        try {
            const filters = { studentId };
            if (options.status) {
                filters.status = options.status;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders by student ID', error, { studentId });
            throw error;
        }
    }
    static async findByParentId(parentId, options = {}) {
        try {
            const filters = { parentId };
            if (options.status) {
                filters.status = options.status;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders by parent ID', error, { parentId });
            throw error;
        }
    }
    static async findBySchoolId(schoolId, options = {}) {
        try {
            const filters = { schoolId };
            if (options.status) {
                filters.status = options.status;
            }
            if (options.dateFrom || options.dateTo) {
                filters.createdAt = {};
                if (options.dateFrom)
                    filters.createdAt.gte = options.dateFrom;
                if (options.dateTo)
                    filters.createdAt.lte = options.dateTo;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders by school ID', error, { schoolId });
            throw error;
        }
    }
    static async findActiveOrders(filters = {}, options = {}) {
        try {
            const activeFilters = {
                ...filters,
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']
                }
            };
            return await this.findMany({
                ...options,
                filters: activeFilters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find active orders', error, { filters });
            throw error;
        }
    }
    static async findByDeliveryDate(deliveryDate, options = {}) {
        try {
            const startOfDay = new Date(deliveryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(deliveryDate);
            endOfDay.setHours(23, 59, 59, 999);
            const filters = {
                deliveryDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
            if (options.schoolId) {
                filters.schoolId = options.schoolId;
            }
            return await this.findMany({
                ...options,
                filters
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find orders by delivery date', error, { deliveryDate });
            throw error;
        }
    }
    static async updateMany(where, data) {
        try {
            const result = await database_service_1.DatabaseService.client.order.updateMany({
                where,
                data
            });
            logger_1.logger.debug('Orders updated in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update orders in batch', error, { where, data });
            throw error;
        }
    }
    static async getDashboardStats(schoolId, dateRange) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const baseWhere = {};
            if (schoolId)
                baseWhere.schoolId = schoolId;
            const [todayStats, pendingCount, completedStats] = await Promise.all([
                database_service_1.DatabaseService.client.order.aggregate({
                    where: {
                        ...baseWhere,
                        createdAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    },
                    _count: { id: true }
                }),
                database_service_1.DatabaseService.client.order.count({
                    where: {
                        ...baseWhere,
                        status: {
                            in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']
                        }
                    }
                }),
                database_service_1.DatabaseService.client.order.aggregate({
                    where: {
                        ...baseWhere,
                        status: 'DELIVERED',
                        ...(dateRange && {
                            createdAt: {
                                gte: dateRange.from,
                                lte: dateRange.to
                            }
                        })
                    },
                    _count: { id: true },
                    _sum: { totalAmount: true }
                })
            ]);
            const totalRevenue = Number(completedStats._sum.totalAmount || 0);
            const averageOrderValue = completedStats._count.id > 0 ?
                totalRevenue / completedStats._count.id : 0;
            return {
                todayOrders: todayStats._count.id,
                pendingOrders: pendingCount,
                completedOrders: completedStats._count.id,
                totalRevenue,
                averageOrderValue
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get dashboard stats', error, { schoolId, dateRange });
            throw error;
        }
    }
}
exports.OrderRepository = OrderRepository;
exports.orderRepository = new OrderRepository();
//# sourceMappingURL=order.repository.js.map