/**
 * Notification Send API - Integration Tests
 * Tests for /api/notifications/send endpoint
 * Epic 6: Notifications & Communication System
 */

import { test, expect } from '@playwright/test';

// Test data interfaces
interface NotificationRequest {
  recipientId: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  templateId?: string;
  subject?: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  scheduledTime?: string;
  metadata?: Record<string, any>;
}

interface NotificationResponse {
  success: boolean;
  data?: any;
  error?: string;
  notificationId?: string;
  deliveryStatus?: string;
}

// Test data factory
class NotificationTestDataFactory {
  private _counter =  0;

  createNotificationRequest(overrides: Partial<NotificationRequest> = {}): NotificationRequest {
    this.counter++;
    return {
      recipientId: `USER-${this.counter.toString().padStart(3, '0')}`,
      type: 'email',
      subject: `Test Notification ${this.counter}`,
      message: `This is test notification message ${this.counter}`,
      priority: 'medium',
      metadata: {
        testId: this.counter,
        category: 'test'
      },
      ...overrides
    };
  }

  createSMSNotification(): NotificationRequest {
    return this.createNotificationRequest({
      type: 'sms',
      message: `SMS test message ${this.counter}`
    });
  }

  createUrgentNotification(): NotificationRequest {
    return this.createNotificationRequest({
      priority: 'urgent',
      message: 'URGENT: This is an urgent notification requiring immediate attention'
    });
  }

  createScheduledNotification(): NotificationRequest {
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    return this.createNotificationRequest({
      scheduledTime: futureTime,
      message: 'This notification is scheduled for future delivery'
    });
  }
}

test.describe(_'Notification Send API Integration', _() => {
  let testData: NotificationTestDataFactory;

  test.beforeEach(_() => {
    _testData =  new NotificationTestDataFactory();
  });

  test.describe(_'Email Notifications', _() => {
    test(_'should send email notification successfully @p0 @smoke', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.notificationId).toBeDefined();
      expect(responseData.notificationId).toMatch(/^NOTIF-/);
      expect(responseData.deliveryStatus).toBe('queued');
      expect(responseData.data.recipientId).toBe(notificationRequest.recipientId);
      expect(responseData.data.type).toBe('email');
    });

    test(_'should handle email with template ID', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
        templateId: 'TEMPLATE-ORDER-CONFIRMATION',
        message: 'Order confirmation with template variables: {{orderId}}, {{amount}}',
        metadata: {
          orderId: 'ORD-123',
          amount: '₹1000'
        }
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.templateId).toBe('TEMPLATE-ORDER-CONFIRMATION');
      expect(responseData.data.templateVariables).toBeDefined();
    });

    test(_'should validate email format', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
        recipientId: 'invalid-email-user'
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      // Should still succeed at API level (validation happens during delivery)
      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.notificationId).toBeDefined();
    });
  });

  test.describe(_'SMS Notifications', _() => {
    test(_'should send SMS notification successfully', _async ({ request }) => {
      const _notificationRequest =  testData.createSMSNotification();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.type).toBe('sms');
      expect(responseData.data.message.length).toBeLessThanOrEqual(160); // SMS length limit
    });

    test(_'should handle long SMS messages with concatenation', _async ({ request }) => {
      const longMessage = 'A'.repeat(200); // Message longer than 160 chars
      const _notificationRequest =  testData.createNotificationRequest({
        type: 'sms',
        message: longMessage
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.parts).toBeGreaterThan(1); // Should be split into multiple parts
    });
  });

  test.describe(_'Priority Handling', _() => {
    test(_'should handle urgent priority notifications', _async ({ request }) => {
      const _notificationRequest =  testData.createUrgentNotification();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.priority).toBe('urgent');
      expect(responseData.data.urgent).toBe(true);
    });

    test(_'should prioritize urgent notifications in queue', _async ({ request }) => {
      // Send multiple notifications with different priorities
      const _urgentNotification =  testData.createUrgentNotification();
      const _normalNotification =  testData.createNotificationRequest({ priority: 'medium' });

      const [urgentResponse, normalResponse] = await Promise.all([
        request.post('/api/notifications/send', { data: urgentNotification }),
        request.post('/api/notifications/send', { data: normalNotification })
      ]);

      expect(urgentResponse.status()).toBe(200);
      expect(normalResponse.status()).toBe(200);

      const _urgentData =  await urgentResponse.json();
      const _normalData =  await normalResponse.json();

      expect(urgentData.data.priority).toBe('urgent');
      expect(normalData.data.priority).toBe('medium');

      // Urgent should have higher queue priority
      expect(urgentData.data.queuePriority).toBeGreaterThan(normalData.data.queuePriority);
    });
  });

  test.describe(_'Scheduled Notifications', _() => {
    test(_'should schedule notification for future delivery', _async ({ request }) => {
      const _notificationRequest =  testData.createScheduledNotification();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.status).toBe('scheduled');
      expect(responseData.data.scheduledTime).toBe(notificationRequest.scheduledTime);
      expect(new Date(responseData.data.scheduledTime)).toBeInstanceOf(Date);
    });

    test(_'should reject scheduled time in the past', _async ({ request }) => {
      const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const _notificationRequest =  testData.createNotificationRequest({
        scheduledTime: pastTime
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('past');
    });
  });

  test.describe(_'Validation', _() => {
    test(_'should reject notification with missing recipient', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();
      delete (notificationRequest as any).recipientId;

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('recipient');
    });

    test(_'should reject notification with missing message', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();
      notificationRequest._message =  '';

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('message');
    });

    test(_'should reject notification with invalid type', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
        type: 'invalid_type' as any
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('type');
    });

    test(_'should reject notification with invalid priority', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
        priority: 'invalid_priority' as any
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('priority');
    });
  });

  test.describe(_'Channel-Specific Validation', _() => {
    test(_'should validate WhatsApp message format', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
        type: 'whatsapp',
        message: 'Hello 👋 from WhatsApp! 🌟' // Contains emojis
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.type).toBe('whatsapp');
      expect(responseData.data.supportsEmojis).toBe(true);
    });

    test(_'should validate push notification payload size', _async ({ request }) => {
      const largeMessage = 'A'.repeat(2000); // Large message
      const _notificationRequest =  testData.createNotificationRequest({
        type: 'push',
        message: largeMessage
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.truncated).toBe(true); // Should be truncated for push
      expect(responseData.data.originalLength).toBe(2000);
    });
  });

  test.describe(_'Metadata Handling', _() => {
    test(_'should preserve and process metadata', _async ({ request }) => {
      const _metadata =  {
        orderId: 'ORD-123',
        amount: 1000,
        customerType: 'premium',
        tags: ['urgent', 'financial']
      };

      const _notificationRequest =  testData.createNotificationRequest({
        metadata
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadata).toEqual(metadata);
      expect(responseData.data.processedMetadata).toBeDefined();
    });

    test(_'should handle large metadata objects', _async ({ request }) => {
      const _largeMetadata =  {
        largeData: 'A'.repeat(10000), // 10KB of data
        nested: {
          level1: {
            level2: {
              data: Array(100).fill('test')
            }
          }
        }
      };

      const _notificationRequest =  testData.createNotificationRequest({
        metadata: largeMetadata
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.metadataSize).toBeGreaterThan(10000);
    });
  });

  test.describe(_'Delivery Tracking', _() => {
    test(_'should track notification delivery status', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(true);

      // Check delivery status endpoint
      const _statusResponse =  await request.get(`/api/notifications/status/${responseData.notificationId}`);

      expect(statusResponse.status()).toBe(200);

      const _statusData =  await statusResponse.json();
      expect(statusData.success).toBe(true);
      expect(statusData.data.notificationId).toBe(responseData.notificationId);
      expect(statusData.data.status).toBeDefined();
      expect(['queued', 'processing', 'delivered', 'failed']).toContain(statusData.data.status);
    });

    test(_'should provide delivery analytics', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      expect(response.status()).toBe(200);

      // Check analytics endpoint
      const _analyticsResponse =  await request.get('/api/notifications/analytics?period
      expect(analyticsResponse.status()).toBe(200);

      const _analyticsData =  await analyticsResponse.json();
      expect(analyticsData.success).toBe(true);
      expect(analyticsData.data).toBeDefined();
      expect(analyticsData.data.totalSent).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe(_'Error Handling', _() => {
    test(_'should handle malformed JSON request', _async ({ request }) => {
      const _response =  await request.post('/api/notifications/send', {
        data: '{ invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status()).toBe(400);

      const _responseData =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    test(_'should handle missing request body', _async ({ request }) => {
      const _response =  await request.post('/api/notifications/send', {
        data: {}
      });

      expect(response.status()).toBe(400);

      const responseData: _NotificationResponse =  await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('required');
    });

    test(_'should handle service unavailability', _async ({ request }) => {
      // This test assumes there's a way to simulate service unavailability
      // In real implementation, this might require mocking or special test endpoints
      const _notificationRequest =  testData.createNotificationRequest({
        type: 'email',
        message: 'SERVICE_UNAVAILABLE_TEST' // Special marker for testing
      });

      const _response =  await request.post('/api/notifications/send', {
        data: notificationRequest
      });

      // Should either succeed or fail gracefully
      const responseData: _NotificationResponse =  await response.json();

      if (response.status() === 503) {
        expect(responseData.success).toBe(false);
        expect(responseData.error).toContain('unavailable');
      } else {
        expect(response.status()).toBe(200);
        expect(responseData.success).toBe(true);
      }
    });
  });

  test.describe(_'Rate Limiting', _() => {
    test(_'should handle rate limiting for notification requests', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest();

      // Make multiple rapid requests
      const _promises =  Array(50).fill(null).map(() 
      const _responses =  await Promise.all(promises);

      // At least some should succeed, and some may be rate limited
      const _successCount =  responses.filter(r 
      const _rateLimitedCount =  responses.filter(r 
      expect(successCount + rateLimitedCount).toBe(50);
      expect(successCount).toBeGreaterThan(0); // At least one should succeed
    });
  });

  test.describe(_'Internationalization', _() => {
    test(_'should handle Unicode characters in messages', _async ({ request }) => {
      const _notificationRequest =  testData.createNotificationRequest({
