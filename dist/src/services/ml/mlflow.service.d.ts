export interface MLflowExperiment {
    experimentId: string;
    name: string;
    artifactLocation: string;
    lifecycleStage: 'active' | 'deleted';
    tags: Record<string, string>;
    creationTime: number;
    lastUpdateTime: number;
}
export interface MLflowRun {
    runId: string;
    experimentId: string;
    status: 'RUNNING' | 'SCHEDULED' | 'FINISHED' | 'FAILED' | 'KILLED';
    startTime: number;
    endTime?: number;
    artifactUri: string;
    data: {
        metrics: Record<string, number>;
        params: Record<string, string>;
        tags: Record<string, string>;
    };
}
export interface MLflowModelVersion {
    name: string;
    version: string;
    creationTimestamp: number;
    lastUpdatedTimestamp: number;
    userId: string;
    currentStage: 'None' | 'Staging' | 'Production' | 'Archived';
    description?: string;
    source: string;
    runId: string;
    status: 'PENDING_REGISTRATION' | 'FAILED_REGISTRATION' | 'READY';
    statusMessage?: string;
    tags: Record<string, string>;
}
export interface MLflowRegisteredModel {
    name: string;
    creationTimestamp: number;
    lastUpdatedTimestamp: number;
    description?: string;
    latestVersions: MLflowModelVersion[];
    tags: Record<string, string>;
}
export declare class MLflowService {
    private static instance;
    private config;
    private client;
    private redis;
    private initialized;
    private constructor();
    static getInstance(): MLflowService;
    initialize(): Promise<void>;
    createExperiment(name: string, tags?: Record<string, string>): Promise<string>;
    startExperiment(modelId: string, tags?: Record<string, string>): Promise<string>;
    startRun(experimentId: string, tags?: Record<string, string>, runName?: string): Promise<string>;
    logMetrics(runId: string, metrics: Record<string, number>, step?: number): Promise<void>;
    logParams(runId: string, params: Record<string, any>): Promise<void>;
    logTags(runId: string, tags: Record<string, string>): Promise<void>;
    logArtifact(runId: string, filePath: string, artifactPath?: string): Promise<void>;
    endRun(runId: string, status?: 'FINISHED' | 'FAILED' | 'KILLED'): Promise<void>;
    registerModel(modelId: string, stage?: 'Staging' | 'Production', description?: string): Promise<MLflowModelVersion>;
    transitionModelStage(modelName: string, version: string, stage: 'Staging' | 'Production' | 'Archived'): Promise<void>;
    getModelVersions(modelName: string): Promise<MLflowModelVersion[]>;
    archiveModel(modelId: string): Promise<void>;
    getExperimentByName(name: string): Promise<MLflowExperiment | null>;
    getRun(runId: string): Promise<MLflowRun | null>;
    searchRuns(experimentIds: string[], filter?: string, orderBy?: string[], maxResults?: number): Promise<MLflowRun[]>;
    getRunMetrics(runId: string): Promise<Record<string, number>>;
    getRunParams(runId: string): Promise<Record<string, string>>;
    deleteExperiment(experimentId: string): Promise<void>;
    private initializeConfig;
    private initializeClient;
    private testConnection;
    private ensureDefaultExperiment;
    private getRunArtifactUri;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: Record<string, any>;
    }>;
    getStats(): Promise<Record<string, any>>;
}
//# sourceMappingURL=mlflow.service.d.ts.map