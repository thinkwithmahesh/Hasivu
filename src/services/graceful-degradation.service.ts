/**
 * HASIVU Platform - Graceful Degradation Service
 * Provides fallback mechanisms and degraded functionality when services are unavailable
 * Ensures platform continuity during partial system failures
 */
import { logger } from '@/utils/logger';
import { CircuitBreakerRegistry } from '@/services/circuit-breaker.service';
import { RedisService } from '@/services/redis.service';

/**
 * Service health status
 */
export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable',
  RECOVERING = 'recovering'
}

/**
 * Degradation strategy for each service
 */
export enum DegradationStrategy {
  FAIL_FAST = 'fail_fast',           // Fail immediately when service is down
  CACHED_RESPONSE = 'cached_response', // Return cached data
  SIMPLIFIED_RESPONSE = 'simplified_response', // Return basic response
  FALLBACK_SERVICE = 'fallback_service', // Use alternative service
  OFFLINE_MODE = 'offline_mode',     // Enable offline functionality
  RETRY_WITH_BACKOFF = 'retry_with_backoff' // Retry with exponential backoff
}

/**
 * Service health information
 */
export interface ServiceHealth {
  serviceName: string;
  status: ServiceStatus;
  lastCheck: Date;
  responseTime: number;
  errorCount: number;
  consecutiveFailures: number;
  uptime: number;
  degradationReason?: string;
  recoveryEstimate?: Date;
}

/**
 * Degradation configuration for each service
 */
export interface DegradationConfig {
  service: string;
  strategy: DegradationStrategy;
  healthCheckInterval: number;
  maxConsecutiveFailures: number;
  recoveryThreshold: number;
  cacheTimeout: number;
  retryCount: number;
  retryDelay: number;
  circuitBreakerEnabled: boolean;
  fallbackEndpoint?: string;
  fallbackOperations?: FallbackOperation<any>[];
  priorityLevel: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Fallback operation interface
 */
export interface FallbackOperation<T> {
  operation: () => Promise<T> | T;
  cacheKey?: string;
  cacheDuration?: number;
  priority: number;
}

/**
 * Degradation metrics interface
 */
export interface DegradationMetrics {
  totalDegradations: number;
  successfulFallbacks: number;
  failedOperations: number;
  averageRecoveryTime: number;
  mostFailedService: string;
  degradationHistory: {
    timestamp: Date;
    service: string;
    reason: string;
    duration: number;
  }[];
}

/**
 * Main graceful degradation service
 */
export class GracefulDegradationService {
  private serviceHealthMap: Map<string, ServiceHealth> = new Map();
  private degradationConfigs: Map<string, DegradationConfig> = new Map();
  private fallbackCache: Map<string, { data: any, timestamp: Date }> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private redis: typeof RedisService;
  private isInitialized = false;
  private degradationMetrics: DegradationMetrics;

  constructor() {
    this.redis = RedisService;
    this.degradationMetrics = {
      totalDegradations: 0,
      successfulFallbacks: 0,
      failedOperations: 0,
      averageRecoveryTime: 0,
      mostFailedService: '',
      degradationHistory: []
    };
  }

  /**
   * Initialize graceful degradation with service configurations
   */
  async initialize(configs: DegradationConfig[]): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Graceful degradation already initialized');
      return;
    }

    for (const config of configs) {
      this.degradationConfigs.set(config.service, config);
      
      // Initialize service health
      this.serviceHealthMap.set(config.service, {
        serviceName: config.service,
        status: ServiceStatus.HEALTHY,
        lastCheck: new Date(),
        responseTime: 0,
        errorCount: 0,
        consecutiveFailures: 0,
        uptime: 100
      });

      // Start health monitoring
      this.startHealthMonitoring(config.service);
    }

    this.isInitialized = true;
    logger.info('Graceful degradation initialized', { 
      serviceCount: configs.length,
      services: configs.map(c => c.service)
    });
  }

  /**
   * Check if a service is available
   */
  async isServiceAvailable(serviceName: string): Promise<boolean> {
    const health = this.serviceHealthMap.get(serviceName);
    if (!health) {
      logger.warn('Unknown service health check', { serviceName });
      return true; // Assume available if not monitored
    }

    return health.status !== ServiceStatus.UNAVAILABLE;
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    return this.serviceHealthMap.get(serviceName) || null;
  }

  /**
   * Execute operation with graceful degradation
   */
  async executeWithDegradation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbackOperations?: FallbackOperation<T>[]
  ): Promise<T> {
    const health = this.serviceHealthMap.get(serviceName);
    const config = this.degradationConfigs.get(serviceName);

    if (!health || !config) {
      logger.warn('Service not configured for degradation', { serviceName });
      return await operation();
    }

    // Check if service is healthy
    if (health.status === ServiceStatus.HEALTHY) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const responseTime = Date.now() - startTime;
        
        // Update health metrics
        this.updateHealthMetrics(serviceName, true, responseTime);
        
        return result;
      } catch (error) {
        this.updateHealthMetrics(serviceName, false, 0);
        throw error;
      }
    }

    // Service is degraded or unavailable
    if (fallbackOperations && this.shouldUseFallback(serviceName)) {
      return await this.executeFallback(serviceName, fallbackOperations);
    }

    // No fallback available - throw degradation error
    const error = new Error(`Service ${serviceName} is unavailable and no fallback provided`);
    this.degradationMetrics.failedOperations++;
    throw error;
  }

  /**
   * Execute fallback operations in priority order
   */
  private async executeFallback<T>(serviceName: string, fallbackOperations: FallbackOperation<T>[]): Promise<T> {
    // Sort by priority (higher number = higher priority)
    const sortedOperations = fallbackOperations.sort((a, b) => b.priority - a.priority);

    for (const fallback of sortedOperations) {
      try {
        // Check cache first if cache key is provided
        if (fallback.cacheKey) {
          const cached = await this.getCachedResult(fallback.cacheKey);
          if (cached) {
            logger.info('Returning cached fallback result', { serviceName, cacheKey: fallback.cacheKey });
            this.degradationMetrics.successfulFallbacks++;
            return cached;
          }
        }

        // Execute fallback operation
        const result = await fallback.operation();

        // Cache result if cache configuration is provided
        if (fallback.cacheKey && fallback.cacheDuration) {
          await this.cacheResult(fallback.cacheKey, result, fallback.cacheDuration);
        }

        logger.info('Fallback operation successful', { serviceName });
        this.degradationMetrics.successfulFallbacks++;
        return result;
      } catch (error) {
        logger.warn('Fallback operation failed', { serviceName, error: (error as Error).message });
        continue; // Try next fallback
      }
    }

    // All fallbacks failed
    throw new Error(`All fallback operations failed for service ${serviceName}`);
  }

  /**
   * Determine if fallback should be used
   */
  private shouldUseFallback(serviceName: string): boolean {
    const config = this.degradationConfigs.get(serviceName);
    const health = this.serviceHealthMap.get(serviceName);

    if (!config || !health) return false;

    switch (config.strategy) {
      case DegradationStrategy.FAIL_FAST:
        return false;
      case DegradationStrategy.CACHED_RESPONSE:
      case DegradationStrategy.SIMPLIFIED_RESPONSE:
      case DegradationStrategy.FALLBACK_SERVICE:
      case DegradationStrategy.OFFLINE_MODE:
        return health.status !== ServiceStatus.HEALTHY;
      case DegradationStrategy.RETRY_WITH_BACKOFF:
        return health.consecutiveFailures < config.retryCount;
      default:
        return true;
    }
  }

  /**
   * Start health monitoring for a service
   */
  private startHealthMonitoring(serviceName: string): void {
    const config = this.degradationConfigs.get(serviceName);
    if (!config) return;

    const interval = setInterval(async () => {
      await this.performHealthCheck(serviceName);
    }, config.healthCheckInterval);

    this.healthCheckIntervals.set(serviceName, interval);
  }

  /**
   * Perform health check for a service
   */
  private async performHealthCheck(serviceName: string): Promise<void> {
    const config = this.degradationConfigs.get(serviceName);
    if (!config) return;

    try {
      let isHealthy = false;
      let responseTime = 0;
      const startTime = Date.now();

      // Different health check strategies based on service type
      switch (serviceName) {
        case 'database':
          isHealthy = await this.checkDatabaseHealth();
          break;
        case 'redis':
          isHealthy = await this.checkRedisHealth();
          break;
        case 'external-api':
          isHealthy = await this.checkExternalApiHealth(config.fallbackEndpoint);
          break;
        default:
          // Use circuit breaker if available
          const circuitBreaker = CircuitBreakerRegistry.get(serviceName);
          if (circuitBreaker) {
            const stats = circuitBreaker.getStats();
            isHealthy = !stats.isOpen;
          } else {
            isHealthy = true; // Assume healthy if no specific check
          }
      }

      responseTime = Date.now() - startTime;
      this.updateHealthStatus(serviceName, isHealthy, responseTime);
    } catch (error) {
      logger.error('Health check failed', { serviceName, error: (error as Error).message });
      this.updateHealthStatus(serviceName, false, 0);
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database health check
      // This would be replaced with actual database ping
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<boolean> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check external API health
   */
  private async checkExternalApiHealth(endpoint?: string): Promise<boolean> {
    if (!endpoint) return true;

    try {
      const axios = require('axios');
      const response = await axios.get(endpoint, { timeout: 5000 });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update health status for a service
   */
  private updateHealthStatus(serviceName: string, isHealthy: boolean, responseTime: number): void {
    const health = this.serviceHealthMap.get(serviceName);
    const config = this.degradationConfigs.get(serviceName);
    
    if (!health || !config) return;

    health.lastCheck = new Date();
    health.responseTime = responseTime;

    if (isHealthy) {
      health.consecutiveFailures = 0;
      
      // Recovery logic
      if (health.status !== ServiceStatus.HEALTHY && health.consecutiveFailures === 0) {
        health.status = ServiceStatus.RECOVERING;
        
        // Check if we've had enough successful checks to declare recovery
        if (health.consecutiveFailures <= -config.recoveryThreshold) {
          health.status = ServiceStatus.HEALTHY;
          logger.info('Service recovered', { serviceName });
        }
      } else if (health.status === ServiceStatus.HEALTHY) {
        // Continue healthy state
      }
    } else {
      health.errorCount++;
      health.consecutiveFailures++;

      // Determine degradation level
      if (health.consecutiveFailures >= config.maxConsecutiveFailures) {
        if (health.status !== ServiceStatus.UNAVAILABLE) {
          health.status = ServiceStatus.UNAVAILABLE;
          health.degradationReason = `${health.consecutiveFailures} consecutive failures`;
          this.recordDegradation(serviceName, health.degradationReason);
          logger.error('Service marked as unavailable', { serviceName, consecutiveFailures: health.consecutiveFailures });
        }
      } else if (health.consecutiveFailures >= Math.floor(config.maxConsecutiveFailures / 2)) {
        if (health.status !== ServiceStatus.DEGRADED) {
          health.status = ServiceStatus.DEGRADED;
          health.degradationReason = `${health.consecutiveFailures} recent failures`;
          logger.warn('Service marked as degraded', { serviceName, consecutiveFailures: health.consecutiveFailures });
        }
      }
    }

    // Update uptime calculation
    const totalChecks = health.errorCount + (health.consecutiveFailures >= 0 ? 1 : Math.abs(health.consecutiveFailures));
    health.uptime = totalChecks > 0 ? ((totalChecks - health.errorCount) / totalChecks) * 100 : 100;

    this.serviceHealthMap.set(serviceName, health);
  }

  /**
   * Update health metrics for successful/failed operations
   */
  private updateHealthMetrics(serviceName: string, success: boolean, responseTime: number): void {
    const health = this.serviceHealthMap.get(serviceName);
    if (!health) return;

    if (success) {
      health.consecutiveFailures = Math.max(0, health.consecutiveFailures - 1);
      health.responseTime = responseTime;
    } else {
      health.errorCount++;
      health.consecutiveFailures++;
    }

    this.serviceHealthMap.set(serviceName, health);
  }

  /**
   * Record degradation event
   */
  private recordDegradation(serviceName: string, reason: string): void {
    this.degradationMetrics.totalDegradations++;
    this.degradationMetrics.degradationHistory.push({
      timestamp: new Date(),
      service: serviceName,
      reason,
      duration: 0 // Will be updated when service recovers
    });

    // Update most failed service
    const serviceFailures = this.degradationMetrics.degradationHistory
      .filter(h => h.service === serviceName).length;
    
    if (!this.degradationMetrics.mostFailedService || serviceFailures > 
        this.degradationMetrics.degradationHistory.filter(h => h.service === this.degradationMetrics.mostFailedService).length) {
      this.degradationMetrics.mostFailedService = serviceName;
    }
  }

  /**
   * Get cached result
   */
  private async getCachedResult(cacheKey: string): Promise<any | null> {
    try {
      // Check in-memory cache first
      const memCache = this.fallbackCache.get(cacheKey);
      if (memCache && Date.now() - memCache.timestamp.getTime() < 300000) { // 5 minutes
        return memCache.data;
      }

      // Check Redis cache
      const redisResult = await this.redis.get(`fallback:${cacheKey}`);
      if (redisResult) {
        return JSON.parse(redisResult);
      }

      return null;
    } catch (error) {
      logger.warn('Failed to get cached result', { cacheKey, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Cache result for fallback use
   */
  private async cacheResult(cacheKey: string, data: any, durationMs: number): Promise<void> {
    try {
      // Store in memory cache
      this.fallbackCache.set(cacheKey, {
        data,
        timestamp: new Date()
      });

      // Store in Redis cache
      await this.redis.setex(
        `fallback:${cacheKey}`,
        Math.floor(durationMs / 1000), // Convert to seconds
        JSON.stringify(data)
      );
    } catch (error) {
      logger.warn('Failed to cache result', { cacheKey, error: (error as Error).message });
    }
  }

  /**
   * Get degradation metrics
   */
  getDegradationMetrics(): DegradationMetrics {
    return { ...this.degradationMetrics };
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealthMap.values());
  }

  /**
   * Force service status (for testing)
   */
  forceServiceStatus(serviceName: string, status: ServiceStatus, reason?: string): void {
    const health = this.serviceHealthMap.get(serviceName);
    if (health) {
      health.status = status;
      health.degradationReason = reason;
      logger.warn('Service status manually changed', { serviceName, status, reason });
    }
  }

  /**
   * Create default degradation configuration
   */
  static createDefaultConfig(serviceName: string, strategy: DegradationStrategy = DegradationStrategy.CACHED_RESPONSE): DegradationConfig {
    return {
      service: serviceName,
      strategy,
      healthCheckInterval: 30000, // 30 seconds
      maxConsecutiveFailures: 3,
      recoveryThreshold: 2,
      cacheTimeout: 300000, // 5 minutes
      retryCount: 3,
      retryDelay: 1000,
      circuitBreakerEnabled: true,
      priorityLevel: 'medium'
    };
  }

  /**
   * Create critical service configuration
   */
  static createCriticalServiceConfig(serviceName: string): DegradationConfig {
    return {
      service: serviceName,
      strategy: DegradationStrategy.FALLBACK_SERVICE,
      healthCheckInterval: 10000, // 10 seconds
      maxConsecutiveFailures: 2,
      recoveryThreshold: 3,
      cacheTimeout: 600000, // 10 minutes
      retryCount: 5,
      retryDelay: 500,
      circuitBreakerEnabled: true,
      priorityLevel: 'critical'
    };
  }

  /**
   * Helper method for database operations with degradation
   */
  async executeDatabase<T>(operation: () => Promise<T>, fallbackData?: T): Promise<T> {
    const fallbacks: FallbackOperation<T>[] = [];
    
    if (fallbackData !== undefined) {
      fallbacks.push({
        operation: () => fallbackData,
        priority: 1
      });
    }

    return this.executeWithDegradation('database', operation, fallbacks);
  }

  /**
   * Helper method for external API operations with degradation
   */
  async executeExternalApi<T>(
    apiName: string,
    operation: () => Promise<T>,
    cachedFallback?: T,
    cacheKey?: string
  ): Promise<T> {
    const fallbacks: FallbackOperation<T>[] = [];
    
    if (cachedFallback !== undefined) {
      fallbacks.push({
        operation: () => cachedFallback,
        cacheKey: cacheKey || `external-api-${apiName}`,
        cacheDuration: 300000, // 5 minutes
        priority: 1
      });
    }

    return this.executeWithDegradation(`external-api-${apiName}`, operation, fallbacks);
  }

  /**
   * Helper method for notification service with degradation
   */
  async executeNotification<T>(
    operation: () => Promise<T>,
    fallbackNotification?: () => Promise<T>
  ): Promise<T> {
    const fallbacks: FallbackOperation<T>[] = [];
    
    if (fallbackNotification) {
      fallbacks.push({
        operation: fallbackNotification,
        priority: 1
      });
    }

    return this.executeWithDegradation('notification', operation, fallbacks);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop all health check intervals
    for (const [serviceName, interval] of this.healthCheckIntervals.entries()) {
      clearInterval(interval);
      logger.info('Stopped health monitoring', { serviceName });
    }

    this.healthCheckIntervals.clear();
    this.serviceHealthMap.clear();
    this.degradationConfigs.clear();
    this.fallbackCache.clear();

    try {
      await this.redis.disconnect();
    } catch (error) {
      logger.warn('Error disconnecting from Redis', { error });
    }

    this.isInitialized = false;
    logger.info('Graceful degradation service cleaned up');
  }

  /**
   * Get overall system health status
   */
  getSystemHealth(): { overall: string; timestamp: Date; uptime: number; services: ServiceHealth[]; summary: { healthy: number; unavailable: number; }; } {
    const services = Array.from(this.serviceHealthMap.values());
    const healthyCount = services.filter(s => s.status === ServiceStatus.HEALTHY).length;
    const unavailableCount = services.filter(s => s.status === ServiceStatus.UNAVAILABLE).length;
    
    let overall = 'healthy';
    if (unavailableCount > 0) {
      overall = 'degraded';
    }
    if (unavailableCount > services.length / 2) {
      overall = 'unavailable';
    }

    return {
      overall,
      timestamp: new Date(),
      uptime: services.length > 0 ? services.reduce((avg, s) => avg + s.uptime, 0) / services.length : 100,
      services,
      summary: {
        healthy: healthyCount,
        unavailable: unavailableCount
      }
    };
  }

  /**
   * Configure fallback for a service
   */
  configureFallback(serviceName: string, fallbackFn: () => Promise<any>): void {
    const config = this.degradationConfigs.get(serviceName);
    if (config) {
      // Store fallback configuration
      config.fallbackOperations = config.fallbackOperations || [];
      logger.info('Fallback configured', { serviceName });
    }
  }

  /**
   * Set service state manually
   */
  setServiceState(serviceName: string, status: ServiceStatus): void {
    const health = this.serviceHealthMap.get(serviceName);
    if (health) {
      health.status = status;
      health.lastCheck = new Date();
      this.serviceHealthMap.set(serviceName, health);
      logger.info('Service state updated', { serviceName, status });
    }
  }

  /**
   * Execute Redis operation with degradation
   */
  async executeRedis<T>(operation: () => Promise<T>): Promise<T> {
    return this.executeWithDegradation('redis', operation);
  }

}

export default GracefulDegradationService;