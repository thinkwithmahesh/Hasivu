export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitizedValue?: any;
    warnings?: string[];
}
export interface FieldValidationRule {
    type: 'string' | 'number' | 'email' | 'phone' | 'url' | 'uuid' | 'date' | 'boolean' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    customValidator?: (value: any) => boolean | string;
    sanitize?: boolean;
}
export interface ValidationSchema {
    [fieldName: string]: FieldValidationRule;
}
export declare class ValidationService {
    private static instance;
    static getInstance(): ValidationService;
    validateField(fieldName: string, value: any, rules: FieldValidationRule): ValidationResult;
    validateObject(data: any, schema: ValidationSchema): ValidationResult;
    checkSecurity(fieldName: string, value: any): ValidationResult;
    sanitizeString(input: string): string;
    sanitizeHtml(html: string): string;
    sanitizeSqlInput(input: string): string;
    private isNumeric;
    private hasSuspiciousEncoding;
    isValidEmail(email: string): boolean;
    isValidPhone(phone: string): boolean;
    isValidUUID(uuid: string): boolean;
    isValidUrl(url: string): boolean;
    isStrongPassword(password: string): ValidationResult;
    validateRegistration(data: any): ValidationResult;
    sanitizePayload(payload: any): any;
    validateProfileUpdate(data: any): ValidationResult;
}
export declare const validationService: ValidationService;
//# sourceMappingURL=validation.service.d.ts.map