/**
 * Unit tests for NotificationService aligned with current implementation:
 * Prisma-backed persistence, in-memory template stubs, static send paths.
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../../src/services/notification.service';

const prismaMock = () => {
  const notification = {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
  return {
    notification,
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notificationTemplate: {
      findFirst: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
};

function stubNotification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'order_confirmation',
    title: 'Order Confirmed',
    message: 'Your order has been confirmed.',
    data: JSON.stringify({ channels: undefined, priority: 'normal' }),
    status: 'pending',
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    scheduledFor: null,
    isRead: false,
    ...overrides,
  };
}

describe('NotificationService', () => {
  let client: ReturnType<typeof prismaMock>;

  beforeEach(() => {
    NotificationService.resetInstanceForTests();
    client = prismaMock();
    client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      schoolId: 'school-1',
      preferences: '{}',
    });
    client.user.update.mockResolvedValue({});
    client.notificationTemplate.findFirst.mockResolvedValue(null);
    client.outboxEvent.create.mockResolvedValue({});
    client.notification.count.mockResolvedValue(0);
    (PrismaClient as unknown as jest.Mock).mockImplementation(() => client);
  });

  afterEach(() => {
    NotificationService.resetInstanceForTests();
    jest.clearAllMocks();
  });

  describe('sendNotification', () => {
    it('returns TEMPLATE_NOT_FOUND for unknown template', async () => {
      const result = await NotificationService.sendNotification({
        templateId: 'nonexistent_template',
        recipientId: 'user-1',
        recipientType: 'parent',
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEMPLATE_NOT_FOUND');
      expect(client.notification.create).not.toHaveBeenCalled();
    });

    it('creates notification, delivers in_app, and marks sent on success', async () => {
      const created = stubNotification({ id: 'n-abc' });
      client.notification.create.mockResolvedValue(created);
      client.notification.update.mockResolvedValue({});
      client.notification.count.mockResolvedValue(1);

      const result = await NotificationService.sendNotification({
        templateId: 'order_confirmation',
        recipientId: 'parent-1',
        recipientType: 'parent',
        variables: {
          orderId: 'ORD-1',
          totalAmount: '99',
          deliveryDate: '2026-05-10',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.notification?.id).toBe('n-abc');
      expect(result.data?.templateData?.title).toBe('Order Confirmed');
      expect(client.notification.create).toHaveBeenCalledTimes(1);
      expect(client.notification.update.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('sendOrderConfirmation', () => {
    it('throws when sendNotification fails', async () => {
      const err = new Error('db down');
      client.notification.create.mockRejectedValue(err);

      await expect(
        NotificationService.sendOrderConfirmation({
          orderId: 'o1',
          studentId: 's1',
          parentId: 'p1',
          totalAmount: 10,
          deliveryDate: new Date('2026-05-01'),
        })
      ).rejects.toThrow('db down');
    });

    it('resolves when notification pipeline succeeds', async () => {
      client.notification.create.mockResolvedValue(stubNotification());
      client.notification.update.mockResolvedValue({});
      client.notification.count.mockResolvedValue(1);

      await expect(
        NotificationService.sendOrderConfirmation({
          orderId: 'o1',
          studentId: 's1',
          parentId: 'p1',
          totalAmount: 10,
          deliveryDate: new Date('2026-05-01'),
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('sendOrderStatusUpdate', () => {
    it('returns success with created notification', async () => {
      const n = stubNotification({ type: 'order_status_update' });
      client.notification.create.mockResolvedValue(n);
      client.outboxEvent.create.mockResolvedValue({});

      const result = await NotificationService.sendOrderStatusUpdate({
        orderId: 'o1',
        studentId: 's1',
        parentId: 'p1',
        newStatus: 'shipped',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('notif-1');
    });

    it('returns NOTIFICATION_FAILED on create error', async () => {
      client.notification.create.mockRejectedValue(new Error('fail'));

      const result = await NotificationService.sendOrderStatusUpdate({
        orderId: 'o1',
        studentId: 's1',
        parentId: 'p1',
        newStatus: 'shipped',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOTIFICATION_FAILED');
    });
  });

  describe('getNotificationAnalytics', () => {
    it('returns zeros when no notifications', async () => {
      client.notification.findMany.mockResolvedValue([]);

      const result = await NotificationService.getNotificationAnalytics();

      expect(result.success).toBe(true);
      expect(result.data?.totalSent).toBe(0);
      expect(result.data?.deliveryRate).toBe(0);
      expect(result.data?.readRate).toBe(0);
    });

    it('aggregates delivered and read counts', async () => {
      client.notification.findMany.mockResolvedValue([
        { id: '1', type: 'order_confirmation', status: 'sent', createdAt: new Date() },
        { id: '2', type: 'order_confirmation', status: 'delivered', createdAt: new Date() },
        { id: '3', type: 'payment_success', status: 'read', createdAt: new Date() },
      ]);

      const result = await NotificationService.getNotificationAnalytics();

      expect(result.success).toBe(true);
      expect(result.data?.totalSent).toBe(3);
      expect(result.data?.totalDelivered).toBe(2);
      expect(result.data?.totalRead).toBe(1);
      expect(result.data?.templateStats.order_confirmation?.sent).toBe(2);
      expect(result.data?.templateStats.payment_success?.read).toBe(1);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('merges partial preferences with stored/default preferences', async () => {
      const result = await NotificationService.updateNotificationPreferences('user-1', {
        channels: { push: false, email: true, sms: false, whatsapp: true, in_app: true, socket: true },
      });

      expect(result.success).toBe(true);
      expect(result.data?.channels.push).toBe(false);
      expect(result.data?.channels.email).toBe(true);
      expect(client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
        })
      );
    });
  });
});
