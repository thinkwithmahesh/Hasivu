/**
 * Production Service
 * Builds production schedules from orders and menu plans.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

export class ProductionService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('ProductionService initialized');
  }

  async scheduleProduction(items: any[] | undefined): Promise<void> {
    logger.info('Production schedule requested', { itemCount: items?.length || 0 });
  }

  async getProductionStatus(): Promise<any> {
    const [queued, inProgress, completed] = await Promise.all([
      this.db.order.count({ where: { status: { in: ['pending', 'confirmed'] } } }),
      this.db.order.count({ where: { status: 'preparing' } }),
      this.db.order.count({ where: { status: { in: ['ready', 'delivered'] } } }),
    ]);
    return { status: 'active', queued, inProgress, completed };
  }

  async updateProductionStatus(itemId: string, status: string): Promise<void> {
    await this.db.order.update({ where: { id: itemId }, data: { status } });
  }

  async getTodaySchedule(schoolId: string): Promise<any> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [total, completed, nextOrder] = await Promise.all([
      this.db.order.count({ where: { schoolId, deliveryDate: { gte: start, lt: end } } }),
      this.db.order.count({
        where: {
          schoolId,
          deliveryDate: { gte: start, lt: end },
          status: { in: ['ready', 'delivered'] },
        },
      }),
      this.db.order.findFirst({
        where: {
          schoolId,
          deliveryDate: { gte: start, lt: end },
          status: { in: ['pending', 'confirmed', 'preparing'] },
        },
        orderBy: { deliveryDate: 'asc' },
      }),
    ]);

    return {
      completionRate: total === 0 ? 100 : Math.round((completed / total) * 100),
      onTimeRate: total === 0 ? 100 : Math.round((completed / total) * 100),
      nextMeal: nextOrder ? { orderId: nextOrder.id, deliveryDate: nextOrder.deliveryDate } : null,
    };
  }

  async validateResources(planData: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!planData?.schoolId) errors.push('schoolId is required');
    if (!Array.isArray(planData?.items) || planData.items.length === 0)
      errors.push('items are required');
    return { isValid: errors.length === 0, errors };
  }

  async createPlan(planData: any): Promise<any> {
    const validation = await this.validateResources(planData);
    if (!validation.isValid) {
      throw Object.assign(new Error(validation.errors.join(', ')), { statusCode: 400 });
    }

    const event = await this.db.outboxEvent.create({
      data: {
        schoolId: planData.schoolId,
        eventType: 'production.plan.created.v1',
        aggregateType: 'production_plan',
        aggregateId: planData.schoolId,
        payload: {
          items: planData.items,
          plannedFor: planData.plannedFor,
          createdBy: planData.createdBy,
        },
        status: 'pending',
        nextAttemptAt: new Date(),
      },
    });

    return {
      id: event.id,
      schoolId: planData.schoolId,
      items: planData.items,
      status: 'planned',
      createdAt: event.createdAt.toISOString(),
    };
  }
}

const productionServiceInstance = new ProductionService();
export const productionService = productionServiceInstance;
export const _productionService = productionServiceInstance;
export default productionServiceInstance;
