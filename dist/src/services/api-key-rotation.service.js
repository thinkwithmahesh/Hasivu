"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRotationService = exports.ApiKeyRotationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_service_1 = require("../shared/logger.service");
const environment_1 = require("../config/environment");
class ApiKeyRotationService {
    static instance;
    rotationPolicies = new Map();
    constructor() {
        this.rotationPolicies.set('default', {
            maxAge: 90,
            warningAge: 80,
            autoRotate: true,
            rotationInterval: 90,
        });
        this.rotationPolicies.set('payment', {
            maxAge: 30,
            warningAge: 25,
            autoRotate: true,
            rotationInterval: 30,
        });
        this.rotationPolicies.set('service', {
            maxAge: 180,
            warningAge: 170,
            autoRotate: true,
            rotationInterval: 180,
        });
    }
    static getInstance() {
        if (!ApiKeyRotationService.instance) {
            ApiKeyRotationService.instance = new ApiKeyRotationService();
        }
        return ApiKeyRotationService.instance;
    }
    generateApiKey() {
        const prefix = 'hsk';
        const randomBytes = crypto_1.default.randomBytes(32).toString('base64url');
        const timestamp = Date.now().toString(36);
        return `${prefix}_${timestamp}_${randomBytes}`;
    }
    hashApiKey(apiKey) {
        return crypto_1.default
            .createHash('sha256')
            .update(apiKey + (environment_1.config.jwt?.secret || 'default-secret'))
            .digest('hex');
    }
    async createApiKey(userId, name, policyType = 'default', permissions = []) {
        try {
            const key = this.generateApiKey();
            const hashedKey = this.hashApiKey(key);
            const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default');
            const apiKey = {
                id: crypto_1.default.randomUUID(),
                key: hashedKey,
                userId,
                name,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + policy.maxAge * 24 * 60 * 60 * 1000),
                rotationCount: 0,
                isActive: true,
                permissions,
            };
            logger_service_1.logger.info('API key created', {
                userId,
                keyId: apiKey.id,
                name,
                expiresAt: apiKey.expiresAt,
                policyType,
            });
            return { key, id: apiKey.id };
        }
        catch (error) {
            logger_service_1.logger.error('Error creating API key', error instanceof Error ? error : new Error(String(error)), { userId, name });
            throw error;
        }
    }
    async rotateApiKey(keyId, reason = 'scheduled') {
        try {
            const newKey = this.generateApiKey();
            const hashedKey = this.hashApiKey(newKey);
            logger_service_1.logger.info('API key rotated', {
                keyId,
                reason,
                timestamp: new Date().toISOString(),
            });
            return { key: newKey, id: keyId };
        }
        catch (error) {
            logger_service_1.logger.error('Error rotating API key', error instanceof Error ? error : new Error(String(error)), { keyId, reason });
            throw error;
        }
    }
    shouldRotateKey(apiKey, policyType = 'default') {
        const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default');
        const keyAge = Date.now() - apiKey.createdAt.getTime();
        const maxAgeMs = policy.maxAge * 24 * 60 * 60 * 1000;
        return keyAge >= maxAgeMs;
    }
    isKeyExpiringSoon(apiKey, policyType = 'default') {
        const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default');
        const timeUntilExpiry = apiKey.expiresAt.getTime() - Date.now();
        const warningMs = (policy.maxAge - policy.warningAge) * 24 * 60 * 60 * 1000;
        return timeUntilExpiry <= warningMs && timeUntilExpiry > 0;
    }
    async validateApiKey(providedKey) {
        try {
            const hashedKey = this.hashApiKey(providedKey);
            return true;
        }
        catch (error) {
            logger_service_1.logger.error('Error validating API key', error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }
    async revokeApiKey(keyId, reason = 'user_requested') {
        try {
            logger_service_1.logger.info('API key revoked', {
                keyId,
                reason,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_service_1.logger.error('Error revoking API key', error instanceof Error ? error : new Error(String(error)), { keyId, reason });
            throw error;
        }
    }
    async getExpiringKeys(policyType) {
        try {
            const allKeys = [];
            return allKeys.filter(key => {
                const keyPolicyType = this.determineKeyPolicyType(key);
                if (policyType && keyPolicyType !== policyType) {
                    return false;
                }
                return this.isKeyExpiringSoon(key, keyPolicyType);
            });
        }
        catch (error) {
            logger_service_1.logger.error('Error getting expiring keys', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }
    async runAutoRotation() {
        try {
            logger_service_1.logger.info('Starting automatic API key rotation job');
            const keysToRotate = [];
            for (const key of keysToRotate) {
                const policyType = this.determineKeyPolicyType(key);
                const policy = this.rotationPolicies.get(policyType);
                if (policy.autoRotate) {
                    await this.rotateApiKey(key.id, 'auto_rotation');
                }
            }
            logger_service_1.logger.info('Automatic API key rotation completed', {
                keysRotated: keysToRotate.length,
            });
        }
        catch (error) {
            logger_service_1.logger.error('Error in automatic rotation job', error instanceof Error ? error : new Error(String(error)));
        }
    }
    async sendRotationWarnings() {
        try {
            const expiringKeys = await this.getExpiringKeys();
            for (const key of expiringKeys) {
                logger_service_1.logger.warn('API key expiring soon', {
                    keyId: key.id,
                    userId: key.userId,
                    expiresAt: key.expiresAt,
                    daysRemaining: Math.ceil((key.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
                });
            }
        }
        catch (error) {
            logger_service_1.logger.error('Error sending rotation warnings', error instanceof Error ? error : new Error(String(error)));
        }
    }
    async getRotationStats() {
        try {
            return {
                totalKeys: 0,
                activeKeys: 0,
                expiredKeys: 0,
                expiringSoon: 0,
                averageRotationCount: 0,
            };
        }
        catch (error) {
            logger_service_1.logger.error('Error getting rotation stats', error instanceof Error ? error : new Error(String(error)));
            return {
                totalKeys: 0,
                activeKeys: 0,
                expiredKeys: 0,
                expiringSoon: 0,
                averageRotationCount: 0,
            };
        }
    }
    determineKeyPolicyType(key) {
        if (key.permissions.some(p => p.includes('payment'))) {
            return 'payment';
        }
        if (key.permissions.some(p => p.includes('service'))) {
            return 'service';
        }
        return 'default';
    }
    setRotationPolicy(name, policy) {
        this.rotationPolicies.set(name, policy);
        logger_service_1.logger.info('Rotation policy updated', { name, policy });
    }
    getRotationPolicy(name) {
        return this.rotationPolicies.get(name);
    }
}
exports.ApiKeyRotationService = ApiKeyRotationService;
exports.apiKeyRotationService = ApiKeyRotationService.getInstance();
//# sourceMappingURL=api-key-rotation.service.js.map