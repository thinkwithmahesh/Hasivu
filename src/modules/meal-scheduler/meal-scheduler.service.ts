import { Prisma, PrismaClient } from '@prisma/client';
import { featureFlags } from '../../config/feature-flags';
import { OutboxRepository } from '../../events/outbox.repository';
import { parseRecurrenceRule, expandRecurrence } from './recurrence';

export interface CreateMealScheduleInput {
  schoolId: string;
  createdBy: string;
  name: string;
  effectiveFrom: string;
  effectiveTo?: string;
  recurrenceRule?: string;
  targetType: 'school' | 'class' | 'group';
  targetId?: string;
  cutoffMinutes?: number;
  slots: Array<{
    serviceDate?: string;
    slot: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    menuItemId: string;
    plannedQuantity?: number;
    maxPerStudent?: number;
    priceOverride?: string;
    kitchenNotes?: string;
  }>;
}

export class MealSchedulerService {
  private readonly outboxRepo: OutboxRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.outboxRepo = new OutboxRepository(prisma);
  }

  private assertEnabled(): void {
    if (!featureFlags.isEnabled('MEAL_SCHEDULER_ENABLED')) {
      throw Object.assign(new Error('Meal scheduler is not enabled'), {
        code: 'FEATURE_DISABLED',
        statusCode: 404,
      });
    }
  }

  async create(input: CreateMealScheduleInput) {
    this.assertEnabled();
    const effectiveFrom = new Date(input.effectiveFrom);
    const serviceDates = input.recurrenceRule
      ? expandRecurrence(parseRecurrenceRule(input.recurrenceRule), effectiveFrom)
      : [effectiveFrom];

    const slots = input.slots.flatMap(slot =>
      serviceDates.map(serviceDate => ({
        ...slot,
        serviceDate: slot.serviceDate ? new Date(slot.serviceDate) : serviceDate,
      }))
    );

    const slotKeys = slots.map(
      slot => `${slot.serviceDate.toISOString()}:${slot.slot}:${slot.menuItemId}`
    );
    if (new Set(slotKeys).size !== slotKeys.length) {
      throw Object.assign(new Error('Duplicate schedule slot'), {
        code: 'SCHEDULE_CONFLICT',
        statusCode: 409,
      });
    }

    return this.prisma.mealSchedule.create({
      data: {
        schoolId: input.schoolId,
        name: input.name,
        status: 'draft',
        effectiveFrom,
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
        recurrenceRule: input.recurrenceRule,
        targetType: input.targetType,
        targetId: input.targetId,
        cutoffMinutes: input.cutoffMinutes ?? 120,
        createdBy: input.createdBy,
        slots: {
          create: slots.map(slot => ({
            serviceDate: slot.serviceDate,
            slot: slot.slot,
            menuItemId: slot.menuItemId,
            plannedQuantity: slot.plannedQuantity,
            maxPerStudent: slot.maxPerStudent,
            priceOverride: slot.priceOverride ? new Prisma.Decimal(slot.priceOverride) : undefined,
            kitchenNotes: slot.kitchenNotes,
          })),
        },
      },
      include: { slots: true },
    });
  }

  async list(schoolId: string, from?: string, to?: string) {
    this.assertEnabled();
    return this.prisma.mealSchedule.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(from || to
          ? {
              effectiveFrom: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: { slots: true, exceptions: true },
      orderBy: { effectiveFrom: 'asc' },
      take: 100,
    });
  }

  async publish(args: {
    scheduleId: string;
    schoolId: string;
    publishedBy: string;
    notifyParents: boolean;
  }) {
    this.assertEnabled();

    const schedule = await this.prisma.mealSchedule.findFirst({
      where: { id: args.scheduleId, schoolId: args.schoolId, deletedAt: null },
      include: { slots: true },
    });
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { code: 'NOT_FOUND', statusCode: 404 });
    }
    if (schedule.status !== 'draft') {
      throw Object.assign(new Error('Only draft schedules can be published'), {
        code: 'SCHEDULE_CONFLICT',
        statusCode: 409,
      });
    }

    return this.prisma.$transaction(async tx => {
      const published = await tx.mealSchedule.update({
        where: { id: args.scheduleId },
        data: { status: 'published', publishedBy: args.publishedBy, publishedAt: new Date() },
      });

      await this.outboxRepo.enqueue(
        {
          type: 'meal_schedule.published.v1',
          schoolId: args.schoolId,
          aggregateId: args.scheduleId,
          payload: {
            scheduleId: args.scheduleId,
            from: schedule.effectiveFrom.toISOString(),
            to: (schedule.effectiveTo ?? schedule.effectiveFrom).toISOString(),
            notifyParents: args.notifyParents,
          },
        },
        tx as unknown as PrismaClient
      );

      return published;
    });
  }

  async addException(args: {
    scheduleId: string;
    schoolId: string;
    serviceDate: string;
    action: 'cancel' | 'replace' | 'quantity_override';
    reason?: string;
    payload?: Prisma.InputJsonValue;
    createdBy: string;
  }) {
    this.assertEnabled();
    const schedule = await this.prisma.mealSchedule.findFirst({
      where: { id: args.scheduleId, schoolId: args.schoolId, deletedAt: null },
    });
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { code: 'NOT_FOUND', statusCode: 404 });
    }

    return this.prisma.mealScheduleException.create({
      data: {
        scheduleId: args.scheduleId,
        serviceDate: new Date(args.serviceDate),
        action: args.action,
        reason: args.reason,
        payload: args.payload,
        createdBy: args.createdBy,
      },
    });
  }

  async getDemandProjection(args: { schoolId: string; from: string; to: string }) {
    this.assertEnabled();
    return this.prisma.mealScheduleSlot.groupBy({
      by: ['serviceDate', 'slot', 'menuItemId'],
      where: {
        schedule: {
          schoolId: args.schoolId,
          status: 'published',
          deletedAt: null,
        },
        serviceDate: {
          gte: new Date(args.from),
          lte: new Date(args.to),
        },
      },
      _sum: { plannedQuantity: true },
      orderBy: [{ serviceDate: 'asc' }, { slot: 'asc' }],
    });
  }
}
