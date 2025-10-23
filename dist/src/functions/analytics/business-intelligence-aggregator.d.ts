import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
interface DataDimension {
    dimensionId: string;
    name: string;
    type: 'categorical' | 'numerical' | 'temporal' | 'geographical';
    hierarchy: string[];
    attributes: Record<string, unknown>;
    cardinality: number;
    uniqueValues: Array<{
        value: unknown;
        label: string;
        frequency: number;
    }>;
}
interface DataMeasure {
    measureId: string;
    name: string;
    dataType: 'integer' | 'decimal' | 'percentage' | 'currency';
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
    unit: string;
    format: string;
    businessRules: string[];
}
interface DataCube {
    cubeId: string;
    name: string;
    description: string;
    dimensions: DataDimension[];
    measures: DataMeasure[];
    factTable: string;
    refreshFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    lastRefresh: Date;
    dataQuality: {
        completeness: number;
        accuracy: number;
        consistency: number;
        timeliness: number;
        validity: number;
        overall: number;
    };
    size: {
        rows: number;
        compressed: number;
        uncompressed: number;
    };
    partitioning: {
        strategy: 'time' | 'hash' | 'range';
        columns: string[];
        partitions: number;
    };
}
interface AggregatedData {
    aggregationId: string;
    generatedAt: Date;
    query: {
        dimensions: string[];
        measures: string[];
        filters: Record<string, unknown>;
        timeRange: {
            start: Date;
            end: Date;
            granularity: string;
        };
    };
    results: Array<{
        dimensionValues: Record<string, unknown>;
        measureValues: Record<string, number>;
        metadata: {
            recordCount: number;
            confidence: number;
            dataQuality: number;
        };
    }>;
    summaryStatistics: {
        totalRecords: number;
        dimensions: Record<string, {
            uniqueValues: number;
            nullCount: number;
            distribution: Array<{
                value: unknown;
                count: number;
                percentage: number;
            }>;
        }>;
        measures: Record<string, {
            sum: number;
            avg: number;
            min: number;
            max: number;
            stdDev: number;
            percentiles: Record<string, number>;
        }>;
    };
    comparisons?: {
        previousPeriod: {
            change: Record<string, number>;
            changePercentage: Record<string, number>;
        };
        benchmark: {
            industry: Record<string, number>;
            target: Record<string, number>;
            variance: Record<string, number>;
        };
    };
    insights: Array<{
        type: 'trend' | 'anomaly' | 'correlation' | 'pattern';
        description: string;
        significance: number;
        confidence: number;
        recommendation?: string;
    }>;
}
interface ETLProcess {
    processId: string;
    name: string;
    description: string;
    type: 'extract' | 'transform' | 'load' | 'full_etl';
    source: {
        type: 'database' | 'api' | 'file' | 'stream';
        connection: string;
        schema?: string;
        tables?: string[];
        query?: string;
    };
    transformations: Array<{
        step: number;
        type: 'filter' | 'aggregate' | 'join' | 'calculate' | 'validate' | 'cleanse';
        description: string;
        logic: string;
        inputColumns: string[];
        outputColumns: string[];
    }>;
    target: {
        type: 'warehouse' | 'mart' | 'cube' | 'api';
        connection: string;
        schema: string;
        table: string;
        mode: 'append' | 'overwrite' | 'merge';
    };
    schedule: {
        frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
        time?: string;
        timezone: string;
        dependencies: string[];
    };
    monitoring: {
        lastRun: Date;
        status: 'running' | 'success' | 'failed' | 'warning';
        duration: number;
        recordsProcessed: number;
        recordsInserted: number;
        recordsUpdated: number;
        recordsRejected: number;
        errorRate: number;
        performanceMetrics: {
            throughput: number;
            memoryUsage: number;
            cpuUsage: number;
        };
    };
    dataQuality: {
        rules: Array<{
            ruleId: string;
            name: string;
            type: 'completeness' | 'validity' | 'accuracy' | 'consistency' | 'uniqueness';
            expression: string;
            threshold: number;
            action: 'warn' | 'reject' | 'fix';
            status: 'passed' | 'failed' | 'warning';
            violationCount: number;
        }>;
        overallScore: number;
        trend: 'improving' | 'stable' | 'degrading';
    };
}
interface DataLineage {
    entityId: string;
    entityType: 'table' | 'view' | 'column' | 'report' | 'dashboard' | 'cube' | 'metric';
    entityName: string;
    upstream: Array<{
        entityId: string;
        entityName: string;
        entityType: string;
        relationship: 'direct' | 'indirect';
        transformations: string[];
        confidence: number;
    }>;
    downstream: Array<{
        entityId: string;
        entityName: string;
        entityType: string;
        relationship: 'direct' | 'indirect';
        usage: 'report' | 'dashboard' | 'api' | 'export';
        impact: 'critical' | 'high' | 'medium' | 'low';
    }>;
    metadata: {
        owner: string;
        steward: string;
        classification: 'public' | 'internal' | 'confidential' | 'restricted';
        tags: string[];
        businessTerms: string[];
        technicalTerms: string[];
        lastUpdated: Date;
    };
    qualityMetrics: {
        completeness: number;
        accuracy: number;
        consistency: number;
        timeliness: number;
        usage: number;
        trust: number;
    };
}
declare class BusinessIntelligenceAggregator {
    private database;
    private logger;
    private redis;
    private monitoring;
    private cubeCache;
    private aggregationCache;
    private etlProcesses;
    private readonly MAX_CACHE_SIZE;
    private readonly CACHE_TTL_MS;
    private readonly REDIS_CACHE_TTL;
    private cleanupInterval;
    constructor();
    private startCacheCleanup;
    private cleanupExpiredCache;
    private generateCacheKey;
    private getCachedAggregation;
    private cacheAggregationResult;
    private getCachedAggregationLocal;
    private cleanup;
    private initializeDataCubes;
    private initializeETLProcesses;
    aggregateData(dimensions: string[], measures: string[], timeGranularity: string, dateRange: {
        startDate: Date;
        endDate: Date;
    }, filters?: Record<string, unknown>, includeComparisons?: boolean): Promise<AggregatedData>;
    private isCriticalOperation;
    private performAggregation;
    private executeAggregationQuery;
    private buildOptimizedAggregationQuery;
    private getTimeFormatSQL;
    private groupDataByDimensions;
    private generateDimensionKey;
    private parseDimensionKey;
    private formatTimeByGranularity;
    private buildFilters;
    private getQueryParameters;
    private calculateSummaryStatistics;
    private generateComparisons;
    private calculateMeasureTotal;
    private generateDataInsights;
    private calculateTrend;
    private detectAnomalies;
    private calculateCorrelations;
    private pearsonCorrelation;
    processETL(operation: string, sourceType: string, processingMode?: string): Promise<ETLProcess>;
    analyzeDataLineage(entityId: string, entityType: string): Promise<DataLineage>;
    getDataCube(cubeId: string): DataCube | null;
    listDataCubes(): DataCube[];
    getETLStatus(processId?: string): ETLProcess[];
}
declare const businessIntelligenceAggregator: BusinessIntelligenceAggregator;
export declare const businessIntelligenceHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export { BusinessIntelligenceAggregator, businessIntelligenceAggregator };
//# sourceMappingURL=business-intelligence-aggregator.d.ts.map