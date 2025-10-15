"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = exports.handler = void 0;
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
        if (!body.email || !body.password) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Email and password are required', 400);
        }
        const result = await auth_service_1.authService.authenticate({
            email: body.email,
            password: body.password,
        });
        if (!result.success) {
            return (0, response_utils_1.createErrorResponse)('LOGIN_FAILED', result.error || 'Authentication failed', 401);
        }
        return (0, response_utils_1.createSuccessResponse)({
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName || '',
                lastName: result.user.lastName || '',
                role: result.user.role,
            },
            tokens: result.tokens,
        }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('LOGIN_FAILED', error instanceof Error ? error.message : 'Login failed', 500);
    }
};
exports.handler = handler;
exports.loginHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=login.js.map