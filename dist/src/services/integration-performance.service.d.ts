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
interface EpicMetrics {
    epic: string;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageResponseTime: number;
    errorRate: number;
    lastUpdate: Date;
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
export declare class IntegrationPerformanceService {
    private static instance;
    private activeSagas;
    private epicMetrics;
    private dataFlowTraces;
    private retryConfigs;
    private circuitBreakers;
    private performanceHistory;
    private constructor();
    static getInstance(): IntegrationPerformanceService;
    private initializeDefaultRetryConfigs;
    private startPerformanceMonitoring;
    executeSaga(type: string, steps: Omit<SagaStep, 'id' | 'status' | 'result' | 'error' | 'duration' | 'retries'>[], metadata?: Record<string, any>): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
    private executeStep;
    private compensateTransaction;
    private simulateStepExecution;
    private executeCompensation;
    private trackDataFlow;
    private cacheSagaResult;
    private updateEpicMetrics;
    private analyzeDataFlowPerformance;
    private generatePerformanceReport;
    getPerformanceMetrics(): Promise<{
        epicMetrics: EpicMetrics[];
        dataFlowMetrics: DataFlowMetrics;
        activeSagas: number;
        recentReports: PerformanceReport[];
    }>;
    private isCircuitOpen;
    private recordCircuitBreakerSuccess;
    private recordCircuitBreakerFailure;
    private generateSagaId;
    private generateTraceId;
    private calculateRetryDelay;
    private sleep;
    private cleanupOldTraces;
    getSagaStatus(sagaId: string): Promise<SagaTransaction | null>;
    getActiveSagas(): Promise<SagaTransaction[]>;
    getEpicHealth(epic: string): Promise<{
        metrics: EpicMetrics | null;
        circuitBreakerStatus: CircuitBreakerState | null;
        isHealthy: boolean;
    }>;
    optimizeRetryConfiguration(epic: string, config: Partial<RetryConfig>): Promise<void>;
}
declare const _default: IntegrationPerformanceService;
export default _default;
//# sourceMappingURL=integration-performance.service.d.ts.map