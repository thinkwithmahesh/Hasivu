"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
jest.mock('axios');
const axios = require('axios');
(0, globals_1.describe)('API Contract Tests', () => {
    (0, globals_1.beforeAll)(() => {
        axios.create = jest.fn(() => ({
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
        }));
    });
    (0, globals_1.afterAll)(() => {
        jest.clearAllMocks();
    });
    (0, globals_1.describe)('Authentication API Contracts', () => {
        (0, globals_1.describe)('POST /auth/login', () => {
            (0, globals_1.it)('should validate login request contract', async () => {
                const mockAxios = axios.create();
                const loginRequest = {
                    email: 'parent@example.com',
                    password: 'securePassword123',
                    schoolCode: 'SCH001'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        user: {
                            id: 'user-123',
                            email: 'parent@example.com',
                            role: 'parent',
                            firstName: 'John',
                            lastName: 'Doe'
                        },
                        token: 'jwt-token-123',
                        refreshToken: 'refresh-token-456',
                        expiresIn: 3600
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/auth/login', loginRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.user).toHaveProperty('id');
                (0, globals_1.expect)(response.data.data.user).toHaveProperty('email');
                (0, globals_1.expect)(response.data.data.user).toHaveProperty('role');
                (0, globals_1.expect)(response.data.data).toHaveProperty('token');
                (0, globals_1.expect)(response.data.data).toHaveProperty('refreshToken');
                (0, globals_1.expect)(response.data.data).toHaveProperty('expiresIn');
            });
            (0, globals_1.it)('should validate login error response contract', async () => {
                const mockAxios = axios.create();
                const invalidRequest = {
                    email: 'invalid-email',
                    password: 'short'
                };
                const expectedError = {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid credentials',
                        details: {
                            email: 'Invalid email format',
                            password: 'Password too short'
                        }
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 400,
                    data: expectedError
                });
                const response = await mockAxios.post('/auth/login', invalidRequest);
                (0, globals_1.expect)(response.status).toBe(400);
                (0, globals_1.expect)(response.data.success).toBe(false);
                (0, globals_1.expect)(response.data.error).toHaveProperty('code');
                (0, globals_1.expect)(response.data.error).toHaveProperty('message');
                (0, globals_1.expect)(response.data.error).toHaveProperty('details');
            });
        });
        (0, globals_1.describe)('POST /auth/register', () => {
            (0, globals_1.it)('should validate registration request contract', async () => {
                const mockAxios = axios.create();
                const registerRequest = {
                    email: 'newparent@example.com',
                    password: 'SecurePass123!',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phone: '+919876543210',
                    schoolCode: 'SCH001',
                    role: 'parent'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        user: {
                            id: 'user-456',
                            email: 'newparent@example.com',
                            role: 'parent',
                            status: 'PENDING_VERIFICATION',
                            firstName: 'Jane',
                            lastName: 'Smith'
                        },
                        verificationToken: 'email-verification-token'
                    },
                    message: 'Registration successful. Please verify your email.'
                };
                mockAxios.post.mockResolvedValue({
                    status: 201,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/auth/register', registerRequest);
                (0, globals_1.expect)(response.status).toBe(201);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.user.status).toBe('PENDING_VERIFICATION');
                (0, globals_1.expect)(response.data).toHaveProperty('message');
            });
        });
        (0, globals_1.describe)('POST /auth/refresh', () => {
            (0, globals_1.it)('should validate token refresh contract', async () => {
                const mockAxios = axios.create();
                const refreshRequest = {
                    refreshToken: 'refresh-token-456'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        token: 'new-jwt-token-789',
                        refreshToken: 'new-refresh-token-101',
                        expiresIn: 3600
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/auth/refresh', refreshRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data).toHaveProperty('token');
                (0, globals_1.expect)(response.data.data).toHaveProperty('refreshToken');
                (0, globals_1.expect)(response.data.data).toHaveProperty('expiresIn');
            });
        });
    });
    (0, globals_1.describe)('Order API Contracts', () => {
        (0, globals_1.describe)('POST /orders', () => {
            (0, globals_1.it)('should validate order creation contract', async () => {
                const mockAxios = axios.create();
                const orderRequest = {
                    studentId: 'student-123',
                    items: [
                        {
                            menuItemId: 'item-1',
                            quantity: 2,
                            customizations: { spicy: true }
                        },
                        {
                            menuItemId: 'item-2',
                            quantity: 1,
                            notes: 'Extra cheese'
                        }
                    ],
                    deliveryDate: '2025-01-15T12:00:00Z',
                    specialInstructions: 'Handle with care'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        order: {
                            id: 'order-789',
                            orderNumber: 'ORD-2025-001',
                            status: 'pending',
                            totalAmount: 240,
                            currency: 'INR',
                            studentId: 'student-123',
                            deliveryDate: '2025-01-15T12:00:00Z',
                            items: [
                                {
                                    id: 'order-item-1',
                                    menuItemId: 'item-1',
                                    quantity: 2,
                                    unitPrice: 80,
                                    totalPrice: 160
                                },
                                {
                                    id: 'order-item-2',
                                    menuItemId: 'item-2',
                                    quantity: 1,
                                    unitPrice: 80,
                                    totalPrice: 80
                                }
                            ]
                        }
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 201,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/orders', orderRequest);
                (0, globals_1.expect)(response.status).toBe(201);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.order).toHaveProperty('orderNumber');
                (0, globals_1.expect)(response.data.data.order.items).toHaveLength(2);
                (0, globals_1.expect)(response.data.data.order.totalAmount).toBe(240);
            });
        });
        (0, globals_1.describe)('GET /orders/:id', () => {
            (0, globals_1.it)('should validate order retrieval contract', async () => {
                const mockAxios = axios.create();
                const expectedResponse = {
                    success: true,
                    data: {
                        order: {
                            id: 'order-789',
                            orderNumber: 'ORD-2025-001',
                            status: 'confirmed',
                            totalAmount: 240,
                            currency: 'INR',
                            student: {
                                id: 'student-123',
                                firstName: 'John',
                                lastName: 'Doe',
                                grade: '5',
                                section: 'A'
                            },
                            items: [
                                {
                                    id: 'order-item-1',
                                    menuItem: {
                                        id: 'item-1',
                                        name: 'Chicken Biryani',
                                        price: 80
                                    },
                                    quantity: 2,
                                    unitPrice: 80,
                                    totalPrice: 160
                                }
                            ],
                            deliveryDate: '2025-01-15T12:00:00Z',
                            createdAt: '2025-01-14T10:00:00Z',
                            updatedAt: '2025-01-14T10:05:00Z'
                        }
                    }
                };
                mockAxios.get.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.get('/orders/order-789');
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.order).toHaveProperty('student');
                (0, globals_1.expect)(response.data.data.order.items[0]).toHaveProperty('menuItem');
            });
        });
        (0, globals_1.describe)('PUT /orders/:id/status', () => {
            (0, globals_1.it)('should validate order status update contract', async () => {
                const mockAxios = axios.create();
                const statusUpdate = {
                    status: 'preparing',
                    notes: 'Order moved to preparation'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        order: {
                            id: 'order-789',
                            status: 'preparing',
                            updatedAt: '2025-01-14T11:00:00Z'
                        }
                    },
                    message: 'Order status updated successfully'
                };
                mockAxios.put.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.put('/orders/order-789/status', statusUpdate);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.order.status).toBe('preparing');
                (0, globals_1.expect)(response.data).toHaveProperty('message');
            });
        });
    });
    (0, globals_1.describe)('Payment API Contracts', () => {
        (0, globals_1.describe)('POST /payments/create-order', () => {
            (0, globals_1.it)('should validate payment order creation contract', async () => {
                const mockAxios = axios.create();
                const paymentRequest = {
                    orderId: 'order-789',
                    amount: 24000,
                    currency: 'INR',
                    callbackUrl: 'https://api.hasivu.com/payments/callback'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        paymentOrder: {
                            id: 'pay_order_123',
                            razorpayOrderId: 'order_xyz123',
                            amount: 24000,
                            currency: 'INR',
                            status: 'created',
                            orderId: 'order-789'
                        },
                        razorpayKey: 'rzp_test_key',
                        prefill: {
                            name: 'John Doe',
                            email: 'parent@example.com',
                            contact: '+919876543210'
                        }
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/payments/create-order', paymentRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.paymentOrder).toHaveProperty('razorpayOrderId');
                (0, globals_1.expect)(response.data.data).toHaveProperty('razorpayKey');
                (0, globals_1.expect)(response.data.data).toHaveProperty('prefill');
            });
        });
        (0, globals_1.describe)('POST /payments/webhook', () => {
            (0, globals_1.it)('should validate payment webhook contract', async () => {
                const mockAxios = axios.create();
                const webhookPayload = {
                    event: 'payment.captured',
                    payload: {
                        payment: {
                            id: 'pay_xyz123',
                            order_id: 'order_xyz123',
                            amount: 24000,
                            currency: 'INR',
                            status: 'captured'
                        }
                    }
                };
                const expectedResponse = {
                    success: true,
                    message: 'Webhook processed successfully'
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/payments/webhook', webhookPayload);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.message).toBe('Webhook processed successfully');
            });
        });
    });
    (0, globals_1.describe)('RFID API Contracts', () => {
        (0, globals_1.describe)('POST /rfid/verify', () => {
            (0, globals_1.it)('should validate RFID verification contract', async () => {
                const mockAxios = axios.create();
                const rfidRequest = {
                    cardNumber: 'RFID-ABC123',
                    readerId: 'reader-001',
                    location: 'School Canteen Entrance'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        verification: {
                            verified: true,
                            cardId: 'card-123',
                            studentId: 'student-456',
                            student: {
                                id: 'student-456',
                                firstName: 'John',
                                lastName: 'Doe',
                                grade: '5',
                                section: 'A'
                            },
                            readerId: 'reader-001',
                            timestamp: '2025-01-15T12:30:00Z',
                            location: 'School Canteen Entrance'
                        }
                    }
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/rfid/verify', rfidRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.verification.verified).toBe(true);
                (0, globals_1.expect)(response.data.data.verification).toHaveProperty('student');
                (0, globals_1.expect)(response.data.data.verification).toHaveProperty('timestamp');
            });
        });
        (0, globals_1.describe)('POST /rfid/delivery-verification', () => {
            (0, globals_1.it)('should validate delivery verification contract', async () => {
                const mockAxios = axios.create();
                const deliveryRequest = {
                    cardId: 'card-123',
                    orderId: 'order-789',
                    readerId: 'reader-002',
                    deliveryPhoto: 'base64-encoded-image',
                    verificationNotes: 'Meal delivered successfully'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        deliveryVerification: {
                            id: 'delivery-verification-123',
                            orderId: 'order-789',
                            studentId: 'student-456',
                            cardId: 'card-123',
                            readerId: 'reader-002',
                            verifiedAt: '2025-01-15T12:35:00Z',
                            status: 'delivered',
                            deliveryPhoto: 'base64-encoded-image',
                            verificationNotes: 'Meal delivered successfully'
                        }
                    },
                    message: 'Delivery verified successfully'
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/rfid/delivery-verification', deliveryRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.deliveryVerification.status).toBe('delivered');
                (0, globals_1.expect)(response.data).toHaveProperty('message');
            });
        });
    });
    (0, globals_1.describe)('Menu API Contracts', () => {
        (0, globals_1.describe)('GET /menu/daily', () => {
            (0, globals_1.it)('should validate daily menu retrieval contract', async () => {
                const mockAxios = axios.create();
                const expectedResponse = {
                    success: true,
                    data: {
                        menu: {
                            id: 'daily-menu-123',
                            schoolId: 'school-123',
                            date: '2025-01-15',
                            dayType: 'WEEKDAY',
                            items: [
                                {
                                    id: 'menu-item-1',
                                    name: 'Chicken Biryani',
                                    description: 'Traditional chicken biryani with raita',
                                    category: 'MAIN_COURSE',
                                    price: 80,
                                    currency: 'INR',
                                    available: true,
                                    nutritionalInfo: {
                                        calories: 450,
                                        protein: 25,
                                        carbs: 50,
                                        fat: 15
                                    },
                                    allergens: ['nuts'],
                                    imageUrl: 'https://cdn.hasivu.com/menu/chicken-biryani.jpg'
                                },
                                {
                                    id: 'menu-item-2',
                                    name: 'Mango Lassi',
                                    description: 'Sweet mango yogurt drink',
                                    category: 'BEVERAGE',
                                    price: 30,
                                    currency: 'INR',
                                    available: true,
                                    nutritionalInfo: {
                                        calories: 150,
                                        protein: 3,
                                        carbs: 25,
                                        fat: 5
                                    },
                                    allergens: ['dairy'],
                                    imageUrl: 'https://cdn.hasivu.com/menu/mango-lassi.jpg'
                                }
                            ]
                        }
                    }
                };
                mockAxios.get.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.get('/menu/daily?date=2025-01-15&schoolId=school-123');
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.menu.items).toHaveLength(2);
                (0, globals_1.expect)(response.data.data.menu.items[0]).toHaveProperty('nutritionalInfo');
                (0, globals_1.expect)(response.data.data.menu.items[0]).toHaveProperty('allergens');
            });
        });
    });
    (0, globals_1.describe)('Notification API Contracts', () => {
        (0, globals_1.describe)('POST /notifications/send', () => {
            (0, globals_1.it)('should validate notification sending contract', async () => {
                const mockAxios = axios.create();
                const notificationRequest = {
                    userId: 'user-123',
                    type: 'order_status_update',
                    title: 'Order Confirmed',
                    body: 'Your order ORD-2025-001 has been confirmed',
                    channels: ['push', 'email'],
                    data: {
                        orderId: 'order-789',
                        status: 'confirmed'
                    },
                    priority: 'normal'
                };
                const expectedResponse = {
                    success: true,
                    data: {
                        notification: {
                            id: 'notification-123',
                            userId: 'user-123',
                            type: 'order_status_update',
                            status: 'sent',
                            channels: ['push', 'email'],
                            sentAt: '2025-01-15T10:00:00Z'
                        }
                    },
                    message: 'Notification sent successfully'
                };
                mockAxios.post.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.post('/notifications/send', notificationRequest);
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.notification.channels).toEqual(['push', 'email']);
                (0, globals_1.expect)(response.data.data.notification.status).toBe('sent');
            });
        });
    });
    (0, globals_1.describe)('Analytics API Contracts', () => {
        (0, globals_1.describe)('GET /analytics/dashboard', () => {
            (0, globals_1.it)('should validate analytics dashboard contract', async () => {
                const mockAxios = axios.create();
                const expectedResponse = {
                    success: true,
                    data: {
                        dashboard: {
                            summary: {
                                totalOrders: 1250,
                                totalRevenue: 95000,
                                totalStudents: 450,
                                averageOrderValue: 76
                            },
                            charts: {
                                orderTrends: [
                                    { date: '2025-01-01', orders: 45, revenue: 3420 },
                                    { date: '2025-01-02', orders: 52, revenue: 3952 }
                                ],
                                popularItems: [
                                    { itemId: 'item-1', name: 'Chicken Biryani', orders: 180 },
                                    { itemId: 'item-2', name: 'Paneer Butter Masala', orders: 145 }
                                ],
                                paymentMethods: [
                                    { method: 'UPI', percentage: 65 },
                                    { method: 'Card', percentage: 25 },
                                    { method: 'Wallet', percentage: 10 }
                                ]
                            },
                            alerts: [
                                {
                                    type: 'warning',
                                    message: 'Low inventory for Chicken Biryani',
                                    priority: 'medium'
                                }
                            ]
                        }
                    }
                };
                mockAxios.get.mockResolvedValue({
                    status: 200,
                    data: expectedResponse
                });
                const response = await mockAxios.get('/analytics/dashboard?schoolId=school-123&period=30d');
                (0, globals_1.expect)(response.status).toBe(200);
                (0, globals_1.expect)(response.data.success).toBe(true);
                (0, globals_1.expect)(response.data.data.dashboard).toHaveProperty('summary');
                (0, globals_1.expect)(response.data.data.dashboard).toHaveProperty('charts');
                (0, globals_1.expect)(response.data.data.dashboard.charts).toHaveProperty('orderTrends');
                (0, globals_1.expect)(response.data.data.dashboard.charts).toHaveProperty('popularItems');
            });
        });
    });
    (0, globals_1.describe)('Error Response Contracts', () => {
        (0, globals_1.it)('should validate 400 Bad Request error contract', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: {
                        field: 'email',
                        issue: 'Invalid email format'
                    }
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123456'
            };
            mockAxios.post.mockRejectedValue({
                response: {
                    status: 400,
                    data: expectedError
                }
            });
            try {
                await mockAxios.post('/auth/login', { email: 'invalid' });
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(400);
                (0, globals_1.expect)(error.response.data.success).toBe(false);
                (0, globals_1.expect)(error.response.data.error.code).toBe('VALIDATION_ERROR');
                (0, globals_1.expect)(error.response.data).toHaveProperty('timestamp');
                (0, globals_1.expect)(error.response.data).toHaveProperty('requestId');
            }
        });
        (0, globals_1.it)('should validate 401 Unauthorized error contract', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123457'
            };
            mockAxios.get.mockRejectedValue({
                response: {
                    status: 401,
                    data: expectedError
                }
            });
            try {
                await mockAxios.get('/orders');
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(401);
                (0, globals_1.expect)(error.response.data.error.code).toBe('UNAUTHORIZED');
            }
        });
        (0, globals_1.it)('should validate 403 Forbidden error contract', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions'
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123458'
            };
            mockAxios.post.mockRejectedValue({
                response: {
                    status: 403,
                    data: expectedError
                }
            });
            try {
                await mockAxios.post('/admin/schools', {});
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(403);
                (0, globals_1.expect)(error.response.data.error.code).toBe('FORBIDDEN');
            }
        });
        (0, globals_1.it)('should validate 404 Not Found error contract', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found'
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123459'
            };
            mockAxios.get.mockRejectedValue({
                response: {
                    status: 404,
                    data: expectedError
                }
            });
            try {
                await mockAxios.get('/orders/nonexistent');
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(404);
                (0, globals_1.expect)(error.response.data.error.code).toBe('NOT_FOUND');
            }
        });
        (0, globals_1.it)('should validate 500 Internal Server Error contract', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred'
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123460'
            };
            mockAxios.get.mockRejectedValue({
                response: {
                    status: 500,
                    data: expectedError
                }
            });
            try {
                await mockAxios.get('/analytics/dashboard');
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(500);
                (0, globals_1.expect)(error.response.data.error.code).toBe('INTERNAL_ERROR');
            }
        });
    });
    (0, globals_1.describe)('Rate Limiting Contracts', () => {
        (0, globals_1.it)('should validate rate limit exceeded response', async () => {
            const mockAxios = axios.create();
            const expectedError = {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests',
                    retryAfter: 60
                },
                timestamp: '2025-01-15T10:00:00Z',
                requestId: 'req-123461'
            };
            mockAxios.get.mockRejectedValue({
                response: {
                    status: 429,
                    headers: {
                        'retry-after': '60',
                        'x-ratelimit-limit': '100',
                        'x-ratelimit-remaining': '0',
                        'x-ratelimit-reset': '1642243260'
                    },
                    data: expectedError
                }
            });
            try {
                await mockAxios.get('/orders');
            }
            catch (error) {
                (0, globals_1.expect)(error.response.status).toBe(429);
                (0, globals_1.expect)(error.response.data.error.code).toBe('RATE_LIMIT_EXCEEDED');
                (0, globals_1.expect)(error.response.data.error.retryAfter).toBe(60);
                (0, globals_1.expect)(error.response.headers['retry-after']).toBe('60');
            }
        });
    });
});
//# sourceMappingURL=api-contract-tests.test.js.map