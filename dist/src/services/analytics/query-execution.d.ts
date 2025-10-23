export interface QueryOptions {
    select?: Record<string, unknown>;
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    take?: number;
    skip?: number;
}
export interface AggregationOptions {
    _count?: boolean | Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    where?: Record<string, unknown>;
}
export declare class QueryExecutionService {
    static executeQuery(query: unknown): Promise<{
        success: boolean;
        data?: unknown[];
        error?: {
            message: string;
            code: string;
        };
    }>;
    static calculatePeriodRange(period: string): {
        start: Date;
        end: Date;
    };
    executeQuery(model: string, options: QueryOptions): Promise<unknown[]>;
    executeAggregation(model: string, aggregations: AggregationOptions): Promise<unknown>;
    executeGroupBy(model: string, options: {
        by: string[];
        where?: Record<string, unknown>;
        _count?: boolean | Record<string, boolean>;
        _avg?: Record<string, boolean>;
        _sum?: Record<string, boolean>;
        _min?: Record<string, boolean>;
        _max?: Record<string, boolean>;
    }): Promise<unknown[]>;
    executeCount(model: string, where?: Record<string, unknown>): Promise<number>;
    executeRawQuery(query: string, params?: unknown[]): Promise<unknown[]>;
    executeTransaction(operations: Array<() => unknown>): Promise<unknown[]>;
}
export declare const queryExecutionService: QueryExecutionService;
//# sourceMappingURL=query-execution.d.ts.map