"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrossSchoolAccess = exports.validateSchoolOwnership = exports.validateSchoolAccess = void 0;
const logger_service_1 = require("../services/logger.service");
const database_service_1 = require("../services/database.service");
const validateSchoolAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHENTICATED'
            });
            return;
        }
        const userRole = req.user.role;
        const userSchoolId = req.user.schoolId || undefined;
        const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body.schoolId;
        if (userRole === 'super_admin') {
            logger_service_1.logger.debug('School access granted for super admin', {
                userId: req.user.id,
                requestedSchoolId,
                path: req.path
            });
            return next();
        }
        if (userRole === 'admin') {
            logger_service_1.logger.debug('School access granted for admin', {
                userId: req.user.id,
                requestedSchoolId,
                path: req.path
            });
            return next();
        }
        if (!requestedSchoolId) {
            if (!userSchoolId) {
                return res.status(400).json({
                    success: false,
                    message: 'School ID required for this operation',
                    error: 'SCHOOL_ID_REQUIRED'
                });
            }
            req.params.schoolId = userSchoolId;
            req.query.schoolId = userSchoolId;
            req.body.schoolId = userSchoolId;
            return next();
        }
        const hasAccess = await checkSchoolAccess(req.user.id, userRole, userSchoolId, requestedSchoolId);
        if (!hasAccess) {
            logger_service_1.logger.warn('School access denied', {
                userId: req.user.id,
                userRole,
                userSchoolId,
                requestedSchoolId,
                path: req.path,
                method: req.method
            });
            res.status(403).json({
                success: false,
                message: 'Access denied to this school',
                error: 'SCHOOL_ACCESS_DENIED',
                requestedSchoolId,
                userSchoolId
            });
            return;
        }
        logger_service_1.logger.debug('School access granted', {
            userId: req.user.id,
            userRole,
            requestedSchoolId,
            path: req.path
        });
        next();
    }
    catch (error) {
        logger_service_1.logger.error('School access validation error', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            stack: (error instanceof Error ? error.stack : undefined),
            path: req.path,
            method: req.method,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error during school access validation',
            error: 'MIDDLEWARE_ERROR'
        });
        return;
    }
};
exports.validateSchoolAccess = validateSchoolAccess;
async function checkSchoolAccess(userId, userRole, userSchoolId, requestedSchoolId) {
    try {
        const db = database_service_1.DatabaseService.getInstance();
        const schoolQuery = 'SELECT id FROM schools WHERE id = ? AND is_active = true';
        const schoolResult = await db.query(schoolQuery, [requestedSchoolId]);
        if (schoolResult.length === 0) {
            return false;
        }
        switch (userRole) {
            case 'super_admin':
            case 'admin':
                return true;
            case 'school_admin':
            case 'staff':
            case 'teacher':
                return userSchoolId === requestedSchoolId;
            case 'parent':
                return await checkParentSchoolAccess(userId, requestedSchoolId);
            case 'student':
                return userSchoolId === requestedSchoolId;
            default:
                return false;
        }
    }
    catch (error) {
        logger_service_1.logger.error('Error checking school access', {
            userId,
            userRole,
            userSchoolId,
            requestedSchoolId,
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
        });
        return false;
    }
}
async function checkParentSchoolAccess(parentId, schoolId) {
    try {
        const db = database_service_1.DatabaseService.getInstance();
        const query = `
      SELECT COUNT(*) as count
      FROM users u
      JOIN parent_children pc ON u.id = pc.child_id
      WHERE pc.parent_id = ?
      AND u.school_id = ?
      AND u.role = 'student'
      AND u.is_active = true
    `;
        const result = await db.query(query, [parentId, schoolId]);
        return result[0].count > 0;
    }
    catch (error) {
        logger_service_1.logger.error('Error checking parent school access', {
            parentId,
            schoolId,
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
        });
        return false;
    }
}
const validateSchoolOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHENTICATED'
            });
            return;
        }
        const userRole = req.user.role;
        const userSchoolId = req.user.schoolId || undefined;
        const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body.schoolId;
        if (!['school_admin', 'admin', 'super_admin'].includes(userRole)) {
            res.status(403).json({
                success: false,
                message: 'School admin privileges required',
                error: 'INSUFFICIENT_PRIVILEGES'
            });
            return;
        }
        if (userRole === 'school_admin' && userSchoolId !== requestedSchoolId) {
            res.status(403).json({
                success: false,
                message: 'Can only manage your own school',
                error: 'SCHOOL_OWNERSHIP_REQUIRED'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('School ownership validation error', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            stack: (error instanceof Error ? error.stack : undefined),
            path: req.path,
            method: req.method,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'MIDDLEWARE_ERROR'
        });
        return;
    }
};
exports.validateSchoolOwnership = validateSchoolOwnership;
const validateCrossSchoolAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHENTICATED'
            });
            return;
        }
        const userRole = req.user.role;
        if (!['admin', 'super_admin'].includes(userRole)) {
            res.status(403).json({
                success: false,
                message: 'Cross-school access requires admin privileges',
                error: 'CROSS_SCHOOL_ACCESS_DENIED'
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('Cross-school access validation error', {
            error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
            stack: (error instanceof Error ? error.stack : undefined),
            path: req.path,
            method: req.method,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'MIDDLEWARE_ERROR'
        });
        return;
    }
};
exports.validateCrossSchoolAccess = validateCrossSchoolAccess;
//# sourceMappingURL=school-access.middleware.js.map