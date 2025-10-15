/// <reference types="node" />
import { EventEmitter } from 'events';
import { WarehouseOrchestratorConfig, SchemaDefinition, DataLineage, WarehouseQuery, QueryResult } from '../types/warehouse-types';
export declare class DataWarehouseOrchestrator extends EventEmitter {
    private readonly config;
    private readonly metrics;
    private readonly cache;
    private readonly starSchemaBuilder;
    private readonly snowflakeSchemaBuilder;
    private readonly temporalManager;
    private readonly lineageTracker;
    private readonly metadataManager;
    private readonly queryOptimizer;
    private readonly partitionManager;
    private readonly compressionEngine;
    private readonly tenantIsolation;
    private isRunning;
    private readonly activeSchemas;
    private readonly dataModels;
    private readonly queryCache;
    constructor(config: WarehouseOrchestratorConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    createStarSchema(schemaName: string, factTable: string, dimensionTables: string[], tenantId: string): Promise<SchemaDefinition>;
    createSnowflakeSchema(schemaName: string, factTable: string, dimensionHierarchy: Record<string, string[]>, tenantId: string): Promise<SchemaDefinition>;
    executeQuery(query: WarehouseQuery, tenantId: string): Promise<QueryResult>;
    getDataLineage(tableName: string, columnName?: string, tenantId?: string): Promise<DataLineage>;
    evolveSchema(schemaName: string, evolution: {
        addColumns?: Array<{
            name: string;
            type: string;
            nullable?: boolean;
        }>;
        removeColumns?: string[];
        modifyColumns?: Array<{
            name: string;
            newType: string;
            migration?: string;
        }>;
        addIndexes?: Array<{
            columns: string[];
            type: string;
        }>;
        removeIndexes?: string[];
    }, tenantId: string): Promise<SchemaDefinition>;
    getWarehouseStatistics(tenantId?: string): Promise<{
        schemas: number;
        tables: number;
        totalRows: number;
        totalSize: string;
        queries: {
            total: number;
            avgExecutionTime: number;
            cacheHitRate: number;
        };
        tenants: number;
        compression: {
            ratio: number;
            savings: string;
        };
        partitions: {
            total: number;
            active: number;
            pruned: number;
        };
    }>;
    getHealthStatus(): Promise<{
        healthy: boolean;
        components: Record<string, {
            healthy: boolean;
            details?: any;
        }>;
        metrics: Record<string, number>;
    }>;
    private loadExistingSchemas;
    private loadDataModels;
    private generateQueryCacheKey;
    private isResultFresh;
    private executeOptimizedQuery;
    private generateOptimalIndexes;
    private applySchemaEvolution;
    private getSchemaStatistics;
    private getQueryStatistics;
    private startBackgroundTasks;
    private cleanupQueryCache;
    private updateSchemaStatistics;
    private synchronizeMetadata;
    private setupEventHandlers;
}
//# sourceMappingURL=warehouse-orchestrator.d.ts.map