/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
interface MetricsRequest extends Request {
    startTime?: number;
    metricsContext?: {
        endpoint: string;
        method: string;
        userId?: string;
    };
}
export declare const metricsMiddleware: (req: MetricsRequest, res: Response, next: NextFunction) => void;
export declare const userActivityMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMetricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const createDatabaseMetricsWrapper: <T>(queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', queryFn: () => Promise<T>) => () => Promise<T>;
export declare const createCacheMetricsWrapper: <T>(operation: 'hit' | 'miss' | 'set' | 'delete', cacheFn: () => Promise<T>) => () => Promise<T>;
export declare const errorMetricsMiddleware: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const healthCheckMetricsMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=metrics.middleware.d.ts.map