export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type SecurityEventType = 'authentication_failure' | 'authorization_failure' | 'suspicious_activity' | 'data_breach_attempt' | 'privilege_escalation' | 'brute_force_attack' | 'sql_injection_attempt' | 'xss_attempt' | 'csrf_violation' | 'rate_limit_exceeded';
export interface SecurityLogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    eventType: SecurityEventType;
    message: string;
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent?: string;
    resource: string;
    metadata?: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface ApplicationLogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    category: string;
    message: string;
    service: string;
    metadata?: any;
    correlationId?: string;
}
export interface LogQueryParams {
    startDate?: Date;
    endDate?: Date;
    level?: LogLevel;
    eventType?: SecurityEventType;
    userId?: string;
    limit?: number;
    offset?: number;
}
export declare class LoggingService {
    private static instance;
    private initialized;
    private securityLogs;
    private applicationLogs;
    private maxLogEntries;
    constructor();
    static getInstance(): LoggingService;
    initialize(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    cleanup(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    logSecurityEvent(eventType: SecurityEventType, message: string, metadata?: any): Promise<{
        success: boolean;
        data?: any;
    }>;
    logError(message: string, error?: Error, metadata?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    logWarning(message: string, metadata?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    logInfo(message: string, metadata?: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getSecurityLogs(params?: LogQueryParams): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    archiveLogs(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    private setupLogRotation;
    private initializeSecurityLogging;
    private generateLogId;
    private getSecurityEventLevel;
    private getSecurityEventSeverity;
    private maintainLogSize;
}
export declare const loggingService: LoggingService;
export default LoggingService;
//# sourceMappingURL=logging.service.d.ts.map