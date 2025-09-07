import { Request, Response, NextFunction } from 'express';
export interface LoggedRequest extends Request {
    requestId?: string;
    startTime?: number;
    userAgent?: string;
    clientIp?: string;
}
export declare const loggingMiddleware: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const requestLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const auditLogger: (req: LoggedRequest, res: Response, next: NextFunction) => void;
export declare const errorLogger: (error: any, req: LoggedRequest, res: Response, next: NextFunction) => void;
export default loggingMiddleware;
//# sourceMappingURL=logging.middleware.d.ts.map