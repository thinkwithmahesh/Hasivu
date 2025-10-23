"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const uuid_1 = require("uuid");
const test_app_factory_1 = require("../utils/test-app-factory");
const database_utils_1 = require("../utils/database-utils");
const auth_utils_1 = require("../utils/auth-utils");
const test_data_factory_1 = require("../utils/test-data-factory");
(0, globals_1.describe)('API Endpoints Integration Tests', () => {
    let app;
    let testUsers;
    let testMenuItems;
    let testOrders;
    (0, globals_1.beforeAll)(async () => {
        console.log('🚀 Setting up integration test environment...');
        const testApp = await (0, test_app_factory_1.createTestApp)();
        app = testApp.app;
        const dbUtils = (0, database_utils_1.createDatabaseTestUtils)();
        await dbUtils.setupTestDatabase();
        testUsers = {
            student: await (0, auth_utils_1.createTestUser)({
                email: 'student@test.hasivu.com',
                role: 'student',
                firstName: 'Test',
                lastName: 'Student'
            }),
            parent: await (0, auth_utils_1.createTestUser)({
                email: 'parent@test.hasivu.com',
                role: 'parent',
                firstName: 'Test',
                lastName: 'Parent'
            }),
            admin: await (0, auth_utils_1.createTestUser)({
                email: 'admin@test.hasivu.com',
                role: 'admin',
                firstName: 'Test',
                lastName: 'Admin'
            }),
            kitchenStaff: await (0, auth_utils_1.createTestUser)({
                email: 'kitchen@test.hasivu.com',
                role: 'kitchen_staff',
                firstName: 'Test',
                lastName: 'Kitchen'
            })
        };
        const testData = await (0, test_data_factory_1.createTestData)();
        testMenuItems = testData.menuItems;
        testOrders = testData.orders;
        console.log('✅ Integration test environment ready');
    }, 60000);
    (0, globals_1.afterAll)(async () => {
        console.log('🧹 Cleaning up integration test environment...');
        await (0, test_data_factory_1.cleanupTestData)();
        const dbUtils = (0, database_utils_1.createDatabaseTestUtils)();
        await dbUtils.teardownTestDatabase();
        console.log('✅ Integration test cleanup completed');
    });
    (0, globals_1.beforeEach)(async () => {
    });
    (0, globals_1.afterEach)(async () => {
    });
    (0, globals_1.describe)('Authentication Endpoints', () => {
        (0, globals_1.test)('POST /api/auth/login - should authenticate user with valid credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUsers.student.email,
                password: 'TestPassword123!'
            });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('token');
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user.email).toBe(testUsers.student.email);
            (0, globals_1.expect)(response.body.user).not.toHaveProperty('password');
        });
        (0, globals_1.test)('POST /api/auth/login - should reject invalid credentials', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUsers.student.email,
                password: 'WrongPassword'
            });
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
            (0, globals_1.expect)(response.body.error).toContain('Invalid credentials');
        });
        (0, globals_1.test)('POST /api/auth/register - should create new user account', async () => {
            const newUser = {
                email: `newuser-${(0, uuid_1.v4)()}@test.hasivu.com`,
                password: 'NewPassword123!',
                firstName: 'New',
                lastName: 'User',
                role: 'student'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(newUser);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('message', 'User registered successfully');
            (0, globals_1.expect)(response.body).toHaveProperty('userId');
        });
        (0, globals_1.test)('POST /api/auth/register - should reject duplicate email', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: testUsers.student.email,
                password: 'TestPassword123!',
                firstName: 'Duplicate',
                lastName: 'User',
                role: 'student'
            });
            (0, globals_1.expect)(response.status).toBe(409);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
            (0, globals_1.expect)(response.body.error).toContain('Email already exists');
        });
        (0, globals_1.test)('GET /api/auth/profile - should return user profile with valid token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user.email).toBe(testUsers.student.email);
            (0, globals_1.expect)(response.body.user).not.toHaveProperty('password');
        });
        (0, globals_1.test)('GET /api/auth/profile - should reject request without token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile');
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('POST /api/auth/refresh - should refresh valid token', async () => {
            const loginResponse = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: testUsers.student.email,
                password: 'TestPassword123!'
            });
            const { refreshToken } = loginResponse.body;
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('token');
            (0, globals_1.expect)(response.body).toHaveProperty('refreshToken');
        });
    });
    (0, globals_1.describe)('Menu Management Endpoints', () => {
        (0, globals_1.test)('GET /api/menu/items - should return all menu items', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('items');
            (0, globals_1.expect)(Array.isArray(response.body.items)).toBe(true);
            (0, globals_1.expect)(response.body.items.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('GET /api/menu/items/:id - should return specific menu item', async () => {
            const menuItem = testMenuItems[0];
            const response = await (0, supertest_1.default)(app)
                .get(`/api/menu/items/${menuItem.id}`)
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('item');
            (0, globals_1.expect)(response.body.item.id).toBe(menuItem.id);
            (0, globals_1.expect)(response.body.item.name).toBe(menuItem.name);
        });
        (0, globals_1.test)('GET /api/menu/items/:id - should return 404 for non-existent item', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/menu/items/non-existent-id')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(404);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('POST /api/menu/items - should create new menu item (admin only)', async () => {
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
            const response = await (0, supertest_1.default)(app)
                .post('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send(newMenuItem);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('item');
            (0, globals_1.expect)(response.body.item.name).toBe(newMenuItem.name);
            (0, globals_1.expect)(response.body.item.price).toBe(newMenuItem.price);
        });
        (0, globals_1.test)('POST /api/menu/items - should reject non-admin user', async () => {
            const newMenuItem = {
                name: 'Unauthorized Item',
                price: 10.00,
                category: 'main'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send(newMenuItem);
            (0, globals_1.expect)(response.status).toBe(403);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
            (0, globals_1.expect)(response.body.error).toContain('Insufficient permissions');
        });
        (0, globals_1.test)('PUT /api/menu/items/:id - should update menu item (admin only)', async () => {
            const menuItem = testMenuItems[0];
            const updates = {
                name: 'Updated Menu Item',
                price: 15.99
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/menu/items/${menuItem.id}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send(updates);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('item');
            (0, globals_1.expect)(response.body.item.name).toBe(updates.name);
            (0, globals_1.expect)(response.body.item.price).toBe(updates.price);
        });
        (0, globals_1.test)('DELETE /api/menu/items/:id - should delete menu item (admin only)', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send({
                name: 'Item to Delete',
                price: 10.00,
                category: 'test'
            });
            const itemId = createResponse.body.item.id;
            const deleteResponse = await (0, supertest_1.default)(app)
                .delete(`/api/menu/items/${itemId}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(deleteResponse.status).toBe(200);
            (0, globals_1.expect)(deleteResponse.body).toHaveProperty('message');
            const getResponse = await (0, supertest_1.default)(app)
                .get(`/api/menu/items/${itemId}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(getResponse.status).toBe(404);
        });
    });
    (0, globals_1.describe)('Order Management Endpoints', () => {
        (0, globals_1.test)('GET /api/orders - should return user orders', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('orders');
            (0, globals_1.expect)(Array.isArray(response.body.orders)).toBe(true);
        });
        (0, globals_1.test)('POST /api/orders - should create new order', async () => {
            const menuItem = testMenuItems[0];
            const newOrder = {
                menuItemId: menuItem.id,
                quantity: 2,
                specialInstructions: 'No onions please',
                deliveryTime: '12:30'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send(newOrder);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('order');
            (0, globals_1.expect)(response.body.order.menuItemId).toBe(newOrder.menuItemId);
            (0, globals_1.expect)(response.body.order.quantity).toBe(newOrder.quantity);
            (0, globals_1.expect)(response.body.order.status).toBe('pending');
        });
        (0, globals_1.test)('GET /api/orders/:id - should return specific order', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send({
                menuItemId: testMenuItems[0].id,
                quantity: 1
            });
            const orderId = createResponse.body.order.id;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('order');
            (0, globals_1.expect)(response.body.order.id).toBe(orderId);
        });
        (0, globals_1.test)('PUT /api/orders/:id/status - should update order status (kitchen staff)', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send({
                menuItemId: testMenuItems[0].id,
                quantity: 1
            });
            const orderId = createResponse.body.order.id;
            const response = await (0, supertest_1.default)(app)
                .put(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${testUsers.kitchenStaff.token}`)
                .send({ status: 'preparing' });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('order');
            (0, globals_1.expect)(response.body.order.status).toBe('preparing');
        });
        (0, globals_1.test)('PUT /api/orders/:id/status - should reject unauthorized status update', async () => {
            const order = testOrders[0];
            const response = await (0, supertest_1.default)(app)
                .put(`/api/orders/${order.id}/status`)
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send({ status: 'preparing' });
            (0, globals_1.expect)(response.status).toBe(403);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('DELETE /api/orders/:id - should cancel order (if pending)', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send({
                menuItemId: testMenuItems[0].id,
                quantity: 1
            });
            const orderId = createResponse.body.order.id;
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('message');
        });
    });
    (0, globals_1.describe)('Payment Endpoints', () => {
        (0, globals_1.test)('POST /api/payments/create-order - should create payment order', async () => {
            const paymentData = {
                amount: 2500,
                currency: 'INR',
                orderId: testOrders[0].id,
                customerEmail: testUsers.student.email
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/payments/create-order')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send(paymentData);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('paymentOrder');
            (0, globals_1.expect)(response.body.paymentOrder).toHaveProperty('id');
            (0, globals_1.expect)(response.body.paymentOrder.amount).toBe(paymentData.amount);
        });
        (0, globals_1.test)('POST /api/payments/verify - should verify payment', async () => {
            const verificationData = {
                razorpay_order_id: 'order_test_123',
                razorpay_payment_id: 'pay_test_123',
                razorpay_signature: 'test_signature_123'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/payments/verify')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send(verificationData);
            (0, globals_1.expect)([200, 400]).toContain(response.status);
        });
        (0, globals_1.test)('GET /api/payments/history - should return payment history', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/payments/history')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('payments');
            (0, globals_1.expect)(Array.isArray(response.body.payments)).toBe(true);
        });
    });
    (0, globals_1.describe)('RFID Management Endpoints', () => {
        (0, globals_1.test)('POST /api/rfid/cards - should create RFID card (admin only)', async () => {
            const cardData = {
                cardNumber: 'RFID123456789',
                userId: testUsers.student.id,
                isActive: true
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/rfid/cards')
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send(cardData);
            (0, globals_1.expect)(response.status).toBe(201);
            (0, globals_1.expect)(response.body).toHaveProperty('card');
            (0, globals_1.expect)(response.body.card.cardNumber).toBe(cardData.cardNumber);
            (0, globals_1.expect)(response.body.card.userId).toBe(cardData.userId);
        });
        (0, globals_1.test)('GET /api/rfid/cards/:cardNumber - should return card details', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/rfid/cards')
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send({
                cardNumber: 'RFID987654321',
                userId: testUsers.student.id,
                isActive: true
            });
            const { cardNumber } = createResponse.body.card;
            const response = await (0, supertest_1.default)(app)
                .get(`/api/rfid/cards/${cardNumber}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('card');
            (0, globals_1.expect)(response.body.card.cardNumber).toBe(cardNumber);
        });
        (0, globals_1.test)('POST /api/rfid/verify - should verify RFID card', async () => {
            const createResponse = await (0, supertest_1.default)(app)
                .post('/api/rfid/cards')
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send({
                cardNumber: 'RFID555666777',
                userId: testUsers.student.id,
                isActive: true
            });
            const { cardNumber } = createResponse.body.card;
            const response = await (0, supertest_1.default)(app)
                .post('/api/rfid/verify')
                .send({ cardNumber });
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('valid', true);
            (0, globals_1.expect)(response.body).toHaveProperty('user');
        });
        (0, globals_1.test)('POST /api/rfid/delivery-verification - should verify delivery', async () => {
            const verificationData = {
                cardNumber: 'RFID123456789',
                orderId: testOrders[0].id,
                location: 'Classroom 5A'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/rfid/delivery-verification')
                .set('Authorization', `Bearer ${testUsers.kitchenStaff.token}`)
                .send(verificationData);
            (0, globals_1.expect)([200, 400]).toContain(response.status);
        });
    });
    (0, globals_1.describe)('User Management Endpoints', () => {
        (0, globals_1.test)('GET /api/users - should return users list (admin only)', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('users');
            (0, globals_1.expect)(Array.isArray(response.body.users)).toBe(true);
            (0, globals_1.expect)(response.body.users.length).toBeGreaterThan(0);
        });
        (0, globals_1.test)('GET /api/users - should reject non-admin user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(403);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('GET /api/users/:id - should return specific user', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/users/${testUsers.student.id}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user.id).toBe(testUsers.student.id);
            (0, globals_1.expect)(response.body.user).not.toHaveProperty('password');
        });
        (0, globals_1.test)('PUT /api/users/:id - should update user (admin only)', async () => {
            const updates = {
                firstName: 'Updated',
                lastName: 'Name'
            };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/users/${testUsers.student.id}`)
                .set('Authorization', `Bearer ${testUsers.admin.token}`)
                .send(updates);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('user');
            (0, globals_1.expect)(response.body.user.firstName).toBe(updates.firstName);
            (0, globals_1.expect)(response.body.user.lastName).toBe(updates.lastName);
        });
    });
    (0, globals_1.describe)('Health Check Endpoints', () => {
        (0, globals_1.test)('GET /api/health - should return health status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/health');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('status', 'ok');
            (0, globals_1.expect)(response.body).toHaveProperty('timestamp');
            (0, globals_1.expect)(response.body).toHaveProperty('uptime');
        });
        (0, globals_1.test)('GET /api/health/detailed - should return detailed health status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/health/detailed')
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('status');
            (0, globals_1.expect)(response.body).toHaveProperty('services');
            (0, globals_1.expect)(response.body.services).toHaveProperty('database');
            (0, globals_1.expect)(response.body.services).toHaveProperty('cache');
        });
        (0, globals_1.test)('GET /api/health/database - should check database health', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/health/database')
                .set('Authorization', `Bearer ${testUsers.admin.token}`);
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('database');
            (0, globals_1.expect)(response.body.database).toHaveProperty('status');
        });
    });
    (0, globals_1.describe)('Error Handling and Edge Cases', () => {
        (0, globals_1.test)('should handle malformed JSON in request body', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle missing Content-Type header', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            (0, globals_1.expect)([200, 400, 401]).toContain(response.status);
        });
        (0, globals_1.test)('should handle extremely large request body', async () => {
            const largeData = {
                email: 'test@hasivu.com',
                password: 'TestPassword123!',
                extraData: 'x'.repeat(1000000)
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(largeData);
            (0, globals_1.expect)([400, 413]).toContain(response.status);
        });
        (0, globals_1.test)('should handle SQL injection attempts', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: "'; DROP TABLE users; --",
                password: 'TestPassword123!'
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle XSS attempts', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({
                email: 'test@hasivu.com',
                password: 'TestPassword123!',
                firstName: '<script>alert("xss")</script>',
                lastName: 'User',
                role: 'student'
            });
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle non-existent endpoints', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/non-existent-endpoint')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            (0, globals_1.expect)(response.status).toBe(404);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle invalid HTTP methods', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch('/api/auth/login')
                .send({
                email: 'test@hasivu.com',
                password: 'TestPassword123!'
            });
            (0, globals_1.expect)([404, 405]).toContain(response.status);
        });
    });
    (0, globals_1.describe)('Performance and Load Testing', () => {
        (0, globals_1.test)('should handle concurrent requests', async () => {
            const promises = Array.from({ length: 10 }, () => (0, supertest_1.default)(app)
                .get('/api/health'));
            const responses = await Promise.all(promises);
            responses.forEach(response => {
                (0, globals_1.expect)(response.status).toBe(200);
            });
        });
        (0, globals_1.test)('should respond within acceptable time limits', async () => {
            const startTime = performance.now();
            const response = await (0, supertest_1.default)(app)
                .get('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.student.token}`);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(responseTime).toBeLessThan(1000);
        });
        (0, globals_1.test)('should handle rapid successive requests', async () => {
            const responses = [];
            for (let i = 0; i < 20; i++) {
                const response = await (0, supertest_1.default)(app)
                    .get('/api/health');
                responses.push(response);
            }
            responses.forEach(response => {
                (0, globals_1.expect)(response.status).toBe(200);
            });
        });
    });
    (0, globals_1.describe)('Security and Authorization', () => {
        (0, globals_1.test)('should enforce proper CORS headers', async () => {
            const response = await (0, supertest_1.default)(app)
                .options('/api/health')
                .set('Origin', 'https://hasivu.com');
            (0, globals_1.expect)(response.headers).toHaveProperty('access-control-allow-origin');
            (0, globals_1.expect)(response.headers).toHaveProperty('access-control-allow-methods');
        });
        (0, globals_1.test)('should include security headers', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/health');
            (0, globals_1.expect)(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
            (0, globals_1.expect)(response.headers).toHaveProperty('x-frame-options');
            (0, globals_1.expect)(response.headers).toHaveProperty('x-xss-protection');
        });
        (0, globals_1.test)('should handle expired JWT tokens', async () => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`);
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should handle malformed JWT tokens', async () => {
            const malformedToken = 'invalid.jwt.token';
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${malformedToken}`);
            (0, globals_1.expect)(response.status).toBe(401);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.test)('should implement proper role-based access control', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/menu/items')
                .set('Authorization', `Bearer ${testUsers.student.token}`)
                .send({
                name: 'Unauthorized Item',
                price: 10.00,
                category: 'main'
            });
            (0, globals_1.expect)(response.status).toBe(403);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
            (0, globals_1.expect)(response.body.error).toContain('Insufficient permissions');
        });
    });
});
//# sourceMappingURL=api-endpoints-complete.test.js.map