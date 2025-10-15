import { UserPermission, RoleDefinition, AccessAuditLog } from '../../types/data-lake-types';
export interface AccessRequest {
    userId: string;
    resource: string;
    action: 'read' | 'write' | 'delete' | 'admin';
    context?: Record<string, any>;
    timestamp: Date;
}
export interface AccessDecision {
    granted: boolean;
    reason: string;
    conditions?: string[];
    expires?: Date;
}
export interface AccessPolicy {
    id: string;
    name: string;
    description: string;
    rules: AccessRule[];
    priority: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AccessRule {
    id: string;
    effect: 'allow' | 'deny';
    subjects: string[];
    resources: string[];
    actions: string[];
    conditions?: AccessCondition[];
}
export interface AccessCondition {
    type: 'time' | 'ip' | 'location' | 'attribute';
    operator: 'equals' | 'contains' | 'in' | 'between';
    value: any;
}
export interface AccessSession {
    sessionId: string;
    userId: string;
    roles: string[];
    permissions: UserPermission[];
    createdAt: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AccessControlManager {
    private policies;
    private roles;
    private userPermissions;
    private activeSessions;
    private auditLog;
    private config;
    constructor(config?: any);
    initialize(): Promise<void>;
    private startSessionCleanup;
    authenticateUser(userId: string, credentials: any, context?: Record<string, any>): Promise<AccessSession>;
    checkAccess(sessionId: string, request: AccessRequest): Promise<AccessDecision>;
    validateAccess(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean>;
    createRole(role: RoleDefinition): Promise<void>;
    updateRole(roleId: string, updates: Partial<RoleDefinition>): Promise<void>;
    deleteRole(roleId: string): Promise<void>;
    assignRole(userId: string, roleId: string, resource?: string): Promise<void>;
    revokeRole(userId: string, roleId: string, resource?: string): Promise<void>;
    createPolicy(policy: Omit<AccessPolicy, 'createdAt' | 'updatedAt'>): Promise<void>;
    getAuditLog(filters?: {
        userId?: string;
        resource?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<AccessAuditLog[]>;
    revokeSession(sessionId: string): Promise<void>;
    private validateCredentials;
    private getUserRoles;
    private getUserPermissions;
    private validateSession;
    private evaluateAccess;
    private checkDirectPermission;
    private getApplicablePolicies;
    private ruleApplies;
    private evaluatePolicy;
    private matchesResource;
    private evaluateCondition;
    private evaluateTimeCondition;
    private evaluateIpCondition;
    private generateSessionId;
    private logAuditEvent;
    private initializeDefaultRoles;
    private initializeDefaultPolicies;
    shutdown(): Promise<void>;
}
export default AccessControlManager;
//# sourceMappingURL=access-control-manager.d.ts.map