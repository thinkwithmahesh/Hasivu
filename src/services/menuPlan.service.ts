/**
 * Menu Plan Service
 * Manages weekly/monthly menu planning
 */

import { PrismaClient } from '@prisma/client';

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
    this.prisma = new PrismaClient();
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
    // Note: This assumes a MenuPlan model exists in Prisma schema
    // If not, this will be a stub implementation
    return {
      id: `plan_${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get menu plan by ID
   */
  public async findById(_id: string): Promise<any | null> {
    // Stub implementation
    return null;
  }

  /**
   * Get all menu plans for a school
   */
  public async findBySchool(_schoolId: string): Promise<any[]> {
    // Stub implementation
    return [];
  }

  /**
   * Get active menu plan for a school
   */
  public async findActiveBySchool(_schoolId: string, _date?: Date): Promise<any | null> {
    const _targetDate = _date || new Date();

    // Stub implementation - would filter by date range and isActive
    return null;
  }

  /**
   * Update menu plan
   */
  public async update(id: string, data: UpdateMenuPlanDto): Promise<any> {
    // Stub implementation
    return {
      id,
      ...data,
      updatedAt: new Date(),
    };
  }

  /**
   * Delete menu plan
   */
  public async delete(id: string): Promise<any> {
    // Stub implementation
    return { id, deleted: true };
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
    // Stub implementation - would check for overlapping plans
    return false;
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

    // Check for overlapping plans (stub implementation)
    // In real implementation, this would call repository

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

    // Check for overlapping plans if dates are being updated (stub implementation)

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

    // Check if it's actually a template (stub validation)

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

    // Update status (stub implementation)
    return {
      id,
      status,
      approvedBy,
      approvedAt: new Date(),
    };
  }

  /**
   * Get menu plan statistics (static method for tests)
   */
  public static async getStatistics(_schoolId: string): Promise<any> {
    // Stub implementation - would aggregate from repository
    return {
      total: 0,
      active: 0,
      templates: 0,
      pendingApproval: 0,
      byStatus: {},
    };
  }
}

// Export singleton instance
export const menuPlanService = MenuPlanService.getInstance();

// Export for direct access
export default MenuPlanService;
