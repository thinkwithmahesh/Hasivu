export { logger, logger as default, LogLevel } from '../utils/logger';
export declare class LoggerService {
    private static instance;
    private constructor();
    static getInstance(): LoggerService;
    info(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    warn(message: string, context?: any): void;
    debug(message: string, context?: any): void;
    logFunctionStart(functionName: string, context?: any): void;
    logFunctionEnd(functionName: string, context?: any): void;
}
//# sourceMappingURL=logger.service.d.ts.map