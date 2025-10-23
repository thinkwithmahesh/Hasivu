/**
 * Payment Routes
 * API endpoints for payment processing and management
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  APIRequest,
  APIResponse,
  validateRequest,
  createRateLimiter,
} from '../middleware/api.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { PaymentService } from '../services/payment.service';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = express.Router();

// Create service instances
const paymentService = PaymentService.getInstance();
const auditService = new AuditService();
const cacheService = new CacheService();

// Rate limiters
const readRateLimit = createRateLimiter({ requests: 150, windowMs: 60000 });
const writeRateLimit = createRateLimiter({ requests: 30, windowMs: 60000 });
const webhookRateLimit = createRateLimiter({ requests: 1000, windowMs: 60000 }); // Higher for webhooks

// Validation Schemas
const createPaymentOrderSchema = z.object({
  amount: z
    .number()
    .min(100, 'Amount must be at least ₹1 (100 paise)')
    .max(10000000, 'Amount too high'),
  currency: z.string().default('INR'),
  notes: z.object({}).optional(),
  receipt: z.string().optional(),
  orderId: z.string().uuid().optional(), // Link to order
});

const processPaymentSchema = z.object({
  paymentMethod: z.enum(['razorpay', 'stripe', 'paypal']),
  paymentDetails: z.object({}).optional(),
});

const refundPaymentSchema = z.object({
  amount: z.number().min(100).optional(),
  reason: z.string().min(1, 'Refund reason is required').max(300),
});

const paymentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded', 'cancelled']).optional(),
  paymentMethod: z
    .enum(['razorpay', 'stripe', 'paypal', 'wallet', 'card', 'upi', 'cash'])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  maxAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
});

const paymentParamsSchema = z.object({
  id: z.string().uuid('Invalid payment ID'),
});

const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string().optional(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        method: z.string(),
      }),
    }),
  }),
  created_at: z.number(),
});

/**
 * POST /api/v1/payments/orders
 * Create payment order
 */
router.post(
  '/orders',
  writeRateLimit,
  authMiddleware,
  validateRequest({ body: createPaymentOrderSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const paymentData = req.body;
      const currentUser = req.user!;

      const paymentOrder = await paymentService.createPaymentOrder({
        userId: currentUser.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        notes: paymentData.notes,
        receipt: paymentData.receipt,
      });

      // Invalidate caches
      await cacheService.invalidatePattern('payments:*');

      // Audit log
      await auditService.log(currentUser.id, 'payments.create_order', {
        paymentOrderId: paymentOrder.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        requestId: req.requestId,
      });

      logger.info('Payment order created successfully', {
        paymentOrderId: paymentOrder.id,
        amount: paymentData.amount,
        userId: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: paymentOrder,
        message: 'Payment order created successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to create payment order', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/payments/orders/:id
 * Get payment order details
 */
router.get(
  '/orders/:id',
  readRateLimit,
  authMiddleware,
  validateRequest({ params: paymentParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const paymentOrder = await paymentService.getPaymentOrder(id);

      if (!paymentOrder) {
        throw new AppError('Payment order not found', 404);
      }

      // Check access permissions
      if (
        paymentOrder.userId !== currentUser.id &&
        !['admin', 'school_admin'].includes(currentUser.role)
      ) {
        throw new AppError('You do not have permission to view this payment order', 403);
      }

      res.json({
        data: paymentOrder,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get payment order', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        paymentId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/payments/:id/process
 * Process payment with gateway integration
 */
router.post(
  '/:id/process',
  writeRateLimit,
  authMiddleware,
  validateRequest({
    params: paymentParamsSchema,
    body: processPaymentSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const { paymentMethod, paymentDetails } = req.body;
      const currentUser = req.user!;

      // Get payment
      const payment = await paymentService.findById(id);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Check ownership
      if (
        payment.userId !== currentUser.id &&
        !['admin', 'school_admin'].includes(currentUser.role)
      ) {
        throw new AppError('You do not have permission to process this payment', 403);
      }

      // Process payment
      const processedPayment = await paymentService.processPayment(id);

      // Invalidate caches
      await cacheService.invalidatePattern('payments:*');

      // Audit log
      await auditService.log(currentUser.id, 'payments.process', {
        paymentId: id,
        paymentMethod,
        amount: payment.amount,
        requestId: req.requestId,
      });

      logger.info('Payment processed successfully', {
        paymentId: id,
        paymentMethod,
        amount: payment.amount,
        userId: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: processedPayment,
        message: 'Payment processed successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to process payment', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        paymentId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/payments/:id/refund
 * Process payment refund
 */
router.post(
  '/:id/refund',
  writeRateLimit,
  authMiddleware,
  requireRole(['admin', 'school_admin']),
  validateRequest({
    params: paymentParamsSchema,
    body: refundPaymentSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const currentUser = req.user!;

      // Get payment
      const payment = await paymentService.findById(id);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Validate refund eligibility
      const canRefund = await PaymentService.validateRefund(id, amount);
      if (!canRefund) {
        throw new AppError('Payment is not eligible for refund', 400);
      }

      // Process refund
      const refundResult = await paymentService.refund(id, amount);

      // Invalidate caches
      await cacheService.invalidatePattern('payments:*');

      // Audit log
      await auditService.log(currentUser.id, 'payments.refund', {
        paymentId: id,
        refundAmount: amount,
        reason,
        requestId: req.requestId,
      });

      logger.info('Payment refunded successfully', {
        paymentId: id,
        refundAmount: amount,
        reason,
        refundedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: refundResult,
        message: 'Payment refunded successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to refund payment', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        paymentId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/payments/analytics
 * Get payment analytics with filtering
 */
router.get(
  '/analytics',
  readRateLimit,
  authMiddleware,
  requireRole(['admin', 'school_admin']),
  validateRequest({
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      schoolId: z.string().uuid().optional(),
      paymentMethod: z
        .enum(['razorpay', 'stripe', 'paypal', 'wallet', 'card', 'upi', 'cash'])
        .optional(),
    }),
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { startDate, endDate, schoolId, paymentMethod } = req.query as any;
      const currentUser = req.user!;

      // Role-based filtering
      let targetSchoolId = schoolId;
      if (currentUser.role === 'school_admin') {
        targetSchoolId = currentUser.schoolId;
      }

      const analytics = await paymentService.getPaymentAnalytics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        schoolId: targetSchoolId,
        paymentMethod,
      });

      res.json({
        data: analytics,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get payment analytics', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/payments
 * List payments with comprehensive filtering
 */
router.get(
  '/',
  readRateLimit,
  authMiddleware,
  validateRequest({ query: paymentQuerySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const currentUser = req.user!;
      const {
        status,
        paymentMethod,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = '1',
        limit = '20',
      } = req.query as any;

      const pageNum = parseInt(page, 10);
      const limitNum = Math.min(parseInt(limit, 10), 100);

      // Build filters based on user role
      const filters: any = {};

      // Role-based access control
      switch (currentUser.role) {
        case 'student':
        case 'parent':
          filters.userId = currentUser.id;
          break;
        case 'school_admin':
          // Can see payments for their school (would need to join with orders)
          break;
        // Admin can see all
      }

      // Apply filters
      if (status) filters.status = status;
      if (paymentMethod) filters.method = paymentMethod;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }
      if (minAmount || maxAmount) {
        filters.amount = {};
        if (minAmount) filters.amount.gte = parseFloat(minAmount);
        if (maxAmount) filters.amount.lte = parseFloat(maxAmount);
      }

      const payments = await paymentService.findAll(filters);

      // Apply pagination
      const offset = (pageNum - 1) * limitNum;
      const paginatedPayments = payments.slice(offset, offset + limitNum);

      res.json({
        data: paginatedPayments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: payments.length,
          totalPages: Math.ceil(payments.length / limitNum),
          hasNext: pageNum < Math.ceil(payments.length / limitNum),
          hasPrev: pageNum > 1,
        },
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to list payments', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/payments/webhook
 * Handle payment gateway webhooks
 */
router.post(
  '/webhook',
  webhookRateLimit,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);

      if (!signature) {
        res.status(400).json({ error: 'Missing webhook signature' });
        return;
      }

      const result = await paymentService.handleWebhook(body, signature);

      if (!result.success) {
        logger.warn('Webhook processing failed', { error: result.message });
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({ status: 'ok' });
    } catch (error: unknown) {
      logger.error('Webhook processing error', error instanceof Error ? error : undefined);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
