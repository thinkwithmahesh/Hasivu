/**
 * Fraud Detection Service
 * Rule-based transaction and activity risk scoring with durable audit flags.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

export class FraudDetectionService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('FraudDetectionService initialized');
  }

  async analyzeTransaction(transactionData: any): Promise<any> {
    const amount = Number(transactionData.amount || 0);
    const userId = transactionData.userId;
    const recentPayments = userId
      ? await this.db.payment.count({
          where: {
            userId,
            createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
          },
        })
      : 0;

    const flags: string[] = [];
    if (amount > 50000) flags.push('high_amount');
    if (recentPayments > 5) flags.push('high_velocity');
    if (!transactionData.orderId && !transactionData.subscriptionId)
      flags.push('missing_business_reference');

    const riskScore = Math.min(1, flags.length * 0.3 + (amount > 100000 ? 0.3 : 0));
    const status = riskScore >= 0.7 ? 'review_required' : 'approved';

    if (status === 'review_required' && userId) {
      await this.flagSuspiciousActivity(userId, flags.join(', '));
    }

    return {
      transactionId: transactionData.id,
      riskScore,
      status,
      flags,
      timestamp: new Date(),
    };
  }

  async detectAnomalousActivity(userId: string): Promise<any[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [payments, orders, auditFlags] = await Promise.all([
      this.db.payment.count({ where: { userId, createdAt: { gte: since } } }),
      this.db.order.count({ where: { userId, createdAt: { gte: since } } }),
      this.db.auditLog.findMany({
        where: { userId, action: { startsWith: 'fraud.' }, createdAt: { gte: since } },
      }),
    ]);

    const anomalies = [];
    if (payments > 10) anomalies.push({ type: 'payment_velocity', count: payments });
    if (orders > 20) anomalies.push({ type: 'order_velocity', count: orders });
    anomalies.push(...auditFlags.map(flag => ({ type: flag.action, details: flag.changes })));
    return anomalies;
  }

  async flagSuspiciousActivity(userId: string, reason: string): Promise<void> {
    await this.db.auditLog.create({
      data: {
        entityType: 'fraud',
        entityId: userId,
        action: 'fraud.suspicious_activity_flagged',
        changes: JSON.stringify({ reason }),
        userId,
        createdById: userId,
        metadata: JSON.stringify({ source: 'fraud-detection' }),
      },
    });
  }

  async validateUserBehavior(userId: string, activityData: any): Promise<boolean> {
    const anomalies = await this.detectAnomalousActivity(userId);
    if (activityData?.amount) {
      const analysis = await this.analyzeTransaction({ ...activityData, userId });
      return analysis.status === 'approved' && anomalies.length === 0;
    }
    return anomalies.length === 0;
  }

  async getSecurityAlerts(): Promise<any[]> {
    const alerts = await this.db.auditLog.findMany({
      where: { entityType: 'fraud' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return alerts.map(alert => ({
      id: alert.id,
      userId: alert.userId,
      reason: alert.changes,
      createdAt: alert.createdAt,
    }));
  }
}

const fraudDetectionServiceInstance = new FraudDetectionService();
export const fraudDetectionService = fraudDetectionServiceInstance;
export const _fraudDetectionService = fraudDetectionServiceInstance;
export default fraudDetectionServiceInstance;
