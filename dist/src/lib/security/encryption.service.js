"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = exports.EncryptionService = void 0;
const crypto = __importStar(require("crypto"));
const environment_1 = require("../../config/environment");
const logger_service_1 = require("../../shared/logger.service");
class EncryptionService {
    static instance;
    encryptionKey;
    algorithm = 'aes-256-gcm';
    keyLength = 32;
    ivLength = 16;
    constructor() {
        const key = environment_1.config.encryption?.key || process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ENCRYPTION_KEY environment variable is required');
        }
        this.encryptionKey = Buffer.from(key, 'hex');
        if (this.encryptionKey.length !== this.keyLength) {
            throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
        }
    }
    static getInstance() {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }
    encrypt(data, additionalData) {
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
        }
        catch (error) {
            logger_service_1.logger.error('Encryption failed:', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Encryption failed');
        }
    }
    decrypt(encryptedData, iv, tag, additionalData) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return {
                decrypted,
                success: true,
            };
        }
        catch (error) {
            logger_service_1.logger.error('Decryption failed:', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return {
                decrypted: '',
                success: false,
                error: error instanceof Error ? error.message : 'Decryption failed',
            };
        }
    }
    encryptObject(data, fields) {
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
    decryptObject(data, fields) {
        const result = { ...data };
        for (const field of fields) {
            if (result[field] && typeof result[field] === 'string') {
                try {
                    const encryptedData = JSON.parse(result[field]);
                    const decrypted = this.decrypt(encryptedData.encrypted, encryptedData.iv);
                    if (decrypted.success) {
                        result[field] = decrypted.decrypted;
                    }
                    else {
                        logger_service_1.logger.warn(`Failed to decrypt field ${field}`);
                        result[field] = null;
                    }
                }
                catch (error) {
                    logger_service_1.logger.warn(`Invalid encrypted data for field ${field}`);
                    result[field] = null;
                }
            }
        }
        return result;
    }
    generateKey() {
        return crypto.randomBytes(this.keyLength).toString('hex');
    }
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    hmac(data, key) {
        const hmacKey = key || this.encryptionKey.toString('hex');
        return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    validateKey(key) {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            return keyBuffer.length === this.keyLength;
        }
        catch {
            return false;
        }
    }
    encryptSensitiveData(data, sensitiveFields) {
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
    decryptSensitiveData(data, sensitiveFields) {
        const decrypted = { ...data };
        for (const field of sensitiveFields) {
            if (decrypted[field]) {
                try {
                    const encryptedData = JSON.parse(decrypted[field]);
                    const result = this.decrypt(encryptedData.encrypted, encryptedData.iv);
                    if (result.success) {
                        decrypted[field] = result.decrypted;
                    }
                    else {
                        decrypted[field] = null;
                    }
                }
                catch (error) {
                    decrypted[field] = null;
                }
            }
        }
        return decrypted;
    }
}
exports.EncryptionService = EncryptionService;
exports.encryptionService = EncryptionService.getInstance();
//# sourceMappingURL=encryption.service.js.map