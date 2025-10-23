"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandler = exports.handler = void 0;
const auth_service_1 = require("../../services/auth.service");
const response_utils_1 = require("../shared/response.utils");
const csrf_utils_1 = require("../shared/csrf.utils");
const handler = async (event, _context) => {
    try {
        if ((0, csrf_utils_1.requiresCSRFProtection)(event.httpMethod)) {
            const csrfValidation = (0, csrf_utils_1.validateCSRFToken)(event);
            if (!csrfValidation.isValid) {
                return csrfValidation.error;
            }
        }
        const body = JSON.parse(event.body || '{}');
        if (!body.email || !body.password || !body.firstName || !body.lastName) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Email, password, first name, and last name are required', 400);
        }
        if (body.password !== body.passwordConfirm) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Passwords do not match', 400);
        }
        if (body.password.length < 8) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Password must be at least 8 characters long', 400);
        }
        const registerResult = await auth_service_1.authService.register({
            email: body.email,
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
            schoolId: body.schoolId,
        });
        if (!registerResult.success) {
            return (0, response_utils_1.createErrorResponse)('REGISTRATION_FAILED', registerResult.error || 'Registration failed', 400);
        }
        const authResult = await auth_service_1.authService.authenticate({
            email: body.email,
            password: body.password,
        });
        if (!authResult.success) {
            return (0, response_utils_1.createErrorResponse)('REGISTRATION_FAILED', 'Registration succeeded but token generation failed', 500);
        }
        return (0, response_utils_1.createSuccessResponse)({
            user: {
                id: registerResult.user.id,
                email: registerResult.user.email,
                firstName: registerResult.user.firstName || '',
                lastName: registerResult.user.lastName || '',
                role: registerResult.user.role,
            },
            tokens: authResult.tokens,
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('REGISTRATION_FAILED', error instanceof Error ? error.message : 'Registration failed', 500);
    }
};
exports.handler = handler;
exports.registerHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=register.js.map