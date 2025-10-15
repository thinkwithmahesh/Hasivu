/**
 * HASIVU Platform - Order Processing API Routes
 *
 * Enterprise-grade order management with:
 * - Real-time order tracking and updates
 * - Complex order workflow management
 * - Payment integration
 * - Inventory management
 * - Notification system
 * - Performance optimization
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  APIRequest,
  APIResponse,
  validateRequest,
  paginationMiddleware,
  createRateLimiter,
} from '../middleware/api.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { PaymentService } from '../services/payment.service';
import { InventoryService } from '../services/inventory.service';
import { NotificationService } from '../services/notification.service';
import { CacheService } from '../services/cache.service';
import { AuditService } from '../services/audit.service';
import { WebSocketService } from '../services/websocket.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = express.Router();
// Create service instances
const orderService = OrderService.getInstance();
const paymentService = new PaymentService();
const inventoryService = new InventoryService();
const notificationService = NotificationService.getInstance();
const cacheService = new CacheService();
const auditService = new AuditService();
const wsService = new WebSocketService();

// Rate limiters
const readRateLimit = createRateLimiter({ requests: 150, windowMs: 60000 });
const writeRateLimit = createRateLimiter({ requests: 30, windowMs: 60000 });
const publicRateLimit = createRateLimiter({ requests: 100, windowMs: 60000 });

// Validation Schemas
const createOrderSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  schoolId: z.string().uuid('Invalid school ID'),
  deliveryDate: z.string().datetime('Invalid delivery date'),
  deliveryTimeSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),

  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid('Invalid menu item ID'),
        quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Max 10 items per type'),
        customizations: z
          .object({
            spiceLevel: z.number().min(0).max(5).optional(),
            excludeIngredients: z.array(z.string()).optional(),
            addOns: z.array(z.string()).optional(),
            specialInstructions: z.string().max(200).optional(),
          })
          .optional(),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, 'At least one item is required')
    .max(20, 'Maximum 20 different items per order'),

  paymentMethod: z.enum(['wallet', 'card', 'upi', 'cash', 'subscription']),
  paymentDetails: z
    .object({
      cardId: z.string().optional(),
      upiId: z.string().optional(),
      walletId: z.string().optional(),
    })
    .optional(),

  deliveryAddress: z.object({
    type: z.enum(['school', 'home', 'custom']),
    address: z.string().optional(),
    coordinates: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
    specialInstructions: z.string().max(300).optional(),
  }),

  discountCode: z.string().optional(),
  specialRequests: z.string().max(500).optional(),
  parentConsent: z.boolean().default(false),
});

const updateOrderSchema = z.object({
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),

  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().min(1).max(10),
        customizations: z
          .object({
            spiceLevel: z.number().min(0).max(5).optional(),
            excludeIngredients: z.array(z.string()).optional(),
            addOns: z.array(z.string()).optional(),
            specialInstructions: z.string().max(200).optional(),
          })
          .optional(),
        unitPrice: z.number().min(0),
      })
    )
    .optional(),

  deliveryTimeSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  specialRequests: z.string().max(500).optional(),
  cancellationReason: z.string().max(300).optional(),
});

const orderQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),

  // Filters
  status: z
    .enum([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ])
    .optional(),
  studentId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  paymentMethod: z.enum(['wallet', 'card', 'upi', 'cash', 'subscription']).optional(),
  deliveryTimeSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),

  // Date filters
  deliveryDateFrom: z.string().datetime().optional(),
  deliveryDateTo: z.string().datetime().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),

  // Search and sort
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'deliveryDate', 'total', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),

  // Additional filters
  minAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  maxAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  includeCompleted: z
    .string()
    .regex(/^(true|false)$/)
    .optional(),
});

const orderParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

/**
 * GET /api/v1/orders
 * List orders with comprehensive filtering
 */
router.get(
  '/',
  readRateLimit,
  authMiddleware,
  paginationMiddleware,
  validateRequest({ query: orderQuerySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const currentUser = req.user!;
      const {
        status,
        studentId,
        schoolId,
        paymentMethod,
        deliveryTimeSlot,
        deliveryDateFrom,
        deliveryDateTo,
        createdFrom,
        createdTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        minAmount,
        maxAmount,
        includeCompleted = 'true',
      } = req.query as any;

      const { page, limit, offset } = req.pagination!;

      // Build cache key
      const cacheKey = `orders:list:${JSON.stringify({
        ...req.query,
        page,
        limit,
        userId: currentUser.id,
        userRole: currentUser.role,
      })}`;

      // Check cache (shorter TTL for real-time data)
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Orders list served from cache', { requestId: req.requestId });
        res.json(cached);
        return;
      }

      // Build filters based on user role and permissions
      const filters: any = {};

      // Role-based access control
      switch (currentUser.role) {
        case 'student':
          filters.studentId = currentUser.id;
          break;
        case 'parent':
          // Parents can see orders for their children
          const children = await orderService.getParentChildren(currentUser.id);
          filters.studentId = children.map(child => child.id);
          break;
        case 'teacher':
        case 'school_admin':
          filters.schoolId = currentUser.schoolId;
          break;
        case 'kitchen_staff':
          filters.schoolId = currentUser.schoolId;
          filters.status = ['confirmed', 'preparing', 'ready', 'out_for_delivery'];
          break;
        // Admin can see all orders
      }

      // Apply user-provided filters
      if (status) filters.status = status;
      if (studentId && ['school_admin', 'admin', 'teacher'].includes(currentUser.role)) {
        filters.studentId = studentId;
      }
      if (schoolId && ['admin'].includes(currentUser.role)) {
        filters.schoolId = schoolId;
      }
      if (paymentMethod) filters.paymentMethod = paymentMethod;
      if (deliveryTimeSlot) filters.deliveryTimeSlot = deliveryTimeSlot;

      // Date filters
      if (deliveryDateFrom || deliveryDateTo) {
        filters.deliveryDate = {};
        if (deliveryDateFrom) filters.deliveryDate.$gte = new Date(deliveryDateFrom);
        if (deliveryDateTo) filters.deliveryDate.$lte = new Date(deliveryDateTo);
      }

      if (createdFrom || createdTo) {
        filters.createdAt = {};
        if (createdFrom) filters.createdAt.$gte = new Date(createdFrom);
        if (createdTo) filters.createdAt.$lte = new Date(createdTo);
      }

      // Amount filters
      if (minAmount || maxAmount) {
        filters.total = {};
        if (minAmount) filters.total.$gte = parseFloat(minAmount);
        if (maxAmount) filters.total.$lte = parseFloat(maxAmount);
      }

      if (search) filters.search = search;
      if (includeCompleted === 'false') {
        filters.status = { $nin: ['delivered', 'cancelled', 'refunded'] };
      }

      const result = await orderService.findMany({
        ...filters,
        skip: (page - 1) * limit,
        take: limit,
        sortBy,
        sortOrder,
      });

      // Get total count separately
      const totalCount = await OrderRepository.count(filters);

      // Enrich orders with real-time data
      const enrichedOrders = await Promise.all(
        result.items.map(async (order: any) => {
          const [trackingInfo, estimatedDelivery] = await Promise.all([
            orderService.getTrackingInfo(order.id),
            orderService.estimateDeliveryTime(order.id),
          ]);

          return {
            ...order,
            trackingInfo,
            estimatedDelivery,
            // Remove sensitive data based on role
            paymentDetails: ['admin', 'school_admin'].includes(currentUser.role)
              ? order.paymentDetails
              : undefined,
          };
        })
      );

      const statusCounts = await orderService.getStatusCounts(currentUser.schoolId || '');
      const response = {
        data: enrichedOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
        summary: {
          statusCounts,
          totalAmount: 0, // Would need to calculate from orders
          avgOrderValue: 0, // Would need to calculate from orders
        },
        requestId: req.requestId,
      };

      // Cache for 2 minutes (real-time data needs frequent updates)
      await cacheService.set(cacheKey, response, { ttl: 120 });

      res.json(response);
    } catch (error: unknown) {
      logger.error('Failed to list orders', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
        query: req.query,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/orders/:id
 * Get detailed order information with real-time tracking
 */
router.get(
  '/:id',
  readRateLimit,
  authMiddleware,
  validateRequest({ params: orderParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const order = await orderService.findById(id);

      if (!order) {
        throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
      }

      // Check access permissions
      const canView = await orderService.canUserAccessOrder(currentUser.id, id);
      if (!canView) {
        throw new AppError('You do not have permission to view this order', 403, true);
      }

      // Enrich with real-time data
      const [trackingInfo, deliveryStatus, paymentStatus, preparationInfo] = await Promise.all([
        orderService.getDetailedTrackingInfo(id),
        orderService.getDeliveryStatus(id),
        PaymentService.getPaymentStatus(order.id),
        orderService.getPreparationInfo(id),
      ]);

      const enrichedOrder = {
        ...order,
        trackingInfo,
        deliveryStatus,
        paymentStatus,
        preparationInfo,

        // Add role-specific data
        canCancel: await orderService.canCancelOrder(id),
        canModify: await orderService.canModifyOrder(id),
        refundEligible: await orderService.isRefundEligible(id),

        // Remove sensitive data based on role
        paymentDetails: ['admin', 'school_admin', 'kitchen_staff'].includes(currentUser.role)
          ? (order as any).paymentDetails
          : undefined,

        deliveryDetails:
          order.studentId === currentUser.id ||
          ['admin', 'school_admin', 'kitchen_staff', 'delivery_staff'].includes(currentUser.role)
            ? (order as any).deliveryDetails
            : undefined,
      };

      // Audit log
      await auditService.log(currentUser.id, 'orders.view', {
        orderId: id,
        orderStatus: order.status,
        requestId: req.requestId,
      });

      res.json({
        data: enrichedOrder,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to get order',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId: req.requestId,
          orderId: req.params.id,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * POST /api/v1/orders
 * Create new order with comprehensive validation
 */
router.post(
  '/',
  writeRateLimit,
  authMiddleware,
  requireRole(['student', 'parent']),
  validateRequest({ body: createOrderSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const orderData = req.body;
      const currentUser = req.user!;

      // Validate user can place order for student
      if (currentUser.role === 'parent') {
        const canOrderFor = await orderService.canParentOrderForStudent(
          currentUser.id,
          orderData.studentId
        );
        if (!canOrderFor) {
          throw new AppError(
            'You do not have permission to place orders for this student',
            403,
            true
          );
        }
      } else if (currentUser.role === 'student' && orderData.studentId !== currentUser.id) {
        throw new AppError('Students can only place orders for themselves', 403, true);
      }

      // Validate delivery date and time slot
      const deliveryValidation = await orderService.validateDeliverySlot(
        orderData.deliveryDate,
        orderData.deliveryTimeSlot
      );

      if (!deliveryValidation.valid) {
        throw new AppError(`Invalid delivery slot: ${deliveryValidation.message}`, 400, true);
      }

      // Validate menu items availability and calculate total
      const itemsValidation = await orderService.validateOrderItems(orderData.items);

      if (!itemsValidation.valid) {
        throw new AppError(
          `Invalid order items: ${itemsValidation.errors ? itemsValidation.errors.join(', ') : 'Unknown error'}`,
          400,
          true
        );
      }

      // Check inventory availability
      const inventoryCheck = await inventoryService.checkAvailability(
        orderData.items,
        orderData.schoolId,
        orderData.deliveryDate
      );

      if (!inventoryCheck.isAvailable) {
        throw new AppError(
          `Insufficient inventory: ${inventoryCheck.unavailableItems.join(', ')}`,
          400,
          true
        );
      }

      // Calculate pricing with discounts
      const pricingInfo = await orderService.calculateOrderPricing(orderData.items);

      // Validate payment order
      const paymentValidation = await PaymentService.validatePaymentOrder(orderData.paymentMethod);

      if (!paymentValidation) {
        throw new AppError('Invalid payment method', 400, true);
      }

      // Create order with transaction
      const createOrderResult = await OrderService.createOrder({
        ...orderData,
        createdBy: currentUser.id,
        status: 'pending',
      });

      if (!createOrderResult.success || !createOrderResult.data) {
        throw new AppError('Failed to create order', 500, true);
      }

      const newOrder = createOrderResult.data;

      // Reserve inventory
      await inventoryService.reserveItems(orderData.items, {
        orderId: newOrder.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Process payment using static method
      const paymentResult = await PaymentService.processPayment({
        orderId: newOrder.id,
        amount: (newOrder as any).total || 0,
        currency: (newOrder as any).currency || 'INR',
        paymentMethod: orderData.paymentMethod,
        paymentDetails: orderData.paymentDetails,
      });

      if (paymentResult.success && paymentResult.data) {
        // Update order status
        await orderService.updateStatus(newOrder.id, 'confirmed');

        // Confirm inventory reservation
        await inventoryService.confirmReservation(newOrder.id);

        // Send notifications
        await (notificationService.constructor as any).sendOrderConfirmation(newOrder.id);

        // Real-time update via WebSocket
        wsService.emitToUser(currentUser.id, 'order.created', {
          orderId: newOrder.id,
          status: 'confirmed',
        });

        // Emit to school kitchen staff
        wsService.emitToSchool(orderData.schoolId, 'new.order', {
          orderId: newOrder.id,
          deliveryTimeSlot: orderData.deliveryTimeSlot,
          deliveryDate: orderData.deliveryDate,
        });
      } else {
        // Payment failed - cancel order and release inventory
        await orderService.updateStatus(newOrder.id, 'cancelled');

        await inventoryService.releaseReservation(newOrder.id);

        throw new AppError(
          `Payment failed: ${paymentResult.error?.message || 'Unknown error'}`,
          402,
          true
        );
      }

      // Invalidate caches
      await cacheService.invalidatePattern('orders:*');
      await cacheService.invalidatePattern(`inventory:${orderData.schoolId}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'orders.create', {
        orderId: newOrder.id,
        studentId: orderData.studentId,
        schoolId: orderData.schoolId,
        total: (newOrder as any).total || 0,
        itemCount: orderData.items.length,
        requestId: req.requestId,
      });

      logger.info('Order created successfully', {
        orderId: newOrder.id,
        studentId: orderData.studentId,
        schoolId: orderData.schoolId,
        total: (newOrder as any).total || 0,
        paymentMethod: orderData.paymentMethod,
        createdBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: {
          ...newOrder,
          paymentResult,
        },
        message: 'Order created successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to create order',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId: req.requestId,
          orderData: { ...req.body, paymentDetails: undefined },
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * PUT /api/v1/orders/:id
 * Update order with status management
 */
router.put(
  '/:id',
  writeRateLimit,
  authMiddleware,
  validateRequest({
    params: orderParamsSchema,
    body: updateOrderSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const currentUser = req.user!;

      const existingOrder = await orderService.findById(id);
      if (!existingOrder) {
        throw new AppError('Order not found', 404, true);
      }

      // Check update permissions
      const canUpdate = await orderService.canUserUpdateOrder(currentUser.id, id);
      if (!canUpdate) {
        throw new AppError('You do not have permission to update this order', 403, true);
      }

      // Validate status transitions
      if (updateData.status) {
        const canChangeStatus = await orderService.canChangeStatus(id, updateData.status);

        if (!canChangeStatus) {
          throw new AppError(
            `Cannot change status from ${existingOrder.status} to ${updateData.status}`,
            400,
            true
          );
        }
      }

      // Handle item modifications
      if (updateData.items) {
        const modificationValidation = await orderService.validateOrderItems(updateData.items);

        if (!modificationValidation.valid) {
          throw new AppError(
            `Cannot modify items: ${modificationValidation.errors ? modificationValidation.errors.join(', ') : 'Unknown error'}`,
            400,
            true
          );
        }

        // Update inventory reservations if needed
        await inventoryService.updateReservation(id, updateData.items);
      }

      // Update order
      const updatedOrder = await orderService.update(id, {
        ...updateData,
        updatedBy: currentUser.id,
      });

      // Handle status-specific actions
      if (updateData.status) {
        await orderService.handleStatusUpdate(id, updateData.status);

        // Send status notifications
        await (notificationService.constructor as any).sendStatusUpdate(id, updateData.status);

        // Real-time updates
        wsService.emitToUser(existingOrder.studentId, 'order.status.updated', {
          orderId: id,
          status: updateData.status,
          timestamp: new Date(),
        });

        if ((existingOrder as any).parentId) {
          wsService.emitToUser((existingOrder as any).parentId, 'order.status.updated', {
            orderId: id,
            status: updateData.status,
            timestamp: new Date(),
          });
        }
      }

      // Invalidate caches
      await cacheService.invalidatePattern(`orders:*`);
      await cacheService.invalidatePattern(`order:${id}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'orders.update', {
        orderId: id,
        changes: Object.keys(updateData),
        previousStatus: existingOrder.status,
        newStatus: updateData.status,
        requestId: req.requestId,
      });

      logger.info('Order updated successfully', {
        orderId: id,
        changes: Object.keys(updateData),
        updatedBy: currentUser.id,
        previousStatus: existingOrder.status,
        newStatus: updateData.status,
        requestId: req.requestId,
      });

      res.json({
        data: updatedOrder,
        message: 'Order updated successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to update order',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId: req.requestId,
          orderId: req.params.id,
          updateData: req.body,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * POST /api/v1/orders/:id/cancel
 * Cancel order with refund processing
 */
router.post(
  '/:id/cancel',
  writeRateLimit,
  authMiddleware,
  validateRequest({
    params: orderParamsSchema,
    body: z.object({
      reason: z.string().min(1, 'Cancellation reason is required').max(300),
      refundRequested: z.boolean().default(true),
    }),
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, refundRequested } = req.body;
      const currentUser = req.user!;

      const order = await orderService.findById(id);
      if (!order) {
        throw new AppError('Order not found', 404, true);
      }

      // Check cancellation permissions
      const canCancel = await orderService.canCancelOrder(id);
      if (!canCancel) {
        throw new AppError('Cannot cancel order', 400, true);
      }

      // Process cancellation
      const cancellationResult = await orderService.cancelOrder(id);

      // Handle refund if requested and eligible
      let refundResult = null;
      if (refundRequested) {
        try {
          // Find payment by orderId and process refund
          const payments = await paymentService.findByOrder(id);
          if (payments.length > 0) {
            const payment = payments[0];
            await paymentService.refund(payment.id);
            refundResult = { amount: payment.amount, status: 'refunded' };
          }
        } catch (error) {
          logger.error('Refund processing failed', error instanceof Error ? error : undefined);
        }
      }

      // Release inventory
      await inventoryService.releaseReservation(id);

      // Send notifications
      await (notificationService.constructor as any).sendOrderCancellation(id, reason);

      // Real-time updates
      wsService.emitToUser(order.studentId, 'order.cancelled', {
        orderId: id,
        reason,
        refundAmount: refundResult?.amount,
        timestamp: new Date(),
      });

      // Audit log
      await auditService.log(currentUser.id, 'orders.cancel', {
        orderId: id,
        reason,
        refundRequested,
        refundAmount: refundResult?.amount,
        requestId: req.requestId,
      });

      logger.info('Order cancelled successfully', {
        orderId: id,
        reason,
        refundRequested,
        refundAmount: refundResult?.amount,
        cancelledBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: {
          ...cancellationResult,
          refund: refundResult,
        },
        message: 'Order cancelled successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to cancel order',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId: req.requestId,
          orderId: req.params.id,
          reason: req.body.reason,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

/**
 * GET /api/v1/orders/:id/tracking
 * Get real-time order tracking information
 */
router.get(
  '/:id/tracking',
  readRateLimit,
  authMiddleware,
  validateRequest({ params: orderParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const order = await orderService.findById(id);
      if (!order) {
        throw new AppError('Order not found', 404, true);
      }

      // Check access permissions
      const canView = await orderService.canUserAccessOrder(currentUser.id, id);
      if (!canView) {
        throw new AppError('You do not have permission to track this order', 403, true);
      }

      // Get comprehensive tracking info
      const trackingInfo = await orderService.getComprehensiveTrackingInfo(id);

      res.json({
        data: trackingInfo,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error(
        'Failed to get order tracking',
        error instanceof Error ? error : new Error(String(error)),
        {
          requestId: req.requestId,
          orderId: req.params.id,
          userId: req.user?.id,
        }
      );
      throw error;
    }
  }
);

export default router;
