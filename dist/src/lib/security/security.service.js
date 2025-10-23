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
exports.SecurityService = void 0;
const crypto = __importStar(require("crypto"));
const logger_service_1 = require("../../shared/logger.service");
const encryption_service_1 = require("./encryption.service");
class SecurityService {
    csrfTokens = new Set();
    async validateCSRFToken(token) {
        try {
            const isValid = this.csrfTokens.has(token);
            if (isValid) {
                this.csrfTokens.delete(token);
            }
            return isValid;
        }
        catch (error) {
            logger_service_1.logger.error('CSRF token validation failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    generateCSRFToken() {
        const token = crypto.randomBytes(32).toString('hex');
        this.csrfTokens.add(token);
        return token;
    }
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .trim();
        }
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    continue;
                }
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }
    detectSQLInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
            /(\'|\"|--|;|\*|\/\*|\*\/)/g,
            /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi,
            /(1=1|1='1'|1="1")/gi,
        ];
        return sqlPatterns.some(pattern => pattern.test(input));
    }
    async validateJWTToken(token) {
        try {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../../services/auth.service')));
            const payload = await authService.verifyToken(token);
            return { valid: true, payload };
        }
        catch (error) {
            logger_service_1.logger.error('JWT token validation failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return { valid: false };
        }
    }
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    async hashPassword(password) {
        try {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../../services/auth.service')));
            return await authService.hashPassword(password);
        }
        catch (error) {
            logger_service_1.logger.error('Password hashing failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Password hashing failed');
        }
    }
    async verifyPassword(password, hash) {
        try {
            const { authService } = await Promise.resolve().then(() => __importStar(require('../../services/auth.service')));
            return await authService.verifyPassword(password, hash);
        }
        catch (error) {
            logger_service_1.logger.error('Password verification failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    encryptData(data) {
        try {
            const result = encryption_service_1.encryptionService.encrypt(data);
            return JSON.stringify(result);
        }
        catch (error) {
            logger_service_1.logger.error('Data encryption failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Data encryption failed');
        }
    }
    decryptData(encryptedData) {
        try {
            const parsed = JSON.parse(encryptedData);
            const result = encryption_service_1.encryptionService.decrypt(parsed.encrypted, parsed.iv);
            if (result.success) {
                return result.decrypted;
            }
            throw new Error('Decryption failed');
        }
        catch (error) {
            logger_service_1.logger.error('Data decryption failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Data decryption failed');
        }
    }
    generateHMAC(data, key) {
        const hmacKey = key || crypto.randomBytes(32).toString('hex');
        return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
    }
    verifyHMAC(data, hmac, key) {
        const expectedHMAC = this.generateHMAC(data, key);
        return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHMAC, 'hex'));
    }
    detectXSS(input) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>.*?<\/embed>/gi,
        ];
        return xssPatterns.some(pattern => pattern.test(input));
    }
    cleanupExpiredTokens() {
        if (this.csrfTokens.size > 1000) {
            this.csrfTokens.clear();
            logger_service_1.logger.info('Cleaned up CSRF tokens');
        }
    }
}
exports.SecurityService = SecurityService;
//# sourceMappingURL=security.service.js.map