"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckMetricsMiddleware = exports.errorMetricsMiddleware = exports.createCacheMetricsWrapper = exports.createDatabaseMetricsWrapper = exports.securityMetricsMiddleware = exports.userActivityMiddleware = exports.metricsMiddleware = void 0;
const metrics_service_1 = require("../services/metrics.service");
const metricsMiddleware = (req, res, next) => {
    req.startTime = Date.now();
    req.metricsContext = {
        endpoint: req.path || req.url,
        method: req.method,
        userId: req.user?.id,
    };
    res.on('finish', async () => {
        try {
            const duration = Date.now() - (req.startTime || Date.now());
            const { statusCode } = res;
            const endpoint = req.metricsContext?.endpoint || 'unknown';
            const method = req.metricsContext?.method || 'unknown';
            await metrics_service_1.metricsService.trackApiRequest({
                endpoint,
                method,
                statusCode,
                duration,
                userId: req.metricsContext?.userId,
            });
            if (duration > 1000) {
                console.warn(`Slow API request detected: ${method} ${endpoint} - ${duration}ms`);
            }
            if (statusCode >= 500) {
                await metrics_service_1.metricsService.trackError('ApiServerError', `API server error: ${method} ${endpoint}`, {
                    statusCode,
                    duration,
                    endpoint,
                    method,
                });
            }
            else if (statusCode >= 400) {
                await metrics_service_1.metricsService.trackError('ApiClientError', `API client error: ${method} ${endpoint}`, {
                    statusCode,
                    duration,
                    endpoint,
                    method,
                });
            }
        }
        catch (error) {
            console.error('Error in metrics middleware:', error);
        }
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
const userActivityMiddleware = (req, res, next) => {
    res.on('finish', async () => {
        try {
            const { user } = req;
            if (!user) {
                return;
            }
            let action;
            if (req.path.includes('/auth/login')) {
                action = 'login';
            }
            else if (req.path.includes('/auth/logout')) {
                action = 'logout';
            }
            else if (req.path.includes('/orders') && req.method === 'POST') {
                action = 'order_created';
            }
            else if (req.path.includes('/payments/verify')) {
                action = 'payment_completed';
            }
            else if (req.path.includes('/rfid/verify')) {
                action = 'rfid_verified';
            }
            if (action) {
                await metrics_service_1.metricsService.trackUserActivity({
                    userId: user.id,
                    action,
                    deviceType: req.get('User-Agent'),
                });
            }
        }
        catch (error) {
            console.error('Error in user activity middleware:', error);
        }
    });
    next();
};
exports.userActivityMiddleware = userActivityMiddleware;
const securityMetricsMiddleware = (req, res, next) => {
    res.on('finish', async () => {
        try {
            const { statusCode } = res;
            const { user } = req;
            if (req.path.includes('/auth/login') && statusCode === 401) {
                await metrics_service_1.metricsService.trackSecurityEvent('failed_login', user?.id, {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    endpoint: req.path,
                });
            }
            if (statusCode === 403) {
                await metrics_service_1.metricsService.trackSecurityEvent('unauthorized_access', user?.id, {
                    ip: req.ip,
                    endpoint: req.path,
                    method: req.method,
                });
            }
        }
        catch (error) {
            console.error('Error in security metrics middleware:', error);
        }
    });
    next();
};
exports.securityMetricsMiddleware = securityMetricsMiddleware;
const createDatabaseMetricsWrapper = (queryType, queryFn) => {
    return async () => {
        const startTime = Date.now();
        let success = true;
        let result;
        try {
            result = await queryFn();
            return result;
        }
        catch (error) {
            success = false;
            throw error;
        }
        finally {
            const duration = Date.now() - startTime;
            try {
                await metrics_service_1.metricsService.trackDatabasePerformance(queryType, duration, success);
            }
            catch (metricsError) {
                console.error('Error tracking database metrics:', metricsError);
            }
        }
    };
};
exports.createDatabaseMetricsWrapper = createDatabaseMetricsWrapper;
const createCacheMetricsWrapper = (operation, cacheFn) => {
    return async () => {
        const startTime = Date.now();
        try {
            const result = await cacheFn();
            return result;
        }
        finally {
            const duration = Date.now() - startTime;
            try {
                await metrics_service_1.metricsService.trackCacheOperation(operation, duration);
            }
            catch (metricsError) {
                console.error('Error tracking cache metrics:', metricsError);
            }
        }
    };
};
exports.createCacheMetricsWrapper = createCacheMetricsWrapper;
const errorMetricsMiddleware = (error, req, res, next) => {
    metrics_service_1.metricsService.trackError(error.name || 'UnknownError', error.message, {
        stack: error.stack,
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id,
    });
    next(error);
};
exports.errorMetricsMiddleware = errorMetricsMiddleware;
const healthCheckMetricsMiddleware = async (req, res, next) => {
    try {
        const healthMetrics = {
            timestamp: Date.now(),
            components: {
                api: { healthy: true, responseTime: 50 },
                database: { healthy: true, connectionPool: 75 },
                cache: { healthy: true, hitRate: 85 },
                payment: { healthy: true, successRate: 98 },
            },
            overallScore: 95,
        };
        await metrics_service_1.metricsService.trackSystemHealth(healthMetrics);
        next();
    }
    catch (error) {
        console.error('Error in health check metrics middleware:', error);
        next(error);
    }
};
exports.healthCheckMetricsMiddleware = healthCheckMetricsMiddleware;
//# sourceMappingURL=metrics.middleware.js.map