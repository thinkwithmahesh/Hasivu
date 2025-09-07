"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadTestDataGenerator = void 0;
class LoadTestDataGenerator {
    userIdPrefix = 'load-test-user-';
    orderIdPrefix = 'load-test-order-';
    paymentIdPrefix = 'load-test-payment-';
    schoolId = 'load-test-school-123';
    userCounter = 0;
    orderCounter = 0;
    paymentCounter = 0;
    constructor() {
        const randomOffset = Math.floor(Math.random() * 1000);
        this.userCounter = randomOffset;
        this.orderCounter = randomOffset;
        this.paymentCounter = randomOffset;
    }
    generateUsers(count) {
        return Array.from({ length: count }, () => this.generateUser());
    }
    generateUser() {
        const id = `${this.userIdPrefix}${++this.userCounter}`;
        const userNumber = this.userCounter;
        return {
            id,
            email: `loadtest${userNumber}@hasivu.com`,
            name: `Load Test User ${userNumber}`,
            role: this.getRandomRole(),
            phone: `+91-${9000000000 + userNumber}`,
            schoolId: this.schoolId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    generateOrders(count, users) {
        return Array.from({ length: count }, () => this.generateOrder(users));
    }
    generateOrder(users) {
        const orderId = `${this.orderIdPrefix}${++this.orderCounter}`;
        const userId = users?.length ?
            users[Math.floor(Math.random() * users.length)].id :
            `${this.userIdPrefix}${Math.floor(Math.random() * 100) + 1}`;
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const items = Array.from({ length: itemCount }, () => ({
            menuItemId: `menu-item-${Math.floor(Math.random() * 50) + 1}`,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.round((Math.random() * 100 + 20) * 100) / 100,
            totalPrice: 0
        }));
        items.forEach(item => {
            item.totalPrice = item.quantity * item.price;
        });
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        return {
            id: orderId,
            userId,
            parentId: `parent-of-${userId}`,
            schoolId: this.schoolId,
            items,
            totalAmount: Math.round(totalAmount * 100) / 100,
            currency: 'INR',
            status: this.getRandomOrderStatus(),
            deliveryDate: this.getRandomFutureDate(),
            deliverySlot: this.getRandomDeliverySlot(),
            paymentStatus: this.getRandomPaymentStatus(),
            paymentId: Math.random() > 0.3 ? `payment-${orderId}` : null,
            rfidVerified: Math.random() > 0.5,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    generatePaymentOrders(count, orders) {
        return Array.from({ length: count }, () => this.generatePaymentOrder(orders));
    }
    generatePaymentOrder(orders) {
        const paymentId = `${this.paymentIdPrefix}${++this.paymentCounter}`;
        const orderId = orders?.length ?
            orders[Math.floor(Math.random() * orders.length)].id :
            `${this.orderIdPrefix}${Math.floor(Math.random() * 100) + 1}`;
        const amount = Math.round((Math.random() * 500 + 50) * 100) / 100;
        const isCompleted = Math.random() > 0.2;
        const isFailed = !isCompleted && Math.random() > 0.7;
        return {
            id: paymentId,
            orderId,
            amount,
            currency: 'INR',
            status: isCompleted ? 'completed' : isFailed ? 'failed' : 'pending',
            gateway: 'razorpay',
            gatewayOrderId: `order_${paymentId.replace('-', '_')}`,
            gatewayPaymentId: isCompleted ? `pay_${paymentId.replace('-', '_')}` : null,
            metadata: {
                receipt: `receipt_${paymentId}`,
                notes: {
                    purpose: 'Load testing payment',
                    test: 'true'
                }
            },
            attempts: isFailed ? Math.floor(Math.random() * 3) + 1 : 1,
            maxAttempts: 3,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            completedAt: isCompleted ? new Date() : null,
            failureReason: isFailed ? this.getRandomFailureReason() : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    generateConcurrentUserScenarios(userCount) {
        const scenarios = [];
        for (let i = 0; i < userCount; i++) {
            scenarios.push({
                userId: `concurrent-user-${i + 1}`,
                actions: this.generateUserActionSequence(),
                timing: {
                    startDelay: Math.floor(Math.random() * 5000),
                    actionInterval: Math.floor(Math.random() * 2000) + 1000
                }
            });
        }
        return scenarios;
    }
    generateUserActionSequence() {
        const actions = ['login', 'browse_menu', 'add_to_cart'];
        if (Math.random() > 0.2) {
            actions.push('initiate_payment');
            if (Math.random() > 0.1) {
                actions.push('complete_payment');
            }
        }
        if (Math.random() > 0.7) {
            actions.push('view_orders', 'logout');
        }
        return actions;
    }
    getPerformanceThresholds() {
        return {
            PAYMENT_PROCESSING_MS: 2000,
            TRANSACTION_COMPLETION_MS: 3000,
            DATABASE_QUERY_MS: 500,
            API_RESPONSE_MS: 1000,
            CONCURRENT_LOAD_SUCCESS_RATE: 0.95,
            MEMORY_USAGE_MB: 512,
            CPU_USAGE_PERCENT: 80
        };
    }
    async seedMenuItems(count) {
        const menuItems = [];
        for (let i = 0; i < count; i++) {
            menuItems.push({
                id: `menu-item-${i + 1}`,
                name: `Test Menu Item ${i + 1}`,
                description: `Load test menu item ${i + 1} description`,
                price: Math.round((Math.random() * 100 + 20) * 100) / 100,
                category: this.getRandomMenuCategory(),
                currency: 'INR',
                isAvailable: Math.random() > 0.1,
                allergens: [],
                nutritionalInfo: {},
                vendorId: 'test-vendor-1',
                schoolId: this.schoolId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log(`Generated ${menuItems.length} menu items for load testing`);
    }
    async seedCustomers(count) {
        const customers = [];
        for (let i = 0; i < count; i++) {
            customers.push({
                id: `customer-${i + 1}`,
                userId: `user-${i + 1}`,
                parentId: `parent-${i + 1}`,
                schoolId: this.schoolId,
                rfidCards: [`card-${i + 1}`],
                dietaryRestrictions: [],
                emergencyContact: {
                    name: `Emergency Contact ${i + 1}`,
                    phone: `+91-${9000000000 + i}`,
                    relationship: 'parent'
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
        console.log(`Generated ${customers.length} customers for load testing`);
    }
    reset() {
        this.userCounter = 0;
        this.orderCounter = 0;
        this.paymentCounter = 0;
    }
    getRandomRole() {
        const roles = ['student', 'parent', 'admin'];
        const weights = [0.6, 0.35, 0.05];
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return roles[i];
            }
        }
        return 'student';
    }
    getRandomOrderStatus() {
        const statuses = ['draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        const weights = [0.1, 0.2, 0.15, 0.1, 0.4, 0.05];
        return this.getWeightedRandom(statuses, weights);
    }
    getRandomPaymentStatus() {
        const statuses = ['pending', 'completed', 'failed', 'refunded'];
        const weights = [0.1, 0.8, 0.08, 0.02];
        return this.getWeightedRandom(statuses, weights);
    }
    getRandomDeliverySlot() {
        const slots = ['breakfast', 'lunch', 'snacks', 'dinner'];
        return slots[Math.floor(Math.random() * slots.length)];
    }
    getRandomFutureDate() {
        const daysAhead = Math.floor(Math.random() * 7) + 1;
        return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    }
    getRandomFailureReason() {
        const reasons = [
            'insufficient_funds',
            'card_declined',
            'network_error',
            'gateway_timeout',
            'invalid_card',
            'expired_card',
            'authentication_failed'
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }
    getRandomMenuCategory() {
        const categories = ['MAIN_COURSE', 'SIDE_DISH', 'BEVERAGE', 'DESSERT', 'SNACK', 'BREAKFAST'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    getWeightedRandom(items, weights) {
        const random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return items[i];
            }
        }
        return items[items.length - 1];
    }
    async seedPaymentHistory(count) {
        const paymentHistory = [];
        for (let i = 0; i < count; i++) {
            paymentHistory.push({
                id: `payment-history-${i + 1}`,
                userId: `user-${Math.floor(Math.random() * 100) + 1}`,
                orderId: `order-${i + 1}`,
                amount: Math.round((Math.random() * 100 + 10) * 100) / 100,
                status: Math.random() > 0.1 ? 'completed' : 'failed',
                paymentMethodId: 'card',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
        }
        console.log(`Generated ${paymentHistory.length} payment history records for load testing`);
    }
    generateCustomer() {
        return this.generateUser();
    }
    getRandomMenuItems(count = 5) {
        const menuItems = [];
        for (let i = 0; i < count; i++) {
            menuItems.push({
                id: `menu-item-${i + 1}`,
                name: `Test Menu Item ${i + 1}`,
                price: Math.round((Math.random() * 50 + 10) * 100) / 100,
                category: this.getRandomMenuCategory(),
                isAvailable: Math.random() > 0.1
            });
        }
        return menuItems;
    }
}
exports.LoadTestDataGenerator = LoadTestDataGenerator;
//# sourceMappingURL=LoadTestDataGenerator.js.map