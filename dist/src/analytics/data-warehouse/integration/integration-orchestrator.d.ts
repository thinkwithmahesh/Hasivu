/// <reference types="node" />
import { EventEmitter } from 'events';
import { OrchestrationConfig, IntegrationConfig, SystemConnector, IntegrationEvent, SystemHealth, DataFlow } from '../types/integration-types';
export declare class IntegrationOrchestrator extends EventEmitter {
    private readonly componentLogger;
    private readonly metrics;
    private readonly queue;
    private readonly systemConnectors;
    private readonly dataSynchronizer;
    private readonly eventStreamManager;
    private readonly apiGateway;
    private readonly serviceMesh;
    private readonly healthMonitor;
    private readonly dataFlowOrchestrator;
    private isRunning;
    private readonly serviceRegistry;
    private readonly activeDataFlows;
    private readonly systemHealthStatus;
    private readonly orchestrationConfig;
    constructor(config: OrchestrationConfig | IntegrationConfig);
    private normalizeConfig;
    private initializeComponent;
    private shutdownComponent;
    private safeCallMethod;
    start(): Promise<void>;
    stop(): Promise<void>;
    registerSystem(systemId: string, connector: SystemConnector): Promise<void>;
    createDataFlow(flowDefinition: {
        id: string;
        sourceSystem: string;
        targetSystem: string;
        dataType: string;
        schedule?: string;
        realtime?: boolean;
        transformation?: unknown;
        filter?: unknown;
    }): Promise<DataFlow>;
    startDataFlow(flowId: string): Promise<void>;
    synchronizeData(options?: {
        systems?: string[];
        dataTypes?: string[];
        fullSync?: boolean;
        priority?: 'low' | 'normal' | 'high';
    }): Promise<{
        syncJobId: string;
        affectedSystems: number;
        estimatedDuration: number;
    }>;
    publishEvent(event: IntegrationEvent): Promise<void>;
    subscribeToEvents(eventTypes: string[], handler: (event: IntegrationEvent) => Promise<void>): Promise<string>;
    getSystemHealth(): Promise<{
        overall: 'healthy' | 'degraded' | 'critical';
        systems: Record<string, SystemHealth>;
        dataFlows: Record<string, {
            status: string;
            lastSync: Date;
        }>;
        metrics: Record<string, number>;
    }>;
    getIntegrationStatistics(): Promise<{
        systems: {
            total: number;
            healthy: number;
            connected: number;
        };
        dataFlows: {
            total: number;
            active: number;
            failed: number;
        };
        events: {
            published: number;
            processed: number;
            failed: number;
        };
        sync: {
            jobs: number;
            successful: number;
            failed: number;
            avgDuration: number;
        };
        performance: {
            avgResponseTime: number;
            throughput: number;
            errorRate: number;
        };
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: Record<string, unknown>;
        }>;
        metrics: Record<string, number>;
    }>;
    private initializeSystemConnectors;
    private connectToSystems;
    private disconnectFromSystems;
    private startDataSynchronization;
    private startEventStreaming;
    private handleSystemEvent;
    private handleDataEvent;
    private handleHealthEvent;
    private stopAllDataFlows;
    private startHealthMonitoring;
    private checkSystemHealth;
    private getPerformanceStatistics;
    private calculateErrorRate;
    private startBackgroundTasks;
    private monitorDataFlows;
    private checkSystemConnectivity;
    private collectIntegrationMetrics;
    private setupEventHandlers;
}
//# sourceMappingURL=integration-orchestrator.d.ts.map