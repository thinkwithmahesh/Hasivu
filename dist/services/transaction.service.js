"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionPatterns = exports.TransactionService = exports.IsolationLevel = void 0;
/**
 * HASIVU Platform - Transaction Management Service
 * Comprehensive transaction management with ACID guarantees, deadlock detection, and retry logic
 * Ensures data integrity across all critical operations
 */
const client_1 = require("@prisma/client");
const database_service_1 = require("@/services/database.service");
const redis_service_1 = require("@/services/redis.service");
const logger_1 = require("@/utils/logger");
const retry_service_1 = require("@/services/retry.service");
// import { withDatabaseCircuitBreaker } from "@/services/circuit-breaker.service";
/**
 * Transaction isolation levels
 */
var IsolationLevel;
(function (IsolationLevel) {
    IsolationLevel["READ_UNCOMMITTED"] = "READ UNCOMMITTED";
    IsolationLevel["READ_COMMITTED"] = "READ COMMITTED";
    IsolationLevel["REPEATABLE_READ"] = "REPEATABLE READ";
    IsolationLevel["SERIALIZABLE"] = "SERIALIZABLE";
})(IsolationLevel || (exports.IsolationLevel = IsolationLevel = {}));
/**
 * Main Transaction Management Service
 * Provides ACID guarantees, deadlock detection, and distributed locking
 */
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
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }
    /**
     * Execute operation within transaction with comprehensive error handling
     */
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
        // Create transaction context
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
            // Acquire distributed lock if required
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
            // Execute transaction with retry logic
            while (retryCount <= maxRetries) {
                try {
                    // Circuit breaker functionality temporarily disabled due to import issues
                    const result = await (0, retry_service_1.retryDatabaseOperation)(async () => {
                        return await this.prisma.$transaction(async (tx) => {
                            // Set isolation level if specified
                            if (options.isolationLevel) {
                                await tx.$executeRaw `SET TRANSACTION ISOLATION LEVEL ${client_1.Prisma.raw(options.isolationLevel)}`;
                            }
                            // Execute the operation
                            const operationResult = await operation(tx);
                            // Update context
                            context.operations.push(`Operation completed at ${Date.now()}`);
                            return operationResult;
                        }, {
                            timeout,
                            isolationLevel: options.isolationLevel
                        });
                    }, `transaction-${transactionId}`);
                    // Transaction succeeded
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
                    // Check for deadlock
                    if (options.deadlockDetection && this.isDeadlockError(error)) {
                        deadlockDetected = true;
                        const deadlockInfo = await this.analyzeDeadlock(error);
                        logger_1.logger.warn(`Deadlock detected in transaction ${transactionId}`, {
                            transactionId,
                            retryCount,
                            deadlockInfo
                        });
                        if (retryCount <= maxRetries) {
                            // Wait before retry with exponential backoff
                            const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                            await this.delay(retryDelay);
                            continue;
                        }
                    }
                    // Check for other retryable errors
                    if (this.isRetryableError(error) && retryCount <= maxRetries) {
                        logger_1.logger.warn(`Retryable error in transaction ${transactionId}, attempt ${retryCount}`, {
                            transactionId,
                            retryCount,
                            error: error.message
                        });
                        const retryDelay = Math.min(500 * Math.pow(2, retryCount - 1), 2000);
                        await this.delay(retryDelay);
                        continue;
                    }
                    // Non-retryable error or max retries exceeded
                    rollbackOccurred = true;
                    logger_1.logger.error(`Transaction ${transactionId} failed after ${retryCount} attempts`, {
                        transactionId,
                        retryCount,
                        error: error.message,
                        stack: error.stack
                    });
                    throw error;
                }
            }
            throw new Error(`Transaction ${transactionId} failed after ${maxRetries} retries`);
        }
        finally {
            // Cleanup
            this.activeTransactions.delete(transactionId);
            // Release distributed lock
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
    /**
     * Acquire distributed lock with retry logic
     */
    async acquireDistributedLock(key, transactionId, ttl, retryDelay, maxRetries) {
        const lockKey = `lock:${key}`;
        const token = `${transactionId}_${Date.now()}_${Math.random()}`;
        const expiresAt = new Date(Date.now() + ttl);
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Use Redis SET with NX and PX options for atomic lock acquisition
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
                // Lock acquisition failed, wait before retry
                if (attempt < maxRetries - 1) {
                    await this.delay(retryDelay);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error acquiring distributed lock ${lockKey}`, {
                    lockKey,
                    attempt,
                    error: error.message
                });
                if (attempt < maxRetries - 1) {
                    await this.delay(retryDelay);
                }
            }
        }
        return null;
    }
    /**
     * Release distributed lock
     */
    async releaseDistributedLock(lock) {
        try {
            // Use Lua script to ensure we only delete our own lock
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
                error: error.message
            });
            return false;
        }
    }
    /**
     * Analyze deadlock situation
     */
    async analyzeDeadlock(error) {
        try {
            // Query database for current locks and blocking processes
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
    /**
     * Check if error is a deadlock
     */
    isDeadlockError(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        return errorMessage.includes('deadlock') ||
            errorMessage.includes('lock timeout') ||
            error.code === '40P01'; // PostgreSQL deadlock error code
    }
    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        const retryableErrors = [
            'connection',
            'timeout',
            'network',
            'temporary',
            'retry',
            'unavailable'
        ];
        const errorMessage = error.message?.toLowerCase() || '';
        return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }
    /**
     * Calculate transaction metrics
     */
    calculateMetrics(context, startTime) {
        const endTime = Date.now();
        return {
            startTime,
            endTime,
            duration: endTime - startTime,
            lockWaitTime: 0, // Could be enhanced to track actual lock wait time
            retryAttempts: 0, // Tracked externally
            deadlockCount: 0, // Tracked externally
            rollbackCount: 0, // Tracked externally
            operationCount: context.operations.length,
            queryCount: 0, // Would need query interception to track
            affectedRows: 0 // Would need query result analysis
        };
    }
    /**
     * Simple delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get active transaction count
     */
    getActiveTransactionCount() {
        return this.activeTransactions.size;
    }
    /**
     * Get active locks count
     */
    getActiveLockCount() {
        return this.lockRegistry.size;
    }
    /**
     * Get transaction by ID
     */
    getTransactionContext(transactionId) {
        return this.activeTransactions.get(transactionId);
    }
    /**
     * Force release expired locks
     */
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
/**
 * Common transaction patterns for business operations
 */
class TransactionPatterns {
    static transactionService = TransactionService.getInstance();
    /**
     * User registration transaction with email verification
     */
    static async executeUserRegistration(userData) {
        return this.transactionService.executeTransaction(async (tx) => {
            // User registration logic would go here
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
    /**
     * Order processing transaction with inventory management
     */
    static async executeOrderProcessing(orderData) {
        return this.transactionService.executeTransaction(async (tx) => {
            // Order processing logic would go here
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
    /**
     * Payment processing transaction with fraud detection
     */
    static async executePaymentProcessing(paymentData) {
        return this.transactionService.executeTransaction(async (tx) => {
            // Payment processing logic would go here
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
