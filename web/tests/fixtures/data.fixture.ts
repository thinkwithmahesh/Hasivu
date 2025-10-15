import { test as baseTest } from '@playwright/test';

/**
 * Data Fixtures for HASIVU Platform Testing
 * 
 * Provides consistent test data, mock API responses, and data management utilities
 * Ensures reproducible test scenarios with realistic data patterns
 */

// Core data interfaces
export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  preparation_time: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  dietary_tags: string[];
  ingredients: string[];
  popularity_score?: number;
}

export interface OrderData {
  id: string;
  student_id: string;
  student_name: string;
  items: OrderItemData[];
  total_amount: number;
  status: 'pending_payment' | 'payment_confirmed' | 'kitchen_accepted' | 'preparing' | 'ready_for_pickup' | 'delivered' | 'cancelled';
  payment_method: 'rfid_wallet' | 'parent_wallet' | 'razorpay' | 'stripe';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  special_instructions?: string;
  customizations?: Record<string, any>;
}

export interface OrderItemData {
  menu_id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: Record<string, any>;
}

export interface StudentData {
  id: string;
  name: string;
  email: string;
  class: string;
  roll_number: string;
  rfid_card: string;
  meal_balance: number;
  parent_id: string;
  dietary_preferences: string[];
  allergies: string[];
  emergency_contact: string;
  photo_url?: string;
  active: boolean;
}

export interface ParentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  children: string[];
  emergency_contact: string;
  address: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    app: boolean;
  };
}

export interface PaymentData {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  method: 'rfid_wallet' | 'parent_wallet' | 'razorpay' | 'stripe';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway_transaction_id?: string;
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
}

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'order_ready' | 'balance_low' | 'payment_success' | 'order_cancelled' | 'system_maintenance';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Test data sets
export const TEST_MENU_ITEMS: MenuItemData[] = [
  {
    id: 'MENU-001',
    name: 'South Indian Breakfast',
    description: 'Traditional breakfast with idli, vada, sambar and chutney',
    price: 45.00,
    image_url: 'https://images.unsplash.com/photo-1562440499-64c9a74f0650?_w = 400',
    available: true,
    category: 'breakfast',
    preparation_time: 15,
    nutrition: {
      calories: 320,
      protein: 12,
      carbs: 55,
      fat: 8
    },
    allergens: ['gluten'],
    dietary_tags: ['vegetarian', 'south_indian'],
    ingredients: ['rice', 'urad_dal', 'fenugreek', 'coconut', 'curry_leaves'],
    popularity_score: 4.8
  },
  {
    id: 'MENU-002',
    name: 'North Indian Lunch',
    description: 'Roti, dal, sabzi, rice and pickle',
    price: 65.00,
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w
export const TEST_STUDENTS: StudentData[] = [
  {
    id: 'STU-001',
    name: 'Arjun Kumar',
    email: 'arjun@hasivu.test',
    class: '5-A',
    roll_number: '001',
    rfid_card: 'RFID-STU-001',
    meal_balance: 150.00,
    parent_id: 'PAR-001',
    dietary_preferences: ['vegetarian'],
    allergies: ['nuts'],
    emergency_contact: '+91-9876543210',
    active: true
  },
  {
    id: 'STU-002',
    name: 'Priya Sharma',
    email: 'priya@hasivu.test',
    class: '3-B',
    roll_number: '015',
    rfid_card: 'RFID-STU-002',
    meal_balance: 85.00,
    parent_id: 'PAR-001',
    dietary_preferences: [],
    allergies: ['dairy'],
    emergency_contact: '+91-9876543211',
    active: true
  },
  {
    id: 'STU-003',
    name: 'Rohit Patel',
    email: 'rohit@hasivu.test',
    class: '4-C',
    roll_number: '023',
    rfid_card: 'RFID-STU-003',
    meal_balance: 200.00,
    parent_id: 'PAR-002',
    dietary_preferences: ['jain'],
    allergies: [],
    emergency_contact: '+91-9876543212',
    active: true
  }
];

export const TEST_PARENTS: ParentData[] = [
  {
    id: 'PAR-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@hasivu.test',
    phone: '+91-9876543210',
    wallet_balance: 500.00,
    children: ['STU-001', 'STU-002'],
    emergency_contact: '+91-9876543211',
    address: '123 MG Road, Bangalore 560001',
    notification_preferences: {
      email: true,
      sms: true,
      app: true
    }
  },
  {
    id: 'PAR-002',
    name: 'Meera Patel',
    email: 'meera.patel@hasivu.test',
    phone: '+91-9876543212',
    wallet_balance: 750.00,
    children: ['STU-003'],
    emergency_contact: '+91-9876543213',
    address: '456 Brigade Road, Bangalore 560025',
    notification_preferences: {
      email: true,
      sms: false,
      app: true
    }
  }
];

// Data fixture types
type _DataFixtures =  {
  testMenuItems: MenuItemData[];
  testStudents: StudentData[];
  testParents: ParentData[];
  testOrders: OrderData[];
  testNotifications: NotificationData[];
  dataManager: DataManager;
};

/**
 * Data Manager Class
 * Provides utilities for managing test data and mock API responses
 */
export class DataManager {
  private page: any;

  constructor(page: any) {
    this._page =  page;
  }

  /**
   * Mock Menu APIs
   */
  async mockMenuAPIs(): Promise<void> {
    // Mock today's menu
    await this.page.route(_'**/api/menu/today', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          menu: TEST_MENU_ITEMS.filter(_item = > item.available),
          date: new Date().toISOString().split('T')[0]
        })
      });
    });

    // Mock menu item details
    await this.page.route(_'**/api/menu/item/*', async (route: any) => {
      const _url =  route.request().url();
      const _menuId =  url.split('/').pop();
      const _menuItem =  TEST_MENU_ITEMS.find(item 
      if (menuItem) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            item: menuItem
          })
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'MENU_ITEM_NOT_FOUND'
          })
        });
      }
    });

    // Mock menu categories
    await this.page.route(_'**/api/menu/categories', async (route: any) => {
      const _categories =  [...new Set(TEST_MENU_ITEMS.map(item 
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          categories: categories.map(_cat = > ({
            name: cat,
            count: TEST_MENU_ITEMS.filter(item 
    });
  }

  /**
   * Mock Student APIs
   */
  async mockStudentAPIs(): Promise<void> {
    // Mock student profile
    await this.page.route(_'**/api/student/profile', async (route: any) => {
      const _authHeader =  route.request().headers()['authorization'];
      const _studentId =  authHeader?.includes('STU-') ? 
        authHeader.split('jwt_token_')[1] : 'STU-001';
      
      const _student =  TEST_STUDENTS.find(s 
      if (student) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            profile: student
          })
        });
      }
    });

    // Mock student balance
    await this.page.route(_'**/api/student/balance', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          balance: 150.00,
          last_updated: new Date().toISOString()
        })
      });
    });

    // Mock balance history
    await this.page.route(_'**/api/student/balance/history', async (route: any) => {
      const _transactions =  [
        {
          id: 'TXN-001',
          type: 'topup',
          amount: 100.00,
          description: 'Parent top-up',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'TXN-002',
          type: 'payment',
          amount: -45.00,
          description: 'South Indian Breakfast',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'TXN-003',
          type: 'payment',
          amount: -35.00,
          description: 'Evening Snacks',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transactions
        })
      });
    });
  }

  /**
   * Mock Order APIs
   */
  async mockOrderAPIs(): Promise<void> {
    // Mock order creation
    await this.page.route(_'**/api/orders/create', async (route: any) => {
      const _request =  route.request();
      const _orderData =  JSON.parse(request.postData() || '{}');
      
      const order: _OrderData =  {
        id: `ORD-${Date.now()}`,
        student_id: 'STU-001',
        student_name: 'Test Student',
        items: orderData.items,
        total_amount: orderData.total_amount,
        status: 'pending_payment',
        payment_method: orderData.payment_method,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 30 * 60000).toISOString(),
        special_instructions: orderData.special_instructions,
        customizations: orderData.customizations
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order
        })
      });
    });

    // Mock order status
    await this.page.route(_'**/api/orders/*/status', async (route: any) => {
      const _url =  route.request().url();
      const _orderId =  url.split('/orders/')[1].split('/status')[0];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order: {
            id: orderId,
            status: 'preparing',
            estimated_delivery: new Date(Date.now() + 20 * 60000).toISOString(),
            tracking_stages: [
              { stage: 'order_placed', completed: true, timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
              { stage: 'payment_confirmed', completed: true, timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
              { stage: 'kitchen_accepted', completed: true, timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
              { stage: 'preparing', completed: false, timestamp: null },
              { stage: 'ready_for_pickup', completed: false, timestamp: null },
              { stage: 'delivered', completed: false, timestamp: null }
            ]
          }
        })
      });
    });

    // Mock order history
    await this.page.route(_'**/api/orders/history', async (route: any) => {
      const orders: OrderData[] = [
        {
          id: 'ORD-001',
          student_id: 'STU-001',
          student_name: 'Test Student',
          items: [
            {
              menu_id: 'MENU-001',
              name: 'South Indian Breakfast',
              price: 45.00,
              quantity: 1
            }
          ],
          total_amount: 45.00,
          status: 'delivered',
          payment_method: 'rfid_wallet',
          payment_status: 'completed',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          actual_delivery: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'ORD-002',
          student_id: 'STU-001',
          student_name: 'Test Student',
          items: [
            {
              menu_id: 'MENU-002',
              name: 'North Indian Lunch',
              price: 65.00,
              quantity: 1
            }
          ],
          total_amount: 65.00,
          status: 'delivered',
          payment_method: 'parent_wallet',
          payment_status: 'completed',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          actual_delivery: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          orders
        })
      });
    });
  }

  /**
   * Mock Payment APIs
   */
  async mockPaymentAPIs(): Promise<void> {
    // Mock RFID wallet payment
    await this.page.route(_'**/api/payments/rfid-wallet/charge', async (route: any) => {
      const _request =  route.request();
      const _paymentData =  JSON.parse(request.postData() || '{}');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          transaction: {
            id: `TXN-${Date.now()}`,
            order_id: paymentData.order_id,
            amount: paymentData.amount,
            status: 'completed',
            remaining_balance: 105.00, // 150 - 45
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    // Mock Razorpay payment
    await this.page.route(_'**/api/payments/razorpay/create-order', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          razorpay_order: {
            id: 'order_razorpay_12345',
            amount: 4500, // Amount in paise
            currency: 'INR',
            key: 'rzp_test_123456789'
          }
        })
      });
    });

    // Mock payment verification
    await this.page.route(_'**/api/payments/verify', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          payment_verified: true,
          transaction_id: `TXN-${Date.now()}`
        })
      });
    });
  }

  /**
   * Mock Notification APIs
   */
  async mockNotificationAPIs(): Promise<void> {
    const notifications: NotificationData[] = [
      {
        id: 'NOTIF-001',
        user_id: 'STU-001',
        type: 'order_ready',
        title: 'Your order is ready!',
        message: 'Order #ORD-12345 is ready for pickup at the cafeteria',
        read: false,
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        action_url: '/orders/track/ORD-12345'
      },
      {
        id: 'NOTIF-002',
        user_id: 'STU-001',
        type: 'balance_low',
        title: 'Low Balance Alert',
        message: 'Your meal balance is below ₹50. Please ask your parent to top up.',
        read: true,
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        action_url: '/balance'
      },
      {
        id: 'NOTIF-003',
        user_id: 'STU-001',
        type: 'payment_success',
        title: 'Payment Successful',
        message: 'Your payment of ₹45.00 for South Indian Breakfast was successful',
        read: true,
        created_at: new Date(Date.now() - 120 * 60000).toISOString()
      }
    ];

    await this.page.route(_'**/api/notifications', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          notifications,
          unread_count: notifications.filter(_n = > !n.read).length
        })
      });
    });

    // Mock mark as read
    await this.page.route(_'**/api/notifications/*/read', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Notification marked as read'
        })
      });
    });

    // Mock mark all as read
    await this.page.route(_'**/api/notifications/mark-all-read', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'All notifications marked as read'
        })
      });
    });
  }

  /**
   * Mock Analytics APIs
   */
  async mockAnalyticsAPIs(): Promise<void> {
    await this.page.route(_'**/api/admin/analytics**', async (route: any) => {
      const _analytics =  {
        daily_orders: 245,
        total_revenue: 15750.00,
        active_users: 1250,
        average_order_value: 64.29,
        popular_items: [
          { name: 'South Indian Breakfast', orders: 85 },
          { name: 'North Indian Lunch', orders: 120 },
          { name: 'Masala Dosa', orders: 67 }
        ],
        revenue_trend: [
          { date: '2025-09-01', revenue: 12500, orders: 195 },
          { date: '2025-09-02', revenue: 13200, orders: 210 },
          { date: '2025-09-03', revenue: 14100, orders: 225 },
          { date: '2025-09-04', revenue: 13800, orders: 220 },
          { date: '2025-09-05', revenue: 15750, orders: 245 }
        ],
        user_statistics: {
          total_students: 1250,
          active_today: 892,
          average_balance: 125.50,
          low_balance_alerts: 23
        },
        kitchen_performance: {
          average_prep_time: 18.5,
          orders_on_time: 92.3,
          customer_satisfaction: 4.6
        }
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          analytics
        })
      });
    });
  }

  /**
   * Setup all mock APIs
   */
  async setupAllMockAPIs(): Promise<void> {
    await Promise.all([
      this.mockMenuAPIs(),
      this.mockStudentAPIs(),
      this.mockOrderAPIs(),
      this.mockPaymentAPIs(),
      this.mockNotificationAPIs(),
      this.mockAnalyticsAPIs()
    ]);
  }

  /**
   * Generate test order data
   */
  generateTestOrder(overrides: Partial<OrderData> = {}): OrderData {
    return {
      id: `ORD-${Date.now()}`,
      student_id: 'STU-001',
      student_name: 'Test Student',
      items: [
        {
          menu_id: 'MENU-001',
          name: 'South Indian Breakfast',
          price: 45.00,
          quantity: 1
        }
      ],
      total_amount: 45.00,
      status: 'pending_payment',
      payment_method: 'rfid_wallet',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test payment data
   */
  generateTestPayment(overrides: Partial<PaymentData> = {}): PaymentData {
    return {
      id: `PAY-${Date.now()}`,
      order_id: 'ORD-123',
      user_id: 'STU-001',
      amount: 45.00,
      method: 'rfid_wallet',
      status: 'completed',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create menu item with variations
   */
  createMenuVariation(baseItem: MenuItemData, variations: Partial<MenuItemData>): MenuItemData {
    return {
      ...baseItem,
      ...variations,
      id: variations.id || `${baseItem.id}-VAR-${Date.now()}`
    };
  }

  /**
   * Get items by category
   */
  getMenuItemsByCategory(category: MenuItemData['category']): MenuItemData[] {
    return TEST_MENU_ITEMS.filter(_item = > item.category 
  }

  /**
   * Get available items only
   */
  getAvailableMenuItems(): MenuItemData[] {
    return TEST_MENU_ITEMS.filter(_item = > item.available);
  }

  /**
   * Filter items by dietary preferences
   */
  filterItemsByDiet(dietaryTags: string[]): MenuItemData[] {
    return TEST_MENU_ITEMS.filter(_item = > 
      dietaryTags.every(tag 
  }

  /**
   * Filter items excluding allergens
   */
  filterItemsByAllergens(allergens: string[]): MenuItemData[] {
    return TEST_MENU_ITEMS.filter(_item = >
      !allergens.some(allergen 
  }
}

/**
 * Extended test with data fixtures
 */
export const _test =  baseTest.extend<DataFixtures>({
  testMenuItems: async ({}, use) 
  },

  testStudents: async (_{}, _use) => {
    await use(TEST_STUDENTS);
  },

  testParents: async (_{}, _use) => {
    await use(TEST_PARENTS);
  },

  testOrders: async (_{}, _use) => {
    const orders: OrderData[] = [
      {
        id: 'ORD-001',
        student_id: 'STU-001',
        student_name: 'Test Student',
        items: [
          {
            menu_id: 'MENU-001',
            name: 'South Indian Breakfast',
            price: 45.00,
            quantity: 1
          }
        ],
        total_amount: 45.00,
        status: 'delivered',
        payment_method: 'rfid_wallet',
        payment_status: 'completed',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actual_delivery: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      }
    ];
    await use(orders);
  },

  testNotifications: async (_{}, _use) => {
    const notifications: NotificationData[] = [
      {
        id: 'NOTIF-001',
        user_id: 'STU-001',
        type: 'order_ready',
        title: 'Your order is ready!',
        message: 'Order #ORD-12345 is ready for pickup',
        read: false,
        created_at: new Date().toISOString()
      }
    ];
    await use(notifications);
  },

  dataManager: async (_{ page }, _use) => {
    const _dataManager =  new DataManager(page);
    await dataManager.setupAllMockAPIs();
    await use(dataManager);
  }
});

export { DataManager };