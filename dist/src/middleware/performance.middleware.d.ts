/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
export interface TimedRequest extends Request {
    requestId?: string;
    startTime?: number;
    endTime?: number;
    performanceMarks?: Map<string, number>;
    memoryUsage?: NodeJS.MemoryUsage;
}
export declare const performanceMiddleware: (req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const addPerformanceMark: (req: TimedRequest, markName: string) => void;
export declare const getPerformanceDuration: (req: TimedRequest, startMark: string, endMark?: string) => number;
export declare const precisionTimingMiddleware: (req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const memoryMonitoringMiddleware: (req: TimedRequest, res: Response, next: NextFunction) => void;
export declare const cpuMonitoringMiddleware: (req: TimedRequest, res: Response, next: NextFunction) => void;
export default performanceMiddleware;
//# sourceMappingURL=performance.middleware.d.ts.map