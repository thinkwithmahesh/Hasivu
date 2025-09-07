"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerRegistry = exports.CircuitBreakerFactory = exports.CircuitBreaker = exports.CircuitBreakerTimeoutError = exports.CircuitBreakerOpenError = exports.CircuitBreakerError = exports.CircuitState = void 0;
/**
 * HASIVU Platform - Circuit Breaker Service
 * Comprehensive circuit breaker implementation with failure detection and automatic recovery
 * Prevents cascading failures across service dependencies
 */
const logger_1 = require("@/utils/logger");
const redis_service_1 = require("@/services/redis.service");
/**
 * Circuit breaker state enum
 */
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open"; // Testing if service has recovered
})(CircuitState || (exports.CircuitState = CircuitState = {}));
/**
 * Circuit breaker error types
 */
class CircuitBreakerError extends Error {
    circuitName;
    state;
    constructor(message, circuitName, state) {
        super(message);
        this.circuitName = circuitName;
        this.state = state;
        this.name = 'CircuitBreakerError';
    }
}
exports.CircuitBreakerError = CircuitBreakerError;
class CircuitBreakerOpenError extends CircuitBreakerError {
    constructor(circuitName) {
        super(`Circuit breaker '${circuitName}' is open`, circuitName, CircuitState.OPEN);
        this.name = 'CircuitBreakerOpenError';
    }
}
exports.CircuitBreakerOpenError = CircuitBreakerOpenError;
class CircuitBreakerTimeoutError extends CircuitBreakerError {
    constructor(circuitName, timeout) {
        super(`Circuit breaker '${circuitName}' timed out after ${timeout}ms`, circuitName, CircuitState.CLOSED);
        this.name = 'CircuitBreakerTimeoutError';
    }
}
exports.CircuitBreakerTimeoutError = CircuitBreakerTimeoutError;
/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
    config;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    totalRequests = 0;
    lastFailureTime = 0;
    lastSuccessTime = 0;
    nextRetryTime = 0;
    requestQueue = new Map();
    metrics = new Map();
    redis;
    constructor(config) {
        this.config = config;
        this.redis = redis_service_1.RedisService;
        this.validateConfig();
        this.startMetricsCleanup();
    }
    /**
     * Validate circuit breaker configuration
     */
    validateConfig() {
        if (this.config.failureThreshold < 1) {
            throw new Error('Failure threshold must be at least 1');
        }
        if (this.config.recoveryTimeout < 1000) {
            throw new Error('Recovery timeout must be at least 1000ms');
        }
        if (this.config.requestTimeout < 100) {
            throw new Error('Request timeout must be at least 100ms');
        }
    }
    /**
     * Execute a function with circuit breaker protection
     */
    async execute(operation) {
        this.totalRequests++;
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextRetryTime) {
                throw new CircuitBreakerOpenError(this.config.name);
            }
            // Try to transition to half-open
            this.state = CircuitState.HALF_OPEN;
            logger_1.logger.info(`Circuit breaker '${this.config.name}' transitioning to HALF_OPEN`);
        }
        const startTime = Date.now();
        const requestId = `${this.config.name}-${Date.now()}-${Math.random()}`;
        try {
            // Set timeout for the operation
            const timeoutPromise = new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    reject(new CircuitBreakerTimeoutError(this.config.name, this.config.requestTimeout));
                }, this.config.requestTimeout);
                this.requestQueue.set(requestId, {
                    resolve: () => clearTimeout(timeout),
                    reject: () => clearTimeout(timeout),
                    timeout
                });
            });
            // Execute operation with timeout
            const result = await Promise.race([operation(), timeoutPromise]);
            // Success - record metrics and handle state transitions
            this.onSuccess(startTime);
            this.cleanup(requestId);
            return result;
        }
        catch (error) {
            // Failure - record metrics and handle state transitions
            this.onFailure(error, startTime);
            this.cleanup(requestId);
            throw error;
        }
    }
    /**
     * Handle successful operation
     */
    onSuccess(startTime) {
        const responseTime = Date.now() - startTime;
        this.successCount++;
        this.lastSuccessTime = Date.now();
        // Record success metric
        this.recordMetric(true);
        logger_1.logger.debug(`Circuit breaker '${this.config.name}' - Success (${responseTime}ms)`);
        // Handle state transitions
        if (this.state === CircuitState.HALF_OPEN) {
            // Successful request in half-open state - close the circuit
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
            this.nextRetryTime = 0;
            logger_1.logger.info(`Circuit breaker '${this.config.name}' closed after successful recovery`);
        }
        // Reset failure count if enough time has passed
        if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
            this.failureCount = 0;
        }
    }
    /**
     * Handle failed operation
     */
    onFailure(error, startTime) {
        const responseTime = Date.now() - startTime;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        // Record failure metric
        this.recordMetric(false);
        logger_1.logger.warn(`Circuit breaker '${this.config.name}' - Failure (${responseTime}ms): ${error.message}`);
        // Check if we should open the circuit
        if (this.shouldOpenCircuit()) {
            this.openCircuit();
        }
    }
    /**
     * Determine if circuit should be opened
     */
    shouldOpenCircuit() {
        // Simple failure count threshold
        if (this.failureCount >= this.config.failureThreshold) {
            return true;
        }
        // Failure rate threshold (if enough requests have been made)
        if (this.totalRequests >= this.config.volumeThreshold) {
            const failureRate = this.calculateFailureRate();
            if (failureRate >= this.config.errorThresholdPercentage) {
                return true;
            }
        }
        return false;
    }
    /**
     * Open the circuit breaker
     */
    openCircuit() {
        this.state = CircuitState.OPEN;
        this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
        logger_1.logger.error(`Circuit breaker '${this.config.name}' opened. Next retry at ${new Date(this.nextRetryTime).toISOString()}`);
        // Cancel any pending requests
        this.cancelPendingRequests();
    }
    /**
     * Calculate current failure rate
     */
    calculateFailureRate() {
        const now = Date.now();
        const windowStart = now - this.config.monitoringWindow;
        let totalInWindow = 0;
        let failuresInWindow = 0;
        for (const [id, metric] of this.metrics.entries()) {
            if (metric.timestamp >= windowStart) {
                totalInWindow++;
                if (!metric.success) {
                    failuresInWindow++;
                }
            }
        }
        return totalInWindow > 0 ? (failuresInWindow / totalInWindow) * 100 : 0;
    }
    /**
     * Record metric for failure rate calculation
     */
    recordMetric(success) {
        const id = `${Date.now()}-${Math.random()}`;
        this.metrics.set(id, {
            timestamp: Date.now(),
            success
        });
    }
    /**
     * Cancel pending requests
     */
    cancelPendingRequests() {
        for (const [id, request] of this.requestQueue.entries()) {
            request.reject(new CircuitBreakerOpenError(this.config.name));
            this.requestQueue.delete(id);
        }
    }
    /**
     * Cleanup request
     */
    cleanup(requestId) {
        const request = this.requestQueue.get(requestId);
        if (request) {
            request.resolve();
            this.requestQueue.delete(requestId);
        }
    }
    /**
     * Start metrics cleanup process
     */
    startMetricsCleanup() {
        setInterval(() => {
            const now = Date.now();
            const cutoff = now - (this.config.monitoringWindow * 2); // Keep extra for safety
            for (const [id, metric] of this.metrics.entries()) {
                if (metric.timestamp < cutoff) {
                    this.metrics.delete(id);
                }
            }
        }, this.config.monitoringWindow);
    }
    /**
     * Get current circuit breaker statistics
     */
    getStats() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            totalRequests: this.totalRequests,
            lastFailureTime: this.lastFailureTime,
            lastSuccessTime: this.lastSuccessTime,
            nextRetryTime: this.nextRetryTime,
            failureRate: this.calculateFailureRate(),
            isOpen: this.state === CircuitState.OPEN,
            isHalfOpen: this.state === CircuitState.HALF_OPEN,
            isClosed: this.state === CircuitState.CLOSED
        };
    }
    /**
     * Force circuit state (for testing/manual intervention)
     */
    forceState(state) {
        logger_1.logger.warn(`Circuit breaker '${this.config.name}' state manually changed to ${state}`);
        this.state = state;
        if (state === CircuitState.CLOSED) {
            this.failureCount = 0;
            this.nextRetryTime = 0;
        }
        else if (state === CircuitState.OPEN) {
            this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
        }
    }
    /**
     * Reset circuit breaker to initial state
     */
    reset() {
        logger_1.logger.info(`Circuit breaker '${this.config.name}' reset`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.totalRequests = 0;
        this.lastFailureTime = 0;
        this.lastSuccessTime = 0;
        this.nextRetryTime = 0;
        this.metrics.clear();
        this.cancelPendingRequests();
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Circuit breaker factory for common configurations
 */
class CircuitBreakerFactory {
    /**
     * Create database circuit breaker
     */
    static createDatabaseCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `database-${operationName}`,
            failureThreshold: 5,
            recoveryTimeout: 30000, // 30 seconds
            requestTimeout: 10000, // 10 seconds
            resetTimeout: 60000, // 1 minute
            monitoringWindow: 60000, // 1 minute
            volumeThreshold: 10,
            errorThresholdPercentage: 50
        });
    }
    /**
     * Create Redis circuit breaker
     */
    static createRedisCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `redis-${operationName}`,
            failureThreshold: 3,
            recoveryTimeout: 15000, // 15 seconds
            requestTimeout: 5000, // 5 seconds
            resetTimeout: 30000, // 30 seconds
            monitoringWindow: 30000, // 30 seconds
            volumeThreshold: 5,
            errorThresholdPercentage: 40
        });
    }
    /**
     * Create payment service circuit breaker
     */
    static createPaymentCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `payment-${operationName}`,
            failureThreshold: 2,
            recoveryTimeout: 60000, // 1 minute
            requestTimeout: 15000, // 15 seconds
            resetTimeout: 300000, // 5 minutes
            monitoringWindow: 120000, // 2 minutes
            volumeThreshold: 3,
            errorThresholdPercentage: 25
        });
    }
    /**
     * Create external API circuit breaker
     */
    static createExternalApiCircuitBreaker(apiName) {
        return new CircuitBreaker({
            name: `external-api-${apiName}`,
            failureThreshold: 3,
            recoveryTimeout: 45000, // 45 seconds
            requestTimeout: 8000, // 8 seconds
            resetTimeout: 120000, // 2 minutes
            monitoringWindow: 60000, // 1 minute
            volumeThreshold: 5,
            errorThresholdPercentage: 40
        });
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
/**
 * Global circuit breaker registry
 */
class CircuitBreakerRegistry {
    static breakers = new Map();
    /**
     * Get or create circuit breaker
     */
    static getOrCreate(name, config) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(config));
        }
        return this.breakers.get(name);
    }
    /**
     * Get existing circuit breaker
     */
    static get(name) {
        return this.breakers.get(name);
    }
    /**
     * Remove circuit breaker
     */
    static remove(name) {
        const breaker = this.breakers.get(name);
        if (breaker) {
            breaker.reset();
            return this.breakers.delete(name);
        }
        return false;
    }
    /**
     * Get all circuit breaker stats
     */
    static getAllStats() {
        const stats = {};
        for (const [name, breaker] of this.breakers.entries()) {
            stats[name] = breaker.getStats();
        }
        return stats;
    }
    /**
     * Reset all circuit breakers
     */
    static resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
    /**
     * Get healthy circuit breakers
     */
    static getHealthyBreakers() {
        const healthy = [];
        for (const [name, breaker] of this.breakers.entries()) {
            const stats = breaker.getStats();
            if (stats.isClosed || stats.isHalfOpen) {
                healthy.push(name);
            }
        }
        return healthy;
    }
    /**
     * Get unhealthy circuit breakers
     */
    static getUnhealthyBreakers() {
        const unhealthy = [];
        for (const [name, breaker] of this.breakers.entries()) {
            const stats = breaker.getStats();
            if (stats.isOpen) {
                unhealthy.push(name);
            }
        }
        return unhealthy;
    }
}
exports.CircuitBreakerRegistry = CircuitBreakerRegistry;
exports.default = CircuitBreaker;
