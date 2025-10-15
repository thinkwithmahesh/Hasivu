/**
 * Payment Routes
 * API endpoints for payment processing and management
 */

import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { paymentRateLimit } from '../middleware/rateLimiter.middleware';
import { logger } from '../utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';

const router = Router();

// Apply rate limiting and authentication middleware to all payment routes
router.use(paymentRateLimit);
router.use(authMiddleware);

/**
 * Create payment order
 */
router.post('/create-order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency, notes, receipt } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    const paymentOrder = await PaymentService.createPaymentOrder({
      userId,
      amount,
      currency,
      notes,
      receipt,
    });

    res.status(201).json(
      createSuccessResponse({
        data: paymentOrder,
        message: 'Payment order created successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to create payment order', undefined, { error, userId: req.user?.id });
    res.status(500).json(handleError(error, 'Failed to create payment order'));
  }
});

/**
 * Get payment status
 */
router.get('/status/:orderId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    const status = PaymentService.getPaymentStatus(orderId);

    res.json(
      createSuccessResponse({
        data: { status },
        message: 'Payment status retrieved successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to get payment status', undefined, { error, orderId: req.params.orderId });
    res.status(500).json(handleError(error, 'Failed to get payment status'));
  }
});

/**
 * Process payment
 */
router.post('/process/:paymentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { paymentMethodId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    const payment = await PaymentService.getInstance().processPayment(paymentId);

    res.json(
      createSuccessResponse({
        data: payment,
        message: 'Payment processed successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to process payment', undefined, {
      error,
      paymentId: req.params.paymentId,
    });
    res.status(500).json(handleError(error, 'Failed to process payment'));
  }
});

/**
 * Refund payment
 */
router.post('/refund/:paymentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    const refund = await PaymentService.getInstance().refund(paymentId, amount);

    res.json(
      createSuccessResponse({
        data: refund,
        message: 'Payment refunded successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to refund payment', undefined, { error, paymentId: req.params.paymentId });
    res.status(500).json(handleError(error, 'Failed to refund payment'));
  }
});

/**
 * Get payment analytics
 */
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const filters = req.query;

    if (!userId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    const analytics = await PaymentService.getPaymentAnalytics(filters);

    res.json(
      createSuccessResponse({
        data: analytics,
        message: 'Payment analytics retrieved successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to get payment analytics', undefined, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(handleError(error, 'Failed to get payment analytics'));
  }
});

/**
 * Get user payments
 */
router.get('/user/:userId?', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId || req.user?.id;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res
        .status(401)
        .json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401));
    }

    // Allow users to view their own payments or admins to view any user's payments
    if (targetUserId !== currentUserId && req.user?.role !== 'admin') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied', 403));
    }

    const payments = await PaymentService.getInstance().findByUser(targetUserId || req.user!.id);

    res.json(
      createSuccessResponse({
        data: payments,
        message: 'User payments retrieved successfully',
      })
    );
  } catch (error: unknown) {
    logger.error('Failed to get user payments', undefined, { error, userId: req.params.userId });
    res.status(500).json(handleError(error, 'Failed to get user payments'));
  }
});

export default router;
