"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiresCSRFProtection = exports.validateCSRFToken = void 0;
const response_utils_1 = require("./response.utils");
function validateCSRFToken(event) {
    try {
        const csrfToken = event.headers['x-csrf-token'] || event.headers['X-CSRF-Token'];
        if (!csrfToken) {
            return {
                isValid: false,
                error: (0, response_utils_1.createErrorResponse)('CSRF_VALIDATION_FAILED', 'CSRF token missing', 403),
            };
        }
        if (typeof csrfToken !== 'string' || csrfToken.length < 10 || csrfToken.length > 100) {
            return {
                isValid: false,
                error: (0, response_utils_1.createErrorResponse)('CSRF_VALIDATION_FAILED', 'Invalid CSRF token format', 403),
            };
        }
        const csrfPattern = /^[a-zA-Z0-9]+$/;
        if (!csrfPattern.test(csrfToken)) {
            return {
                isValid: false,
                error: (0, response_utils_1.createErrorResponse)('CSRF_VALIDATION_FAILED', 'Invalid CSRF token characters', 403),
            };
        }
        return { isValid: true };
    }
    catch (error) {
        return {
            isValid: false,
            error: (0, response_utils_1.createErrorResponse)('CSRF_VALIDATION_FAILED', 'CSRF validation error', 403),
        };
    }
}
exports.validateCSRFToken = validateCSRFToken;
function requiresCSRFProtection(method) {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}
exports.requiresCSRFProtection = requiresCSRFProtection;
//# sourceMappingURL=csrf.utils.js.map