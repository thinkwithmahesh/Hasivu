import { E2ETestConfig, E2ETestResult } from './e2e-test-suite';
import { LoadTestConfig, LoadTestResult } from './load-test-suite';
type ChaosTestConfig = any;
type ChaosTestResult = any;
export interface TestSuiteConfig {
    environment: 'development' | 'staging' | 'production';
    baseUrl: string;
    timeout: number;
    retries: number;
    enableE2E: boolean;
    enableLoad: boolean;
    enableChaos: boolean;
    enablePerformanceMonitoring: boolean;
    concurrent: boolean;
    maxConcurrency: number;
    failFast: boolean;
    continueOnError: boolean;
    e2eConfig: E2ETestConfig;
    loadConfig: LoadTestConfig;
    chaosConfig: ChaosTestConfig;
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
    resourceLimits: {
        maxMemoryUsage: number;
        maxCpuUsage: number;
        maxDuration: number;
        maxConcurrentConnections: number;
    };
    cleanup: {
        enabled: boolean;
        retainReports: number;
        retainLogs: number;
        retainArtifacts: number;
        autoCleanup: boolean;
    };
}
export interface TestResultsSummary {
    executionId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    environment: string;
    overallStatus: 'passed' | 'failed' | 'partial' | 'error';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
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
    issues: TestIssue[];
    recommendations: string[];
    artifacts: {
        reportPath: string;
        metricsPath: string;
        logsPath: string;
        screenshotsPath?: string;
        videosPath?: string;
    };
}
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
export declare class TestRunner {
    private static instance;
    private config;
    private redisService;
    private performanceService;
    private emailService;
    private executionContext;
    private isRunning;
    private currentExecution;
    private constructor();
    static getInstance(config?: TestSuiteConfig): TestRunner;
    updateConfig(config: Partial<TestSuiteConfig>): void;
    runTestSuite(): Promise<TestResultsSummary>;
    private runConcurrentTests;
    private runSequentialTests;
    private runE2ETests;
    private runLoadTests;
    private runChaosTests;
    private processTestResult;
    private processE2EResults;
    private processLoadResults;
    private processChaosResults;
    private extractE2EIssues;
    private extractLoadIssues;
    private extractChaosIssues;
    private generateTestSummary;
    private generatePerformanceMetrics;
    private generateRecommendations;
    private generateArtifactsPaths;
    private generateReports;
    private generateJSONReport;
    private generateHTMLReport;
    private generateHTMLContent;
    private generateTestSuiteHTML;
    private generateJUnitReport;
    private generateJUnitXML;
    private generateE2EJUnitXML;
    private generateLoadJUnitXML;
    private generateChaosJUnitXML;
    private generateCSVReport;
    private generateCSVContent;
    private sendNotifications;
    private shouldSendNotification;
    private sendEmailNotification;
    private generateEmailHTMLContent;
    private sendSlackNotification;
    private sendWebhookNotification;
    private sendFailureNotification;
    private performHealthChecks;
    private handleTestSuiteError;
    private generateErrorSummary;
    private cleanup;
    private performCleanup;
    private cleanupOldFiles;
    private matchesPattern;
    private generateE2ESuggestedFix;
    private createExecutionContext;
    private generateExecutionId;
    private generateIssueId;
    private delay;
    getExecutionStatus(): {
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
    };
    stopExecution(): Promise<void>;
}
export default TestRunner;
//# sourceMappingURL=test-runner.d.ts.map