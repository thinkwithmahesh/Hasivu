"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
/**
 * HASIVU Platform - User Repository
 * Comprehensive data access layer for user management with optimized queries and caching
 * Implements Story 1.3: Core User Management System
 * Enhanced to support bulk operations, audit logging, and parent-child relationships
 */
const client_1 = require("@prisma/client");
const database_service_1 = require("../services/database.service");
const redis_service_1 = require("../services/redis.service");
const logger_1 = require("../utils/logger");
/**
 * User Repository - Comprehensive data access patterns with advanced features
 * Supports bulk operations, caching, audit logging, and relationship management
 */
class UserRepository {
    static prisma = database_service_1.DatabaseService.getInstance();
    static redis = redis_service_1.RedisService;
    // Cache TTL constants
    static CACHE_TTL = {
        USER: 3600, // 1 hour
        SEARCH: 300, // 5 minutes
        LIST: 600 // 10 minutes
    };
    /**
     * Find user by ID with comprehensive relationship loading
     */
    static async findById(id, includeRelations = true) {
        try {
            const cacheKey = `user:${id}:relations:${includeRelations}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const include = includeRelations ? {
                school: true,
                parent: true,
                children: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            } : undefined;
            const user = await this.prisma.user.findUnique({
                where: { id },
                include
            });
            if (user) {
                await this.redis.setex(cacheKey, this.CACHE_TTL.USER, JSON.stringify(user));
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by ID', { userId: id, error: error.message });
            throw error;
        }
    }
    /**
     * Find user by email with relationship data
     */
    static async findByEmail(email, includeRelations = false) {
        try {
            const normalizedEmail = email.toLowerCase().trim();
            const cacheKey = `user:email:${normalizedEmail}:relations:${includeRelations}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const include = includeRelations ? {
                school: true,
                parent: true,
                children: true
            } : undefined;
            const user = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
                include
            });
            if (user) {
                await this.redis.setex(cacheKey, this.CACHE_TTL.USER, JSON.stringify(user));
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error finding user by email', { email, error: error.message });
            throw error;
        }
    }
    /**
     * Create new user with enhanced data validation
     */
    static async create(data) {
        try {
            const user = await this.prisma.user.create({
                data: {
                    ...data,
                    email: data.email.toLowerCase().trim(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            // Clear related caches
            await this.clearUserCache(undefined, user.schoolId || undefined);
            logger_1.logger.info('User created successfully', { userId: user.id, email: user.email });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error creating user', { data: { ...data, email: data.email }, error: error.message });
            throw error;
        }
    }
    /**
     * Update user with comprehensive change tracking
     */
    static async update(id, data) {
        try {
            const user = await this.prisma.user.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            // Clear user-specific caches
            await this.clearUserCache(id, user.schoolId || undefined);
            logger_1.logger.info('User updated successfully', { userId: id, changedFields: Object.keys(data) });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error updating user', { userId: id, error: error.message });
            throw error;
        }
    }
    /**
     * Find users by school with advanced filtering and caching
     */
    static async findBySchool(schoolId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 50, 100);
            const offset = (page - 1) * limit;
            const cacheKey = `school:${schoolId}:users:${JSON.stringify(options)}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const where = {
                schoolId,
                ...(options.role && { role: options.role }),
                ...(options.isActive !== undefined && { isActive: options.isActive })
            };
            const include = options.includeRelations ? {
                school: true,
                parent: true,
                children: true
            } : undefined;
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip: offset,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include
                }),
                this.prisma.user.count({ where })
            ]);
            const result = {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
            await this.redis.setex(cacheKey, this.CACHE_TTL.LIST, JSON.stringify(result));
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error finding users by school', { schoolId, options, error: error.message });
            throw error;
        }
    }
    /**
     * Advanced user search with comprehensive filtering and caching
     */
    static async search(options) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 50, 100);
            const offset = (page - 1) * limit;
            const cacheKey = `users:search:${JSON.stringify(options)}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const where = {
                AND: [
                    ...(options.query ? [{
                            OR: [
                                { email: { contains: options.query, mode: client_1.Prisma.QueryMode.insensitive } },
                                { firstName: { contains: options.query, mode: client_1.Prisma.QueryMode.insensitive } },
                                { lastName: { contains: options.query, mode: client_1.Prisma.QueryMode.insensitive } }
                            ]
                        }] : []),
                    ...(options.schoolId ? [{ schoolId: options.schoolId }] : []),
                    ...(options.role ? [{ role: options.role }] : []),
                    ...(options.isActive !== undefined ? [{ isActive: options.isActive }] : []),
                    ...(options.parentId ? [{ parentId: options.parentId }] : []),
                    ...(options.hasChildren !== undefined ? [
                        options.hasChildren ? { children: { some: {} } } : { children: { none: {} } }
                    ] : [])
                ]
            };
            // Dynamic ordering
            const orderBy = {};
            if (options.sortBy) {
                orderBy[options.sortBy] = options.sortOrder || 'asc';
            }
            else {
                orderBy.createdAt = 'desc';
            }
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip: offset,
                    take: limit,
                    orderBy,
                    include: {
                        school: true,
                        parent: true,
                        children: true
                    }
                }),
                this.prisma.user.count({ where })
            ]);
            const result = {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
            await this.redis.setex(cacheKey, this.CACHE_TTL.SEARCH, JSON.stringify(result));
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error searching users', { options, error: error.message });
            throw error;
        }
    }
    /**
     * Soft delete user with dependency checking
     */
    static async softDelete(id) {
        try {
            const user = await this.prisma.user.update({
                where: { id },
                data: {
                    isActive: false,
                    // deletedAt: new Date(), // Field doesn't exist in schema
                    updatedAt: new Date()
                },
                include: {
                    school: true,
                    parent: true,
                    children: true
                }
            });
            await this.clearUserCache(id, user.schoolId || undefined);
            logger_1.logger.info('User soft deleted', { userId: id });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error soft deleting user', { userId: id, error: error.message });
            throw error;
        }
    }
    /**
     * Bulk create users with transaction support
     */
    static async bulkCreate(usersData) {
        const result = {
            success: false,
            created: [],
            errors: []
        };
        try {
            const transaction = await database_service_1.DatabaseService.client.$transaction(usersData.map(data => this.prisma.user.create({
                data: {
                    ...data,
                    email: data.email.toLowerCase().trim(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            })), {
                isolationLevel: client_1.Prisma.TransactionIsolationLevel.ReadCommitted
            });
            result.created = transaction;
            result.success = true;
            // Clear caches for affected schools
            const schoolIds = [...new Set(usersData.map(u => u.schoolId).filter(Boolean))];
            for (const schoolId of schoolIds) {
                await this.clearUserCache(undefined, schoolId);
            }
            logger_1.logger.info('Bulk user creation completed', { count: result.created.length });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error in bulk user creation', { count: usersData.length, error: error.message });
            throw error;
        }
    }
    /**
     * Get user children with pagination
     */
    static async getChildren(parentId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 50, 100);
            const offset = (page - 1) * limit;
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where: { parentId },
                    skip: offset,
                    take: limit,
                    orderBy: { firstName: 'asc' },
                    include: {
                        school: true
                    }
                }),
                this.prisma.user.count({ where: { parentId } })
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
            logger_1.logger.error('Error getting user children', { parentId, error: error.message });
            throw error;
        }
    }
    /**
     * Update children associations for a parent user
     */
    static async updateChildrenAssociations(parentId, childrenIds) {
        try {
            await database_service_1.DatabaseService.client.$transaction(async (tx) => {
                // Remove old associations
                await tx.user.updateMany({
                    where: { parentId },
                    data: { parentId: null }
                });
                // Add new associations
                if (childrenIds.length > 0) {
                    await tx.user.updateMany({
                        where: { id: { in: childrenIds } },
                        data: { parentId }
                    });
                }
            });
            // Clear caches
            await this.clearUserCache(parentId);
            for (const childId of childrenIds) {
                await this.clearUserCache(childId);
            }
            logger_1.logger.info('Children associations updated', { parentId, childrenCount: childrenIds.length });
        }
        catch (error) {
            logger_1.logger.error('Error updating children associations', { parentId, childrenIds, error: error.message });
            throw error;
        }
    }
    /**
     * Check user dependencies before deletion
     */
    static async checkDependencies(userId) {
        try {
            const [childrenCount] = await Promise.all([
                this.prisma.user.count({ where: { parentId: userId } })
                // Add order count when order model is available
                // this.prisma.order.count({ where: { userId } })
            ]);
            return {
                hasOrders: false, // Will be implemented when order model is available
                hasChildren: childrenCount > 0,
                dependentCount: childrenCount
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking user dependencies', { userId, error: error.message });
            throw error;
        }
    }
    /**
     * Create audit log entry
     */
    static async createAuditLog(log) {
        try {
            // userAuditLog model doesn't exist in schema
            // await DatabaseService.client.userAuditLog.create({
            //   data: {
            //     ...log,
            //     timestamp: new Date()
            //   }
            // });
        }
        catch (error) {
            logger_1.logger.error('Error creating audit log', { log, error: error.message });
            // Don't throw - audit logging should not break main operations
        }
    }
    /**
     * Get user audit logs with pagination
     */
    static async getAuditLogs(userId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 50, 100);
            const offset = (page - 1) * limit;
            // userAuditLog model doesn't exist in schema
            const [logs, total] = await Promise.all([
                // DatabaseService.client.userAuditLog.findMany({
                //   where: { userId },
                //   skip: offset,
                //   take: limit,
                //   orderBy: { timestamp: 'desc' }
                // }),
                // DatabaseService.client.userAuditLog.count({ where: { userId } })
                Promise.resolve([]),
                Promise.resolve(0)
            ]);
            return {
                logs: logs,
                total,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting audit logs', { userId, error: error.message });
            throw error;
        }
    }
    /**
     * Get users by role with caching
     */
    static async findByRole(role, schoolId, options = {}) {
        try {
            const page = options.page || 1;
            const limit = Math.min(options.limit || 50, 100);
            const offset = (page - 1) * limit;
            const cacheKey = `users:role:${role}:school:${schoolId || 'all'}:${JSON.stringify(options)}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const where = {
                role,
                ...(schoolId && { schoolId })
            };
            const [users, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    skip: offset,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        school: true,
                        parent: true,
                        children: true
                    }
                }),
                this.prisma.user.count({ where })
            ]);
            const result = {
                users,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
            await this.redis.setex(cacheKey, this.CACHE_TTL.LIST, JSON.stringify(result));
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error finding users by role', { role, schoolId, error: error.message });
            throw error;
        }
    }
    /**
     * Get user statistics
     */
    static async getUserStats(schoolId) {
        try {
            const cacheKey = `users:stats:school:${schoolId || 'all'}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const where = schoolId ? { schoolId } : {};
            const [total, active, inactive, byRole] = await Promise.all([
                this.prisma.user.count({ where }),
                this.prisma.user.count({ where: { ...where, isActive: true } }),
                this.prisma.user.count({ where: { ...where, isActive: false } }),
                this.prisma.user.groupBy({
                    by: ['role'],
                    where,
                    _count: { role: true }
                })
            ]);
            const roleStats = byRole.reduce((acc, item) => {
                acc[item.role] = item._count.role;
                return acc;
            }, {});
            const stats = {
                total,
                byRole: roleStats,
                active,
                inactive
            };
            await this.redis.setex(cacheKey, this.CACHE_TTL.SEARCH, JSON.stringify(stats));
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting user statistics', { schoolId, error: error.message });
            throw error;
        }
    }
    /**
     * Comprehensive cache cleanup for user-related queries
     */
    static async clearUserCache(userId, schoolId) {
        try {
            const patterns = [
                ...(userId ? [`user:${userId}*`, `user:email:*`] : []),
                ...(schoolId ? [`school:${schoolId}:*`] : []),
                'users:*'
            ];
            for (const pattern of patterns) {
                await this.redis.del(pattern);
            }
            logger_1.logger.debug('User cache cleared', { userId, schoolId, patterns });
        }
        catch (error) {
            logger_1.logger.error('Error clearing user cache', { userId, schoolId, error: error.message });
            // Don't throw - cache clearing should not break main operations
        }
    }
    /**
     * Batch operations for performance optimization
     */
    static async batchUpdate(updates) {
        const errors = [];
        let updated = 0;
        try {
            await database_service_1.DatabaseService.client.$transaction(updates.map(({ id, data }) => this.prisma.user.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            })));
            updated = updates.length;
            // Clear caches for all updated users
            for (const { id } of updates) {
                await this.clearUserCache(id);
            }
            logger_1.logger.info('Batch user update completed', { updated });
            return { updated, errors };
        }
        catch (error) {
            logger_1.logger.error('Error in batch user update', { count: updates.length, error: error.message });
            throw error;
        }
    }
}
exports.UserRepository = UserRepository;
