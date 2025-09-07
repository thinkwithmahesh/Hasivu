/**
 * HASIVU Platform - Menu Plan Repository
 * Data access layer for menu planning system
 * Implements Story 2.2: Menu Planning and Scheduling
 */
import { PrismaClient, Prisma, MenuPlan } from '@prisma/client';
import { DatabaseService } from '../functions/shared/database.service';

interface MenuPlanCreateInput {
  name: string;
  description?: string;
  schoolId: string;
  startDate: Date;
  endDate: Date;
  isTemplate?: boolean;
  isRecurring?: boolean;
  status?: string;
  approvalWorkflow?: any;
  recurringPattern?: any;
  templateCategory?: string;
  metadata?: any;
  createdBy: string;
}

interface MenuPlanFilters {
  schoolId?: string;
  status?: string;
  isTemplate?: boolean;
  isRecurring?: boolean;
  templateCategory?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface PaginationOptions {
  filters?: MenuPlanFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface MenuPlanResponse {
  plans: MenuPlan[];
  total: number;
  pages: number;
  currentPage: number;
}

/**
 * MenuPlanRepository - Data access layer for menu plans
 */
export class MenuPlanRepository {
  private static prisma = DatabaseService.client;

  /**
   * Create new menu plan
   */
  static async create(data: MenuPlanCreateInput): Promise<MenuPlan> {
    const createData: Prisma.MenuPlanCreateInput = {
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
              orderBy: { displayOrder: Prisma.SortOrder.asc }
            }
          },
          orderBy: { date: Prisma.SortOrder.asc }
        },
        approvals: {
          orderBy: { createdAt: Prisma.SortOrder.desc }
        }
      }
    });
  }

  /**
   * Find menu plan by ID
   */
  static async findById(id: string, includeDetails: boolean = true): Promise<MenuPlan | null> {
    const include = includeDetails ? {
      dailyMenus: {
        include: {
          menuItems: {
            include: {
              menuItem: true
            },
            orderBy: { displayOrder: Prisma.SortOrder.asc }
          }
        },
        orderBy: { date: Prisma.SortOrder.asc }
      },
      approvals: {
        orderBy: { createdAt: Prisma.SortOrder.desc }
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
  static async findMany(options: PaginationOptions = {}): Promise<MenuPlanResponse> {
    const {
      filters = {},
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build where clause
    const where: Prisma.MenuPlanWhereInput = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.status) where.status = filters.status;
    if (filters.isTemplate !== undefined) where.isTemplate = filters.isTemplate;
    if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;
    if (filters.templateCategory) where.templateCategory = filters.templateCategory;
    if (filters.createdBy) where.createdBy = filters.createdBy;

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
    const orderBy: Prisma.MenuPlanOrderByWithRelationInput = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'startDate') orderBy.startDate = sortOrder;
    else if (sortBy === 'endDate') orderBy.endDate = sortOrder;
    else if (sortBy === 'status') orderBy.status = sortOrder;
    else orderBy.createdAt = sortOrder;

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
                orderBy: { displayOrder: Prisma.SortOrder.asc }
              }
            },
            orderBy: { date: Prisma.SortOrder.asc }
          },
          approvals: {
            orderBy: { createdAt: Prisma.SortOrder.desc }
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
  static async update(
    id: string,
    data: Partial<MenuPlanCreateInput>
  ): Promise<MenuPlan> {
    const updateData: Prisma.MenuPlanUpdateInput = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate) updateData.startDate = data.startDate;
    if (data.endDate) updateData.endDate = data.endDate;
    if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.status) updateData.status = data.status;
    if (data.approvalWorkflow) updateData.approvalWorkflow = JSON.stringify(data.approvalWorkflow);
    if (data.recurringPattern) updateData.recurringPattern = JSON.stringify(data.recurringPattern);
    if (data.templateCategory !== undefined) updateData.templateCategory = data.templateCategory;
    if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);

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
              orderBy: { displayOrder: Prisma.SortOrder.asc }
            }
          },
          orderBy: { date: Prisma.SortOrder.asc }
        },
        approvals: {
          orderBy: { createdAt: Prisma.SortOrder.desc }
        }
      }
    });
  }

  /**
   * Delete menu plan
   */
  static async delete(id: string): Promise<MenuPlan> {
    return await this.prisma.menuPlan.delete({
      where: { id }
    });
  }

  /**
   * Get templates by category
   */
  static async getTemplates(
    schoolId: string,
    category?: string
  ): Promise<MenuPlan[]> {
    const where: Prisma.MenuPlanWhereInput = {
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
              orderBy: { displayOrder: Prisma.SortOrder.asc }
            }
          },
          orderBy: { date: Prisma.SortOrder.asc }
        }
      }
    });
  }

  /**
   * Get active menu plans for date range
   */
  static async getActivePlansForDateRange(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MenuPlan[]> {
    const where: Prisma.MenuPlanWhereInput = {
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
              orderBy: { displayOrder: Prisma.SortOrder.asc }
            }
          },
          orderBy: { date: Prisma.SortOrder.asc }
        }
      }
    });
  }

  /**
   * Check for overlapping menu plans
   */
  static async findOverlapping(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ): Promise<MenuPlan[]> {
    const where: Prisma.MenuPlanWhereInput = {
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
  static async updateStatus(
    id: string,
    status: string,
    approvedBy?: string
  ): Promise<MenuPlan> {
    const updateData: Prisma.MenuPlanUpdateInput = {
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
  static async getStatistics(schoolId?: string): Promise<{
    total: number;
    active: number;
    templates: number;
    pendingApproval: number;
    byStatus: Record<string, number>;
  }> {
    const where: Prisma.MenuPlanWhereInput = schoolId ? { schoolId } : {};

    const [
      total,
      active,
      templates,
      pendingApproval,
      statusGroups
    ] = await Promise.all([
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

    const byStatus: Record<string, number> = {};
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
  static async cloneAsTemplate(
    sourceId: string,
    templateData: {
      name: string;
      description?: string;
      templateCategory?: string;
      createdBy: string;
    }
  ): Promise<MenuPlan> {
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
              dayType: (dailyMenu as any).dayType || 'WEEKDAY',
              isActive: (dailyMenu as any).isActive !== false,
              metadata: dailyMenu.metadata || '{}'
            }
          });

          // Clone menu item slots
          if (dailyMenu.menuItems && dailyMenu.menuItems.length > 0) {
            await tx.menuItemSlot.createMany({
              data: dailyMenu.menuItems.map(item => ({
                dailyMenuId: newDailyMenu.id,
                menuItemId: item.menuItemId,
                category: (item as any).category || 'LUNCH',
                displayOrder: (item as any).displayOrder || 0,
                isVisible: (item as any).isVisible !== false
              }))
            });
          }
        }
      }

      return await this.findById(template.id, true);
    });
  }
}

export default MenuPlanRepository;