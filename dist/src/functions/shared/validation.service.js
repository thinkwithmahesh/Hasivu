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
exports.ValidationService = exports.ValidationSchemas = exports.ValidationError = void 0;
const Joi = __importStar(require("joi"));
class ValidationError extends Error {
    details;
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
exports.ValidationSchemas = {
    userRegistration: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
            .required()
            .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
            'any.required': 'Password is required'
        }),
        firstName: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'First name is required',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required'
        }),
        lastName: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .required()
            .messages({
            'string.min': 'Last name is required',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required'
        }),
        schoolId: Joi.string()
            .uuid()
            .required()
            .messages({
            'string.guid': 'Invalid school ID format',
            'any.required': 'School ID is required'
        }),
        role: Joi.string()
            .valid('student', 'teacher', 'admin', 'parent')
            .default('student')
            .messages({
            'any.only': 'Role must be one of: student, teacher, admin, parent'
        })
    }),
    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string()
            .required()
            .messages({
            'any.required': 'Password is required'
        })
    }),
    profileUpdate: Joi.object({
        firstName: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .optional()
            .messages({
            'string.min': 'First name cannot be empty',
            'string.max': 'First name cannot exceed 50 characters'
        }),
        lastName: Joi.string()
            .trim()
            .min(1)
            .max(50)
            .optional()
            .messages({
            'string.min': 'Last name cannot be empty',
            'string.max': 'Last name cannot exceed 50 characters'
        }),
        phone: Joi.string()
            .pattern(new RegExp('^[+]?[1-9]?[0-9]{7,15}$'))
            .optional()
            .messages({
            'string.pattern.base': 'Please provide a valid phone number'
        }),
        preferences: Joi.object({
            language: Joi.string().valid('en', 'hi', 'ta').default('en'),
            notifications: Joi.boolean().default(true),
            theme: Joi.string().valid('light', 'dark').default('light')
        }).optional()
    }),
    passwordChange: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
            'any.required': 'Current password is required'
        }),
        newPassword: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
            .required()
            .messages({
            'string.min': 'New password must be at least 8 characters long',
            'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
            'any.required': 'New password is required'
        }),
        confirmPassword: Joi.string()
            .required()
            .valid(Joi.ref('newPassword'))
            .messages({
            'any.only': 'Password confirmation does not match new password',
            'any.required': 'Password confirmation is required'
        })
    }),
    rfidCard: Joi.object({
        cardNumber: Joi.string()
            .pattern(new RegExp('^[0-9A-Fa-f]{8,16}$'))
            .required()
            .messages({
            'string.pattern.base': 'RFID card number must be 8-16 hexadecimal characters',
            'any.required': 'RFID card number is required'
        }),
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
            'string.guid': 'Invalid student ID format',
            'any.required': 'Student ID is required'
        }),
        expiryDate: Joi.date()
            .greater('now')
            .optional()
            .messages({
            'date.greater': 'Expiry date must be in the future'
        })
    }),
    paymentOrder: Joi.object({
        amount: Joi.number()
            .positive()
            .precision(2)
            .required()
            .messages({
            'number.positive': 'Amount must be positive',
            'any.required': 'Amount is required'
        }),
        currency: Joi.string()
            .valid('INR')
            .default('INR'),
        description: Joi.string()
            .max(500)
            .optional()
            .messages({
            'string.max': 'Description cannot exceed 500 characters'
        }),
        orderId: Joi.string()
            .uuid()
            .optional()
    }),
    notification: Joi.object({
        type: Joi.string()
            .valid('order_confirmation', 'payment_success', 'delivery_notification', 'system_alert')
            .required()
            .messages({
            'any.only': 'Notification type must be one of: order_confirmation, payment_success, delivery_notification, system_alert',
            'any.required': 'Notification type is required'
        }),
        title: Joi.string()
            .max(100)
            .required()
            .messages({
            'string.max': 'Title cannot exceed 100 characters',
            'any.required': 'Title is required'
        }),
        message: Joi.string()
            .max(500)
            .required()
            .messages({
            'string.max': 'Message cannot exceed 500 characters',
            'any.required': 'Message is required'
        }),
        data: Joi.object().optional()
    })
};
class ValidationService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }
    async validate(schema, data) {
        try {
            const { error, value } = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                const details = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value
                }));
                throw new ValidationError('Validation failed', details);
            }
            return value;
        }
        catch (validationError) {
            if (validationError instanceof ValidationError) {
                throw validationError;
            }
            throw new ValidationError('Validation error occurred', []);
        }
    }
    async validateRegistration(data) {
        return this.validate(exports.ValidationSchemas.userRegistration, data);
    }
    async validateLogin(data) {
        return this.validate(exports.ValidationSchemas.login, data);
    }
    async validateProfileUpdate(data) {
        return this.validate(exports.ValidationSchemas.profileUpdate, data);
    }
    async validatePasswordChange(data) {
        return this.validate(exports.ValidationSchemas.passwordChange, data);
    }
    async validateRfidCard(data) {
        return this.validate(exports.ValidationSchemas.rfidCard, data);
    }
    async validatePaymentOrder(data) {
        return this.validate(exports.ValidationSchemas.paymentOrder, data);
    }
    async validateNotification(data) {
        return this.validate(exports.ValidationSchemas.notification, data);
    }
    validateUUID(value, fieldName = 'ID') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            throw new ValidationError(`Invalid ${fieldName} format`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must be a valid UUID`,
                    value
                }]);
        }
        return true;
    }
    validateEmail(value, fieldName = 'Email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new ValidationError(`Invalid ${fieldName} format`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must be a valid email address`,
                    value
                }]);
        }
        return true;
    }
    validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new ValidationError(`${fieldName} is required`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} is required`,
                    value
                }]);
        }
        return true;
    }
    validateStringLength(value, min, max, fieldName) {
        if (typeof value !== 'string') {
            throw new ValidationError(`${fieldName} must be a string`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must be a string`,
                    value
                }]);
        }
        if (value.length < min) {
            throw new ValidationError(`${fieldName} too short`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must be at least ${min} characters`,
                    value
                }]);
        }
        if (value.length > max) {
            throw new ValidationError(`${fieldName} too long`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must not exceed ${max} characters`,
                    value
                }]);
        }
        return true;
    }
    validateArray(value, fieldName, minLength, maxLength) {
        if (!Array.isArray(value)) {
            throw new ValidationError(`${fieldName} must be an array`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must be an array`,
                    value
                }]);
        }
        if (minLength !== undefined && value.length < minLength) {
            throw new ValidationError(`${fieldName} too short`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must contain at least ${minLength} items`,
                    value
                }]);
        }
        if (maxLength !== undefined && value.length > maxLength) {
            throw new ValidationError(`${fieldName} too long`, [{
                    field: fieldName.toLowerCase(),
                    message: `${fieldName} must not exceed ${maxLength} items`,
                    value
                }]);
        }
        return true;
    }
    static validateObject(data, schema) {
        try {
            const { error } = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                const errors = error.details.map((detail) => detail.message);
                return { isValid: false, errors };
            }
            return { isValid: true };
        }
        catch (validationError) {
            return { isValid: false, errors: ['Validation error occurred'] };
        }
    }
}
exports.ValidationService = ValidationService;
//# sourceMappingURL=validation.service.js.map