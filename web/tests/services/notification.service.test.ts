/**
 * Notification Service - Unit Tests
 * Tests for NotificationService singleton functionality
 * Epic 6: Notifications & Communication System
 */

import { jest } from '@jest/globals';
import { NotificationService } from '../../src/services/notification.service';

// Mock fetch globally
const _mockFetch =  jest.fn() as any;
global._fetch =  mockFetch;

describe(_'NotificationService', _() => {
  let notificationService: NotificationService;

  beforeEach(_() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset singleton instance
    (NotificationService as any)._instance =  null;

    // Get fresh instance
    _notificationService =  NotificationService.getInstance();
  });

  describe(_'Singleton Pattern', _() => {
    test(_'should return the same instance', _() => {
      const _instance1 =  NotificationService.getInstance();
      const _instance2 =  NotificationService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(NotificationService);
    });
  });

  describe(_'sendNotification', _() => {
    const _mockNotificationRequest =  {
      recipientId: 'USER-001',
      type: 'email' as const,
      subject: 'Test Notification',
      message: 'This is a test notification',
      priority: 'medium' as const,
      metadata: { test: true }
    };

    test(_'should send notification successfully', _async () => {
      const _mockResponse =  {
        success: true,
        data: { notificationId: 'NOTIF-123', status: 'queued' },
        notificationId: 'NOTIF-123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.sendNotification(mockNotificationRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockNotificationRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    test(_'should handle notification send failure', _async () => {
      const _errorResponse =  {
        error: 'Invalid recipient'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse)
      });

      const _result =  await notificationService.sendNotification(mockNotificationRequest);

      expect(result).toEqual({
        success: false,
        error: 'Invalid recipient'
      });
    });

    test(_'should handle network errors', _async () => {
      const _networkError =  new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);

      const _result =  await notificationService.sendNotification(mockNotificationRequest);

      expect(result).toEqual({
        success: false,
        error: 'Network connection failed'
      });
    });
  });

  describe(_'sendBulkNotifications', _() => {
    const _mockBulkRequest =  {
      recipientIds: ['USER-001', 'USER-002', 'USER-003'],
      type: 'sms' as const,
      subject: 'Bulk Test',
      message: 'Bulk notification test',
      priority: 'high' as const,
      metadata: { bulkId: 'BULK-123' }
    };

    test(_'should send bulk notifications successfully', _async () => {
      const _mockResponse =  {
        success: true,
        data: {
          totalSent: 3,
          failed: 0,
          notificationIds: ['NOTIF-1', 'NOTIF-2', 'NOTIF-3']
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.sendBulkNotifications(mockBulkRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockBulkRequest),
      });

      expect(result).toEqual(mockResponse);
    });

    test(_'should handle bulk send failure', _async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Bulk send failed' })
      });

      const _result =  await notificationService.sendBulkNotifications(mockBulkRequest);

      expect(result).toEqual({
        success: false,
        error: 'Bulk send failed'
      });
    });
  });

  describe(_'getNotificationAnalytics', _() => {
    test(_'should fetch notification analytics successfully', _async () => {
      const _mockRequest =  {
        schoolId: 'SCH-001',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        channel: 'email',
        metrics: ['delivery_rate', 'open_rate']
      };

      const _mockResponse =  {
        success: true,
        data: {
          totalSent: 1500,
          delivered: 1425,
          opened: 890,
          deliveryRate: 95,
          openRate: 62.5
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.getNotificationAnalytics(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/analytics?_schoolId = SCH-001&startDate
      expect(result).toEqual(mockResponse);
    });

    test(_'should handle analytics fetch failure', _async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Analytics unavailable' })
      });

      const _result =  await notificationService.getNotificationAnalytics();

      expect(result).toEqual({
        success: false,
        error: 'Analytics unavailable'
      });
    });
  });

  describe(_'getCommunicationPreferences', _() => {
    test(_'should fetch communication preferences successfully', _async () => {
      const _userId =  'USER-001';

      const _mockResponse =  {
        success: true,
        data: {
          email: true,
          sms: false,
          whatsapp: true,
          push: true,
          inApp: true,
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          },
          categories: {
            orders: true,
            payments: true,
            promotions: false,
            system: true,
            academic: true
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.getCommunicationPreferences(userId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/notifications/preferences/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'updateCommunicationPreferences', _() => {
    test(_'should update communication preferences successfully', _async () => {
      const _userId =  'USER-001';
      const _preferences =  {
        email: false,
        sms: true,
        categories: {
          orders: true,
          payments: true,
          promotions: false,
          system: true,
          academic: true
        }
      } as any;

      const _mockResponse =  {
        success: true,
        data: { updated: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.updateCommunicationPreferences(userId, preferences);

      expect(mockFetch).toHaveBeenCalledWith(`/api/notifications/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'getNotificationTemplates', _() => {
    test(_'should fetch notification templates successfully', _async () => {
      const _type =  'email';

      const _mockResponse =  {
        success: true,
        data: {
          templates: [
            {
              id: 'TEMPLATE-001',
              name: 'Order Confirmation',
              type: 'email',
              subject: 'Order Confirmed',
              content: 'Your order has been confirmed...'
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.getNotificationTemplates(type);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/templates?_type = email', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    test(_'should fetch all templates when no type specified', _async () => {
      const _mockResponse =  {
        success: true,
        data: { templates: [] }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await notificationService.getNotificationTemplates();

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe(_'testNotification', _() => {
    test(_'should send test notification successfully', _async () => {
      const _mockRequest =  {
        recipientId: 'USER-001',
        type: 'email' as const,
        subject: 'Test Notification',
        message: 'This is a test'
      };

      const _mockResponse =  {
        success: true,
        data: { testId: 'TEST-123', delivered: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.testNotification(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'getDeliveryStatus', _() => {
    test(_'should fetch delivery status successfully', _async () => {
      const _notificationId =  'NOTIF-123';

      const _mockResponse =  {
        success: true,
        data: {
          status: 'delivered',
          deliveredAt: '2024-01-15T10:30:00Z',
          channel: 'email',
          recipient: 'user@example.com'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.getDeliveryStatus(notificationId);

      expect(mockFetch).toHaveBeenCalledWith(`/api/notifications/status/${notificationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'scheduleNotification', _() => {
    test(_'should schedule notification successfully', _async () => {
      const _mockRequest =  {
        recipientId: 'USER-001',
        type: 'email' as const,
        subject: 'Scheduled Notification',
        message: 'This will be sent later',
        scheduledTime: '2024-01-20T15:00:00Z'
      };

      const _mockResponse =  {
        success: true,
        data: {
          notificationId: 'NOTIF-SCH-123',
          scheduledFor: '2024-01-20T15:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.scheduleNotification(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'getWhatsAppStatus', _() => {
    test(_'should fetch WhatsApp status successfully', _async () => {
      const _mockResponse =  {
        success: true,
        data: {
          connected: true,
          businessAccountId: 'WA-BA-123',
          phoneNumber: '+1234567890',
          qualityRating: 'GREEN'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.getWhatsAppStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/whatsapp/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'sendWhatsAppMessage', _() => {
    test(_'should send WhatsApp message successfully', _async () => {
      const _mockRequest =  {
        recipientId: 'USER-001',
        subject: 'WhatsApp Test',
        message: 'Hello from WhatsApp',
        priority: 'high' as const
      };

      const _mockResponse =  {
        success: true,
        data: {
          messageId: 'WA-MSG-123',
          status: 'sent',
          estimatedDelivery: '2024-01-15T10:31:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const _result =  await notificationService.sendWhatsAppMessage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...mockRequest, type: 'whatsapp' }),
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe(_'Error Handling Edge Cases', _() => {
    test(_'should handle fetch throwing non-Error object', _async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const _result =  await notificationService.sendNotification({
        recipientId: 'USER-001',
        type: 'email',
        message: 'Test'
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });

    test(_'should handle null error message', _async () => {
      mockFetch.mockRejectedValueOnce(null);

      const _result =  await notificationService.sendNotification({
        recipientId: 'USER-001',
        type: 'email',
        message: 'Test'
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });

    test(_'should handle invalid JSON response', _async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      const _result =  await notificationService.sendNotification({
        recipientId: 'USER-001',
        type: 'email',
        message: 'Test'
      });

      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });
});