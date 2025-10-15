import { StorageQuery, QueryResult, ParallelConfig } from '../../types/storage-types';
export declare class ParallelProcessor {
    private config;
    private workerPool;
    private taskQueue;
    private loadBalancer;
    private isRunning;
    constructor(config: ParallelConfig);
    initialize(): Promise<void>;
    executeParallel(queries: StorageQuery[]): Promise<QueryResult[]>;
    executeWithLoadBalancing(query: StorageQuery): Promise<QueryResult>;
    getWorkerStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private setupWorkerPool;
    private startTaskProcessor;
    private processTasks;
    private assignTaskToWorker;
    private executeOnWorker;
    private waitForCompletion;
    private createErrorResult;
    private estimateExecutionTime;
    private generateMockData;
    private generateMockColumns;
    private startWorkerMonitoring;
    private adjustParallelism;
    private performWorkStealing;
    private calculateThroughput;
    private calculateSuccessRate;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    calculateOptimalParallelism(): Promise<number>;
}
export default ParallelProcessor;
//# sourceMappingURL=parallel-processor.d.ts.map