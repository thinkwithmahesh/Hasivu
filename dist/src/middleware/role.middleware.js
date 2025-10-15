"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentOnly = exports.parentOnly = exports.schoolStaffOnly = exports.adminOnly = exports.permissionMiddleware = exports.roleMiddleware = void 0;
const logger_service_1 = require("../services/logger.service");
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                logger_service_1.logger.warn('Role middleware: No user found in request', {
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'UNAUTHENTICATED'
                });
                return;
            }
            const userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                logger_service_1.logger.warn('Role middleware: Insufficient permissions', {
                    userId: req.user.id,
                    userRole: userRole,
                    allowedRoles,
                    path: req.path,
                    method: req.method
                });
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    error: 'INSUFFICIENT_PERMISSIONS',
                    requiredRoles: allowedRoles,
                    userRole: userRole
                });
                return;
            }
            logger_service_1.logger.debug('Role middleware: Access granted', {
                userId: req.user.id,
                userRole: userRole,
                path: req.path,
                method: req.method
            });
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Role middleware error', {
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined),
                path: req.path,
                method: req.method
            });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'MIDDLEWARE_ERROR'
            });
            return;
        }
    };
};
exports.roleMiddleware = roleMiddleware;
const permissionMiddleware = (requiredPermissions) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'UNAUTHENTICATED'
                });
                return;
            }
            const userPermissions = req.user.permissions || [];
            const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission));
            if (!hasAllPermissions) {
                logger_service_1.logger.warn('Permission middleware: Missing permissions', {
                    userId: req.user.id,
                    userPermissions,
                    requiredPermissions,
                    path: req.path,
                    method: req.method
                });
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    error: 'INSUFFICIENT_PERMISSIONS',
                    requiredPermissions,
                    userPermissions
                });
                return;
            }
            next();
        }
        catch (error) {
            logger_service_1.logger.error('Permission middleware error', {
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined),
                path: req.path,
                method: req.method
            });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'MIDDLEWARE_ERROR'
            });
            return;
        }
    };
};
exports.permissionMiddleware = permissionMiddleware;
exports.adminOnly = (0, exports.roleMiddleware)(['admin', 'super_admin']);
exports.schoolStaffOnly = (0, exports.roleMiddleware)(['school_admin', 'staff', 'teacher', 'admin', 'super_admin']);
exports.parentOnly = (0, exports.roleMiddleware)(['parent', 'admin', 'super_admin']);
exports.studentOnly = (0, exports.roleMiddleware)(['student', 'admin', 'super_admin']);
//# sourceMappingURL=role.middleware.js.map