import { logger } from '../../../../utils/logger';
import { prisma } from '../../../../database/DatabaseManager';

interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditPeriod {
  start: Date;
  end: Date;
}

interface ComplianceReport {
  status: 'compliant' | 'non-compliant' | 'partial';
  violations: number;
  details?: string;
}

interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

interface AuditSummary {
  id: string;
  period: AuditPeriod;
  generatedAt: Date;
  summary: {
    totalEvents: number;
    successfulAccess: number;
    failedAccess: number;
    securityViolations: number;
    complianceEvents: number;
    dataAccess: {
      reads: number;
      writes: number;
      deletes: number;
    };
    userActivity: {
      uniqueUsers: number;
      adminActions: number;
      systemEvents: number;
    };
    riskEvents: {
      high: number;
      medium: number;
      low: number;
    };
  };
  topUsers: Array<{
    userId: string;
    actions: number;
  }>;
  recommendations: string[];
}

interface HealthStatus {
  status: string;
  version: string;
  lastUpdate: Date;
  performance: {
    avgLogTime: number;
    eventsLogged: number;
    storageUsed: string;
  };
  components: Record<string, string>;
  metrics: Record<string, string>;
}

export class AuditTrailManager {
  constructor() {
    logger.info('AuditTrailManager initialized');
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Audit Trail Manager');
  }

  async logAccess(userId: string, resource: string, action: string): Promise<void> {
    await this.persistAuditEvent({
      userId,
      action,
      resource,
      timestamp: new Date(),
      details: { category: 'access' },
    });
  }

  async logDataAccess(userId: string, table: string, operation: string): Promise<void> {
    await this.persistAuditEvent({
      userId,
      action: operation,
      resource: table,
      timestamp: new Date(),
      details: { category: 'data_access', table },
    });
  }

  async getAuditLogs(filters: AuditLogFilters): Promise<AuditEvent[]> {
    logger.info('Retrieving audit logs', { filters });
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.resource ? { entityType: filters.resource } : {}),
        ...(filters.startDate || filters.endDate
          ? {
              createdAt: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return logs
      .filter(log => this.matchesSeverity(log.metadata, filters.severity))
      .map(log => ({
        userId: log.userId || log.createdById,
        action: log.action,
        resource: log.entityType,
        timestamp: log.createdAt,
        details: this.parseJson(log.metadata),
      }));
  }

  async generateComplianceReport(period: AuditPeriod): Promise<ComplianceReport> {
    logger.info('Generating compliance report', { period });
    const events = await this.getAuditLogs({ startDate: period.start, endDate: period.end });
    const violations = events.filter(event =>
      ['unauthorized', 'denied', 'failed', 'violation'].some(term =>
        `${event.action} ${JSON.stringify(event.details || {})}`.toLowerCase().includes(term)
      )
    ).length;

    return {
      status: violations === 0 ? 'compliant' : violations > 10 ? 'non-compliant' : 'partial',
      violations,
      details: `${events.length} audit events reviewed for ${period.start.toISOString()} - ${period.end.toISOString()}`,
    };
  }

  async createTrail(
    event: AuditEvent,
    status?: string,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    return this.persistAuditEvent({
      ...event,
      details: {
        ...(event.details || {}),
        status,
        ...(metadata || {}),
      },
    });
  }

  async generateSummary(period: AuditPeriod): Promise<AuditSummary> {
    logger.info('Generating audit trail summary', { period });

    const events = await this.getAuditLogs({ startDate: period.start, endDate: period.end });
    const uniqueUsers = new Set(events.map(event => event.userId));
    const actionCounts = new Map<string, number>();
    for (const event of events) {
      actionCounts.set(event.userId, (actionCounts.get(event.userId) || 0) + 1);
    }

    const failedAccess = events.filter(event =>
      `${event.action} ${JSON.stringify(event.details || {})}`.toLowerCase().includes('failed')
    ).length;
    const securityViolations = events.filter(event =>
      `${event.action} ${JSON.stringify(event.details || {})}`.toLowerCase().includes('violation')
    ).length;
    const dataReads = events.filter(event => /read|view|list|get/i.test(event.action)).length;
    const dataWrites = events.filter(event =>
      /create|update|write|edit/i.test(event.action)
    ).length;
    const dataDeletes = events.filter(event => /delete|remove/i.test(event.action)).length;

    return {
      id: `audit_summary_${period.start.getTime()}_${period.end.getTime()}`,
      period,
      generatedAt: new Date(),
      summary: {
        totalEvents: events.length,
        successfulAccess: Math.max(events.length - failedAccess, 0),
        failedAccess,
        securityViolations,
        complianceEvents: events.filter(event =>
          event.resource.toLowerCase().includes('compliance')
        ).length,
        dataAccess: {
          reads: dataReads,
          writes: dataWrites,
          deletes: dataDeletes,
        },
        userActivity: {
          uniqueUsers: uniqueUsers.size,
          adminActions: events.filter(event => /admin/i.test(event.resource)).length,
          systemEvents: events.filter(event => event.userId === 'system').length,
        },
        riskEvents: {
          high: events.filter(event => this.readSeverity(event.details) === 'high').length,
          medium: events.filter(event => this.readSeverity(event.details) === 'medium').length,
          low: events.filter(event => this.readSeverity(event.details) === 'low').length,
        },
      },
      topUsers: Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, actions]) => ({ userId, actions })),
      recommendations: this.buildRecommendations(securityViolations, failedAccess),
    };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    logger.info('Getting audit trail manager health status');

    return {
      status: 'healthy',
      version: '1.0.0',
      lastUpdate: new Date(),
      performance: {
        avgLogTime: 0,
        eventsLogged: await prisma.auditLog.count(),
        storageUsed: 'database',
      },
      components: {
        logWriter: 'operational',
        indexer: 'database-indexes',
        retention: 'operational',
      },
      metrics: {
        uptime: 'managed-by-runtime',
        memoryUsage: 'managed-by-runtime',
        cpuUsage: 'managed-by-runtime',
      },
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Audit Trail Manager');
  }

  private async persistAuditEvent(event: AuditEvent): Promise<string> {
    const metadata = {
      ...(event.details || {}),
      severity: this.readSeverity(event.details) || 'low',
    };
    const createdById = await this.resolveAuditActor(event.userId);

    const created = await prisma.auditLog.create({
      data: {
        entityType: event.resource,
        entityId: String(event.details?.entityId || event.resource),
        action: event.action,
        changes: JSON.stringify(event.details?.changes || {}),
        userId: event.userId === 'system' ? null : createdById,
        createdById,
        metadata: JSON.stringify(metadata),
      },
    });

    return created.id;
  }

  private async resolveAuditActor(userId: string): Promise<string> {
    if (userId !== 'system') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (user) return user.id;
    }

    const fallbackActor = await prisma.user.findFirst({
      where: {
        role: { in: ['super_admin', 'admin', 'school_admin'] },
        isActive: true,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!fallbackActor) {
      throw new Error('Cannot persist audit event without a valid audit actor');
    }

    return fallbackActor.id;
  }

  private parseJson(value: string | null): Record<string, unknown> {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  private readSeverity(details: unknown): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!details || typeof details !== 'object') {
      return undefined;
    }
    const severity = (details as Record<string, unknown>).severity;
    return ['low', 'medium', 'high', 'critical'].includes(String(severity))
      ? (severity as 'low' | 'medium' | 'high' | 'critical')
      : undefined;
  }

  private matchesSeverity(metadata: string | null, severity?: string): boolean {
    if (!severity) return true;
    return this.readSeverity(this.parseJson(metadata)) === severity;
  }

  private buildRecommendations(securityViolations: number, failedAccess: number): string[] {
    const recommendations: string[] = [];
    if (securityViolations > 0) {
      recommendations.push(
        'Review security violation events and confirm tenant/user authorization rules.'
      );
    }
    if (failedAccess > 10) {
      recommendations.push(
        'Investigate repeated failed access events for possible credential stuffing or permission drift.'
      );
    }
    if (recommendations.length === 0) {
      recommendations.push('No audit anomalies detected for this period.');
    }
    return recommendations;
  }
}

export default AuditTrailManager;
