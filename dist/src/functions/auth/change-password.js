"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordHandler = exports.handler = void 0;
const auth_service_1 = require("../../services/auth.service");
const response_utils_1 = require("../shared/response.utils");
const handler = async (event, _context) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.userId || !body.currentPassword || !body.newPassword) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'User ID, current password, and new password are required', 400);
        }
        if (body.newPassword !== body.newPasswordConfirm) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'New passwords do not match', 400);
        }
        if (body.newPassword.length < 8) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'New password must be at least 8 characters long', 400);
        }
        await auth_service_1.authService.changePassword(body.userId, body.currentPassword, body.newPassword);
        return (0, response_utils_1.createSuccessResponse)({ message: 'Password changed successfully' }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('PASSWORD_CHANGE_FAILED', error instanceof Error ? error.message : 'Password change failed', 500);
    }
};
exports.handler = handler;
exports.changePasswordHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=change-password.js.map