"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshHandler = exports.handler = void 0;
const auth_service_1 = require("../../services/auth.service");
const response_utils_1 = require("../shared/response.utils");
const handler = async (event, _context) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.refreshToken) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Refresh token is required', 400);
        }
        const tokens = await auth_service_1.authService.refreshAccessToken(body.refreshToken);
        return (0, response_utils_1.createSuccessResponse)(tokens, 200);
    }
    catch (error) {
        return (0, response_utils_1.createErrorResponse)('REFRESH_FAILED', error instanceof Error ? error.message : 'Token refresh failed', 500);
    }
};
exports.handler = handler;
exports.refreshHandler = exports.handler;
exports.default = exports.handler;
//# sourceMappingURL=refresh.js.map