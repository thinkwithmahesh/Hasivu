"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.passwordResetSchema = exports.bulkUserImportSchema = exports.rfidAssociationSchema = exports.userIdSchema = exports.userQuerySchema = exports.updateUserSchema = exports.createUserSchema = exports.SAFE_PATTERNS = exports.safeRegexValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const safeRegexValidator = (value, pattern, helpers, timeout = 100) => {
    try {
        const startTime = Date.now();
        const result = pattern.test(value);
        const endTime = Date.now();
        if (endTime - startTime > timeout) {
            return helpers.error('string.pattern.timeout');
        }
        if (!result) {
            return helpers.error('string.pattern.base');
        }
        return value;
    }
    catch (error) {
        return helpers.error('string.pattern.error');
    }
};
exports.safeRegexValidator = safeRegexValidator;
exports.SAFE_PATTERNS = {
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    email: /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/,
    phone: /^[+]?[1-9][\d]{0,15}$/,
    name: /^[a-zA-Z\s]{1,100}$/,
    address: /^[a-zA-Z0-9\s\-.,#]{1,255}$/,
    schoolCode: /^[A-Z0-9]{4,12}$/,
    studentId: /^[A-Z0-9]{6,15}$/,
    rfidCard: /^[A-Fa-f0-9]{8,16}$/,
    grade: /^(1[0-2]|[1-9])$/,
    section: /^[A-Z]$/,
    pinCode: /^[1-9][0-9]{5}$/
};
const UserRoles = ['PARENT', 'SCHOOL_ADMIN', 'VENDOR', 'STUDENT', 'SYSTEM_ADMIN'];
const UserStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
const Languages = ['en', 'hi', 'kn'];
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.email, helpers);
    })
        .required()
        .messages({
        'string.pattern.base': 'Invalid email format',
        'string.pattern.timeout': 'Email validation timed out',
        'string.pattern.error': 'Email validation error'
    }),
    phone: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.phone, helpers);
    })
        .optional()
        .allow(null)
        .messages({
        'string.pattern.base': 'Invalid phone number format',
        'string.pattern.timeout': 'Phone validation timed out'
    }),
    firstName: joi_1.default.string()
        .required()
        .min(1)
        .max(100)
        .trim()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
    })
        .messages({
        'string.pattern.base': 'First name can only contain letters and spaces',
        'string.pattern.timeout': 'Name validation timed out'
    }),
    lastName: joi_1.default.string()
        .required()
        .min(1)
        .max(100)
        .trim()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
    })
        .messages({
        'string.pattern.base': 'Last name can only contain letters and spaces',
        'string.pattern.timeout': 'Name validation timed out'
    }),
    role: joi_1.default.string()
        .valid(...UserRoles)
        .required(),
    status: joi_1.default.string()
        .valid(...UserStatuses)
        .default('PENDING'),
    language: joi_1.default.string()
        .valid(...Languages)
        .default('en'),
    schoolCode: joi_1.default.when('role', {
        is: joi_1.default.string().valid('SCHOOL_ADMIN', 'STUDENT'),
        then: joi_1.default.string()
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.schoolCode, helpers);
        })
            .required()
            .messages({
            'string.pattern.base': 'Invalid school code format',
            'string.pattern.timeout': 'School code validation timed out'
        }),
        otherwise: joi_1.default.optional()
    }),
    studentId: joi_1.default.when('role', {
        is: 'STUDENT',
        then: joi_1.default.string()
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.studentId, helpers);
        })
            .required()
            .messages({
            'string.pattern.base': 'Invalid student ID format',
            'string.pattern.timeout': 'Student ID validation timed out'
        }),
        otherwise: joi_1.default.optional()
    }),
    grade: joi_1.default.when('role', {
        is: 'STUDENT',
        then: joi_1.default.number().integer().min(1).max(12).required(),
        otherwise: joi_1.default.optional()
    }),
    section: joi_1.default.when('role', {
        is: 'STUDENT',
        then: joi_1.default.string()
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.section, helpers);
        })
            .required()
            .messages({
            'string.pattern.base': 'Section must be a single uppercase letter',
            'string.pattern.timeout': 'Section validation timed out'
        }),
        otherwise: joi_1.default.optional()
    }),
    address: joi_1.default.object({
        street: joi_1.default.string()
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.address, helpers);
        })
            .required()
            .messages({
            'string.pattern.base': 'Invalid street address format',
            'string.pattern.timeout': 'Address validation timed out'
        }),
        city: joi_1.default.string()
            .max(100)
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
        })
            .required(),
        state: joi_1.default.string()
            .max(100)
            .custom((value, helpers) => {
            return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
        })
            .required(),
        pinCode: joi_1.default.string()
            .length(6)
            .pattern(exports.SAFE_PATTERNS.pinCode)
            .required()
            .messages({
            'string.pattern.base': 'PIN code must be 6 digits and first digit cannot be 0'
        }),
        country: joi_1.default.string()
            .default('India')
            .max(100)
    }).optional(),
    preferences: joi_1.default.object({
        notifications: joi_1.default.object({
            email: joi_1.default.boolean().default(true),
            sms: joi_1.default.boolean().default(false),
            push: joi_1.default.boolean().default(true)
        }).default(),
        dietary: joi_1.default.object({
            restrictions: joi_1.default.array().items(joi_1.default.string()).default([]),
            preferences: joi_1.default.array().items(joi_1.default.string()).default([])
        }).default(),
        language: joi_1.default.string().valid(...Languages).default('en'),
        timezone: joi_1.default.string().default('Asia/Kolkata')
    }).optional()
});
exports.updateUserSchema = joi_1.default.object({
    phone: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.phone, helpers);
    })
        .allow(null),
    firstName: joi_1.default.string()
        .min(1)
        .max(100)
        .trim()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
    }),
    lastName: joi_1.default.string()
        .min(1)
        .max(100)
        .trim()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.name, helpers);
    }),
    status: joi_1.default.string()
        .valid(...UserStatuses),
    language: joi_1.default.string()
        .valid(...Languages),
    grade: joi_1.default.number().integer().min(1).max(12),
    section: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.section, helpers);
    }),
    address: exports.createUserSchema.extract('address').optional(),
    preferences: exports.createUserSchema.extract('preferences').optional()
}).min(1);
exports.userQuerySchema = joi_1.default.object({
    role: joi_1.default.string().valid(...UserRoles).optional(),
    status: joi_1.default.string().valid(...UserStatuses).optional(),
    schoolCode: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.schoolCode, helpers);
    })
        .optional(),
    grade: joi_1.default.number().integer().min(1).max(12).optional(),
    section: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.section, helpers);
    })
        .optional(),
    search: joi_1.default.string().max(255).trim().optional(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email').default('createdAt'),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc')
});
exports.userIdSchema = joi_1.default.object({
    id: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.uuid, helpers);
    })
        .required()
});
exports.rfidAssociationSchema = joi_1.default.object({
    rfidCardId: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.rfidCard, helpers);
    })
        .required()
        .messages({
        'string.pattern.base': 'Invalid RFID card format',
        'string.pattern.timeout': 'RFID validation timed out'
    }),
    isActive: joi_1.default.boolean().default(true)
});
exports.bulkUserImportSchema = joi_1.default.object({
    users: joi_1.default.array()
        .items(exports.createUserSchema)
        .min(1)
        .max(100)
        .custom((value, helpers) => {
        const emails = value.map((user) => user.email.toLowerCase());
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            return helpers.error('array.unique', { message: 'Duplicate emails found in batch' });
        }
        return value;
    })
        .required()
});
exports.passwordResetSchema = joi_1.default.object({
    email: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, exports.safeRegexValidator)(value, exports.SAFE_PATTERNS.email, helpers);
    })
        .required(),
    token: joi_1.default.string()
        .min(32)
        .max(128)
        .required(),
    newPassword: joi_1.default.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: exports.passwordResetSchema.extract('newPassword')
});
exports.default = {
    createUserSchema: exports.createUserSchema,
    updateUserSchema: exports.updateUserSchema,
    userQuerySchema: exports.userQuerySchema,
    userIdSchema: exports.userIdSchema,
    rfidAssociationSchema: exports.rfidAssociationSchema,
    bulkUserImportSchema: exports.bulkUserImportSchema,
    passwordResetSchema: exports.passwordResetSchema,
    changePasswordSchema: exports.changePasswordSchema,
    SAFE_PATTERNS: exports.SAFE_PATTERNS,
    safeRegexValidator: exports.safeRegexValidator,
    UserRoles,
    UserStatuses,
    Languages
};
//# sourceMappingURL=userSchemas.js.map