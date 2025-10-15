/**
 * Test Data Factory - Generates test data for various entities
 */

export interface TestDataFactory {
  createUser: (overrides?: any) => any;
  createSchool: (overrides?: any) => any;
  createMenuItem: (overrides?: any) => any;
  createOrder: (overrides?: any) => any;
  createBatch: (count: number, factory: (index: number) => any) => any[];
}

/**
 * Create test data factory
 */
export function createTestDataFactory(): TestDataFactory {
  let idCounter = 1;

  return {
    createUser: (overrides: any = {}) => {
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

    createSchool: (overrides: any = {}) => {
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

    createMenuItem: (overrides: any = {}) => {
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

    createOrder: (overrides: any = {}) => {
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
        deliveryTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        paymentStatus: 'paid',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { ...baseOrder, ...overrides };
    },

    createBatch: (count: number, factory: (index: number) => any) => {
      return Array.from({ length: count }, (_, index) => factory(index));
    }
  };
}

/**
 * Generate test users
 */
export function generateTestUsers(count: number = 5) {
  const factory = createTestDataFactory();
  return factory.createBatch(count, () => factory.createUser());
}

/**
 * Generate test menu items
 */
export function generateTestMenuItems(count: number = 10) {
  const factory = createTestDataFactory();
  return factory.createBatch(count, () => factory.createMenuItem());
}

/**
 * Generate test orders
 */
export function generateTestOrders(count: number = 3) {
  const factory = createTestDataFactory();
  return factory.createBatch(count, () => factory.createOrder());
}

/**
 * Create test data (convenience export)
 */
export function createTestData() {
  const factory = createTestDataFactory();
  return {
    users: generateTestUsers(5),
    menuItems: generateTestMenuItems(10),
    orders: generateTestOrders(3)
  };
}

/**
 * Cleanup test data (convenience export)
 */
export function cleanupTestData() {
  // Cleanup logic would go here
  console.log('Cleaning up test data...');
}