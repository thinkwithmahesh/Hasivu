export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
declare class Logger {
    private logLevel;
    constructor();
    private parseLogLevel;
    private shouldLog;
    private formatLog;
    debug(message: string, context?: any): void;
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    fatal(message: string, error?: Error, context?: any): void;
    integration(message: string, context?: any): void;
    logFunctionStart(functionName: string, context?: any): void;
    logFunctionEnd(functionName: string, context?: any): void;
    setLogLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export { Logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map