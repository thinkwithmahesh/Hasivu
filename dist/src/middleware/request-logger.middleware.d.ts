import { Request, Response, NextFunction } from 'express';
export interface LoggedRequest extends Request {
    id?: string;
    startTime?: number;
    logData?: any;
}
interface RequestLoggerOptions {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    includeHeaders?: boolean;
    includeBody?: boolean;
    includeResponse?: boolean;
    skipRoutes?: string[];
    sensitiveFields?: string[];
    maxBodySize?: number;
    maxResponseSize?: number;
}
export declare function createRequestLogger(options?: RequestLoggerOptions): (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const basicRequestLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const detailedRequestLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const securityRequestLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export default basicRequestLogger;
//# sourceMappingURL=request-logger.middleware.d.ts.map