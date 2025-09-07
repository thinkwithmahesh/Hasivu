export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
export declare class LoggerService {
    private static instance;
    private requestId?;
    private functionName?;
    private constructor();
    static getInstance(): LoggerService;
    setRequestId(requestId: string): void;
    setFunctionName(functionName: string): void;
    private createLogEntry;
    private output;
    error(message: string, error?: Error | any, metadata?: Record<string, any>): void;
    warn(message: string, metadata?: Record<string, any>): void;
    info(message: string, metadata?: Record<string, any>): void;
    debug(message: string, metadata?: Record<string, any>): void;
    logFunctionStart(event: any, context: any): void;
    logFunctionEnd(statusCode: number, duration: number): void;
    logAuthentication(event: string, metadata?: Record<string, any>): void;
    logCognito(operation: string, metadata?: Record<string, any>): void;
    logTimer(label: string, startTime: number): void;
}
//# sourceMappingURL=logger.service.d.ts.map