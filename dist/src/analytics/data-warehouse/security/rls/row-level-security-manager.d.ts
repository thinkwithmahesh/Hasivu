export declare class RowLevelSecurityManager {
    constructor();
    initialize(): Promise<void>;
    applyRowLevelSecurity(query: string, userId: string): Promise<string>;
    createPolicy(name: string, table: string, _condition: string): Promise<void>;
    enablePolicy(policyName: string): Promise<void>;
    disablePolicy(policyName: string): Promise<void>;
    getFilters(userId: string, tenantId?: string, resource?: string): Promise<any[]>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default RowLevelSecurityManager;
//# sourceMappingURL=row-level-security-manager.d.ts.map