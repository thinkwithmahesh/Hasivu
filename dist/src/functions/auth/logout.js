"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.handler = void 0;
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
        if (!body.refreshToken) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Refresh token is required', 400);
        }
        await auth_service_1.authService.logout(body.refreshToken);
        return (0, response_utils_1.createSuccessResponse)({ message: 'Logged out successfully' }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('LOGOUT_FAILED', error instanceof Error ? error.message : 'Logout failed', 500);
    }
};
exports.handler = handler;
exports.logoutHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=logout.js.map