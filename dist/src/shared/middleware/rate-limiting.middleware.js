"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRateLimitStatus = exports.webhookRateLimiter = exports.paymentCreationRateLimiter = exports.paymentRateLimiter = exports.ipKeyGenerator = exports.userKeyGenerator = exports.rateLimitingMiddleware = void 0;
const logger_1 = require("../../utils/logger");
const redis_service_1 = require("../../services/redis.service");
const rateLimitingMiddleware = (options) => {
    const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator, skipSuccessfulRequests = false, skipFailedRequests = false, } = options;
    return {
        before: async (event) => {
            try {
                const key = keyGenerator(event);
                const now = Date.now();
                const windowStart = Math.floor(now / windowMs) * windowMs;
                const windowKey = `${key}:${windowStart}`;
                const currentCount = parseInt((await redis_service_1.redisService.get(windowKey)) || '0');
                if (currentCount >= maxRequests) {
                    logger_1.logger.warn('Rate limit exceeded', {
                        key,
                        currentCount,
                        maxRequests,
                        windowMs,
                        path: event.path,
                        method: event.httpMethod,
                    });
                    return {
                        statusCode: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': Math.ceil(windowMs / 1000).toString(),
                            'X-RateLimit-Limit': maxRequests.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': (windowStart + windowMs).toString(),
                        },
                        body: JSON.stringify({
                            error: 'Too many requests',
                            message: 'Rate limit exceeded. Please try again later.',
                            retryAfter: Math.ceil(windowMs / 1000),
                        }),
                    };
                }
                await redis_service_1.redisService.set(windowKey, (currentCount + 1).toString(), Math.ceil(windowMs / 1000));
                event.rateLimitInfo = {
                    limit: maxRequests,
                    remaining: maxRequests - currentCount - 1,
                    reset: windowStart + windowMs,
                };
                return null;
            }
            catch (error) {
                logger_1.logger.error('Rate limiting middleware error', error, {
                    path: event.path,
                    method: event.httpMethod,
                });
                return null;
            }
        },
        after: async (event, result) => {
            const { rateLimitInfo } = event;
            if (rateLimitInfo) {
                const headers = {
                    ...result.headers,
                    'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
                    'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
                    'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
                };
                return {
                    ...result,
                    headers,
                };
            }
            return result;
        },
    };
};
exports.rateLimitingMiddleware = rateLimitingMiddleware;
function defaultKeyGenerator(event) {
    const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const path = event.path || 'unknown';
    const method = event.httpMethod || 'unknown';
    return `ratelimit:${sourceIp}:${method}:${path}`;
}
const userKeyGenerator = (event) => {
    const userId = event.requestContext?.authorizer?.userId ||
        event.headers?.['x-user-id'] ||
        event.requestContext?.identity?.sourceIp ||
        'anonymous';
    const path = event.path || 'unknown';
    const method = event.httpMethod || 'unknown';
    return `ratelimit:user:${userId}:${method}:${path}`;
};
exports.userKeyGenerator = userKeyGenerator;
const ipKeyGenerator = (event) => {
    const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const path = event.path || 'unknown';
    const method = event.httpMethod || 'unknown';
    return `ratelimit:ip:${sourceIp}:${method}:${path}`;
};
exports.ipKeyGenerator = ipKeyGenerator;
exports.paymentRateLimiter = (0, exports.rateLimitingMiddleware)({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyGenerator: exports.userKeyGenerator,
});
exports.paymentCreationRateLimiter = (0, exports.rateLimitingMiddleware)({
    windowMs: 5 * 60 * 1000,
    maxRequests: 3,
    keyGenerator: exports.userKeyGenerator,
});
exports.webhookRateLimiter = (0, exports.rateLimitingMiddleware)({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: exports.ipKeyGenerator,
});
const getRateLimitStatus = async (key, windowMs) => {
    try {
        const now = Date.now();
        const windowStart = Math.floor(now / windowMs) * windowMs;
        const windowKey = `${key}:${windowStart}`;
        const current = parseInt((await redis_service_1.redisService.get(windowKey)) || '0');
        const reset = windowStart + windowMs;
        return {
            current,
            limit: 0,
            remaining: 0,
            reset,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to get rate limit status', error, { key });
        return null;
    }
};
exports.getRateLimitStatus = getRateLimitStatus;
//# sourceMappingURL=rate-limiting.middleware.js.map