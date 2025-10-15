import { User } from '@prisma/client';
export interface UserFilters {
    role?: string;
    schoolId?: string;
    search?: string;
    isActive?: boolean;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId?: string;
    phoneNumber?: string;
}
export interface UpdateUserRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    isActive?: boolean;
    schoolId?: string;
}
export interface UserSearchFilters {
    email?: string;
    role?: string;
    schoolId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}
export interface UserWithChildren extends User {
    children?: User[];
}
export declare class UserService {
    private static instance;
    private prisma;
    constructor();
    static getInstance(): UserService;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(filters?: UserFilters): Promise<User[]>;
    findBySchool(schoolId: string): Promise<User[]>;
    findByRole(role: string): Promise<User[]>;
    create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<User>;
    bulkCreate(users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number>;
    getChildren(parentId: string): Promise<User[]>;
    addChild(parentId: string, childId: string): Promise<User>;
    removeChild(childId: string): Promise<User>;
    getUserById(userId: string): Promise<User>;
    searchUsers(filters: UserSearchFilters): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
    }>;
    bulkImportUsers(users: CreateUserRequest[]): Promise<{
        success: User[];
        failed: Array<{
            userData: CreateUserRequest;
            error: string;
        }>;
    }>;
    updateUser(userId: string, data: UpdateUserRequest): Promise<User>;
    updateChildrenAssociations(parentId: string, childIds: string[]): Promise<{
        success: boolean;
    }>;
    getUserAuditLogs(_userId: string): Promise<any[]>;
    createUser(data: CreateUserRequest): Promise<User>;
    static getUserById(userId: string): Promise<User>;
    static searchUsers(filters: UserSearchFilters): Promise<{
        users: User[];
        total: number;
        page: number;
        limit: number;
    }>;
    static bulkImportUsers(users: CreateUserRequest[]): Promise<{
        success: User[];
        failed: Array<{
            userData: CreateUserRequest;
            error: string;
        }>;
    }>;
    static updateUser(userId: string, data: UpdateUserRequest): Promise<User>;
    static updateChildrenAssociations(parentId: string, childIds: string[]): Promise<{
        success: boolean;
    }>;
    static getUserAuditLogs(userId: string): Promise<any[]>;
    static createUser(data: CreateUserRequest): Promise<User>;
    createSchool(data: any): Promise<any>;
    static createSchool(data: any): Promise<any>;
}
export declare const userService: UserService;
export default UserService;
//# sourceMappingURL=user.service.d.ts.map