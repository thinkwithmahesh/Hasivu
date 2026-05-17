/**
 * Customer Service for HASIVU Platform
 * Handles customer management, relationships, and business operations
 */

import { Prisma } from '@prisma/client';
import { DatabaseService } from './database.service';
import { logger } from '../utils/logger';
import { NotFoundError, BusinessLogicError } from '../utils/errors';

export interface CustomerProfile {
  id: string;
  userId: string;
  preferences: {
    dietary?: string[];
    allergens?: string[];
    notifications?: boolean;
    language?: string;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'family';
    status: 'active' | 'suspended' | 'cancelled';
    renewalDate?: Date;
  };
  paymentMethods: PaymentMethodInfo[];
  children?: ChildProfile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChildProfile {
  id: string;
  name: string;
  schoolId: string;
  grade: string;
  dietary: string[];
  allergens: string[];
  rfidCardId?: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  last4?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CustomerMetrics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  favoriteItems: string[];
  satisfactionScore?: number;
}

export interface CustomerSearchFilters {
  role?: string;
  schoolId?: string;
  subscriptionStatus?: string;
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  hasActiveSubscription?: boolean;
  hasChildren?: boolean;
}

export class CustomerService {
  private static instance: CustomerService;
  private db = DatabaseService.getInstance();
  private logger = logger;

  private constructor() {}

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService();
    }
    return CustomerService.instance;
  }

  /**
   * Get customer profile by user ID
   */
  async getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
    try {
      const user = await this.db.client.user.findUnique({
        where: { id: userId },
        include: {
          children: {
            include: {
              school: true,
              rfidCards: true,
            },
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          paymentMethods: {
            where: { isActive: true },
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      if (!user) {
        return null;
      }

      return this.mapToCustomerProfile(user);
    } catch (error: unknown) {
      this.logger.error(
        'Error fetching customer profile',
        error instanceof Error ? error : undefined,
        { userId }
      );
      throw error;
    }
  }

  /**
   * Update customer preferences
   */
  async updateCustomerPreferences(
    userId: string,
    preferences: Partial<CustomerProfile['preferences']>
  ): Promise<CustomerProfile> {
    try {
      const user = await this.db.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('Customer', userId);
      }

      const updatedUser = await this.db.client.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...((user.preferences as any) || {}),
            ...preferences,
          },
          updatedAt: new Date(),
        },
        include: {
          children: {
            include: {
              school: true,
              rfidCards: true,
            },
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          paymentMethods: {
            where: { isActive: true },
            orderBy: { isDefault: 'desc' },
          },
        },
      });

      return this.mapToCustomerProfile(updatedUser);
    } catch (error: unknown) {
      this.logger.error(
        'Error updating customer preferences',
        error instanceof Error ? error : undefined,
        { userId, preferences }
      );
      throw error;
    }
  }

  /**
   * Add child to customer profile
   */
  async addChild(userId: string, childData: Omit<ChildProfile, 'id'>): Promise<ChildProfile> {
    try {
      const customer = await this.db.client.user.findUnique({
        where: { id: userId },
      });

      if (!customer) {
        throw new NotFoundError('Customer', userId);
      }

      if (customer.role !== 'parent') {
        throw new BusinessLogicError('Only parent users can add children', 'role_restriction');
      }

      const child = await this.db.client.user.create({
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
            allergens: childData.allergens,
          }),
        },
        include: {
          school: true,
          rfidCards: true,
        },
      });

      return this.mapToChildProfile(child);
    } catch (error: unknown) {
      this.logger.error(
        'Error adding child to customer',
        error instanceof Error ? error : undefined,
        { userId, childData }
      );
      throw error;
    }
  }

  /**
   * Get customer metrics and analytics
   */
  async getCustomerMetrics(userId: string): Promise<CustomerMetrics> {
    try {
      const orders = await this.db.client.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      const lastOrder = orders.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const itemFrequency: { [key: string]: number } = {};
      orders.forEach((order: any) => {
        order.orderItems.forEach((item: any) => {
          if (item.menuItem) {
            itemFrequency[item.menuItem.name] =
              (itemFrequency[item.menuItem.name] || 0) + item.quantity;
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
        favoriteItems,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Error fetching customer metrics',
        error instanceof Error ? error : undefined,
        { userId }
      );
      throw error;
    }
  }

  /**
   * Search customers with filters
   */
  async searchCustomers(
    filters: CustomerSearchFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ customers: CustomerProfile[]; total: number }> {
    try {
      const whereClause: Prisma.UserWhereInput = {
        ...(filters.role && { role: filters.role }),
        ...(filters.schoolId && {
          children: {
            some: { schoolId: filters.schoolId },
          },
        }),
        ...(filters.registrationDateFrom && {
          createdAt: { gte: filters.registrationDateFrom },
        }),
        ...(filters.registrationDateTo && {
          createdAt: { lte: filters.registrationDateTo },
        }),
        ...(filters.hasActiveSubscription && {
          subscriptions: {
            some: { status: 'ACTIVE' },
          },
        }),
        ...(filters.hasChildren && {
          children: {
            some: {},
          },
        }),
      };

      const [users, total] = await Promise.all([
        this.db.client.user.findMany({
          where: whereClause,
          include: {
            children: {
              include: {
                school: true,
                rfidCards: true,
              },
            },
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            paymentMethods: {
              where: { isActive: true },
              orderBy: { isDefault: 'desc' },
            },
          },
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.db.client.user.count({ where: whereClause }),
      ]);

      const customers = users.map((user: any) => this.mapToCustomerProfile(user));

      return { customers, total };
    } catch (error: unknown) {
      this.logger.error('Error searching customers', error instanceof Error ? error : undefined, {
        filters,
      });
      throw error;
    }
  }

  /**
   * Deactivate customer account
   */
  async deactivateCustomer(userId: string, reason: string): Promise<void> {
    try {
      await this.db.client.$transaction(async (tx: any) => {
        // Update user status
        await tx.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        // Cancel active subscriptions
        await tx.subscription.updateMany({
          where: {
            userId,
            status: 'ACTIVE',
          },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });

        // Log deactivation
        await tx.auditLog.create({
          data: {
            userId,
            entityType: 'USER',
            entityId: userId,
            action: 'CUSTOMER_DEACTIVATED',
            metadata: JSON.stringify({ reason }),
            createdById: userId, // System action, user is the creator
          },
        });
      });

      this.logger.info('Customer account deactivated', { userId, reason });
    } catch (error: unknown) {
      this.logger.error('Error deactivating customer', error instanceof Error ? error : undefined, {
        userId,
        reason,
      });
      throw error;
    }
  }

  /**
   * Map database user to customer profile
   */
  private mapToCustomerProfile(user: any): CustomerProfile {
    const activeSubscription = user.subscriptions?.[0];

    return {
      id: user.id,
      userId: user.id,
      preferences: {
        dietary: user.preferences?.dietary || [],
        allergens: user.preferences?.allergens || [],
        notifications: user.preferences?.notifications ?? true,
        language: user.preferences?.language || 'en',
      },
      subscription: {
        plan: activeSubscription?.plan || 'basic',
        status: activeSubscription?.status?.toLowerCase() || 'cancelled',
        renewalDate: activeSubscription?.renewalDate,
      },
      paymentMethods:
        user.paymentMethods?.map((pm: any) => ({
          id: pm.id,
          type: pm.type,
          last4: pm.last4,
          isDefault: pm.isDefault,
          isActive: pm.isActive,
        })) || [],
      children: user.children?.map((child: any) => this.mapToChildProfile(child)) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Map database child to child profile
   */
  private mapToChildProfile(child: any): ChildProfile {
    const preferences =
      typeof child.preferences === 'string'
        ? JSON.parse(child.preferences)
        : child.preferences || {};
    return {
      id: child.id,
      name: child.firstName || child.name,
      schoolId: child.schoolId,
      grade: child.grade,
      dietary: preferences.dietary || [],
      allergens: preferences.allergens || [],
      rfidCardId: child.rfidCards?.[0]?.id,
    };
  }
}
