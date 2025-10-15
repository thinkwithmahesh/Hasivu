"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredIdempotencyKeys = exports.generateIdempotencyKey = exports.idempotencyMiddleware = void 0;
const logger_1 = require("../../utils/logger");
const redis_service_1 = require("../../services/redis.service");
const idempotencyMiddleware = (options = {}) => {
    const { headerName = 'Idempotency-Key', ttlSeconds = 24 * 60 * 60, includeUserId = true, allowedMethods = ['POST', 'PUT', 'PATCH'], } = options;
    return {
        before: async (event) => {
            try {
                if (!allowedMethods.includes(event.httpMethod || '')) {
                    return null;
                }
                const idempotencyKey = event.headers?.[headerName.toLowerCase()] || event.headers?.[headerName];
                if (!idempotencyKey) {
                    logger_1.logger.warn('Idempotency key missing for operation that should be idempotent', {
                        method: event.httpMethod,
                        path: event.path,
                    });
                    return null;
                }
                if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(idempotencyKey)) {
                    return {
                        statusCode: 400,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            error: 'Invalid idempotency key format. Must be a valid UUID.',
                            code: 'INVALID_IDEMPOTENCY_KEY',
                        }),
                    };
                }
                const userId = includeUserId
                    ? event.requestContext?.authorizer?.userId || event.headers?.['x-user-id']
                    : undefined;
                const compositeKey = userId ? `${userId}:${idempotencyKey}` : idempotencyKey;
                const existingRecordJson = await redis_service_1.redisService.get(`idempotency:${compositeKey}`);
                if (existingRecordJson) {
                    const existingRecord = JSON.parse(existingRecordJson);
                    if (Date.now() > existingRecord.expiresAt) {
                        await redis_service_1.redisService.del(`idempotency:${compositeKey}`);
                        logger_1.logger.info('Expired idempotency key cleaned up', { key: compositeKey });
                    }
                    else {
                        logger_1.logger.info('Idempotency key found, returning cached response', {
                            key: compositeKey,
                            statusCode: existingRecord.statusCode,
                        });
                        return {
                            statusCode: existingRecord.statusCode || 200,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Idempotency-Cached': 'true',
                            },
                            body: existingRecord.response ||
                                JSON.stringify({
                                    message: 'Operation already processed',
                                    cached: true,
                                }),
                        };
                    }
                }
                const record = {
                    key: compositeKey,
                    userId,
                    method: event.httpMethod || '',
                    path: event.path,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + ttlSeconds * 1000,
                };
                await redis_service_1.redisService.set(`idempotency:${compositeKey}`, JSON.stringify(record), ttlSeconds);
                event.idempotencyKey = compositeKey;
                logger_1.logger.info('Idempotency key registered', {
                    key: compositeKey,
                    method: event.httpMethod,
                    path: event.path,
                });
                return null;
            }
            catch (error) {
                logger_1.logger.error('Idempotency middleware error', error, {
                    method: event.httpMethod,
                    path: event.path,
                });
                return {
                    statusCode: 500,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        error: 'Internal server error',
                        code: 'IDEMPOTENCY_ERROR',
                    }),
                };
            }
        },
        after: async (event, result) => {
            try {
                const compositeKey = event.idempotencyKey;
                if (compositeKey) {
                    const existingRecordJson = await redis_service_1.redisService.get(`idempotency:${compositeKey}`);
                    if (existingRecordJson) {
                        const existingRecord = JSON.parse(existingRecordJson);
                        existingRecord.statusCode = result.statusCode;
                        existingRecord.response = result.body;
                        const ttlRemaining = Math.max(1, Math.floor((existingRecord.expiresAt - Date.now()) / 1000));
                        await redis_service_1.redisService.set(`idempotency:${compositeKey}`, JSON.stringify(existingRecord), ttlRemaining);
                        logger_1.logger.info('Idempotency response cached', {
                            key: compositeKey,
                            statusCode: result.statusCode,
                        });
                    }
                }
                return result;
            }
            catch (error) {
                logger_1.logger.error('Failed to cache idempotency response', error, {
                    key: event.idempotencyKey,
                });
                return result;
            }
        },
    };
};
exports.idempotencyMiddleware = idempotencyMiddleware;
const generateIdempotencyKey = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.generateIdempotencyKey = generateIdempotencyKey;
const cleanupExpiredIdempotencyKeys = async () => {
    try {
        logger_1.logger.info('Idempotency key cleanup completed (Redis handles expiration automatically)');
        return 0;
    }
    catch (error) {
        logger_1.logger.error('Failed to cleanup expired idempotency keys', undefined, {
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        return 0;
    }
};
exports.cleanupExpiredIdempotencyKeys = cleanupExpiredIdempotencyKeys;
//# sourceMappingURL=idempotency.middleware.js.map