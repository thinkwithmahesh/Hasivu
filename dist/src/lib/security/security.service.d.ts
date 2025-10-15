import { JwtPayload } from 'jsonwebtoken';
export declare class SecurityService {
    validateCSRFToken(_token: string): Promise<boolean>;
    sanitizeInput(_input: any): any;
    detectSQLInjection(_input: string): boolean;
    validateJWTToken(_token: string): Promise<{
        valid: boolean;
        payload?: JwtPayload;
    }>;
}
//# sourceMappingURL=security.service.d.ts.map