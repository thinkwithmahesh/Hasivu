"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cpuMonitoringMiddleware = exports.memoryMonitoringMiddleware = exports.precisionTimingMiddleware = exports.getPerformanceDuration = exports.addPerformanceMark = exports.performanceMiddleware = void 0;
const logger_1 = require("../utils/logger");
const perf_hooks_1 = require("perf_hooks");
const performanceMiddleware = (req, res, next) => {
    try {
        req.requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        req.startTime = perf_hooks_1.performance.now();
        req.performanceMarks = new Map();
        req.memoryUsage = process.memoryUsage();
        req.performanceMarks.set('start', req.startTime);
        const initialMemory = process.memoryUsage();
        req.performanceMarks.set('memory_start', initialMemory.heapUsed);
        res.on('finish', () => {
            try {
                req.endTime = perf_hooks_1.performance.now();
                const responseTime = req.endTime - (req.startTime || 0);
                const finalMemory = process.memoryUsage();
                res.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
                res.set('X-Request-ID', req.requestId);
                const memoryDelta = finalMemory.heapUsed - (req.memoryUsage?.heapUsed || 0);
                const performanceData = {
                    requestId: req.requestId,
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    responseTime: Math.round(responseTime * 100) / 100,
                    memory: {
                        initial: Math.round(initialMemory.heapUsed / 1024 / 1024 * 100) / 100,
                        final: Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100,
                        delta: Math.round(memoryDelta / 1024 / 1024 * 100) / 100,
                        rss: Math.round(finalMemory.rss / 1024 / 1024 * 100) / 100
                    },
                    timestamp: new Date().toISOString()
                };
                if (responseTime > 1000) {
                    logger_1.logger.warn('Slow request detected', performanceData);
                }
                else if (responseTime > 500) {
                    logger_1.logger.info('Performance monitoring', performanceData);
                }
                logger_1.logger.debug('Request performance metrics', performanceData);
            }
            catch (error) {
                logger_1.logger.error('Performance monitoring error', {
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
                    requestId: req.requestId
                });
            }
        });
        res.on('error', (error) => {
            logger_1.logger.error('Response error during performance monitoring', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                requestId: req.requestId,
                responseTime: req.endTime ? req.endTime - (req.startTime || 0) : 'incomplete'
            });
        });
        next();
    }
    catch (error) {
        logger_1.logger.error('Performance middleware initialization error', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            requestId: req.requestId
        });
        next(error);
    }
};
exports.performanceMiddleware = performanceMiddleware;
const addPerformanceMark = (req, markName) => {
    if (req.performanceMarks) {
        req.performanceMarks.set(markName, perf_hooks_1.performance.now());
    }
};
exports.addPerformanceMark = addPerformanceMark;
const getPerformanceDuration = (req, startMark, endMark) => {
    if (!req.performanceMarks)
        return 0;
    const startTime = req.performanceMarks.get(startMark);
    const endTime = endMark ? req.performanceMarks.get(endMark) : perf_hooks_1.performance.now();
    if (!startTime || !endTime)
        return 0;
    return endTime - startTime;
};
exports.getPerformanceDuration = getPerformanceDuration;
const precisionTimingMiddleware = (req, res, next) => {
    const hrStart = process.hrtime.bigint();
    res.on('finish', () => {
        const hrEnd = process.hrtime.bigint();
        const nanoseconds = hrEnd - hrStart;
        const milliseconds = Number(nanoseconds) / 1000000;
        res.set('X-Precise-Time', `${milliseconds.toFixed(3)}ms`);
        if (milliseconds > 100) {
            logger_1.logger.warn('High-precision timing alert', {
                requestId: req.requestId,
                path: req.path,
                method: req.method,
                preciseTime: milliseconds.toFixed(3),
                timestamp: new Date().toISOString()
            });
        }
    });
    next();
};
exports.precisionTimingMiddleware = precisionTimingMiddleware;
const memoryMonitoringMiddleware = (req, res, next) => {
    const initialMemory = process.memoryUsage();
    res.on('finish', () => {
        const finalMemory = process.memoryUsage();
        const heapDelta = finalMemory.heapUsed - initialMemory.heapUsed;
        if (heapDelta > 10 * 1024 * 1024) {
            logger_1.logger.warn('Memory usage spike detected', {
                requestId: req.requestId,
                path: req.path,
                method: req.method,
                heapDelta: Math.round(heapDelta / 1024 / 1024 * 100) / 100,
                totalHeap: Math.round(finalMemory.heapUsed / 1024 / 1024 * 100) / 100,
                rss: Math.round(finalMemory.rss / 1024 / 1024 * 100) / 100
            });
        }
    });
    next();
};
exports.memoryMonitoringMiddleware = memoryMonitoringMiddleware;
const cpuMonitoringMiddleware = (req, res, next) => {
    const startUsage = process.cpuUsage();
    res.on('finish', () => {
        const cpuDelta = process.cpuUsage(startUsage);
        const totalCpuTime = (cpuDelta.user + cpuDelta.system) / 1000;
        if (totalCpuTime > 100) {
            logger_1.logger.warn('High CPU usage detected', {
                requestId: req.requestId,
                path: req.path,
                method: req.method,
                cpuTime: totalCpuTime,
                userTime: cpuDelta.user / 1000,
                systemTime: cpuDelta.system / 1000
            });
        }
    });
    next();
};
exports.cpuMonitoringMiddleware = cpuMonitoringMiddleware;
exports.default = exports.performanceMiddleware;
//# sourceMappingURL=performance.middleware.js.map