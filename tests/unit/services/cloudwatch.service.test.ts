// CloudWatch Service Unit Tests
// Infrastructure Reliability Expert

import { cloudwatchService } from '../../../src/services/cloudwatch.service';
import { metricsService } from '../../../src/services/metrics.service';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-cloudwatch-logs');

describe('CloudWatch Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('putMetric', () => {
    it('should add metric to buffer', async () => {
      await cloudwatchService.putMetric({
        metricName: 'TestMetric',
        value: 100,
        unit: StandardUnit.Count,
      });

      // Metric should be buffered
      expect(cloudwatchService['metricBuffer'].length).toBeGreaterThan(0);
    });

    it('should flush metrics when buffer is full', async () => {
      const flushSpy = jest.spyOn(cloudwatchService, 'flushMetrics');

      // Fill buffer beyond max size
      const promises = [];
      for (let i = 0; i < 25; i++) {
        promises.push(
          cloudwatchService.putMetric({
            metricName: 'TestMetric',
            value: i,
            unit: StandardUnit.Count,
          })
        );
      }

      await Promise.all(promises);

      expect(flushSpy).toHaveBeenCalled();
    });

    it('should include custom dimensions', async () => {
      await cloudwatchService.putMetric({
        metricName: 'TestMetric',
        value: 100,
        dimensions: {
          CustomDim: 'value',
        },
      });

      const buffer = cloudwatchService['metricBuffer'];
      expect(buffer[buffer.length - 1].Dimensions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Name: 'CustomDim',
            Value: 'value',
          }),
        ])
      );
    });
  });

  describe('trackBusinessMetric', () => {
    it('should track business metrics with correct namespace', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackBusinessMetric('Revenue', 1000);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'Revenue',
          value: 1000,
          namespace: 'HASIVU/Business',
        })
      );
    });
  });

  describe('trackPaymentTransaction', () => {
    it('should track successful payment transaction', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackPaymentTransaction('success', 500);

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'PaymentTransactions',
        1,
        { Status: 'success' }
      );

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'TotalRevenue',
        500,
        { Currency: 'INR' }
      );
    });

    it('should track failed payment transaction', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackPaymentTransaction('failed', 500);

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'PaymentTransactions',
        1,
        { Status: 'failed' }
      );
    });
  });

  describe('trackOrder', () => {
    it('should track order created', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackOrder('created', 'ord_123');

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'OrdersCreated',
        1,
        { OrderId: 'ord_123' }
      );
    });

    it('should track order completed', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackOrder('completed', 'ord_123');

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'OrdersCompleted',
        1,
        { OrderId: 'ord_123' }
      );
    });

    it('should track order cancelled', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackOrder('cancelled', 'ord_123');

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'OrdersCancelled',
        1,
        { OrderId: 'ord_123' }
      );
    });
  });

  describe('trackRFIDOperation', () => {
    it('should track successful RFID verification', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackRFIDOperation('verification', 'success');

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'RFIDOperations',
        1,
        {
          Operation: 'verification',
          Status: 'success',
        }
      );
    });

    it('should track failed RFID verification', async () => {
      const trackBusinessMetricSpy = jest.spyOn(
        cloudwatchService,
        'trackBusinessMetric'
      );

      await cloudwatchService.trackRFIDOperation('verification', 'failed');

      expect(trackBusinessMetricSpy).toHaveBeenCalledWith(
        'RFIDOperations',
        1,
        {
          Operation: 'verification',
          Status: 'failed',
        }
      );
    });
  });

  describe('trackApiPerformance', () => {
    it('should track API performance metrics', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackApiPerformance('/api/orders', 250, 200);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'ApiResponseTime',
          value: 250,
          unit: StandardUnit.Milliseconds,
          dimensions: {
            Endpoint: '/api/orders',
          },
        })
      );
    });

    it('should track API errors', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackApiPerformance('/api/orders', 250, 500);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'ApiErrorRate',
          value: 1,
          dimensions: expect.objectContaining({
            StatusCode: '500',
          }),
        })
      );
    });
  });

  describe('trackDatabaseQuery', () => {
    it('should track database query performance', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackDatabaseQuery('SELECT', 50, true);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'DatabaseQueryDuration',
          value: 50,
          unit: StandardUnit.Milliseconds,
          dimensions: {
            QueryType: 'SELECT',
          },
        })
      );
    });

    it('should track slow queries', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackDatabaseQuery('SELECT', 1500, true);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'SlowQueries',
          value: 1,
        })
      );
    });

    it('should track query errors', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackDatabaseQuery('INSERT', 100, false);

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'QueryErrors',
          value: 1,
        })
      );
    });
  });

  describe('trackSecurityEvent', () => {
    it('should track failed login attempts', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackSecurityEvent('failed_login', 'user_123');

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'FailedLoginAttempts',
          value: 1,
          namespace: 'HASIVU/Security',
        })
      );
    });

    it('should track suspicious activity', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackSecurityEvent('suspicious_activity');

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'SuspiciousActivity',
          value: 1,
        })
      );
    });

    it('should track fraud attempts', async () => {
      const putMetricSpy = jest.spyOn(cloudwatchService, 'putMetric');

      await cloudwatchService.trackSecurityEvent('fraud_attempt');

      expect(putMetricSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metricName: 'PaymentFraudAttempts',
          value: 1,
        })
      );
    });
  });

  describe('flushMetrics', () => {
    it('should not flush if buffer is empty', async () => {
      cloudwatchService['metricBuffer'] = [];

      await cloudwatchService.flushMetrics();

      // Should complete without errors
      expect(cloudwatchService['metricBuffer'].length).toBe(0);
    });

    it('should clear buffer after successful flush', async () => {
      await cloudwatchService.putMetric({
        metricName: 'TestMetric',
        value: 100,
      });

      await cloudwatchService.flushMetrics();

      expect(cloudwatchService['metricBuffer'].length).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should flush metrics and clear timers on cleanup', async () => {
      const flushSpy = jest.spyOn(cloudwatchService, 'flushMetrics');

      await cloudwatchService.cleanup();

      expect(flushSpy).toHaveBeenCalled();
      expect(cloudwatchService['flushTimer']).toBeNull();
    });
  });
});

describe('Metrics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackPayment', () => {
    it('should track payment with all metrics', async () => {
      const trackPaymentTransactionSpy = jest.spyOn(
        cloudwatchService,
        'trackPaymentTransaction'
      );

      await metricsService.trackPayment({
        transactionId: 'txn_123',
        amount: 500,
        currency: 'INR',
        status: 'success',
        gateway: 'razorpay',
        processingTime: 1234,
      });

      expect(trackPaymentTransactionSpy).toHaveBeenCalledWith('success', 500);
    });
  });

  describe('trackOrderCreation', () => {
    it('should track order creation with all metrics', async () => {
      const trackOrderSpy = jest.spyOn(cloudwatchService, 'trackOrder');

      await metricsService.trackOrderCreation({
        orderId: 'ord_123',
        userId: 'user_123',
        schoolId: 'school_123',
        totalAmount: 500,
        itemCount: 3,
        processingTime: 890,
      });

      expect(trackOrderSpy).toHaveBeenCalledWith('created', 'ord_123');
    });
  });

  describe('trackRFID', () => {
    it('should track RFID operation', async () => {
      const trackRFIDSpy = jest.spyOn(
        cloudwatchService,
        'trackRFIDOperation'
      );

      await metricsService.trackRFID({
        rfidTag: 'RF123456',
        operation: 'verification',
        status: 'success',
        processingTime: 234,
        location: 'cafeteria_1',
      });

      expect(trackRFIDSpy).toHaveBeenCalledWith('verification', 'success');
    });
  });

  describe('trackSystemHealth', () => {
    it('should track system health metrics', async () => {
      const trackSystemHealthSpy = jest.spyOn(
        cloudwatchService,
        'trackSystemHealth'
      );

      const healthMetrics = {
        timestamp: Date.now(),
        components: {
          api: { healthy: true, responseTime: 50 },
          database: { healthy: true, connectionPool: 75 },
          cache: { healthy: true, hitRate: 85 },
          payment: { healthy: true, successRate: 98 },
        },
        overallScore: 95,
      };

      await metricsService.trackSystemHealth(healthMetrics);

      expect(trackSystemHealthSpy).toHaveBeenCalledWith(95);
    });
  });
});
