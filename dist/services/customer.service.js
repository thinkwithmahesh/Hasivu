"use strict";
/**
 * Customer Service for HASIVU Platform
 * Handles customer management, relationships, and business operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_service_1 = require("../shared/database.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class CustomerService {
    static instance;
    db = database_service_1.DatabaseService.getInstance();
    logger = logger_1.Logger.getInstance();
    constructor() { }
    static getInstance() {
        if (!CustomerService.instance) {
            CustomerService.instance = new CustomerService();
        }
        return CustomerService.instance;
    }
    /**
     * Get customer profile by user ID
     */
    async getCustomerProfile(userId) {
        try {
            const user = await this.db.getPrismaClient().user.findUnique({
                where: { id: userId },
                include: {
                    children: {
                        include: {
                            school: true,
                            rfidCards: true
                        }
                    },
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    paymentMethods: {
                        where: { isActive: true },
                        orderBy: { isDefault: 'desc' }
                    }
                }
            });
            if (!user) {
                return null;
            }
            return this.mapToCustomerProfile(user);
        }
        catch (error) {
            this.logger.error('Error fetching customer profile', { userId, error });
            throw error;
        }
    }
    /**
     * Update customer preferences
     */
    async updateCustomerPreferences(userId, preferences) {
        try {
            const user = await this.db.getPrismaClient().user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new errors_1.NotFoundError('Customer', userId);
            }
            const updatedUser = await this.db.getPrismaClient().user.update({
                where: { id: userId },
                data: {
                    preferences: {
                        ...(user.preferences || {}),
                        ...preferences
                    },
                    updatedAt: new Date()
                },
                include: {
                    children: {
                        include: {
                            school: true,
                            rfidCards: true
                        }
                    },
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    paymentMethods: {
                        where: { isActive: true },
                        orderBy: { isDefault: 'desc' }
                    }
                }
            });
            return this.mapToCustomerProfile(updatedUser);
        }
        catch (error) {
            this.logger.error('Error updating customer preferences', { userId, preferences, error });
            throw error;
        }
    }
    /**
     * Add child to customer profile
     */
    async addChild(userId, childData) {
        try {
            const customer = await this.db.getPrismaClient().user.findUnique({
                where: { id: userId }
            });
            if (!customer) {
                throw new errors_1.NotFoundError('Customer', userId);
            }
            if (customer.role !== 'parent') {
                throw new errors_1.BusinessLogicError('Only parent users can add children', 'role_restriction');
            }
            const child = await this.db.getPrismaClient().user.create({
                data: {
                    email: `child_${Date.now()}@${childData.schoolId}.edu`,
                    firstName: childData.name,
                    role: 'student',
                    parentId: userId,
                    schoolId: childData.schoolId,
                    grade: childData.grade,
                    passwordHash: 'temp_hash', // Child accounts managed by parent
                    preferences: JSON.stringify({
                        dietary: childData.dietary,
                        allergens: childData.allergens
                    })
                },
                include: {
                    school: true,
                    rfidCards: true
                }
            });
            return this.mapToChildProfile(child);
        }
        catch (error) {
            this.logger.error('Error adding child to customer', { userId, childData, error });
            throw error;
        }
    }
    /**
     * Get customer metrics and analytics
     */
    async getCustomerMetrics(userId) {
        try {
            const orders = await this.db.getPrismaClient().order.findMany({
                where: { userId },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });
            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
            const lastOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const itemFrequency = {};
            orders.forEach(order => {
                order.orderItems.forEach(item => {
                    if (item.menuItem) {
                        itemFrequency[item.menuItem.name] = (itemFrequency[item.menuItem.name] || 0) + item.quantity;
                    }
                });
            });
            const favoriteItems = Object.entries(itemFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name]) => name);
            return {
                totalOrders,
                totalSpent,
                averageOrderValue,
                lastOrderDate: lastOrder?.createdAt,
                favoriteItems
            };
        }
        catch (error) {
            this.logger.error('Error fetching customer metrics', { userId, error });
            throw error;
        }
    }
    /**
     * Search customers with filters
     */
    async searchCustomers(filters, limit = 50, offset = 0) {
        try {
            const whereClause = {
                ...(filters.role && { role: filters.role }),
                ...(filters.schoolId && {
                    children: {
                        some: { schoolId: filters.schoolId }
                    }
                }),
                ...(filters.registrationDateFrom && {
                    createdAt: { gte: filters.registrationDateFrom }
                }),
                ...(filters.registrationDateTo && {
                    createdAt: { lte: filters.registrationDateTo }
                }),
                ...(filters.hasActiveSubscription && {
                    subscriptions: {
                        some: { status: 'ACTIVE' }
                    }
                }),
                ...(filters.hasChildren && {
                    children: {
                        some: {}
                    }
                })
            };
            const [users, total] = await Promise.all([
                this.db.getPrismaClient().user.findMany({
                    where: whereClause,
                    include: {
                        children: {
                            include: {
                                school: true,
                                rfidCards: true
                            }
                        },
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        },
                        paymentMethods: {
                            where: { isActive: true },
                            orderBy: { isDefault: 'desc' }
                        }
                    },
                    skip: offset,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                this.db.getPrismaClient().user.count({ where: whereClause })
            ]);
            const customers = users.map(user => this.mapToCustomerProfile(user));
            return { customers, total };
        }
        catch (error) {
            this.logger.error('Error searching customers', { filters, error });
            throw error;
        }
    }
    /**
     * Deactivate customer account
     */
    async deactivateCustomer(userId, reason) {
        try {
            await this.db.getPrismaClient().$transaction(async (tx) => {
                // Update user status
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        isActive: false,
                        updatedAt: new Date()
                    }
                });
                // Cancel active subscriptions
                await tx.subscription.updateMany({
                    where: {
                        userId,
                        status: 'ACTIVE'
                    },
                    data: {
                        status: 'CANCELLED',
                        updatedAt: new Date()
                    }
                });
                // Log deactivation
                await tx.auditLog.create({
                    data: {
                        userId,
                        entityType: 'USER',
                        entityId: userId,
                        action: 'CUSTOMER_DEACTIVATED',
                        metadata: JSON.stringify({ reason }),
                        createdById: userId // System action, user is the creator
                    }
                });
            });
            this.logger.info('Customer account deactivated', { userId, reason });
        }
        catch (error) {
            this.logger.error('Error deactivating customer', { userId, reason, error });
            throw error;
        }
    }
    /**
     * Map database user to customer profile
     */
    mapToCustomerProfile(user) {
        const activeSubscription = user.subscriptions?.[0];
        return {
            id: user.id,
            userId: user.id,
            preferences: {
                dietary: user.preferences?.dietary || [],
                allergens: user.preferences?.allergens || [],
                notifications: user.preferences?.notifications ?? true,
                language: user.preferences?.language || 'en'
            },
            subscription: {
                plan: activeSubscription?.plan || 'basic',
                status: activeSubscription?.status?.toLowerCase() || 'cancelled',
                renewalDate: activeSubscription?.renewalDate
            },
            paymentMethods: user.paymentMethods?.map((pm) => ({
                id: pm.id,
                type: pm.type,
                last4: pm.last4,
                isDefault: pm.isDefault,
                isActive: pm.isActive
            })) || [],
            children: user.children?.map((child) => this.mapToChildProfile(child)) || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
    /**
     * Map database child to child profile
     */
    mapToChildProfile(child) {
        const preferences = typeof child.preferences === 'string' ? JSON.parse(child.preferences) : child.preferences || {};
        return {
            id: child.id,
            name: child.firstName || child.name,
            schoolId: child.schoolId,
            grade: child.grade,
            dietary: preferences.dietary || [],
            allergens: preferences.allergens || [],
            rfidCardId: child.rfidCards?.[0]?.id
        };
    }
}
exports.CustomerService = CustomerService;
