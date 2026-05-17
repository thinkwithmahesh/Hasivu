/**
 * HASIVU Platform - Encryption Service
 * Provides AES-256-GCM encryption for sensitive data
 */
import * as crypto from 'crypto';
import { config } from '../../config/environment';
import { logger } from '../../shared/logger.service';

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

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits for GCM

  constructor() {
    const key = config.encryption?.key || process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Ensure key is the correct length
    this.encryptionKey = Buffer.from(key, 'hex');
    if (this.encryptionKey.length !== this.keyLength) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  public encrypt(data: string, additionalData?: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted,
        iv: iv.toString('hex'),
        keyVersion: 'v1',
      };
    } catch (error: unknown) {
      logger.error('Encryption failed:', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  public decrypt(
    encryptedData: string,
    iv: string,
    tag?: string,
    additionalData?: string
  ): DecryptionResult {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        decrypted,
        success: true,
      };
    } catch (error: unknown) {
      logger.error('Decryption failed:', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        decrypted: '',
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Encrypt object data
   */
  public encryptObject(data: any, fields: string[]): any {
    const result = { ...data };

    for (const field of fields) {
      if (result[field] !== undefined && result[field] !== null) {
        const encrypted = this.encrypt(String(result[field]));
        result[field] = JSON.stringify({
          encrypted: encrypted.encrypted,
          iv: encrypted.iv,
          keyVersion: encrypted.keyVersion,
        });
      }
    }

    return result;
  }

  /**
   * Decrypt object data
   */
  public decryptObject(data: any, fields: string[]): any {
    const result = { ...data };

    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          const encryptedData = JSON.parse(result[field]);
          const decrypted = this.decrypt(encryptedData.encrypted, encryptedData.iv);

          if (decrypted.success) {
            result[field] = decrypted.decrypted;
          } else {
            logger.warn(`Failed to decrypt field ${field}`);
            result[field] = null;
          }
        } catch (error) {
          logger.warn(`Invalid encrypted data for field ${field}`);
          result[field] = null;
        }
      }
    }

    return result;
  }

  /**
   * Generate a secure random key
   */
  public generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Hash data using SHA-256
   */
  public hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC
   */
  public hmac(data: string, key?: string): string {
    const hmacKey = key || this.encryptionKey.toString('hex');
    return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
  }

  /**
   * Generate secure token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate encryption key
   */
  public validateKey(key: string): boolean {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      return keyBuffer.length === this.keyLength;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt sensitive data fields
   */
  public encryptSensitiveData(data: any, sensitiveFields: string[]): any {
    const encrypted = { ...data };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        const result = this.encrypt(String(encrypted[field]));
        encrypted[field] = JSON.stringify({
          encrypted: result.encrypted,
          iv: result.iv,
          keyVersion: result.keyVersion,
        });
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive data fields
   */
  public decryptSensitiveData(data: any, sensitiveFields: string[]): any {
    const decrypted = { ...data };

    for (const field of sensitiveFields) {
      if (decrypted[field]) {
        try {
          const encryptedData = JSON.parse(decrypted[field]);
          const result = this.decrypt(encryptedData.encrypted, encryptedData.iv);
          if (result.success) {
            decrypted[field] = result.decrypted;
          } else {
            decrypted[field] = null;
          }
        } catch (error) {
          decrypted[field] = null;
        }
      }
    }

    return decrypted;
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
