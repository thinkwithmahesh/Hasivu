"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2ETestHelpers = void 0;
const test_helpers_1 = require("../utils/test-helpers");
class MockAuthService {
    async registerStudent(data) {
        return {
            success: true,
            data: {
                user: { ...data, id: 'student-' + Math.random().toString(36).substring(7) },
                verificationToken: 'verify-token-123'
            }
        };
    }
    async verifyEmail(token) {
        return { success: true, data: {} };
    }
    async login(email, password) {
        return { success: true, data: { token: 'auth-token-123' } };
    }
    async registerParent(data) {
        return { success: true, data: { user: { ...data, id: 'parent-' + Math.random().toString(36).substring(7) } } };
    }
    async registerStudentByParent(data, token) {
        return { success: true, data: { student: { ...data, id: 'student-' + Math.random().toString(36).substring(7) } } };
    }
    async updateDietaryPreferences(userId, preferences, token) {
        return { success: true, data: {} };
    }
    async linkStudentToParent(studentId, parentId) {
        return { success: true, data: {} };
    }
    async updateSchoolPolicies(params, token) {
        return { success: true, data: { policies: params.policies } };
    }
    async synchronizeSchoolSystems(schoolId, token) {
        return { success: true, data: { synchronizedServices: ['menu_service', 'payment_service', 'rfid_service', 'notification_service'] } };
    }
    async scheduleMaintenanceWindow(params, token) {
        return { success: true, data: {} };
    }
    async getSystemStatus(schoolId) {
        return { success: true, data: { mode: 'operational', activeAlerts: [], allServicesHealthy: true } };
    }
    async enterMaintenanceMode(schoolId, token) {
        return { success: true, data: {} };
    }
    async exitMaintenanceMode(schoolId, token) {
        return { success: true, data: {} };
    }
    async syncStudentsFromMIS(params, token) {
        const mockStudents = Array.from({ length: params.students.length }, (_, i) => ({
            id: 'synced-student-' + i,
            ...params.students[i],
            parentId: 'parent-' + i
        }));
        return { success: true, data: { studentsCreated: params.students.length, studentsUpdated: 0, createdStudents: mockStudents } };
    }
    async generateParentAccounts(params, token) {
        return { success: true, data: { parentsGenerated: 25 } };
    }
    async generateIntegrationReport(params) {
        return { success: true, data: { studentsIntegrated: 25, parentsLinked: 25, cardsGenerated: 25, budgetsConfigured: 25, systemHealth: 'optimal' } };
    }
    async triggerEmergencyAlert(params, token) {
        return { success: true, data: { alertId: 'alert-123' } };
    }
    async resolveEmergencyAlert(params, token) {
        return { success: true, data: {} };
    }
    async auditPersonalDataUsage(params) {
        return { success: true, data: { dataCategories: [{ category: 'PROFILE_DATA', purpose: 'SERVICE_DELIVERY', lawfulBasis: 'CONTRACT' }] } };
    }
    async requestDataDeletion(params) {
        return { success: true, data: { deletionScheduled: true, completionDate: new Date() } };
    }
    async getUserProfile(userId) {
        return { success: false, error: 'user deleted or access restricted' };
    }
    async generateComplianceReport(params) {
        return { success: true, data: { deletionRequests: [{ userId: 'deleted-user', status: 'SCHEDULED' }] } };
    }
    async attemptLogin(params) {
        return { success: false, error: 'Invalid credentials' };
    }
    async checkSecurityAlerts(params) {
        return { success: true, data: { activeAlerts: [{ id: 'alert-1', type: 'BRUTE_FORCE_DETECTED', targetUserId: 'target-user' }] } };
    }
    async getUserSecurityStatus(userId) {
        return { success: true, data: { isLocked: false, securityLevel: 'ENHANCED', requiresMFA: true } };
    }
    async investigateSecurityIncident(params, token) {
        return { success: true, data: { riskLevel: 'HIGH' } };
    }
    async initiateAccountRecovery(params) {
        return { success: true, data: { recoveryToken: 'recovery-token-123' } };
    }
    async completeAccountRecovery(params) {
        return { success: true, data: {} };
    }
    async generateSecurityIncidentReport(params) {
        return { success: true, data: { incident: { type: 'BRUTE_FORCE_DETECTED', resolved: true, resolutionTime: 300, impactAssessment: 'Low impact' } } };
    }
    async createSchoolConfig(params, token) {
        return { success: true, data: {} };
    }
    async archiveSchoolData(schoolId, token) {
        return { success: true, data: {} };
    }
    async verifyDataIntegrity(params) {
        return { success: true, data: { inconsistencies: [] } };
    }
    async verifySystemConsistency(params) {
        return { success: true, data: { isConsistent: true } };
    }
}
class MockMenuService {
    async getAvailableMenu(params) {
        const mockItems = [
            {
                id: 'item-1',
                name: 'Mock Lunch Item',
                price: 75,
                isVegetarian: true,
                isGlutenFree: false,
                allergens: [],
                includedInPlan: true
            },
            {
                id: 'item-2',
                name: 'Mock Snack',
                price: 50,
                isVegetarian: false,
                isGlutenFree: true,
                allergens: ['nuts'],
                includedInPlan: false
            },
            {
                id: 'item-3',
                name: 'Mock Beverage',
                price: 25,
                isVegetarian: true,
                isGlutenFree: true,
                allergens: [],
                includedInPlan: true
            }
        ];
        let filteredItems = mockItems;
        if (params.dietaryRestrictions?.includes('vegetarian')) {
            filteredItems = filteredItems.filter(item => item.isVegetarian);
        }
        if (params.allergies?.includes('nuts')) {
            filteredItems = filteredItems.filter(item => !item.allergens?.includes('nuts'));
        }
        return { success: true, data: filteredItems };
    }
    async getPersonalizedMenu(params) {
        return this.getAvailableMenu(params);
    }
    async suggestAlternatives(params) {
        const mockSuggestions = [
            {
                id: 'alt-1',
                name: 'Alternative Item',
                price: 80,
                isVegetarian: true,
                isGlutenFree: true,
                allergens: []
            }
        ];
        return { success: true, data: { suggestions: mockSuggestions } };
    }
    async setupDailyMenu(params) {
        return { success: true, data: { itemsCreated: params.items?.length || 0 } };
    }
    async getCachedMenu(params) {
        const result = await this.getAvailableMenu(params);
        return {
            success: result.success,
            data: result.data || [],
            metadata: { isCached: true }
        };
    }
    async checkServiceHealth(params) {
        return { success: true, data: { isHealthy: true } };
    }
    async addMenuItem(schoolId, item) {
        return { success: true, data: { id: 'new-item-id' } };
    }
    async getItemAvailability(itemId) {
        return { success: true, data: { availableQuantity: 0, reservedQuantity: 5 } };
    }
    async addToWaitlist(params) {
        return { success: true, data: { position: 1 } };
    }
    async processWaitlistPromotion(itemId, schoolId) {
        return { success: true, data: { promotedUsers: [{ userId: 'waitlist-user-1' }] } };
    }
    async generateDemandForecast(params) {
        const forecastDays = Array.from({ length: params.forecastPeriod }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
            expectedOrders: Math.floor(Math.random() * 50) + 20,
            popularItems: ['item-1', 'item-2'],
            recommendedInventory: { 'item-1': 30, 'item-2': 20 }
        }));
        return { success: true, data: { forecastDays } };
    }
    async updateMenuForPolicyCompliance(params) {
        return { success: true, data: { updatedItems: 5 } };
    }
    async getMenuStatus(schoolId) {
        return { success: true, data: { quarantinedItems: [{ id: 'quarantined-item', quarantineReason: 'FOOD_SAFETY_ALERT' }] } };
    }
    async clearDailyMenu(schoolId, adminToken) {
        return { success: true, data: { clearedItems: 10 } };
    }
}
class MockPaymentService {
    async createOrder(data) {
        const order = {
            id: 'order-' + Math.random().toString(36).substring(7),
            userId: data.userId,
            items: data.items || [],
            totalAmount: data.totalAmount || 100,
            schoolId: data.schoolId,
            status: data.status || 'pending',
            paymentStatus: 'pending'
        };
        return { success: true, data: { order } };
    }
    async processPayment(data) {
        const success = !data.razorpaySignature?.includes('invalid');
        return {
            success,
            data: success ? { payment: { id: data.razorpayPaymentId, status: 'completed' } } : undefined,
            error: success ? undefined : 'payment failed or signature invalid'
        };
    }
    async getOrderStatus(orderId) {
        const order = {
            id: orderId,
            userId: 'user-123',
            items: [],
            totalAmount: 100,
            status: 'confirmed',
            paymentStatus: 'completed',
            deliveredAt: new Date()
        };
        return { success: true, data: { order } };
    }
    async updateOrderStatus(orderId, status, token) {
        return { success: true, data: {} };
    }
    async getUserOrderHistory(userId) {
        const orders = [{
                id: 'hist-order-1',
                userId,
                items: [],
                totalAmount: 150,
                status: 'delivered',
                paymentStatus: 'completed'
            }];
        return { success: true, data: { orders } };
    }
    async addPaymentMethod(userId, methodData, token) {
        return { success: true, data: { id: 'payment-method-123' } };
    }
    async createMealPlan(data, token) {
        return { success: true, data: { id: 'meal-plan-123' } };
    }
    async processAutomaticPayment(orderId, mealPlanId) {
        return { success: true, data: {} };
    }
    async getChildOrderHistory(parentId, childId, token) {
        return { success: true, data: { orders: [] } };
    }
    async getAvailableSubscriptionPlans(params) {
        const plans = [{ id: 'plan-1', name: 'Monthly Plan', price: 500 }];
        return { success: true, data: { plans } };
    }
    async createSubscription(data, token) {
        return { success: true, data: { subscription: { id: 'sub-123', status: 'active' } } };
    }
    async processSubscriptionPayment(subscriptionId) {
        return { success: true, data: {} };
    }
    async createOrderWithSubscription(data, token) {
        const order = {
            id: 'sub-order-123',
            userId: data.userId,
            items: data.items,
            totalAmount: data.totalAmount,
            status: 'confirmed',
            paymentStatus: 'covered_by_subscription'
        };
        return { success: true, data: { order } };
    }
    async getSubscriptionUsage(subscriptionId) {
        return { success: true, data: { ordersThisMonth: 1 } };
    }
    async processSubscriptionRenewal(subscriptionId) {
        return { success: true, data: { payment: { id: 'renewal-pay-123', status: 'completed' } } };
    }
    async getSubscriptionStatus(subscriptionId) {
        return { success: true, data: { subscription: { status: 'active', currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } };
    }
    async validateOrderAgainstDietary(orderId, userId) {
        return { success: false, data: { conflicts: [{ type: 'ALLERGEN_CONFLICT', allergen: 'nuts' }] } };
    }
    async updateOrderItems(orderId, items, token) {
        const order = {
            id: orderId,
            userId: 'user-123',
            items,
            totalAmount: 100,
            status: 'updated',
            paymentStatus: 'pending'
        };
        return { success: true, data: { order } };
    }
    async retryPayment(data) {
        return { success: true, data: { payment: { id: data.razorpayPaymentId, status: 'completed' } } };
    }
    async setStudentBudget(data, token) {
        return { success: true, data: {} };
    }
    async approveOrder(orderId, token) {
        return { success: true, data: {} };
    }
    async getBudgetUsage(params) {
        return { success: true, data: { usedAmount: 50, totalBudget: 100 } };
    }
    async getAnonymizedOrderData(params) {
        return { success: true, data: { orders: [{ userId: 'ANONYMIZED', amount: 100 }] } };
    }
    async processEmergencyRefund(orderId, params) {
        return { success: true, data: {} };
    }
    async cancelOrder(orderId, reason) {
        return { success: true, data: {} };
    }
    async expediteOrderCompletion(orderId, params) {
        return { success: true, data: {} };
    }
    async cancelAllPendingOrders(schoolId, token) {
        return { success: true, data: {} };
    }
    async getSchoolOrderAnalytics(params) {
        return { success: true, data: { totalOrders: 20, totalRevenue: 2000, averageOrderValue: 100 } };
    }
    async createHistoricalOrder(data) {
        return { success: true, data: {} };
    }
    async generateComprehensiveAnalytics(params, token) {
        return {
            success: true,
            data: {
                revenue: { totalRevenue: 10000, dailyAverage: 333, monthlyGrowth: 15 },
                popularItems: [{ itemId: 'item-1', orderCount: 50, revenue: 2500 }],
                studentBehavior: { averageOrdersPerStudent: 2.5, averageOrderValue: 85, peakOrderingHours: ['12:00', '13:00'] }
            }
        };
    }
    async getGradeWiseAnalytics(params) {
        return {
            success: true,
            data: {
                grades: [
                    { grade: '9A', totalStudents: 6, activeStudents: 6, totalOrders: 15, totalRevenue: 1200, averageOrderValue: 80 },
                    { grade: '10B', totalStudents: 6, activeStudents: 5, totalOrders: 12, totalRevenue: 960, averageOrderValue: 80 },
                    { grade: '11C', totalStudents: 6, activeStudents: 6, totalOrders: 18, totalRevenue: 1440, averageOrderValue: 80 },
                    { grade: '12D', totalStudents: 6, activeStudents: 4, totalOrders: 10, totalRevenue: 800, averageOrderValue: 80 }
                ]
            }
        };
    }
    async getFinancialAnalytics(params) {
        return {
            success: true,
            data: {
                currentMonth: { revenue: 25000, orderCount: 300, uniqueCustomers: 150 },
                projections: { nextMonthRevenue: 27500, growthRate: 10 }
            }
        };
    }
    async exportAnalyticsData(params) {
        return {
            success: true,
            data: {
                exportUrl: 'https://export.example.com/data.json',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                recordCount: 500
            }
        };
    }
    async setupGradeBudgets(params, token) {
        return { success: true, data: {} };
    }
}
class MockRFIDService {
    async createCard(data) {
        return { success: true, data: { id: 'rfid-card-' + Math.random().toString(36).substring(7) } };
    }
    async activateCard(cardId) {
        return { success: true, data: {} };
    }
    async verifyDelivery(data) {
        return { success: true, data: { status: 'VERIFIED' } };
    }
    async getDeliveryHistory(userId) {
        return { success: true, data: [{ card: { studentId: userId }, status: 'VERIFIED' }] };
    }
    async registerReader(data) {
        return { success: true, data: { id: 'reader-' + Math.random().toString(36).substring(7), isOnline: true } };
    }
    async updateReaderStatus(readerId, status) {
        return { success: true, data: {} };
    }
    async manualDeliveryVerification(data, token) {
        return { success: true, data: { verificationMethod: 'manual' } };
    }
    async getSystemHealth(params) {
        return { success: true, data: { readersOnline: 1, systemStatus: 'operational' } };
    }
    async generateIncidentReport(params) {
        return {
            success: true,
            data: {
                incidents: [
                    { type: 'READER_OFFLINE', readerId: 'failure-test-reader' },
                    { type: 'MANUAL_VERIFICATION', orderId: 'order-123' }
                ]
            }
        };
    }
    async getDeliveryAnalytics(params) {
        return {
            success: true,
            data: {
                totalDeliveries: 10,
                successfulDeliveries: 10,
                deliveryRate: 100,
                locationBreakdown: { 'Main Cafeteria': 10 }
            }
        };
    }
    async getCardUsageStats(params) {
        return {
            success: true,
            data: {
                totalCards: 10,
                activeCards: 10,
                totalScans: 10,
                averageScansPerCard: 1
            }
        };
    }
    async detectAnomalousActivity(params) {
        return { success: true, data: { rapidScans: [], suspiciousPatterns: [] } };
    }
    async getReaderLoadAnalytics(params) {
        return {
            success: true,
            data: {
                totalVerifications: 80,
                readerBreakdown: { 'rush-reader-1': 27, 'rush-reader-2': 26, 'rush-reader-3': 27 }
            }
        };
    }
    async bulkGenerateCards(params) {
        return { success: true, data: { cardsGenerated: 25 } };
    }
    async updateVerificationPolicies(params) {
        return { success: true, data: {} };
    }
    async deactivateAllCards(schoolId, token) {
        return { success: true, data: {} };
    }
}
class MockNotificationService {
    async getUserNotifications(userId) {
        const notifications = [
            { id: 'notif-1', type: 'ORDER_CONFIRMED', userId },
            { id: 'notif-2', type: 'ORDER_DELIVERED', userId },
            { id: 'notif-3', type: 'CHILD_ORDER_PLACED', userId, relatedUserId: 'child-123' },
            { id: 'notif-4', type: 'MAINTENANCE_SCHEDULED', userId },
            { id: 'notif-5', type: 'PAYMENT_FAILED', userId },
            { id: 'notif-6', type: 'EMERGENCY_ALERT', userId },
            { id: 'notif-7', type: 'EMERGENCY_RESOLVED', userId },
            { id: 'notif-8', type: 'WAITLIST_PROMOTED', userId }
        ];
        return { success: true, data: notifications };
    }
    async sendWhatsAppNotification(params) {
        const success = !params.phoneNumber?.includes('999');
        return {
            success,
            data: success ? { messageId: 'wa-msg-' + Math.random().toString(36).substring(7) } : undefined,
            error: success ? undefined : 'Invalid phone number'
        };
    }
    async handleWhatsAppWebhook(params) {
        return { success: true, data: {} };
    }
    async getNotificationLog(params) {
        return {
            success: true,
            data: [{
                    messageId: params.messageId || 'msg-123',
                    deliveryStatus: 'delivered',
                    channel: params.type || 'whatsapp'
                }]
        };
    }
    async getNotificationFallbacks(params) {
        return { success: true, data: { fallbackChannel: 'email', attemptsMade: 1 } };
    }
}
describe('Complete User Journey E2E Tests', () => {
    let authService;
    let menuService;
    let paymentService;
    let rfidService;
    let notificationService;
    beforeEach(() => {
        authService = new MockAuthService();
        menuService = new MockMenuService();
        paymentService = new MockPaymentService();
        rfidService = new MockRFIDService();
        notificationService = new MockNotificationService();
    });
    afterEach(async () => {
        jest.clearAllMocks();
        test_helpers_1.TestDataFactory.reset();
    });
    describe('Complete Student Journey: Registration to Meal Delivery', () => {
        it('should handle complete student lifecycle', async () => {
            const studentData = test_helpers_1.TestDataFactory.user.student({
                email: 'student@example.com',
                password: 'SecurePassword123!',
                firstName: 'John',
                lastName: 'Doe',
                schoolId: 'school-123',
                grade: '10A'
            });
            const registrationResult = await authService.registerStudent(studentData);
            expect(registrationResult.success).toBe(true);
            expect(registrationResult.data.user.id).toBeDefined();
            const userId = registrationResult.data.user.id;
            const verificationToken = registrationResult.data.verificationToken;
            const emailVerification = await authService.verifyEmail(verificationToken);
            expect(emailVerification.success).toBe(true);
            const loginResult = await authService.login(studentData.email, studentData.password);
            expect(loginResult.success).toBe(true);
            expect(loginResult.data.token).toBeDefined();
            const authToken = loginResult.data.token;
            const rfidCardData = {
                cardNumber: 'A1B2C3D4E5F6',
                studentId: userId,
                schoolId: studentData.schoolId,
                cardType: 'student',
                metadata: { accessLevel: 1 }
            };
            const cardCreation = await rfidService.createCard(rfidCardData);
            expect(cardCreation.success).toBe(true);
            const cardActivation = await rfidService.activateCard(cardCreation.data.id);
            expect(cardActivation.success).toBe(true);
            const menuItems = await menuService.getAvailableMenu({
                schoolId: studentData.schoolId,
                date: new Date(),
                userId: userId
            });
            expect(menuItems.success).toBe(true);
            expect(menuItems.data.length).toBeGreaterThan(0);
            const selectedItems = menuItems.data.slice(0, 3);
            const cartItems = selectedItems.map(item => ({
                menuItemId: item.id,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: item.price
            }));
            const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
            const orderData = test_helpers_1.TestDataFactory.order({
                userId: userId,
                items: cartItems,
                totalAmount: cartTotal,
                schoolId: studentData.schoolId,
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
            const orderResult = await paymentService.createOrder(orderData);
            expect(orderResult.success).toBe(true);
            expect(orderResult.data.order.id).toBeDefined();
            const orderId = orderResult.data.order.id;
            const paymentData = {
                orderId: orderId,
                amount: cartTotal,
                currency: 'INR',
                method: 'razorpay',
                razorpayPaymentId: 'pay_test123',
                razorpayOrderId: 'order_test123',
                razorpaySignature: 'test_signature'
            };
            const paymentResult = await paymentService.processPayment(paymentData);
            expect(paymentResult.success).toBe(true);
            expect(paymentResult.data.payment.status).toBe('completed');
            const orderStatus = await paymentService.getOrderStatus(orderId);
            expect(orderStatus.success).toBe(true);
            expect(orderStatus.data.order.status).toBe('confirmed');
            const notifications = await notificationService.getUserNotifications(userId);
            expect(notifications.success).toBe(true);
            expect(notifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'ORDER_CONFIRMED',
                    userId: userId
                })
            ]));
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: studentData.schoolId
            });
            const mealPreparation = await paymentService.updateOrderStatus(orderId, 'preparing', adminToken);
            expect(mealPreparation.success).toBe(true);
            const mealReady = await paymentService.updateOrderStatus(orderId, 'ready_for_delivery', adminToken);
            expect(mealReady.success).toBe(true);
            const verificationData = {
                cardNumber: rfidCardData.cardNumber,
                readerId: 'reader-001',
                orderId: orderId,
                timestamp: new Date(),
                location: 'Main Cafeteria'
            };
            const deliveryVerification = await rfidService.verifyDelivery(verificationData);
            expect(deliveryVerification.success).toBe(true);
            expect(deliveryVerification.data.status).toBe('VERIFIED');
            const finalOrderStatus = await paymentService.getOrderStatus(orderId);
            expect(finalOrderStatus.success).toBe(true);
            expect(finalOrderStatus.data.order.status).toBe('delivered');
            expect(finalOrderStatus.data.order.deliveredAt).toBeDefined();
            const finalNotifications = await notificationService.getUserNotifications(userId);
            expect(finalNotifications.success).toBe(true);
            expect(finalNotifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'ORDER_DELIVERED',
                    userId: userId
                })
            ]));
            const orderHistory = await paymentService.getUserOrderHistory(userId);
            expect(orderHistory.success).toBe(true);
            expect(orderHistory.data.orders).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: orderId,
                    status: 'delivered'
                })
            ]));
            const deliveryHistory = await rfidService.getDeliveryHistory(userId);
            expect(deliveryHistory.success).toBe(true);
            expect(deliveryHistory.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    card: expect.objectContaining({
                        studentId: userId
                    }),
                    status: 'VERIFIED'
                })
            ]));
        });
        it('should handle parent-student workflow', async () => {
            const parentData = test_helpers_1.TestDataFactory.user.parent({
                email: 'parent@example.com',
                password: 'ParentPassword123!',
                firstName: 'Jane',
                lastName: 'Doe',
                phoneNumber: '+1234567890'
            });
            const parentRegistration = await authService.registerParent(parentData);
            expect(parentRegistration.success).toBe(true);
            const parentId = parentRegistration.data.user.id;
            const studentData = test_helpers_1.TestDataFactory.user.student({
                email: 'child@example.com',
                firstName: 'Child',
                lastName: 'Doe',
                parentId: parentId,
                schoolId: 'school-123',
                grade: '8B'
            });
            const parentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: parentId,
                role: 'parent'
            });
            const studentRegistration = await authService.registerStudentByParent(studentData, parentToken);
            expect(studentRegistration.success).toBe(true);
            const studentId = studentRegistration.data.student.id;
            const paymentMethodData = {
                type: 'card',
                cardNumber: '4111111111111111',
                expiryMonth: '12',
                expiryYear: '2025',
                cvv: '123',
                holderName: 'Jane Doe'
            };
            const paymentMethod = await paymentService.addPaymentMethod(parentId, paymentMethodData, parentToken);
            expect(paymentMethod.success).toBe(true);
            const mealPlanData = {
                studentId: studentId,
                planType: 'weekly',
                budget: 500.00,
                dietaryRestrictions: ['vegetarian'],
                allowedCategories: ['main_course', 'beverages', 'snacks']
            };
            const mealPlan = await paymentService.createMealPlan(mealPlanData, parentToken);
            expect(mealPlan.success).toBe(true);
            const studentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: studentId,
                role: 'student'
            });
            const menuItems = await menuService.getAvailableMenu({
                schoolId: studentData.schoolId,
                userId: studentId,
                dietaryRestrictions: ['vegetarian']
            });
            expect(menuItems.success).toBe(true);
            const affordableItems = menuItems.data
                .filter(item => item.price <= 100)
                .slice(0, 2);
            const orderData = test_helpers_1.TestDataFactory.order({
                userId: studentId,
                items: affordableItems.map(item => ({
                    menuItemId: item.id,
                    quantity: 1,
                    price: item.price
                })),
                totalAmount: affordableItems.reduce((sum, item) => sum + item.price, 0),
                schoolId: studentData.schoolId
            });
            const orderResult = await paymentService.createOrder(orderData);
            expect(orderResult.success).toBe(true);
            const paymentResult = await paymentService.processAutomaticPayment(orderResult.data.order.id, mealPlan.data.id);
            expect(paymentResult.success).toBe(true);
            const parentNotifications = await notificationService.getUserNotifications(parentId);
            expect(parentNotifications.success).toBe(true);
            expect(parentNotifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'CHILD_ORDER_PLACED',
                    userId: parentId,
                    relatedUserId: studentId
                })
            ]));
            const childOrderHistory = await paymentService.getChildOrderHistory(parentId, studentId, parentToken);
            expect(childOrderHistory.success).toBe(true);
            expect(childOrderHistory.data.orders.length).toBeGreaterThan(0);
        });
        it('should handle subscription-based meal plans', async () => {
            const studentData = test_helpers_1.TestDataFactory.user.student({
                email: 'subscriber@example.com',
                password: 'SubscriberPassword123!',
                schoolId: 'school-123'
            });
            const registrationResult = await authService.registerStudent(studentData);
            expect(registrationResult.success).toBe(true);
            const userId = registrationResult.data.user.id;
            const authToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: userId,
                role: 'student'
            });
            const subscriptionPlans = await paymentService.getAvailableSubscriptionPlans({
                schoolId: studentData.schoolId,
                planType: 'monthly'
            });
            expect(subscriptionPlans.success).toBe(true);
            expect(subscriptionPlans.data.plans.length).toBeGreaterThan(0);
            const selectedPlan = subscriptionPlans.data.plans[0];
            const subscriptionData = {
                userId: userId,
                planId: selectedPlan.id,
                paymentMethodId: 'pm_test_123',
                startDate: new Date()
            };
            const subscription = await paymentService.createSubscription(subscriptionData, authToken);
            expect(subscription.success).toBe(true);
            expect(subscription.data.subscription.status).toBe('active');
            const initialPayment = await paymentService.processSubscriptionPayment(subscription.data.subscription.id);
            expect(initialPayment.success).toBe(true);
            const menuItems = await menuService.getAvailableMenu({
                schoolId: studentData.schoolId,
                subscriptionPlanId: selectedPlan.id
            });
            expect(menuItems.success).toBe(true);
            const subscriberItems = menuItems.data
                .filter(item => item.includedInPlan)
                .slice(0, 3);
            const orderData = test_helpers_1.TestDataFactory.order({
                userId: userId,
                items: subscriberItems.map(item => ({
                    menuItemId: item.id,
                    quantity: 1,
                    price: 0
                })),
                totalAmount: 0,
                subscriptionId: subscription.data.subscription.id,
                schoolId: studentData.schoolId
            });
            const orderResult = await paymentService.createOrderWithSubscription(orderData, authToken);
            expect(orderResult.success).toBe(true);
            expect(orderResult.data.order.paymentStatus).toBe('covered_by_subscription');
            const subscriptionUsage = await paymentService.getSubscriptionUsage(subscription.data.subscription.id);
            expect(subscriptionUsage.success).toBe(true);
            expect(subscriptionUsage.data.ordersThisMonth).toBe(1);
            const renewalResult = await paymentService.processSubscriptionRenewal(subscription.data.subscription.id);
            expect(renewalResult.success).toBe(true);
            expect(renewalResult.data.payment.status).toBe('completed');
            const subscriptionStatus = await paymentService.getSubscriptionStatus(subscription.data.subscription.id);
            expect(subscriptionStatus.success).toBe(true);
            expect(subscriptionStatus.data.subscription.status).toBe('active');
            expect(subscriptionStatus.data.subscription.currentPeriodEnd)
                .toBeGreaterThan(Date.now());
        });
    });
    describe('RFID Workflow Integration Tests', () => {
        it('should handle complete RFID reader setup and verification workflow', async () => {
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: 'school-123'
            });
            const readerData = {
                readerId: 'reader-main-entrance',
                location: 'Main Entrance - Cafeteria',
                schoolId: 'school-123',
                config: {
                    frequency: '125kHz',
                    range: '10cm',
                    mode: 'continuous'
                }
            };
            const readerSetup = await rfidService.registerReader(readerData);
            expect(readerSetup.success).toBe(true);
            expect(readerSetup.data.isOnline).toBe(true);
            const students = Array.from({ length: 10 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `student-${index + 1}`,
                schoolId: 'school-123',
                grade: `${Math.floor(index / 2) + 8}A`
            }));
            const cardCreationPromises = students.map((student, index) => rfidService.createCard({
                cardNumber: `A1B2C3D4E${(index + 10).toString(16).toUpperCase()}`,
                studentId: student.id,
                schoolId: student.schoolId,
                cardType: 'student',
                metadata: {
                    grade: student.grade,
                    issueDate: new Date()
                }
            }));
            const cardCreationResults = await Promise.all(cardCreationPromises);
            expect(cardCreationResults.every(result => result.success)).toBe(true);
            const cardIds = cardCreationResults.map(result => result.data.id);
            const activationPromises = cardIds.map(cardId => rfidService.activateCard(cardId));
            const activationResults = await Promise.all(activationPromises);
            expect(activationResults.every(result => result.success)).toBe(true);
            const orders = await Promise.all(students.map(student => paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: Math.random() * 200 + 50,
                schoolId: student.schoolId,
                status: 'confirmed'
            })));
            expect(orders.every(order => order.success)).toBe(true);
            const verificationPromises = orders.map((order, index) => rfidService.verifyDelivery({
                cardNumber: `A1B2C3D4E${(index + 10).toString(16).toUpperCase()}`,
                readerId: readerData.readerId,
                orderId: order.data.order.id,
                timestamp: new Date(Date.now() + index * 1000),
                location: readerData.location
            }));
            const verificationResults = await Promise.all(verificationPromises);
            expect(verificationResults.every(result => result.success)).toBe(true);
            const deliveryAnalytics = await rfidService.getDeliveryAnalytics({
                schoolId: 'school-123',
                dateRange: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(deliveryAnalytics.success).toBe(true);
            expect(deliveryAnalytics.data.totalDeliveries).toBe(10);
            expect(deliveryAnalytics.data.successfulDeliveries).toBe(10);
            expect(deliveryAnalytics.data.deliveryRate).toBe(100);
            expect(deliveryAnalytics.data.locationBreakdown).toHaveProperty(readerData.location, 10);
            const cardUsageStats = await rfidService.getCardUsageStats({
                schoolId: 'school-123'
            });
            expect(cardUsageStats.success).toBe(true);
            expect(cardUsageStats.data.totalCards).toBe(10);
            expect(cardUsageStats.data.activeCards).toBe(10);
            expect(cardUsageStats.data.totalScans).toBe(10);
            expect(cardUsageStats.data.averageScansPerCard).toBe(1);
            const fraudDetection = await rfidService.detectAnomalousActivity({
                timeWindow: 3600,
                minTimeBetweenScans: 300,
                schoolId: 'school-123'
            });
            expect(fraudDetection.success).toBe(true);
            expect(fraudDetection.data.rapidScans).toHaveLength(0);
            expect(fraudDetection.data.suspiciousPatterns).toHaveLength(0);
        });
        it('should handle RFID system failure and recovery', async () => {
            const student = test_helpers_1.TestDataFactory.user.student();
            const card = await rfidService.createCard({
                cardNumber: 'FAILURE123TEST',
                studentId: student.id,
                schoolId: student.schoolId,
                cardType: 'student'
            });
            await rfidService.activateCard(card.data.id);
            const order = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                status: 'confirmed'
            });
            const reader = await rfidService.registerReader({
                readerId: 'failure-test-reader',
                location: 'Test Location',
                schoolId: student.schoolId
            });
            await rfidService.updateReaderStatus(reader.data.id, {
                isOnline: false,
                lastHeartbeat: new Date(Date.now() - 10 * 60 * 1000)
            });
            const failedVerification = await rfidService.verifyDelivery({
                cardNumber: 'FAILURE123TEST',
                readerId: 'failure-test-reader',
                orderId: order.data.order.id
            });
            expect(failedVerification.success).toBe(false);
            expect(failedVerification.error).toMatch(/reader.*offline/i);
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: student.schoolId
            });
            const manualDelivery = await rfidService.manualDeliveryVerification({
                orderId: order.data.order.id,
                studentId: student.id,
                reason: 'RFID reader malfunction',
                verifiedBy: 'admin-1',
                timestamp: new Date()
            }, adminToken);
            expect(manualDelivery.success).toBe(true);
            expect(manualDelivery.data.verificationMethod).toBe('manual');
            await rfidService.updateReaderStatus(reader.data.id, {
                isOnline: true,
                lastHeartbeat: new Date()
            });
            const systemHealthCheck = await rfidService.getSystemHealth({
                schoolId: student.schoolId
            });
            expect(systemHealthCheck.success).toBe(true);
            expect(systemHealthCheck.data.readersOnline).toBe(1);
            expect(systemHealthCheck.data.systemStatus).toBe('operational');
            const incidentReport = await rfidService.generateIncidentReport({
                schoolId: student.schoolId,
                dateRange: {
                    start: new Date(Date.now() - 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(incidentReport.success).toBe(true);
            expect(incidentReport.data.incidents).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'READER_OFFLINE',
                    readerId: 'failure-test-reader'
                }),
                expect.objectContaining({
                    type: 'MANUAL_VERIFICATION',
                    orderId: order.data.order.id
                })
            ]));
        });
    });
    describe('Cross-Epic Integration Scenarios', () => {
        it('should handle meal plan changes affecting orders and payments', async () => {
            const student = test_helpers_1.TestDataFactory.user.student();
            const subscription = test_helpers_1.TestDataFactory.subscription({
                userId: student.id,
                status: 'active',
                planType: 'vegetarian'
            });
            const studentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: student.id,
                role: 'student'
            });
            const dietaryUpdate = await authService.updateDietaryPreferences(student.id, {
                restrictions: ['vegetarian', 'gluten_free'],
                allergies: ['nuts']
            }, studentToken);
            expect(dietaryUpdate.success).toBe(true);
            const updatedMenu = await menuService.getPersonalizedMenu({
                userId: student.id,
                schoolId: student.schoolId,
                dietaryRestrictions: ['vegetarian', 'gluten_free'],
                allergies: ['nuts']
            });
            expect(updatedMenu.success).toBe(true);
            expect(updatedMenu.data.every(item => item.isVegetarian &&
                item.isGlutenFree &&
                !item.allergens.includes('nuts'))).toBe(true);
            const existingOrder = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem({ allergens: ['nuts'] })],
                totalAmount: 100
            });
            const orderValidation = await paymentService.validateOrderAgainstDietary(existingOrder.data.order.id, student.id);
            expect(orderValidation.success).toBe(false);
            expect(orderValidation.data.conflicts).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'ALLERGEN_CONFLICT',
                    allergen: 'nuts'
                })
            ]));
            const alternatives = await menuService.suggestAlternatives({
                originalItems: existingOrder.data.order.items,
                dietaryRestrictions: ['vegetarian', 'gluten_free'],
                allergies: ['nuts'],
                priceRange: { min: 0, max: 150 }
            });
            expect(alternatives.success).toBe(true);
            expect(alternatives.data.suggestions.length).toBeGreaterThan(0);
            const updatedOrderItems = alternatives.data.suggestions.slice(0, 2);
            const orderUpdate = await paymentService.updateOrderItems(existingOrder.data.order.id, updatedOrderItems, studentToken);
            expect(orderUpdate.success).toBe(true);
            expect(orderUpdate.data.order.items.every(item => !item.allergens.includes('nuts'))).toBe(true);
        });
        it('should handle school policy changes affecting all operations', async () => {
            const schoolId = 'school-policy-test';
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const policyUpdate = await authService.updateSchoolPolicies({
                schoolId: schoolId,
                policies: {
                    maxOrderValue: 200,
                    allowedPaymentMethods: ['card', 'wallet'],
                    mealOrderingCutoff: '10:00',
                    mandatoryNutritionalInfo: true,
                    maxDailyOrders: 3
                }
            }, adminToken);
            expect(policyUpdate.success).toBe(true);
            const menuUpdate = await menuService.updateMenuForPolicyCompliance({
                schoolId: schoolId,
                policies: policyUpdate.data.policies
            });
            expect(menuUpdate.success).toBe(true);
            expect(menuUpdate.data.updatedItems).toBeGreaterThan(0);
            const student = test_helpers_1.TestDataFactory.user.student({ schoolId: schoolId });
            const studentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: student.id,
                role: 'student'
            });
            const overLimitOrder = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem({ price: 250 })],
                totalAmount: 250,
                schoolId: schoolId
            });
            expect(overLimitOrder.success).toBe(false);
            expect(overLimitOrder.error).toMatch(/exceeds.*maximum.*order.*value/i);
            const validOrder = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem({ price: 150 })],
                totalAmount: 150,
                schoolId: schoolId
            });
            expect(validOrder.success).toBe(true);
            const rfidPolicyUpdate = await rfidService.updateVerificationPolicies({
                schoolId: schoolId,
                policies: {
                    requirePhotoVerification: true,
                    maxVerificationAttempts: 3,
                    timeoutBetweenAttempts: 300
                }
            });
            expect(rfidPolicyUpdate.success).toBe(true);
            const systemSync = await authService.synchronizeSchoolSystems(schoolId, adminToken);
            expect(systemSync.success).toBe(true);
            expect(systemSync.data.synchronizedServices).toEqual(expect.arrayContaining([
                'menu_service',
                'payment_service',
                'rfid_service',
                'notification_service'
            ]));
        });
    });
    describe('Performance and Load Testing Scenarios', () => {
        it('should handle concurrent user registrations during peak hours', async () => {
            const registrationData = Array.from({ length: 50 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                email: `student${index + 1}@school.com`,
                password: 'Password123!',
                schoolId: 'school-load-test',
                grade: `${Math.floor(index / 10) + 9}${['A', 'B', 'C', 'D', 'E'][index % 5]}`
            }));
            const startTime = Date.now();
            const registrationPromises = registrationData.map(data => authService.registerStudent(data));
            const results = await Promise.all(registrationPromises);
            const endTime = Date.now();
            const duration = endTime - startTime;
            expect(results.every(result => result.success)).toBe(true);
            expect(duration).toBeLessThan(10000);
            expect(results.length).toBe(50);
            const userIds = results.map(result => result.data.user.id);
            const uniqueUserIds = new Set(userIds);
            expect(uniqueUserIds.size).toBe(50);
            const loginPromises = registrationData.map((data, index) => authService.login(data.email, data.password));
            const loginResults = await Promise.all(loginPromises);
            expect(loginResults.every(result => result.success)).toBe(true);
        });
        it('should handle simultaneous meal ordering across multiple schools', async () => {
            const schools = ['school-alpha', 'school-beta', 'school-gamma'];
            const studentsPerSchool = 20;
            const allStudents = schools.flatMap(schoolId => Array.from({ length: studentsPerSchool }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `${schoolId}-student-${index + 1}`,
                schoolId: schoolId,
                email: `student${index + 1}@${schoolId}.com`
            })));
            const userCreationPromises = allStudents.map(student => authService.registerStudent(student));
            const userResults = await Promise.all(userCreationPromises);
            expect(userResults.every(result => result.success)).toBe(true);
            const menuSetupPromises = schools.map(schoolId => menuService.setupDailyMenu({
                schoolId: schoolId,
                date: new Date(),
                items: Array.from({ length: 15 }, () => test_helpers_1.TestDataFactory.menuItem())
            }));
            const menuResults = await Promise.all(menuSetupPromises);
            expect(menuResults.every(result => result.success)).toBe(true);
            const startTime = Date.now();
            const orderPromises = allStudents.map(student => {
                const token = test_helpers_1.AuthTestHelper.generateValidToken({
                    userId: student.id,
                    role: 'student'
                });
                return paymentService.createOrder({
                    userId: student.id,
                    items: [test_helpers_1.TestDataFactory.orderItem()],
                    totalAmount: Math.random() * 100 + 50,
                    schoolId: student.schoolId
                });
            });
            const orderResults = await Promise.all(orderPromises);
            const orderTime = Date.now() - startTime;
            expect(orderResults.every(result => result.success)).toBe(true);
            expect(orderTime).toBeLessThan(15000);
            expect(orderResults.length).toBe(60);
            const paymentStartTime = Date.now();
            const paymentPromises = orderResults.map(orderResult => paymentService.processPayment({
                orderId: orderResult.data.order.id,
                amount: orderResult.data.order.totalAmount,
                currency: 'INR',
                method: 'razorpay',
                razorpayPaymentId: `pay_test_${orderResult.data.order.id}`,
                razorpayOrderId: `order_test_${orderResult.data.order.id}`,
                razorpaySignature: 'test_signature'
            }));
            const paymentResults = await Promise.all(paymentPromises);
            const paymentTime = Date.now() - paymentStartTime;
            expect(paymentResults.every(result => result.success)).toBe(true);
            expect(paymentTime).toBeLessThan(20000);
            const analyticsPromises = schools.map(schoolId => paymentService.getSchoolOrderAnalytics({
                schoolId: schoolId,
                dateRange: {
                    start: new Date(Date.now() - 60 * 60 * 1000),
                    end: new Date()
                }
            }));
            const analyticsResults = await Promise.all(analyticsPromises);
            expect(analyticsResults.every(result => result.success)).toBe(true);
            analyticsResults.forEach((analytics, index) => {
                expect(analytics.data.totalOrders).toBe(studentsPerSchool);
                expect(analytics.data.totalRevenue).toBeGreaterThan(0);
                expect(analytics.data.averageOrderValue).toBeGreaterThan(0);
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle payment failures gracefully', async () => {
            const student = test_helpers_1.TestDataFactory.user.student();
            const order = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: student.schoolId
            });
            const failedPayment = await paymentService.processPayment({
                orderId: order.data.order.id,
                amount: order.data.order.totalAmount,
                currency: 'INR',
                method: 'razorpay',
                razorpayPaymentId: 'pay_fail_test',
                razorpayOrderId: 'order_fail_test',
                razorpaySignature: 'invalid_signature'
            });
            expect(failedPayment.success).toBe(false);
            expect(failedPayment.error).toMatch(/payment.*failed|signature.*invalid/i);
            const orderStatus = await paymentService.getOrderStatus(order.data.order.id);
            expect(orderStatus.success).toBe(true);
            expect(orderStatus.data.order.paymentStatus).toBe('failed');
            expect(orderStatus.data.order.status).toBe('payment_failed');
            const notifications = await notificationService.getUserNotifications(student.id);
            expect(notifications.success).toBe(true);
            expect(notifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'PAYMENT_FAILED',
                    userId: student.id
                })
            ]));
            const retryPayment = await paymentService.retryPayment({
                orderId: order.data.order.id,
                paymentMethod: 'card',
                razorpayPaymentId: 'pay_retry_success',
                razorpayOrderId: 'order_retry_success',
                razorpaySignature: 'valid_signature'
            });
            expect(retryPayment.success).toBe(true);
            expect(retryPayment.data.payment.status).toBe('completed');
            const finalOrderStatus = await paymentService.getOrderStatus(order.data.order.id);
            expect(finalOrderStatus.success).toBe(true);
            expect(finalOrderStatus.data.order.paymentStatus).toBe('completed');
            expect(finalOrderStatus.data.order.status).toBe('confirmed');
        });
        it('should handle network timeouts and service unavailability', async () => {
            const student = test_helpers_1.TestDataFactory.user.student();
            const studentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: student.id,
                role: 'student'
            });
            const menuTimeout = await menuService.getAvailableMenu({
                schoolId: student.schoolId,
                timeout: 1
            });
            expect(menuTimeout.success).toBe(false);
            expect(menuTimeout.error).toMatch(/timeout|unavailable/i);
            const cachedMenu = await menuService.getCachedMenu({
                schoolId: student.schoolId
            });
            expect(cachedMenu.success).toBe(true);
            expect(cachedMenu.data.length).toBeGreaterThan(0);
            expect(cachedMenu.data[0].metadata?.isCached).toBe(true);
            const orderWithCache = await paymentService.createOrder({
                userId: student.id,
                items: [{
                        menuItemId: cachedMenu.data[0].id,
                        quantity: 1,
                        price: cachedMenu.data[0].price
                    }],
                totalAmount: cachedMenu.data[0].price,
                schoolId: student.schoolId,
                usingCachedData: true
            });
            expect(orderWithCache.success).toBe(true);
            expect(orderWithCache.data.order.metadata.usingCachedMenu).toBe(true);
            const serviceRecovery = await menuService.checkServiceHealth({
                schoolId: student.schoolId,
                attemptRecovery: true
            });
            expect(serviceRecovery.success).toBe(true);
            expect(serviceRecovery.data.isHealthy).toBe(true);
            const freshMenu = await menuService.getAvailableMenu({
                schoolId: student.schoolId,
                forceRefresh: true
            });
            expect(freshMenu.success).toBe(true);
            expect(freshMenu.data[0].metadata?.isCached).toBe(false);
        });
        it('should handle data consistency across service boundaries', async () => {
            const student = test_helpers_1.TestDataFactory.user.student();
            const parent = test_helpers_1.TestDataFactory.user.parent();
            await authService.linkStudentToParent(student.id, parent.id);
            const parentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: parent.id,
                role: 'parent'
            });
            const budgetPromise = paymentService.setStudentBudget({
                studentId: student.id,
                monthlyBudget: 1000,
                dailyLimit: 50
            }, parentToken);
            const orderPromise = paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem({ price: 75 })],
                totalAmount: 75,
                schoolId: student.schoolId
            });
            const [budgetResult, orderResult] = await Promise.all([budgetPromise, orderPromise]);
            if (budgetResult.success && orderResult.success) {
                expect(orderResult.data.order.requiresApproval).toBe(true);
                expect(orderResult.data.order.approvalReason).toMatch(/exceeds.*daily.*limit/i);
            }
            else {
                expect(orderResult.success).toBe(false);
                expect(orderResult.error).toMatch(/budget.*limit.*exceeded/i);
            }
            if (orderResult.data.order?.requiresApproval) {
                const approvalResult = await paymentService.approveOrder(orderResult.data.order.id, parentToken);
                expect(approvalResult.success).toBe(true);
            }
            const budgetUsage = await paymentService.getBudgetUsage({
                studentId: student.id,
                period: 'daily'
            });
            expect(budgetUsage.success).toBe(true);
            expect(budgetUsage.data.usedAmount).toBeLessThanOrEqual(budgetUsage.data.totalBudget);
            const dataIntegrityCheck = await authService.verifyDataIntegrity({
                userId: student.id,
                checkServices: ['payment', 'orders', 'budget', 'notifications']
            });
            expect(dataIntegrityCheck.success).toBe(true);
            expect(dataIntegrityCheck.data.inconsistencies).toHaveLength(0);
        });
    });
    describe('Real-World Scenario Simulations', () => {
        it('should handle typical lunch rush hour scenario', async () => {
            const schoolId = 'lunch-rush-school';
            const studentCount = 100;
            const readerCount = 3;
            const students = Array.from({ length: studentCount }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `rush-student-${index + 1}`,
                schoolId: schoolId,
                grade: `${Math.floor(index / 20) + 9}${['A', 'B', 'C', 'D'][index % 4]}`
            }));
            const readers = Array.from({ length: readerCount }, (_, index) => ({
                readerId: `rush-reader-${index + 1}`,
                location: `Cafeteria Station ${index + 1}`,
                schoolId: schoolId
            }));
            const readerSetupPromises = readers.map(reader => rfidService.registerReader(reader));
            const readerResults = await Promise.all(readerSetupPromises);
            expect(readerResults.every(result => result.success)).toBe(true);
            const cardPromises = students.map((student, index) => rfidService.createCard({
                cardNumber: `RUSH${index.toString().padStart(3, '0')}`,
                studentId: student.id,
                schoolId: schoolId,
                cardType: 'student'
            }).then(result => rfidService.activateCard(result.data.id)));
            const cardResults = await Promise.all(cardPromises);
            expect(cardResults.every(result => result.success)).toBe(true);
            const popularItems = Array.from({ length: 5 }, () => test_helpers_1.TestDataFactory.menuItem({ popularity: 'high' }));
            const menuSetup = await menuService.setupDailyMenu({
                schoolId: schoolId,
                date: new Date(),
                items: popularItems
            });
            expect(menuSetup.success).toBe(true);
            const rushStartTime = Date.now();
            const orderPromises = students.map((student, index) => {
                const orderTime = rushStartTime + (index * 600);
                return new Promise(resolve => {
                    setTimeout(async () => {
                        const result = await paymentService.createOrder({
                            userId: student.id,
                            items: [
                                {
                                    menuItemId: popularItems[index % popularItems.length].id,
                                    quantity: Math.floor(Math.random() * 2) + 1,
                                    price: popularItems[index % popularItems.length].price
                                }
                            ],
                            totalAmount: popularItems[index % popularItems.length].price,
                            schoolId: schoolId,
                            orderTime: new Date(orderTime)
                        });
                        resolve(result);
                    }, index * 100);
                });
            });
            const orderResults = await Promise.all(orderPromises);
            const orderingDuration = Date.now() - rushStartTime;
            expect(orderResults.filter((result) => result.success).length).toBeGreaterThan(90);
            expect(orderingDuration).toBeLessThan(70000);
            const successfulOrders = orderResults
                .filter((result) => result.success)
                .slice(0, 80);
            const verificationPromises = successfulOrders.map((orderResult, index) => {
                const readerIndex = index % readerCount;
                return rfidService.verifyDelivery({
                    cardNumber: `RUSH${index.toString().padStart(3, '0')}`,
                    readerId: `rush-reader-${readerIndex + 1}`,
                    orderId: orderResult.data.order.id,
                    timestamp: new Date(Date.now() + index * 500),
                    location: `Cafeteria Station ${readerIndex + 1}`
                });
            });
            const verificationResults = await Promise.all(verificationPromises);
            const verificationSuccessRate = verificationResults.filter(result => result.success).length / verificationResults.length;
            expect(verificationSuccessRate).toBeGreaterThan(0.95);
            const loadAnalytics = await rfidService.getReaderLoadAnalytics({
                schoolId: schoolId,
                dateRange: {
                    start: new Date(rushStartTime),
                    end: new Date()
                }
            });
            expect(loadAnalytics.success).toBe(true);
            expect(loadAnalytics.data.totalVerifications).toBeGreaterThanOrEqual(80);
            const readerLoads = Object.values(loadAnalytics.data.readerBreakdown);
            const avgLoad = readerLoads.reduce((sum, load) => sum + load, 0) / readerLoads.length;
            const maxDeviation = Math.max(...readerLoads.map((load) => Math.abs(load - avgLoad)));
            expect(maxDeviation).toBeLessThan(avgLoad * 0.5);
        });
        it('should handle complete system maintenance scenario', async () => {
            const schoolId = 'maintenance-test-school';
            const students = Array.from({ length: 10 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `maint-student-${index + 1}`,
                schoolId: schoolId
            }));
            const activeOrders = await Promise.all(students.map(student => paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: schoolId,
                status: 'preparing'
            })));
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const maintenanceSchedule = await authService.scheduleMaintenanceWindow({
                schoolId: schoolId,
                startTime: new Date(Date.now() + 5 * 60 * 1000),
                duration: 30 * 60 * 1000,
                affectedServices: ['payment', 'rfid', 'menu'],
                notifyUsers: true
            }, adminToken);
            expect(maintenanceSchedule.success).toBe(true);
            const maintenanceNotifications = await Promise.all(students.map(student => notificationService.getUserNotifications(student.id)));
            maintenanceNotifications.forEach((notification, index) => {
                expect(notification.success).toBe(true);
                expect(notification.data).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        type: 'MAINTENANCE_SCHEDULED',
                        userId: students[index].id
                    })
                ]));
            });
            const serviceStatus = await authService.getSystemStatus(schoolId);
            expect(serviceStatus.success).toBe(true);
            expect(serviceStatus.data.mode).toBe('maintenance_scheduled');
            const orderCompletionPromises = activeOrders.map(orderResult => paymentService.expediteOrderCompletion(orderResult.data.order.id, {
                reason: 'scheduled_maintenance',
                priority: 'high'
            }));
            const completionResults = await Promise.all(orderCompletionPromises);
            expect(completionResults.every(result => result.success)).toBe(true);
            const maintenanceMode = await authService.enterMaintenanceMode(schoolId, adminToken);
            expect(maintenanceMode.success).toBe(true);
            const readOnlyTest = await paymentService.createOrder({
                userId: students[0].id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: schoolId
            });
            expect(readOnlyTest.success).toBe(false);
            expect(readOnlyTest.error).toMatch(/maintenance.*mode|service.*unavailable/i);
            const exitMaintenance = await authService.exitMaintenanceMode(schoolId, adminToken);
            expect(exitMaintenance.success).toBe(true);
            const postMaintenanceOrder = await paymentService.createOrder({
                userId: students[0].id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: schoolId
            });
            expect(postMaintenanceOrder.success).toBe(true);
            const finalHealthCheck = await authService.getSystemStatus(schoolId);
            expect(finalHealthCheck.success).toBe(true);
            expect(finalHealthCheck.data.mode).toBe('operational');
            expect(finalHealthCheck.data.allServicesHealthy).toBe(true);
        });
    });
    describe('Multi-User Concurrency Tests', () => {
        it('should handle concurrent operations on shared resources', async () => {
            const schoolId = 'concurrency-test-school';
            const limitedItem = test_helpers_1.TestDataFactory.menuItem({
                id: 'limited-item-123',
                name: 'Special Limited Lunch',
                price: 150,
                availableQuantity: 5
            });
            await menuService.addMenuItem(schoolId, limitedItem);
            const students = Array.from({ length: 10 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `concurrent-student-${index + 1}`,
                schoolId: schoolId
            }));
            const orderPromises = students.map(student => paymentService.createOrder({
                userId: student.id,
                items: [{
                        menuItemId: limitedItem.id,
                        quantity: 1,
                        price: limitedItem.price
                    }],
                totalAmount: limitedItem.price,
                schoolId: schoolId
            }));
            const orderResults = await Promise.all(orderPromises);
            const successfulOrders = orderResults.filter(result => result.success);
            const failedOrders = orderResults.filter(result => !result.success);
            expect(successfulOrders.length).toBe(5);
            expect(failedOrders.length).toBe(5);
            failedOrders.forEach(failedOrder => {
                expect(failedOrder.error).toMatch(/insufficient.*inventory|item.*unavailable/i);
            });
            const itemAvailability = await menuService.getItemAvailability(limitedItem.id);
            expect(itemAvailability.success).toBe(true);
            expect(itemAvailability.data.availableQuantity).toBe(0);
            expect(itemAvailability.data.reservedQuantity).toBe(5);
            const paymentPromises = successfulOrders.map(orderResult => paymentService.processPayment({
                orderId: orderResult.data.order.id,
                amount: orderResult.data.order.totalAmount,
                currency: 'INR',
                method: 'razorpay',
                razorpayPaymentId: `pay_concurrent_${orderResult.data.order.id}`,
                razorpayOrderId: `order_concurrent_${orderResult.data.order.id}`,
                razorpaySignature: 'test_signature'
            }));
            const paymentResults = await Promise.all(paymentPromises);
            expect(paymentResults.every(result => result.success)).toBe(true);
            const waitlistPromises = failedOrders.map((failedOrder, index) => menuService.addToWaitlist({
                userId: students[successfulOrders.length + index].id,
                menuItemId: limitedItem.id,
                schoolId: schoolId,
                priority: 'normal'
            }));
            const waitlistResults = await Promise.all(waitlistPromises);
            expect(waitlistResults.every(result => result.success)).toBe(true);
            const cancellationResult = await paymentService.cancelOrder(successfulOrders[0].data.order.id, 'Changed mind');
            expect(cancellationResult.success).toBe(true);
            const waitlistPromotion = await menuService.processWaitlistPromotion(limitedItem.id, schoolId);
            expect(waitlistPromotion.success).toBe(true);
            expect(waitlistPromotion.data.promotedUsers.length).toBe(1);
            const promotedUserId = waitlistPromotion.data.promotedUsers[0].userId;
            const promotionNotifications = await notificationService.getUserNotifications(promotedUserId);
            expect(promotionNotifications.success).toBe(true);
            expect(promotionNotifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'WAITLIST_PROMOTED',
                    userId: promotedUserId
                })
            ]));
        });
        it('should handle emergency situations and system alerts', async () => {
            const schoolId = 'emergency-test-school';
            const students = Array.from({ length: 5 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `emergency-student-${index + 1}`,
                schoolId: schoolId
            }));
            const activeOrders = await Promise.all(students.map(student => paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: schoolId,
                status: 'confirmed'
            })));
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const safetyAlert = await authService.triggerEmergencyAlert({
                schoolId: schoolId,
                alertType: 'FOOD_SAFETY',
                severity: 'HIGH',
                message: 'Potential contamination detected in kitchen',
                affectedMenuItems: [activeOrders[0].data.order.items[0].menuItemId],
                immediateAction: 'STOP_PREPARATION'
            }, adminToken);
            expect(safetyAlert.success).toBe(true);
            const affectedOrderChecks = await Promise.all(activeOrders.map(orderResult => paymentService.getOrderStatus(orderResult.data.order.id)));
            const affectedOrders = affectedOrderChecks.filter(status => status.data.order.items.some(item => item.menuItemId === activeOrders[0].data.order.items[0].menuItemId));
            affectedOrders.forEach(orderStatus => {
                expect(orderStatus.data.order.status).toBe('cancelled');
                expect(orderStatus.data.order.cancellationReason).toMatch(/safety.*alert|emergency/i);
            });
            const refundPromises = affectedOrders.map(orderStatus => paymentService.processEmergencyRefund(orderStatus.data.order.id, {
                reason: 'FOOD_SAFETY_ALERT',
                fullRefund: true,
                expedited: true
            }));
            const refundResults = await Promise.all(refundPromises);
            expect(refundResults.every(result => result.success)).toBe(true);
            const emergencyNotificationChecks = await Promise.all(students.map(student => notificationService.getUserNotifications(student.id)));
            emergencyNotificationChecks.forEach(notifications => {
                expect(notifications.success).toBe(true);
                expect(notifications.data).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        type: 'EMERGENCY_ALERT',
                        severity: 'HIGH'
                    })
                ]));
            });
            const systemStatus = await authService.getSystemStatus(schoolId);
            expect(systemStatus.success).toBe(true);
            expect(systemStatus.data.mode).toBe('emergency');
            expect(systemStatus.data.activeAlerts).toHaveLength(1);
            const menuStatus = await menuService.getMenuStatus(schoolId);
            expect(menuStatus.success).toBe(true);
            expect(menuStatus.data.quarantinedItems).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: activeOrders[0].data.order.items[0].menuItemId,
                    quarantineReason: 'FOOD_SAFETY_ALERT'
                })
            ]));
            const alertResolution = await authService.resolveEmergencyAlert({
                schoolId: schoolId,
                alertId: safetyAlert.data.alertId,
                resolution: 'Contamination source identified and removed',
                verifiedBy: 'admin-1',
                safetyChecksPassed: true
            }, adminToken);
            expect(alertResolution.success).toBe(true);
            const recoveryStatus = await authService.getSystemStatus(schoolId);
            expect(recoveryStatus.success).toBe(true);
            expect(recoveryStatus.data.mode).toBe('operational');
            expect(recoveryStatus.data.activeAlerts).toHaveLength(0);
            const resolutionNotificationChecks = await Promise.all(students.map(student => notificationService.getUserNotifications(student.id)));
            resolutionNotificationChecks.forEach((notifications, index) => {
                expect(notifications.data).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        type: 'EMERGENCY_RESOLVED',
                        userId: students[index].id
                    })
                ]));
            });
        });
    });
    describe('Integration with External Systems', () => {
        it('should handle WhatsApp notification delivery verification', async () => {
            const student = test_helpers_1.TestDataFactory.user.student({
                phoneNumber: '+919876543210',
                preferences: {
                    notificationMethods: ['whatsapp', 'email']
                }
            });
            const order = await paymentService.createOrder({
                userId: student.id,
                items: [test_helpers_1.TestDataFactory.orderItem()],
                totalAmount: 100,
                schoolId: student.schoolId
            });
            const payment = await paymentService.processPayment({
                orderId: order.data.order.id,
                amount: 100,
                currency: 'INR',
                method: 'razorpay',
                razorpayPaymentId: 'pay_whatsapp_test',
                razorpayOrderId: 'order_whatsapp_test',
                razorpaySignature: 'test_signature'
            });
            expect(payment.success).toBe(true);
            const whatsappNotification = await notificationService.sendWhatsAppNotification({
                phoneNumber: student.phoneNumber,
                templateName: 'order_confirmation',
                templateData: {
                    orderId: order.data.order.id,
                    totalAmount: order.data.order.totalAmount,
                    deliveryTime: '12:30 PM'
                }
            });
            expect(whatsappNotification.success).toBe(true);
            expect(whatsappNotification.data.messageId).toBeDefined();
            const deliveryWebhook = await notificationService.handleWhatsAppWebhook({
                messageId: whatsappNotification.data.messageId,
                status: 'delivered',
                timestamp: new Date(),
                recipientPhone: student.phoneNumber
            });
            expect(deliveryWebhook.success).toBe(true);
            const notificationLog = await notificationService.getNotificationLog({
                userId: student.id,
                type: 'whatsapp'
            });
            expect(notificationLog.success).toBe(true);
            expect(notificationLog.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    messageId: whatsappNotification.data.messageId,
                    deliveryStatus: 'delivered',
                    channel: 'whatsapp'
                })
            ]));
            const failedNotification = await notificationService.sendWhatsAppNotification({
                phoneNumber: '+919999999999',
                templateName: 'order_confirmation',
                templateData: {
                    orderId: 'test-order-456',
                    totalAmount: 100
                }
            });
            expect(failedNotification.success).toBe(false);
            const emailFallback = await notificationService.getNotificationFallbacks({
                originalChannel: 'whatsapp',
                recipientId: student.id
            });
            expect(emailFallback.success).toBe(true);
            expect(emailFallback.data.fallbackChannel).toBe('email');
            expect(emailFallback.data.attemptsMade).toBeGreaterThan(0);
        });
        it('should handle integration with school management systems', async () => {
            const schoolId = 'integration-test-school';
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const studentSyncData = Array.from({ length: 25 }, (_, index) => ({
                admissionNumber: `ADM${2024}${(index + 1).toString().padStart(3, '0')}`,
                firstName: `Student${index + 1}`,
                lastName: 'TestUser',
                grade: `${Math.floor(index / 5) + 9}${['A', 'B', 'C', 'D', 'E'][index % 5]}`,
                parentContact: `+91987654${(index + 10).toString().padStart(4, '0')}`,
                emergencyContact: `+91876543${(index + 10).toString().padStart(4, '0')}`,
                dietaryRestrictions: index % 3 === 0 ? ['vegetarian'] : [],
                allergies: index % 5 === 0 ? ['nuts'] : []
            }));
            const syncResult = await authService.syncStudentsFromMIS({
                schoolId: schoolId,
                students: studentSyncData,
                syncMode: 'incremental'
            }, adminToken);
            expect(syncResult.success).toBe(true);
            expect(syncResult.data.studentsCreated).toBe(25);
            expect(syncResult.data.studentsUpdated).toBe(0);
            const cardGenerationResult = await rfidService.bulkGenerateCards({
                schoolId: schoolId,
                userType: 'student',
                autoActivate: true,
                cardPrefix: 'SYNC'
            });
            expect(cardGenerationResult.success).toBe(true);
            expect(cardGenerationResult.data.cardsGenerated).toBe(25);
            const mealPlanSetup = await paymentService.setupGradeBudgets({
                schoolId: schoolId,
                budgetRules: [
                    { grades: ['9A', '9B', '9C', '9D', '9E'], dailyBudget: 80 },
                    { grades: ['10A', '10B', '10C', '10D', '10E'], dailyBudget: 90 },
                    { grades: ['11A', '11B', '11C', '11D', '11E'], dailyBudget: 100 },
                    { grades: ['12A', '12B', '12C', '12D', '12E'], dailyBudget: 110 }
                ]
            }, adminToken);
            expect(mealPlanSetup.success).toBe(true);
            const parentGenerationResult = await authService.generateParentAccounts({
                schoolId: schoolId,
                sendInvitations: true,
                defaultPermissions: ['view_child_orders', 'approve_orders', 'set_budgets']
            }, adminToken);
            expect(parentGenerationResult.success).toBe(true);
            expect(parentGenerationResult.data.parentsGenerated).toBe(25);
            const integrationReport = await authService.generateIntegrationReport({
                schoolId: schoolId,
                includeMetrics: true
            });
            expect(integrationReport.success).toBe(true);
            expect(integrationReport.data).toMatchObject({
                studentsIntegrated: 25,
                parentsLinked: 25,
                cardsGenerated: 25,
                budgetsConfigured: 25,
                systemHealth: 'optimal'
            });
            const testStudent = syncResult.data.createdStudents[0];
            const studentToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: testStudent.id,
                role: 'student'
            });
            const gradeBasedOrder = await paymentService.createOrder({
                userId: testStudent.id,
                items: [test_helpers_1.TestDataFactory.orderItem({ price: 75 })],
                totalAmount: 75,
                schoolId: schoolId
            });
            expect(gradeBasedOrder.success).toBe(true);
            const parentNotifications = await notificationService.getUserNotifications(testStudent.parentId);
            expect(parentNotifications.success).toBe(true);
            expect(parentNotifications.data).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'CHILD_ORDER_PLACED',
                    relatedUserId: testStudent.id
                })
            ]));
        });
    });
    describe('Advanced Analytics and Reporting Integration', () => {
        it('should generate comprehensive school performance analytics', async () => {
            const schoolId = 'analytics-test-school';
            const students = Array.from({ length: 30 }, (_, index) => test_helpers_1.TestDataFactory.user.student({
                id: `analytics-student-${index + 1}`,
                schoolId: schoolId,
                grade: `${Math.floor(index / 6) + 9}${['A', 'B', 'C', 'D', 'E', 'F'][index % 6]}`
            }));
            const historicalOrderPromises = [];
            for (let day = 0; day < 30; day++) {
                const dayDate = new Date(Date.now() - (29 - day) * 24 * 60 * 60 * 1000);
                students.forEach((student, studentIndex) => {
                    const ordersPerDay = Math.floor(Math.random() * 3);
                    for (let orderNum = 0; orderNum < ordersPerDay; orderNum++) {
                        historicalOrderPromises.push(paymentService.createHistoricalOrder({
                            userId: student.id,
                            items: [test_helpers_1.TestDataFactory.orderItem()],
                            totalAmount: Math.random() * 150 + 50,
                            schoolId: schoolId,
                            orderDate: dayDate,
                            status: 'delivered'
                        }));
                    }
                });
            }
            const historicalOrders = await Promise.all(historicalOrderPromises);
            const successfulHistoricalOrders = historicalOrders.filter(result => result.success);
            expect(successfulHistoricalOrders.length).toBeGreaterThan(200);
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const analyticsReport = await paymentService.generateComprehensiveAnalytics({
                schoolId: schoolId,
                dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                },
                includeMetrics: [
                    'revenue',
                    'popular_items',
                    'student_behavior',
                    'payment_success_rate',
                    'order_frequency',
                    'grade_wise_analysis'
                ]
            }, adminToken);
            expect(analyticsReport.success).toBe(true);
            expect(analyticsReport.data).toMatchObject({
                revenue: expect.objectContaining({
                    totalRevenue: expect.any(Number),
                    dailyAverage: expect.any(Number),
                    monthlyGrowth: expect.any(Number)
                }),
                popularItems: expect.arrayContaining([
                    expect.objectContaining({
                        itemId: expect.any(String),
                        orderCount: expect.any(Number),
                        revenue: expect.any(Number)
                    })
                ]),
                studentBehavior: expect.objectContaining({
                    averageOrdersPerStudent: expect.any(Number),
                    averageOrderValue: expect.any(Number),
                    peakOrderingHours: expect.any(Array)
                })
            });
            const gradeAnalytics = await paymentService.getGradeWiseAnalytics({
                schoolId: schoolId,
                dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(gradeAnalytics.success).toBe(true);
            expect(gradeAnalytics.data.grades).toHaveLength(4);
            gradeAnalytics.data.grades.forEach(gradeData => {
                expect(gradeData).toMatchObject({
                    grade: expect.stringMatching(/^(9|10|11|12)[A-F]$/),
                    totalStudents: expect.any(Number),
                    activeStudents: expect.any(Number),
                    totalOrders: expect.any(Number),
                    totalRevenue: expect.any(Number),
                    averageOrderValue: expect.any(Number)
                });
            });
            const demandForecast = await menuService.generateDemandForecast({
                schoolId: schoolId,
                forecastPeriod: 7,
                basedOnHistoricalDays: 30
            });
            expect(demandForecast.success).toBe(true);
            expect(demandForecast.data.forecastDays).toHaveLength(7);
            demandForecast.data.forecastDays.forEach(dayForecast => {
                expect(dayForecast).toMatchObject({
                    date: expect.any(String),
                    expectedOrders: expect.any(Number),
                    popularItems: expect.any(Array),
                    recommendedInventory: expect.any(Object)
                });
            });
            const financialAnalytics = await paymentService.getFinancialAnalytics({
                schoolId: schoolId,
                period: 'monthly',
                includeProjections: true
            });
            expect(financialAnalytics.success).toBe(true);
            expect(financialAnalytics.data).toMatchObject({
                currentMonth: expect.objectContaining({
                    revenue: expect.any(Number),
                    orderCount: expect.any(Number),
                    uniqueCustomers: expect.any(Number)
                }),
                projections: expect.objectContaining({
                    nextMonthRevenue: expect.any(Number),
                    growthRate: expect.any(Number)
                })
            });
            const analyticsExport = await paymentService.exportAnalyticsData({
                schoolId: schoolId,
                format: 'json',
                includePersonalData: false,
                dateRange: {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(analyticsExport.success).toBe(true);
            expect(analyticsExport.data.exportUrl).toBeDefined();
            expect(analyticsExport.data.expiresAt).toBeDefined();
            expect(analyticsExport.data.recordCount).toBeGreaterThan(0);
        });
    });
    describe('Security and Compliance Validation', () => {
        it('should enforce data privacy and GDPR compliance', async () => {
            const student = test_helpers_1.TestDataFactory.user.student({
                privacySettings: {
                    allowDataAnalytics: false,
                    allowMarketingCommunications: false,
                    dataRetentionPeriod: 365
                }
            });
            const personalDataAudit = await authService.auditPersonalDataUsage({
                userId: student.id,
                includeProcessingPurposes: true
            });
            expect(personalDataAudit.success).toBe(true);
            expect(personalDataAudit.data.dataCategories).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    category: 'PROFILE_DATA',
                    purpose: 'SERVICE_DELIVERY',
                    lawfulBasis: 'CONTRACT'
                })
            ]));
            const anonymizedData = await paymentService.getAnonymizedOrderData({
                schoolId: student.schoolId,
                excludeUserIds: [student.id],
                dateRange: {
                    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(anonymizedData.success).toBe(true);
            expect(anonymizedData.data.orders.every(order => order.userId === 'ANONYMIZED' || order.userId !== student.id)).toBe(true);
            const deletionRequest = await authService.requestDataDeletion({
                userId: student.id,
                deletionType: 'COMPLETE',
                retainTransactionRecords: true,
                reason: 'USER_REQUEST'
            });
            expect(deletionRequest.success).toBe(true);
            expect(deletionRequest.data.deletionScheduled).toBe(true);
            expect(deletionRequest.data.completionDate).toBeDefined();
            const restrictedAccess = await authService.getUserProfile(student.id);
            expect(restrictedAccess.success).toBe(false);
            expect(restrictedAccess.error).toMatch(/user.*deleted|access.*restricted/i);
            const complianceAudit = await authService.generateComplianceReport({
                schoolId: student.schoolId,
                auditType: 'GDPR',
                dateRange: {
                    start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            });
            expect(complianceAudit.success).toBe(true);
            expect(complianceAudit.data.deletionRequests).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    userId: student.id,
                    status: 'SCHEDULED'
                })
            ]));
        });
        it('should handle security incident detection and response', async () => {
            const schoolId = 'security-test-school';
            const legitimateStudent = test_helpers_1.TestDataFactory.user.student({
                id: 'legit-student-1',
                schoolId: schoolId
            });
            const suspiciousLoginAttempts = Array.from({ length: 10 }, (_, index) => authService.attemptLogin({
                email: legitimateStudent.email,
                password: 'WrongPassword123!',
                ipAddress: `192.168.1.${100 + index}`,
                userAgent: 'SuspiciousBot/1.0',
                timestamp: new Date(Date.now() + index * 1000)
            }));
            const loginResults = await Promise.all(suspiciousLoginAttempts);
            expect(loginResults.every(result => result.success === false)).toBe(true);
            const securityAlert = await authService.checkSecurityAlerts({
                schoolId: schoolId,
                alertTypes: ['BRUTE_FORCE', 'SUSPICIOUS_ACTIVITY']
            });
            expect(securityAlert.success).toBe(true);
            expect(securityAlert.data.activeAlerts).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    type: 'BRUTE_FORCE_DETECTED',
                    targetUserId: legitimateStudent.id
                })
            ]));
            const accountStatus = await authService.getUserSecurityStatus(legitimateStudent.id);
            expect(accountStatus.success).toBe(true);
            expect(accountStatus.data.isLocked).toBe(true);
            expect(accountStatus.data.lockReason).toBe('BRUTE_FORCE_PROTECTION');
            const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
                userId: 'admin-1',
                role: 'school_admin',
                schoolId: schoolId
            });
            const incidentInvestigation = await authService.investigateSecurityIncident({
                alertId: securityAlert.data.activeAlerts[0].id,
                includeIpAnalysis: true,
                includeBehaviorAnalysis: true
            }, adminToken);
            expect(incidentInvestigation.success).toBe(true);
            expect(incidentInvestigation.data.riskLevel).toMatch(/HIGH|MEDIUM/);
            const accountRecovery = await authService.initiateAccountRecovery({
                userId: legitimateStudent.id,
                recoveryMethod: 'EMAIL_VERIFICATION',
                adminOverride: false
            });
            expect(accountRecovery.success).toBe(true);
            expect(accountRecovery.data.recoveryToken).toBeDefined();
            const recoveryCompletion = await authService.completeAccountRecovery({
                recoveryToken: accountRecovery.data.recoveryToken,
                newPassword: 'NewSecurePassword123!',
                confirmIdentity: true
            });
            expect(recoveryCompletion.success).toBe(true);
            const enhancedSecurity = await authService.getUserSecurityStatus(legitimateStudent.id);
            expect(enhancedSecurity.success).toBe(true);
            expect(enhancedSecurity.data.isLocked).toBe(false);
            expect(enhancedSecurity.data.securityLevel).toBe('ENHANCED');
            expect(enhancedSecurity.data.requiresMFA).toBe(true);
            const incidentReport = await authService.generateSecurityIncidentReport({
                schoolId: schoolId,
                incidentId: securityAlert.data.activeAlerts[0].id,
                includeRemediation: true
            });
            expect(incidentReport.success).toBe(true);
            expect(incidentReport.data.incident).toMatchObject({
                type: 'BRUTE_FORCE_DETECTED',
                resolved: true,
                resolutionTime: expect.any(Number),
                impactAssessment: expect.any(String)
            });
        });
    });
});
exports.E2ETestHelpers = {
    async setupTestSchool(schoolId, services) {
        const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
            userId: 'setup-admin',
            role: 'school_admin',
            schoolId: schoolId
        });
        await services.authService.createSchoolConfig({
            schoolId: schoolId,
            settings: {
                timezone: 'Asia/Kolkata',
                currency: 'INR',
                academicYear: '2024-25',
                maxStudentsPerGrade: 50,
                enabledFeatures: ['meals', 'payments', 'rfid', 'analytics']
            }
        }, adminToken);
        await services.menuService.setupDailyMenu({
            schoolId: schoolId,
            date: new Date(),
            items: Array.from({ length: 20 }, () => test_helpers_1.TestDataFactory.menuItem())
        });
        await services.rfidService.registerReader({
            readerId: `${schoolId}-main-reader`,
            location: 'Main Cafeteria',
            schoolId: schoolId
        });
    },
    async cleanupTestSchool(schoolId, services) {
        const adminToken = test_helpers_1.AuthTestHelper.generateValidToken({
            userId: 'cleanup-admin',
            role: 'school_admin',
            schoolId: schoolId
        });
        await services.paymentService.cancelAllPendingOrders(schoolId, adminToken);
        await services.rfidService.deactivateAllCards(schoolId, adminToken);
        await services.menuService.clearDailyMenu(schoolId, adminToken);
        await services.authService.archiveSchoolData(schoolId, adminToken);
    },
    async waitForAsyncProcessing(timeout = 5000) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    },
    async verifySystemConsistency(schoolId, services) {
        const consistencyCheck = await services.authService.verifySystemConsistency({
            schoolId: schoolId,
            checkServices: ['auth', 'menu', 'payment', 'rfid', 'notification']
        });
        return consistencyCheck.success && consistencyCheck.data.isConsistent;
    }
};
//# sourceMappingURL=complete-user-journey.test.js.map