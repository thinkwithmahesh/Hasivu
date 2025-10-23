"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._subscriptionService = exports.subscriptionService = exports.SubscriptionService = void 0;
const logger_1 = require("../utils/logger");
class SubscriptionService {
    static instance;
    constructor() {
        logger_1.logger.info('SubscriptionService initialized (stub)');
    }
    static getInstance() {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }
    async getUserSubscription(userId) {
        return {
            userId,
            plan: 'basic',
            status: 'active',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
    }
    async createSubscription(userId, planId) {
        logger_1.logger.info(`Created subscription for user ${userId} with plan ${planId}`);
        return {
            userId,
            planId,
            status: 'active',
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
    }
    async cancelSubscription(userId) {
        logger_1.logger.info(`Cancelled subscription for user ${userId}`);
    }
    async checkSubscriptionStatus(_userId) {
        return true;
    }
    async getAvailablePlans() {
        return [
            { id: 'basic', name: 'Basic', price: 9.99 },
            { id: 'premium', name: 'Premium', price: 19.99 },
        ];
    }
}
exports.SubscriptionService = SubscriptionService;
const subscriptionServiceInstance = new SubscriptionService();
exports.subscriptionService = subscriptionServiceInstance;
exports._subscriptionService = subscriptionServiceInstance;
exports.default = subscriptionServiceInstance;
//# sourceMappingURL=subscription.service.js.map