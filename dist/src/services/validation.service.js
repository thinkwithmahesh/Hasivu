"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationService = exports.ValidationService = void 0;
const zod_1 = require("zod");
class ValidationService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }
    validate(schema, data) {
        try {
            const validated = schema.parse(data);
            return {
                success: true,
                data: validated,
            };
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ field: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateEmail(email) {
        const emailSchema = zod_1.z.string().email();
        return emailSchema.safeParse(email).success;
    }
    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    validateUUID(uuid) {
        const uuidSchema = zod_1.z.string().uuid();
        return uuidSchema.safeParse(uuid).success;
    }
    validateDate(date) {
        const dateSchema = zod_1.z.string().datetime();
        return dateSchema.safeParse(date).success || !isNaN(Date.parse(date));
    }
    validateRequired(data, requiredFields) {
        const errors = [];
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                errors.push({
                    field,
                    message: `${field} is required`,
                });
            }
        }
        return {
            success: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    sanitizeString(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/[\r\n]+/g, ' ');
    }
    validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push({
                field: 'password',
                message: 'Password must be at least 8 characters long',
            });
        }
        if (!/[A-Z]/.test(password)) {
            errors.push({
                field: 'password',
                message: 'Password must contain at least one uppercase letter',
            });
        }
        if (!/[a-z]/.test(password)) {
            errors.push({
                field: 'password',
                message: 'Password must contain at least one lowercase letter',
            });
        }
        if (!/[0-9]/.test(password)) {
            errors.push({
                field: 'password',
                message: 'Password must contain at least one number',
            });
        }
        return {
            success: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    validateRange(value, min, max) {
        return value >= min && value <= max;
    }
    sanitizePayload(payload) {
        if (typeof payload !== 'object' || payload === null) {
            return payload;
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(payload)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizePayload(value);
            }
            else if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    static validateObject(schema, data) {
        const { error, value } = schema.validate(data);
        if (error) {
            throw new Error(error.details.map((d) => d.message).join(', '));
        }
        return value;
    }
}
exports.ValidationService = ValidationService;
exports.validationService = ValidationService.getInstance();
exports.default = ValidationService;
//# sourceMappingURL=validation.service.js.map