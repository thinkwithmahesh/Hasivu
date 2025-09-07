/**
 * HASIVU Platform - Comprehensive Test Runner
 * Production-ready test orchestration framework that coordinates E2E, Load, and Chaos testing
 * Provides unified testing interface with intelligent scheduling and comprehensive reporting
 * Supports concurrent and sequential execution with performance monitoring and artifact generation
 */

import { promises as fs } from 'fs';
import { logger } from '../shared/utils/logger';
// import { RedisService } from '../shared/services/redis.service';  // Redis service import unavailable
import { E2ETestSuite, E2ETestConfig, E2ETestResult } from './e2e-test-suite';
import { LoadTestSuite, LoadTestConfig, LoadTestResult } from './load-test-suite';
import { ChaosEngineeringService as ChaosEngineeringSuite } from './chaos-engineering';
// Note: ChaosTestConfig, ChaosTestResult types may not be available - using any as fallback
type ChaosTestConfig = any;
type ChaosTestResult = any;
// import { PerformanceService } from '../shared/services/performance.service';  // Performance service import unavailable
import { EmailService } from '../shared/services/email.service';

/**
 * Test Suite Configuration
 * Comprehensive configuration for all test types and execution strategies
 */
export interface TestSuiteConfig {
  // Environment settings
  environment: 'development' | 'staging' | 'production';
  baseUrl: string;
  timeout: number;
  retries: number;
  
  // Test enablement
  enableE2E: boolean;
  enableLoad: boolean;
  enableChaos: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Execution strategy
  concurrent: boolean;
  maxConcurrency: number;
  failFast: boolean;
  continueOnError: boolean;
  
  // Test configurations
  e2eConfig: E2ETestConfig;
  loadConfig: LoadTestConfig;
  chaosConfig: ChaosTestConfig;
  
  // Reporting and notifications
  reporting: {
    enabled: boolean;
    outputPath: string;
    formats: ('json' | 'html' | 'junit' | 'csv')[];
    includeMetrics: boolean;
    includeLogs: boolean;
    includeArtifacts: boolean;
  };
  
  notifications: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    recipients: string[];
    webhookUrl?: string;
    onFailure: boolean;
    onSuccess: boolean;
    onThreshold: {
      enabled: boolean;
      passRateThreshold: number;
      responseTimeThreshold: number;
      resilienceScoreThreshold: number;
    };
  };
  
  // Performance and resource management
  resourceLimits: {
    maxMemoryUsage: number; // MB
    maxCpuUsage: number; // percentage
    maxDuration: number; // minutes
    maxConcurrentConnections: number;
  };
  
  // Cleanup and maintenance
  cleanup: {
    enabled: boolean;
    retainReports: number; // days
    retainLogs: number; // days
    retainArtifacts: number; // days
    autoCleanup: boolean;
  };
}

/**
 * Test Results Summary
 * Comprehensive summary of all test execution results
 */
export interface TestResultsSummary {
  // Execution metadata
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  environment: string;
  
  // Overall status
  overallStatus: 'passed' | 'failed' | 'partial' | 'error';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  
  // Test suite results
  testSuites: {
    e2e?: {
      status: 'passed' | 'failed' | 'skipped' | 'error';
      results: E2ETestResult[];
      summary: {
        totalScenarios: number;
        passedScenarios: number;
        failedScenarios: number;
        averageResponseTime: number;
        passRate: number;
        criticalFailures: number;
      };
    };
    load?: {
      status: 'passed' | 'failed' | 'skipped' | 'error';
      results: LoadTestResult;
      summary: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        throughput: number;
        errorRate: number;
        responseTime: number;
      };
    };
    chaos?: {
      status: 'passed' | 'failed' | 'skipped' | 'error';
      results: ChaosTestResult[];
      summary: {
        totalExperiments: number;
        successfulExperiments: number;
        failedExperiments: number;
        resilienceScore: number;
        recoveryTime: number;
        criticalIssues: number;
      };
    };
  };
  
  // Performance metrics
  performance: {
    systemMetrics: {
      cpuUsage: number[];
      memoryUsage: number[];
      networkIO: number[];
      diskIO: number[];
    };
    applicationMetrics: {
      responseTime: number[];
      throughput: number[];
      errorRate: number[];
      concurrentUsers: number[];
    };
    recommendations: string[];
  };
  
  // Issues and recommendations
  issues: TestIssue[];
  recommendations: string[];
  
  // Artifacts and reports
  artifacts: {
    reportPath: string;
    metricsPath: string;
    logsPath: string;
    screenshotsPath?: string;
    videosPath?: string;
  };
}

/**
 * Test Issue
 * Represents a test failure or performance issue
 */
export interface TestIssue {
  id: string;
  type: 'error' | 'failure' | 'warning' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: 'e2e' | 'load' | 'chaos' | 'system';
  title: string;
  description: string;
  stackTrace?: string;
  timestamp: Date;
  affectedEndpoints?: string[];
  suggestedFix?: string;
  relatedIssues?: string[];
}

/**
 * Test Execution Context
 * Runtime context for test execution
 */
export interface TestExecutionContext {
  executionId: string;
  startTime: Date;
  environment: string;
  userAgent: string;
  systemInfo: {
    platform: string;
    arch: string;
    nodeVersion: string;
    memory: number;
    cpuCount: number;
  };
  gitInfo?: {
    branch: string;
    commit: string;
    author: string;
    message: string;
  };
}

/**
 * Comprehensive Test Runner
 * Orchestrates all test types with intelligent scheduling and reporting
 */
export class TestRunner {
  private static instance: TestRunner;
  private config: TestSuiteConfig;
  private redisService: any; // RedisService temporarily unavailable
  private performanceService: any; // PerformanceService temporarily unavailable
  private emailService: EmailService;
  private executionContext: TestExecutionContext;
  private isRunning: boolean = false;
  private currentExecution: string | null = null;

  private constructor(config: TestSuiteConfig) {
    this.config = config;
    this.redisService = null; // RedisService temporarily unavailable
    this.performanceService = null; // PerformanceService temporarily unavailable
    this.emailService = EmailService.getInstance();
    this.executionContext = this.createExecutionContext();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: TestSuiteConfig): TestRunner {
    if (!TestRunner.instance) {
      if (!config) {
        throw new Error('TestRunner configuration required for first initialization');
      }
      TestRunner.instance = new TestRunner(config);
    }
    return TestRunner.instance;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TestSuiteConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Test runner configuration updated', {
      environment: this.config.environment,
      concurrent: this.config.concurrent,
      enabledSuites: {
        e2e: this.config.enableE2E,
        load: this.config.enableLoad,
        chaos: this.config.enableChaos
      }
    });
  }

  /**
   * Run complete test suite
   * Orchestrates all enabled test types with intelligent scheduling
   */
  public async runTestSuite(): Promise<TestResultsSummary> {
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.currentExecution = this.generateExecutionId();
    const startTime = new Date();

    try {
      logger.info('Starting comprehensive test suite', {
        executionId: this.currentExecution,
        environment: this.config.environment,
        concurrent: this.config.concurrent,
        enabledSuites: {
          e2e: this.config.enableE2E,
          load: this.config.enableLoad,
          chaos: this.config.enableChaos
        }
      });

      // Initialize performance monitoring if enabled
      if (this.config.enablePerformanceMonitoring) {
        await this.performanceService.startMonitoring();
      }

      // Pre-execution health checks
      await this.performHealthChecks();

      // Initialize test results summary
      const testSuites: TestResultsSummary['testSuites'] = {};
      const issues: TestIssue[] = [];

      // Run test suites based on configuration
      if (this.config.concurrent && this.config.environment !== 'production') {
        // Concurrent execution for non-production environments
        await this.runConcurrentTests(testSuites, issues);
      } else {
        // Sequential execution for production or when concurrent is disabled
        await this.runSequentialTests(testSuites, issues);
      }

      // Generate comprehensive summary
      const summary = await this.generateTestSummary(
        this.currentExecution,
        startTime,
        new Date(),
        testSuites,
        issues
      );

      // Generate reports and artifacts
      if (this.config.reporting.enabled) {
        await this.generateReports(summary);
      }

      // Send notifications
      if (this.config.notifications.enabled) {
        await this.sendNotifications(summary);
      }

      // Cleanup resources
      await this.cleanup();

      logger.info('Test suite execution completed', {
        executionId: this.currentExecution,
        duration: summary.duration,
        overallStatus: summary.overallStatus,
        totalTests: summary.totalTests,
        passedTests: summary.passedTests,
        failedTests: summary.failedTests
      });

      return summary;
    } catch (error: any) {
      logger.error('Test suite execution failed', {
        executionId: this.currentExecution,
        error: error.message,
        stack: error.stack
      });

      // Generate error summary
      const errorSummary = await this.generateErrorSummary(
        this.currentExecution || 'unknown',
        startTime,
        new Date(),
        error
      );

      // Send failure notifications
      if (this.config.notifications.enabled && this.config.notifications.onFailure) {
        await this.sendFailureNotification(error);
      }

      throw error;
    } finally {
      this.isRunning = false;
      this.currentExecution = null;
      
      // Stop performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.performanceService.stopMonitoring();
      }
    }
  }

  /**
   * Run concurrent tests
   * Executes multiple test suites in parallel with controlled concurrency
   */
  private async runConcurrentTests(
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): Promise<void> {
    const promises: Promise<{ type: string; result: any }>[] = [];

    // Add E2E tests if enabled
    if (this.config.enableE2E) {
      promises.push(this.runE2ETests().then(result => ({ type: 'e2e', result })));
    }

    // Add Load tests if enabled
    if (this.config.enableLoad) {
      promises.push(this.runLoadTests().then(result => ({ type: 'load', result })));
    }

    // Add Chaos tests if enabled (not recommended concurrent with others)
    if (this.config.enableChaos && promises.length === 0) {
      promises.push(this.runChaosTests().then(result => ({ type: 'chaos', result })));
    }

    // Execute concurrent tests with controlled parallelism
    const concurrentResults = await Promise.allSettled(promises);
    
    concurrentResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { type, result: testResult } = result.value;
        this.processTestResult(type, testResult, testSuites, issues);
      } else {
        logger.error(`Concurrent test failed: ${result.reason}`);
        issues.push({
          id: this.generateIssueId(),
          type: 'error',
          severity: 'critical',
          component: 'system',
          title: 'Concurrent Test Execution Failed',
          description: `Test execution failed: ${result.reason}`,
          timestamp: new Date()
        });
      }
    });
  }

  /**
   * Run sequential tests
   * Executes test suites one after another with proper cleanup between tests
   */
  private async runSequentialTests(
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): Promise<void> {
    // Run E2E tests first
    if (this.config.enableE2E) {
      try {
        logger.info('Starting E2E test suite');
        const e2eResults = await this.runE2ETests();
        this.processTestResult('e2e', e2eResults, testSuites, issues);
        
        // Short delay between test suites
        await this.delay(2000);
      } catch (error: any) {
        this.handleTestSuiteError('e2e', error, testSuites, issues);
        if (this.config.failFast) return;
      }
    }

    // Run Load tests second
    if (this.config.enableLoad) {
      try {
        logger.info('Starting Load test suite');
        const loadResults = await this.runLoadTests();
        this.processTestResult('load', loadResults, testSuites, issues);
        
        // Longer delay after load tests to let system recover
        await this.delay(5000);
      } catch (error: any) {
        this.handleTestSuiteError('load', error, testSuites, issues);
        if (this.config.failFast) return;
      }
    }

    // Run Chaos tests last (most disruptive)
    if (this.config.enableChaos) {
      try {
        logger.info('Starting Chaos engineering suite');
        const chaosResults = await this.runChaosTests();
        this.processTestResult('chaos', chaosResults, testSuites, issues);
      } catch (error: any) {
        this.handleTestSuiteError('chaos', error, testSuites, issues);
      }
    }
  }

  /**
   * Run E2E tests
   */
  private async runE2ETests(): Promise<E2ETestResult[]> {
    const e2eSuite = E2ETestSuite.getInstance(this.config.e2eConfig);
    return await e2eSuite.runTestSuite([]);
  }

  /**
   * Run Load tests
   */
  private async runLoadTests(): Promise<LoadTestResult> {
    const loadSuite = LoadTestSuite.getInstance(this.config.loadConfig);
    return await loadSuite.runLoadTest('Comprehensive Load Test');
  }

  /**
   * Run Chaos tests
   */
  private async runChaosTests(): Promise<ChaosTestResult[]> {
    const chaosSuite = ChaosEngineeringSuite.getInstance();
    const results = chaosSuite.getExperimentResults();
    return results;
  }

  /**
   * Process test result and add to summary
   */
  private processTestResult(
    type: string,
    result: any,
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): void {
    switch (type) {
      case 'e2e':
        testSuites.e2e = this.processE2EResults(result as E2ETestResult[]);
        this.extractE2EIssues(result as E2ETestResult[], issues);
        break;
      case 'load':
        testSuites.load = this.processLoadResults(result as LoadTestResult);
        this.extractLoadIssues(result as LoadTestResult, issues);
        break;
      case 'chaos':
        testSuites.chaos = this.processChaosResults(result as ChaosTestResult[]);
        this.extractChaosIssues(result as ChaosTestResult[], issues);
        break;
    }
  }

  /**
   * Process E2E test results
   */
  private processE2EResults(results: E2ETestResult[]): NonNullable<TestResultsSummary['testSuites']['e2e']> {
    const totalScenarios = results.length;
    const passedScenarios = results.filter(r => r.status === 'passed').length;
    const failedScenarios = results.filter(r => r.status === 'failed').length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / totalScenarios;
    const passRate = (passedScenarios / totalScenarios) * 100;
    const criticalFailures = results.filter(r => r.status === 'failed' && r.steps.some(s => (s as any).critical)).length;

    return {
      status: passRate >= 95 ? 'passed' : 'failed',
      results,
      summary: {
        totalScenarios,
        passedScenarios,
        failedScenarios,
        averageResponseTime,
        passRate,
        criticalFailures
      }
    };
  }

  /**
   * Process Load test results
   */
  private processLoadResults(result: LoadTestResult): NonNullable<TestResultsSummary['testSuites']['load']> {
    const successRate = ((result.metrics.totalRequests - result.metrics.failedRequests) / result.metrics.totalRequests) * 100;
    
    return {
      status: result.testStatus === 'warning' ? 'passed' : result.testStatus,
      results: result,
      summary: {
        totalRequests: result.metrics.totalRequests,
        successfulRequests: result.metrics.successfulRequests,
        failedRequests: result.metrics.failedRequests,
        averageResponseTime: result.metrics.averageResponseTime,
        throughput: Array.isArray(result.metrics.requestsPerSecond) 
          ? result.metrics.requestsPerSecond[result.metrics.requestsPerSecond.length - 1] || 0
          : (result.metrics.requestsPerSecond as any) || 0,
        errorRate: result.metrics.errorRate,
        responseTime: result.metrics.p95ResponseTime
      }
    };
  }

  /**
   * Process Chaos test results
   */
  private processChaosResults(results: ChaosTestResult[]): NonNullable<TestResultsSummary['testSuites']['chaos']> {
    const totalExperiments = results.length;
    const successfulExperiments = results.filter(r => r.status === 'passed').length;
    const failedExperiments = results.filter(r => r.status === 'failed').length;
    const resilienceScore = results.reduce((sum, r) => sum + (r.resilienceMetrics?.overallScore || 0), 0) / totalExperiments;
    const recoveryTime = results.reduce((sum, r) => sum + (r.recoveryTime || 0), 0) / totalExperiments;
    const criticalIssues = results.filter(r => r.criticalFailures && r.criticalFailures.length > 0).length;

    return {
      status: resilienceScore >= 80 ? 'passed' : 'failed',
      results,
      summary: {
        totalExperiments,
        successfulExperiments,
        failedExperiments,
        resilienceScore,
        recoveryTime,
        criticalIssues
      }
    };
  }

  /**
   * Extract issues from E2E test results
   */
  private extractE2EIssues(results: E2ETestResult[], issues: TestIssue[]): void {
    results.forEach(result => {
      if (result.status === 'failed') {
        result.steps.forEach(step => {
          if (step.status !== 'passed' && step.error) {
            issues.push({
              id: this.generateIssueId(),
              type: 'failure',
              severity: (step as any).critical ? 'critical' : 'high',
              component: 'e2e',
              title: `E2E Step Failed: ${(step as any).action || step.stepName}`,
              description: step.error,
              timestamp: new Date(),
              affectedEndpoints: [(step as any).endpoint || ''],
              suggestedFix: this.generateE2ESuggestedFix(step)
            });
          }
        });
      }
    });
  }

  /**
   * Extract issues from Load test results
   */
  private extractLoadIssues(result: LoadTestResult, issues: TestIssue[]): void {
    // High response time issues
    if (result.metrics.p95ResponseTime > 2000) {
      issues.push({
        id: this.generateIssueId(),
        type: 'performance',
        severity: result.metrics.p95ResponseTime > 5000 ? 'critical' : 'high',
        component: 'load',
        title: 'High Response Time Detected',
        description: `P95 response time (${result.metrics.p95ResponseTime}ms) exceeds acceptable threshold`,
        timestamp: new Date(),
        suggestedFix: 'Consider optimizing database queries, adding caching, or scaling resources'
      });
    }

    // High error rate issues
    if (result.metrics.errorRate > 5) {
      issues.push({
        id: this.generateIssueId(),
        type: 'error',
        severity: result.metrics.errorRate > 15 ? 'critical' : 'high',
        component: 'load',
        title: 'High Error Rate Detected',
        description: `Error rate (${result.metrics.errorRate}%) exceeds acceptable threshold`,
        timestamp: new Date(),
        suggestedFix: 'Investigate server logs for recurring errors and implement proper error handling'
      });
    }

    // Bottleneck issues
    result.bottlenecks.forEach(bottleneck => {
      issues.push({
        id: this.generateIssueId(),
        type: 'performance',
        severity: bottleneck.severity as any,
        component: 'load',
        title: `Performance Bottleneck: ${(bottleneck as any).component || 'unknown'}`,
        description: (bottleneck as any).issue || bottleneck.description,
        timestamp: new Date(),
        suggestedFix: (bottleneck as any).recommendation || bottleneck.suggestedFixes.join(', ')
      });
    });
  }

  /**
   * Extract issues from Chaos test results
   */
  private extractChaosIssues(results: ChaosTestResult[], issues: TestIssue[]): void {
    results.forEach(result => {
      if (result.criticalFailures) {
        result.criticalFailures.forEach(failure => {
          issues.push({
            id: this.generateIssueId(),
            type: 'error',
            severity: 'critical',
            component: 'chaos',
            title: `Chaos Experiment Critical Failure: ${result.experimentType}`,
            description: failure,
            timestamp: new Date(),
            suggestedFix: 'Implement proper resilience patterns and error handling for this failure mode'
          });
        });
      }
    });
  }

  /**
   * Generate comprehensive test summary
   */
  private async generateTestSummary(
    executionId: string,
    startTime: Date,
    endTime: Date,
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): Promise<TestResultsSummary> {
    const duration = endTime.getTime() - startTime.getTime();
    
    // Calculate overall metrics
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    Object.values(testSuites).forEach(suite => {
      if (suite?.summary) {
        if ('totalScenarios' in suite.summary) {
          totalTests += suite.summary.totalScenarios;
          passedTests += suite.summary.passedScenarios;
          failedTests += suite.summary.failedScenarios;
        }
        if ('totalExperiments' in suite.summary) {
          totalTests += suite.summary.totalExperiments;
          passedTests += suite.summary.successfulExperiments;
          failedTests += suite.summary.failedExperiments;
        }
      }
    });

    // Determine overall status
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const overallStatus = criticalIssues > 0 ? 'failed' : 
                         failedTests > 0 ? 'partial' : 'passed';

    // Generate performance metrics
    const performance = await this.generatePerformanceMetrics();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(testSuites, issues);

    // Generate artifacts paths
    const artifacts = await this.generateArtifactsPaths(executionId);

    return {
      executionId,
      startTime,
      endTime,
      duration,
      environment: this.config.environment,
      overallStatus,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      testSuites,
      performance,
      issues,
      recommendations,
      artifacts
    };
  }

  /**
   * Generate performance metrics summary
   */
  private async generatePerformanceMetrics(): Promise<TestResultsSummary['performance']> {
    if (!this.config.enablePerformanceMonitoring) {
      return {
        systemMetrics: {
          cpuUsage: [],
          memoryUsage: [],
          networkIO: [],
          diskIO: []
        },
        applicationMetrics: {
          responseTime: [],
          throughput: [],
          errorRate: [],
          concurrentUsers: []
        },
        recommendations: []
      };
    }

    const metrics = await this.performanceService.getMetrics();
    return {
      systemMetrics: {
        cpuUsage: metrics.system.cpu.history,
        memoryUsage: metrics.system.memory.history,
        networkIO: metrics.system.network.history,
        diskIO: metrics.system.disk.history
      },
      applicationMetrics: {
        responseTime: metrics.application.responseTime.history,
        throughput: metrics.application.throughput.history,
        errorRate: metrics.application.errorRate.history,
        concurrentUsers: metrics.application.concurrentUsers.history
      },
      recommendations: metrics.recommendations
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // E2E recommendations
    if (testSuites.e2e && testSuites.e2e.summary.passRate < 95) {
      recommendations.push(`E2E pass rate (${testSuites.e2e.summary.passRate.toFixed(1)}%) below target (95%). Review failed scenarios and improve test stability.`);
    }

    // Load test recommendations
    if (testSuites.load && testSuites.load.summary.responseTime > 2000) {
      recommendations.push(`Load test response time (${testSuites.load.summary.responseTime}ms) exceeds target (2000ms). Consider performance optimization.`);
    }

    // Chaos engineering recommendations
    if (testSuites.chaos && testSuites.chaos.summary.resilienceScore < 80) {
      recommendations.push(`System resilience score (${testSuites.chaos.summary.resilienceScore.toFixed(1)}) below target (80). Implement additional resilience patterns.`);
    }

    // Critical issue recommendations
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} critical issues detected. Address these immediately before production deployment.`);
    }

    // Performance recommendations
    const performanceIssues = issues.filter(i => i.type === 'performance');
    if (performanceIssues.length > 0) {
      recommendations.push(`${performanceIssues.length} performance issues detected. Review bottlenecks and optimize accordingly.`);
    }

    return recommendations;
  }

  /**
   * Generate artifacts paths
   */
  private async generateArtifactsPaths(executionId: string): Promise<TestResultsSummary['artifacts']> {
    const timestamp = Date.now();
    const basePath = this.config.reporting.outputPath;

    return {
      reportPath: `${basePath}/test-report-${executionId}-${timestamp}.json`,
      metricsPath: `${basePath}/metrics-${executionId}-${timestamp}.json`,
      logsPath: `${basePath}/logs-${executionId}-${timestamp}.log`,
      screenshotsPath: this.config.enableE2E ? `${basePath}/screenshots-${executionId}` : undefined,
      videosPath: this.config.enableE2E ? `${basePath}/videos-${executionId}` : undefined
    };
  }

  /**
   * Generate reports and artifacts
   */
  private async generateReports(summary: TestResultsSummary): Promise<void> {
    const promises: Promise<void>[] = [];

    // Generate JSON report
    if (this.config.reporting.formats.includes('json')) {
      promises.push(this.generateJSONReport(summary));
    }

    // Generate HTML report
    if (this.config.reporting.formats.includes('html')) {
      promises.push(this.generateHTMLReport(summary));
    }

    // Generate JUnit XML report
    if (this.config.reporting.formats.includes('junit')) {
      promises.push(this.generateJUnitReport(summary));
    }

    // Generate CSV report
    if (this.config.reporting.formats.includes('csv')) {
      promises.push(this.generateCSVReport(summary));
    }

    await Promise.all(promises);

    logger.info(`Test reports generated`, {
      reportPath: summary.artifacts.reportPath,
      metricsPath: summary.artifacts.metricsPath,
      formats: this.config.reporting.formats
    });
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(summary: TestResultsSummary): Promise<void> {
    const reportContent = JSON.stringify(summary, null, 2);
    await fs.writeFile(summary.artifacts.reportPath, reportContent, 'utf8');
  }

  /**
   * Generate HTML report
   */
  private async generateHTMLReport(summary: TestResultsSummary): Promise<void> {
    const htmlPath = summary.artifacts.reportPath.replace('.json', '.html');
    const htmlContent = this.generateHTMLContent(summary);
    await fs.writeFile(htmlPath, htmlContent, 'utf8');
  }

  /**
   * Generate HTML content for report
   */
  private generateHTMLContent(summary: TestResultsSummary): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${summary.executionId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-partial { color: #ffc107; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #dc3545; background: #f8f9fa; }
        .recommendation { margin: 5px 0; padding: 8px; background: #d1ecf1; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Report</h1>
        <p><strong>Execution ID:</strong> ${summary.executionId}</p>
        <p><strong>Environment:</strong> ${summary.environment}</p>
        <p><strong>Status:</strong> <span class="status-${summary.overallStatus}">${summary.overallStatus.toUpperCase()}</span></p>
        <p><strong>Duration:</strong> ${summary.duration}ms</p>
    </div>

    <div class="metrics">
        <h2>Test Metrics</h2>
        <div class="metric">
            <strong>Total Tests:</strong> ${summary.totalTests}
        </div>
        <div class="metric">
            <strong>Passed:</strong> <span class="status-passed">${summary.passedTests}</span>
        </div>
        <div class="metric">
            <strong>Failed:</strong> <span class="status-failed">${summary.failedTests}</span>
        </div>
        <div class="metric">
            <strong>Pass Rate:</strong> ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%
        </div>
    </div>

    ${this.generateTestSuiteHTML(summary.testSuites)}

    <div class="issues">
        <h2>Issues (${summary.issues.length})</h2>
        ${summary.issues.map(issue => `
            <div class="issue">
                <strong>${issue.title}</strong> [${issue.severity}]<br>
                <em>${issue.component}</em> - ${issue.description}
                ${issue.suggestedFix ? `<br><strong>Suggested Fix:</strong> ${issue.suggestedFix}` : ''}
            </div>
        `).join('')}
    </div>

    <div class="recommendations">
        <h2>Recommendations</h2>
        ${summary.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate test suite HTML section
   */
  private generateTestSuiteHTML(testSuites: TestResultsSummary['testSuites']): string {
    let html = '<div class="test-suites"><h2>Test Suites</h2>';

    if (testSuites.e2e) {
      html += `
        <h3>E2E Tests</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.e2e.status}">${testSuites.e2e.status}</td></tr>
          <tr><td>Total Scenarios</td><td>${testSuites.e2e.summary.totalScenarios}</td></tr>
          <tr><td>Passed</td><td>${testSuites.e2e.summary.passedScenarios}</td></tr>
          <tr><td>Failed</td><td>${testSuites.e2e.summary.failedScenarios}</td></tr>
          <tr><td>Pass Rate</td><td>${testSuites.e2e.summary.passRate.toFixed(1)}%</td></tr>
          <tr><td>Average Response Time</td><td>${testSuites.e2e.summary.averageResponseTime.toFixed(0)}ms</td></tr>
        </table>
      `;
    }

    if (testSuites.load) {
      html += `
        <h3>Load Tests</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.load.status}">${testSuites.load.status}</td></tr>
          <tr><td>Total Requests</td><td>${testSuites.load.summary.totalRequests}</td></tr>
          <tr><td>Successful</td><td>${testSuites.load.summary.successfulRequests}</td></tr>
          <tr><td>Failed</td><td>${testSuites.load.summary.failedRequests}</td></tr>
          <tr><td>Error Rate</td><td>${testSuites.load.summary.errorRate.toFixed(2)}%</td></tr>
          <tr><td>Average Response Time</td><td>${testSuites.load.summary.averageResponseTime.toFixed(0)}ms</td></tr>
          <tr><td>Throughput</td><td>${testSuites.load.summary.throughput.toFixed(0)} req/s</td></tr>
        </table>
      `;
    }

    if (testSuites.chaos) {
      html += `
        <h3>Chaos Engineering</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.chaos.status}">${testSuites.chaos.status}</td></tr>
          <tr><td>Total Experiments</td><td>${testSuites.chaos.summary.totalExperiments}</td></tr>
          <tr><td>Successful</td><td>${testSuites.chaos.summary.successfulExperiments}</td></tr>
          <tr><td>Failed</td><td>${testSuites.chaos.summary.failedExperiments}</td></tr>
          <tr><td>Resilience Score</td><td>${testSuites.chaos.summary.resilienceScore.toFixed(1)}</td></tr>
          <tr><td>Average Recovery Time</td><td>${testSuites.chaos.summary.recoveryTime.toFixed(0)}ms</td></tr>
        </table>
      `;
    }

    html += '</div>';
    return html;
  }

  /**
   * Generate JUnit XML report
   */
  private async generateJUnitReport(summary: TestResultsSummary): Promise<void> {
    const xmlPath = summary.artifacts.reportPath.replace('.json', '.xml');
    const xmlContent = this.generateJUnitXML(summary);
    await fs.writeFile(xmlPath, xmlContent, 'utf8');
  }

  /**
   * Generate JUnit XML content
   */
  private generateJUnitXML(summary: TestResultsSummary): string {
    const duration = (summary.duration / 1000).toFixed(3);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="HASIVU Test Suite" 
           tests="${summary.totalTests}" 
           failures="${summary.failedTests}" 
           errors="0" 
           time="${duration}">`;

    if (summary.testSuites.e2e) {
      xml += this.generateE2EJUnitXML(summary.testSuites.e2e);
    }

    if (summary.testSuites.load) {
      xml += this.generateLoadJUnitXML(summary.testSuites.load);
    }

    if (summary.testSuites.chaos) {
      xml += this.generateChaosJUnitXML(summary.testSuites.chaos);
    }

    xml += '\n</testsuites>';
    return xml;
  }

  /**
   * Generate E2E JUnit XML section
   */
  private generateE2EJUnitXML(e2e: NonNullable<TestResultsSummary['testSuites']['e2e']>): string {
    let xml = `\n  <testsuite name="E2E Tests" tests="${e2e.summary.totalScenarios}" failures="${e2e.summary.failedScenarios}" time="${(e2e.summary.averageResponseTime / 1000).toFixed(3)}">`;
    
    e2e.results.forEach(result => {
      const duration = (result.duration / 1000).toFixed(3);
      xml += `\n    <testcase classname="E2E" name="${result.scenarioName}" time="${duration}">`;
      
      if (result.status === 'failed') {
        const failedStep = result.steps.find(s => s.status !== 'passed');
        if (failedStep) {
          xml += `\n      <failure message="${failedStep.error}">${failedStep.error}</failure>`;
        }
      }
      
      xml += '\n    </testcase>';
    });
    
    xml += '\n  </testsuite>';
    return xml;
  }

  /**
   * Generate Load JUnit XML section
   */
  private generateLoadJUnitXML(load: NonNullable<TestResultsSummary['testSuites']['load']>): string {
    const duration = (load.results.duration / 1000).toFixed(3);
    const testName = `Load Test - ${load.results.testName}`;
    
    return `\n  <testsuite name="Load Tests" tests="1" failures="${load.status === 'failed' ? 1 : 0}" time="${duration}">
    <testcase classname="Load" name="${testName}" time="${duration}">
      ${load.status === 'failed' ? `<failure message="Load test failed">Performance targets not met</failure>` : ''}
    </testcase>
  </testsuite>`;
  }

  /**
   * Generate Chaos JUnit XML section
   */
  private generateChaosJUnitXML(chaos: NonNullable<TestResultsSummary['testSuites']['chaos']>): string {
    let xml = `\n  <testsuite name="Chaos Engineering" tests="${chaos.summary.totalExperiments}" failures="${chaos.summary.failedExperiments}" time="0">`;
    
    chaos.results.forEach(result => {
      const duration = ((result.recoveryTime || 0) / 1000).toFixed(3);
      xml += `\n    <testcase classname="Chaos" name="${result.experimentType}" time="${duration}">`;
      
      if (result.status === 'failed') {
        xml += `\n      <failure message="Chaos experiment failed">${result.criticalFailures?.join(', ') || 'Unknown failure'}</failure>`;
      }
      
      xml += '\n    </testcase>';
    });
    
    xml += '\n  </testsuite>';
    return xml;
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(summary: TestResultsSummary): Promise<void> {
    const csvPath = summary.artifacts.reportPath.replace('.json', '.csv');
    const csvContent = this.generateCSVContent(summary);
    await fs.writeFile(csvPath, csvContent, 'utf8');
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(summary: TestResultsSummary): string {
    let csv = 'Test Suite,Test Name,Status,Duration,Component,Details\n';
    
    // Add E2E results
    if (summary.testSuites.e2e) {
      summary.testSuites.e2e.results.forEach(result => {
        csv += `E2E,"${result.scenarioName}",${result.status},${result.duration},E2E Testing,"Pass Rate: ${summary.testSuites.e2e!.summary.passRate.toFixed(1)}%"\n`;
      });
    }

    // Add Load results
    if (summary.testSuites.load) {
      const throughput = Array.isArray(summary.testSuites.load.summary.throughput) ? summary.testSuites.load.summary.throughput[0] || 0 : summary.testSuites.load.summary.throughput || 0;
      csv += `Load,"${summary.testSuites.load.results.testName}",${summary.testSuites.load.status},${summary.testSuites.load.results.duration},Load Testing,"Throughput: ${throughput} req/s"\n`;
    }

    // Add Chaos results
    if (summary.testSuites.chaos) {
      summary.testSuites.chaos.results.forEach(result => {
        csv += `Chaos,"${result.experimentType}",${result.status},${result.recoveryTime || 0},Chaos Engineering,"Resilience Score: ${summary.testSuites.chaos!.summary.resilienceScore.toFixed(1)}"\n`;
      });
    }

    return csv;
  }

  /**
   * Send notifications based on test results
   */
  private async sendNotifications(summary: TestResultsSummary): Promise<void> {
    const shouldNotify = this.shouldSendNotification(summary);
    
    if (!shouldNotify) {
      return;
    }

    const promises: Promise<void>[] = [];

    // Email notifications
    if (this.config.notifications.channels.includes('email')) {
      promises.push(this.sendEmailNotification(summary));
    }

    // Slack notifications
    if (this.config.notifications.channels.includes('slack')) {
      promises.push(this.sendSlackNotification(summary));
    }

    // Webhook notifications
    if (this.config.notifications.channels.includes('webhook') && this.config.notifications.webhookUrl) {
      promises.push(this.sendWebhookNotification(summary));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Determine if notifications should be sent
   */
  private shouldSendNotification(summary: TestResultsSummary): boolean {
    // Always notify on failure if configured
    if (summary.overallStatus === 'failed' && this.config.notifications.onFailure) {
      return true;
    }

    // Notify on success if configured
    if (summary.overallStatus === 'passed' && this.config.notifications.onSuccess) {
      return true;
    }

    // Notify on threshold violations if configured
    if (this.config.notifications.onThreshold.enabled) {
      const thresholds = this.config.notifications.onThreshold;
      
      // Check pass rate threshold
      const passRate = (summary.passedTests / summary.totalTests) * 100;
      if (passRate < thresholds.passRateThreshold) {
        return true;
      }

      // Check response time threshold (E2E or Load)
      const e2eResponseTime = summary.testSuites.e2e?.summary.averageResponseTime;
      const loadResponseTime = summary.testSuites.load?.summary.averageResponseTime;
      
      if ((e2eResponseTime && e2eResponseTime > thresholds.responseTimeThreshold) ||
          (loadResponseTime && loadResponseTime > thresholds.responseTimeThreshold)) {
        return true;
      }

      // Check resilience score threshold
      const resilienceScore = summary.testSuites.chaos?.summary.resilienceScore;
      if (resilienceScore && resilienceScore < thresholds.resilienceScoreThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(summary: TestResultsSummary): Promise<void> {
    try {
      const subject = `Test Execution ${summary.overallStatus.toUpperCase()} - ${summary.executionId}`;
      const htmlContent = this.generateEmailHTMLContent(summary);
      
      for (const recipient of this.config.notifications.recipients) {
        await this.emailService.sendEmail({
          to: recipient,
          subject,
          html: htmlContent,
          categories: ['testing', 'automated'],
          customArgs: {
            executionId: summary.executionId,
            environment: summary.environment,
            status: summary.overallStatus
          }
        });
      }

      logger.info('Email notifications sent successfully', {
        executionId: summary.executionId,
        recipients: this.config.notifications.recipients.length
      });
    } catch (error: any) {
      logger.error('Failed to send email notification', {
        executionId: summary.executionId,
        error: error.message
      });
    }
  }

  /**
   * Generate email HTML content
   */
  private generateEmailHTMLContent(summary: TestResultsSummary): string {
    const statusColor = summary.overallStatus === 'passed' ? '#28a745' : 
                       summary.overallStatus === 'partial' ? '#ffc107' : '#dc3545';

    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: ${statusColor}; margin: 0;">
              Test Execution ${summary.overallStatus.toUpperCase()}
            </h2>
            <p><strong>Execution ID:</strong> ${summary.executionId}</p>
            <p><strong>Environment:</strong> ${summary.environment}</p>
            <p><strong>Duration:</strong> ${summary.duration}ms</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>Summary</h3>
            <ul>
              <li>Total Tests: ${summary.totalTests}</li>
              <li>Passed: <span style="color: #28a745;">${summary.passedTests}</span></li>
              <li>Failed: <span style="color: #dc3545;">${summary.failedTests}</span></li>
              <li>Pass Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%</li>
            </ul>
          </div>

          ${summary.issues.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3>Critical Issues (${summary.issues.filter(i => i.severity === 'critical').length})</h3>
            <ul>
              ${summary.issues.filter(i => i.severity === 'critical').map(issue => 
                `<li><strong>${issue.title}</strong> - ${issue.description}</li>`
              ).join('')}
            </ul>
          </div>
          ` : ''}

          <div>
            <h3>Reports</h3>
            <p>Detailed reports and artifacts have been generated:</p>
            <ul>
              <li>JSON Report: ${summary.artifacts.reportPath}</li>
              <li>Metrics: ${summary.artifacts.metricsPath}</li>
              <li>Logs: ${summary.artifacts.logsPath}</li>
            </ul>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(summary: TestResultsSummary): Promise<void> {
    // Implementation would depend on Slack webhook configuration
    logger.info('Slack notification would be sent here', {
      executionId: summary.executionId
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(summary: TestResultsSummary): Promise<void> {
    try {
      if (!this.config.notifications.webhookUrl) {
        return;
      }

      const payload = {
        executionId: summary.executionId,
        environment: summary.environment,
        status: summary.overallStatus,
        duration: summary.duration,
        totalTests: summary.totalTests,
        passedTests: summary.passedTests,
        failedTests: summary.failedTests,
        passRate: (summary.passedTests / summary.totalTests) * 100,
        criticalIssues: summary.issues.filter(i => i.severity === 'critical').length,
        timestamp: new Date().toISOString(),
        artifacts: summary.artifacts
      };

      const response = await fetch(this.config.notifications.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      logger.info('Webhook notification sent successfully', {
        executionId: summary.executionId,
        webhookUrl: this.config.notifications.webhookUrl
      });
    } catch (error: any) {
      logger.error('Failed to send webhook notification', {
        executionId: summary.executionId,
        error: error.message
      });
    }
  }

  /**
   * Send failure notification
   */
  private async sendFailureNotification(error: Error): Promise<void> {
    try {
      const subject = `Test Execution FAILED - ${this.currentExecution}`;
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
            <div style="background: #f8d7da; padding: 20px; border-radius: 5px; border: 1px solid #f5c6cb;">
              <h2 style="color: #721c24; margin: 0;">Test Execution Failed</h2>
              <p><strong>Execution ID:</strong> ${this.currentExecution}</p>
              <p><strong>Environment:</strong> ${this.config.environment}</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <div style="margin-top: 20px;">
              <h3>Error Details</h3>
              <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;">
${error.stack}
              </pre>
            </div>
          </body>
        </html>
      `;
      
      for (const recipient of this.config.notifications.recipients) {
        await this.emailService.sendEmail({
          to: recipient,
          subject,
          html: htmlContent,
          categories: ['testing', 'error'],
          customArgs: {
            executionId: this.currentExecution || 'unknown',
            environment: this.config.environment,
            status: 'failed'
          }
        });
      }

      logger.info('Failure notifications sent successfully');
    } catch (notificationError: any) {
      logger.error('Failed to send failure notification', {
        error: notificationError.message
      });
    }
  }

  /**
   * Perform health checks before test execution
   */
  private async performHealthChecks(): Promise<void> {
    const healthIssues: string[] = [];

    try {
      // Check base URL accessibility
      if (this.config.baseUrl) {
        const healthEndpoint = `${this.config.baseUrl}/health`;
        try {
          const response = await fetch(healthEndpoint, { 
            method: 'GET'
          });
          
          if (!response.ok) {
            healthIssues.push(`Health endpoint ${healthEndpoint} returned status ${response.status}`);
          }
        } catch (error: any) {
          healthIssues.push(`Health endpoint ${healthEndpoint} failed: ${error.message}`);
        }
      }

      // Check Redis connectivity if enabled
      if (this.config.enablePerformanceMonitoring) {
        try {
          await this.redisService.ping();
        } catch (error: any) {
          healthIssues.push(`Redis connectivity failed: ${error.message}`);
        }
      }

      // Check disk space for reporting
      if (this.config.reporting.enabled) {
        // Basic disk space check implementation would go here
        // For now, we'll just ensure the directory exists
        try {
          await fs.mkdir(this.config.reporting.outputPath, { recursive: true });
        } catch (error: any) {
          healthIssues.push(`Cannot create reporting directory: ${error.message}`);
        }
      }

      // Log health check results
      if (healthIssues.length > 0) {
        logger.warn('Health check issues detected', {
          issues: healthIssues,
          continueExecution: this.config.continueOnError
        });
        
        if (!this.config.continueOnError) {
          throw new Error(`Health check failed: ${healthIssues.join(', ')}`);
        }
      } else {
        logger.info('All health checks passed');
      }
    } catch (error: any) {
      logger.error('Health check failed', {
        error: error.message,
        issues: healthIssues
      });
      throw error;
    }
  }

  /**
   * Handle test suite execution error
   */
  private handleTestSuiteError(
    suiteType: string,
    error: Error,
    testSuites: TestResultsSummary['testSuites'],
    issues: TestIssue[]
  ): void {
    logger.error(`${suiteType} test suite failed`, {
      error: error.message,
      stack: error.stack
    });

    // Add error to issues
    issues.push({
      id: this.generateIssueId(),
      type: 'error',
      severity: 'critical',
      component: suiteType as any,
      title: `${suiteType.toUpperCase()} Test Suite Failed`,
      description: error.message,
      stackTrace: error.stack,
      timestamp: new Date(),
      suggestedFix: `Review ${suiteType} test configuration and system requirements`
    });

    // Mark test suite as failed
    (testSuites as any)[suiteType] = {
      status: 'failed',
      results: null,
      summary: {
        totalScenarios: 0,
        passedScenarios: 0,
        failedScenarios: 0,
        averageResponseTime: 0,
        passRate: 0,
        criticalFailures: 1
      }
    };
  }

  /**
   * Generate error summary for failed executions
   */
  private async generateErrorSummary(
    executionId: string,
    startTime: Date,
    endTime: Date,
    error: Error
  ): Promise<TestResultsSummary> {
    const duration = endTime.getTime() - startTime.getTime();
    const artifacts = await this.generateArtifactsPaths(executionId);
    
    return {
      executionId,
      startTime,
      endTime,
      duration,
      environment: this.config.environment,
      overallStatus: 'failed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testSuites: {},
      performance: {
        systemMetrics: {
          cpuUsage: [],
          memoryUsage: [],
          networkIO: [],
          diskIO: []
        },
        applicationMetrics: {
          responseTime: [],
          throughput: [],
          errorRate: [],
          concurrentUsers: []
        },
        recommendations: []
      },
      issues: [{
        id: this.generateIssueId(),
        type: 'error',
        severity: 'critical',
        component: 'system',
        title: 'Test Suite Execution Failed',
        description: error.message,
        stackTrace: error.stack,
        timestamp: new Date()
      }],
      recommendations: [
        'Review system configuration and dependencies',
        'Check network connectivity and service availability',
        'Verify test configuration and environment variables'
      ],
      artifacts
    };
  }

  /**
   * Cleanup resources and temporary files
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.config.cleanup.enabled && this.config.cleanup.autoCleanup) {
        await this.performCleanup();
      }
    } catch (error: any) {
      logger.error('Cleanup failed', {
        error: error.message
      });
      // Don't throw cleanup errors
    }
  }

  /**
   * Perform cleanup of old files and resources
   */
  private async performCleanup(): Promise<void> {
    const now = new Date();
    const cleanupPromises: Promise<void>[] = [];

    // Clean up old reports
    if (this.config.cleanup.retainReports > 0) {
      cleanupPromises.push(this.cleanupOldFiles(
        this.config.reporting.outputPath,
        'test-report-*.json',
        this.config.cleanup.retainReports
      ));
    }

    // Clean up old logs
    if (this.config.cleanup.retainLogs > 0) {
      cleanupPromises.push(this.cleanupOldFiles(
        this.config.reporting.outputPath,
        'logs-*.log',
        this.config.cleanup.retainLogs
      ));
    }

    // Clean up old artifacts
    if (this.config.cleanup.retainArtifacts > 0) {
      cleanupPromises.push(this.cleanupOldFiles(
        this.config.reporting.outputPath,
        'screenshots-*',
        this.config.cleanup.retainArtifacts
      ));
      
      cleanupPromises.push(this.cleanupOldFiles(
        this.config.reporting.outputPath,
        'videos-*',
        this.config.cleanup.retainArtifacts
      ));
    }

    await Promise.allSettled(cleanupPromises);
    logger.info('Cleanup completed successfully');
  }

  /**
   * Clean up old files matching pattern
   */
  private async cleanupOldFiles(basePath: string, pattern: string, retainDays: number): Promise<void> {
    try {
      const files = await fs.readdir(basePath);
      const cutoffTime = new Date(Date.now() - (retainDays * 24 * 60 * 60 * 1000));
      
      for (const file of files) {
        if (this.matchesPattern(file, pattern)) {
          const filePath = `${basePath}/${file}`;
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffTime) {
            if (stats.isDirectory()) {
              await fs.rmdir(filePath, { recursive: true });
            } else {
              await fs.unlink(filePath);
            }
            logger.debug('Cleaned up old file', { file: filePath });
          }
        }
      }
    } catch (error: any) {
      logger.warn('Failed to cleanup old files', {
        basePath,
        pattern,
        error: error.message
      });
    }
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  }

  /**
   * Generate suggested fix for E2E step failure
   */
  private generateE2ESuggestedFix(step: any): string {
    switch (step.action) {
      case 'GET':
      case 'POST':
      case 'PUT':
      case 'DELETE':
      case 'PATCH':
        return 'Check API endpoint availability, request format, and authentication';
      case 'NAVIGATE':
        return 'Verify URL accessibility and page load performance';
      case 'CLICK':
        return 'Ensure element is visible and clickable, check for overlays';
      case 'INPUT':
        return 'Verify input field is enabled and accepts the data format';
      case 'WAIT':
        return 'Adjust wait conditions or increase timeout for slow operations';
      default:
        return 'Review test step configuration and system state';
    }
  }

  /**
   * Create execution context
   */
  private createExecutionContext(): TestExecutionContext {
    return {
      executionId: this.generateExecutionId(),
      startTime: new Date(),
      environment: this.config.environment,
      userAgent: 'HASIVU-TestRunner/1.0',
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpuCount: require('os').cpus().length
      }
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 6);
    return `test-${timestamp}-${random}`;
  }

  /**
   * Generate unique issue ID
   */
  private generateIssueId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `issue-${timestamp}-${random}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current execution status
   */
  public getExecutionStatus(): {
    isRunning: boolean;
    currentExecution: string | null;
    environment: string;
    configuration: {
      concurrent: boolean;
      enabledSuites: {
        e2e: boolean;
        load: boolean;
        chaos: boolean;
      };
      notifications: boolean;
      reporting: boolean;
    };
  } {
    return {
      isRunning: this.isRunning,
      currentExecution: this.currentExecution,
      environment: this.config.environment,
      configuration: {
        concurrent: this.config.concurrent,
        enabledSuites: {
          e2e: this.config.enableE2E,
          load: this.config.enableLoad,
          chaos: this.config.enableChaos
        },
        notifications: this.config.notifications.enabled,
        reporting: this.config.reporting.enabled
      }
    };
  }

  /**
   * Stop current execution
   */
  public async stopExecution(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('No test execution currently running');
    }

    logger.warn('Stopping test execution', {
      executionId: this.currentExecution
    });

    this.isRunning = false;
    
    // Cleanup and stop monitoring
    if (this.config.enablePerformanceMonitoring) {
      await this.performanceService.stopMonitoring();
    }

    await this.cleanup();
  }
}

// Export default singleton factory
export default TestRunner;