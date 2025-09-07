import * as Joi from 'joi';
export declare class ValidationError extends Error {
    details: any[];
    constructor(message: string, details?: any[]);
}
export declare const ValidationSchemas: {
    userRegistration: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    profileUpdate: Joi.ObjectSchema<any>;
    passwordChange: Joi.ObjectSchema<any>;
    rfidCard: Joi.ObjectSchema<any>;
    paymentOrder: Joi.ObjectSchema<any>;
    notification: Joi.ObjectSchema<any>;
};
export declare class ValidationService {
    private static instance;
    private constructor();
    static getInstance(): ValidationService;
    validate<T>(schema: Joi.ObjectSchema<T>, data: any): Promise<T>;
    validateRegistration(data: any): Promise<any>;
    validateLogin(data: any): Promise<any>;
    validateProfileUpdate(data: any): Promise<any>;
    validatePasswordChange(data: any): Promise<any>;
    validateRfidCard(data: any): Promise<any>;
    validatePaymentOrder(data: any): Promise<any>;
    validateNotification(data: any): Promise<any>;
    validateUUID(value: string, fieldName?: string): boolean;
    validateEmail(value: string, fieldName?: string): boolean;
    validateRequired(value: any, fieldName: string): boolean;
    validateStringLength(value: string, min: number, max: number, fieldName: string): boolean;
    validateArray(value: any, fieldName: string, minLength?: number, maxLength?: number): boolean;
    static validateObject(data: any, schema: any): {
        isValid: boolean;
        errors?: string[];
    };
}
//# sourceMappingURL=validation.service.d.ts.map