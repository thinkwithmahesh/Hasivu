export declare class EncryptionManager {
    constructor();
    initialize(): Promise<void>;
    encrypt(data: any, context?: any): Promise<{
        encryptedData: any;
        keyId: string;
        algorithm: string;
    }>;
    decrypt(encryptedData: any, keyId?: string): Promise<any>;
    validateDecryption(data: any, keyId: string): Promise<boolean>;
    rotateKeys(): Promise<void>;
    getKeyStatus(): Promise<any>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default EncryptionManager;
//# sourceMappingURL=encryption-manager.d.ts.map