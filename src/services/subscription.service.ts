/**
 * Subscription Service - Stub Implementation
 * TODO: Implement full subscription management functionality
 */

import { logger } from '../utils/logger';

export class SubscriptionService {
  private static instance: SubscriptionService;

  constructor() {
    logger.info('SubscriptionService initialized (stub)');
  }

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getUserSubscription(userId: string): Promise<any> {
    return {
      userId,
      plan: 'basic',
      status: 'active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async createSubscription(userId: string, planId: string): Promise<any> {
    logger.info(`Created subscription for user ${userId} with plan ${planId}`);
    return {
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelSubscription(userId: string): Promise<void> {
    logger.info(`Cancelled subscription for user ${userId}`);
  }

  async checkSubscriptionStatus(_userId: string): Promise<boolean> {
    return true;
  }

  async getAvailablePlans(): Promise<any[]> {
    return [
      { id: 'basic', name: 'Basic', price: 9.99 },
      { id: 'premium', name: 'Premium', price: 19.99 },
    ];
  }
}

const subscriptionServiceInstance = new SubscriptionService();
export const subscriptionService = subscriptionServiceInstance;
export const _subscriptionService = subscriptionServiceInstance;
export default subscriptionServiceInstance;
