/**
 * HASIVU Platform - Notification Routes
 * Notification management and delivery API endpoints
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

const router = Router();
const prisma = new PrismaClient();

function getAuthenticatedUser(
  req: AuthenticatedRequest
): NonNullable<AuthenticatedRequest['user']> {
  if (!req.user) {
    throw Object.assign(new Error('Authenticated user missing'), { statusCode: 401 });
  }
  return req.user;
}

function isNotificationAdmin(user: NonNullable<AuthenticatedRequest['user']>): boolean {
  return ['admin', 'super_admin', 'school_admin'].includes(user.role);
}

function canAddressRecipient(
  actor: NonNullable<AuthenticatedRequest['user']>,
  recipient: { id: string; schoolId?: string | null }
): boolean {
  if (actor.id === recipient.id) {
    return true;
  }

  if (['admin', 'super_admin'].includes(actor.role)) {
    return true;
  }

  return (
    actor.role === 'school_admin' &&
    Boolean(actor.schoolId) &&
    actor.schoolId === recipient.schoolId
  );
}

async function getRecipientOrRespond(
  recipientId: string,
  res: Response
): Promise<{ id: string; schoolId: string | null } | null> {
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, schoolId: true },
  });

  if (!recipient) {
    res.status(404).json({ success: false, error: 'Recipient not found' });
    return null;
  }

  return recipient;
}

const allowedTemplateChannels = new Set(['push', 'email', 'sms', 'whatsapp', 'in_app', 'socket']);

/**
 * GET /api/v1/notifications
 * Get notifications for authenticated user
 */
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;

      const result = await NotificationService.getUserNotifications(user.id, {
        page,
        limit,
        status: status as any,
        priority: priority as any,
      });

      if (!result.success) {
        res.status(500).json({ success: false, error: result.error?.message });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notifications/analytics
 * Get notification analytics before dynamic :id matching.
 */
router.get(
  '/analytics',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const dateFrom = req.query.dateFrom
        ? new Date(req.query.dateFrom as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      const analytics = await NotificationService.getNotificationAnalytics({
        startDate: dateFrom,
        endDate: dateTo,
        userId: isNotificationAdmin(user) ? undefined : user.id,
        schoolId: user.role === 'school_admin' ? user.schoolId : undefined,
      });

      res.json({
        success: true,
        data: analytics,
        message: 'Analytics retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notifications/templates
 * List school/global notification templates.
 */
router.get(
  '/templates',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      if (user.role === 'school_admin' && !user.schoolId) {
        res.status(400).json({ success: false, error: 'School scope missing' });
        return;
      }

      const templates = await (prisma as any).notificationTemplate.findMany({
        where: {
          isActive: req.query.active === 'false' ? undefined : true,
          OR: [{ schoolId: user.schoolId ?? undefined }, { schoolId: null }],
        },
        orderBy: [{ schoolId: 'desc' }, { templateKey: 'asc' }, { channel: 'asc' }],
      });

      res.json({ success: true, data: templates, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/templates
 * Create a configurable notification template for the caller's school.
 */
router.post(
  '/templates',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!isNotificationAdmin(user)) {
        res.status(403).json({ success: false, error: 'Admin role required' });
        return;
      }
      if (user.role === 'school_admin' && !user.schoolId) {
        res.status(400).json({ success: false, error: 'School scope missing' });
        return;
      }

      const { templateKey, channel = 'in_app', title, body, variables = [] } = req.body;
      if (!templateKey || !title || !body) {
        res
          .status(400)
          .json({ success: false, error: 'templateKey, title, and body are required' });
        return;
      }
      if (!allowedTemplateChannels.has(channel)) {
        res.status(400).json({ success: false, error: 'Invalid notification channel' });
        return;
      }
      if (!Array.isArray(variables)) {
        res.status(400).json({ success: false, error: 'variables must be an array' });
        return;
      }

      const template = await (prisma as any).notificationTemplate.upsert({
        where: {
          schoolId_templateKey_channel: {
            schoolId: user.schoolId ?? null,
            templateKey,
            channel,
          },
        },
        create: {
          schoolId: user.schoolId ?? null,
          templateKey,
          channel,
          title,
          body,
          variables: JSON.stringify(variables),
          isActive: true,
        },
        update: {
          title,
          body,
          variables: JSON.stringify(variables),
          isActive: true,
        },
      });

      res.status(201).json({ success: true, data: template, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notifications/:id
 * Get notification by ID
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const notification = await NotificationService.getInstance().findById(req.params.id);

      if (!notification) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      if (notification.userId !== user.id) {
        res.status(403).json({ success: false, error: 'Unauthorized' });
        return;
      }

      res.json({ success: true, data: notification, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/send
 * Send single notification
 */
router.post(
  '/send',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const { recipientId, type, channel, priority, variables, metadata } = req.body;

      if (!recipientId || !type || !channel) {
        res.status(400).json({
          success: false,
          error: 'recipientId, type, and channel are required',
        });
        return;
      }
      if (!allowedTemplateChannels.has(channel)) {
        res.status(400).json({ success: false, error: 'Invalid notification channel' });
        return;
      }

      const recipient = await getRecipientOrRespond(recipientId, res);
      if (!recipient) {
        return;
      }
      if (!canAddressRecipient(user, recipient)) {
        res
          .status(403)
          .json({ success: false, error: 'Recipient is outside your notification scope' });
        return;
      }

      const result = await NotificationService.sendNotification({
        recipientId,
        templateId: type,
        recipientType: 'user' as any,
        channels: [channel],
        priority: priority || 'normal',
        variables: variables || {},
      });

      if (!result.success) {
        res.status(500).json({ success: false, error: result.error?.message });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Notification sent successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notifications/bulk
 * Send bulk notifications
 */
router.post(
  '/bulk',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const { notifications } = req.body;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        res.status(400).json({
          success: false,
          error: 'notifications array is required with at least one item',
        });
        return;
      }
      const firstChannel = notifications[0]?.channel;
      if (!firstChannel || !allowedTemplateChannels.has(firstChannel)) {
        res.status(400).json({ success: false, error: 'Invalid notification channel' });
        return;
      }

      for (const notification of notifications) {
        if (!notification.recipientId) {
          res
            .status(400)
            .json({ success: false, error: 'recipientId is required for every notification' });
          return;
        }

        const recipient = await getRecipientOrRespond(notification.recipientId, res);
        if (!recipient) {
          return;
        }
        if (!canAddressRecipient(user, recipient)) {
          res
            .status(403)
            .json({
              success: false,
              error: 'One or more recipients are outside your notification scope',
            });
          return;
        }
      }

      const result = await NotificationService.sendBulkNotifications({
        templateId: notifications[0].type,
        recipients: notifications.map((n: any) => ({
          recipientId: n.recipientId,
          recipientType: 'user' as any,
          variables: n.variables || {},
        })),
        channels: [notifications[0].channel],
        priority: notifications[0].priority || 'normal',
      });

      if (!result.success) {
        res.status(500).json({ success: false, error: result.error?.message });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Bulk notifications processed',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.put(
  '/:id/read',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const result = await NotificationService.markAsRead(req.params.id, user.id);

      if (!result.success) {
        res.status(404).json({ success: false, error: result.error?.message });
        return;
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Notification marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.put(
  '/read-all',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const count = await NotificationService.getInstance().markAllAsRead(user.id);

      res.json({
        success: true,
        data: { updatedCount: count },
        message: `${count} notifications marked as read`,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const notification = await NotificationService.getInstance().findById(req.params.id);

      if (!notification) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      if (notification.userId !== user.id) {
        res.status(403).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationService.getInstance().delete(req.params.id);

      res.json({
        success: true,
        message: 'Notification deleted',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default router;
