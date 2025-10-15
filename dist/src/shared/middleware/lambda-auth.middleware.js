"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateLambda = exports.requireRole = exports.requireAuth = exports.authenticateRequest = void 0;
const auth_service_1 = require("../../services/auth.service");
async function authenticateRequest(event) {
    try {
        const authHeader = event.headers?.authorization || event.headers?.Authorization;
        if (!authHeader) {
            return {
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Authorization header is required',
                },
            };
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return {
                success: false,
                error: {
                    code: 'INVALID_TOKEN_FORMAT',
                    message: 'Authorization header must use Bearer scheme',
                },
            };
        }
        const token = parts[1];
        const payload = await auth_service_1.authService.verifyToken(token, 'access');
        if (!payload) {
            return {
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired token',
                },
            };
        }
        const user = {
            id: payload.userId,
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        return {
            success: true,
            userId: payload.userId,
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            user,
        };
    }
    catch (error) {
        return {
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: error instanceof Error ? error.message : 'Authentication failed',
            },
        };
    }
}
exports.authenticateRequest = authenticateRequest;
async function requireAuth(event) {
    const result = await authenticateRequest(event);
    if (!result.success) {
        throw new Error(result.error?.message || 'Authentication failed');
    }
    return result;
}
exports.requireAuth = requireAuth;
function requireRole(allowedRoles) {
    return async (event) => {
        const result = await requireAuth(event);
        if (!result.role || !allowedRoles.includes(result.role)) {
            throw new Error('Insufficient permissions');
        }
        return result;
    };
}
exports.requireRole = requireRole;
exports.authenticateLambda = authenticateRequest;
//# sourceMappingURL=lambda-auth.middleware.js.map