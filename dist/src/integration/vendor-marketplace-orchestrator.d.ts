/// <reference types="node" />
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
declare class MetricsCollector {
    recordEventProcessing(_data: Record<string, unknown>): void;
    recordDataSync(_data: Record<string, unknown>): void;
    recordSystemHealth(_data: Record<string, unknown>): void;
    recordWorkflowExecution(_data: Record<string, unknown>): void;
    recordError(_type: string, _message: string, _data: Record<string, unknown>): void;
}
declare class SecurityManager {
    validateEventAccess(_event: Record<string, unknown>, _tenantId: string): Promise<void>;
    validateDataAccess(_resource: string, _tenantId: string): Promise<void>;
}
declare class TenantContext {
    setTenant(_tenantId: string): Promise<void>;
}
declare class WebSocketManager {
    broadcast(_tenantId: string, _event: string, _data: Record<string, unknown>): Promise<void>;
}
declare class CacheManager {
    get(_key: string, _options?: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    set(_key: string, _value: Record<string, unknown>, _options?: Record<string, unknown>): Promise<void>;
}
declare class QueueManager {
}
declare class HealthMonitor {
}
import { AIProcurementEngine } from '../services/vendor/ai-procurement-engine';
import { VendorIntelligenceService as VendorIntelligenceSystem } from '../services/vendor/vendor-intelligence.service';
import { SupplyChainAutomationService as SupplyChainAutomation } from '../services/vendor/supply-chain-automation.service';
interface OrchestrationConfig {
    tenantId: string;
    schoolId: string;
    enableRealTime: boolean;
    enableCaching: boolean;
    enableMonitoring: boolean;
    performanceMode: 'standard' | 'optimized' | 'enterprise';
    integrationLevel: 'basic' | 'advanced' | 'full';
}
interface SystemEvent {
    eventId: string;
    eventType: string;
    source: 'procurement' | 'intelligence' | 'supply_chain' | 'frontend' | 'system';
    target?: string[];
    payload: Record<string, unknown>;
    metadata: EventMetadata;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
interface EventMetadata {
    tenantId: string;
    schoolId: string;
    userId?: string;
    sessionId?: string;
    correlationId: string;
    version: string;
}
interface IntegrationStatus {
    overall: 'healthy' | 'degraded' | 'critical' | 'offline';
    components: {
        [key: string]: ComponentStatus;
    };
    lastUpdated: Date;
    metrics: PerformanceMetrics;
}
interface ComponentStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    responseTime: number;
    errorRate: number;
    lastCheck: Date;
    message?: string;
}
interface PerformanceMetrics {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    queueDepth: number;
    memoryUsage: number;
    cpuUsage: number;
}
interface DataSyncOperation {
    operationId: string;
    operation: 'create' | 'update' | 'delete' | 'sync';
    entity: string;
    entityId: string;
    data: Record<string, unknown>;
    source: string;
    targets: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    retryCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}
export declare class VendorMarketplaceOrchestrator extends EventEmitter {
    private config;
    private logger;
    private metrics;
    private security;
    private tenantContext;
    private cache;
    private queue;
    private websocket;
    private health;
    private procurementEngine;
    private intelligenceSystem;
    private supplyChainSystem;
    private workflows;
    private activeWorkflows;
    private systemStatus;
    private syncOperations;
    constructor(config: OrchestrationConfig, dependencies: {
        logger: Logger;
        metrics: MetricsCollector;
        security: SecurityManager;
        tenantContext: TenantContext;
        cache: CacheManager;
        queue: QueueManager;
        websocket: WebSocketManager;
        health: HealthMonitor;
        procurementEngine: AIProcurementEngine;
        intelligenceSystem: VendorIntelligenceSystem;
        supplyChainSystem: SupplyChainAutomation;
    });
    processEvent(event: SystemEvent): Promise<{
        processed: boolean;
        workflows: string[];
        errors: string[];
        processingTime: number;
    }>;
    synchronizeData(operation: DataSyncOperation): Promise<{
        success: boolean;
        synchronized: string[];
        failed: string[];
        conflicts: unknown[] | undefined;
        processingTime: number;
    }>;
    getSystemHealth(): Promise<IntegrationStatus>;
    executeWorkflow(workflowId: string, triggerEvent: SystemEvent, context?: unknown): Promise<{
        success: boolean;
        steps: unknown[] | undefined;
        errors: string[];
        duration: number;
    }>;
    private initializeSystemStatus;
    private initializeEventHandlers;
    private initializeWorkflows;
    private startMonitoring;
    private identifyTriggeredWorkflows;
    private evaluateTriggerConditions;
    private routeEventToComponents;
    private routeToProcurementEngine;
    private routeToIntelligenceSystem;
    private routeToSupplyChainSystem;
    private executeTriggeredWorkflows;
    private broadcastEvent;
    private cacheEventData;
    private generateExecutionId;
    private checkServiceHealth;
    private checkProcurementEngineHealth;
    private checkIntelligenceSystemHealth;
    private checkSupplyChainHealth;
    private checkDatabaseHealth;
    private checkCacheHealth;
    private checkQueueHealth;
    private checkWebSocketHealth;
    private collectPerformanceMetrics;
    private triggerHealthAlert;
    private handleVendorMatched;
    private handleForecastGenerated;
    private handlePriceOptimized;
    private handleVendorScored;
    private handlePerformanceAlert;
    private handleRiskDetected;
    private handleOrderPlaced;
    private handleDeliveryUpdated;
    private handleQualityChecked;
    private handleDataSyncRequired;
    private handleWorkflowTrigger;
    private handleHealthAlert;
    private detectDataConflicts;
    private resolveDataConflicts;
    private executeSyncOperation;
    private updateSyncCache;
    private broadcastDataChange;
    private checkStepDependencies;
    private executeWorkflowStep;
    private executeApiCall;
    private emitWorkflowEvent;
    private transformData;
    private sendNotification;
    private requestApproval;
    private cleanupSyncOperations;
}
export default VendorMarketplaceOrchestrator;
//# sourceMappingURL=vendor-marketplace-orchestrator.d.ts.map