export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, any>;
    error?: Error;
}
export declare class LoggingService {
    private static instance;
    private logLevel;
    private constructor();
    static getInstance(): LoggingService;
    private parseLogLevel;
    private shouldLog;
    private formatLog;
    private log;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
    fatal(message: string, error?: Error, context?: Record<string, any>): void;
    setLogLevel(level: LogLevel): void;
}
export declare const loggingService: LoggingService;
export default LoggingService;
//# sourceMappingURL=logging.service.d.ts.map