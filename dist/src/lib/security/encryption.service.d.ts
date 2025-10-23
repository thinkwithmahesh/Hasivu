export interface EncryptionResult {
    encrypted: string;
    iv: string;
    keyVersion?: string;
}
export interface DecryptionResult {
    decrypted: string;
    success: boolean;
    error?: string;
}
export declare class EncryptionService {
    private static instance;
    private encryptionKey;
    private algorithm;
    private keyLength;
    private ivLength;
    constructor();
    static getInstance(): EncryptionService;
    encrypt(data: string, additionalData?: string): EncryptionResult;
    decrypt(encryptedData: string, iv: string, tag?: string, additionalData?: string): DecryptionResult;
    encryptObject(data: any, fields: string[]): any;
    decryptObject(data: any, fields: string[]): any;
    generateKey(): string;
    hash(data: string): string;
    hmac(data: string, key?: string): string;
    generateSecureToken(length?: number): string;
    validateKey(key: string): boolean;
    encryptSensitiveData(data: any, sensitiveFields: string[]): any;
    decryptSensitiveData(data: any, sensitiveFields: string[]): any;
}
export declare const encryptionService: EncryptionService;
//# sourceMappingURL=encryption.service.d.ts.map