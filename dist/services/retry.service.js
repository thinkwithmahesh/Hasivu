"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Retry = exports.retryWithConfig = exports.retryFileOperation = exports.retryRfidOperation = exports.retryExternalApiOperation = exports.retryPaymentOperation = exports.retryRedisOperation = exports.retryDatabaseOperation = exports.RetryService = exports.RetryConfigs = void 0;
/**
 * HASIVU Platform - Retry Service
 * Intelligent retry mechanism with exponential backoff and jitter
 * Handles transient failures across all service dependencies
 */
const logger_1 = require("@/utils/logger");
/**
 * Default retry configurations for different operation types
 */
exports.RetryConfigs = {
    DATABASE: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
        timeout: 30000
    },
    REDIS: {
        maxAttempts: 3,
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 2,
        jitter: true,
        timeout: 10000
    },
    PAYMENT_GATEWAY: {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 15000,
        backoffMultiplier: 2.5,
        jitter: true,
        timeout: 60000
    },
    EXTERNAL_API: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 8000,
        backoffMultiplier: 2,
        jitter: true,
        timeout: 20000
    },
    RFID_READER: {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 3000,
        backoffMultiplier: 1.5,
        jitter: false,
        timeout: 5000
    },
    FILE_OPERATIONS: {
        maxAttempts: 2,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2,
        jitter: false,
        timeout: 15000
    }
};
/**
 * Main retry service class
 */
class RetryService {
    /**
     * Execute an operation with retry logic
     */
    static async executeWithRetry(operation, config, operationName = 'unknown') {
        const startTime = Date.now();
        const errors = [];
        const delaySequence = [];
        let lastError;
        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                logger_1.logger.debug(`Attempting operation '${operationName}' (attempt ${attempt}/${config.maxAttempts})`);
                // Set timeout if configured
                if (config.timeout) {
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error(`Operation timeout after ${config.timeout}ms`)), config.timeout);
                    });
                    const result = await Promise.race([operation(), timeoutPromise]);
                    // Success case
                    logger_1.logger.info(`Operation '${operationName}' succeeded on attempt ${attempt}`);
                    return result;
                }
                else {
                    const result = await operation();
                    logger_1.logger.info(`Operation '${operationName}' succeeded on attempt ${attempt}`);
                    return result;
                }
            }
            catch (error) {
                lastError = error;
                errors.push(lastError);
                logger_1.logger.warn(`Operation '${operationName}' failed on attempt ${attempt}`, {
                    error: lastError.message,
                    attempt,
                    maxAttempts: config.maxAttempts
                });
                // Check if we should retry
                const shouldRetry = config.retryCondition
                    ? config.retryCondition(lastError)
                    : this.defaultRetryCondition(lastError);
                if (!shouldRetry || attempt === config.maxAttempts) {
                    break;
                }
                // Calculate delay for next attempt
                const delay = this.calculateDelay(attempt, config);
                delaySequence.push(delay);
                // Call onRetry callback if provided
                if (config.onRetry) {
                    config.onRetry(lastError, attempt);
                }
                // Wait before next attempt
                if (attempt < config.maxAttempts) {
                    logger_1.logger.debug(`Waiting ${delay}ms before retry attempt ${attempt + 1}`);
                    await this.delay(delay);
                }
            }
        }
        // All attempts failed
        const totalTime = Date.now() - startTime;
        logger_1.logger.error(`Operation '${operationName}' failed after ${config.maxAttempts} attempts`, {
            totalTime,
            attempts: config.maxAttempts,
            allErrors: errors.map(e => e.message),
            delaySequence
        });
        // Throw the last error
        throw lastError;
    }
    /**
     * Execute with retry and return detailed result
     */
    static async executeWithRetryResult(operation, config, operationName = 'unknown') {
        const startTime = Date.now();
        const errors = [];
        let result;
        let attempts = 0;
        try {
            result = await this.executeWithRetry(operation, config, operationName);
            attempts = errors.length + 1; // Include successful attempt
        }
        catch (error) {
            attempts = config.maxAttempts;
            throw error;
        }
        const totalTime = Date.now() - startTime;
        return {
            result,
            attempts,
            totalTime,
            lastError: errors[errors.length - 1],
            allErrors: errors
        };
    }
    /**
     * Calculate delay with exponential backoff and optional jitter
     */
    static calculateDelay(attempt, config) {
        // Base exponential backoff
        let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        // Apply maximum delay limit
        delay = Math.min(delay, config.maxDelay);
        // Add jitter if enabled (±25% of calculated delay)
        if (config.jitter) {
            const jitterRange = delay * 0.25;
            const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
            delay += jitterOffset;
        }
        // Ensure delay is positive
        return Math.max(Math.floor(delay), 100);
    }
    /**
     * Default retry condition - retry on network and temporary errors
     */
    static defaultRetryCondition(error) {
        // Network errors
        if (error.code === 'ECONNRESET' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND') {
            return true;
        }
        // HTTP errors that should be retried
        if (error.response?.status) {
            const status = error.response.status;
            // Retry on server errors (5xx) and some client errors
            if (status >= 500 || status === 408 || status === 429) {
                return true;
            }
        }
        // Database connection errors
        if (error.message?.includes('connection') ||
            error.message?.includes('timeout') ||
            error.message?.includes('ECONNRESET')) {
            return true;
        }
        // Redis errors
        if (error.message?.includes('Redis') ||
            error.message?.includes('READONLY')) {
            return true;
        }
        // Temporary file system errors
        if (error.code === 'EMFILE' ||
            error.code === 'ENFILE' ||
            error.code === 'EBUSY') {
            return true;
        }
        return false;
    }
    /**
     * Simple delay helper
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create retry metadata for monitoring
     */
    static createRetryMetadata(operationType, startTime, attempts, success, finalError, delaySequence = []) {
        return {
            operationType,
            startTime,
            endTime: Date.now(),
            totalAttempts: attempts,
            success,
            finalError,
            delaySequence
        };
    }
    /**
     * Get retry statistics for monitoring
     */
    static getRetryStats() {
        return {
            configuredOperations: Object.keys(exports.RetryConfigs),
            defaultConfigs: exports.RetryConfigs
        };
    }
}
exports.RetryService = RetryService;
/**
 * Convenience functions for common retry scenarios
 */
/**
 * Retry database operations
 */
const retryDatabaseOperation = async (operation, operationName = 'database') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.DATABASE, operationName);
};
exports.retryDatabaseOperation = retryDatabaseOperation;
/**
 * Retry Redis operations
 */
const retryRedisOperation = async (operation, operationName = 'redis') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.REDIS, operationName);
};
exports.retryRedisOperation = retryRedisOperation;
/**
 * Retry payment gateway operations
 */
const retryPaymentOperation = async (operation, operationName = 'payment') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.PAYMENT_GATEWAY, operationName);
};
exports.retryPaymentOperation = retryPaymentOperation;
/**
 * Retry external API operations
 */
const retryExternalApiOperation = async (operation, operationName = 'external-api') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.EXTERNAL_API, operationName);
};
exports.retryExternalApiOperation = retryExternalApiOperation;
/**
 * Retry RFID reader operations
 */
const retryRfidOperation = async (operation, operationName = 'rfid') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.RFID_READER, operationName);
};
exports.retryRfidOperation = retryRfidOperation;
/**
 * Retry file operations
 */
const retryFileOperation = async (operation, operationName = 'file') => {
    return RetryService.executeWithRetry(operation, exports.RetryConfigs.FILE_OPERATIONS, operationName);
};
exports.retryFileOperation = retryFileOperation;
/**
 * Retry with custom configuration
 */
const retryWithConfig = async (operation, config, operationName = 'custom') => {
    const fullConfig = {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
        ...config
    };
    return RetryService.executeWithRetry(operation, fullConfig, operationName);
};
exports.retryWithConfig = retryWithConfig;
/**
 * Async retry decorator for class methods
 */
function Retry(config = {}) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args) {
            const fullConfig = {
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                jitter: true,
                ...config
            };
            return RetryService.executeWithRetry(() => originalMethod.apply(this, args), fullConfig, `${target.constructor.name}.${propertyKey}`);
        };
        return descriptor;
    };
}
exports.Retry = Retry;
exports.default = RetryService;
