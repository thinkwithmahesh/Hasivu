"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataEncryptionService = exports.DataEncryptionService = void 0;
const encryption_service_1 = require("../lib/security/encryption.service");
const logger_service_1 = require("../shared/logger.service");
class DataEncryptionService {
    static instance;
    sensitiveDataConfigs = [];
    constructor() {
        this.sensitiveDataConfigs = [
            {
                table: 'user',
                fields: ['phone', 'emergencyContact', 'address'],
            },
            {
                table: 'payment',
                fields: ['cardNumber', 'cvv', 'cardHolderName'],
            },
            {
                table: 'student',
                fields: ['medicalInfo', 'allergies', 'emergencyContact'],
            },
            {
                table: 'parent',
                fields: ['phone', 'emergencyContact', 'address'],
            },
        ];
    }
    static getInstance() {
        if (!DataEncryptionService.instance) {
            DataEncryptionService.instance = new DataEncryptionService();
        }
        return DataEncryptionService.instance;
    }
    addSensitiveDataConfig(config) {
        this.sensitiveDataConfigs = this.sensitiveDataConfigs.filter(c => c.table !== config.table);
        this.sensitiveDataConfigs.push(config);
    }
    getSensitiveFields(table) {
        const config = this.sensitiveDataConfigs.find(c => c.table === table);
        return config?.fields || [];
    }
    encryptForStorage(table, data) {
        try {
            const sensitiveFields = this.getSensitiveFields(table);
            if (sensitiveFields.length === 0) {
                return data;
            }
            const encryptedData = { ...data };
            const fieldsToEncrypt = sensitiveFields.filter(field => encryptedData[field] !== undefined);
            if (fieldsToEncrypt.length > 0) {
                const result = encryption_service_1.encryptionService.encryptSensitiveData(encryptedData, fieldsToEncrypt);
                logger_service_1.logger.debug(`Encrypted ${fieldsToEncrypt.length} sensitive fields for table ${table}`, {
                    fields: fieldsToEncrypt,
                });
                return result;
            }
            return encryptedData;
        }
        catch (error) {
            logger_service_1.logger.error('Failed to encrypt data for storage', undefined, {
                table,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Data encryption failed');
        }
    }
    decryptFromStorage(table, data) {
        try {
            const sensitiveFields = this.getSensitiveFields(table);
            if (sensitiveFields.length === 0) {
                return data;
            }
            if (Array.isArray(data)) {
                return data.map(item => this.decryptSingleItem(table, item));
            }
            return this.decryptSingleItem(table, data);
        }
        catch (error) {
            logger_service_1.logger.error('Failed to decrypt data from storage', undefined, {
                table,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return data;
        }
    }
    decryptSingleItem(table, item) {
        const sensitiveFields = this.getSensitiveFields(table);
        const fieldsToDecrypt = sensitiveFields.filter(field => item[field] !== undefined);
        if (fieldsToDecrypt.length > 0) {
            const result = encryption_service_1.encryptionService.decryptSensitiveData(item, fieldsToDecrypt);
            logger_service_1.logger.debug(`Decrypted ${fieldsToDecrypt.length} sensitive fields for table ${table}`, {
                fields: fieldsToDecrypt,
            });
            return result;
        }
        return item;
    }
    encryptFields(data, fields) {
        try {
            return encryption_service_1.encryptionService.encryptSensitiveData(data, fields);
        }
        catch (error) {
            logger_service_1.logger.error('Failed to encrypt specific fields', undefined, {
                fields,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Field encryption failed');
        }
    }
    decryptFields(data, fields) {
        try {
            return encryption_service_1.encryptionService.decryptSensitiveData(data, fields);
        }
        catch (error) {
            logger_service_1.logger.error('Failed to decrypt specific fields', undefined, {
                fields,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return data;
        }
    }
    hasSensitiveData(table) {
        return this.getSensitiveFields(table).length > 0;
    }
    getAllConfigurations() {
        return [...this.sensitiveDataConfigs];
    }
    removeConfiguration(table) {
        this.sensitiveDataConfigs = this.sensitiveDataConfigs.filter(c => c.table !== table);
    }
    validateEncryptionSetup() {
        const issues = [];
        try {
            const testData = { test: 'sensitive data' };
            const encrypted = encryption_service_1.encryptionService.encryptSensitiveData(testData, ['test']);
            const decrypted = encryption_service_1.encryptionService.decryptSensitiveData(encrypted, ['test']);
            if (decrypted.test !== 'sensitive data') {
                issues.push('Encryption/decryption test failed');
            }
        }
        catch (error) {
            issues.push(`Encryption test error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            isValid: issues.length === 0,
            issues,
        };
    }
    encryptPaymentData(paymentData) {
        const paymentFields = ['cardNumber', 'cvv', 'cardHolderName', 'expiryDate'];
        return this.encryptFields(paymentData, paymentFields);
    }
    decryptPaymentData(paymentData) {
        const paymentFields = ['cardNumber', 'cvv', 'cardHolderName', 'expiryDate'];
        return this.decryptFields(paymentData, paymentFields);
    }
    encryptPII(piiData) {
        const piiFields = ['ssn', 'phone', 'email', 'address', 'emergencyContact', 'medicalInfo'];
        return this.encryptFields(piiData, piiFields);
    }
    decryptPII(piiData) {
        const piiFields = ['ssn', 'phone', 'email', 'address', 'emergencyContact', 'medicalInfo'];
        return this.decryptFields(piiData, piiFields);
    }
}
exports.DataEncryptionService = DataEncryptionService;
exports.dataEncryptionService = DataEncryptionService.getInstance();
//# sourceMappingURL=data-encryption.service.js.map