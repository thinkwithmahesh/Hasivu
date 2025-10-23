import { JwtPayload } from 'jsonwebtoken';
export declare class SecurityService {
    private csrfTokens;
    validateCSRFToken(token: string): Promise<boolean>;
    generateCSRFToken(): string;
    sanitizeInput(input: any): any;
    detectSQLInjection(input: string): boolean;
    validateJWTToken(token: string): Promise<{
        valid: boolean;
        payload?: JwtPayload;
    }>;
    generateSecureRandom(length?: number): string;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    encryptData(data: string): string;
    decryptData(encryptedData: string): string;
    generateHMAC(data: string, key?: string): string;
    verifyHMAC(data: string, hmac: string, key: string): boolean;
    detectXSS(input: string): boolean;
    cleanupExpiredTokens(): void;
}
//# sourceMappingURL=security.service.d.ts.map