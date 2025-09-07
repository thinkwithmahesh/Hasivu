import { User, Prisma } from '@prisma/client';
export interface UserSearchOptions {
    query?: string;
    schoolId?: string;
    role?: string;
    isActive?: boolean;
    parentId?: string;
    hasChildren?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface UserListResult {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface UserWithRelations extends User {
    school?: any;
    parent?: User;
    children?: User[];
}
export interface BulkCreateResult {
    success: boolean;
    created: User[];
    errors: {
        data: any;
        error: string;
    }[];
}
export interface UserAuditLogEntry {
    id: string;
    userId: string;
    action: string;
    performedBy: string;
    changes: Record<string, {
        from: any;
        to: any;
    }>;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface UserDependencyCheck {
    hasOrders: boolean;
    hasChildren: boolean;
    dependentCount: number;
}
export declare class UserRepository {
    private static prisma;
    private static redis;
    private static readonly CACHE_TTL;
    static findById(id: string, includeRelations?: boolean): Promise<UserWithRelations | null>;
    static findByEmail(email: string, includeRelations?: boolean): Promise<UserWithRelations | null>;
    static create(data: Prisma.UserCreateInput): Promise<UserWithRelations>;
    static update(id: string, data: Prisma.UserUpdateInput): Promise<UserWithRelations>;
    static findBySchool(schoolId: string, options?: {
        page?: number;
        limit?: number;
        role?: string;
        isActive?: boolean;
        includeRelations?: boolean;
    }): Promise<UserListResult>;
    static search(options: UserSearchOptions): Promise<UserListResult>;
    static softDelete(id: string): Promise<UserWithRelations>;
    static bulkCreate(usersData: Prisma.UserCreateInput[]): Promise<BulkCreateResult>;
    static getChildren(parentId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<UserListResult>;
    static updateChildrenAssociations(parentId: string, childrenIds: string[]): Promise<void>;
    static checkDependencies(userId: string): Promise<UserDependencyCheck>;
    static createAuditLog(log: Omit<UserAuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
    static getAuditLogs(userId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        logs: UserAuditLogEntry[];
        total: number;
        totalPages: number;
    }>;
    static findByRole(role: string, schoolId?: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<UserListResult>;
    static getUserStats(schoolId?: string): Promise<{
        total: number;
        byRole: Record<string, number>;
        active: number;
        inactive: number;
    }>;
    static clearUserCache(userId?: string, schoolId?: string): Promise<void>;
    static batchUpdate(updates: Array<{
        id: string;
        data: Prisma.UserUpdateInput;
    }>): Promise<{
        updated: number;
        errors: Array<{
            id: string;
            error: string;
        }>;
    }>;
}
//# sourceMappingURL=user.repository.d.ts.map