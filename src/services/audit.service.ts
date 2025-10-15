/**
 * Audit Service - Stub Implementation
 * TODO: Implement full audit logging functionality
 */

import { logger } from '../utils/logger';

export class AuditService {
  private static instance: AuditService;

  constructor() {
    logger.info('AuditService initialized (stub)');
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logActivity(userId: string, action: string, details: any): Promise<void> {
    logger.info(`Audit log: User ${userId} performed ${action}`, details);
  }

  async log(userId: string, action: string, details: any): Promise<void> {
    return this.logActivity(userId, action, details);
  }

  async getAuditLogs(userId?: string): Promise<any[]> {
    return [
      {
        id: 'audit-1',
        userId: userId || 'user-123',
        action: 'login',
        timestamp: new Date(),
        details: { ip: '127.0.0.1' },
      },
    ];
  }
}

const auditServiceInstance = new AuditService();
export const auditService = auditServiceInstance;
export const _auditService = auditServiceInstance;
export default auditServiceInstance;
