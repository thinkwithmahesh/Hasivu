import * as winston from 'winston';
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    HTTP = "http",
    VERBOSE = "verbose",
    DEBUG = "debug",
    SILLY = "silly"
}
export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    service?: string;
    environment?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    traceId?: string;
    spanId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    metadata?: Record<string, any>;
}
export interface HttpLogEntry extends LogEntry {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userAgent?: string;
    ip?: string;
    referer?: string;
    contentLength?: number;
}
export interface ErrorLogEntry extends LogEntry {
    error: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    context?: Record<string, any>;
}
export interface SecurityLogEntry extends LogEntry {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip?: string;
    userAgent?: string;
    attempts?: number;
    blocked?: boolean;
}
export interface PerformanceLogEntry extends LogEntry {
    operation: string;
    duration: number;
    memoryUsage?: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
    };
    cpuUsage?: {
        user: number;
        system: number;
    };
}
export declare class LoggerService {
    private static instance;
    private logger;
    private defaultMeta;
    private constructor();
    static getInstance(): LoggerService;
    private getLogLevel;
    private setupExceptionHandlers;
    setDefaultMeta(meta: Record<string, any>): void;
    clearDefaultMeta(): void;
    child(meta: Record<string, any>): LoggerService;
    error(message: string, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    http(message: string, meta?: Record<string, any>): void;
    verbose(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    silly(message: string, meta?: Record<string, any>): void;
    logHttpRequest(entry: HttpLogEntry): void;
    logError(error: Error, context?: Record<string, any>): void;
    logSecurity(entry: SecurityLogEntry): void;
    logPerformance(entry: PerformanceLogEntry): void;
    logUserAction(userId: string, action: string, resource: string, details?: Record<string, any>): void;
    logDatabaseOperation(operation: string, table: string, duration: number, rowsAffected?: number): void;
    logExternalApiCall(service: string, endpoint: string, method: string, statusCode: number, duration: number, error?: string): void;
    logBusinessEvent(event: string, userId?: string, data?: Record<string, any>): void;
    logSystemMetric(metric: string, value: number, unit?: string, tags?: Record<string, string>): void;
    getWinstonLogger(): winston.Logger;
    isLevelEnabled(level: LogLevel): boolean;
    flush(): Promise<void>;
    close(): void;
}
export declare const logger: LoggerService;
export declare function requestLoggingMiddleware(): (req: any, res: any, next: any) => void;
export declare function errorLoggingMiddleware(): (error: Error, req: any, res: any, next: any) => void;
export declare function logPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
declare const _default: {
    LoggerService: typeof LoggerService;
    logger: LoggerService;
    LogLevel: typeof LogLevel;
    requestLoggingMiddleware: typeof requestLoggingMiddleware;
    errorLoggingMiddleware: typeof errorLoggingMiddleware;
    logPerformance: typeof logPerformance;
};
export default _default;
//# sourceMappingURL=logger.d.ts.map