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
exports.cryptoService = exports.CryptoService = void 0;
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcryptjs"));
const logger_1 = require("../utils/logger");
class CryptoService {
    static instance;
    initialized = false;
    defaultAlgorithm = 'aes-256-gcm';
    keyLength = 32;
    ivLength = 16;
    saltRounds = 12;
    encryptionKey;
    constructor() {
        if (!crypto) {
            throw new Error('Crypto module not available');
        }
        this.encryptionKey = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    }
    static getInstance() {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }
    async initialize() {
        try {
            if (this.initialized) {
                return { success: true, data: { message: 'Already initialized' } };
            }
            await this.testCryptoFunctions();
            this.initialized = true;
            logger_1.logger.info('Crypto service initialized successfully');
            return { success: true, data: { initialized: true } };
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize crypto service', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error' };
        }
    }
    async cleanup() {
        try {
            this.initialized = false;
            logger_1.logger.info('Crypto service cleaned up successfully');
            return { success: true, data: { cleaned: true } };
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup crypto service', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error' };
        }
    }
    async hashPassword(password, options = {}) {
        try {
            const saltRounds = options.saltRounds || this.saltRounds;
            const algorithm = options.algorithm || 'bcrypt';
            let hash;
            switch (algorithm) {
                case 'bcrypt':
                    hash = await bcrypt.hash(password, saltRounds);
                    break;
                case 'sha256':
                    {
                        const salt = crypto.randomBytes(16).toString('hex');
                        hash = crypto.createHash('sha256').update(password + salt).digest('hex') + ':' + salt;
                    }
                    break;
                case 'sha512':
                    {
                        const salt512 = crypto.randomBytes(16).toString('hex');
                        hash = crypto.createHash('sha512').update(password + salt512).digest('hex') + ':' + salt512;
                    }
                    break;
                default:
                    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
            }
            return { success: true, data: { hash, algorithm } };
        }
        catch (error) {
            logger_1.logger.error('Password hashing failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Hashing failed' };
        }
    }
    async verifyPassword(password, hash) {
        try {
            let isValid = false;
            if (hash.includes(':')) {
                const [storedHash, salt] = hash.split(':');
                const algorithm = storedHash.length === 64 ? 'sha256' : 'sha512';
                const newHash = crypto.createHash(algorithm).update(password + salt).digest('hex');
                isValid = crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(newHash));
            }
            else {
                isValid = await bcrypt.compare(password, hash);
            }
            return { success: true, data: { valid: isValid } };
        }
        catch (error) {
            logger_1.logger.error('Password verification failed', error);
            return { success: false, error: 'Verification failed' };
        }
    }
    async generateSalt(length = 16) {
        try {
            const salt = crypto.randomBytes(length).toString('hex');
            return { success: true, data: { salt, length } };
        }
        catch (error) {
            logger_1.logger.error('Salt generation failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Salt generation failed' };
        }
    }
    async encrypt(data, keyVersion) {
        try {
            let dataToEncrypt;
            if (typeof data === 'object') {
                dataToEncrypt = JSON.stringify(data);
            }
            else {
                dataToEncrypt = String(data);
            }
            const encryptionKey = keyVersion ? Buffer.from(keyVersion, 'hex') : this.encryptionKey;
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.defaultAlgorithm, encryptionKey);
            cipher.setAAD(Buffer.from('HASIVU-AUTH-DATA'));
            let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            const result = {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.defaultAlgorithm
            };
            if (typeof data === 'object' && data.sensitive) {
                return {
                    success: true,
                    sensitive: encrypted,
                    data: result
                };
            }
            return { success: true, data: result };
        }
        catch (error) {
            logger_1.logger.error('Data encryption failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Encryption failed' };
        }
    }
    async decrypt(encryptedData, key, iv, authTag) {
        try {
            let encryptedStr;
            let keyToUse;
            let ivToUse;
            let authTagToUse;
            if (typeof encryptedData === 'object' && encryptedData.encrypted) {
                encryptedStr = encryptedData.encrypted;
                ivToUse = encryptedData.iv;
                authTagToUse = encryptedData.authTag;
                keyToUse = this.encryptionKey.toString('hex');
            }
            else if (typeof encryptedData === 'string' && key && iv && authTag) {
                encryptedStr = encryptedData;
                keyToUse = key;
                ivToUse = iv;
                authTagToUse = authTag;
            }
            else {
                throw new Error('Invalid decrypt parameters');
            }
            const encryptionKey = Buffer.from(keyToUse, 'hex');
            const decipher = crypto.createDecipher(this.defaultAlgorithm, encryptionKey);
            decipher.setAAD(Buffer.from('HASIVU-AUTH-DATA'));
            decipher.setAuthTag(Buffer.from(authTagToUse, 'hex'));
            let decrypted = decipher.update(encryptedStr, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            if (typeof encryptedData === 'object' && encryptedData.data && typeof encryptedData.data === 'object') {
                try {
                    const originalData = JSON.parse(decrypted);
                    if (originalData.sensitive) {
                        return { success: true, sensitive: originalData.sensitive, data: { decrypted } };
                    }
                }
                catch (e) {
                }
            }
            return { success: true, data: { decrypted } };
        }
        catch (error) {
            logger_1.logger.error('Data decryption failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Decryption failed' };
        }
    }
    async generateKeyPair(keySize = 2048) {
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: keySize,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            const result = {
                publicKey,
                privateKey,
                algorithm: 'RSA'
            };
            return { success: true, data: result };
        }
        catch (error) {
            logger_1.logger.error('Key pair generation failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Key generation failed' };
        }
    }
    async signData(data, privateKey) {
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(data, 'utf8');
            const signature = sign.sign(privateKey, 'hex');
            const result = {
                signature,
                algorithm: 'RSA-SHA256',
                publicKey: ''
            };
            return { success: true, data: result };
        }
        catch (error) {
            logger_1.logger.error('Data signing failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Signing failed' };
        }
    }
    async verifySignature(data, signature, publicKey) {
        try {
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(data, 'utf8');
            const isValid = verify.verify(publicKey, signature, 'hex');
            return { success: true, data: { valid: isValid } };
        }
        catch (error) {
            logger_1.logger.error('Signature verification failed', error);
            return { success: false, error: 'Verification failed' };
        }
    }
    async generateSecureToken(length = 32) {
        try {
            const token = crypto.randomBytes(length).toString('base64url');
            return { success: true, data: { token, length } };
        }
        catch (error) {
            logger_1.logger.error('Token generation failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Token generation failed' };
        }
    }
    async generateHMAC(data, secret, algorithm = 'sha256') {
        try {
            const hmac = crypto.createHmac(algorithm, secret);
            hmac.update(data);
            const hash = hmac.digest('hex');
            return { success: true, data: { hmac: hash, algorithm } };
        }
        catch (error) {
            logger_1.logger.error('HMAC generation failed', error);
            return { success: false, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'HMAC generation failed' };
        }
    }
    async rotateEncryptionKeys() {
        try {
            logger_1.logger.info('Rotating encryption keys');
            const oldKeyVersion = 'v1-' + crypto.randomBytes(4).toString('hex');
            this.encryptionKey = crypto.scryptSync(crypto.randomBytes(32).toString('hex'), 'salt', 32);
            const newKeyVersion = 'v2-' + crypto.randomBytes(4).toString('hex');
            return {
                success: true,
                newKeyVersion,
                oldKeyVersion,
                data: {
                    rotated: true,
                    timestamp: new Date(),
                    keyHash: crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 8)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to rotate encryption keys', error);
            return {
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Key rotation failed'
            };
        }
    }
    async generateSecureRandom(length = 32) {
        try {
            const randomData = crypto.randomBytes(length);
            const randomHex = randomData.toString('hex');
            const randomBase64 = randomData.toString('base64');
            return {
                success: true,
                data: {
                    hex: randomHex,
                    base64: randomBase64,
                    length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Secure random generation failed', error);
            return {
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Random generation failed'
            };
        }
    }
    async hash(data, algorithm = 'sha256') {
        try {
            const supportedAlgorithms = ['sha256', 'sha512', 'md5', 'sha1'];
            if (!supportedAlgorithms.includes(algorithm)) {
                return {
                    success: false,
                    error: `Unsupported hash algorithm: ${algorithm}`
                };
            }
            const hash = crypto.createHash(algorithm).update(data).digest('hex');
            return {
                success: true,
                data: {
                    hash,
                    algorithm,
                    inputLength: data.length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Hashing failed', error);
            return {
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Hashing failed'
            };
        }
    }
    async deriveKey(password, salt, iterations = 10000, keyLength = 32) {
        try {
            const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');
            return {
                success: true,
                data: {
                    key: derivedKey.toString('hex'),
                    salt,
                    iterations,
                    keyLength,
                    algorithm: 'pbkdf2'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Key derivation failed', error);
            return {
                success: false,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Key derivation failed'
            };
        }
    }
    async testCryptoFunctions() {
        const testData = 'test-data-for-crypto-validation';
        const encResult = await this.encrypt(testData);
        if (!encResult.success) {
            throw new Error('Encryption test failed');
        }
        const hashResult = await this.hashPassword('test-password');
        if (!hashResult.success) {
            throw new Error('Hashing test failed');
        }
        const tokenResult = await this.generateSecureToken();
        if (!tokenResult.success) {
            throw new Error('Token generation test failed');
        }
        logger_1.logger.info('Crypto service functionality tests passed');
    }
}
exports.CryptoService = CryptoService;
exports.cryptoService = CryptoService.getInstance();
exports.default = CryptoService;
//# sourceMappingURL=crypto.service.js.map