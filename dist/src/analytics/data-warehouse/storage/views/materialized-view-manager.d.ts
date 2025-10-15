import { MaterializedViewConfig, StorageQuery } from '../../types/storage-types';
export declare class MaterializedViewManager {
    private config;
    private views;
    private refreshQueue;
    private dependencies;
    private isRunning;
    constructor(config: MaterializedViewConfig);
    initialize(): Promise<void>;
    createView(definition: MaterializedViewDefinition): Promise<string>;
    refreshView(viewId: string, force?: boolean): Promise<void>;
    dropView(viewId: string): Promise<void>;
    queryView(viewId: string, query?: StorageQuery): Promise<any[]>;
    getViewStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    private loadExistingViews;
    private startRefreshEngine;
    private validateViewDefinition;
    private buildView;
    private processRefreshQueue;
    private executeRefreshTask;
    private scheduleRefresh;
    private scheduleAutomaticRefreshes;
    private removeViewData;
    private generateMockViewData;
    private applyFilters;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    getHitRate(): number;
    private calculateAverageSpeedup;
    private calculateHitRate;
    getAllViews(): Promise<any[]>;
}
interface MaterializedViewDefinition {
    name: string;
    query: StorageQuery;
    tenantId: string;
    refreshInterval?: number;
    incremental?: boolean;
    partitionBy?: string;
    dependencies?: string[];
}
export default MaterializedViewManager;
//# sourceMappingURL=materialized-view-manager.d.ts.map