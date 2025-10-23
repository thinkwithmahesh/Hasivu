interface LogContext {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    [key: string]: any;
}
interface AuditLogEntry {
    action: string;
    resource: string;
    userId: string;
    outcome: 'success' | 'failure' | 'pending';
    metadata?: Record<string, any>;
    context: LogContext;
}
interface SecurityLogEntry {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    target?: string;
    outcome: 'success' | 'failure' | 'blocked';
    metadata?: Record<string, any>;
    context: LogContext;
}
interface PerformanceLogEntry {
    operation: string;
    duration: number;
    metadata?: Record<string, any>;
    context: LogContext;
}
interface BusinessLogEntry {
    event: string;
    category: string;
    value?: number;
    metadata?: Record<string, any>;
    context: LogContext;
}
export declare class StructuredLoggingService {
    private context;
    constructor();
    setContext(context: LogContext): void;
    clearContext(): void;
    generateRequestId(): string;
    info(message: string, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    error(message: string, error?: Error | any, metadata?: Record<string, any>): void;
    debug(message: string, metadata?: Record<string, any>): void;
    audit(entry: AuditLogEntry): void;
    security(entry: SecurityLogEntry): void;
    performance(entry: PerformanceLogEntry): void;
    business(entry: BusinessLogEntry): void;
    payment(transactionId: string, amount: number, currency: string, status: string, gateway: string, error?: Error): void;
    rfidVerification(cardId: string, readerId: string, verificationStatus: string, duration: number, studentId?: string, error?: Error): void;
    userActivity(userId: string, action: string, resource: string, metadata?: Record<string, any>): void;
    private sanitizeUserData;
    private hashSensitiveData;
}
export declare const structuredLogger: StructuredLoggingService;
export {};
//# sourceMappingURL=structured-logging.service.d.ts.map