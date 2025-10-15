"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileHandler = exports.handler = void 0;
const auth_service_1 = require("../../services/auth.service");
const response_utils_1 = require("../shared/response.utils");
const handler = async (event, _context) => {
    try {
        const userId = event.pathParameters?.userId || event.userId;
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'User ID is required', 400);
        }
        const user = await auth_service_1.authService.getUserById(userId);
        if (!user) {
            return (0, response_utils_1.createErrorResponse)('USER_NOT_FOUND', 'User not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            id: user.id,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role,
            phone: user.phone,
            schoolId: user.schoolId,
            createdAt: user.createdAt,
        }, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('PROFILE_FETCH_FAILED', error instanceof Error ? error.message : 'Failed to fetch profile', 500);
    }
};
exports.handler = handler;
exports.profileHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=profile.js.map