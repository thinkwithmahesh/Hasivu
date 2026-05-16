/**
 * Quality Control Service
 * Persists quality checks through audit logs and derives daily quality metrics.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

export class QualityControlService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('QualityControlService initialized');
  }

  async performQualityCheck(itemId: string): Promise<any> {
    const item = await this.db.menuItem.findUnique({ where: { id: itemId } });
    if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
    return { status: 'passed', itemId, timestamp: new Date(), itemName: item.name };
  }

  async getQualityReports(): Promise<any[]> {
    const logs = await this.db.auditLog.findMany({
      where: { entityType: 'quality' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return logs.map(log => ({
      id: log.id,
      action: log.action,
      entityId: log.entityId,
      details: this.parseJson(log.changes),
      createdAt: log.createdAt,
    }));
  }

  async recordIssue(itemId: string, issue: string): Promise<void> {
    await this.db.auditLog.create({
      data: {
        entityType: 'quality',
        entityId: itemId,
        action: 'quality.issue_recorded',
        changes: JSON.stringify({ issue }),
        createdById: await this.resolveSystemUserId(),
        metadata: '{}',
      },
    });
  }

  async getTodayMetrics(schoolId: string): Promise<any> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const logs = await this.db.auditLog.findMany({
      where: {
        entityType: 'quality',
        createdAt: { gte: start },
        metadata: { contains: schoolId },
      },
    });
    const failedChecks = logs.filter(
      log => log.action.includes('failed') || log.action.includes('issue')
    ).length;
    const totalChecks = logs.length;
    return {
      averageScore:
        totalChecks === 0 ? 100 : Math.round(((totalChecks - failedChecks) / totalChecks) * 100),
      passRate:
        totalChecks === 0 ? 100 : Math.round(((totalChecks - failedChecks) / totalChecks) * 100),
      failedChecks,
      totalChecks,
      recentFailures: logs.filter(log => log.action.includes('failed')).slice(0, 5),
    };
  }

  async initiateCheck(orderId: string, qualityChecks?: any[]): Promise<void> {
    await this.writeQualityAudit(orderId, 'quality.check_initiated', { qualityChecks });
  }

  async handleFailedCheck(checkId: string, options: any): Promise<void> {
    await this.writeQualityAudit(checkId, 'quality.check_failed', options);
  }

  async updateMetrics(schoolId: string, data: any): Promise<void> {
    await this.writeQualityAudit(schoolId, 'quality.metrics_updated', { schoolId, ...data });
  }

  async submitCheck(checkData: any): Promise<any> {
    const log = await this.writeQualityAudit(
      checkData.orderId || checkData.itemId || 'quality-check',
      checkData.passed === false ? 'quality.check_failed' : 'quality.check_passed',
      checkData
    );
    return { id: log.id, ...checkData, createdAt: log.createdAt };
  }

  private async writeQualityAudit(entityId: string, action: string, details: any) {
    return this.db.auditLog.create({
      data: {
        entityType: 'quality',
        entityId,
        action,
        changes: JSON.stringify(details || {}),
        createdById: details?.userId || (await this.resolveSystemUserId()),
        metadata: JSON.stringify({ schoolId: details?.schoolId, source: 'quality-control' }),
      },
    });
  }

  private async resolveSystemUserId(): Promise<string> {
    const user = await this.db.user.findFirst({ orderBy: { createdAt: 'asc' } });
    if (!user)
      throw Object.assign(new Error('No user available for audit ownership'), { statusCode: 500 });
    return user.id;
  }

  private parseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

const qualityControlServiceInstance = new QualityControlService();
export const qualityControlService = qualityControlServiceInstance;
export const _qualityControlService = qualityControlServiceInstance;
export default qualityControlServiceInstance;
