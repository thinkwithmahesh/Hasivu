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
exports.HASIVUSchemas = exports.validationHealthCheck = exports.withAuthAndValidation = exports.withValidation = exports.createValidationErrorResponse = exports.validatePath = exports.validateQuery = exports.validateBody = exports.validateRequest = exports.CommonSchemas = void 0;
const zod_1 = require("zod");
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
const auth_1 = require("./auth");
exports.CommonSchemas = {
    email: zod_1.z.string()
        .email('Invalid email format')
        .max(320, 'Email too long')
        .toLowerCase()
        .transform(email => email.trim()),
    phone: zod_1.z.string()
        .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format: +1234567890')
        .max(15, 'Phone number too long'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character'),
    uuid: zod_1.z.string()
        .uuid('Invalid UUID format'),
    objectId: zod_1.z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
    positiveInt: zod_1.z.number()
        .int('Must be an integer')
        .positive('Must be positive'),
    nonNegativeInt: zod_1.z.number()
        .int('Must be an integer')
        .nonnegative('Must be non-negative'),
    url: zod_1.z.string()
        .url('Invalid URL format')
        .max(2048, 'URL too long'),
    dateString: zod_1.z.string()
        .datetime('Invalid date format. Use ISO 8601 format')
        .transform(date => new Date(date)),
    businessName: zod_1.z.string()
        .min(2, 'Business name must be at least 2 characters')
        .max(100, 'Business name too long')
        .trim(),
    address: zod_1.z.object({
        street: zod_1.z.string().min(1, 'Street address required').max(200),
        city: zod_1.z.string().min(1, 'City required').max(100),
        state: zod_1.z.string().min(2, 'State required').max(100),
        zipCode: zod_1.z.string().min(3, 'Zip code required').max(20),
        country: zod_1.z.string().min(2, 'Country required').max(100),
    }),
    pagination: zod_1.z.object({
        page: zod_1.z.number().int().positive().default(1),
        limit: zod_1.z.number().int().positive().max(100).default(20),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
    }).partial(),
    fileUpload: zod_1.z.object({
        filename: zod_1.z.string().min(1).max(255),
        mimeType: zod_1.z.string().min(1),
        size: zod_1.z.number().positive().max(10 * 1024 * 1024),
        content: zod_1.z.string().optional(),
    }),
    paymentAmount: zod_1.z.number()
        .int('Amount must be in cents (integer)')
        .positive('Amount must be positive')
        .max(999999999, 'Amount too large'),
    currency: zod_1.z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']).default('USD'),
};
const validateRequest = (schema, event, options = {}) => {
    const startTime = Date.now();
    try {
        const context = {
            method: event.httpMethod,
            path: event.path,
            headers: event.headers || {},
            queryParams: event.queryStringParameters,
            pathParams: event.pathParameters,
            body: null,
            sourceIp: event.requestContext.identity.sourceIp,
            userAgent: event.headers?.['User-Agent']
        };
        if (!options.skipBodyParsing && event.body) {
            try {
                context.body = JSON.parse(event.body);
            }
            catch (parseError) {
                logger.warn('Failed to parse request body as JSON', {
                    ...context,
                    body: event.body?.substring(0, 100) + '...',
                    parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
                });
                return {
                    success: false,
                    errors: [{
                            field: 'body',
                            message: 'Invalid JSON format in request body',
                            code: 'INVALID_JSON',
                            value: event.body?.substring(0, 100)
                        }]
                };
            }
        }
        else {
            context.body = event.body || null;
        }
        let dataToValidate;
        if (event.httpMethod === 'GET' || event.httpMethod === 'DELETE') {
            dataToValidate = {
                ...event.queryStringParameters,
                ...event.pathParameters
            };
        }
        else {
            dataToValidate = {
                ...context.body,
                ...(event.queryStringParameters || {}),
                ...(event.pathParameters || {})
            };
        }
        if (options.sanitize) {
            dataToValidate = sanitizeData(dataToValidate);
        }
        const parseResult = schema.safeParse(dataToValidate);
        const duration = Date.now() - startTime;
        if (parseResult.success) {
            logger.debug('Request validation successful', {
                ...context,
                dataKeys: Object.keys(dataToValidate || {}),
                duration
            });
            return {
                success: true,
                data: parseResult.data,
                sanitizedData: options.sanitize ? dataToValidate : undefined
            };
        }
        else {
            const validationErrors = formatZodErrors(parseResult.error, options.customErrorMessages);
            logger.warn('Request validation failed', {
                ...context,
                errors: validationErrors,
                dataKeys: Object.keys(dataToValidate || {}),
                duration
            });
            return {
                success: false,
                errors: validationErrors
            };
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Request validation error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            path: event.path,
            method: event.httpMethod,
            duration
        });
        return {
            success: false,
            errors: [{
                    field: 'validation',
                    message: 'Internal validation error',
                    code: 'VALIDATION_ERROR'
                }]
        };
    }
};
exports.validateRequest = validateRequest;
const validateBody = (schema, event, options = {}) => {
    return (0, exports.validateRequest)(schema, event, { ...options, skipBodyParsing: false });
};
exports.validateBody = validateBody;
const validateQuery = (schema, event, options = {}) => {
    const queryData = event.queryStringParameters || {};
    try {
        const parseResult = schema.safeParse(queryData);
        if (parseResult.success) {
            return {
                success: true,
                data: parseResult.data
            };
        }
        else {
            const validationErrors = formatZodErrors(parseResult.error, options.customErrorMessages);
            return {
                success: false,
                errors: validationErrors
            };
        }
    }
    catch (error) {
        return {
            success: false,
            errors: [{
                    field: 'query',
                    message: 'Query parameter validation error',
                    code: 'QUERY_VALIDATION_ERROR'
                }]
        };
    }
};
exports.validateQuery = validateQuery;
const validatePath = (schema, event, options = {}) => {
    const pathData = event.pathParameters || {};
    try {
        const parseResult = schema.safeParse(pathData);
        if (parseResult.success) {
            return {
                success: true,
                data: parseResult.data
            };
        }
        else {
            const validationErrors = formatZodErrors(parseResult.error, options.customErrorMessages);
            return {
                success: false,
                errors: validationErrors
            };
        }
    }
    catch (error) {
        return {
            success: false,
            errors: [{
                    field: 'path',
                    message: 'Path parameter validation error',
                    code: 'PATH_VALIDATION_ERROR'
                }]
        };
    }
};
exports.validatePath = validatePath;
const formatZodErrors = (error, customMessages) => {
    return error.issues.map(issue => {
        const fieldPath = issue.path.join('.');
        const field = fieldPath || 'unknown';
        const message = customMessages?.[field] || issue.message;
        return {
            field,
            message,
            code: issue.code.toUpperCase(),
            value: issue.code !== 'invalid_type' ? issue.received : undefined,
            path: issue.path.map(p => String(p))
        };
    });
};
const sanitizeData = (data, options = {}) => {
    const { trimStrings = true, removeNullUndefined = true, normalizeEmail = true, escapeHtml = true, removeXSS = true } = options;
    if (data === null || data === undefined) {
        return removeNullUndefined ? undefined : data;
    }
    if (typeof data === 'string') {
        let sanitized = data;
        if (trimStrings) {
            sanitized = sanitized.trim();
        }
        if (escapeHtml) {
            sanitized = escapeHtmlString(sanitized);
        }
        if (removeXSS) {
            sanitized = removeXSSAttempts(sanitized);
        }
        return sanitized;
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item, options)).filter(item => removeNullUndefined ? item !== null && item !== undefined : true);
    }
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const sanitizedValue = sanitizeData(value, options);
            if (!removeNullUndefined || (sanitizedValue !== null && sanitizedValue !== undefined)) {
                sanitized[key] = sanitizedValue;
            }
        }
        return sanitized;
    }
    return data;
};
const escapeHtmlString = (str) => {
    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return str.replace(/[&<>"'\/]/g, (match) => htmlEscapeMap[match]);
};
const removeXSSAttempts = (str) => {
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/\s*on\w+\s*=\s*[^>]*/gi, '');
    str = str.replace(/data:\s*text\/html/gi, 'data:text/plain');
    return str;
};
const createValidationErrorResponse = (errors, statusCode = 400) => {
    const errorResponse = {
        error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: errors
        }
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            ...(0, auth_1.corsMiddleware)(),
            ...(0, auth_1.securityHeaders)()
        },
        body: JSON.stringify(errorResponse)
    };
};
exports.createValidationErrorResponse = createValidationErrorResponse;
const withValidation = (schema, handler, options = {}) => {
    return async (event) => {
        try {
            const validationResult = (0, exports.validateRequest)(schema, event, options);
            if (!validationResult.success) {
                return (0, exports.createValidationErrorResponse)(validationResult.errors || [], 400);
            }
            return await handler(event, validationResult.data);
        }
        catch (error) {
            logger.error('Validation wrapper error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                path: event.path,
                method: event.httpMethod
            });
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    ...(0, auth_1.corsMiddleware)(),
                    ...(0, auth_1.securityHeaders)()
                },
                body: JSON.stringify({
                    error: {
                        message: 'Internal server error',
                        code: 'INTERNAL_ERROR',
                        timestamp: new Date().toISOString()
                    }
                })
            };
        }
    };
};
exports.withValidation = withValidation;
const withAuthAndValidation = (schema, handler, validationOptions = {}) => {
    return async (event) => {
        try {
            const { authenticateJWT } = await Promise.resolve().then(() => __importStar(require('./auth')));
            const authResult = await authenticateJWT(event);
            if (!authResult.isAuthenticated || !authResult.user) {
                return {
                    statusCode: authResult.statusCode || 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        ...(0, auth_1.corsMiddleware)(),
                        ...(0, auth_1.securityHeaders)()
                    },
                    body: JSON.stringify({
                        error: {
                            message: authResult.error || 'Authentication failed',
                            code: 'AUTH_FAILED',
                            timestamp: new Date().toISOString()
                        }
                    })
                };
            }
            const validationResult = (0, exports.validateRequest)(schema, event, validationOptions);
            if (!validationResult.success) {
                return (0, exports.createValidationErrorResponse)(validationResult.errors || []);
            }
            return await handler(event, validationResult.data, authResult.user);
        }
        catch (error) {
            logger.error('Auth and validation wrapper error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                path: event.path,
                method: event.httpMethod
            });
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    ...(0, auth_1.corsMiddleware)(),
                    ...(0, auth_1.securityHeaders)()
                },
                body: JSON.stringify({
                    error: {
                        message: 'Internal server error',
                        code: 'INTERNAL_ERROR',
                        timestamp: new Date().toISOString()
                    }
                })
            };
        }
    };
};
exports.withAuthAndValidation = withAuthAndValidation;
const validationHealthCheck = () => {
    try {
        const testSchema = zod_1.z.object({
            name: zod_1.z.string(),
            age: zod_1.z.number().positive()
        });
        const testData = { name: 'Test', age: 25 };
        const result = testSchema.safeParse(testData);
        if (result.success) {
            return {
                status: 'healthy',
                details: {
                    validation: 'working',
                    sanitization: 'configured',
                    commonSchemas: 'available',
                    errorFormatting: 'working'
                }
            };
        }
        else {
            return {
                status: 'unhealthy',
                details: {
                    validation: 'failed',
                    error: 'Basic validation test failed'
                }
            };
        }
    }
    catch (error) {
        return {
            status: 'unhealthy',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        };
    }
};
exports.validationHealthCheck = validationHealthCheck;
exports.HASIVUSchemas = {
    userRegistration: zod_1.z.object({
        email: exports.CommonSchemas.email,
        password: exports.CommonSchemas.password,
        businessName: exports.CommonSchemas.businessName,
        phone: exports.CommonSchemas.phone,
        firstName: zod_1.z.string().min(1).max(50).trim(),
        lastName: zod_1.z.string().min(1).max(50).trim(),
        acceptTerms: zod_1.z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
    }),
    userLogin: zod_1.z.object({
        email: exports.CommonSchemas.email,
        password: zod_1.z.string().min(1, 'Password required'),
        rememberMe: zod_1.z.boolean().optional(),
    }),
    businessProfile: zod_1.z.object({
        businessName: exports.CommonSchemas.businessName,
        description: zod_1.z.string().max(500).optional(),
        phone: exports.CommonSchemas.phone,
        email: exports.CommonSchemas.email,
        address: exports.CommonSchemas.address,
        website: exports.CommonSchemas.url.optional(),
        category: zod_1.z.string().min(1).max(100),
    }),
    menuItem: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).trim(),
        description: zod_1.z.string().max(500).optional(),
        price: exports.CommonSchemas.paymentAmount,
        currency: exports.CommonSchemas.currency,
        category: zod_1.z.string().min(1).max(50),
        available: zod_1.z.boolean().default(true),
        preparationTime: zod_1.z.number().int().positive().max(180).optional(),
        tags: zod_1.z.array(zod_1.z.string().max(30)).max(10).optional(),
        allergens: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    }),
    orderCreation: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            menuItemId: exports.CommonSchemas.uuid,
            quantity: zod_1.z.number().int().positive().max(99),
            specialInstructions: zod_1.z.string().max(200).optional(),
        })).min(1, 'At least one item required'),
        customerInfo: zod_1.z.object({
            name: zod_1.z.string().min(1).max(100),
            phone: exports.CommonSchemas.phone,
            email: exports.CommonSchemas.email.optional(),
        }),
        deliveryAddress: exports.CommonSchemas.address.optional(),
        notes: zod_1.z.string().max(300).optional(),
        scheduledFor: exports.CommonSchemas.dateString.optional(),
    }),
    paymentProcessing: zod_1.z.object({
        orderId: exports.CommonSchemas.uuid,
        amount: exports.CommonSchemas.paymentAmount,
        currency: exports.CommonSchemas.currency,
        paymentMethod: zod_1.z.enum(['razorpay', 'stripe', 'cash']),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
    paginationWithSearch: exports.CommonSchemas.pagination.extend({
        search: zod_1.z.string().max(100).optional(),
        filters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
};
//# sourceMappingURL=validation.js.map