"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._kitchenService = exports.kitchenService = exports.KitchenService = void 0;
const logger_1 = require("../utils/logger");
class KitchenService {
    constructor() {
        logger_1.logger.info('KitchenService initialized (stub)');
    }
    async getOrders() {
        return [];
    }
    async updateOrderStatus(orderId, status) {
        logger_1.logger.info(`Order ${orderId} status updated to ${status}`);
    }
    async getKitchenStatus() {
        return { status: 'operational', orders: 0 };
    }
    async getOrderQueue(_schoolId, _options) {
        return { data: [], total: 0, statusCounts: {}, priorityCounts: {}, avgPreparationTime: 0 };
    }
    async getEquipmentStatus(_schoolId) {
        return { operational: 0, maintenance: 0, outOfOrder: 0, utilizationRate: 0 };
    }
    async getPerformanceMetrics(_schoolId) {
        return { ordersCompleted: 0, avgPreparationTime: 0, customerSatisfaction: 0, efficiency: 0 };
    }
    async getOrder(orderId) {
        return { id: orderId, schoolId: 'mock', kitchenStatus: 'pending', customerId: 'mock' };
    }
    async canTransitionStatus(_currentStatus, _newStatus) {
        return { allowed: true };
    }
    async updateOrderStatusDetailed(_orderId, updateData) {
        return { id: _orderId, ...updateData };
    }
    async startPreparationTimer(orderId) {
        logger_1.logger.info(`Started preparation timer for order ${orderId}`);
    }
    async markDispatched(orderId, userId) {
        logger_1.logger.info(`Order ${orderId} marked as dispatched by user ${userId}`);
    }
    async getPreparationStatus(_orderId) {
        return { canStart: true, status: 'ready' };
    }
    async estimatePreparationTime(_items, _schoolId) {
        return 30;
    }
}
exports.KitchenService = KitchenService;
const kitchenServiceInstance = new KitchenService();
exports.kitchenService = kitchenServiceInstance;
exports._kitchenService = kitchenServiceInstance;
exports.default = kitchenServiceInstance;
//# sourceMappingURL=kitchen.service.js.map