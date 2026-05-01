/**
 * Kitchen-scoped API routes (mounted at /api/kitchen)
 */

import express from 'express';
import { z } from 'zod';
import {
  APIRequest,
  APIResponse,
  validateRequest,
  createRateLimiter,
} from '../middleware/api.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = express.Router();
const writeRateLimit = createRateLimiter({ requests: 30, windowMs: 60000 });
const readRateLimit = createRateLimiter({ requests: 150, windowMs: 60000 });
const orderService = OrderService.getInstance();

const kitchenOrderParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

const assignOrderBodySchema = z.object({
  staffId: z.string().uuid('staffId must be a valid UUID'),
});

const kitchenStaffQuerySchema = z.object({
  schoolId: z.string().uuid('schoolId must be a valid UUID'),
});

/**
 * PUT /api/kitchen/orders/:id/assign
 */
router.put(
  '/orders/:id/assign',
  writeRateLimit,
  authMiddleware,
  requireRole(['kitchen_staff', 'school_admin', 'admin', 'super_admin']),
  validateRequest({
    params: kitchenOrderParamsSchema,
    body: assignOrderBodySchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const { staffId } = req.body as { staffId: string };
      const currentUser = req.user!;

      const existing = await orderService.findById(id);
      if (!existing) {
        throw new AppError('Order not found', 404, true);
      }

      const schoolId = currentUser.schoolId ?? existing.schoolId;

      const order = await orderService.assignOrder(
        id,
        { staffId, schoolId },
        currentUser.id,
        currentUser.role,
        currentUser.schoolId
      );

      res.json({
        success: true,
        data: order,
        message: 'Order assigned successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to assign order',
        error instanceof Error ? error : new Error(String(error)),
        { requestId: req.requestId, orderId: req.params.id }
      );
      throw error;
    }
  }
);

/**
 * GET /api/kitchen/staff?schoolId=
 * Lists assignable staff for the kitchen UI (minimal fields).
 */
router.get(
  '/staff',
  readRateLimit,
  authMiddleware,
  requireRole(['kitchen_staff', 'school_admin', 'admin', 'super_admin']),
  validateRequest({ query: kitchenStaffQuerySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    const currentUser = req.user!;
    const { schoolId } = req.query as { schoolId: string };

    const elevated = ['admin', 'super_admin'].includes(currentUser.role);
    if (!elevated) {
      if (!currentUser.schoolId || currentUser.schoolId !== schoolId) {
        throw new AppError('You can only list staff for your school', 403, true);
      }
    }

    const staff = await orderService.listAssignableStaff(schoolId);

    res.json({
      success: true,
      data: staff,
      requestId: req.requestId,
    });
  }
);

export default router;
