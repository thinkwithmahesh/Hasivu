import { TenantIsolationConfig, StorageQuery, QueryResult } from '../../types/storage-types';
export declare class TenantIsolationStorage {
    private config;
    private tenants;
    private isolationPolicies;
    private accessLog;
    constructor(config: TenantIsolationConfig);
    initialize(): Promise<void>;
    createTenant(tenantConfig: TenantConfig): Promise<string>;
    executeTenantQuery(tenantId: string, query: StorageQuery): Promise<QueryResult>;
    getTenantData(tenantId: string, dataType?: string): Promise<any[]>;
    validateTenantIsolation(tenantId: string): Promise<IsolationValidationResult>;
    getTenantStatistics(tenantId?: string): Promise<any>;
    getHealth(): Promise<any>;
    private loadTenantConfigurations;
    private setupIsolationPolicies;
    private startAccessMonitoring;
    private validateTenantConfig;
    private createTenantIsolation;
    private createIsolationPolicy;
    private generateIsolationRules;
    private getAccessControlsForStrategy;
    private validateTenantAccess;
    private applyTenantIsolation;
    private addRowLevelSecurity;
    private executeIsolatedQuery;
    private generateTenantMockData;
    private filterDataByTenant;
    private updateTenantStatistics;
    private logAccess;
    private checkDataIsolation;
    private checkAccessIsolation;
    private checkResourceIsolation;
    private generateIsolationRecommendations;
    private checkAllTenantsIsolation;
    private cleanupAccessLogs;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
}
interface TenantConfig {
    id?: string;
    name: string;
    region?: string;
    storageQuota?: number;
    bandwidthQuota?: number;
    maxConnections?: number;
}
interface IsolationValidationResult {
    tenantId: string;
    strategy: string;
    isValid: boolean;
    violations: string[];
    recommendations: string[];
}
export default TenantIsolationStorage;
//# sourceMappingURL=tenant-isolation-storage.d.ts.map