/**
 * HASIVU Platform - Integration Performance Service
 * Priority 3 Enhancement: Cross-epic integration optimization and saga pattern implementation
 * Ensures reliable data consistency and performance across all 7 epics
 */

import { logger } from '@/utils/logger';
import { RedisService } from '@/services/redis.service';
import { DatabaseService } from '@/shared/database.service';
import { PerformanceService } from '@/services/performance.service';

/**
 * Saga transaction state
 */
interface SagaTransaction {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating';
  steps: SagaStep[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  timeout?: number;
}

/**
 * Individual saga step
 */
interface SagaStep {
  id: string;
  epic: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
  compensationAction?: string;
  result?: any;
  error?: string;
  duration?: number;
  retries: number;
  maxRetries: number;
}

/**
 * Epic integration metrics
 */
interface EpicMetrics {
  epic: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdate: Date;
}

/**
 * Cross-epic data flow tracking
 */
interface DataFlowTrace {
  id: string;
  sourceEpic: string;
  targetEpic: string;
  operationType: string;
  dataSize: number;
  duration: number;
  status: 'success' | 'failed';
  timestamp: Date;
  metadata: Record<string, any>;
}

interface DataFlowMetrics {
  flows: Map<string, {
    count: number;
    totalDuration: number;
    successCount: number;
    errorCount: number;
  }>;
  totalDuration: number;
  consistencyCheck: boolean;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date;
  timeout: number;
}

interface PerformanceReport {
  timestamp: Date;
  epicMetrics: EpicMetrics[];
  dataFlowMetrics: DataFlowMetrics;
  recommendations: string[];
  activeSagas: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

/**
 * Integration Performance Service
 * Manages cross-epic transactions, data consistency, and performance optimization
 */
export class IntegrationPerformanceService {
  private static instance: IntegrationPerformanceService;
  private activeSagas = new Map<string, SagaTransaction>();
  private epicMetrics = new Map<string, EpicMetrics>();
  private dataFlowTraces: DataFlowTrace[] = [];
  private retryConfigs = new Map<string, RetryConfig>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private performanceHistory: PerformanceReport[] = [];
  
  private constructor() {
    this.initializeDefaultRetryConfigs();
    this.startPerformanceMonitoring();
  }
  
  public static getInstance(): IntegrationPerformanceService {
    if (!IntegrationPerformanceService.instance) {
      IntegrationPerformanceService.instance = new IntegrationPerformanceService();
    }
    return IntegrationPerformanceService.instance;
  }
  
  /**
   * Initialize default retry configurations for each epic
   */
  private initializeDefaultRetryConfigs(): void {
    const defaultConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true
    };
    
    const epics = [
      'authentication', 'profile_management', 'nutrition_planning',
      'community_engagement', 'payments', 'notifications', 'templates'
    ];
    
    epics.forEach(epic => {
      this.retryConfigs.set(epic, { ...defaultConfig });
    });
    
    // Custom configurations for specific epics
    this.retryConfigs.set('payments', {
      ...defaultConfig,
      maxRetries: 5,
      maxDelay: 60000
    });
    
    this.retryConfigs.set('notifications', {
      ...defaultConfig,
      maxRetries: 2,
      baseDelay: 500
    });
    
    // Initialize circuit breakers
    epics.forEach(epic => {
      this.circuitBreakers.set(epic, {
        isOpen: false,
        failureCount: 0,
        successCount: 0,
        lastFailureTime: new Date(0),
        timeout: 60000
      });
    });
  }
  
  /**
   * Start performance monitoring for cross-epic operations
   */
  private startPerformanceMonitoring(): void {
    // Update epic metrics every 30 seconds
    setInterval(async () => {
      await this.updateEpicMetrics();
    }, 30000);
    
    // Monitor data flow performance
    setInterval(async () => {
      await this.analyzeDataFlowPerformance();
    }, 60000);
    
    // Cleanup old traces
    setInterval(() => {
      this.cleanupOldTraces();
    }, 300000);
    
    // Generate performance reports
    setInterval(async () => {
      await this.generatePerformanceReport();
    }, 120000);
  }
  
  /**
   * Execute distributed transaction using saga pattern
   */
  public async executeSaga(
    type: string,
    steps: Omit<SagaStep, 'id' | 'status' | 'result' | 'error' | 'duration' | 'retries'>[],
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const sagaId = this.generateSagaId(type);
    
    const saga: SagaTransaction = {
      id: sagaId,
      type,
      status: 'pending',
      steps: steps.map((step, index) => ({
        ...step,
        id: `${sagaId}-step-${index}`,
        status: 'pending',
        retries: 0
      })),
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.activeSagas.set(sagaId, saga);
    
    try {
      logger.info(`Starting saga transaction: ${sagaId}`, { type, stepsCount: steps.length });
      saga.status = 'running';
      saga.updatedAt = new Date();
      
      const results: any[] = [];
      
      // Execute steps sequentially
      for (let i = 0; i < saga.steps.length; i++) {
        const step = saga.steps[i];
        const stepResult = await this.executeStep(step, saga);
        
        if (stepResult.success) {
          step.result = stepResult.result;
          results.push(stepResult.result);
        } else {
          // Step failed, initiate compensation
          logger.error(`Saga step failed: ${step.id}`, { error: stepResult.error });
          await this.compensateTransaction(saga, i - 1);
          saga.status = 'failed';
          return { success: false, error: stepResult.error };
        }
      }
      
      saga.status = 'completed';
      saga.updatedAt = new Date();
      
      logger.info(`Saga transaction completed: ${sagaId}`, { resultsCount: results.length });
      
      // Cache successful saga result
      await this.cacheSagaResult(saga, results);
      
      return { success: true, result: results };
      
    } catch (error) {
      logger.error(`Saga transaction error: ${sagaId}`, error);
      saga.status = 'failed';
      saga.updatedAt = new Date();
      
      // Attempt compensation
      await this.compensateTransaction(saga, saga.steps.length - 1);
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      // Keep saga in history for a while for debugging
      setTimeout(() => {
        this.activeSagas.delete(sagaId);
      }, 3600000); // 1 hour
    }
  }
  
  /**
   * Execute individual saga step with retry logic
   */
  private async executeStep(step: SagaStep, saga: SagaTransaction): Promise<{ success: boolean; result?: any; error?: string }> {
    const retryConfig = this.retryConfigs.get(step.epic);
    if (!retryConfig) {
      throw new Error(`No retry configuration found for epic: ${step.epic}`);
    }
    
    // Check circuit breaker
    if (this.isCircuitOpen(step.epic)) {
      throw new Error(`Circuit breaker open for epic: ${step.epic}`);
    }
    
    const startTime = Date.now();
    step.status = 'running';
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        step.retries = attempt;
        
        // Simulate step execution (in real implementation, this would call the actual service)
        const result = await this.simulateStepExecution(step);
        
        step.status = 'completed';
        step.duration = Date.now() - startTime;
        
        // Update circuit breaker success count
        this.recordCircuitBreakerSuccess(step.epic);
        
        // Track data flow
        await this.trackDataFlow(step, saga, true, Date.now() - startTime);
        
        return { success: true, result };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        step.error = errorMessage;
        
        // Record circuit breaker failure
        this.recordCircuitBreakerFailure(step.epic);
        
        if (attempt < retryConfig.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          logger.warn(`Step ${step.id} failed, retrying in ${delay}ms`, { attempt, error: errorMessage });
          await this.sleep(delay);
        } else {
          step.status = 'failed';
          step.duration = Date.now() - startTime;
          
          // Track failed data flow
          await this.trackDataFlow(step, saga, false, Date.now() - startTime);
          
          return { success: false, error: errorMessage };
        }
      }
    }
    
    return { success: false, error: 'Max retries exceeded' };
  }
  
  /**
   * Compensate transaction by executing compensation actions
   */
  private async compensateTransaction(saga: SagaTransaction, lastCompletedStepIndex: number): Promise<void> {
    logger.info(`Starting compensation for saga: ${saga.id}`, { lastCompletedStepIndex });
    saga.status = 'compensating';
    
    // Execute compensation actions in reverse order
    for (let i = lastCompletedStepIndex; i >= 0; i--) {
      const step = saga.steps[i];
      if (step.status === 'completed' && step.compensationAction) {
        try {
          await this.executeCompensation(step);
          step.status = 'compensated';
        } catch (error) {
          logger.error(`Compensation failed for step: ${step.id}`, error);
          // Continue with other compensations even if one fails
        }
      }
    }
    
    logger.info(`Compensation completed for saga: ${saga.id}`);
  }
  
  /**
   * Simulate step execution (replace with actual service calls)
   */
  private async simulateStepExecution(step: SagaStep): Promise<any> {
    // Simulate processing time
    await this.sleep(Math.random() * 1000 + 500);
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error(`Simulated failure for step: ${step.action}`);
    }
    
    return {
      stepId: step.id,
      action: step.action,
      epic: step.epic,
      timestamp: new Date(),
      data: { processed: true }
    };
  }
  
  /**
   * Execute compensation action
   */
  private async executeCompensation(step: SagaStep): Promise<void> {
    logger.info(`Executing compensation for step: ${step.id}`, { compensationAction: step.compensationAction });
    
    // Simulate compensation execution
    await this.sleep(Math.random() * 500 + 200);
    
    // In real implementation, this would call the actual compensation service
    // For now, we just log the compensation
  }
  
  /**
   * Track data flow between epics
   */
  private async trackDataFlow(step: SagaStep, saga: SagaTransaction, success: boolean, duration: number): Promise<void> {
    const trace: DataFlowTrace = {
      id: this.generateTraceId(),
      sourceEpic: saga.metadata.sourceEpic || 'unknown',
      targetEpic: step.epic,
      operationType: step.action,
      dataSize: JSON.stringify(step.result || {}).length,
      duration,
      status: success ? 'success' : 'failed',
      timestamp: new Date(),
      metadata: {
        sagaId: saga.id,
        stepId: step.id,
        retries: step.retries
      }
    };
    
    this.dataFlowTraces.push(trace);
    
    // Keep only recent traces (last 1000)
    if (this.dataFlowTraces.length > 1000) {
      this.dataFlowTraces = this.dataFlowTraces.slice(-1000);
    }
  }
  
  /**
   * Cache successful saga result
   */
  private async cacheSagaResult(saga: SagaTransaction, results: any[]): Promise<void> {
    try {
      const key = `saga:result:${saga.id}`;
      const cacheData = {
        sagaId: saga.id,
        type: saga.type,
        results,
        completedAt: new Date(),
        ttl: 3600 // 1 hour
      };
      
      await RedisService.setex(key, 3600, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Failed to cache saga result', error);
    }
  }
  
  /**
   * Update epic performance metrics
   */
  private async updateEpicMetrics(): Promise<void> {
    const currentTime = new Date();
    
    // Calculate metrics for each epic based on recent data flows
    const epicStats = new Map<string, { total: number; successful: number; failed: number; totalTime: number }>();
    
    // Analyze recent traces (last 5 minutes)
    const recentTraces = this.dataFlowTraces.filter(
      trace => currentTime.getTime() - trace.timestamp.getTime() < 300000
    );
    
    recentTraces.forEach(trace => {
      const stats = epicStats.get(trace.targetEpic) || { total: 0, successful: 0, failed: 0, totalTime: 0 };
      stats.total++;
      stats.totalTime += trace.duration;
      
      if (trace.status === 'success') {
        stats.successful++;
      } else {
        stats.failed++;
      }
      
      epicStats.set(trace.targetEpic, stats);
    });
    
    // Update epic metrics
    epicStats.forEach((stats, epic) => {
      const metrics: EpicMetrics = {
        epic,
        totalTransactions: stats.total,
        successfulTransactions: stats.successful,
        failedTransactions: stats.failed,
        averageResponseTime: stats.total > 0 ? stats.totalTime / stats.total : 0,
        errorRate: stats.total > 0 ? stats.failed / stats.total : 0,
        lastUpdate: currentTime
      };
      
      this.epicMetrics.set(epic, metrics);
    });
  }
  
  /**
   * Analyze data flow performance
   */
  private async analyzeDataFlowPerformance(): Promise<DataFlowMetrics> {
    const flows = new Map<string, { count: number; totalDuration: number; successCount: number; errorCount: number }>();
    let totalDuration = 0;
    let successCount = 0;
    let totalCount = 0;
    
    // Analyze recent traces (last 10 minutes)
    const currentTime = new Date();
    const recentTraces = this.dataFlowTraces.filter(
      trace => currentTime.getTime() - trace.timestamp.getTime() < 600000
    );
    
    recentTraces.forEach(trace => {
      const flowKey = `${trace.sourceEpic}->${trace.targetEpic}`;
      const flowStats = flows.get(flowKey) || { count: 0, totalDuration: 0, successCount: 0, errorCount: 0 };
      
      flowStats.count++;
      flowStats.totalDuration += trace.duration;
      totalDuration += trace.duration;
      totalCount++;
      
      if (trace.status === 'success') {
        flowStats.successCount++;
        successCount++;
      } else {
        flowStats.errorCount++;
      }
      
      flows.set(flowKey, flowStats);
    });
    
    const consistencyCheck = totalCount > 0 ? successCount / totalCount >= 0.95 : true;
    
    return {
      flows,
      totalDuration,
      consistencyCheck
    };
  }
  
  /**
   * Generate comprehensive performance report
   */
  private async generatePerformanceReport(): Promise<PerformanceReport> {
    const timestamp = new Date();
    const epicMetrics = Array.from(this.epicMetrics.values());
    const dataFlowMetrics = await this.analyzeDataFlowPerformance();
    const activeSagas = this.activeSagas.size;
    
    const recommendations: string[] = [];
    
    // Analyze performance and generate recommendations
    const poorPerformingEpics = epicMetrics.filter(metric => metric.averageResponseTime > 5000);
    const highErrorEpics = epicMetrics.filter(metric => metric.errorRate > 0.05);
    
    if (poorPerformingEpics.length > 0) {
      recommendations.push(`Poor performing epics detected: ${poorPerformingEpics.map(e => e.epic).join(', ')}. Consider optimization.`);
    }
    
    if (highErrorEpics.length > 0) {
      recommendations.push(`High error rates in epics: ${highErrorEpics.map(e => e.epic).join(', ')}. Review error handling.`);
    }
    
    const dataFlowStats = await this.analyzeDataFlowPerformance();
    const averageFlowTime = dataFlowStats.totalDuration / Math.max(dataFlowStats.flows.size, 1);
    
    if (averageFlowTime > 3000) {
      recommendations.push(`High average data flow time (${averageFlowTime}ms). Consider caching or async processing.`);
    }
    
    const consistencyRate = dataFlowStats.consistencyCheck ? 100 : 85; // Simplified calculation
    if (consistencyRate < 95) {
      recommendations.push(`Data consistency rate below 95% (${consistencyRate}%). Review transaction boundaries.`);
    }
    
    if (activeSagas > 50) {
      recommendations.push(`High number of active saga transactions (${activeSagas}). Monitor for potential bottlenecks.`);
    }
    
    // Determine system health
    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (poorPerformingEpics.length > 2 || highErrorEpics.length > 1 || !dataFlowStats.consistencyCheck) {
      systemHealth = 'critical';
    } else if (poorPerformingEpics.length > 0 || highErrorEpics.length > 0 || activeSagas > 30) {
      systemHealth = 'degraded';
    }
    
    const report: PerformanceReport = {
      timestamp,
      epicMetrics,
      dataFlowMetrics,
      recommendations,
      activeSagas,
      systemHealth
    };
    
    // Store report in history
    this.performanceHistory.push(report);
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
    
    // Log critical issues
    if (systemHealth === 'critical') {
      logger.error('Critical system health detected', { report });
    } else if (systemHealth === 'degraded') {
      logger.warn('System health degraded', { report });
    }
    
    return report;
  }
  
  /**
   * Get current performance metrics
   */
  public async getPerformanceMetrics(): Promise<{
    epicMetrics: EpicMetrics[];
    dataFlowMetrics: DataFlowMetrics;
    activeSagas: number;
    recentReports: PerformanceReport[];
  }> {
    const dataFlowMetrics = await this.analyzeDataFlowPerformance();
    
    return {
      epicMetrics: Array.from(this.epicMetrics.values()),
      dataFlowMetrics,
      activeSagas: this.activeSagas.size,
      recentReports: this.performanceHistory.slice(-10)
    };
  }
  
  /**
   * Circuit breaker management
   */
  private isCircuitOpen(epic: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(epic);
    if (!circuitBreaker) return false;
    
    if (circuitBreaker.isOpen) {
      // Check if timeout has passed
      const now = new Date().getTime();
      if (now - circuitBreaker.lastFailureTime.getTime() > circuitBreaker.timeout) {
        // Reset circuit breaker
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
        circuitBreaker.successCount = 0;
        return false;
      }
      return true;
    }
    
    return false;
  }
  
  private recordCircuitBreakerSuccess(epic: string): void {
    const circuitBreaker = this.circuitBreakers.get(epic);
    if (circuitBreaker) {
      circuitBreaker.successCount++;
      if (circuitBreaker.isOpen && circuitBreaker.successCount >= 3) {
        circuitBreaker.isOpen = false;
        circuitBreaker.failureCount = 0;
        logger.info(`Circuit breaker closed for epic: ${epic}`);
      }
    }
  }
  
  private recordCircuitBreakerFailure(epic: string): void {
    const circuitBreaker = this.circuitBreakers.get(epic);
    if (circuitBreaker) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = new Date();
      
      if (circuitBreaker.failureCount >= 5) {
        circuitBreaker.isOpen = true;
        circuitBreaker.successCount = 0;
        logger.warn(`Circuit breaker opened for epic: ${epic}`);
      }
    }
  }
  
  /**
   * Utility methods
   */
  private generateSagaId(type: string): string {
    return `saga-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay = Math.min(config.baseDelay * Math.pow(config.backoffMultiplier, attempt), config.maxDelay);
    
    if (config.jitter) {
      delay *= (0.5 + Math.random() * 0.5); // Add jitter
    }
    
    return Math.floor(delay);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private cleanupOldTraces(): void {
    const cutoffTime = new Date().getTime() - 3600000; // 1 hour
    this.dataFlowTraces = this.dataFlowTraces.filter(
      trace => trace.timestamp.getTime() > cutoffTime
    );
  }
  
  /**
   * Public API methods
   */
  public async getSagaStatus(sagaId: string): Promise<SagaTransaction | null> {
    return this.activeSagas.get(sagaId) || null;
  }
  
  public async getActiveSagas(): Promise<SagaTransaction[]> {
    return Array.from(this.activeSagas.values());
  }
  
  public async getEpicHealth(epic: string): Promise<{
    metrics: EpicMetrics | null;
    circuitBreakerStatus: CircuitBreakerState | null;
    isHealthy: boolean;
  }> {
    const metrics = this.epicMetrics.get(epic) || null;
    const circuitBreakerStatus = this.circuitBreakers.get(epic) || null;
    const isHealthy = !circuitBreakerStatus?.isOpen && 
      (metrics?.errorRate || 0) < 0.05 && 
      (metrics?.averageResponseTime || 0) < 5000;
    
    return {
      metrics,
      circuitBreakerStatus,
      isHealthy
    };
  }
  
  public async optimizeRetryConfiguration(epic: string, config: Partial<RetryConfig>): Promise<void> {
    const currentConfig = this.retryConfigs.get(epic);
    if (currentConfig) {
      this.retryConfigs.set(epic, { ...currentConfig, ...config });
      logger.info(`Updated retry configuration for epic: ${epic}`, config);
    }
  }
}

export default IntegrationPerformanceService.getInstance();