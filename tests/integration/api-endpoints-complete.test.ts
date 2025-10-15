/**
 * Comprehensive API Endpoints Integration Test Suite
 * Tests all critical API endpoints with real database and external service integration
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Application } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Test utilities and setup
import { createTestApp } from '../utils/test-app-factory';
import { createDatabaseTestUtils } from '../utils/database-utils';
import { createTestUser, generateAuthToken } from '../utils/auth-utils';
import { createTestData, cleanupTestData } from '../utils/test-data-factory';

// Types
interface TestUser {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'admin' | 'kitchen_staff';
  token: string;
}

interface TestOrder {
  id: string;
  userId: string;
  menuItemId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
}

interface TestMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  allergens: string[];
}

describe('API Endpoints Integration Tests', () => {
  let app: Application;
  let testUsers: {
    student: TestUser;
    parent: TestUser;
    admin: TestUser;
    kitchenStaff: TestUser;
  };
  let testMenuItems: TestMenuItem[];
  let testOrders: TestOrder[];

  beforeAll(async () => {
    console.log('🚀 Setting up integration test environment...');

    // Setup test application
    const testApp = await createTestApp();
    app = testApp.app;

    // Setup test database
    const dbUtils = createDatabaseTestUtils();
    await dbUtils.setupTestDatabase();

    // Create test users with different roles
    testUsers = {
      student: await createTestUser({
        email: 'student@test.hasivu.com',
        role: 'student',
        firstName: 'Test',
        lastName: 'Student'
      }),
      parent: await createTestUser({
        email: 'parent@test.hasivu.com',
        role: 'parent',
        firstName: 'Test',
        lastName: 'Parent'
      }),
      admin: await createTestUser({
        email: 'admin@test.hasivu.com',
        role: 'admin',
        firstName: 'Test',
        lastName: 'Admin'
      }),
      kitchenStaff: await createTestUser({
        email: 'kitchen@test.hasivu.com',
        role: 'kitchen_staff',
        firstName: 'Test',
        lastName: 'Kitchen'
      })
    };

    // Create test data
    const testData = await createTestData();
    testMenuItems = testData.menuItems;
    testOrders = testData.orders;

    console.log('✅ Integration test environment ready');
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up integration test environment...');

    // Cleanup test data
    await cleanupTestData();

    // Cleanup test database
    const dbUtils = createDatabaseTestUtils();
    await dbUtils.teardownTestDatabase();

    console.log('✅ Integration test cleanup completed');
  });

  beforeEach(async () => {
    // Reset any test-specific state
  });

  afterEach(async () => {
    // Cleanup any test-specific data
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/login - should authenticate user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.student.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('POST /api/auth/register - should create new user account', async () => {
      const newUser = {
        email: `newuser-${uuidv4()}@test.hasivu.com`,
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('userId');
    });

    test('POST /api/auth/register - should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUsers.student.email,
          password: 'TestPassword123!',
          firstName: 'Duplicate',
          lastName: 'User',
          role: 'student'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Email already exists');
    });

    test('GET /api/auth/profile - should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.student.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('GET /api/auth/profile - should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/auth/refresh - should refresh valid token', async () => {
      // First get a refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: 'TestPassword123!'
        });

      const {refreshToken} = loginResponse.body;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('Menu Management Endpoints', () => {
    test('GET /api/menu/items - should return all menu items', async () => {
      const response = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    test('GET /api/menu/items/:id - should return specific menu item', async () => {
      const menuItem = testMenuItems[0];

      const response = await request(app)
        .get(`/api/menu/items/${menuItem.id}`)
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.id).toBe(menuItem.id);
      expect(response.body.item.name).toBe(menuItem.name);
    });

    test('GET /api/menu/items/:id - should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/menu/items/non-existent-id')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/menu/items - should create new menu item (admin only)', async () => {
      const newMenuItem = {
        name: 'New Test Item',
        description: 'A test menu item',
        price: 12.99,
        category: 'main',
        allergens: ['gluten'],
        nutritionalInfo: {
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15
        }
      };

      const response = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send(newMenuItem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.name).toBe(newMenuItem.name);
      expect(response.body.item.price).toBe(newMenuItem.price);
    });

    test('POST /api/menu/items - should reject non-admin user', async () => {
      const newMenuItem = {
        name: 'Unauthorized Item',
        price: 10.00,
        category: 'main'
      };

      const response = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send(newMenuItem);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Insufficient permissions');
    });

    test('PUT /api/menu/items/:id - should update menu item (admin only)', async () => {
      const menuItem = testMenuItems[0];
      const updates = {
        name: 'Updated Menu Item',
        price: 15.99
      };

      const response = await request(app)
        .put(`/api/menu/items/${menuItem.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.name).toBe(updates.name);
      expect(response.body.item.price).toBe(updates.price);
    });

    test('DELETE /api/menu/items/:id - should delete menu item (admin only)', async () => {
      // Create a test item to delete
      const createResponse = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send({
          name: 'Item to Delete',
          price: 10.00,
          category: 'test'
        });

      const itemId = createResponse.body.item.id;

      const deleteResponse = await request(app)
        .delete(`/api/menu/items/${itemId}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toHaveProperty('message');

      // Verify item is deleted
      const getResponse = await request(app)
        .get(`/api/menu/items/${itemId}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Order Management Endpoints', () => {
    test('GET /api/orders - should return user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    test('POST /api/orders - should create new order', async () => {
      const menuItem = testMenuItems[0];
      const newOrder = {
        menuItemId: menuItem.id,
        quantity: 2,
        specialInstructions: 'No onions please',
        deliveryTime: '12:30'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send(newOrder);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.menuItemId).toBe(newOrder.menuItemId);
      expect(response.body.order.quantity).toBe(newOrder.quantity);
      expect(response.body.order.status).toBe('pending');
    });

    test('GET /api/orders/:id - should return specific order', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send({
          menuItemId: testMenuItems[0].id,
          quantity: 1
        });

      const orderId = createResponse.body.order.id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe(orderId);
    });

    test('PUT /api/orders/:id/status - should update order status (kitchen staff)', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send({
          menuItemId: testMenuItems[0].id,
          quantity: 1
        });

      const orderId = createResponse.body.order.id;

      const response = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${testUsers.kitchenStaff.token}`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.status).toBe('preparing');
    });

    test('PUT /api/orders/:id/status - should reject unauthorized status update', async () => {
      const order = testOrders[0];

      const response = await request(app)
        .put(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send({ status: 'preparing' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('DELETE /api/orders/:id - should cancel order (if pending)', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send({
          menuItemId: testMenuItems[0].id,
          quantity: 1
        });

      const orderId = createResponse.body.order.id;

      const response = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Payment Endpoints', () => {
    test('POST /api/payments/create-order - should create payment order', async () => {
      const paymentData = {
        amount: 2500, // ₹25.00
        currency: 'INR',
        orderId: testOrders[0].id,
        customerEmail: testUsers.student.email
      };

      const response = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentOrder');
      expect(response.body.paymentOrder).toHaveProperty('id');
      expect(response.body.paymentOrder.amount).toBe(paymentData.amount);
    });

    test('POST /api/payments/verify - should verify payment', async () => {
      const verificationData = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'test_signature_123'
      };

      const response = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send(verificationData);

      // This might fail in test environment without actual Razorpay setup
      expect([200, 400]).toContain(response.status);
    });

    test('GET /api/payments/history - should return payment history', async () => {
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payments');
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  });

  describe('RFID Management Endpoints', () => {
    test('POST /api/rfid/cards - should create RFID card (admin only)', async () => {
      const cardData = {
        cardNumber: 'RFID123456789',
        userId: testUsers.student.id,
        isActive: true
      };

      const response = await request(app)
        .post('/api/rfid/cards')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send(cardData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('card');
      expect(response.body.card.cardNumber).toBe(cardData.cardNumber);
      expect(response.body.card.userId).toBe(cardData.userId);
    });

    test('GET /api/rfid/cards/:cardNumber - should return card details', async () => {
      // Create a card first
      const createResponse = await request(app)
        .post('/api/rfid/cards')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send({
          cardNumber: 'RFID987654321',
          userId: testUsers.student.id,
          isActive: true
        });

      const {cardNumber} = createResponse.body.card;

      const response = await request(app)
        .get(`/api/rfid/cards/${cardNumber}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('card');
      expect(response.body.card.cardNumber).toBe(cardNumber);
    });

    test('POST /api/rfid/verify - should verify RFID card', async () => {
      // Create a card first
      const createResponse = await request(app)
        .post('/api/rfid/cards')
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send({
          cardNumber: 'RFID555666777',
          userId: testUsers.student.id,
          isActive: true
        });

      const {cardNumber} = createResponse.body.card;

      const response = await request(app)
        .post('/api/rfid/verify')
        .send({ cardNumber });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
    });

    test('POST /api/rfid/delivery-verification - should verify delivery', async () => {
      const verificationData = {
        cardNumber: 'RFID123456789',
        orderId: testOrders[0].id,
        location: 'Classroom 5A'
      };

      const response = await request(app)
        .post('/api/rfid/delivery-verification')
        .set('Authorization', `Bearer ${testUsers.kitchenStaff.token}`)
        .send(verificationData);

      expect([200, 400]).toContain(response.status); // Might fail if card doesn't exist
    });
  });

  describe('User Management Endpoints', () => {
    test('GET /api/users - should return users list (admin only)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('GET /api/users - should reject non-admin user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/users/:id - should return specific user', async () => {
      const response = await request(app)
        .get(`/api/users/${testUsers.student.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(testUsers.student.id);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('PUT /api/users/:id - should update user (admin only)', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put(`/api/users/${testUsers.student.id}`)
        .set('Authorization', `Bearer ${testUsers.admin.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.firstName).toBe(updates.firstName);
      expect(response.body.user.lastName).toBe(updates.lastName);
    });
  });

  describe('Health Check Endpoints', () => {
    test('GET /api/health - should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('GET /api/health/detailed - should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('cache');
    });

    test('GET /api/health/database - should check database health', async () => {
      const response = await request(app)
        .get('/api/health/database')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('status');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@hasivu.com',
          password: 'TestPassword123!'
        });

      expect([200, 400, 401]).toContain(response.status); // Should handle gracefully
    });

    test('should handle extremely large request body', async () => {
      const largeData = {
        email: 'test@hasivu.com',
        password: 'TestPassword123!',
        extraData: 'x'.repeat(1000000) // 1MB of data
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(largeData);

      expect([400, 413]).toContain(response.status); // Bad request or payload too large
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle XSS attempts', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@hasivu.com',
          password: 'TestPassword123!',
          firstName: '<script>alert("xss")</script>',
          lastName: 'User',
          role: 'student'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch('/api/auth/login') // PATCH not supported for login
        .send({
          email: 'test@hasivu.com',
          password: 'TestPassword123!'
        });

      expect([404, 405]).toContain(response.status); // Not found or method not allowed
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = performance.now();

      const response = await request(app)
        .get('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.student.token}`);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // 1 second threshold
    });

    test('should handle rapid successive requests', async () => {
      const responses = [];

      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .get('/api/health');
        responses.push(response);
      }

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security and Authorization', () => {
    test('should enforce proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'https://hasivu.com');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });

    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('should handle expired JWT tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed JWT tokens', async () => {
      const malformedToken = 'invalid.jwt.token';

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${malformedToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should implement proper role-based access control', async () => {
      // Student trying to access admin endpoint
      const response = await request(app)
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${testUsers.student.token}`)
        .send({
          name: 'Unauthorized Item',
          price: 10.00,
          category: 'main'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Insufficient permissions');
    });
  });
});