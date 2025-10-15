/**
 * HASIVU Circuit Breaker Pattern Implementation
 * Epic 3 → Story 3: Performance Monitoring System
 *
 * Intelligent failure handling and recovery system with adaptive thresholds,
 * multi-service coordination, and automated fallback strategies for resilient
 * 500+ school multi-tenant architecture.
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { MetricsCollector } from '../../1-real-time-monitoring/custom-monitoring-agents/metrics-collector';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type FailureType = 'TIMEOUT' | 'ERROR' | 'RATE_LIMIT' | 'DEPENDENCY' | 'RESOURCE' | 'CUSTOM';

export interface CircuitBreakerConfig {
  name: string;
  requestVolumeThreshold: number; // Minimum requests before circuit can trip
  errorThresholdPercentage: number; // Error percentage that trips circuit
  timeoutMs: number; // Request timeout
  sleepWindowMs: number; // Time circuit stays open
  halfOpenMaxCalls: number; // Max calls in half-open state
  successThreshold: number; // Successes needed to close circuit
  rollingWindowSizeMs: number; // Rolling window for error calculation
  forceOpen?: boolean; // Force circuit open
  forceClosed?: boolean; // Force circuit closed
  enableMetrics: boolean; // Enable detailed metrics
  fallbackEnabled: boolean; // Enable fallback functionality
  adaptiveThresholds: boolean; // Enable adaptive threshold adjustment
}

export interface CircuitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  shortCircuited: number;
  fallbackCalls: number;
  averageResponseTime: number;
  lastRequestTime?: Date;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  rollingWindow: Array<{
    timestamp: Date;
    success: boolean;
    responseTime: number;
    error?: Error;
  }>;
}

export interface CircuitEvent {
  timestamp: Date;
  circuitName: string;
  event:
    | 'STATE_CHANGE'
    | 'REQUEST_SUCCESS'
    | 'REQUEST_FAILURE'
    | 'FALLBACK_EXECUTED'
    | 'THRESHOLD_ADJUSTED';
  data: any;
  schoolId?: string;
  metadata?: Record<string, any>;
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  execute: (error: Error, context: any) => Promise<any>;
  condition?: (error: Error, context: any) => boolean;
  timeout?: number;
  maxRetries?: number;
}

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  interval: number;
  timeout: number;
  weight: number; // Importance weight for overall health
}

export interface ServiceDependency {
  name: string;
  circuitBreaker: CircuitBreaker;
  healthCheck: HealthCheck;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  fallbackAvailable: boolean;
}

export class CircuitBreaker extends EventEmitter {
  private readonly config: CircuitBreakerConfig;
  private readonly logger: Logger;
  private readonly metrics: MetricsCollector;
  private state: CircuitState = 'CLOSED';
  private readonly circuitMetrics: CircuitMetrics;
  private readonly fallbackStrategies: FallbackStrategy[] = [];
  private readonly healthChecks: HealthCheck[] = [];
  private stateChangeTime: Date = new Date();
  private halfOpenSuccesses: number = 0;
  private adaptiveConfig: {
    learningRate: number;
    confidenceInterval: number;
    minObservations: number;
    adjustmentHistory: Array<{
      timestamp: Date;
      oldThreshold: number;
      newThreshold: number;
      reason: string;
    }>;
  };

  constructor(config: CircuitBreakerConfig, logger: Logger, metrics: MetricsCollector) {
    super();
    this.config = { ...config };
    this.logger = logger;
    this.metrics = metrics;

    this.circuitMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      shortCircuited: 0,
      fallbackCalls: 0,
      averageResponseTime: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      rollingWindow: [],
    };

    this.adaptiveConfig = {
      learningRate: 0.1,
      confidenceInterval: 0.95,
      minObservations: 50,
      adjustmentHistory: [],
    };

    this.initializeMetrics();
    this.startHealthChecks();

    this.logger.info('Circuit breaker initialized', {
      name: config.name,
      errorThreshold: config.errorThresholdPercentage,
      timeout: config.timeoutMs,
      state: this.state,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, context?: any, fallbackData?: any): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.recordShortCircuit();
        return this.executeFallback(new Error('Circuit breaker is OPEN'), context, fallbackData);
      }
    }

    // Check if in half-open state and already reached max calls
    if (this.state === 'HALF_OPEN' && this.halfOpenSuccesses >= this.config.halfOpenMaxCalls) {
      this.recordShortCircuit();
      return this.executeFallback(
        new Error('Circuit breaker half-open limit exceeded'),
        context,
        fallbackData
      );
    }

    const startTime = Date.now();
    let success = false;
    let error: Error | undefined;

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, this.config.timeoutMs);

      success = true;
      this.recordSuccess(Date.now() - startTime);
      return result;
    } catch (err) {
      error = err as Error;
      success = false;

      const isTimeout = err instanceof Error && err.message.includes('timeout');
      this.recordFailure(Date.now() - startTime, err as Error, isTimeout ? 'TIMEOUT' : 'ERROR');

      // Try fallback
      return this.executeFallback(err as Error, context, fallbackData);
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Record successful request
   */
  private recordSuccess(responseTime: number): void {
    this.circuitMetrics.totalRequests++;
    this.circuitMetrics.successfulRequests++;
    this.circuitMetrics.consecutiveSuccesses++;
    this.circuitMetrics.consecutiveFailures = 0;
    this.circuitMetrics.lastSuccessTime = new Date();
    this.circuitMetrics.lastRequestTime = new Date();

    // Update average response time
    this.updateAverageResponseTime(responseTime);

    // Add to rolling window
    this.addToRollingWindow(true, responseTime);

    // Handle half-open state
    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }

    // Emit success event
    this.emitEvent('REQUEST_SUCCESS', {
      responseTime,
      consecutiveSuccesses: this.circuitMetrics.consecutiveSuccesses,
    });

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('circuit_breaker_requests_total', {
        circuit: this.config.name,
        result: 'success',
      });
      this.metrics.observeHistogram(
        'circuit_breaker_request_duration_seconds',
        responseTime / 1000,
        {
          circuit: this.config.name,
        }
      );
    }

    // Adaptive threshold adjustment
    if (this.config.adaptiveThresholds) {
      this.adjustThresholds();
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(responseTime: number, error: Error, failureType: FailureType): void {
    this.circuitMetrics.totalRequests++;
    this.circuitMetrics.failedRequests++;
    this.circuitMetrics.consecutiveFailures++;
    this.circuitMetrics.consecutiveSuccesses = 0;
    this.circuitMetrics.lastFailureTime = new Date();
    this.circuitMetrics.lastRequestTime = new Date();

    if (failureType === 'TIMEOUT') {
      this.circuitMetrics.timeouts++;
    }

    // Update average response time
    this.updateAverageResponseTime(responseTime);

    // Add to rolling window
    this.addToRollingWindow(false, responseTime, error);

    // Check if circuit should trip
    if (this.shouldTripCircuit()) {
      this.transitionToOpen();
    } else if (this.state === 'HALF_OPEN') {
      // Half-open state failure goes back to open
      this.transitionToOpen();
    }

    // Emit failure event
    this.emitEvent('REQUEST_FAILURE', {
      error: error.message,
      failureType,
      responseTime,
      consecutiveFailures: this.circuitMetrics.consecutiveFailures,
    });

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('circuit_breaker_requests_total', {
        circuit: this.config.name,
        result: 'failure',
        failure_type: failureType,
      });
    }

    // Adaptive threshold adjustment
    if (this.config.adaptiveThresholds) {
      this.adjustThresholds();
    }
  }

  /**
   * Record short circuit (request blocked by open circuit)
   */
  private recordShortCircuit(): void {
    this.circuitMetrics.shortCircuited++;

    this.emitEvent('REQUEST_FAILURE', {
      error: 'Circuit breaker is open',
      shortCircuited: true,
    });

    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('circuit_breaker_requests_total', {
        circuit: this.config.name,
        result: 'short_circuited',
      });
    }
  }

  /**
   * Check if circuit should trip to open state
   */
  private shouldTripCircuit(): boolean {
    if (this.config.forceOpen) return true;
    if (this.config.forceClosed) return false;

    const totalRequests = this.getTotalRequestsInWindow();

    // Need minimum volume of requests
    if (totalRequests < this.config.requestVolumeThreshold) {
      return false;
    }

    const errorPercentage = this.getErrorPercentageInWindow();
    return errorPercentage >= this.config.errorThresholdPercentage;
  }

  /**
   * Check if circuit should attempt reset from open to half-open
   */
  private shouldAttemptReset(): boolean {
    const timeSinceOpen = Date.now() - this.stateChangeTime.getTime();
    return timeSinceOpen >= this.config.sleepWindowMs;
  }

  /**
   * Transition circuit to closed state
   */
  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = 'CLOSED';
    this.stateChangeTime = new Date();
    this.halfOpenSuccesses = 0;

    this.logger.info('Circuit breaker closed', {
      circuit: this.config.name,
      previousState,
      consecutiveSuccesses: this.circuitMetrics.consecutiveSuccesses,
    });

    this.emitEvent('STATE_CHANGE', {
      from: previousState,
      to: 'CLOSED',
      reason: 'Success threshold reached',
    });

    if (this.config.enableMetrics) {
      this.metrics.setGauge('circuit_breaker_state', 0, {
        circuit: this.config.name,
      });
    }
  }

  /**
   * Transition circuit to half-open state
   */
  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = 'HALF_OPEN';
    this.stateChangeTime = new Date();
    this.halfOpenSuccesses = 0;

    this.logger.info('Circuit breaker half-open', {
      circuit: this.config.name,
      previousState,
    });

    this.emitEvent('STATE_CHANGE', {
      from: previousState,
      to: 'HALF_OPEN',
      reason: 'Sleep window expired',
    });

    if (this.config.enableMetrics) {
      this.metrics.setGauge('circuit_breaker_state', 1, {
        circuit: this.config.name,
      });
    }
  }

  /**
   * Transition circuit to open state
   */
  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = 'OPEN';
    this.stateChangeTime = new Date();
    this.halfOpenSuccesses = 0;

    this.logger.warn('Circuit breaker opened', {
      circuit: this.config.name,
      previousState,
      errorPercentage: this.getErrorPercentageInWindow(),
      consecutiveFailures: this.circuitMetrics.consecutiveFailures,
    });

    this.emitEvent('STATE_CHANGE', {
      from: previousState,
      to: 'OPEN',
      reason: 'Error threshold exceeded',
    });

    if (this.config.enableMetrics) {
      this.metrics.setGauge('circuit_breaker_state', 2, {
        circuit: this.config.name,
      });
    }
  }

  /**
   * Execute fallback strategies
   */
  private async executeFallback<T>(error: Error, context?: any, fallbackData?: any): Promise<T> {
    if (!this.config.fallbackEnabled || this.fallbackStrategies.length === 0) {
      throw error;
    }

    this.circuitMetrics.fallbackCalls++;

    // Sort strategies by priority
    const sortedStrategies = [...this.fallbackStrategies].sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      // Check if strategy condition is met
      if (strategy.condition && !strategy.condition(error, context)) {
        continue;
      }

      try {
        const result = strategy.timeout
          ? await this.executeWithTimeout(
              () => strategy.execute(error, { ...context, fallbackData }),
              strategy.timeout
            )
          : await strategy.execute(error, { ...context, fallbackData });

        this.emitEvent('FALLBACK_EXECUTED', {
          strategy: strategy.name,
          success: true,
        });

        if (this.config.enableMetrics) {
          this.metrics.incrementCounter('circuit_breaker_fallback_total', {
            circuit: this.config.name,
            strategy: strategy.name,
            result: 'success',
          });
        }

        return result;
      } catch (fallbackError) {
        this.logger.warn('Fallback strategy failed', {
          circuit: this.config.name,
          strategy: strategy.name,
          error: fallbackError.message,
        });

        if (this.config.enableMetrics) {
          this.metrics.incrementCounter('circuit_breaker_fallback_total', {
            circuit: this.config.name,
            strategy: strategy.name,
            result: 'failure',
          });
        }
      }
    }

    // All fallback strategies failed
    this.emitEvent('FALLBACK_EXECUTED', {
      success: false,
      allStrategiesFailed: true,
    });

    throw error;
  }

  /**
   * Add fallback strategy
   */
  addFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.push(strategy);
    this.fallbackStrategies.sort((a, b) => a.priority - b.priority);

    this.logger.info('Fallback strategy added', {
      circuit: this.config.name,
      strategy: strategy.name,
      priority: strategy.priority,
    });
  }

  /**
   * Add health check
   */
  addHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.push(healthCheck);

    this.logger.info('Health check added', {
      circuit: this.config.name,
      healthCheck: healthCheck.name,
      interval: healthCheck.interval,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitMetrics {
    return {
      ...this.circuitMetrics,
      rollingWindow: [...this.circuitMetrics.rollingWindow],
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    checks: Array<{
      name: string;
      healthy: boolean;
      responseTime?: number;
      error?: string;
    }>;
    overallScore: number;
  }> {
    const checkResults = [];
    let totalWeight = 0;
    let weightedScore = 0;

    for (const healthCheck of this.healthChecks) {
      const startTime = Date.now();
      let healthy = false;
      let error: string | undefined;

      try {
        healthy = await this.executeWithTimeout(healthCheck.check, healthCheck.timeout);
      } catch (err) {
        error = (err as Error).message;
      }

      const responseTime = Date.now() - startTime;

      checkResults.push({
        name: healthCheck.name,
        healthy,
        responseTime,
        error,
      });

      totalWeight += healthCheck.weight;
      weightedScore += healthy ? healthCheck.weight : 0;
    }

    const overallScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 100;
    const overallHealthy = overallScore >= 70; // 70% threshold

    return {
      healthy: overallHealthy,
      checks: checkResults,
      overallScore,
    };
  }

  /**
   * Force circuit state
   */
  forceState(state: CircuitState, reason?: string): void {
    const previousState = this.state;
    this.state = state;
    this.stateChangeTime = new Date();

    if (state === 'HALF_OPEN') {
      this.halfOpenSuccesses = 0;
    }

    this.logger.info('Circuit breaker state forced', {
      circuit: this.config.name,
      from: previousState,
      to: state,
      reason: reason || 'Manual override',
    });

    this.emitEvent('STATE_CHANGE', {
      from: previousState,
      to: state,
      reason: reason || 'Manual override',
      forced: true,
    });
  }

  /**
   * Reset circuit metrics
   */
  resetMetrics(): void {
    this.circuitMetrics.totalRequests = 0;
    this.circuitMetrics.successfulRequests = 0;
    this.circuitMetrics.failedRequests = 0;
    this.circuitMetrics.timeouts = 0;
    this.circuitMetrics.shortCircuited = 0;
    this.circuitMetrics.fallbackCalls = 0;
    this.circuitMetrics.averageResponseTime = 0;
    this.circuitMetrics.consecutiveFailures = 0;
    this.circuitMetrics.consecutiveSuccesses = 0;
    this.circuitMetrics.rollingWindow = [];

    this.logger.info('Circuit breaker metrics reset', {
      circuit: this.config.name,
    });
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CircuitBreakerConfig>): void {
    const oldConfig = { ...this.config };
    Object.assign(this.config, updates);

    this.logger.info('Circuit breaker configuration updated', {
      circuit: this.config.name,
      updates,
      oldConfig: {
        errorThreshold: oldConfig.errorThresholdPercentage,
        timeout: oldConfig.timeoutMs,
      },
      newConfig: {
        errorThreshold: this.config.errorThresholdPercentage,
        timeout: this.config.timeoutMs,
      },
    });
  }

  /**
   * Private helper methods
   */
  private initializeMetrics(): void {
    if (!this.config.enableMetrics) return;

    this.metrics.setGauge('circuit_breaker_state', 0, {
      circuit: this.config.name,
    });
  }

  private startHealthChecks(): void {
    for (const healthCheck of this.healthChecks) {
      setInterval(async () => {
        try {
          const healthy = await this.executeWithTimeout(healthCheck.check, healthCheck.timeout);

          if (this.config.enableMetrics) {
            this.metrics.setGauge('circuit_breaker_health_check', healthy ? 1 : 0, {
              circuit: this.config.name,
              check: healthCheck.name,
            });
          }
        } catch (error) {
          this.logger.warn('Health check failed', {
            circuit: this.config.name,
            check: healthCheck.name,
            error: error.message,
          });

          if (this.config.enableMetrics) {
            this.metrics.setGauge('circuit_breaker_health_check', 0, {
              circuit: this.config.name,
              check: healthCheck.name,
            });
          }
        }
      }, healthCheck.interval);
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.circuitMetrics.totalRequests;
    const currentAverage = this.circuitMetrics.averageResponseTime;

    this.circuitMetrics.averageResponseTime =
      (currentAverage * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private addToRollingWindow(success: boolean, responseTime: number, error?: Error): void {
    const now = new Date();

    this.circuitMetrics.rollingWindow.push({
      timestamp: now,
      success,
      responseTime,
      error,
    });

    // Remove old entries outside the rolling window
    const cutoff = new Date(now.getTime() - this.config.rollingWindowSizeMs);
    this.circuitMetrics.rollingWindow = this.circuitMetrics.rollingWindow.filter(
      entry => entry.timestamp > cutoff
    );
  }

  private getTotalRequestsInWindow(): number {
    return this.circuitMetrics.rollingWindow.length;
  }

  private getErrorPercentageInWindow(): number {
    const totalRequests = this.circuitMetrics.rollingWindow.length;
    if (totalRequests === 0) return 0;

    const failures = this.circuitMetrics.rollingWindow.filter(entry => !entry.success).length;
    return (failures / totalRequests) * 100;
  }

  private adjustThresholds(): void {
    if (this.circuitMetrics.totalRequests < this.adaptiveConfig.minObservations) {
      return;
    }

    const errorRate = this.getErrorPercentageInWindow();
    const currentThreshold = this.config.errorThresholdPercentage;

    // Simple adaptive algorithm - adjust threshold based on recent performance
    let newThreshold = currentThreshold;
    let reason = '';

    if (errorRate < currentThreshold * 0.5 && this.circuitMetrics.consecutiveSuccesses > 100) {
      // Lower threshold if performing well
      newThreshold = Math.max(currentThreshold - this.adaptiveConfig.learningRate * 10, 5);
      reason = 'Performance improved';
    } else if (errorRate > currentThreshold * 1.5) {
      // Raise threshold if struggling
      newThreshold = Math.min(currentThreshold + this.adaptiveConfig.learningRate * 10, 95);
      reason = 'Performance degraded';
    }

    if (Math.abs(newThreshold - currentThreshold) > 1) {
      this.adaptiveConfig.adjustmentHistory.push({
        timestamp: new Date(),
        oldThreshold: currentThreshold,
        newThreshold,
        reason,
      });

      this.config.errorThresholdPercentage = newThreshold;

      this.logger.info('Circuit breaker threshold adjusted', {
        circuit: this.config.name,
        oldThreshold: currentThreshold,
        newThreshold,
        reason,
        errorRate,
      });

      this.emitEvent('THRESHOLD_ADJUSTED', {
        oldThreshold: currentThreshold,
        newThreshold,
        reason,
        errorRate,
      });
    }
  }

  private emitEvent(event: CircuitEvent['event'], data: any): void {
    const circuitEvent: CircuitEvent = {
      timestamp: new Date(),
      circuitName: this.config.name,
      event,
      data,
    };

    this.emit('circuitEvent', circuitEvent);
  }
}

/**
 * Circuit Breaker Manager for coordinating multiple circuit breakers
 */
export class CircuitBreakerManager extends EventEmitter {
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly serviceDependencies: Map<string, ServiceDependency> = new Map();
  private readonly logger: Logger;
  private readonly metrics: MetricsCollector;

  constructor(logger: Logger, metrics: MetricsCollector) {
    super();
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Create and register a circuit breaker
   */
  createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
    if (this.circuitBreakers.has(config.name)) {
      throw new Error(`Circuit breaker ${config.name} already exists`);
    }

    const circuitBreaker = new CircuitBreaker(config, this.logger, this.metrics);

    // Forward events
    circuitBreaker.on('circuitEvent', (event: CircuitEvent) => {
      this.emit('circuitEvent', event);
    });

    this.circuitBreakers.set(config.name, circuitBreaker);

    this.logger.info('Circuit breaker created and registered', {
      name: config.name,
      totalCircuits: this.circuitBreakers.size,
    });

    return circuitBreaker;
  }

  /**
   * Get circuit breaker by name
   */
  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  /**
   * Register service dependency
   */
  registerServiceDependency(dependency: ServiceDependency): void {
    this.serviceDependencies.set(dependency.name, dependency);

    this.logger.info('Service dependency registered', {
      service: dependency.name,
      criticality: dependency.criticality,
      fallbackAvailable: dependency.fallbackAvailable,
    });
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{
    healthy: boolean;
    services: Array<{
      name: string;
      healthy: boolean;
      circuitState: CircuitState;
      criticality: string;
      healthScore: number;
    }>;
    overallScore: number;
    criticalServicesDown: number;
  }> {
    const serviceHealths = [];
    let totalWeight = 0;
    let weightedScore = 0;
    let criticalServicesDown = 0;

    for (const [serviceName, dependency] of this.serviceDependencies) {
      const healthStatus = await dependency.healthCheck.check();
      const circuitState = dependency.circuitBreaker.getState();
      const healthScore = healthStatus ? 100 : 0;

      const weight = this.getCriticalityWeight(dependency.criticality);
      totalWeight += weight;
      weightedScore += healthScore * weight;

      if (!healthStatus && dependency.criticality === 'CRITICAL') {
        criticalServicesDown++;
      }

      serviceHealths.push({
        name: serviceName,
        healthy: healthStatus,
        circuitState,
        criticality: dependency.criticality,
        healthScore,
      });
    }

    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 100;
    const overallHealthy = overallScore >= 80 && criticalServicesDown === 0;

    return {
      healthy: overallHealthy,
      services: serviceHealths,
      overallScore,
      criticalServicesDown,
    };
  }

  /**
   * Bulk operation with circuit breaker protection
   */
  async executeWithMultipleCircuits<T>(
    operations: Array<{
      circuitName: string;
      operation: () => Promise<T>;
      context?: any;
      fallbackData?: any;
    }>
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results = await Promise.allSettled(
      operations.map(async op => {
        const circuit = this.circuitBreakers.get(op.circuitName);
        if (!circuit) {
          throw new Error(`Circuit breaker ${op.circuitName} not found`);
        }
        return circuit.execute(op.operation, op.context, op.fallbackData);
      })
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, result: result.value };
      } else {
        return { success: false, error: result.reason };
      }
    });
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Map<string, CircuitMetrics> {
    const allMetrics = new Map<string, CircuitMetrics>();

    for (const [name, circuit] of this.circuitBreakers) {
      allMetrics.set(name, circuit.getMetrics());
    }

    return allMetrics;
  }

  /**
   * Emergency: Open all circuit breakers
   */
  emergencyOpenAll(reason: string): void {
    for (const [name, circuit] of this.circuitBreakers) {
      circuit.forceState('OPEN', `Emergency: ${reason}`);
    }

    this.logger.warn('Emergency: All circuit breakers opened', { reason });
  }

  /**
   * Recovery: Close all circuit breakers
   */
  recoveryCloseAll(reason: string): void {
    for (const [name, circuit] of this.circuitBreakers) {
      circuit.forceState('CLOSED', `Recovery: ${reason}`);
    }

    this.logger.info('Recovery: All circuit breakers closed', { reason });
  }

  private getCriticalityWeight(criticality: ServiceDependency['criticality']): number {
    switch (criticality) {
      case 'CRITICAL':
        return 4;
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
        return 1;
      default:
        return 1;
    }
  }
}

export default CircuitBreaker;
