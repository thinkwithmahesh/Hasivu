"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPatterns = exports.TransactionService = exports.IsolationLevel = void 0;
const client_1 = require("@prisma/client");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
const retry_service_1 = require("@/services/retry.service");
var IsolationLevel;
(function (IsolationLevel) {
    IsolationLevel["READ_UNCOMMITTED"] = "READ UNCOMMITTED";
    IsolationLevel["READ_COMMITTED"] = "READ COMMITTED";
    IsolationLevel["REPEATABLE_READ"] = "REPEATABLE READ";
    IsolationLevel["SERIALIZABLE"] = "SERIALIZABLE";
})(IsolationLevel || (exports.IsolationLevel = IsolationLevel = {}));
class TransactionService {
    static instance;
    prisma;
    redisService;
    transactionCounter = 0;
    activeTransactions = new Map();
    lockRegistry = new Map();
    constructor() {
        this.prisma = typeof database_service_1.DatabaseService.getInstance === 'function' && typeof database_service_1.DatabaseService.getInstance().getPrismaClient === 'function'
            ? database_service_1.DatabaseService.getInstance().getPrismaClient()
            : database_service_1.DatabaseService.client;
        this.redisService = redis_service_1.RedisService;
    }
    static getInstance() {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }
    async executeTransaction(operation, options = {}) {
        const transactionId = `tx_${Date.now()}_${++this.transactionCounter}`;
        const startTime = Date.now();
        let lockAcquired = false;
        let deadlockDetected = false;
        let rollbackOccurred = false;
        let retryCount = 0;
        let distributedLock = null;
        const maxRetries = options.retryCount ?? 3;
        const timeout = options.timeout ?? 30000;
        logger_1.logger.info(`Starting transaction ${transactionId}`, {
            transactionId,
            options: {
                isolationLevel: options.isolationLevel,
                timeout,
                distributedLock: !!options.distributedLock
            }
        });
        const context = {
            transactionId,
            isolationLevel: options.isolationLevel ?? IsolationLevel.READ_COMMITTED,
            startTime,
            operations: [],
            locks: [],
            savepoints: []
        };
        this.activeTransactions.set(transactionId, context);
        try {
            if (options.distributedLock) {
                distributedLock = await this.acquireDistributedLock(options.distributedLock.key, transactionId, options.distributedLock.ttl ?? 30000, options.distributedLock.retryDelay ?? 100, options.distributedLock.maxRetries ?? 10);
                if (!distributedLock) {
                    throw new Error(`Failed to acquire distributed lock: ${options.distributedLock.key}`);
                }
                lockAcquired = true;
                context.locks.push(distributedLock);
                logger_1.logger.debug(`Distributed lock acquired for transaction ${transactionId}`, {
                    transactionId,
                    lockKey: distributedLock.key,
                    token: distributedLock.token
                });
            }
            while (retryCount <= maxRetries) {
                try {
                    const result = await (0, retry_service_1.retryDatabaseOperation)(async () => {
                        return await this.prisma.$transaction(async (tx) => {
                            if (options.isolationLevel) {
                                await tx.$executeRaw `SET TRANSACTION ISOLATION LEVEL ${client_1.Prisma.raw(options.isolationLevel)}`;
                            }
                            const operationResult = await operation(tx);
                            context.operations.push(`Operation completed at ${Date.now()}`);
                            return operationResult;
                        }, {
                            timeout,
                            isolationLevel: options.isolationLevel
                        });
                    }, `transaction-${transactionId}`);
                    const duration = Date.now() - startTime;
                    logger_1.logger.info(`Transaction ${transactionId} completed successfully`, {
                        transactionId,
                        duration,
                        retryCount,
                        lockAcquired,
                        deadlockDetected
                    });
                    const transactionResult = {
                        data: result,
                        transactionId,
                        duration,
                        retryCount,
                        deadlockDetected,
                        lockAcquired,
                        rollbackOccurred,
                        timestamp: new Date(),
                        metrics: options.metrics ? this.calculateMetrics(context, startTime) : undefined
                    };
                    return transactionResult;
                }
                catch (error) {
                    retryCount++;
                    if (options.deadlockDetection && this.isDeadlockError(error)) {
                        deadlockDetected = true;
                        const deadlockInfo = await this.analyzeDeadlock(error);
                        logger_1.logger.warn(`Deadlock detected in transaction ${transactionId}`, {
                            transactionId,
                            retryCount,
                            deadlockInfo
                        });
                        if (retryCount <= maxRetries) {
                            const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                            await this.delay(retryDelay);
                            continue;
                        }
                    }
                    if (this.isRetryableError(error) && retryCount <= maxRetries) {
                        logger_1.logger.warn(`Retryable error in transaction ${transactionId}, attempt ${retryCount}`, {
                            transactionId,
                            retryCount,
                            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
                        });
                        const retryDelay = Math.min(500 * Math.pow(2, retryCount - 1), 2000);
                        await this.delay(retryDelay);
                        continue;
                    }
                    rollbackOccurred = true;
                    logger_1.logger.error(`Transaction ${transactionId} failed after ${retryCount} attempts`, {
                        transactionId,
                        retryCount,
                        error: error.message || String(error),
                        stack: error.stack
                    });
                    throw error;
                }
            }
            throw new Error(`Transaction ${transactionId} failed after ${maxRetries} retries`);
        }
        finally {
            this.activeTransactions.delete(transactionId);
            if (distributedLock) {
                await this.releaseDistributedLock(distributedLock);
                logger_1.logger.debug(`Distributed lock released for transaction ${transactionId}`, {
                    transactionId,
                    lockKey: distributedLock.key
                });
            }
            const totalDuration = Date.now() - startTime;
            logger_1.logger.debug(`Transaction ${transactionId} cleanup completed`, {
                transactionId,
                totalDuration,
                lockReleased: !!distributedLock
            });
        }
    }
    async acquireDistributedLock(key, transactionId, ttl, retryDelay, maxRetries) {
        const lockKey = `lock:${key}`;
        const token = `${transactionId}_${Date.now()}_${Math.random()}`;
        const expiresAt = new Date(Date.now() + ttl);
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const luaScript = `
          if redis.call("set", KEYS[1], ARGV[1], "NX", "PX", ARGV[2]) then
            return 1
          else
            return 0
          end
        `;
                const result = typeof this.redisService.eval === 'function'
                    ? await this.redisService.eval(luaScript, [lockKey], [token, ttl.toString()])
                    : 0;
                if (result === 1) {
                    const lock = {
                        key: lockKey,
                        token,
                        ttl,
                        acquiredAt: new Date(),
                        expiresAt
                    };
                    this.lockRegistry.set(lockKey, lock);
                    return lock;
                }
                if (attempt < maxRetries - 1) {
                    await this.delay(retryDelay);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error acquiring distributed lock ${lockKey}`, {
                    lockKey,
                    attempt,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
                });
                if (attempt < maxRetries - 1) {
                    await this.delay(retryDelay);
                }
            }
        }
        return null;
    }
    async releaseDistributedLock(lock) {
        try {
            const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
            const result = typeof this.redisService.eval === 'function'
                ? await this.redisService.eval(luaScript, [lock.key], [lock.token])
                : 0;
            if (result === 1) {
                this.lockRegistry.delete(lock.key);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error(`Error releasing distributed lock ${lock.key}`, {
                lockKey: lock.key,
                token: lock.token,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return false;
        }
    }
    async analyzeDeadlock(error) {
        try {
            const blockingQueries = await this.prisma.$queryRaw `
        SELECT 
          blocked_locks.pid AS blocked_pid,
          blocking_locks.pid AS blocking_pid,
          blocked_activity.query AS blocked_query,
          blocking_activity.query AS blocking_query,
          blocked_locks.mode AS lock_type
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        JOIN pg_catalog.pg_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted
        AND blocking_locks.granted
        AND blocked_locks.pid != blocking_locks.pid
      `;
            const processes = blockingQueries.map(lock => ({
                pid: lock.blocked_pid,
                query: lock.blocked_query,
                waitingFor: `PID ${lock.blocking_pid} blocked by PID ${lock.blocking_pid}`,
                lockType: lock.lock_type
            }));
            return {
                detected: true,
                processes,
                resolution: 'retry',
                timestamp: new Date()
            };
        }
        catch (analysisError) {
            logger_1.logger.error('Error analyzing deadlock', { error: analysisError.message });
            return {
                detected: true,
                processes: [],
                resolution: 'abort',
                timestamp: new Date()
            };
        }
    }
    isDeadlockError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error)?.toLowerCase() || '';
        return errorMessage.includes('deadlock') ||
            errorMessage.includes('lock timeout') ||
            error.code === '40P01';
    }
    isRetryableError(error) {
        const retryableErrors = [
            'connection',
            'timeout',
            'network',
            'temporary',
            'retry',
            'unavailable'
        ];
        const errorMessage = error instanceof Error ? error.message : String(error)?.toLowerCase() || '';
        return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }
    calculateMetrics(context, startTime) {
        const endTime = Date.now();
        return {
            startTime,
            endTime,
            duration: endTime - startTime,
            lockWaitTime: 0,
            retryAttempts: 0,
            deadlockCount: 0,
            rollbackCount: 0,
            operationCount: context.operations.length,
            queryCount: 0,
            affectedRows: 0
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getActiveTransactionCount() {
        return this.activeTransactions.size;
    }
    getActiveLockCount() {
        return this.lockRegistry.size;
    }
    getTransactionContext(transactionId) {
        return this.activeTransactions.get(transactionId);
    }
    async cleanupExpiredLocks() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [key, lock] of this.lockRegistry.entries()) {
            if (lock.expiresAt < now) {
                await this.releaseDistributedLock(lock);
                cleanedCount++;
            }
        }
        logger_1.logger.info(`Cleaned up ${cleanedCount} expired locks`);
        return cleanedCount;
    }
}
exports.TransactionService = TransactionService;
class TransactionPatterns {
    static transactionService = TransactionService.getInstance();
    static async executeUserRegistration(userData) {
        return this.transactionService.executeTransaction(async (tx) => {
            return userData;
        }, {
            distributedLock: {
                key: `user-registration-${userData.email}`,
                ttl: 10000
            },
            deadlockDetection: true,
            timeout: 15000
        });
    }
    static async executeOrderProcessing(orderData) {
        return this.transactionService.executeTransaction(async (tx) => {
            return orderData;
        }, {
            distributedLock: {
                key: `product-${orderData.productId}`,
                ttl: 20000
            },
            isolationLevel: IsolationLevel.SERIALIZABLE,
            deadlockDetection: true,
            retryCount: 5
        });
    }
    static async executePaymentProcessing(paymentData) {
        return this.transactionService.executeTransaction(async (tx) => {
            return paymentData;
        }, {
            distributedLock: {
                key: `order-payment-${paymentData.orderId}`,
                ttl: 30000
            },
            isolationLevel: IsolationLevel.READ_COMMITTED,
            deadlockDetection: true,
            retryCount: 3,
            metrics: true
        });
    }
}
exports.TransactionPatterns = TransactionPatterns;
exports.default = TransactionService;
//# sourceMappingURL=transaction.service.js.map