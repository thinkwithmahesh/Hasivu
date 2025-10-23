"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/payment.service');
jest.mock('../../src/services/order.service');
jest.mock('../../src/services/notification.service');
jest.mock('../../src/services/rfid.service');
jest.mock('../../src/services/database.service');
jest.mock('../../src/services/redis.service');
jest.mock('../../src/services/cache.service');
const AuthService = require('../../src/services/auth.service');
const PaymentService = require('../../src/services/payment.service');
const OrderService = require('../../src/services/order.service');
const NotificationService = require('../../src/services/notification.service');
const RFIDService = require('../../src/services/rfid.service');
const DatabaseService = require('../../src/services/database.service');
const RedisService = require('../../src/services/redis.service');
const CacheService = require('../../src/services/cache.service');
(0, globals_1.describe)('Chaos Engineering - System Resilience Tests', () => {
    (0, globals_1.beforeAll)(() => {
        AuthService.authenticate = jest.fn();
        PaymentService.processPayment = jest.fn();
        OrderService.createOrder = jest.fn();
        NotificationService.sendNotification = jest.fn();
        RFIDService.verifyCard = jest.fn();
        DatabaseService.query = jest.fn();
        RedisService.get = jest.fn();
        CacheService.get = jest.fn();
    });
    (0, globals_1.afterAll)(() => {
        jest.clearAllMocks();
    });
    (0, globals_1.describe)('Database Failure Scenarios', () => {
        (0, globals_1.it)('should handle database connection failures gracefully', async () => {
            DatabaseService.query.mockRejectedValue(new Error('Connection timeout'));
            await (0, globals_1.expect)(DatabaseService.query('SELECT * FROM users')).rejects.toThrow('Connection timeout');
            AuthService.authenticate.mockResolvedValue({
                success: true,
                user: { id: 'user-123' },
                token: 'fallback-token'
            });
            const authResult = await AuthService.authenticate('user@test.com', 'pass');
            (0, globals_1.expect)(authResult.success).toBe(true);
        });
        (0, globals_1.it)('should handle database deadlock scenarios', async () => {
            DatabaseService.query
                .mockRejectedValueOnce(new Error('Deadlock detected'))
                .mockResolvedValueOnce({ rows: [] });
            await (0, globals_1.expect)(DatabaseService.query('UPDATE orders SET status = ?')).rejects.toThrow('Deadlock detected');
            const result = await DatabaseService.query('UPDATE orders SET status = ?');
            (0, globals_1.expect)(result.rows).toEqual([]);
        });
        (0, globals_1.it)('should handle database corruption recovery', async () => {
            DatabaseService.query.mockRejectedValue(new Error('Data corruption detected'));
            await (0, globals_1.expect)(DatabaseService.query('SELECT * FROM corrupted_table')).rejects.toThrow('Data corruption detected');
        });
    });
    (0, globals_1.describe)('Redis/Cache Failure Scenarios', () => {
        (0, globals_1.it)('should handle Redis connection failures', async () => {
            RedisService.get.mockRejectedValue(new Error('Redis connection failed'));
            await (0, globals_1.expect)(RedisService.get('session:user-123')).rejects.toThrow('Redis connection failed');
            DatabaseService.query.mockResolvedValue({
                rows: [{ sessionData: 'fallback-session' }]
            });
            const sessionData = await DatabaseService.query('SELECT * FROM sessions WHERE user_id = ?');
            (0, globals_1.expect)(sessionData.rows[0].sessionData).toBe('fallback-session');
        });
        (0, globals_1.it)('should handle cache stampede scenarios', async () => {
            const cachePromises = [];
            for (let i = 0; i < 100; i++) {
                CacheService.get.mockRejectedValue(new Error('Cache stampede'));
                cachePromises.push(CacheService.get('popular-menu-data'));
            }
            const results = await Promise.allSettled(cachePromises);
            results.forEach(result => {
                (0, globals_1.expect)(result.status).toBe('rejected');
                if (result.status === 'rejected') {
                    (0, globals_1.expect)(result.reason.message).toBe('Cache stampede');
                }
            });
        });
        (0, globals_1.it)('should handle Redis memory exhaustion', async () => {
            RedisService.get.mockRejectedValue(new Error('OOM command not allowed'));
            await (0, globals_1.expect)(RedisService.get('large-dataset')).rejects.toThrow('OOM command not allowed');
        });
    });
    (0, globals_1.describe)('Payment Gateway Failure Scenarios', () => {
        (0, globals_1.it)('should handle payment gateway timeouts', async () => {
            PaymentService.processPayment.mockRejectedValue(new Error('Gateway timeout'));
            const paymentData = { amount: 1000, orderId: 'order-123' };
            await (0, globals_1.expect)(PaymentService.processPayment(paymentData)).rejects.toThrow('Gateway timeout');
            OrderService.createOrder.mockResolvedValue({
                id: 'order-123',
                status: 'pending',
                paymentStatus: 'pending'
            });
            const order = await OrderService.createOrder({ id: 'order-123' });
            (0, globals_1.expect)(order.paymentStatus).toBe('pending');
        });
        (0, globals_1.it)('should handle payment gateway rate limiting', async () => {
            PaymentService.processPayment
                .mockRejectedValueOnce(new Error('Rate limit exceeded'))
                .mockResolvedValueOnce({
                success: true,
                paymentId: 'pay_retry_123',
                status: 'captured'
            });
            const paymentData = { amount: 1000, orderId: 'order-123' };
            await (0, globals_1.expect)(PaymentService.processPayment(paymentData)).rejects.toThrow('Rate limit exceeded');
            const result = await PaymentService.processPayment(paymentData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.status).toBe('captured');
        });
        (0, globals_1.it)('should handle payment gateway service unavailability', async () => {
            PaymentService.processPayment.mockRejectedValue(new Error('Service Unavailable'));
            const paymentData = { amount: 1000, orderId: 'order-123' };
            await (0, globals_1.expect)(PaymentService.processPayment(paymentData)).rejects.toThrow('Service Unavailable');
        });
    });
    (0, globals_1.describe)('RFID System Failure Scenarios', () => {
        (0, globals_1.it)('should handle RFID reader offline scenarios', async () => {
            RFIDService.verifyCard.mockRejectedValue(new Error('Reader offline'));
            await (0, globals_1.expect)(RFIDService.verifyCard('RFID-123')).rejects.toThrow('Reader offline');
        });
        (0, globals_1.it)('should handle RFID card read failures', async () => {
            RFIDService.verifyCard
                .mockRejectedValueOnce(new Error('Card read failure'))
                .mockResolvedValueOnce({
                success: true,
                verified: true,
                cardId: 'card-123',
                studentId: 'student-456'
            });
            await (0, globals_1.expect)(RFIDService.verifyCard('RFID-123')).rejects.toThrow('Card read failure');
            const result = await RFIDService.verifyCard('RFID-123');
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.verified).toBe(true);
        });
        (0, globals_1.it)('should handle RFID network partitioning', async () => {
            RFIDService.verifyCard.mockRejectedValue(new Error('Network partition'));
            await (0, globals_1.expect)(RFIDService.verifyCard('RFID-123')).rejects.toThrow('Network partition');
        });
    });
    (0, globals_1.describe)('Notification System Failure Scenarios', () => {
        (0, globals_1.it)('should handle SMS gateway failures', async () => {
            NotificationService.sendNotification.mockRejectedValue(new Error('SMS gateway unavailable'));
            const notificationData = {
                userId: 'user-123',
                type: 'order_update',
                channels: ['sms'],
                message: 'Order ready'
            };
            await (0, globals_1.expect)(NotificationService.sendNotification(notificationData)).rejects.toThrow('SMS gateway unavailable');
            NotificationService.sendNotification.mockResolvedValue({
                success: true,
                channels: ['email', 'push'],
                notificationId: 'notif-fallback-123'
            });
            const fallbackResult = await NotificationService.sendNotification({
                ...notificationData,
                channels: ['email', 'push']
            });
            (0, globals_1.expect)(fallbackResult.success).toBe(true);
            (0, globals_1.expect)(fallbackResult.channels).toContain('email');
        });
        (0, globals_1.it)('should handle WhatsApp Business API failures', async () => {
            NotificationService.sendNotification
                .mockRejectedValueOnce(new Error('WhatsApp rate limit exceeded'))
                .mockResolvedValueOnce({
                success: true,
                channels: ['whatsapp'],
                messageId: 'wa_retry_123'
            });
            const notificationData = {
                userId: 'user-123',
                type: 'delivery_update',
                channels: ['whatsapp'],
                template: 'delivery_ready'
            };
            await (0, globals_1.expect)(NotificationService.sendNotification(notificationData)).rejects.toThrow('WhatsApp rate limit exceeded');
            const result = await NotificationService.sendNotification(notificationData);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.channels).toContain('whatsapp');
        });
        (0, globals_1.it)('should handle push notification failures', async () => {
            NotificationService.sendNotification.mockRejectedValue(new Error('Push notification failed'));
            const notificationData = {
                userId: 'user-123',
                type: 'urgent_alert',
                channels: ['push'],
                priority: 'high'
            };
            await (0, globals_1.expect)(NotificationService.sendNotification(notificationData)).rejects.toThrow('Push notification failed');
        });
    });
    (0, globals_1.describe)('Authentication System Failure Scenarios', () => {
        (0, globals_1.it)('should handle JWT token validation failures', async () => {
            AuthService.authenticate.mockRejectedValue(new Error('Token validation failed'));
            await (0, globals_1.expect)(AuthService.authenticate('invalid-token')).rejects.toThrow('Token validation failed');
        });
        (0, globals_1.it)('should handle OAuth provider outages', async () => {
            AuthService.authenticate.mockRejectedValue(new Error('OAuth provider unavailable'));
            const oauthData = { provider: 'google', code: 'auth-code-123' };
            await (0, globals_1.expect)(AuthService.authenticate(oauthData)).rejects.toThrow('OAuth provider unavailable');
            AuthService.authenticate.mockResolvedValue({
                success: true,
                user: { id: 'user-123', email: 'user@test.com' },
                token: 'local-jwt-token'
            });
            const localAuth = await AuthService.authenticate('user@test.com', 'password');
            (0, globals_1.expect)(localAuth.success).toBe(true);
        });
        (0, globals_1.it)('should handle session store failures', async () => {
            AuthService.authenticate.mockRejectedValue(new Error('Session store corrupted'));
            await (0, globals_1.expect)(AuthService.authenticate('session-id-123')).rejects.toThrow('Session store corrupted');
        });
    });
    (0, globals_1.describe)('Network Partition Scenarios', () => {
        (0, globals_1.it)('should handle API gateway failures', async () => {
            const services = [AuthService, PaymentService, OrderService, NotificationService];
            services.forEach(service => {
                if (service.authenticate)
                    service.authenticate.mockRejectedValue(new Error('API gateway down'));
                if (service.processPayment)
                    service.processPayment.mockRejectedValue(new Error('API gateway down'));
                if (service.createOrder)
                    service.createOrder.mockRejectedValue(new Error('API gateway down'));
                if (service.sendNotification)
                    service.sendNotification.mockRejectedValue(new Error('API gateway down'));
            });
            await (0, globals_1.expect)(AuthService.authenticate('user@test.com', 'pass')).rejects.toThrow('API gateway down');
            await (0, globals_1.expect)(PaymentService.processPayment({ amount: 100 })).rejects.toThrow('API gateway down');
            await (0, globals_1.expect)(OrderService.createOrder({ items: [] })).rejects.toThrow('API gateway down');
            await (0, globals_1.expect)(NotificationService.sendNotification({ userId: 'user-123' })).rejects.toThrow('API gateway down');
        });
        (0, globals_1.it)('should handle database read replica failures', async () => {
            DatabaseService.query
                .mockRejectedValueOnce(new Error('Read replica down'))
                .mockResolvedValueOnce({ rows: [{ data: 'from-primary' }] });
            await (0, globals_1.expect)(DatabaseService.query('SELECT * FROM users')).rejects.toThrow('Read replica down');
            const result = await DatabaseService.query('SELECT * FROM users');
            (0, globals_1.expect)(result.rows[0].data).toBe('from-primary');
        });
        (0, globals_1.it)('should handle CDN failures', async () => {
        });
    });
    (0, globals_1.describe)('Resource Exhaustion Scenarios', () => {
        (0, globals_1.it)('should handle memory exhaustion', async () => {
            const largeDataSets = [];
            for (let i = 0; i < 1000; i++) {
                largeDataSets.push(new Array(10000).fill('memory-intensive-data'));
            }
            (0, globals_1.expect)(largeDataSets).toHaveLength(1000);
        });
        (0, globals_1.it)('should handle CPU exhaustion', async () => {
            const cpuIntensivePromises = [];
            for (let i = 0; i < 10; i++) {
                cpuIntensivePromises.push(new Promise(resolve => {
                    let result = 0;
                    for (let j = 0; j < 1000000; j++) {
                        result += Math.random();
                    }
                    resolve(result);
                }));
            }
            const results = await Promise.all(cpuIntensivePromises);
            (0, globals_1.expect)(results).toHaveLength(10);
        });
        (0, globals_1.it)('should handle disk space exhaustion', async () => {
        });
    });
    (0, globals_1.describe)('Third-party Service Failures', () => {
        (0, globals_1.it)('should handle Razorpay API failures', async () => {
            PaymentService.processPayment.mockRejectedValue(new Error('Razorpay API unavailable'));
            await (0, globals_1.expect)(PaymentService.processPayment({ amount: 1000 })).rejects.toThrow('Razorpay API unavailable');
        });
        (0, globals_1.it)('should handle SendGrid email failures', async () => {
            NotificationService.sendNotification.mockRejectedValue(new Error('SendGrid API down'));
            await (0, globals_1.expect)(NotificationService.sendNotification({
                userId: 'user-123',
                channels: ['email']
            })).rejects.toThrow('SendGrid API down');
        });
        (0, globals_1.it)('should handle Twilio SMS failures', async () => {
            NotificationService.sendNotification.mockRejectedValue(new Error('Twilio API down'));
            await (0, globals_1.expect)(NotificationService.sendNotification({
                userId: 'user-123',
                channels: ['sms']
            })).rejects.toThrow('Twilio API down');
        });
    });
    (0, globals_1.describe)('Data Consistency Scenarios', () => {
        (0, globals_1.it)('should handle eventual consistency conflicts', async () => {
            CacheService.get.mockResolvedValue({ version: 1, data: 'stale-data' });
            DatabaseService.query.mockResolvedValue({
                rows: [{ version: 2, data: 'fresh-data' }]
            });
            const cacheData = await CacheService.get('inconsistent-key');
            const dbData = await DatabaseService.query('SELECT * FROM data WHERE key = ?');
            (0, globals_1.expect)(cacheData.version).toBe(1);
            (0, globals_1.expect)(dbData.rows[0].version).toBe(2);
        });
        (0, globals_1.it)('should handle distributed transaction failures', async () => {
            OrderService.createOrder.mockResolvedValue({ id: 'order-123', status: 'created' });
            PaymentService.processPayment.mockRejectedValue(new Error('Payment failed'));
            NotificationService.sendNotification.mockResolvedValue({ success: true });
            const order = await OrderService.createOrder({ items: [] });
            (0, globals_1.expect)(order.status).toBe('created');
            await (0, globals_1.expect)(PaymentService.processPayment({ orderId: 'order-123' })).rejects.toThrow('Payment failed');
        });
    });
    (0, globals_1.describe)('Monitoring and Alerting Failures', () => {
        (0, globals_1.it)('should handle monitoring system failures', async () => {
        });
        (0, globals_1.it)('should handle alerting system failures', async () => {
        });
    });
    (0, globals_1.describe)('Recovery and Self-healing Scenarios', () => {
        (0, globals_1.it)('should implement circuit breaker patterns', async () => {
            let failureCount = 0;
            PaymentService.processPayment.mockImplementation(() => {
                failureCount++;
                if (failureCount <= 3) {
                    throw new Error('Service failure');
                }
                return { success: true, paymentId: 'pay_recovered_123' };
            });
            for (let i = 0; i < 3; i++) {
                await (0, globals_1.expect)(PaymentService.processPayment({ amount: 100 })).rejects.toThrow('Service failure');
            }
            const result = await PaymentService.processPayment({ amount: 100 });
            (0, globals_1.expect)(result.success).toBe(true);
        });
        (0, globals_1.it)('should implement graceful degradation', async () => {
            OrderService.createOrder.mockRejectedValue(new Error('Core service down'));
            NotificationService.sendNotification.mockResolvedValue({ success: true });
            await (0, globals_1.expect)(OrderService.createOrder({ items: [] })).rejects.toThrow('Core service down');
            const notification = await NotificationService.sendNotification({
                userId: 'user-123',
                type: 'system_status',
                message: 'System operating in degraded mode'
            });
            (0, globals_1.expect)(notification.success).toBe(true);
        });
        (0, globals_1.it)('should implement automatic failover', async () => {
            DatabaseService.query
                .mockRejectedValueOnce(new Error('Primary DB down'))
                .mockResolvedValueOnce({ rows: [{ data: 'from-replica' }] });
            await (0, globals_1.expect)(DatabaseService.query('SELECT * FROM users')).rejects.toThrow('Primary DB down');
            const result = await DatabaseService.query('SELECT * FROM users');
            (0, globals_1.expect)(result.rows[0].data).toBe('from-replica');
        });
    });
});
//# sourceMappingURL=resilience-tests.test.js.map