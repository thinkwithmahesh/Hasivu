"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerRegistry = exports.CircuitBreakerFactory = exports.CircuitBreaker = exports.CircuitBreakerTimeoutError = exports.CircuitBreakerOpenError = exports.CircuitBreakerError = exports.CircuitState = void 0;
const logger_1 = require("@/utils/logger");
const redis_service_1 = require("@/services/redis.service");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "closed";
    CircuitState["OPEN"] = "open";
    CircuitState["HALF_OPEN"] = "half_open";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
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
    async execute(operation) {
        this.totalRequests++;
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextRetryTime) {
                throw new CircuitBreakerOpenError(this.config.name);
            }
            this.state = CircuitState.HALF_OPEN;
            logger_1.logger.info(`Circuit breaker '${this.config.name}' transitioning to HALF_OPEN`);
        }
        const startTime = Date.now();
        const requestId = `${this.config.name}-${Date.now()}-${Math.random()}`;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    reject(new CircuitBreakerTimeoutError(this.config.name, this.config.requestTimeout));
                }, this.config.requestTimeout);
                this.requestQueue.set(requestId, {
                    resolve: () => clearTimeout(timeout),
                    reject: (_error) => clearTimeout(timeout),
                    timeout
                });
            });
            const result = await Promise.race([operation(), timeoutPromise]);
            this.onSuccess(startTime);
            this.cleanup(requestId);
            return result;
        }
        catch (error) {
            this.onFailure(error, startTime);
            this.cleanup(requestId);
            throw error;
        }
    }
    onSuccess(startTime) {
        const responseTime = Date.now() - startTime;
        this.successCount++;
        this.lastSuccessTime = Date.now();
        this.recordMetric(true);
        logger_1.logger.debug(`Circuit breaker '${this.config.name}' - Success (${responseTime}ms)`);
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
            this.nextRetryTime = 0;
            logger_1.logger.info(`Circuit breaker '${this.config.name}' closed after successful recovery`);
        }
        if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
            this.failureCount = 0;
        }
    }
    onFailure(error, startTime) {
        const responseTime = Date.now() - startTime;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        this.recordMetric(false);
        logger_1.logger.warn(`Circuit breaker '${this.config.name}' - Failure (${responseTime}ms): ${error instanceof Error ? error.message : String(error)}`);
        if (this.shouldOpenCircuit()) {
            this.openCircuit();
        }
    }
    shouldOpenCircuit() {
        if (this.failureCount >= this.config.failureThreshold) {
            return true;
        }
        if (this.totalRequests >= this.config.volumeThreshold) {
            const failureRate = this.calculateFailureRate();
            if (failureRate >= this.config.errorThresholdPercentage) {
                return true;
            }
        }
        return false;
    }
    openCircuit() {
        this.state = CircuitState.OPEN;
        this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
        logger_1.logger.error(`Circuit breaker '${this.config.name}' opened. Next retry at ${new Date(this.nextRetryTime).toISOString()}`);
        this.cancelPendingRequests();
    }
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
    recordMetric(success) {
        const id = `${Date.now()}-${Math.random()}`;
        this.metrics.set(id, {
            timestamp: Date.now(),
            success
        });
    }
    cancelPendingRequests() {
        for (const [id, request] of this.requestQueue.entries()) {
            request.reject(new CircuitBreakerOpenError(this.config.name));
            this.requestQueue.delete(id);
        }
    }
    cleanup(requestId) {
        const request = this.requestQueue.get(requestId);
        if (request) {
            request.resolve();
            this.requestQueue.delete(requestId);
        }
    }
    startMetricsCleanup() {
        setInterval(() => {
            const now = Date.now();
            const cutoff = now - (this.config.monitoringWindow * 2);
            for (const [id, metric] of this.metrics.entries()) {
                if (metric.timestamp < cutoff) {
                    this.metrics.delete(id);
                }
            }
        }, this.config.monitoringWindow);
    }
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
class CircuitBreakerFactory {
    static createDatabaseCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `database-${operationName}`,
            failureThreshold: 5,
            recoveryTimeout: 30000,
            requestTimeout: 10000,
            resetTimeout: 60000,
            monitoringWindow: 60000,
            volumeThreshold: 10,
            errorThresholdPercentage: 50
        });
    }
    static createRedisCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `redis-${operationName}`,
            failureThreshold: 3,
            recoveryTimeout: 15000,
            requestTimeout: 5000,
            resetTimeout: 30000,
            monitoringWindow: 30000,
            volumeThreshold: 5,
            errorThresholdPercentage: 40
        });
    }
    static createPaymentCircuitBreaker(operationName) {
        return new CircuitBreaker({
            name: `payment-${operationName}`,
            failureThreshold: 2,
            recoveryTimeout: 60000,
            requestTimeout: 15000,
            resetTimeout: 300000,
            monitoringWindow: 120000,
            volumeThreshold: 3,
            errorThresholdPercentage: 25
        });
    }
    static createExternalApiCircuitBreaker(apiName) {
        return new CircuitBreaker({
            name: `external-api-${apiName}`,
            failureThreshold: 3,
            recoveryTimeout: 45000,
            requestTimeout: 8000,
            resetTimeout: 120000,
            monitoringWindow: 60000,
            volumeThreshold: 5,
            errorThresholdPercentage: 40
        });
    }
}
exports.CircuitBreakerFactory = CircuitBreakerFactory;
class CircuitBreakerRegistry {
    static breakers = new Map();
    static getOrCreate(name, config) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(config));
        }
        return this.breakers.get(name);
    }
    static get(name) {
        return this.breakers.get(name);
    }
    static remove(name) {
        const breaker = this.breakers.get(name);
        if (breaker) {
            breaker.reset();
            return this.breakers.delete(name);
        }
        return false;
    }
    static getAllStats() {
        const stats = {};
        for (const [name, breaker] of this.breakers.entries()) {
            stats[name] = breaker.getStats();
        }
        return stats;
    }
    static resetAll() {
        for (const breaker of this.breakers.values()) {
            breaker.reset();
        }
    }
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
//# sourceMappingURL=circuit-breaker.service.js.map