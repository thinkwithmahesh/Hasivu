/**
 * HASIVU Platform - Simplified Test Server
 * Minimal server for TestSprite testing
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'hasivu-platform-test'
  });
});

// Detailed health check
app.get('/health/detailed', (req: Request, res: Response) => {
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

// Authentication Mock Endpoints
app.post('/api/v1/auth/register', (req: Request, res: Response) => {
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

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
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

app.get('/api/v1/auth/me', (req: Request, res: Response) => {
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

// Payment Mock Endpoints
app.post('/api/v1/payments/order', (req: Request, res: Response) => {
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

app.post('/api/v1/payments/verify', (req: Request, res: Response) => {
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

// RFID Mock Endpoints
app.post('/api/v1/rfid/verify', (req: Request, res: Response) => {
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

// Notification Mock Endpoints
app.post('/api/v1/notifications/send', (req: Request, res: Response) => {
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

// Analytics Mock Endpoints
app.get('/api/v1/analytics/dashboard', (req: Request, res: Response) => {
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

app.post('/api/v1/analytics/metrics', (req: Request, res: Response) => {
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

// API Documentation endpoint
app.get('/api/v1/docs', (req: Request, res: Response) => {
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

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;