import { ZodSchema } from 'zod';
export interface ValidationResult<T = any> {
    success: boolean;
    data?: T;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
export declare class ValidationService {
    private static instance;
    private constructor();
    static getInstance(): ValidationService;
    validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>;
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
    validateUUID(uuid: string): boolean;
    validateDate(date: string): boolean;
    validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationResult;
    sanitizeString(input: string): string;
    validatePassword(password: string): ValidationResult;
    validateRange(value: number, min: number, max: number): boolean;
    sanitizePayload(payload: any): any;
    static validateObject(schema: any, data: any): any;
}
export declare const validationService: ValidationService;
export default ValidationService;
//# sourceMappingURL=validation.service.d.ts.map