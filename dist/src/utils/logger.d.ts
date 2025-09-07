import * as winston from 'winston';
export interface LogContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    statusCode?: number;
    method?: string;
    url?: string;
    userAgent?: string;
    ip?: string;
    [key: string]: any;
}
export declare class Logger {
    private static instance;
    private logger;
    constructor(logger: winston.Logger);
    static getInstance(): Logger;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: Error | any, context?: LogContext): void;
    performance(message: string, duration: number, context?: LogContext): void;
    security(message: string, context?: LogContext): void;
    audit(message: string, context?: LogContext): void;
    database(message: string, context?: LogContext): void;
    request(message: string, context?: LogContext): void;
    business(message: string, context?: LogContext): void;
    integration(message: string, context?: LogContext): void;
    logFunctionStart(functionName: string, context?: LogContext): void;
    logFunctionEnd(functionName: string, context?: LogContext): void;
    child(defaultContext: LogContext): Logger;
    getWinstonLogger(): winston.Logger;
}
declare const enhancedLogger: Logger;
export { enhancedLogger as logger };
export default enhancedLogger;
export declare const log: Logger;
export declare const createRequestLogger: (requestId: string, userId?: string) => Logger;
export declare class PerformanceTimer {
    private startTime;
    private label;
    private logger;
    constructor(label: string, logger?: Logger);
    end(context?: LogContext): number;
    getDuration(): number;
}
export declare const createTimer: (label: string) => PerformanceTimer;
export declare const logError: (error: Error, context?: LogContext) => void;
export declare const logWarning: (message: string, context?: LogContext) => void;
export declare const logInfo: (message: string, context?: LogContext) => void;
export declare const logDebug: (message: string, context?: LogContext) => void;
//# sourceMappingURL=logger.d.ts.map