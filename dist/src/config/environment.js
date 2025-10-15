"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.env = void 0;
class Environment {
    static instance;
    config;
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!Environment.instance) {
            Environment.instance = new Environment();
        }
        return Environment.instance;
    }
    loadConfig() {
        return {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: parseInt(process.env.PORT || '3000', 10),
            APP_NAME: process.env.APP_NAME || 'Hasivu Platform',
            APP_VERSION: process.env.APP_VERSION || '1.0.0',
            DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
            JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
            JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
            JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
            JWT_ISSUER: process.env.JWT_ISSUER || 'hasivu-platform',
            JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'hasivu-users',
            REDIS_URL: process.env.REDIS_URL,
            REDIS_HOST: process.env.REDIS_HOST || 'localhost',
            REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
            REDIS_PASSWORD: process.env.REDIS_PASSWORD,
            AWS_REGION: process.env.AWS_REGION || 'us-east-1',
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
            RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
            RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
            SMTP_HOST: process.env.SMTP_HOST,
            SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
            SMTP_USER: process.env.SMTP_USER,
            SMTP_PASSWORD: process.env.SMTP_PASSWORD,
            ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
            ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
            ENABLE_SMS_NOTIFICATIONS: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
        };
    }
    get(key) {
        return this.config[key];
    }
    getAll() {
        return { ...this.config };
    }
    isDevelopment() {
        return this.config.NODE_ENV === 'development';
    }
    isProduction() {
        return this.config.NODE_ENV === 'production';
    }
    isTest() {
        return this.config.NODE_ENV === 'test';
    }
    validate() {
        const requiredKeys = [
            'DATABASE_URL',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET',
        ];
        const missingKeys = [];
        requiredKeys.forEach(key => {
            if (!this.config[key]) {
                missingKeys.push(key);
            }
        });
        return {
            isValid: missingKeys.length === 0,
            missingKeys,
        };
    }
}
exports.env = Environment.getInstance();
exports.default = exports.env;
exports.config = {
    jwt: {
        secret: exports.env.get('JWT_SECRET'),
        refreshSecret: exports.env.get('JWT_REFRESH_SECRET'),
        issuer: exports.env.get('JWT_ISSUER'),
        audience: exports.env.get('JWT_AUDIENCE'),
        expiresIn: exports.env.get('JWT_EXPIRY'),
        refreshExpiresIn: exports.env.get('JWT_REFRESH_EXPIRY'),
    },
    redis: {
        url: exports.env.get('REDIS_URL') ||
            `redis://${exports.env.get('REDIS_HOST') || 'localhost'}:${exports.env.get('REDIS_PORT') || 6379}`,
    },
    server: {
        nodeEnv: exports.env.get('NODE_ENV'),
    },
};
//# sourceMappingURL=environment.js.map