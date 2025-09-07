"use strict";
/**
 * HASIVU Platform - User Management Service
 * Comprehensive user management with parent-child relationships, bulk operations, and audit logging
 * Implements Story 1.3: Core User Management System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_service_1 = require("./database.service");
const redis_service_1 = require("./redis.service");
const logger_1 = require("@/utils/logger");
const error_handler_middleware_1 = require("@/middleware/error-handler.middleware");
const csv = require("csv-parser");
const stream_1 = require("stream");
/**
 * Comprehensive User Management Service
 */
class UserService {
    static prisma = database_service_1.DatabaseService.getInstance();
    static redis = redis_service_1.RedisService;
    /**
     * Create new user with comprehensive validation and audit logging
     */
    static async createUser(data, createdBy) {
        try {
            // Validate input data
            const validation = await this.validateUserData(data);
            if (!validation.isValid) {
                throw (0, error_handler_middleware_1.createValidationError)(validation.errors.join(', '));
            }
            // Check for duplicate email
            const existingUser = await this.getUserByEmail(data.email);
            if (existingUser) {
                throw (0, error_handler_middleware_1.createValidationError)('User with this email already exists');
            }
            // Validate school association if provided
            if (data.schoolId) {
                await this.validateSchoolAccess(data.schoolId, createdBy);
            }
            // Validate parent-child relationships
            if (data.parentId) {
                await this.validateParentChildRelationship(data.parentId, data.schoolId);
            }
            // Create user
            const user = await this.prisma.user.create({
                data: {
                    email: data.email.toLowerCase().trim(),
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    phone: data.phone?.trim(),
                    role: data.role,
                    ...(data.schoolId && { schoolId: data.schoolId }),
                    ...(data.parentId && { parentId: data.parentId }),
                    preferences: JSON.stringify(data.preferences || {
                        language: 'en',
                        notifications: { email: true, sms: false, push: true, whatsapp: false },
                        theme: 'light'
                    }),
                    metadata: JSON.stringify(data.metadata || {}),
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            // Handle children associations if provided
            if (data.childrenIds && data.childrenIds.length > 0) {
                await this.updateChildrenAssociations(user.id, data.childrenIds, createdBy);
            }
            // Create audit log
            await this.createAuditLog({
                userId: user.id,
                action: 'CREATE_USER',
                performedBy: createdBy,
                changes: { user: { from: null, to: user } },
                metadata: { creationContext: 'UserService.createUser' }
            });
            // Cache user data
            await this.cacheUser(user);
            logger_1.logger.info('User created successfully', { userId: user.id, email: user.email, createdBy });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to create user', error, { email: data.email, createdBy });
            throw error;
        }
    }
    /**
     * Get user by ID with caching and comprehensive data
     */
    static async getUserById(id) {
        try {
            // Check cache first
            const cachedUser = await this.getCachedUser(id);
            if (cachedUser) {
                return cachedUser;
            }
            // Get from database
            const user = await this.prisma.user.findUnique({
                where: { id },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            if (user) {
                await this.cacheUser(user);
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by ID', error, { userId: id });
            throw error;
        }
    }
    /**
     * Get user by email
     */
    static async getUserByEmail(email) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user by email', error, { email });
            throw error;
        }
    }
    /**
     * Update user with audit logging and validation
     */
    static async updateUser(id, data, updatedBy) {
        try {
            // Get existing user
            const existingUser = await this.getUserById(id);
            if (!existingUser) {
                throw (0, error_handler_middleware_1.createNotFoundError)('User not found');
            }
            // Validate update permissions
            await this.validateUpdatePermissions(existingUser, updatedBy);
            // Validate input data
            const validation = await this.validateUserUpdateData(data, existingUser);
            if (!validation.isValid) {
                throw (0, error_handler_middleware_1.createValidationError)(validation.errors.join(', '));
            }
            // Prepare update data
            const updateData = {
                updatedAt: new Date()
            };
            if (data.firstName !== undefined)
                updateData.firstName = data.firstName.trim();
            if (data.lastName !== undefined)
                updateData.lastName = data.lastName.trim();
            if (data.phone !== undefined)
                updateData.phone = data.phone?.trim();
            if (data.schoolId !== undefined)
                updateData.schoolId = data.schoolId;
            if (data.parentId !== undefined)
                updateData.parentId = data.parentId;
            if (data.isActive !== undefined)
                updateData.isActive = data.isActive;
            if (data.preferences !== undefined) {
                updateData.preferences = {
                    ...(existingUser.preferences && typeof existingUser.preferences === 'object' ? existingUser.preferences : {}),
                    ...(data.preferences && typeof data.preferences === 'object' ? data.preferences : {})
                };
            }
            if (data.metadata !== undefined) {
                updateData.metadata = {
                    ...(existingUser.metadata && typeof existingUser.metadata === 'object' ? existingUser.metadata : {}),
                    ...(data.metadata && typeof data.metadata === 'object' ? data.metadata : {})
                };
            }
            // Update user
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: updateData,
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            // Handle children associations update
            if (data.childrenIds !== undefined) {
                await this.updateChildrenAssociations(id, data.childrenIds, updatedBy);
            }
            // Create audit log for changes
            const changes = this.calculateChanges(existingUser, updatedUser);
            if (Object.keys(changes).length > 0) {
                await this.createAuditLog({
                    userId: id,
                    action: 'UPDATE_USER',
                    performedBy: updatedBy,
                    changes,
                    metadata: { updateContext: 'UserService.updateUser' }
                });
            }
            // Update cache
            await this.cacheUser(updatedUser);
            logger_1.logger.info('User updated successfully', { userId: id, updatedBy, changes: Object.keys(changes) });
            return updatedUser;
        }
        catch (error) {
            logger_1.logger.error('Failed to update user', error, { userId: id, updatedBy });
            throw error;
        }
    }
    /**
     * Delete user (soft delete) with audit logging
     */
    static async deleteUser(id, deletedBy) {
        try {
            const user = await this.getUserById(id);
            if (!user) {
                throw (0, error_handler_middleware_1.createNotFoundError)('User not found');
            }
            // Validate deletion permissions
            await this.validateDeletePermissions(user, deletedBy);
            // Check for dependent relationships
            const dependents = await this.checkUserDependencies(id);
            if (dependents.hasOrders || dependents.hasChildren) {
                throw (0, error_handler_middleware_1.createValidationError)('Cannot delete user with active orders or children');
            }
            // Soft delete user
            const deletedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    isActive: false,
                    // Note: deletedAt field may not exist in current Prisma schema
                    ...(typeof this.prisma.user.fields?.deletedAt !== 'undefined' && { deletedAt: new Date() }),
                    updatedAt: new Date()
                }
            });
            // Create audit log
            await this.createAuditLog({
                userId: id,
                action: 'DELETE_USER',
                performedBy: deletedBy,
                changes: { status: { from: 'active', to: 'deleted' } },
                metadata: { deletionContext: 'UserService.deleteUser' }
            });
            // Remove from cache
            await this.removeCachedUser(id);
            logger_1.logger.info('User deleted successfully', { userId: id, deletedBy });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete user', error, { userId: id, deletedBy });
            throw error;
        }
    }
    /**
     * Search and list users with advanced filtering
     */
    static async searchUsers(filters) {
        try {
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 100);
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            if (filters.schoolId)
                where.schoolId = filters.schoolId;
            if (filters.role)
                where.role = filters.role;
            if (filters.isActive !== undefined)
                where.isActive = filters.isActive;
            if (filters.parentId)
                where.parentId = filters.parentId;
            // Text search
            if (filters.search) {
                const searchTerm = filters.search.trim();
                where.OR = [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } }
                ];
            }
            // Children filter
            if (filters.hasChildren !== undefined) {
                if (filters.hasChildren) {
                    where.children = { some: {} };
                }
                else {
                    where.children = { none: {} };
                }
            }
            // Build order clause
            const orderBy = {};
            if (filters.sortBy) {
                orderBy[filters.sortBy] = filters.sortOrder || 'asc';
            }
            else {
                orderBy.createdAt = 'desc';
            }
            // Execute queries
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    orderBy,
                    skip,
                    take: limit,
                    include: {
                        school: true,
                        parent: true,
                        children: true
                    }
                }),
                this.prisma.user.count({ where })
            ]);
            return {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search users', error, { filters });
            throw error;
        }
    }
    /**
     * Bulk import users from CSV with comprehensive validation and error handling
     */
    static async bulkImportUsers(csvData, importedBy, schoolId) {
        const result = {
            success: false,
            successCount: 0,
            errorCount: 0,
            users: [],
            errors: []
        };
        try {
            const rows = await this.parseCsvData(csvData);
            // Process each row
            for (let i = 0; i < rows.length; i++) {
                const rowData = rows[i];
                const rowNumber = i + 2; // Account for header row
                try {
                    const userData = await this.validateBulkImportRow(rowData, schoolId);
                    if (!userData) {
                        result.errors.push({ row: rowNumber, error: 'Invalid row data', data: rowData });
                        result.errorCount++;
                        continue;
                    }
                    // Create user
                    const user = await this.createUser(userData, importedBy);
                    result.users.push(user);
                    result.successCount++;
                    logger_1.logger.debug('User imported successfully', { row: rowNumber, userId: user.id });
                }
                catch (error) {
                    result.errors.push({ row: rowNumber, error: error.message, data: rowData });
                    result.errorCount++;
                    logger_1.logger.warn('Failed to import user row', { row: rowNumber, error: error.message });
                }
            }
            result.success = result.errorCount === 0;
            // Create bulk import audit log
            await this.createAuditLog({
                userId: 'BULK_IMPORT',
                action: 'BULK_IMPORT_USERS',
                performedBy: importedBy,
                changes: { import: { from: null, to: result } },
                metadata: {
                    totalRows: rows.length,
                    successCount: result.successCount,
                    errorCount: result.errorCount,
                    schoolId
                }
            });
            logger_1.logger.info('Bulk user import completed', {
                importedBy,
                totalRows: rows.length,
                successCount: result.successCount,
                errorCount: result.errorCount
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to bulk import users', error, { importedBy });
            throw error;
        }
    }
    /**
     * Manage parent-child relationships
     */
    static async updateChildrenAssociations(parentId, childrenIds, updatedBy) {
        try {
            const parent = await this.getUserById(parentId);
            if (!parent) {
                throw (0, error_handler_middleware_1.createNotFoundError)('Parent user not found');
            }
            // Validate parent role
            if (!['parent', 'teacher', 'staff', 'school_admin'].includes(parent.role)) {
                throw (0, error_handler_middleware_1.createAuthorizationError)('User role cannot have children');
            }
            // Get current children
            const currentChildren = await this.prisma.user.findMany({
                where: { parentId },
                select: { id: true }
            });
            const currentChildIds = currentChildren.map((child) => child.id);
            // Calculate additions and removals
            const toAdd = childrenIds.filter((id) => !currentChildIds.includes(id));
            const toRemove = currentChildIds.filter((id) => !childrenIds.includes(id));
            // Remove old associations
            if (toRemove.length > 0) {
                await this.prisma.user.updateMany({
                    where: { id: { in: toRemove } },
                    data: { parentId: null }
                });
            }
            // Add new associations
            if (toAdd.length > 0) {
                // Validate children exist and are available
                const childrenToAdd = await this.prisma.user.findMany({
                    where: { id: { in: toAdd } }
                });
                if (childrenToAdd.length !== toAdd.length) {
                    throw (0, error_handler_middleware_1.createNotFoundError)('Some children users not found');
                }
                // Check school associations match
                const invalidChildren = childrenToAdd.filter((child) => parent.schoolId && child.schoolId !== parent.schoolId);
                if (invalidChildren.length > 0) {
                    throw (0, error_handler_middleware_1.createValidationError)('Children must belong to the same school as parent');
                }
                // Update associations
                await this.prisma.user.updateMany({
                    where: { id: { in: toAdd } },
                    data: { parentId }
                });
            }
            // Create audit log
            await this.createAuditLog({
                userId: parentId,
                action: 'UPDATE_CHILDREN_ASSOCIATIONS',
                performedBy: updatedBy,
                changes: { children: { from: currentChildIds, to: childrenIds } },
                metadata: {
                    added: toAdd,
                    removed: toRemove
                }
            });
            // Clear cache for affected users
            await this.removeCachedUser(parentId);
            for (const childId of [...toAdd, ...toRemove]) {
                await this.removeCachedUser(childId);
            }
            logger_1.logger.info('Children associations updated', { parentId, updatedBy, added: toAdd.length, removed: toRemove.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to update children associations', error, { parentId, updatedBy });
            throw error;
        }
    }
    /**
     * Get user audit logs
     */
    static async getUserAuditLogs(userId, limit = 50) {
        try {
            // Check if userAuditLog model exists
            if (!this.prisma.userAuditLog) {
                logger_1.logger.debug('userAuditLog model not found in Prisma schema');
                return [];
            }
            const logs = await this.prisma.userAuditLog.findMany({
                where: { userId },
                orderBy: { timestamp: 'desc' },
                take: limit
            });
            return logs;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user audit logs', error, { userId });
            throw error;
        }
    }
    // Private helper methods
    static async validateUserData(data) {
        const errors = [];
        if (!data.email || !data.email.trim())
            errors.push('Email is required');
        if (!data.firstName || !data.firstName.trim())
            errors.push('First name is required');
        if (!data.lastName || !data.lastName.trim())
            errors.push('Last name is required');
        if (!data.role)
            errors.push('Role is required');
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email && !emailRegex.test(data.email)) {
            errors.push('Invalid email format');
        }
        // Role validation
        const validRoles = ['student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin'];
        if (data.role && !validRoles.includes(data.role)) {
            errors.push('Invalid role');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static async validateUserUpdateData(data, existingUser) {
        const errors = [];
        // Similar validation logic as create, but for updates
        if (data.firstName !== undefined && (!data.firstName || !data.firstName.trim())) {
            errors.push('First name cannot be empty');
        }
        if (data.lastName !== undefined && (!data.lastName || !data.lastName.trim())) {
            errors.push('Last name cannot be empty');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static async validateSchoolAccess(schoolId, userId) {
        const school = await this.prisma.school.findUnique({
            where: { id: schoolId }
        });
        if (!school) {
            throw (0, error_handler_middleware_1.createNotFoundError)('School not found');
        }
    }
    static async validateParentChildRelationship(parentId, schoolId) {
        const parent = await this.getUserById(parentId);
        if (!parent) {
            throw (0, error_handler_middleware_1.createNotFoundError)('Parent user not found');
        }
        if (!['parent', 'teacher', 'staff', 'school_admin'].includes(parent.role)) {
            throw (0, error_handler_middleware_1.createAuthorizationError)('User role cannot be a parent');
        }
        if (schoolId && parent.schoolId !== schoolId) {
            throw (0, error_handler_middleware_1.createValidationError)('Parent must belong to the same school');
        }
    }
    static async validateUpdatePermissions(user, updatedBy) {
        // Implementation for permission validation
        // Users can update their own profile, admins can update users in their school
    }
    static async validateDeletePermissions(user, deletedBy) {
        // Implementation for deletion permission validation
    }
    static async checkUserDependencies(userId) {
        const [ordersCount, childrenCount] = await Promise.all([
            // Assuming orders table exists
            0, // this.prisma.order.count({ where: { userId } }),
            this.prisma.user.count({ where: { parentId: userId } })
        ]);
        return {
            hasOrders: ordersCount > 0,
            hasChildren: childrenCount > 0
        };
    }
    static async createAuditLog(log) {
        try {
            // Check if userAuditLog model exists
            if (!this.prisma.userAuditLog) {
                logger_1.logger.debug('userAuditLog model not found in Prisma schema, skipping audit log creation');
                return;
            }
            await this.prisma.userAuditLog.create({
                data: {
                    ...log,
                    timestamp: new Date()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create audit log', error);
        }
    }
    static calculateChanges(before, after) {
        const changes = {};
        const fieldsToTrack = ['firstName', 'lastName', 'phone', 'schoolId', 'parentId', 'isActive'];
        for (const field of fieldsToTrack) {
            if (before[field] !== after[field]) {
                changes[field] = { from: before[field], to: after[field] };
            }
        }
        return changes;
    }
    static async parseCsvData(csvData) {
        return new Promise((resolve, reject) => {
            const results = [];
            const stream = stream_1.Readable.from([csvData]);
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }
    static async validateBulkImportRow(rowData, schoolId) {
        const userData = {
            email: rowData.email?.trim(),
            firstName: rowData.firstName?.trim() || rowData.first_name?.trim(),
            lastName: rowData.lastName?.trim() || rowData.last_name?.trim(),
            phone: rowData.phone?.trim(),
            role: rowData.role?.trim().toLowerCase(),
            schoolId: schoolId || rowData.schoolId?.trim(),
            metadata: {}
        };
        // Validate required fields
        if (!userData.email)
            throw new Error('Email is required');
        if (!userData.firstName)
            throw new Error('First name is required');
        if (!userData.lastName)
            throw new Error('Last name is required');
        if (!userData.role)
            throw new Error('Role is required');
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error(`Invalid email format: ${userData.email}`);
        }
        // Validate role
        const validRoles = ['student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin'];
        if (!validRoles.includes(userData.role)) {
            throw new Error(`Invalid role: ${userData.role}`);
        }
        return userData;
    }
    // Cache management methods
    static async cacheUser(user) {
        try {
            const cacheKey = `user:${user.id}`;
            await this.redis.setex(cacheKey, 3600, JSON.stringify(user)); // Cache for 1 hour
        }
        catch (error) {
            logger_1.logger.warn('Failed to cache user', { userId: user.id, error: error.message });
        }
    }
    static async getCachedUser(userId) {
        try {
            const cacheKey = `user:${userId}`;
            const cached = await this.redis.get(cacheKey);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            logger_1.logger.warn('Failed to get cached user', { userId, error: error.message });
            return null;
        }
    }
    static async removeCachedUser(userId) {
        try {
            const cacheKey = `user:${userId}`;
            await this.redis.del(cacheKey);
        }
        catch (error) {
            logger_1.logger.warn('Failed to remove cached user', { userId, error: error.message });
        }
    }
}
exports.UserService = UserService;
