"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.pathTraversalProtection = exports.sqlInjectionProtection = exports.customSanitizer = exports.sanitizeXSS = exports.sanitizeMongoInput = void 0;
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const logger_service_1 = require("../shared/logger.service");
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
exports.sanitizeInput = [
    exports.sanitizeMongoInput,
    exports.sanitizeXSS,
    exports.customSanitizer,
    exports.sqlInjectionProtection,
    exports.pathTraversalProtection,
];
exports.default = {
    sanitizeMongoInput: exports.sanitizeMongoInput,
    sanitizeXSS: exports.sanitizeXSS,
    customSanitizer: exports.customSanitizer,
    sqlInjectionProtection: exports.sqlInjectionProtection,
    pathTraversalProtection: exports.pathTraversalProtection,
    sanitizeInput: exports.sanitizeInput,
};
//# sourceMappingURL=sanitize.middleware.js.map