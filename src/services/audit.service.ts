/**
 * Audit Service
 * Durable audit logging for user actions and operational events.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

type AuditDetails = Record<string, any> | undefined;

export class AuditService {
  private static instance: AuditService;

  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('AuditService initialized');
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logActivity(userId: string, action: string, details: AuditDetails = {}): Promise<void> {
    const entityType = String(details.entityType || action.split('.')[0] || 'system');
    const entityId = String(
      details.entityId ||
        details.orderId ||
        details.paymentId ||
        details.menuItemId ||
        details.rfidCardId ||
        details.cardId ||
        userId
    );

    try {
      await this.db.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          changes: JSON.stringify(details.changes || details),
          userId,
          createdById: userId,
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          metadata: JSON.stringify({
            requestId: details.requestId,
            schoolId: details.schoolId,
            source: details.source || 'api',
          }),
        },
      });
    } catch (error) {
      logger.error('Failed to persist audit log', error as Error, {
        userId,
        action,
        entityType,
        entityId,
      });
      throw error;
    }
  }

  async log(userId: string, action: string, details: AuditDetails = {}): Promise<void> {
    return this.logActivity(userId, action, details);
  }

  async getAuditLogs(userId?: string): Promise<any[]> {
    const logs = await this.db.auditLog.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      timestamp: log.createdAt,
      details: this.parseJson(log.changes),
      metadata: this.parseJson(log.metadata),
    }));
  }

  private parseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

const auditServiceInstance = new AuditService();
export const auditService = auditServiceInstance;
export const _auditService = auditServiceInstance;
export default auditServiceInstance;
