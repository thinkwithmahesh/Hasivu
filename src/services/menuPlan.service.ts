/**
 * Menu Plan Service
 * Manages weekly/monthly menu planning
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';

export interface MenuPlanItem {
  menuItemId: string;
  quantity?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface CreateMenuPlanDto {
  schoolId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  items: MenuPlanItem[];
  isActive?: boolean;
}

export interface UpdateMenuPlanDto {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  items?: MenuPlanItem[];
  isActive?: boolean;
}

export interface CreateMenuPlanInput {
  name: string;
  description?: string;
  schoolId: string;
  startDate: Date;
  endDate: Date;
  status: MenuPlanStatus;
  createdBy: string;
  isTemplate?: boolean;
  templateCategory?: string;
}

export interface UpdateMenuPlanInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
}

export enum MenuPlanStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class MenuPlanService {
  private static instance: MenuPlanService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = defaultPrisma;
  }

  public static getInstance(): MenuPlanService {
    if (!MenuPlanService.instance) {
      MenuPlanService.instance = new MenuPlanService();
    }
    return MenuPlanService.instance;
  }

  /**
   * Create a new menu plan
   */
  public async create(data: CreateMenuPlanDto): Promise<any> {
    const plan = await this.prisma.menuPlan.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.isActive ? MenuPlanStatus.PUBLISHED : MenuPlanStatus.DRAFT,
        createdBy: 'system',
        dailyMenus: {
          create: {
            schoolId: data.schoolId,
            date: data.startDate,
            dayType: this.dayType(data.startDate),
            isActive: data.isActive ?? false,
            isPublished: data.isActive ?? false,
            menuItems: {
              create: data.items.map(item => ({
                menuItemId: item.menuItemId,
                category: item.mealType,
                plannedQuantity: item.quantity,
              })),
            },
          },
        },
      },
      include: { dailyMenus: { include: { menuItems: true } } },
    });
    return this.toDto(plan);
  }

  /**
   * Get menu plan by ID
   */
  public async findById(id: string): Promise<any | null> {
    const plan = await this.prisma.menuPlan.findUnique({
      where: { id },
      include: { dailyMenus: { include: { menuItems: true } } },
    });
    return plan ? this.toDto(plan) : null;
  }

  /**
   * Get all menu plans for a school
   */
  public async findBySchool(schoolId: string): Promise<any[]> {
    const plans = await this.prisma.menuPlan.findMany({
      where: { schoolId },
      include: { dailyMenus: { include: { menuItems: true } } },
      orderBy: { startDate: 'desc' },
    });
    return plans.map(plan => this.toDto(plan));
  }

  /**
   * Get active menu plan for a school
   */
  public async findActiveBySchool(schoolId: string, date?: Date): Promise<any | null> {
    const targetDate = date || new Date();
    const plan = await this.prisma.menuPlan.findFirst({
      where: {
        schoolId,
        status: MenuPlanStatus.PUBLISHED,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: { dailyMenus: { include: { menuItems: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return plan ? this.toDto(plan) : null;
  }

  /**
   * Update menu plan
   */
  public async update(id: string, data: UpdateMenuPlanDto): Promise<any> {
    const plan = await this.prisma.menuPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status:
          data.isActive === undefined
            ? undefined
            : data.isActive
              ? MenuPlanStatus.PUBLISHED
              : MenuPlanStatus.DRAFT,
      },
      include: { dailyMenus: { include: { menuItems: true } } },
    });
    return this.toDto(plan);
  }

  /**
   * Delete menu plan
   */
  public async delete(id: string): Promise<any> {
    const deleted = await this.prisma.menuPlan.delete({ where: { id } });
    return { id: deleted.id, deleted: true };
  }

  /**
   * Activate menu plan
   */
  public async activate(id: string): Promise<any> {
    return await this.update(id, { isActive: true });
  }

  /**
   * Deactivate menu plan
   */
  public async deactivate(id: string): Promise<any> {
    return await this.update(id, { isActive: false });
  }

  /**
   * Get menu for specific date
   */
  public async getMenuForDate(
    schoolId: string,
    date: Date,
    mealType?: string
  ): Promise<MenuPlanItem[]> {
    const plan = await this.findActiveBySchool(schoolId, date);

    if (!plan || !plan.items) {
      return [];
    }

    if (mealType) {
      return plan.items.filter((item: MenuPlanItem) => item.mealType === mealType);
    }

    return plan.items;
  }

  /**
   * Check if menu plan exists for date range
   */
  public async existsForDateRange(
    _schoolId: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<boolean> {
    const count = await this.prisma.menuPlan.count({
      where: {
        schoolId: _schoolId,
        OR: [
          { startDate: { gte: _startDate, lte: _endDate } },
          { endDate: { gte: _startDate, lte: _endDate } },
          { AND: [{ startDate: { lte: _startDate } }, { endDate: { gte: _endDate } }] },
        ],
      },
    });
    return count > 0;
  }

  /**
   * Clone menu plan to new date range
   */
  public async clone(planId: string, startDate: Date, endDate: Date): Promise<any> {
    const originalPlan = await this.findById(planId);

    if (!originalPlan) {
      throw new Error('Menu plan not found');
    }

    return await this.create({
      ...originalPlan,
      name: `${originalPlan.name} (Copy)`,
      startDate,
      endDate,
      isActive: false,
    });
  }

  /**
   * Create menu plan (static method for tests)
   */
  public static async createMenuPlan(data: CreateMenuPlanInput): Promise<any> {
    const instance = MenuPlanService.getInstance();

    // Validate dates
    if (data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate duration (max 365 days)
    const duration = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (duration > 365) {
      throw new Error('Menu plan duration cannot exceed 365 days');
    }

    // Validate template requirements
    if (data.isTemplate && !data.templateCategory) {
      throw new Error('Template category is required for templates');
    }

    const overlaps = await instance.existsForDateRange(data.schoolId, data.startDate, data.endDate);
    if (overlaps && !data.isTemplate) {
      throw new Error('A menu plan already exists for this date range');
    }

    return await instance.create({
      schoolId: data.schoolId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      items: [], // Empty items for now
      isActive: data.status === MenuPlanStatus.PUBLISHED,
    });
  }

  /**
   * Update menu plan (static method for tests)
   */
  public static async updateMenuPlan(id: string, data: UpdateMenuPlanInput): Promise<any> {
    const instance = MenuPlanService.getInstance();

    // Validate dates if provided
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }

    return await instance.update(id, data);
  }

  /**
   * Apply template to create new menu plan (static method for tests)
   */
  public static async applyTemplate(data: {
    templateId: string;
    name: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    const instance = MenuPlanService.getInstance();

    const template = await instance.findById(data.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isTemplate) {
      throw new Error('Selected plan is not a template');
    }

    return await instance.create({
      schoolId: data.schoolId,
      name: data.name,
      description: template.description,
      startDate: data.startDate,
      endDate: data.endDate,
      items: template.items || [],
      isActive: false,
    });
  }

  /**
   * Update menu plan status (static method for tests)
   */
  public static async updateStatus(
    id: string,
    status: MenuPlanStatus,
    approvedBy: string
  ): Promise<any> {
    // Validate status
    const validStatuses = Object.values(MenuPlanStatus);
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status value');
    }

    const instance = MenuPlanService.getInstance();
    const plan = await instance.prisma.menuPlan.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt:
          status === MenuPlanStatus.APPROVED || status === MenuPlanStatus.PUBLISHED
            ? new Date()
            : undefined,
      },
      include: { dailyMenus: { include: { menuItems: true } } },
    });
    return instance.toDto(plan);
  }

  /**
   * Get menu plan statistics (static method for tests)
   */
  public static async getStatistics(schoolId: string): Promise<any> {
    const instance = MenuPlanService.getInstance();
    const [total, active, templates, pending, byStatusRows] = await Promise.all([
      instance.prisma.menuPlan.count({ where: { schoolId } }),
      instance.prisma.menuPlan.count({ where: { schoolId, status: MenuPlanStatus.PUBLISHED } }),
      instance.prisma.menuPlan.count({ where: { schoolId, isTemplate: true } }),
      instance.prisma.menuPlan.count({
        where: { schoolId, status: MenuPlanStatus.PENDING_APPROVAL },
      }),
      instance.prisma.menuPlan.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: { id: true },
      }),
    ]);
    return {
      total,
      active,
      templates,
      pendingApproval: pending,
      byStatus: Object.fromEntries(byStatusRows.map(row => [row.status, row._count.id])),
    };
  }

  private dayType(date: Date): string {
    const day = date.getDay();
    return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
  }

  private toDto(plan: any): any {
    const items =
      plan.dailyMenus?.flatMap(
        (menu: any) =>
          menu.menuItems?.map((slot: any) => ({
            menuItemId: slot.menuItemId,
            quantity: slot.plannedQuantity,
            mealType: slot.category,
            date: menu.date,
          })) || []
      ) || [];
    return { ...plan, items };
  }
}

// Export singleton instance
export const menuPlanService = MenuPlanService.getInstance();

// Export for direct access
export default MenuPlanService;
