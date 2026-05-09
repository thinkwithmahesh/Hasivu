import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { successResponse } from '../shared/api-response.types';
import { MealSchedulerService } from '../modules/meal-scheduler/meal-scheduler.service';

const prisma = new PrismaClient();
const mealScheduler = new MealSchedulerService(prisma);
const mealSchedulerRouter = Router();

const createScheduleSchema = z.object({
  name: z.string().min(1).max(140),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  recurrenceRule: z.string().optional(),
  targetType: z.enum(['school', 'class', 'group']),
  targetId: z.string().optional(),
  cutoffMinutes: z.number().int().min(0).max(10080).optional(),
  slots: z
    .array(
      z.object({
        serviceDate: z.string().datetime().optional(),
        slot: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
        menuItemId: z.string().uuid(),
        plannedQuantity: z.number().int().min(0).optional(),
        maxPerStudent: z.number().int().min(1).max(20).optional(),
        priceOverride: z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/)
          .optional(),
        kitchenNotes: z.string().max(500).optional(),
      })
    )
    .min(1),
});

const exceptionSchema = z.object({
  serviceDate: z.string().datetime(),
  action: z.enum(['cancel', 'replace', 'quantity_override']),
  reason: z.string().max(500).optional(),
  payload: z.unknown().optional(),
});

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

mealSchedulerRouter.use(requireFeature('MEAL_SCHEDULER_ENABLED'));
mealSchedulerRouter.use(authMiddleware);

mealSchedulerRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const schedules = await mealScheduler.list(
      user.schoolId ?? 'global',
      req.query.from as string | undefined,
      req.query.to as string | undefined
    );
    res.json(successResponse(schedules, requestId(req)));
  } catch (error) {
    next(error);
  }
});

mealSchedulerRouter.post(
  '/',
  requireRole(['admin', 'school_admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const body = createScheduleSchema.parse(req.body);
      const schedule = await mealScheduler.create({
        ...body,
        schoolId: user.schoolId ?? 'global',
        createdBy: user.id,
      });
      res.status(201).json(successResponse(schedule, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

mealSchedulerRouter.post(
  '/:scheduleId/publish',
  requireRole(['admin', 'school_admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const schedule = await mealScheduler.publish({
        scheduleId: req.params.scheduleId,
        schoolId: user.schoolId ?? 'global',
        publishedBy: user.id,
        notifyParents: req.body.notifyParents === true,
      });
      res.json(successResponse(schedule, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

mealSchedulerRouter.post(
  '/:scheduleId/exceptions',
  requireRole(['admin', 'school_admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const body = exceptionSchema.parse(req.body);
      const exception = await mealScheduler.addException({
        scheduleId: req.params.scheduleId,
        schoolId: user.schoolId ?? 'global',
        serviceDate: body.serviceDate,
        action: body.action,
        reason: body.reason,
        payload: body.payload as any,
        createdBy: user.id,
      });
      res.status(201).json(successResponse(exception, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

mealSchedulerRouter.get('/demand-projection', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const projection = await mealScheduler.getDemandProjection({
      schoolId: user.schoolId ?? 'global',
      from: String(req.query.from),
      to: String(req.query.to),
    });
    res.json(successResponse(projection, requestId(req)));
  } catch (error) {
    next(error);
  }
});

export default mealSchedulerRouter;
