"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileHandler = exports.handler = void 0;
const auth_service_1 = require("../../services/auth.service");
const response_utils_1 = require("../shared/response.utils");
const handler = async (event, _context) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const userId = event.pathParameters?.userId || body.userId;
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'User ID is required', 400);
        }
        const updateData = {};
        if (body.firstName)
            updateData.firstName = body.firstName;
        if (body.lastName)
            updateData.lastName = body.lastName;
        if (body.phone !== undefined)
            updateData.phone = body.phone;
        if (Object.keys(updateData).length === 0) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'At least one field to update is required', 400);
        }
        const result = await auth_service_1.authService.updateProfile(userId, updateData);
        if (!result.success) {
            return (0, response_utils_1.createErrorResponse)('PROFILE_UPDATE_FAILED', result.error || 'Profile update failed', 400);
        }
        return (0, response_utils_1.createSuccessResponse)({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName || '',
            lastName: result.user.lastName || '',
            role: result.user.role,
            phone: result.user.phone || '',
        }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('PROFILE_UPDATE_FAILED', error instanceof Error ? error.message : 'Profile update failed', 500);
    }
};
exports.handler = handler;
exports.updateProfileHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=update-profile.js.map