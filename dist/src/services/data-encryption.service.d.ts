export interface SensitiveDataConfig {
    table: string;
    fields: string[];
    encryptionKey?: string;
}
export declare class DataEncryptionService {
    private static instance;
    private sensitiveDataConfigs;
    constructor();
    static getInstance(): DataEncryptionService;
    addSensitiveDataConfig(config: SensitiveDataConfig): void;
    getSensitiveFields(table: string): string[];
    encryptForStorage(table: string, data: any): any;
    decryptFromStorage(table: string, data: any): any;
    private decryptSingleItem;
    encryptFields(data: any, fields: string[]): any;
    decryptFields(data: any, fields: string[]): any;
    hasSensitiveData(table: string): boolean;
    getAllConfigurations(): SensitiveDataConfig[];
    removeConfiguration(table: string): void;
    validateEncryptionSetup(): {
        isValid: boolean;
        issues: string[];
    };
    encryptPaymentData(paymentData: any): any;
    decryptPaymentData(paymentData: any): any;
    encryptPII(piiData: any): any;
    decryptPII(piiData: any): any;
}
export declare const dataEncryptionService: DataEncryptionService;
//# sourceMappingURL=data-encryption.service.d.ts.map