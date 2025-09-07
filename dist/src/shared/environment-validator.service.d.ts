export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: {
        totalChecks: number;
        passedChecks: number;
        criticalErrors: number;
        warnings: number;
        environment: string;
    };
}
export interface ValidationError {
    category: string;
    field: string;
    message: string;
    severity: 'critical' | 'high' | 'medium';
    suggestion?: string;
}
export interface ValidationWarning {
    category: string;
    field: string;
    message: string;
    suggestion?: string;
}
export declare enum ValidationCategory {
    DATABASE = "database",
    REDIS = "redis",
    JWT = "jwt",
    SECURITY = "security",
    PAYMENT = "payment",
    AWS = "aws",
    EXTERNAL_SERVICES = "external_services",
    MONITORING = "monitoring",
    GENERAL = "general"
}
export declare class EnvironmentValidatorService {
    private static instance;
    private errors;
    private warnings;
    private checkCount;
    private passedChecks;
    private constructor();
    static getInstance(): EnvironmentValidatorService;
    validateEnvironment(): ValidationResult;
    validateProduction(): ValidationResult;
    validateDevelopment(): ValidationResult;
    private reset;
    private addError;
    private addWarning;
    private addSuccess;
    private validateDatabase;
    private validateRedis;
    private validateJWT;
    private validateSecurity;
    private validatePayment;
    private validateAWS;
    private validateExternalServices;
    private validateMonitoring;
    private validateGeneral;
    private validateProductionSecurity;
    private validateProductionDatabase;
    private validateProductionMonitoring;
    private validateProductionAWS;
    private validateDevelopmentDatabase;
    private validateDevelopmentSecurity;
    private buildValidationResult;
    private logValidationResult;
    getValidationSummary(): {
        isHealthy: boolean;
        lastValidation: Date;
        summary: any;
    };
    validateCategory(category: ValidationCategory): ValidationResult;
    getValidationCategories(): ValidationCategory[];
    isProductionReady(): {
        ready: boolean;
        blockers: ValidationError[];
        warnings: ValidationWarning[];
    };
}
export declare const environmentValidator: EnvironmentValidatorService;
//# sourceMappingURL=environment-validator.service.d.ts.map