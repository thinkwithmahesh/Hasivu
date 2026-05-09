import { Router } from 'express';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { successResponse } from '../shared/api-response.types';
import { SubscriptionService } from '../services/subscription.service';

const subscriptionService = new SubscriptionService();
const subscriptionRouter = Router();

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

subscriptionRouter.use(authMiddleware);
subscriptionRouter.use(requireFeature('SUBSCRIPTIONS_ENABLED'));

subscriptionRouter.get('/plans', async (req: AuthenticatedRequest, res, next) => {
  try {
    const plans = await subscriptionService.getAvailablePlans(req.user?.schoolId);
    res.json(successResponse(plans, requestId(req)));
  } catch (error) {
    next(error);
  }
});

subscriptionRouter.get('/current', async (req: AuthenticatedRequest, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user!.id);
    res.json(successResponse(subscription, requestId(req)));
  } catch (error) {
    next(error);
  }
});

subscriptionRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const subscription = await subscriptionService.createSubscription(
      req.user!.id,
      req.body.planId
    );
    res.status(201).json(successResponse(subscription, requestId(req)));
  } catch (error) {
    next(error);
  }
});

subscriptionRouter.post('/cancel', async (req: AuthenticatedRequest, res, next) => {
  try {
    await subscriptionService.cancelSubscription(req.user!.id);
    res.json(successResponse({ status: 'cancel_pending' }, requestId(req)));
  } catch (error) {
    next(error);
  }
});

export default subscriptionRouter;
