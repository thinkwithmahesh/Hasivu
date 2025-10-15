export declare class AccessControlEngine {
    constructor();
    initialize(): Promise<void>;
    checkPermission(userId: string, resource: string, action: string): Promise<boolean>;
    grantPermission(userId: string, resource: string, permissions: string[]): Promise<void>;
    revokePermission(userId: string, resource: string, permissions: string[]): Promise<void>;
    createRole(roleName: string, permissions: string[]): Promise<void>;
    assignRole(userId: string, roleName: string): Promise<void>;
    getUserPermissions(userId: string): Promise<{
        userId: string;
        permissions: string[];
        roles: string[];
    }>;
    validateAccess(userId: string, resource: string, action: string): Promise<{
        authorized: boolean;
        reason?: string;
    }>;
    validateDecryption(userId: string, tenantId?: string, keyId?: string): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: string;
        version: string;
        lastUpdate: Date;
        performance: {
            avgCheckTime: number;
            permissionsChecked: number;
            rolesLoaded: number;
        };
        components: Record<string, string>;
        metrics: Record<string, string>;
    }>;
    shutdown(): Promise<void>;
}
export default AccessControlEngine;
//# sourceMappingURL=access-control-engine.d.ts.map