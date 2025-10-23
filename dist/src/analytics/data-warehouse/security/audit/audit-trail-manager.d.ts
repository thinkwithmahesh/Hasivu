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
export declare class AuditTrailManager {
    constructor();
    initialize(): Promise<void>;
    logAccess(userId: string, resource: string, action: string): Promise<void>;
    logDataAccess(userId: string, table: string, operation: string): Promise<void>;
    getAuditLogs(filters: AuditLogFilters): Promise<AuditEvent[]>;
    generateComplianceReport(period: AuditPeriod): Promise<ComplianceReport>;
    createTrail(event: AuditEvent, status?: string, metadata?: Record<string, unknown>): Promise<string>;
    generateSummary(period: AuditPeriod): Promise<AuditSummary>;
    getHealthStatus(): Promise<HealthStatus>;
    shutdown(): Promise<void>;
}
export default AuditTrailManager;
//# sourceMappingURL=audit-trail-manager.d.ts.map