/**
 * HASIVU Platform - Circuit Breaker Service
 * Comprehensive circuit breaker implementation with failure detection and automatic recovery
 * Prevents cascading failures across service dependencies
 */
import { logger } from '@/utils/logger';
import { RedisService } from '@/services/redis.service';

/**
 * Circuit breaker state enum
 */
export enum CircuitState {
  CLOSED = 'closed',    // Normal operation, requests pass through
  OPEN = 'open',        // Circuit is open, requests fail fast
  HALF_OPEN = 'half_open' // Testing if service has recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;      // Time to wait before attempting recovery (ms)
  requestTimeout: number;       // Individual request timeout (ms)
  resetTimeout: number;         // Time to reset failure count (ms)
  monitoringWindow: number;     // Window for failure rate calculation (ms)
  volumeThreshold: number;      // Minimum requests before calculating failure rate
  errorThresholdPercentage: number; // Percentage of errors to trigger opening
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextRetryTime: number;
  failureRate: number;
  isOpen: boolean;
  isHalfOpen: boolean;
  isClosed: boolean;
}

/**
 * Circuit breaker error types
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public circuitName: string, public state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreakerOpenError extends CircuitBreakerError {
  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' is open`, circuitName, CircuitState.OPEN);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends CircuitBreakerError {
  constructor(circuitName: string, timeout: number) {
    super(`Circuit breaker '${circuitName}' timed out after ${timeout}ms`, circuitName, CircuitState.CLOSED);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private nextRetryTime: number = 0;
  private requestQueue: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map();
  private metrics: Map<string, { timestamp: number, success: boolean }> = new Map();
  private redis: typeof RedisService;

  constructor(private config: CircuitBreakerConfig) {
    this.redis = RedisService;
    this.validateConfig();
    this.startMetricsCleanup();
  }

  /**
   * Validate circuit breaker configuration
   */
  private validateConfig(): void {
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
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextRetryTime) {
        throw new CircuitBreakerOpenError(this.config.name);
      }
      // Try to transition to half-open
      this.state = CircuitState.HALF_OPEN;
      logger.info(`Circuit breaker '${this.config.name}' transitioning to HALF_OPEN`);
    }

    const startTime = Date.now();
    const requestId = `${this.config.name}-${Date.now()}-${Math.random()}`;

    try {
      // Set timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
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
      
    } catch (error) {
      // Failure - record metrics and handle state transitions
      this.onFailure(error as Error, startTime);
      this.cleanup(requestId);
      
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.successCount++;
    this.lastSuccessTime = Date.now();
    
    // Record success metric
    this.recordMetric(true);
    
    logger.debug(`Circuit breaker '${this.config.name}' - Success (${responseTime}ms)`);
    
    // Handle state transitions
    if (this.state === CircuitState.HALF_OPEN) {
      // Successful request in half-open state - close the circuit
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.nextRetryTime = 0;
      logger.info(`Circuit breaker '${this.config.name}' closed after successful recovery`);
    }
    
    // Reset failure count if enough time has passed
    if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error, startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Record failure metric
    this.recordMetric(false);
    
    logger.warn(`Circuit breaker '${this.config.name}' - Failure (${responseTime}ms): ${error.message}`);
    
    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.openCircuit();
    }
  }

  /**
   * Determine if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
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
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
    
    logger.error(`Circuit breaker '${this.config.name}' opened. Next retry at ${new Date(this.nextRetryTime).toISOString()}`);
    
    // Cancel any pending requests
    this.cancelPendingRequests();
  }

  /**
   * Calculate current failure rate
   */
  private calculateFailureRate(): number {
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
  private recordMetric(success: boolean): void {
    const id = `${Date.now()}-${Math.random()}`;
    this.metrics.set(id, {
      timestamp: Date.now(),
      success
    });
  }

  /**
   * Cancel pending requests
   */
  private cancelPendingRequests(): void {
    for (const [id, request] of this.requestQueue.entries()) {
      request.reject(new CircuitBreakerOpenError(this.config.name));
      this.requestQueue.delete(id);
    }
  }

  /**
   * Cleanup request
   */
  private cleanup(requestId: string): void {
    const request = this.requestQueue.get(requestId);
    if (request) {
      request.resolve();
      this.requestQueue.delete(requestId);
    }
  }

  /**
   * Start metrics cleanup process
   */
  private startMetricsCleanup(): void {
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
  getStats(): CircuitBreakerStats {
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
  forceState(state: CircuitState): void {
    logger.warn(`Circuit breaker '${this.config.name}' state manually changed to ${state}`);
    this.state = state;
    
    if (state === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.nextRetryTime = 0;
    } else if (state === CircuitState.OPEN) {
      this.nextRetryTime = Date.now() + this.config.recoveryTimeout;
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    logger.info(`Circuit breaker '${this.config.name}' reset`);
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

/**
 * Circuit breaker factory for common configurations
 */
export class CircuitBreakerFactory {
  /**
   * Create database circuit breaker
   */
  static createDatabaseCircuitBreaker(operationName: string): CircuitBreaker {
    return new CircuitBreaker({
      name: `database-${operationName}`,
      failureThreshold: 5,
      recoveryTimeout: 30000,  // 30 seconds
      requestTimeout: 10000,   // 10 seconds
      resetTimeout: 60000,     // 1 minute
      monitoringWindow: 60000, // 1 minute
      volumeThreshold: 10,
      errorThresholdPercentage: 50
    });
  }

  /**
   * Create Redis circuit breaker
   */
  static createRedisCircuitBreaker(operationName: string): CircuitBreaker {
    return new CircuitBreaker({
      name: `redis-${operationName}`,
      failureThreshold: 3,
      recoveryTimeout: 15000,  // 15 seconds
      requestTimeout: 5000,    // 5 seconds
      resetTimeout: 30000,     // 30 seconds
      monitoringWindow: 30000, // 30 seconds
      volumeThreshold: 5,
      errorThresholdPercentage: 40
    });
  }

  /**
   * Create payment service circuit breaker
   */
  static createPaymentCircuitBreaker(operationName: string): CircuitBreaker {
    return new CircuitBreaker({
      name: `payment-${operationName}`,
      failureThreshold: 2,
      recoveryTimeout: 60000,  // 1 minute
      requestTimeout: 15000,   // 15 seconds
      resetTimeout: 300000,    // 5 minutes
      monitoringWindow: 120000, // 2 minutes
      volumeThreshold: 3,
      errorThresholdPercentage: 25
    });
  }

  /**
   * Create external API circuit breaker
   */
  static createExternalApiCircuitBreaker(apiName: string): CircuitBreaker {
    return new CircuitBreaker({
      name: `external-api-${apiName}`,
      failureThreshold: 3,
      recoveryTimeout: 45000,  // 45 seconds
      requestTimeout: 8000,    // 8 seconds
      resetTimeout: 120000,    // 2 minutes
      monitoringWindow: 60000, // 1 minute
      volumeThreshold: 5,
      errorThresholdPercentage: 40
    });
  }
}

/**
 * Global circuit breaker registry
 */
export class CircuitBreakerRegistry {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create circuit breaker
   */
  static getOrCreate(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get existing circuit breaker
   */
  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  static remove(name: string): boolean {
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
  static getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Get healthy circuit breakers
   */
  static getHealthyBreakers(): string[] {
    const healthy: string[] = [];
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
  static getUnhealthyBreakers(): string[] {
    const unhealthy: string[] = [];
    for (const [name, breaker] of this.breakers.entries()) {
      const stats = breaker.getStats();
      if (stats.isOpen) {
        unhealthy.push(name);
      }
    }
    return unhealthy;
  }
}

export default CircuitBreaker;