"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedOrderService = exports.EnhancedOrderService = void 0;
const order_service_1 = require("./order.service");
const notification_service_1 = require("./notification.service");
const payment_service_1 = require("./payment.service");
class EnhancedOrderService extends order_service_1.OrderService {
    static enhancedInstance;
    notificationService;
    paymentService;
    constructor() {
        super();
        this.notificationService = notification_service_1.NotificationService.getInstance();
        this.paymentService = payment_service_1.PaymentService.getInstance();
    }
    static getInstance() {
        if (!EnhancedOrderService.enhancedInstance) {
            EnhancedOrderService.enhancedInstance = new EnhancedOrderService();
        }
        return EnhancedOrderService.enhancedInstance;
    }
    async createWithNotification(data, notifyStudent = true) {
        const order = await this.create(data);
        if (notifyStudent) {
            await this.notificationService.create({
                userId: data.studentId,
                type: 'order_created',
                title: 'Order Placed',
                message: `Your order #${order.id} has been placed successfully`,
                data: { orderId: order.id },
            });
        }
        return order;
    }
    async updateStatusWithNotification(id, status) {
        const order = await this.updateStatus(id, status);
        await this.notificationService.create({
            userId: order.studentId,
            type: 'order_status_updated',
            title: 'Order Status Updated',
            message: `Your order #${id} is now ${status}`,
            data: { orderId: id, status },
        });
        return order;
    }
    async getAnalytics(schoolId, startDate, endDate) {
        const orders = startDate && endDate
            ? await this.findAll({ schoolId, startDate, endDate })
            : await this.findBySchool(schoolId);
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const ordersByStatus = {};
        orders.forEach(order => {
            ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        });
        const ordersByDay = {};
        orders.forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            ordersByDay[dateKey] = (ordersByDay[dateKey] || 0) + 1;
        });
        const studentStats = {};
        orders.forEach(order => {
            if (!studentStats[order.studentId]) {
                studentStats[order.studentId] = { orderCount: 0, totalSpent: 0 };
            }
            studentStats[order.studentId].orderCount++;
            studentStats[order.studentId].totalSpent += order.totalAmount;
        });
        const topStudents = Object.entries(studentStats)
            .map(([studentId, stats]) => ({ studentId, ...stats }))
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);
        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            ordersByStatus,
            ordersByDay,
            topStudents,
        };
    }
    async bulkCreate(orders) {
        const result = {
            successful: 0,
            failed: 0,
            errors: [],
        };
        for (let i = 0; i < orders.length; i++) {
            try {
                await this.create(orders[i]);
                result.successful++;
            }
            catch (error) {
                result.failed++;
                result.errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return result;
    }
    async bulkUpdateStatus(orderIds, status) {
        const result = {
            successful: 0,
            failed: 0,
            errors: [],
        };
        for (let i = 0; i < orderIds.length; i++) {
            try {
                await this.updateStatus(orderIds[i], status);
                result.successful++;
            }
            catch (error) {
                result.failed++;
                result.errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return result;
    }
    async getRevenueByDateRange(schoolId, startDate, endDate) {
        const orders = await this.findAll({ schoolId, startDate, endDate });
        const revenueByDate = {};
        orders
            .filter(order => order.status === 'completed')
            .forEach(order => {
            const dateKey = order.createdAt.toISOString().split('T')[0];
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.totalAmount;
        });
        return Object.entries(revenueByDate)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    async getOrderFulfillmentRate(schoolId) {
        const orders = await this.findBySchool(schoolId);
        const total = orders.length;
        const completed = orders.filter(o => o.status === 'completed').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        const fulfillmentRate = total > 0 ? (completed / total) * 100 : 0;
        return {
            total,
            completed,
            cancelled,
            fulfillmentRate,
        };
    }
    static async getCart(userId) {
        return {
            userId,
            items: [],
            total: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    static async clearCart(_userId) {
    }
}
exports.EnhancedOrderService = EnhancedOrderService;
exports.enhancedOrderService = EnhancedOrderService.getInstance();
exports.default = EnhancedOrderService;
//# sourceMappingURL=order.service.enhanced.js.map