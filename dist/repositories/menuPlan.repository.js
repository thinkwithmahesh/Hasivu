"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuPlanRepository = void 0;
/**
 * HASIVU Platform - Menu Plan Repository
 * Data access layer for menu planning system
 * Implements Story 2.2: Menu Planning and Scheduling
 */
const client_1 = require("@prisma/client");
const database_service_1 = require("../functions/shared/database.service");
/**
 * MenuPlanRepository - Data access layer for menu plans
 */
class MenuPlanRepository {
    static prisma = database_service_1.DatabaseService.client;
    /**
     * Create new menu plan
     */
    static async create(data) {
        const createData = {
            name: data.name.trim(),
            description: data.description?.trim(),
            startDate: data.startDate,
            endDate: data.endDate,
            isTemplate: data.isTemplate || false,
            isRecurring: data.isRecurring || false,
            status: data.status || 'DRAFT',
            approvalWorkflow: JSON.stringify(data.approvalWorkflow || {}),
            recurringPattern: data.recurringPattern ? JSON.stringify(data.recurringPattern) : null,
            templateCategory: data.templateCategory,
            metadata: JSON.stringify(data.metadata || {}),
            createdBy: data.createdBy,
            school: { connect: { id: data.schoolId } }
        };
        return await this.prisma.menuPlan.create({
            data: createData,
            include: {
                dailyMenus: {
                    include: {
                        menuItems: {
                            include: {
                                menuItem: true
                            },
                            orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                        }
                    },
                    orderBy: { date: client_1.Prisma.SortOrder.asc }
                },
                approvals: {
                    orderBy: { createdAt: client_1.Prisma.SortOrder.desc }
                }
            }
        });
    }
    /**
     * Find menu plan by ID
     */
    static async findById(id, includeDetails = true) {
        const include = includeDetails ? {
            dailyMenus: {
                include: {
                    menuItems: {
                        include: {
                            menuItem: true
                        },
                        orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                    }
                },
                orderBy: { date: client_1.Prisma.SortOrder.asc }
            },
            approvals: {
                orderBy: { createdAt: client_1.Prisma.SortOrder.desc }
            }
        } : undefined;
        return await this.prisma.menuPlan.findUnique({
            where: { id },
            include
        });
    }
    /**
     * Find menu plans with filters and pagination
     */
    static async findMany(options = {}) {
        const { filters = {}, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Build where clause
        const where = {};
        if (filters.schoolId)
            where.schoolId = filters.schoolId;
        if (filters.status)
            where.status = filters.status;
        if (filters.isTemplate !== undefined)
            where.isTemplate = filters.isTemplate;
        if (filters.isRecurring !== undefined)
            where.isRecurring = filters.isRecurring;
        if (filters.templateCategory)
            where.templateCategory = filters.templateCategory;
        if (filters.createdBy)
            where.createdBy = filters.createdBy;
        if (filters.dateFrom || filters.dateTo) {
            where.OR = [
                {
                    startDate: {
                        ...(filters.dateFrom && { gte: filters.dateFrom }),
                        ...(filters.dateTo && { lte: filters.dateTo })
                    }
                },
                {
                    endDate: {
                        ...(filters.dateFrom && { gte: filters.dateFrom }),
                        ...(filters.dateTo && { lte: filters.dateTo })
                    }
                }
            ];
        }
        // Calculate pagination
        const skip = (page - 1) * limit;
        // Build sort clause
        const orderBy = {};
        if (sortBy === 'name')
            orderBy.name = sortOrder;
        else if (sortBy === 'startDate')
            orderBy.startDate = sortOrder;
        else if (sortBy === 'endDate')
            orderBy.endDate = sortOrder;
        else if (sortBy === 'status')
            orderBy.status = sortOrder;
        else
            orderBy.createdAt = sortOrder;
        // Execute queries
        const [plans, total] = await Promise.all([
            this.prisma.menuPlan.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    dailyMenus: {
                        include: {
                            menuItems: {
                                include: {
                                    menuItem: true
                                },
                                orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                            }
                        },
                        orderBy: { date: client_1.Prisma.SortOrder.asc }
                    },
                    approvals: {
                        orderBy: { createdAt: client_1.Prisma.SortOrder.desc }
                    }
                }
            }),
            this.prisma.menuPlan.count({ where })
        ]);
        return {
            plans,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    }
    /**
     * Update menu plan
     */
    static async update(id, data) {
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.startDate)
            updateData.startDate = data.startDate;
        if (data.endDate)
            updateData.endDate = data.endDate;
        if (data.isTemplate !== undefined)
            updateData.isTemplate = data.isTemplate;
        if (data.isRecurring !== undefined)
            updateData.isRecurring = data.isRecurring;
        if (data.status)
            updateData.status = data.status;
        if (data.approvalWorkflow)
            updateData.approvalWorkflow = JSON.stringify(data.approvalWorkflow);
        if (data.recurringPattern)
            updateData.recurringPattern = JSON.stringify(data.recurringPattern);
        if (data.templateCategory !== undefined)
            updateData.templateCategory = data.templateCategory;
        if (data.metadata)
            updateData.metadata = JSON.stringify(data.metadata);
        return await this.prisma.menuPlan.update({
            where: { id },
            data: updateData,
            include: {
                dailyMenus: {
                    include: {
                        menuItems: {
                            include: {
                                menuItem: true
                            },
                            orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                        }
                    },
                    orderBy: { date: client_1.Prisma.SortOrder.asc }
                },
                approvals: {
                    orderBy: { createdAt: client_1.Prisma.SortOrder.desc }
                }
            }
        });
    }
    /**
     * Delete menu plan
     */
    static async delete(id) {
        return await this.prisma.menuPlan.delete({
            where: { id }
        });
    }
    /**
     * Get templates by category
     */
    static async getTemplates(schoolId, category) {
        const where = {
            schoolId,
            isTemplate: true,
            ...(category && { templateCategory: category })
        };
        return await this.prisma.menuPlan.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                dailyMenus: {
                    include: {
                        menuItems: {
                            include: {
                                menuItem: true
                            },
                            orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                        }
                    },
                    orderBy: { date: client_1.Prisma.SortOrder.asc }
                }
            }
        });
    }
    /**
     * Get active menu plans for date range
     */
    static async getActivePlansForDateRange(schoolId, startDate, endDate) {
        const where = {
            schoolId,
            status: { in: ['APPROVED', 'PUBLISHED', 'ACTIVE'] },
            OR: [
                {
                    AND: [
                        { startDate: { lte: endDate } },
                        { endDate: { gte: startDate } }
                    ]
                }
            ]
        };
        return await this.prisma.menuPlan.findMany({
            where,
            orderBy: { startDate: 'asc' },
            include: {
                dailyMenus: {
                    include: {
                        menuItems: {
                            where: { isVisible: true },
                            include: {
                                menuItem: true
                            },
                            orderBy: { displayOrder: client_1.Prisma.SortOrder.asc }
                        }
                    },
                    orderBy: { date: client_1.Prisma.SortOrder.asc }
                }
            }
        });
    }
    /**
     * Check for overlapping menu plans
     */
    static async findOverlapping(schoolId, startDate, endDate, excludeId) {
        const where = {
            schoolId,
            ...(excludeId && { id: { not: excludeId } }),
            OR: [
                {
                    AND: [
                        { startDate: { lte: endDate } },
                        { endDate: { gte: startDate } }
                    ]
                }
            ]
        };
        return await this.prisma.menuPlan.findMany({
            where,
            orderBy: { startDate: 'asc' }
        });
    }
    /**
     * Update menu plan status
     */
    static async updateStatus(id, status, approvedBy) {
        const updateData = {
            status
        };
        if (approvedBy) {
            updateData.approvedBy = approvedBy;
            updateData.approvedAt = new Date();
        }
        return await this.prisma.menuPlan.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * Get menu plan statistics
     */
    static async getStatistics(schoolId) {
        const where = schoolId ? { schoolId } : {};
        const [total, active, templates, pendingApproval, statusGroups] = await Promise.all([
            this.prisma.menuPlan.count({ where }),
            this.prisma.menuPlan.count({
                where: { ...where, status: { in: ['APPROVED', 'PUBLISHED', 'ACTIVE'] } }
            }),
            this.prisma.menuPlan.count({
                where: { ...where, isTemplate: true }
            }),
            this.prisma.menuPlan.count({
                where: { ...where, status: 'PENDING_APPROVAL' }
            }),
            this.prisma.menuPlan.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            })
        ]);
        const byStatus = {};
        statusGroups.forEach(group => {
            byStatus[group.status] = group._count.status;
        });
        return {
            total,
            active,
            templates,
            pendingApproval,
            byStatus
        };
    }
    /**
     * Clone menu plan as template
     */
    static async cloneAsTemplate(sourceId, templateData) {
        return await this.prisma.$transaction(async (tx) => {
            const source = await tx.menuPlan.findUnique({
                where: { id: sourceId },
                include: {
                    dailyMenus: {
                        include: {
                            menuItems: {
                                include: {
                                    menuItem: true
                                }
                            }
                        }
                    }
                }
            });
            if (!source) {
                throw new Error('Source menu plan not found');
            }
            const template = await tx.menuPlan.create({
                data: {
                    name: templateData.name,
                    description: templateData.description || source.description,
                    schoolId: source.schoolId,
                    startDate: source.startDate,
                    endDate: source.endDate,
                    isTemplate: true,
                    isRecurring: source.isRecurring,
                    approvalWorkflow: source.approvalWorkflow,
                    recurringPattern: source.recurringPattern,
                    templateCategory: templateData.templateCategory,
                    metadata: source.metadata,
                    createdBy: templateData.createdBy
                }
            });
            // Clone daily menus and their items
            if (source.dailyMenus && source.dailyMenus.length > 0) {
                for (const dailyMenu of source.dailyMenus) {
                    const newDailyMenu = await tx.dailyMenu.create({
                        data: {
                            menuPlanId: template.id,
                            date: dailyMenu.date,
                            dayType: dailyMenu.dayType || 'WEEKDAY',
                            isActive: dailyMenu.isActive !== false,
                            metadata: dailyMenu.metadata || '{}'
                        }
                    });
                    // Clone menu item slots
                    if (dailyMenu.menuItems && dailyMenu.menuItems.length > 0) {
                        await tx.menuItemSlot.createMany({
                            data: dailyMenu.menuItems.map(item => ({
                                dailyMenuId: newDailyMenu.id,
                                menuItemId: item.menuItemId,
                                category: item.category || 'LUNCH',
                                displayOrder: item.displayOrder || 0,
                                isVisible: item.isVisible !== false
                            }))
                        });
                    }
                }
            }
            return await this.findById(template.id, true);
        });
    }
}
exports.MenuPlanRepository = MenuPlanRepository;
exports.default = MenuPlanRepository;
