export interface EncryptionResult {
    encrypted: string;
    iv: string;
    authTag: string;
    algorithm: string;
}
export interface KeyPair {
    publicKey: string;
    privateKey: string;
    algorithm: string;
}
export interface HashOptions {
    saltRounds?: number;
    algorithm?: 'bcrypt' | 'argon2' | 'sha256' | 'sha512';
}
export interface SignatureResult {
    signature: string;
    algorithm: string;
    publicKey: string;
}
export declare class CryptoService {
    private static instance;
    private initialized;
    private readonly defaultAlgorithm;
    private readonly keyLength;
    private readonly ivLength;
    private readonly saltRounds;
    private encryptionKey;
    constructor();
    static getInstance(): CryptoService;
    initialize(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    cleanup(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    hashPassword(password: string, options?: HashOptions): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    verifyPassword(password: string, hash: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    generateSalt(length?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    encrypt(data: any, keyVersion?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        sensitive?: string;
    }>;
    decrypt(encryptedData: string | EncryptionResult | any, key?: string, iv?: string, authTag?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        sensitive?: string;
    }>;
    generateKeyPair(keySize?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    signData(data: string, privateKey: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    verifySignature(data: string, signature: string, publicKey: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    generateSecureToken(length?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    generateHMAC(data: string, secret: string, algorithm?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    rotateEncryptionKeys(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
        newKeyVersion?: string;
        oldKeyVersion?: string;
    }>;
    generateSecureRandom(length?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    hash(data: string, algorithm?: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    deriveKey(password: string, salt: string, iterations?: number, keyLength?: number): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    private testCryptoFunctions;
}
export declare const cryptoService: CryptoService;
export default CryptoService;
//# sourceMappingURL=crypto.service.d.ts.map