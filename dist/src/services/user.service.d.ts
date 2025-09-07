import { User } from '@prisma/client';
export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    schoolId?: string;
    parentId?: string;
    childrenIds?: string[];
    isActive?: boolean;
    metadata?: Record<string, any>;
    preferences?: UserPreferences;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: UserRole;
    schoolId?: string;
    parentId?: string;
    childrenIds?: string[];
    isActive?: boolean;
    metadata?: Record<string, any>;
    preferences?: UserPreferences;
}
export interface UserSearchFilters {
    schoolId?: string;
    role?: UserRole;
    isActive?: boolean;
    parentId?: string;
    search?: string;
    query?: string;
    hasChildren?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface BulkImportResult {
    success: boolean;
    successCount: number;
    errorCount: number;
    users: User[];
    errors: ImportError[];
}
export interface ImportError {
    row: number;
    error: string;
    data: any;
}
export interface UserAuditLog {
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
export interface UserPreferences {
    language: 'en' | 'hi' | 'kn';
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        whatsapp: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
    timezone?: string;
}
export type UserRole = 'student' | 'parent' | 'teacher' | 'staff' | 'school_admin' | 'admin' | 'super_admin';
export declare class UserService {
    private static prisma;
    private static redis;
    static createUser(data: CreateUserRequest, createdBy: string): Promise<User>;
    static getUserById(id: string): Promise<User | null>;
    static getUserByEmail(email: string): Promise<User | null>;
    static updateUser(id: string, data: UpdateUserRequest, updatedBy: string): Promise<User>;
    static deleteUser(id: string, deletedBy: string): Promise<void>;
    static searchUsers(filters: UserSearchFilters): Promise<UserListResponse>;
    static bulkImportUsers(csvData: string, importedBy: string, schoolId?: string): Promise<BulkImportResult>;
    static updateChildrenAssociations(parentId: string, childrenIds: string[], updatedBy: string): Promise<void>;
    static getUserAuditLogs(userId: string, limit?: number): Promise<UserAuditLog[]>;
    private static validateUserData;
    private static validateUserUpdateData;
    private static validateSchoolAccess;
    private static validateParentChildRelationship;
    private static validateUpdatePermissions;
    private static validateDeletePermissions;
    private static checkUserDependencies;
    private static createAuditLog;
    private static calculateChanges;
    private static parseCsvData;
    private static validateBulkImportRow;
    private static cacheUser;
    private static getCachedUser;
    private static removeCachedUser;
}
//# sourceMappingURL=user.service.d.ts.map