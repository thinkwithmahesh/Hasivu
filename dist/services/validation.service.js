"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationService = exports.ValidationService = void 0;
/**
 * HASIVU Platform - Input Validation and Sanitization Service
 * Comprehensive input validation, sanitization, and security filtering
 * Prevents injection attacks and ensures data integrity
 */
const dompurify_1 = require("dompurify");
const validator = require("validator");
const structured_logging_service_1 = require("./structured-logging.service");
// Security patterns to detect potential attacks
const SECURITY_PATTERNS = {
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|\*|;|'|"|\||&|<|>)/gi,
    xss: /(<script|<iframe|<object|<embed|<link|<meta|javascript:|data:|vbscript:|on\w+\s*=)/gi,
    commandInjection: /(\||\&|\;|\$\(|\`|>|<|\|\||\&\&)/g,
    pathTraversal: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/gi,
    ldapInjection: /(\*|\(|\)|\||&|=|!|<|>|~|;)/g,
    nosqlInjection: /(\$where|\$ne|\$in|\$nin|\$gt|\$lt|\$regex|\$or|\$and)/gi
};
/**
 * Main validation service
 */
class ValidationService {
    static instance;
    static getInstance() {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }
    /**
     * Validate a single field against rules
     */
    validateField(fieldName, value, rules) {
        const errors = [];
        const warnings = [];
        let sanitizedValue = value;
        try {
            // Check if field is required
            if (rules.required && (value === null || value === undefined || value === '')) {
                errors.push(`${fieldName} is required`);
                return { isValid: false, errors, warnings };
            }
            // Skip further validation if value is empty and not required
            if (!rules.required && (value === null || value === undefined || value === '')) {
                return { isValid: true, errors: [], sanitizedValue: value, warnings };
            }
            // Type-specific validation
            switch (rules.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${fieldName} must be a string`);
                    }
                    else {
                        sanitizedValue = this.sanitizeString(value);
                    }
                    break;
                case 'number':
                    if (typeof value !== 'number' && !this.isNumeric(String(value))) {
                        errors.push(`${fieldName} must be a valid number`);
                    }
                    else {
                        sanitizedValue = typeof value === 'number' ? value : parseFloat(String(value));
                    }
                    break;
                case 'email':
                    if (!validator.isEmail(String(value))) {
                        errors.push(`${fieldName} must be a valid email address`);
                    }
                    else {
                        sanitizedValue = validator.normalizeEmail(String(value)) || value;
                    }
                    break;
                case 'phone':
                    if (!validator.isMobilePhone(String(value))) {
                        errors.push(`${fieldName} must be a valid phone number`);
                    }
                    break;
                case 'url':
                    if (!validator.isURL(String(value))) {
                        errors.push(`${fieldName} must be a valid URL`);
                    }
                    break;
                case 'uuid':
                    if (!validator.isUUID(String(value))) {
                        errors.push(`${fieldName} must be a valid UUID`);
                    }
                    break;
                case 'date':
                    if (!validator.isISO8601(String(value))) {
                        errors.push(`${fieldName} must be a valid ISO 8601 date`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean' && !validator.isBoolean(String(value))) {
                        errors.push(`${fieldName} must be a boolean value`);
                    }
                    else {
                        sanitizedValue = typeof value === 'boolean' ? value : validator.toBoolean(String(value));
                    }
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push(`${fieldName} must be an array`);
                    }
                    break;
                case 'object':
                    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
                        errors.push(`${fieldName} must be an object`);
                    }
                    break;
            }
            // Length validation for strings and arrays
            if (rules.minLength && ((typeof sanitizedValue === 'string' && sanitizedValue.length < rules.minLength) ||
                (Array.isArray(sanitizedValue) && sanitizedValue.length < rules.minLength))) {
                const unit = typeof sanitizedValue === 'string' ? 'characters' : 'items';
                errors.push(`${fieldName} must have at least ${rules.minLength} ${unit}`);
            }
            if (rules.maxLength && ((typeof sanitizedValue === 'string' && sanitizedValue.length > rules.maxLength) ||
                (Array.isArray(sanitizedValue) && sanitizedValue.length > rules.maxLength))) {
                const unit = typeof sanitizedValue === 'string' ? 'characters' : 'items';
                errors.push(`${fieldName} must have no more than ${rules.maxLength} ${unit}`);
            }
            // Min/max validation for numbers
            if (rules.min && typeof sanitizedValue === 'number' && sanitizedValue < rules.min) {
                errors.push(`${fieldName} must be at least ${rules.min}`);
            }
            if (rules.max && typeof sanitizedValue === 'number' && sanitizedValue > rules.max) {
                errors.push(`${fieldName} must be no more than ${rules.max}`);
            }
            // Pattern validation
            if (rules.pattern && typeof sanitizedValue === 'string' && !rules.pattern.test(sanitizedValue)) {
                errors.push(`${fieldName} format is invalid`);
            }
            // Enum validation
            if (rules.enum && !rules.enum.includes(sanitizedValue)) {
                errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
            }
            // Custom validator
            if (rules.customValidator) {
                const customResult = rules.customValidator(sanitizedValue);
                if (customResult !== true) {
                    errors.push(typeof customResult === 'string' ? customResult : `${fieldName} failed custom validation`);
                }
            }
            // Security validation
            const securityCheck = this.checkSecurity(fieldName, sanitizedValue);
            if (!securityCheck.isValid) {
                errors.push(...securityCheck.errors);
                warnings.push(...(securityCheck.warnings || []));
            }
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('Validation error', error, { fieldName, rules });
            errors.push(`${fieldName} validation failed due to internal error`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            sanitizedValue,
            warnings
        };
    }
    /**
     * Validate an object against a schema
     */
    validateObject(data, schema) {
        const allErrors = [];
        const allWarnings = [];
        const sanitizedObject = {};
        try {
            // Check for unknown fields if strict mode
            const schemaFields = Object.keys(schema);
            const dataFields = Object.keys(data || {});
            for (const field of dataFields) {
                if (!schemaFields.includes(field)) {
                    allWarnings.push(`Unknown field: ${field}`);
                }
            }
            // Validate each field in schema
            for (const [fieldName, rules] of Object.entries(schema)) {
                const fieldValue = data?.[fieldName];
                const fieldResult = this.validateField(fieldName, fieldValue, rules);
                if (!fieldResult.isValid) {
                    allErrors.push(...fieldResult.errors);
                }
                if (fieldResult.warnings) {
                    allWarnings.push(...fieldResult.warnings);
                }
                // Include sanitized value in result
                if (fieldResult.sanitizedValue !== undefined) {
                    sanitizedObject[fieldName] = fieldResult.sanitizedValue;
                }
            }
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('Object validation error', error, { schema });
            allErrors.push('Object validation failed due to internal error');
        }
        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            sanitizedValue: sanitizedObject,
            warnings: allWarnings
        };
    }
    /**
     * Check for security threats in input
     */
    checkSecurity(fieldName, value) {
        const errors = [];
        const warnings = [];
        if (typeof value !== 'string') {
            return { isValid: true, errors: [], warnings };
        }
        try {
            // Check for various injection attacks
            for (const [attackType, pattern] of Object.entries(SECURITY_PATTERNS)) {
                if (pattern.test(value)) {
                    errors.push(`${fieldName} contains potentially dangerous content (${attackType})`);
                    structured_logging_service_1.structuredLogger.security({
                        event: 'potential_injection_detected',
                        severity: 'high',
                        target: fieldName,
                        outcome: 'blocked',
                        metadata: { attackType, value: value.substring(0, 100) },
                        context: { fieldName }
                    });
                }
            }
            // Check for excessive length (potential DoS)
            if (value.length > 10000) {
                warnings.push(`${fieldName} is unusually long`);
            }
            // Check for suspicious encoding
            if (value.includes('%') && this.hasSuspiciousEncoding(value)) {
                warnings.push(`${fieldName} contains suspicious URL encoding`);
            }
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('Security check error', error, { fieldName });
            errors.push(`Security validation failed for ${fieldName}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Sanitize string input
     */
    sanitizeString(input) {
        if (typeof input !== 'string') {
            return String(input);
        }
        try {
            // Basic HTML sanitization
            let sanitized = dompurify_1.default.sanitize(input);
            // Trim whitespace
            sanitized = sanitized.trim();
            // Remove null bytes
            sanitized = sanitized.replace(/\0/g, '');
            // Normalize whitespace
            sanitized = sanitized.replace(/\s+/g, ' ');
            return sanitized;
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('String sanitization error', error, { input });
            // Return escaped version as fallback
            return validator.escape(input);
        }
    }
    /**
     * Sanitize HTML content
     */
    sanitizeHtml(html) {
        try {
            const config = {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
                ALLOWED_ATTR: ['class', 'id']
            };
            // Add security options if supported by this DOMPurify version
            if ('REMOVE_DATA_URI_SCHEMES' in dompurify_1.default) {
                config.REMOVE_DATA_URI_SCHEMES = true;
            }
            if ('REMOVE_EXTERNAL_CONTENT' in dompurify_1.default) {
                config.REMOVE_EXTERNAL_CONTENT = true;
            }
            return dompurify_1.default.sanitize(html, config);
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('HTML sanitization error', error, { html });
            return validator.escape(html);
        }
    }
    /**
     * Validate and sanitize SQL-like input
     */
    sanitizeSqlInput(input) {
        try {
            // Remove potentially dangerous SQL characters and keywords
            return validator.escape(input)
                .replace(/['"`;\\]/g, '')
                .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '');
        }
        catch (error) {
            structured_logging_service_1.structuredLogger.error('SQL sanitization error', error, { input });
            return '';
        }
    }
    /**
     * Helper methods
     */
    isNumeric(value) {
        return !isNaN(Number(value)) && isFinite(Number(value));
    }
    hasSuspiciousEncoding(value) {
        const suspiciousPatterns = [
            /%3C/, // <
            /%3E/, // >
            /%22/, // "
            /%27/, // '
            /%3B/, // ;
            /%28/, // (
            /%29/ // )
        ];
        return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    /**
     * Quick validation helpers
     */
    isValidEmail(email) {
        return validator.isEmail(email);
    }
    isValidPhone(phone) {
        return validator.isMobilePhone(phone);
    }
    isValidUUID(uuid) {
        return validator.isUUID(uuid);
    }
    isValidUrl(url) {
        return validator.isURL(url);
    }
    isStrongPassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate user registration data
     */
    validateRegistration(data) {
        const schema = {
            email: { type: 'email', required: true },
            firstName: { type: 'string', required: true, minLength: 2, maxLength: 50 },
            lastName: { type: 'string', required: true, minLength: 2, maxLength: 50 },
            password: { type: 'string', required: true, minLength: 8 },
            phone: { type: 'phone', required: false },
            role: { type: 'string', required: false, enum: ['student', 'teacher', 'parent', 'admin', 'school_admin', 'staff'] },
            schoolId: { type: 'uuid', required: false }
        };
        const result = this.validateObject(data, schema);
        // Additional password strength check
        if (data.password && result.isValid) {
            const passwordResult = this.isStrongPassword(data.password);
            if (!passwordResult.isValid) {
                result.errors.push(...passwordResult.errors);
                result.isValid = false;
            }
        }
        return result;
    }
    /**
     * Sanitize payload to remove potentially harmful content
     */
    sanitizePayload(payload) {
        if (typeof payload === 'string') {
            // Remove potentially dangerous patterns
            let sanitized = payload
                .replace(SECURITY_PATTERNS.sqlInjection, '')
                .replace(SECURITY_PATTERNS.xss, '')
                .replace(SECURITY_PATTERNS.commandInjection, '')
                .replace(SECURITY_PATTERNS.pathTraversal, '');
            // Use DOMPurify for additional HTML sanitization
            if (typeof dompurify_1.default !== 'undefined') {
                sanitized = dompurify_1.default.sanitize(sanitized);
            }
            return sanitized;
        }
        if (Array.isArray(payload)) {
            return payload.map(item => this.sanitizePayload(item));
        }
        if (payload && typeof payload === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(payload)) {
                sanitized[key] = this.sanitizePayload(value);
            }
            return sanitized;
        }
        return payload;
    }
    /**
     * Validate profile update data
     */
    validateProfileUpdate(data) {
        const schema = {
            firstName: { type: 'string', required: false, minLength: 2, maxLength: 50 },
            lastName: { type: 'string', required: false, minLength: 2, maxLength: 50 },
            phone: { type: 'phone', required: false },
            profilePictureUrl: { type: 'url', required: false }
        };
        return this.validateObject(data, schema);
    }
}
exports.ValidationService = ValidationService;
// Export singleton instance
exports.validationService = ValidationService.getInstance();
