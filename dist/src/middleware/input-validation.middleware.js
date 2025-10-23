"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comprehensiveInputValidation = exports.validationRateLimit = exports.sanitizeInput = exports.validateParams = exports.validateQuery = exports.validateBody = exports.pathTraversalProtection = exports.sqlInjectionProtection = exports.customSanitizer = exports.sanitizeXSS = exports.sanitizeMongoInput = void 0;
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../services/validation.service");
exports.sanitizeMongoInput = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        logger_service_1.logger.warn('Potential NoSQL injection attempt detected', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            sanitizedKey: key,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
        });
    },
});
exports.sanitizeXSS = (0, xss_clean_1.default)();
const customSanitizer = (req, res, next) => {
    try {
        if (req.body?.email) {
            req.body.email = String(req.body.email).trim().toLowerCase();
        }
        if (req.body?.phone) {
            req.body.phone = String(req.body.phone).replace(/\D/g, '');
        }
        if (req.body?.url) {
            const url = String(req.body.url).trim();
            if (!url.match(/^https?:\/\//)) {
                logger_service_1.logger.warn('Invalid URL format detected', {
                    ip: req.ip,
                    path: req.path,
                    url: url.substring(0, 50),
                });
                return res.status(400).json({
                    error: 'Invalid URL format',
                    message: 'URL must start with http:// or https://',
                });
            }
            req.body.url = url;
        }
        const removeNullBytes = (obj) => {
            if (typeof obj === 'string') {
                return obj.replace(/\0/g, '');
            }
            if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    obj[key] = removeNullBytes(obj[key]);
                });
            }
            return obj;
        };
        if (req.body) {
            req.body = removeNullBytes(req.body);
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Error in custom sanitizer', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.customSanitizer = customSanitizer;
const sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
        /(\'|\"|--|;|\*|\/\*|\*\/)/g,
        /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi,
        /(1=1|1='1'|1="1")/gi,
    ];
    const checkForSqlInjection = (value) => {
        if (typeof value === 'string') {
            return sqlPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => checkForSqlInjection(v));
        }
        return false;
    };
    try {
        const suspicious = checkForSqlInjection(req.body) ||
            checkForSqlInjection(req.query) ||
            checkForSqlInjection(req.params);
        if (suspicious) {
            logger_service_1.logger.warn('Potential SQL injection attempt detected', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                body: JSON.stringify(req.body).substring(0, 100),
                query: JSON.stringify(req.query).substring(0, 100),
                timestamp: new Date().toISOString(),
            });
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Your request contains potentially malicious content',
            });
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Error in SQL injection protection', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.sqlInjectionProtection = sqlInjectionProtection;
const pathTraversalProtection = (req, res, next) => {
    const pathTraversalPatterns = [/\.\./g, /\.\.\\/g, /%2e%2e/gi, /\.\//g];
    const checkForPathTraversal = (value) => {
        if (typeof value === 'string') {
            return pathTraversalPatterns.some(pattern => pattern.test(value));
        }
        if (typeof value === 'object' && value !== null) {
            return Object.values(value).some(v => checkForPathTraversal(v));
        }
        return false;
    };
    try {
        const suspicious = checkForPathTraversal(req.body) ||
            checkForPathTraversal(req.query) ||
            checkForPathTraversal(req.params) ||
            checkForPathTraversal(req.path);
        if (suspicious) {
            logger_service_1.logger.warn('Potential path traversal attempt detected', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
            });
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Path traversal attempts are not allowed',
            });
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Error in path traversal protection', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.pathTraversalProtection = pathTraversalProtection;
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const errors = [];
            for (const [field, rule] of Object.entries(schema)) {
                const value = req.body[field];
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors.push({
                        field,
                        message: `${field} is required`,
                    });
                    continue;
                }
                if (!rule.required && (value === undefined || value === null || value === '')) {
                    continue;
                }
                switch (rule.type) {
                    case 'string':
                        if (typeof value !== 'string') {
                            errors.push({
                                field,
                                message: `${field} must be a string`,
                            });
                        }
                        else {
                            if (rule.minLength && value.length < rule.minLength) {
                                errors.push({
                                    field,
                                    message: `${field} must be at least ${rule.minLength} characters long`,
                                });
                            }
                            if (rule.maxLength && value.length > rule.maxLength) {
                                errors.push({
                                    field,
                                    message: `${field} must be at most ${rule.maxLength} characters long`,
                                });
                            }
                            if (rule.pattern && !rule.pattern.test(value)) {
                                errors.push({
                                    field,
                                    message: `${field} format is invalid`,
                                });
                            }
                        }
                        break;
                    case 'email':
                        if (!validation_service_1.validationService.validateEmail(value)) {
                            errors.push({
                                field,
                                message: `${field} must be a valid email address`,
                            });
                        }
                        break;
                    case 'phone':
                        if (!validation_service_1.validationService.validatePhone(value)) {
                            errors.push({
                                field,
                                message: `${field} must be a valid phone number`,
                            });
                        }
                        break;
                    case 'uuid':
                        if (!validation_service_1.validationService.validateUUID(value)) {
                            errors.push({
                                field,
                                message: `${field} must be a valid UUID`,
                            });
                        }
                        break;
                    case 'number':
                        if (typeof value !== 'number' && isNaN(Number(value))) {
                            errors.push({
                                field,
                                message: `${field} must be a number`,
                            });
                        }
                        else {
                            const numValue = Number(value);
                            if (rule.min !== undefined && numValue < rule.min) {
                                errors.push({
                                    field,
                                    message: `${field} must be at least ${rule.min}`,
                                });
                            }
                            if (rule.max !== undefined && numValue > rule.max) {
                                errors.push({
                                    field,
                                    message: `${field} must be at most ${rule.max}`,
                                });
                            }
                        }
                        break;
                    case 'boolean':
                        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                            errors.push({
                                field,
                                message: `${field} must be a boolean`,
                            });
                        }
                        break;
                    case 'date':
                        if (!validation_service_1.validationService.validateDate(value)) {
                            errors.push({
                                field,
                                message: `${field} must be a valid date`,
                            });
                        }
                        break;
                    case 'array':
                        if (!Array.isArray(value)) {
                            errors.push({
                                field,
                                message: `${field} must be an array`,
                            });
                        }
                        else {
                            if (rule.minLength && value.length < rule.minLength) {
                                errors.push({
                                    field,
                                    message: `${field} must have at least ${rule.minLength} items`,
                                });
                            }
                            if (rule.maxLength && value.length > rule.maxLength) {
                                errors.push({
                                    field,
                                    message: `${field} must have at most ${rule.maxLength} items`,
                                });
                            }
                            if (rule.arrayItemType) {
                                value.forEach((item, index) => {
                                    if (rule.arrayItemType.type === 'string' && typeof item !== 'string') {
                                        errors.push({
                                            field,
                                            message: `${field}[${index}] must be a string`,
                                        });
                                    }
                                });
                            }
                        }
                        break;
                    case 'object':
                        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                            errors.push({
                                field,
                                message: `${field} must be an object`,
                            });
                        }
                        else if (rule.objectSchema) {
                            const nestedErrors = validateObject(value, rule.objectSchema);
                            nestedErrors.forEach(error => {
                                errors.push({
                                    field: `${field}.${error.field}`,
                                    message: error.message,
                                });
                            });
                        }
                        break;
                }
                if (rule.enum && !rule.enum.includes(value)) {
                    errors.push({
                        field,
                        message: `${field} must be one of: ${rule.enum.join(', ')}`,
                    });
                }
                if (rule.custom && !rule.custom(value)) {
                    errors.push({
                        field,
                        message: `${field} failed custom validation`,
                    });
                }
            }
            if (errors.length > 0) {
                logger_service_1.logger.warn('Input validation failed', {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    errors: errors.map(e => e.message),
                });
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors,
                });
            }
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Validation middleware error', error instanceof Error ? error : new Error(String(error)), {
                ip: req.ip,
                path: req.path,
            });
            next();
        }
    };
};
exports.validateBody = validateBody;
function validateObject(obj, schema) {
    const errors = [];
    for (const [field, rule] of Object.entries(schema)) {
        const value = obj[field];
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field,
                message: `${field} is required`,
            });
            continue;
        }
        if (!rule.required && (value === undefined || value === null || value === '')) {
            continue;
        }
        switch (rule.type) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push({
                        field,
                        message: `${field} must be a string`,
                    });
                }
                break;
            case 'number':
                if (typeof value !== 'number' && isNaN(Number(value))) {
                    errors.push({
                        field,
                        message: `${field} must be a number`,
                    });
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    errors.push({
                        field,
                        message: `${field} must be a boolean`,
                    });
                }
                break;
        }
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push({
                field,
                message: `${field} must be one of: ${rule.enum.join(', ')}`,
            });
        }
    }
    return errors;
}
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const errors = [];
            for (const [field, rule] of Object.entries(schema)) {
                const value = req.query[field];
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors.push({
                        field,
                        message: `${field} is required`,
                    });
                    continue;
                }
                if (!rule.required && (value === undefined || value === null || value === '')) {
                    continue;
                }
                if (rule.type === 'number' && isNaN(Number(value))) {
                    errors.push({
                        field,
                        message: `${field} must be a number`,
                    });
                }
                if (rule.type === 'boolean' && value !== 'true' && value !== 'false') {
                    errors.push({
                        field,
                        message: `${field} must be a boolean`,
                    });
                }
                if (rule.enum && !rule.enum.includes(String(value))) {
                    errors.push({
                        field,
                        message: `${field} must be one of: ${rule.enum.join(', ')}`,
                    });
                }
            }
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Query validation failed',
                    details: errors,
                });
            }
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Query validation middleware error', error instanceof Error ? error : new Error(String(error)), {
                ip: req.ip,
                path: req.path,
            });
            next();
        }
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const errors = [];
            for (const [field, rule] of Object.entries(schema)) {
                const value = req.params[field];
                if (rule.type === 'uuid' && !validation_service_1.validationService.validateUUID(value)) {
                    errors.push({
                        field,
                        message: `${field} must be a valid UUID`,
                    });
                }
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors.push({
                        field,
                        message: `${field} format is invalid`,
                    });
                }
            }
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Parameter validation failed',
                    details: errors,
                });
            }
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Parameter validation middleware error', error instanceof Error ? error : new Error(String(error)), {
                ip: req.ip,
                path: req.path,
            });
            next();
        }
    };
};
exports.validateParams = validateParams;
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = validation_service_1.validationService.sanitizePayload(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            for (const [key, value] of Object.entries(req.query)) {
                if (typeof value === 'string') {
                    req.query[key] = validation_service_1.validationService.sanitizeString(value);
                }
            }
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Input sanitization error', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.sanitizeInput = sanitizeInput;
const validationRateLimit = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `validation_rate_limit_${clientIP}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;
    const globalAny = global;
    if (!globalAny.validationRateLimitStore) {
        globalAny.validationRateLimitStore = new Map();
    }
    const store = globalAny.validationRateLimitStore;
    const userRequests = store.get(key) || [];
    const validRequests = userRequests.filter((timestamp) => now - timestamp < windowMs);
    if (validRequests.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            error: 'Too many validation requests',
            message: 'Rate limit exceeded. Please try again later.',
        });
    }
    validRequests.push(now);
    store.set(key, validRequests);
    next();
};
exports.validationRateLimit = validationRateLimit;
exports.comprehensiveInputValidation = [
    exports.sanitizeMongoInput,
    exports.sanitizeXSS,
    exports.customSanitizer,
    exports.sqlInjectionProtection,
    exports.pathTraversalProtection,
    exports.sanitizeInput,
    exports.validationRateLimit,
];
exports.default = {
    validateBody: exports.validateBody,
    validateQuery: exports.validateQuery,
    validateParams: exports.validateParams,
    sanitizeInput: exports.sanitizeInput,
    sanitizeMongoInput: exports.sanitizeMongoInput,
    sanitizeXSS: exports.sanitizeXSS,
    customSanitizer: exports.customSanitizer,
    sqlInjectionProtection: exports.sqlInjectionProtection,
    pathTraversalProtection: exports.pathTraversalProtection,
    validationRateLimit: exports.validationRateLimit,
    comprehensiveInputValidation: exports.comprehensiveInputValidation,
};
//# sourceMappingURL=input-validation.middleware.js.map