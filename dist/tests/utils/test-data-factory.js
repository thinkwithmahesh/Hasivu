"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestData = exports.createTestData = exports.generateTestOrders = exports.generateTestMenuItems = exports.generateTestUsers = exports.createTestDataFactory = void 0;
function createTestDataFactory() {
    let idCounter = 1;
    return {
        createUser: (overrides = {}) => {
            const baseUser = {
                id: `user_${idCounter++}`,
                email: `user${idCounter}@test.com`,
                firstName: 'Test',
                lastName: 'User',
                role: 'student',
                schoolId: `school_${idCounter}`,
                phone: '+1234567890',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return { ...baseUser, ...overrides };
        },
        createSchool: (overrides = {}) => {
            const baseSchool = {
                id: `school_${idCounter++}`,
                name: `Test School ${idCounter}`,
                address: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                postalCode: '12345',
                phone: '+1234567890',
                email: `school${idCounter}@test.com`,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return { ...baseSchool, ...overrides };
        },
        createMenuItem: (overrides = {}) => {
            const baseMenuItem = {
                id: `menu_${idCounter++}`,
                name: `Test Menu Item ${idCounter}`,
                description: 'A test menu item for testing purposes',
                price: 10.99,
                category: 'main',
                schoolId: `school_${idCounter}`,
                isVegetarian: false,
                isVegan: false,
                isGlutenFree: false,
                isDairyFree: false,
                nutritionalInfo: {
                    calories: 250,
                    protein: 15,
                    carbs: 30,
                    fat: 8,
                    fiber: 3
                },
                allergens: [],
                ingredients: ['ingredient1', 'ingredient2'],
                servingSize: '1 serving',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return { ...baseMenuItem, ...overrides };
        },
        createOrder: (overrides = {}) => {
            const baseOrder = {
                id: `order_${idCounter++}`,
                studentId: `student_${idCounter}`,
                schoolId: `school_${idCounter}`,
                totalAmount: 25.99,
                status: 'confirmed',
                orderItems: [
                    {
                        menuItemId: `menu_${idCounter}`,
                        quantity: 2,
                        price: 10.99,
                        specialInstructions: 'No onions'
                    }
                ],
                deliveryAddress: 'Test Address',
                deliveryTime: new Date(Date.now() + 60 * 60 * 1000),
                paymentStatus: 'paid',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            return { ...baseOrder, ...overrides };
        },
        createBatch: (count, factory) => {
            return Array.from({ length: count }, (_, index) => factory(index));
        }
    };
}
exports.createTestDataFactory = createTestDataFactory;
function generateTestUsers(count = 5) {
    const factory = createTestDataFactory();
    return factory.createBatch(count, () => factory.createUser());
}
exports.generateTestUsers = generateTestUsers;
function generateTestMenuItems(count = 10) {
    const factory = createTestDataFactory();
    return factory.createBatch(count, () => factory.createMenuItem());
}
exports.generateTestMenuItems = generateTestMenuItems;
function generateTestOrders(count = 3) {
    const factory = createTestDataFactory();
    return factory.createBatch(count, () => factory.createOrder());
}
exports.generateTestOrders = generateTestOrders;
function createTestData() {
    const factory = createTestDataFactory();
    return {
        users: generateTestUsers(5),
        menuItems: generateTestMenuItems(10),
        orders: generateTestOrders(3)
    };
}
exports.createTestData = createTestData;
function cleanupTestData() {
    console.log('Cleaning up test data...');
}
exports.cleanupTestData = cleanupTestData;
//# sourceMappingURL=test-data-factory.js.map