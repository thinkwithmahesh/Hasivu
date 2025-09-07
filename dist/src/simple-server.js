"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'hasivu-platform-test'
    });
});
app.get('/health/detailed', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'hasivu-platform-test',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        memory: process.memoryUsage(),
        endpoints: {
            health: '/health',
            auth: '/api/v1/auth',
            payments: '/api/v1/payments',
            rfid: '/api/v1/rfid',
            notifications: '/api/v1/notifications',
            analytics: '/api/v1/analytics'
        }
    });
});
app.post('/api/v1/auth/register', (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    return res.status(201).json({
        success: true,
        user: {
            id: 'user-123',
            email,
            firstName,
            lastName,
            createdAt: new Date().toISOString()
        }
    });
});
app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    return res.status(200).json({
        success: true,
        user: {
            id: 'user-123',
            email,
            firstName: 'Test',
            lastName: 'User'
        },
        tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
        },
        sessionId: 'session-123'
    });
});
app.get('/api/v1/auth/me', (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            emailVerified: true,
            isActive: true,
            profile: {
                avatar: null,
                bio: null,
                preferences: {
                    notifications: true,
                    theme: 'light'
                },
                timezone: 'UTC',
                language: 'en'
            }
        }
    });
});
app.post('/api/v1/payments/order', (req, res) => {
    const { amount, userId } = req.body;
    if (!amount || !userId) {
        return res.status(400).json({ error: 'Amount and userId required' });
    }
    return res.status(201).json({
        success: true,
        order: {
            id: 'order-123',
            amount,
            userId,
            status: 'created',
            createdAt: new Date().toISOString()
        }
    });
});
app.post('/api/v1/payments/verify', (req, res) => {
    const { paymentId, orderId, signature } = req.body;
    if (!paymentId || !orderId || !signature) {
        return res.status(400).json({ error: 'Payment verification data required' });
    }
    return res.status(200).json({
        success: true,
        verified: true,
        payment: {
            id: paymentId,
            orderId,
            status: 'completed',
            verifiedAt: new Date().toISOString()
        }
    });
});
app.post('/api/v1/rfid/verify', (req, res) => {
    const { cardNumber, readerId } = req.body;
    if (!cardNumber || !readerId) {
        return res.status(400).json({ error: 'Card number and reader ID required' });
    }
    return res.status(200).json({
        success: true,
        verified: true,
        card: {
            number: cardNumber,
            readerId,
            userId: 'user-123',
            verifiedAt: new Date().toISOString()
        }
    });
});
app.post('/api/v1/notifications/send', (req, res) => {
    const { userId, type, title, message } = req.body;
    if (!userId || !type || !title || !message) {
        return res.status(400).json({ error: 'All notification fields required' });
    }
    return res.status(200).json({
        success: true,
        notification: {
            id: 'notification-123',
            userId,
            type,
            title,
            message,
            sentAt: new Date().toISOString()
        }
    });
});
app.get('/api/v1/analytics/dashboard', (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            stats: {
                totalUsers: 150,
                totalOrders: 1250,
                totalRevenue: 45000,
                activeDevices: 12
            },
            trends: {
                users: '+12%',
                orders: '+8%',
                revenue: '+15%'
            },
            timeRange: req.query.timeRange || '7d',
            lastUpdated: new Date().toISOString()
        }
    });
});
app.post('/api/v1/analytics/metrics', (req, res) => {
    const { name, value } = req.body;
    if (!name || value === undefined) {
        return res.status(400).json({ error: 'Metric name and value required' });
    }
    return res.status(200).json({
        success: true,
        metric: {
            name,
            value,
            timestamp: new Date().toISOString()
        }
    });
});
app.get('/api/v1/docs', (req, res) => {
    res.status(200).json({
        title: 'HASIVU Platform Test API',
        version: '1.0.0',
        description: 'Mock API endpoints for testing',
        endpoints: {
            health: 'GET /health',
            auth: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                me: 'GET /api/v1/auth/me'
            },
            payments: {
                order: 'POST /api/v1/payments/order',
                verify: 'POST /api/v1/payments/verify'
            },
            rfid: {
                verify: 'POST /api/v1/rfid/verify'
            },
            notifications: {
                send: 'POST /api/v1/notifications/send'
            },
            analytics: {
                dashboard: 'GET /api/v1/analytics/dashboard',
                metrics: 'POST /api/v1/analytics/metrics'
            }
        }
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});
const server = app.listen(PORT, () => {
    console.log(`\n🚀 HASIVU Platform Test Server Started Successfully!\n`);
    console.log(`   • Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   • Port: ${PORT}`);
    console.log(`   • URL: http://localhost:${PORT}`);
    console.log(`   • API Base: http://localhost:${PORT}/api/v1`);
    console.log(`   • Health Check: http://localhost:${PORT}/health`);
    console.log(`\n🔧 Available Endpoints:`);
    console.log(`   • Authentication: /api/v1/auth`);
    console.log(`   • Payments: /api/v1/payments`);
    console.log(`   • RFID: /api/v1/rfid`);
    console.log(`   • Notifications: /api/v1/notifications`);
    console.log(`   • Analytics: /api/v1/analytics`);
    console.log(`   • Documentation: /api/v1/docs\n`);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
exports.default = app;
//# sourceMappingURL=simple-server.js.map