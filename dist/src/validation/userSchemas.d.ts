import Joi from 'joi';
export declare const safeRegexValidator: (value: string, pattern: RegExp, helpers: any, timeout?: number) => any;
export declare const SAFE_PATTERNS: {
    uuid: RegExp;
    email: RegExp;
    phone: RegExp;
    name: RegExp;
    address: RegExp;
    schoolCode: RegExp;
    studentId: RegExp;
    rfidCard: RegExp;
    grade: RegExp;
    section: RegExp;
    pinCode: RegExp;
};
declare const UserRoles: readonly ["PARENT", "SCHOOL_ADMIN", "VENDOR", "STUDENT", "SYSTEM_ADMIN"];
declare const UserStatuses: readonly ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"];
declare const Languages: readonly ["en", "hi", "kn"];
export type UserRole = typeof UserRoles[number];
export type UserStatus = typeof UserStatuses[number];
export type Language = typeof Languages[number];
export declare const createUserSchema: Joi.ObjectSchema<any>;
export declare const updateUserSchema: Joi.ObjectSchema<any>;
export declare const userQuerySchema: Joi.ObjectSchema<any>;
export declare const userIdSchema: Joi.ObjectSchema<any>;
export declare const rfidAssociationSchema: Joi.ObjectSchema<any>;
export declare const bulkUserImportSchema: Joi.ObjectSchema<any>;
export declare const passwordResetSchema: Joi.ObjectSchema<any>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
export interface CreateUserRequest {
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status?: UserStatus;
    language?: Language;
    schoolCode?: string;
    studentId?: string;
    grade?: number;
    section?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        pinCode: string;
        country?: string;
    };
    preferences?: {
        notifications?: {
            email?: boolean;
            sms?: boolean;
            push?: boolean;
        };
        dietary?: {
            restrictions?: string[];
            preferences?: string[];
        };
        language?: Language;
        timezone?: string;
    };
}
export interface UpdateUserRequest extends Partial<CreateUserRequest> {
}
export interface UserQueryRequest {
    role?: UserRole;
    status?: UserStatus;
    schoolCode?: string;
    grade?: number;
    section?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
declare const _default: {
    createUserSchema: Joi.ObjectSchema<any>;
    updateUserSchema: Joi.ObjectSchema<any>;
    userQuerySchema: Joi.ObjectSchema<any>;
    userIdSchema: Joi.ObjectSchema<any>;
    rfidAssociationSchema: Joi.ObjectSchema<any>;
    bulkUserImportSchema: Joi.ObjectSchema<any>;
    passwordResetSchema: Joi.ObjectSchema<any>;
    changePasswordSchema: Joi.ObjectSchema<any>;
    SAFE_PATTERNS: {
        uuid: RegExp;
        email: RegExp;
        phone: RegExp;
        name: RegExp;
        address: RegExp;
        schoolCode: RegExp;
        studentId: RegExp;
        rfidCard: RegExp;
        grade: RegExp;
        section: RegExp;
        pinCode: RegExp;
    };
    safeRegexValidator: (value: string, pattern: RegExp, helpers: any, timeout?: number) => any;
    UserRoles: readonly ["PARENT", "SCHOOL_ADMIN", "VENDOR", "STUDENT", "SYSTEM_ADMIN"];
    UserStatuses: readonly ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"];
    Languages: readonly ["en", "hi", "kn"];
};
export default _default;
//# sourceMappingURL=userSchemas.d.ts.map