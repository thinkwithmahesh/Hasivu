import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { successResponse } from '../shared/api-response.types';
import { RecommendationService } from '../modules/recommendations/recommendation.service';

const prisma = new PrismaClient();
const recommendationService = new RecommendationService(prisma);
const recommendationRouter = Router();

const recommendationQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  date: z.string().datetime(),
  slot: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

const feedbackSchema = z.object({
  recommendationItemId: z.string().uuid(),
  action: z.enum(['accepted', 'dismissed', 'hidden', 'reported']),
  reason: z.string().max(500).optional(),
});

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

recommendationRouter.use(authMiddleware);
recommendationRouter.use(requireFeature('RECOMMENDATIONS_ENABLED'));

recommendationRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const query = recommendationQuerySchema.parse(req.query);
    const result = await recommendationService.getRecommendations({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
      studentId: query.studentId,
      date: query.date,
      slot: query.slot,
      limit: query.limit,
    });
    res.json(successResponse(result, requestId(req)));
  } catch (error) {
    next(error);
  }
});

recommendationRouter.post('/feedback', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const body = feedbackSchema.parse(req.body);
    const feedback = await recommendationService.recordFeedback({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
      recommendationItemId: body.recommendationItemId,
      action: body.action,
      reason: body.reason,
    });
    res.status(201).json(successResponse(feedback, requestId(req)));
  } catch (error) {
    next(error);
  }
});

export default recommendationRouter;
