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

interface RequestHandler {
  (req: Request, res: Response, next: NextFunction): void;
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  })
);
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
    service: 'hasivu-platform-test',
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
      analytics: '/api/v1/analytics',
    },
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
      createdAt: new Date().toISOString(),
    },
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
      lastName: 'User',
    },
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
    sessionId: 'session-123',
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
          theme: 'light',
        },
        timezone: 'UTC',
        language: 'en',
      },
    },
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
      createdAt: new Date().toISOString(),
    },
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
      verifiedAt: new Date().toISOString(),
    },
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
      verifiedAt: new Date().toISOString(),
    },
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
      sentAt: new Date().toISOString(),
    },
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
        activeDevices: 12,
      },
      trends: {
        users: '+12%',
        orders: '+8%',
        revenue: '+15%',
      },
      timeRange: req.query.timeRange || '7d',
      lastUpdated: new Date().toISOString(),
    },
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
      timestamp: new Date().toISOString(),
    },
  });
});

// Kitchen Management Mock Endpoints
app.get('/api/v1/kitchen/orders', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'order-1',
        studentName: 'John Doe',
        items: ['Chicken Sandwich', 'Apple Juice'],
        status: 'preparing',
        priority: 'normal',
        orderTime: '2025-09-08T10:30:00Z',
        estimatedReady: '2025-09-08T11:00:00Z',
      },
      {
        id: 'order-2',
        studentName: 'Jane Smith',
        items: ['Veggie Burger', 'Water'],
        status: 'ready',
        priority: 'high',
        orderTime: '2025-09-08T10:15:00Z',
        estimatedReady: '2025-09-08T10:45:00Z',
      },
    ],
    success: true,
    message: 'Orders retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/kitchen/orders', (req: Request, res: Response) => {
  const { items, studentId, priority } = req.body;
  return res.status(201).json({
    data: {
      id: 'order-new',
      items,
      studentId,
      priority: priority || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    success: true,
    message: 'Order created successfully',
    timestamp: new Date().toISOString(),
  });
});

app.patch('/api/v1/kitchen/orders/:orderId/status', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;
  return res.status(200).json({
    data: {
      id: orderId,
      status,
      updatedAt: new Date().toISOString(),
    },
    success: true,
    message: 'Order status updated successfully',
    timestamp: new Date().toISOString(),
  });
});

app.patch('/api/v1/kitchen/orders/:orderId/assign', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { staffId } = req.body;
  return res.status(200).json({
    data: {
      id: orderId,
      assignedTo: staffId,
      assignedAt: new Date().toISOString(),
    },
    success: true,
    message: 'Order assigned successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/kitchen/metrics', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      ordersInProgress: 15,
      averagePreparationTime: 18.5,
      completionRate: 94.2,
      staffEfficiency: 88.3,
      dailyRevenue: 15420,
      customerSatisfaction: 4.6,
      lowStockItems: 3,
      activeStaff: 8,
      totalOrders: 25,
      pendingOrders: 3,
      completedOrders: 22,
      busyHours: ['11:00-12:00', '13:00-14:00'],
    },
    success: true,
    message: 'Kitchen metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// Inventory Management Mock Endpoints
app.get('/api/v1/inventory/items', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'item-1',
        name: 'Chicken Breast',
        category: 'Protein',
        subcategory: 'Fresh Meat',
        sku: 'CHICKEN-BREAST-001',
        currentStock: 50,
        minStock: 10,
        maxStock: 200,
        unit: 'kg',
        costPerUnit: 12.5,
        totalValue: 625.0,
        supplier: {
          id: 'supplier-1',
          name: 'Fresh Foods Co.',
          contact: '+1234567890',
          email: 'contact@freshfoods.com',
          rating: 4.5,
          reliability: 95,
          averageDeliveryTime: 2,
          totalOrders: 45,
          avatar: 'https://ui-avatars.com/api/?name=Fresh+Foods&background=0D8ABC&color=fff',
        },
        lastUpdated: '2025-09-06T00:00:00Z',
        expiryDate: '2025-09-15T00:00:00Z',
        location: 'Cold Storage A',
        status: 'in_stock',
        usageRate: 8.5,
        daysUntilEmpty: 6,
        reorderPoint: 15,
        lastOrderDate: '2025-09-01T00:00:00Z',
        image: null,
      },
      {
        id: 'item-2',
        name: 'Fresh Tomatoes',
        category: 'Vegetables',
        subcategory: 'Fresh Produce',
        sku: 'TOMATO-FRESH-002',
        currentStock: 5,
        minStock: 10,
        maxStock: 80,
        unit: 'kg',
        costPerUnit: 3.2,
        totalValue: 16.0,
        supplier: {
          id: 'supplier-2',
          name: 'Garden Valley Farms',
          contact: '+1987654321',
          email: 'orders@gardenvalley.com',
          rating: 4.8,
          reliability: 98,
          averageDeliveryTime: 1,
          totalOrders: 78,
          avatar: 'https://ui-avatars.com/api/?name=Garden+Valley&background=22C55E&color=fff',
        },
        lastUpdated: '2025-09-05T00:00:00Z',
        expiryDate: '2025-09-10T00:00:00Z',
        location: 'Cold Storage B',
        status: 'low_stock',
        usageRate: 12.0,
        daysUntilEmpty: 1,
        reorderPoint: 15,
        lastOrderDate: '2025-08-30T00:00:00Z',
        image: null,
      },
      {
        id: 'item-3',
        name: 'Basmati Rice',
        category: 'Grains',
        subcategory: 'Rice & Cereals',
        sku: 'RICE-BASMATI-003',
        currentStock: 120,
        minStock: 25,
        maxStock: 300,
        unit: 'kg',
        costPerUnit: 2.8,
        totalValue: 336.0,
        supplier: {
          id: 'supplier-3',
          name: 'Golden Grains Ltd',
          contact: '+1122334455',
          email: 'supply@goldengrains.com',
          rating: 4.2,
          reliability: 88,
          averageDeliveryTime: 3,
          totalOrders: 23,
          avatar: 'https://ui-avatars.com/api/?name=Golden+Grains&background=F59E0B&color=fff',
        },
        lastUpdated: '2025-09-04T00:00:00Z',
        expiryDate: '2026-09-04T00:00:00Z',
        location: 'Dry Storage A',
        status: 'in_stock',
        usageRate: 15.0,
        daysUntilEmpty: 8,
        reorderPoint: 30,
        lastOrderDate: '2025-08-25T00:00:00Z',
        image: null,
      },
    ],
    success: true,
    message: 'Inventory items retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/inventory/items', (req: Request, res: Response) => {
  const { name, category, quantity, unit, lowStockThreshold } = req.body;
  return res.status(201).json({
    data: {
      id: 'item-new',
      name,
      category,
      quantity,
      unit,
      lowStockThreshold,
      status: 'in_stock',
      createdAt: new Date().toISOString(),
    },
    success: true,
    message: 'Inventory item created successfully',
    timestamp: new Date().toISOString(),
  });
});

app.put('/api/v1/inventory/items/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const updateData = req.body;
  return res.status(200).json({
    data: {
      id: itemId,
      ...updateData,
      updatedAt: new Date().toISOString(),
    },
    success: true,
    message: 'Inventory item updated successfully',
    timestamp: new Date().toISOString(),
  });
});

app.patch('/api/v1/inventory/items/:itemId/stock', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { quantity, type } = req.body;
  return res.status(200).json({
    data: {
      id: itemId,
      stockUpdate: { quantity, type },
      updatedAt: new Date().toISOString(),
    },
    success: true,
    message: 'Stock updated successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/inventory/suppliers', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'supplier-1',
        name: 'Fresh Foods Co.',
        contact: '+1234567890',
        email: 'contact@freshfoods.com',
        rating: 4.5,
        reliability: 95,
        averageDeliveryTime: 2,
        totalOrders: 45,
        avatar: 'https://ui-avatars.com/api/?name=Fresh+Foods&background=0D8ABC&color=fff',
        status: 'active',
        address: '123 Food District, Fresh City',
        paymentTerms: '30 days',
        establishedDate: '2018-03-15',
      },
      {
        id: 'supplier-2',
        name: 'Garden Valley Farms',
        contact: '+1987654321',
        email: 'orders@gardenvalley.com',
        rating: 4.8,
        reliability: 98,
        averageDeliveryTime: 1,
        totalOrders: 78,
        avatar: 'https://ui-avatars.com/api/?name=Garden+Valley&background=22C55E&color=fff',
        status: 'active',
        address: '456 Farm Road, Valley Green',
        paymentTerms: '15 days',
        establishedDate: '2015-07-22',
      },
      {
        id: 'supplier-3',
        name: 'Golden Grains Ltd',
        contact: '+1122334455',
        email: 'supply@goldengrains.com',
        rating: 4.2,
        reliability: 88,
        averageDeliveryTime: 3,
        totalOrders: 23,
        avatar: 'https://ui-avatars.com/api/?name=Golden+Grains&background=F59E0B&color=fff',
        status: 'active',
        address: '789 Grain Avenue, Harvest Town',
        paymentTerms: '45 days',
        establishedDate: '2020-01-10',
      },
    ],
    success: true,
    message: 'Suppliers retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/inventory/purchase-orders', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'po-1',
        orderNumber: 'PO-2025-001',
        supplier: {
          id: 'supplier-1',
          name: 'Fresh Foods Co.',
          contact: '+1234567890',
          email: 'contact@freshfoods.com',
          rating: 4.5,
          reliability: 95,
          averageDeliveryTime: 2,
          totalOrders: 45,
          avatar: 'https://ui-avatars.com/api/?name=Fresh+Foods&background=0D8ABC&color=fff',
        },
        items: [
          {
            itemId: 'item-1',
            itemName: 'Chicken Breast',
            quantity: 25,
            unitPrice: 12.5,
            totalPrice: 312.5,
          },
        ],
        status: 'confirmed',
        orderDate: '2025-09-07T00:00:00Z',
        expectedDelivery: '2025-09-09T00:00:00Z',
        actualDelivery: null,
        totalAmount: 312.5,
        notes: 'Urgent order for weekend catering',
        createdBy: 'Admin User',
      },
      {
        id: 'po-2',
        orderNumber: 'PO-2025-002',
        supplier: {
          id: 'supplier-2',
          name: 'Garden Valley Farms',
          contact: '+1987654321',
          email: 'orders@gardenvalley.com',
          rating: 4.8,
          reliability: 98,
          averageDeliveryTime: 1,
          totalOrders: 78,
          avatar: 'https://ui-avatars.com/api/?name=Garden+Valley&background=22C55E&color=fff',
        },
        items: [
          {
            itemId: 'item-2',
            itemName: 'Fresh Tomatoes',
            quantity: 15,
            unitPrice: 3.2,
            totalPrice: 48.0,
          },
        ],
        status: 'sent',
        orderDate: '2025-09-06T00:00:00Z',
        expectedDelivery: '2025-09-07T00:00:00Z',
        actualDelivery: null,
        totalAmount: 48.0,
        notes: 'Regular weekly order',
        createdBy: 'Kitchen Manager',
      },
    ],
    success: true,
    message: 'Purchase orders retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/inventory/purchase-orders', (req: Request, res: Response) => {
  const { supplierId, items, total } = req.body;
  return res.status(201).json({
    data: {
      id: 'po-new',
      supplierId,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    success: true,
    message: 'Purchase order created successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/inventory/metrics', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      totalItems: 45,
      totalValue: 12500.75,
      lowStockItems: 3,
      expiringSoonItems: 2,
      outOfStockItems: 0,
      averageStockLevel: 78.5,
      monthlyConsumption: 2340,
      costSavings: 850.25,
      reorderAlerts: 3,
      topCategories: [
        { name: 'Vegetables', count: 15, value: 3200 },
        { name: 'Protein', count: 12, value: 5600 },
        { name: 'Grains', count: 8, value: 2100 },
        { name: 'Dairy', count: 6, value: 1200 },
        { name: 'Spices', count: 4, value: 400 },
      ],
      stockTrend: [
        { month: 'Jan', inStock: 42, lowStock: 5, outOfStock: 1 },
        { month: 'Feb', inStock: 44, lowStock: 3, outOfStock: 0 },
        { month: 'Mar', inStock: 43, lowStock: 4, outOfStock: 1 },
        { month: 'Apr', inStock: 45, lowStock: 3, outOfStock: 0 },
      ],
    },
    success: true,
    message: 'Inventory metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/inventory/low-stock-alerts', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'item-2',
        name: 'Tomatoes',
        currentStock: 5,
        threshold: 10,
        urgency: 'medium',
      },
    ],
    success: true,
    message: 'Low stock alerts retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// Staff Management Mock Endpoints
app.get('/api/v1/staff/members', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'staff-1',
        name: 'John Kitchen',
        role: 'chef',
        department: 'kitchen',
        status: 'active',
        shift: 'morning',
        email: 'john.kitchen@school.edu',
      },
      {
        id: 'staff-2',
        name: 'Mary Cook',
        role: 'assistant',
        department: 'kitchen',
        status: 'active',
        shift: 'afternoon',
        email: 'mary.cook@school.edu',
      },
    ],
    success: true,
    message: 'Staff members retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/staff/tasks', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'task-1',
        title: 'Prep vegetables for lunch',
        assignedTo: 'staff-1',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2025-09-08T11:00:00Z',
      },
    ],
    success: true,
    message: 'Staff tasks retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/staff/schedules', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'schedule-1',
        staffId: 'staff-1',
        date: '2025-09-08',
        shift: 'morning',
        startTime: '07:00',
        endTime: '15:00',
      },
    ],
    success: true,
    message: 'Staff schedules retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/staff/metrics', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      totalStaff: 8,
      activeStaff: 6,
      onBreak: 1,
      absent: 1,
      efficiency: 94,
    },
    success: true,
    message: 'Staff metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// User Management Mock Endpoints
app.get('/api/v1/users', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'user-1',
        name: 'Test Student',
        email: 'student@test.com',
        role: 'student',
        status: 'active',
        grade: '10th',
        joinDate: '2025-01-15',
      },
      {
        id: 'user-2',
        name: 'Test Parent',
        email: 'parent@test.com',
        role: 'parent',
        status: 'active',
        children: ['user-1'],
      },
    ],
    success: true,
    message: 'Users retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/users/profile', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      emailVerified: true,
      isActive: true,
      profile: {
        avatar: null,
        grade: '10th',
        preferences: {
          notifications: true,
          theme: 'light',
        },
      },
    },
    success: true,
    message: 'Profile retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// Notifications Mock Endpoints
app.get('/api/v1/notifications', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'notif-1',
        title: 'Order Ready',
        message: 'Your lunch order is ready for pickup',
        type: 'order_ready',
        read: false,
        createdAt: '2025-09-08T11:00:00Z',
      },
    ],
    success: true,
    message: 'Notifications retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/notifications/settings', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      orderUpdates: true,
      paymentAlerts: true,
    },
    success: true,
    message: 'Notification settings retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// RFID Mock Endpoints (expanded)
app.get('/api/v1/rfid/devices', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'device-1',
        name: 'Main Cafeteria Reader',
        location: 'Cafeteria Entrance',
        status: 'online',
        lastSeen: new Date().toISOString(),
      },
    ],
    success: true,
    message: 'RFID devices retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/rfid/transactions', (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 'txn-1',
        cardNumber: '*1234',
        studentName: 'Test Student',
        deviceId: 'device-1',
        action: 'meal_pickup',
        timestamp: new Date().toISOString(),
        status: 'success',
      },
    ],
    success: true,
    message: 'RFID transactions retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/rfid/metrics', (req: Request, res: Response) => {
  return res.status(200).json({
    data: {
      totalScans: 156,
      successfulScans: 152,
      failedScans: 4,
      activeCards: 89,
      successRate: 97.4,
    },
    success: true,
    message: 'RFID metrics retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// Orders endpoint for frontend tests
app.post('/orders', (req: Request, res: Response) => {
  const { items, userId, total } = req.body;
  console.log('Order request received:', {
    items,
    userId,
    total,
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    order: {
      id: 'order-' + Math.random().toString(36).substr(2, 9),
      items: items || [],
      userId: userId || 'test-user',
      total: total || 0,
      status: 'confirmed',
      orderNumber: 'ORD-' + Date.now(),
      estimatedReadyTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    message: 'Order placed successfully',
    timestamp: new Date().toISOString(),
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
        me: 'GET /api/v1/auth/me',
      },
      users: {
        list: 'GET /api/v1/users',
        profile: 'GET /api/v1/users/profile',
      },
      kitchen: {
        orders: 'GET /api/v1/kitchen/orders',
        createOrder: 'POST /api/v1/kitchen/orders',
        updateStatus: 'PATCH /api/v1/kitchen/orders/:id/status',
        assign: 'PATCH /api/v1/kitchen/orders/:id/assign',
        metrics: 'GET /api/v1/kitchen/metrics',
      },
      inventory: {
        items: 'GET /api/v1/inventory/items',
        createItem: 'POST /api/v1/inventory/items',
        updateItem: 'PUT /api/v1/inventory/items/:id',
        updateStock: 'PATCH /api/v1/inventory/items/:id/stock',
        suppliers: 'GET /api/v1/inventory/suppliers',
        purchaseOrders: 'GET /api/v1/inventory/purchase-orders',
        metrics: 'GET /api/v1/inventory/metrics',
        lowStockAlerts: 'GET /api/v1/inventory/low-stock-alerts',
      },
      staff: {
        members: 'GET /api/v1/staff/members',
        tasks: 'GET /api/v1/staff/tasks',
        schedules: 'GET /api/v1/staff/schedules',
        metrics: 'GET /api/v1/staff/metrics',
      },
      notifications: {
        list: 'GET /api/v1/notifications',
        settings: 'GET /api/v1/notifications/settings',
        send: 'POST /api/v1/notifications/send',
      },
      rfid: {
        devices: 'GET /api/v1/rfid/devices',
        transactions: 'GET /api/v1/rfid/transactions',
        verify: 'POST /api/v1/rfid/verify',
        metrics: 'GET /api/v1/rfid/metrics',
      },
      payments: {
        order: 'POST /api/v1/payments/order',
        verify: 'POST /api/v1/payments/verify',
      },
      analytics: {
        dashboard: 'GET /api/v1/analytics/dashboard',
        metrics: 'POST /api/v1/analytics/metrics',
      },
    },
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
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
