export declare class ColumnLevelSecurityManager {
    constructor();
    initialize(): Promise<void>;
    applyColumnSecurity(query: string, userId: string): Promise<string>;
    maskColumn(table: string, column: string, maskType: string): Promise<void>;
    grantColumnAccess(userId: string, table: string, columns: string[]): Promise<void>;
    revokeColumnAccess(userId: string, table: string, columns: string[]): Promise<void>;
    getFilters(userId: string, tenantId?: string, resource?: string): Promise<any[]>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default ColumnLevelSecurityManager;
//# sourceMappingURL=column-level-security-manager.d.ts.map