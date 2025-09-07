"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderItemRepository = exports.OrderItemRepository = void 0;
const client_1 = require("@prisma/client");
const database_service_1 = require("../services/database.service");
const logger_1 = require("../utils/logger");
class OrderItemRepository {
    static async create(data) {
        try {
            const orderItem = await database_service_1.DatabaseService.client.orderItem.create({
                data
            });
            logger_1.logger.debug('OrderItem created', { orderItemId: orderItem.id });
            return orderItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to create order item', error, { data });
            throw error;
        }
    }
    static async createMany(data) {
        try {
            const result = await database_service_1.DatabaseService.client.orderItem.createMany({
                data
            });
            logger_1.logger.debug('OrderItems created in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to create order items in batch', error, { data });
            throw error;
        }
    }
    static async findById(id) {
        try {
            const orderItem = await database_service_1.DatabaseService.client.orderItem.findUnique({
                where: { id }
            });
            return orderItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to find order item by ID', error, { orderItemId: id });
            throw error;
        }
    }
    static async findByIdWithIncludes(id, include) {
        try {
            const orderItem = await database_service_1.DatabaseService.client.orderItem.findUnique({
                where: { id },
                include
            });
            return orderItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to find order item by ID with includes', error, { orderItemId: id });
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
                database_service_1.DatabaseService.client.orderItem.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    ...(include && { include })
                }),
                database_service_1.DatabaseService.client.orderItem.count({ where })
            ]);
            return { items, total };
        }
        catch (error) {
            logger_1.logger.error('Failed to find order items', error, { options });
            throw error;
        }
    }
    static async update(id, data) {
        try {
            const orderItem = await database_service_1.DatabaseService.client.orderItem.update({
                where: { id },
                data
            });
            logger_1.logger.debug('OrderItem updated', { orderItemId: orderItem.id });
            return orderItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to update order item', error, { orderItemId: id, data });
            throw error;
        }
    }
    static async delete(id) {
        try {
            const orderItem = await database_service_1.DatabaseService.client.orderItem.delete({
                where: { id }
            });
            logger_1.logger.debug('OrderItem deleted', { orderItemId: orderItem.id });
            return orderItem;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete order item', error, { orderItemId: id });
            throw error;
        }
    }
    static async findByOrderId(orderId, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { orderId }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find order items by order ID', error, { orderId });
            throw error;
        }
    }
    static async findByMenuItemId(menuItemId, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters: { menuItemId }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find order items by menu item ID', error, { menuItemId });
            throw error;
        }
    }
    static async count(filters = {}) {
        try {
            const count = await database_service_1.DatabaseService.client.orderItem.count({
                where: filters
            });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Failed to count order items', error, { filters });
            throw error;
        }
    }
    static async getPopularItems(filters = {}, limit = 10) {
        try {
            const whereClause = this.buildWhereClause(filters);
            const popularItems = await database_service_1.DatabaseService.client.$queryRaw `
        SELECT 
          oi.menuItemId,
          mi.name as menuItemName,
          SUM(oi.quantity) as totalQuantity,
          COUNT(DISTINCT oi.orderId) as orderCount,
          SUM(oi.price * oi.quantity) as revenue
        FROM OrderItem oi
        INNER JOIN MenuItem mi ON oi.menuItemId = mi.id
        INNER JOIN Order o ON oi.orderId = o.id
        ${whereClause.length > 0 ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(whereClause, ' AND ')}` : client_1.Prisma.empty}
        GROUP BY oi.menuItemId, mi.name
        ORDER BY totalQuantity DESC, orderCount DESC
        LIMIT ${limit}
      `;
            return popularItems.map(item => ({
                menuItemId: item.menuItemId,
                menuItemName: item.menuItemName,
                totalQuantity: parseInt(item.totalQuantity),
                orderCount: parseInt(item.orderCount),
                revenue: parseFloat(item.revenue)
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get popular items', error, { filters, limit });
            throw error;
        }
    }
    static async getStatistics(filters = {}) {
        try {
            const where = {};
            if (filters.orderId)
                where.orderId = filters.orderId;
            if (filters.menuItemId)
                where.menuItemId = filters.menuItemId;
            if (filters.createdAt)
                where.createdAt = filters.createdAt;
            const stats = await database_service_1.DatabaseService.client.orderItem.aggregate({
                where,
                _count: { id: true },
                _sum: {
                    quantity: true,
                    unitPrice: true,
                    totalPrice: true
                }
            });
            const uniqueOrders = await database_service_1.DatabaseService.client.orderItem.groupBy({
                by: ['orderId'],
                where,
                _count: { orderId: true }
            });
            const totalOrders = uniqueOrders.length;
            const totalQuantity = stats._sum.quantity || 0;
            const totalRevenue = Number(stats._sum.totalPrice || 0);
            return {
                totalItems: stats._count.id,
                totalQuantity,
                totalRevenue,
                averageQuantityPerOrder: totalOrders > 0 ? totalQuantity / totalOrders : 0,
                averageRevenuePerOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get order item statistics', error, { filters });
            throw error;
        }
    }
    static async updateMany(where, data) {
        try {
            const result = await database_service_1.DatabaseService.client.orderItem.updateMany({
                where,
                data
            });
            logger_1.logger.debug('OrderItems updated in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to update order items in batch', error, { where, data });
            throw error;
        }
    }
    static async deleteMany(where) {
        try {
            const result = await database_service_1.DatabaseService.client.orderItem.deleteMany({
                where
            });
            logger_1.logger.debug('OrderItems deleted in batch', { count: result.count });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete order items in batch', error, { where });
            throw error;
        }
    }
    static async findWithMenuItems(filters = {}, options = {}) {
        try {
            return await this.findMany({
                ...options,
                filters,
                include: {
                    menuItem: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            category: true,
                            price: true,
                            imageUrl: true,
                            allergens: true,
                            nutritionalInfo: true
                        }
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to find order items with menu items', error, { filters });
            throw error;
        }
    }
    static async getRevenueBreakdown(filters = {}) {
        try {
            const whereClause = this.buildWhereClause(filters);
            const breakdown = await database_service_1.DatabaseService.client.$queryRaw `
        SELECT 
          oi.menuItemId,
          mi.name as menuItemName,
          SUM(oi.price * oi.quantity) as totalRevenue,
          SUM(oi.quantity) as totalQuantity,
          AVG(oi.price) as averagePrice
        FROM OrderItem oi
        INNER JOIN MenuItem mi ON oi.menuItemId = mi.id
        INNER JOIN Order o ON oi.orderId = o.id
        ${whereClause.length > 0 ? client_1.Prisma.sql `WHERE ${client_1.Prisma.join(whereClause, ' AND ')}` : client_1.Prisma.empty}
        GROUP BY oi.menuItemId, mi.name
        ORDER BY totalRevenue DESC
      `;
            return breakdown.map(item => ({
                menuItemId: item.menuItemId,
                menuItemName: item.menuItemName,
                totalRevenue: parseFloat(item.totalRevenue),
                totalQuantity: parseInt(item.totalQuantity),
                averagePrice: parseFloat(item.averagePrice)
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get revenue breakdown', error, { filters });
            throw error;
        }
    }
    static buildWhereClause(filters) {
        const whereClause = [];
        if (filters.schoolId) {
            whereClause.push(client_1.Prisma.sql `o.schoolId = ${filters.schoolId}`);
        }
        if (filters.createdAt?.gte) {
            whereClause.push(client_1.Prisma.sql `o.createdAt >= ${filters.createdAt.gte}`);
        }
        if (filters.createdAt?.lte) {
            whereClause.push(client_1.Prisma.sql `o.createdAt <= ${filters.createdAt.lte}`);
        }
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                whereClause.push(client_1.Prisma.sql `o.status IN (${client_1.Prisma.join(filters.status)})`);
            }
            else {
                whereClause.push(client_1.Prisma.sql `o.status = ${filters.status}`);
            }
        }
        return whereClause;
    }
}
exports.OrderItemRepository = OrderItemRepository;
exports.orderItemRepository = new OrderItemRepository();
//# sourceMappingURL=orderItem.repository.js.map