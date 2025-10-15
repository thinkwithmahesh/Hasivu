"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordHandler = exports.handler = void 0;
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
        if (!body.email) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Email is required', 400);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Please enter a valid email address', 400);
        }
        const result = await auth_service_1.authService.forgotPassword(body.email);
        return (0, response_utils_1.createSuccessResponse)({
            message: result.message,
        }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('FORGOT_PASSWORD_FAILED', error instanceof Error ? error.message : 'Password reset request failed', 500);
    }
};
exports.handler = handler;
exports.forgotPasswordHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=forgot-password.js.map