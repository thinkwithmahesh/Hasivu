/**
 * HASIVU Platform - Data Encryption Service
 * Handles encryption/decryption of sensitive data in database operations
 */
import { encryptionService } from '../lib/security/encryption.service';
import { logger } from '../shared/logger.service';

export interface SensitiveDataConfig {
  table: string;
  fields: string[];
  encryptionKey?: string;
}

export class DataEncryptionService {
  private static instance: DataEncryptionService;
  private sensitiveDataConfigs: SensitiveDataConfig[] = [];

  constructor() {
    // Default sensitive data configurations
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

  public static getInstance(): DataEncryptionService {
    if (!DataEncryptionService.instance) {
      DataEncryptionService.instance = new DataEncryptionService();
    }
    return DataEncryptionService.instance;
  }

  /**
   * Add sensitive data configuration
   */
  public addSensitiveDataConfig(config: SensitiveDataConfig): void {
    // Remove existing config for the same table
    this.sensitiveDataConfigs = this.sensitiveDataConfigs.filter(c => c.table !== config.table);
    this.sensitiveDataConfigs.push(config);
  }

  /**
   * Get sensitive fields for a table
   */
  public getSensitiveFields(table: string): string[] {
    const config = this.sensitiveDataConfigs.find(c => c.table === table);
    return config?.fields || [];
  }

  /**
   * Encrypt data before database insertion
   */
  public encryptForStorage(table: string, data: any): any {
    try {
      const sensitiveFields = this.getSensitiveFields(table);

      if (sensitiveFields.length === 0) {
        return data;
      }

      const encryptedData = { ...data };
      const fieldsToEncrypt = sensitiveFields.filter(field => encryptedData[field] !== undefined);

      if (fieldsToEncrypt.length > 0) {
        const result = encryptionService.encryptSensitiveData(encryptedData, fieldsToEncrypt);

        logger.debug(`Encrypted ${fieldsToEncrypt.length} sensitive fields for table ${table}`, {
          fields: fieldsToEncrypt,
        });

        return result;
      }

      return encryptedData;
    } catch (error: unknown) {
      logger.error('Failed to encrypt data for storage', undefined, {
        table,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt data after database retrieval
   */
  public decryptFromStorage(table: string, data: any): any {
    try {
      const sensitiveFields = this.getSensitiveFields(table);

      if (sensitiveFields.length === 0) {
        return data;
      }

      // Handle both single objects and arrays
      if (Array.isArray(data)) {
        return data.map(item => this.decryptSingleItem(table, item));
      }

      return this.decryptSingleItem(table, data);
    } catch (error: unknown) {
      logger.error('Failed to decrypt data from storage', undefined, {
        table,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Return data as-is if decryption fails to avoid breaking the application
      return data;
    }
  }

  /**
   * Decrypt a single data item
   */
  private decryptSingleItem(table: string, item: any): any {
    const sensitiveFields = this.getSensitiveFields(table);
    const fieldsToDecrypt = sensitiveFields.filter(field => item[field] !== undefined);

    if (fieldsToDecrypt.length > 0) {
      const result = encryptionService.decryptSensitiveData(item, fieldsToDecrypt);

      logger.debug(`Decrypted ${fieldsToDecrypt.length} sensitive fields for table ${table}`, {
        fields: fieldsToDecrypt,
      });

      return result;
    }

    return item;
  }

  /**
   * Encrypt specific fields in an object
   */
  public encryptFields(data: any, fields: string[]): any {
    try {
      return encryptionService.encryptSensitiveData(data, fields);
    } catch (error: unknown) {
      logger.error('Failed to encrypt specific fields', undefined, {
        fields,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Field encryption failed');
    }
  }

  /**
   * Decrypt specific fields in an object
   */
  public decryptFields(data: any, fields: string[]): any {
    try {
      return encryptionService.decryptSensitiveData(data, fields);
    } catch (error: unknown) {
      logger.error('Failed to decrypt specific fields', undefined, {
        fields,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Return data as-is if decryption fails
      return data;
    }
  }

  /**
   * Check if a table has sensitive data
   */
  public hasSensitiveData(table: string): boolean {
    return this.getSensitiveFields(table).length > 0;
  }

  /**
   * Get all sensitive data configurations
   */
  public getAllConfigurations(): SensitiveDataConfig[] {
    return [...this.sensitiveDataConfigs];
  }

  /**
   * Remove sensitive data configuration
   */
  public removeConfiguration(table: string): void {
    this.sensitiveDataConfigs = this.sensitiveDataConfigs.filter(c => c.table !== table);
  }

  /**
   * Validate encryption setup
   */
  public validateEncryptionSetup(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    try {
      // Test encryption/decryption
      const testData = { test: 'sensitive data' };
      const encrypted = encryptionService.encryptSensitiveData(testData, ['test']);
      const decrypted = encryptionService.decryptSensitiveData(encrypted, ['test']);

      if (decrypted.test !== 'sensitive data') {
        issues.push('Encryption/decryption test failed');
      }
    } catch (error) {
      issues.push(
        `Encryption test error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Encrypt payment data specifically
   */
  public encryptPaymentData(paymentData: any): any {
    const paymentFields = ['cardNumber', 'cvv', 'cardHolderName', 'expiryDate'];
    return this.encryptFields(paymentData, paymentFields);
  }

  /**
   * Decrypt payment data specifically
   */
  public decryptPaymentData(paymentData: any): any {
    const paymentFields = ['cardNumber', 'cvv', 'cardHolderName', 'expiryDate'];
    return this.decryptFields(paymentData, paymentFields);
  }

  /**
   * Encrypt personal identifiable information (PII)
   */
  public encryptPII(piiData: any): any {
    const piiFields = ['ssn', 'phone', 'email', 'address', 'emergencyContact', 'medicalInfo'];
    return this.encryptFields(piiData, piiFields);
  }

  /**
   * Decrypt personal identifiable information (PII)
   */
  public decryptPII(piiData: any): any {
    const piiFields = ['ssn', 'phone', 'email', 'address', 'emergencyContact', 'medicalInfo'];
    return this.decryptFields(piiData, piiFields);
  }
}

// Export singleton instance
export const dataEncryptionService = DataEncryptionService.getInstance();
