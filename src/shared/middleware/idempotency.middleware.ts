/**
 * Idempotency Middleware
 * Ensures operations can be safely retried without side effects
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../utils/logger';
import { redisService } from '../../services/redis.service';

export interface IdempotencyOptions {
  headerName?: string;
  ttlSeconds?: number;
  includeUserId?: boolean;
  allowedMethods?: string[];
}

/**
 * Idempotency key storage interface
 */
interface IdempotencyRecord {
  key: string;
  userId?: string;
  method: string;
  path: string;
  statusCode?: number;
  response?: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Idempotency middleware
 */
export const idempotencyMiddleware = (options: IdempotencyOptions = {}) => {
  const {
    headerName = 'Idempotency-Key',
    ttlSeconds = 24 * 60 * 60, // 24 hours default
    includeUserId = true,
    allowedMethods = ['POST', 'PUT', 'PATCH'],
  } = options;

  return {
    before: async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult | null> => {
      try {
        // Only apply to specified methods
        if (!allowedMethods.includes(event.httpMethod || '')) {
          return null;
        }

        // Check for idempotency key
        const idempotencyKey =
          event.headers?.[headerName.toLowerCase()] || event.headers?.[headerName];
        if (!idempotencyKey) {
          // Idempotency key is optional but recommended for payment operations
          logger.warn('Idempotency key missing for operation that should be idempotent', {
            method: event.httpMethod,
            path: event.path,
          });
          return null;
        }

        // Validate idempotency key format (should be UUID or similar)
        if (
          !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(idempotencyKey)
        ) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Invalid idempotency key format. Must be a valid UUID.',
              code: 'INVALID_IDEMPOTENCY_KEY',
            }),
          };
        }

        // Extract user ID
        const userId = includeUserId
          ? event.requestContext?.authorizer?.userId || event.headers?.['x-user-id']
          : undefined;

        // Create composite key
        const compositeKey = userId ? `${userId}:${idempotencyKey}` : idempotencyKey;

        // Check if key exists in Redis
        const existingRecordJson = await redisService.get(`idempotency:${compositeKey}`);

        if (existingRecordJson) {
          const existingRecord: IdempotencyRecord = JSON.parse(existingRecordJson);

          // Check if expired
          if (Date.now() > existingRecord.expiresAt) {
            // Clean up expired record
            await redisService.del(`idempotency:${compositeKey}`);
            logger.info('Expired idempotency key cleaned up', { key: compositeKey });
          } else {
            // Return cached response
            logger.info('Idempotency key found, returning cached response', {
              key: compositeKey,
              statusCode: existingRecord.statusCode,
            });

            return {
              statusCode: existingRecord.statusCode || 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Cached': 'true',
              },
              body:
                existingRecord.response ||
                JSON.stringify({
                  message: 'Operation already processed',
                  cached: true,
                }),
            };
          }
        }

        // Store the key for future requests
        const record: IdempotencyRecord = {
          key: compositeKey,
          userId,
          method: event.httpMethod || '',
          path: event.path,
          createdAt: Date.now(),
          expiresAt: Date.now() + ttlSeconds * 1000,
        };

        await redisService.set(`idempotency:${compositeKey}`, JSON.stringify(record), ttlSeconds);

        // Add idempotency key to request context for later use
        (event as any).idempotencyKey = compositeKey;

        logger.info('Idempotency key registered', {
          key: compositeKey,
          method: event.httpMethod,
          path: event.path,
        });

        return null; // Continue to handler
      } catch (error) {
        logger.error('Idempotency middleware error', error as Error, {
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

    after: async (
      event: APIGatewayProxyEvent,
      result: APIGatewayProxyResult
    ): Promise<APIGatewayProxyResult> => {
      try {
        // Update the idempotency record with the response
        const compositeKey = (event as any).idempotencyKey;
        if (compositeKey) {
          const existingRecordJson = await redisService.get(`idempotency:${compositeKey}`);
          if (existingRecordJson) {
            const existingRecord: IdempotencyRecord = JSON.parse(existingRecordJson);
            existingRecord.statusCode = result.statusCode;
            existingRecord.response = result.body;

            // Update with same TTL
            const ttlRemaining = Math.max(
              1,
              Math.floor((existingRecord.expiresAt - Date.now()) / 1000)
            );
            await redisService.set(
              `idempotency:${compositeKey}`,
              JSON.stringify(existingRecord),
              ttlRemaining
            );

            logger.info('Idempotency response cached', {
              key: compositeKey,
              statusCode: result.statusCode,
            });
          }
        }

        return result;
      } catch (error) {
        logger.error('Failed to cache idempotency response', error as Error, {
          key: (event as any).idempotencyKey,
        });
        // Don't fail the request if caching fails
        return result;
      }
    },
  };
};

/**
 * Generate idempotency key utility
 */
export const generateIdempotencyKey = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Clean up expired idempotency keys (should be run periodically)
 * Note: Redis automatically expires keys, so this is mainly for monitoring
 */
export const cleanupExpiredIdempotencyKeys = async (): Promise<number> => {
  try {
    // Redis handles expiration automatically, but we can log the cleanup
    logger.info('Idempotency key cleanup completed (Redis handles expiration automatically)');
    return 0; // Redis handles cleanup automatically
  } catch (error) {
    logger.error('Failed to cleanup expired idempotency keys', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
};
