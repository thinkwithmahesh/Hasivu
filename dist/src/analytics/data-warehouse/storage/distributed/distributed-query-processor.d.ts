import { StorageQuery, QueryResult } from '../../types/storage-types';
export declare class DistributedQueryProcessor {
    private nodes;
    private queryPlanner;
    private resultAggregator;
    constructor();
    initialize(): Promise<void>;
    executeQuery(query: StorageQuery): Promise<QueryResult>;
    getHealth(): Promise<any>;
    private discoverNodes;
    private establishConnections;
    private executeAcrossNodes;
    private executeOnNode;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    cancelQuery(queryId: string): Promise<void>;
}
export default DistributedQueryProcessor;
//# sourceMappingURL=distributed-query-processor.d.ts.map