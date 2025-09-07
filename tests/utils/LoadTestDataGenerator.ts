/**
 * Load Test Data Generator
 * 
 * Generates realistic test data for load testing scenarios,
 * including payment processing, order management, and user interactions.
 */

import { TestDataFactory } from './test-helpers';
import { PaymentStatus, OrderStatus } from '../../src/types/index';

export interface LoadTestUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'parent' | 'admin';
  phone: string;
  schoolId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadTestOrder {
  id: string;
  userId: string;
  parentId: string;
  schoolId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  deliveryDate: Date;
  deliverySlot: string;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  rfidVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadTestPaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  metadata: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LoadTestDataGenerator {
  private readonly userIdPrefix = 'load-test-user-';
  private readonly orderIdPrefix = 'load-test-order-';
  private readonly paymentIdPrefix = 'load-test-payment-';
  private readonly schoolId = 'load-test-school-123';
  
  private userCounter = 0;
  private orderCounter = 0;
  private paymentCounter = 0;

  constructor() {
    // Initialize counters with random offset to avoid collisions
    const randomOffset = Math.floor(Math.random() * 1000);
    this.userCounter = randomOffset;
    this.orderCounter = randomOffset;
    this.paymentCounter = randomOffset;
  }

  /**
   * Generate a batch of test users for load testing
   */
  generateUsers(count: number): LoadTestUser[] {
    return Array.from({ length: count }, () => this.generateUser());
  }

  /**
   * Generate a single test user
   */
  generateUser(): LoadTestUser {
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

  /**
   * Generate a batch of test orders for load testing
   */
  generateOrders(count: number, users?: LoadTestUser[]): LoadTestOrder[] {
    return Array.from({ length: count }, () => this.generateOrder(users));
  }

  /**
   * Generate a single test order
   */
  generateOrder(users?: LoadTestUser[]): LoadTestOrder {
    const orderId = `${this.orderIdPrefix}${++this.orderCounter}`;
    const userId = users?.length ? 
      users[Math.floor(Math.random() * users.length)].id : 
      `${this.userIdPrefix}${Math.floor(Math.random() * 100) + 1}`;
    
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
    const items = Array.from({ length: itemCount }, () => ({
      menuItemId: `menu-item-${Math.floor(Math.random() * 50) + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: Math.round((Math.random() * 100 + 20) * 100) / 100, // 20-120 INR
      totalPrice: 0 // Will be calculated below
    }));

    // Calculate total prices
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

  /**
   * Generate a batch of test payment orders for load testing
   */
  generatePaymentOrders(count: number, orders?: LoadTestOrder[]): LoadTestPaymentOrder[] {
    return Array.from({ length: count }, () => this.generatePaymentOrder(orders));
  }

  /**
   * Generate a single test payment order
   */
  generatePaymentOrder(orders?: LoadTestOrder[]): LoadTestPaymentOrder {
    const paymentId = `${this.paymentIdPrefix}${++this.paymentCounter}`;
    const orderId = orders?.length ? 
      orders[Math.floor(Math.random() * orders.length)].id : 
      `${this.orderIdPrefix}${Math.floor(Math.random() * 100) + 1}`;
    
    const amount = Math.round((Math.random() * 500 + 50) * 100) / 100; // 50-550 INR
    const isCompleted = Math.random() > 0.2; // 80% completion rate
    const isFailed = !isCompleted && Math.random() > 0.7; // Some failures among incomplete

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
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      completedAt: isCompleted ? new Date() : null,
      failureReason: isFailed ? this.getRandomFailureReason() : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate realistic concurrent user scenarios
   */
  generateConcurrentUserScenarios(userCount: number) {
    const scenarios = [];
    
    for (let i = 0; i < userCount; i++) {
      scenarios.push({
        userId: `concurrent-user-${i + 1}`,
        actions: this.generateUserActionSequence(),
        timing: {
          startDelay: Math.floor(Math.random() * 5000), // 0-5 second stagger
          actionInterval: Math.floor(Math.random() * 2000) + 1000 // 1-3 second between actions
        }
      });
    }
    
    return scenarios;
  }

  /**
   * Generate a sequence of actions for a user session
   */
  generateUserActionSequence() {
    const actions = ['login', 'browse_menu', 'add_to_cart'];
    
    // 80% chance of proceeding to payment
    if (Math.random() > 0.2) {
      actions.push('initiate_payment');
      
      // 90% chance of completing payment
      if (Math.random() > 0.1) {
        actions.push('complete_payment');
      }
    }
    
    // 30% chance of additional actions
    if (Math.random() > 0.7) {
      actions.push('view_orders', 'logout');
    }
    
    return actions;
  }

  /**
   * Generate performance test thresholds
   */
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

  /**
   * Seed menu items for load testing
   */
  async seedMenuItems(count: number): Promise<void> {
    // Generate menu items for testing
    const menuItems = [];
    for (let i = 0; i < count; i++) {
      menuItems.push({
        id: `menu-item-${i + 1}`,
        name: `Test Menu Item ${i + 1}`,
        description: `Load test menu item ${i + 1} description`,
        price: Math.round((Math.random() * 100 + 20) * 100) / 100, // 20-120 INR
        category: this.getRandomMenuCategory(),
        currency: 'INR',
        isAvailable: Math.random() > 0.1, // 90% available
        allergens: [],
        nutritionalInfo: {},
        vendorId: 'test-vendor-1',
        schoolId: this.schoolId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Store the generated menu items for testing
    console.log(`Generated ${menuItems.length} menu items for load testing`);
  }

  /**
   * Seed customers for load testing
   */
  async seedCustomers(count: number): Promise<void> {
    // Generate customers for testing
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
    
    // Store the generated customers for testing
    console.log(`Generated ${customers.length} customers for load testing`);
  }

  /**
   * Reset counters for fresh test runs
   */
  reset(): void {
    this.userCounter = 0;
    this.orderCounter = 0;
    this.paymentCounter = 0;
  }

  // Private helper methods
  private getRandomRole(): 'student' | 'parent' | 'admin' {
    const roles: ('student' | 'parent' | 'admin')[] = ['student', 'parent', 'admin'];
    const weights = [0.6, 0.35, 0.05]; // 60% student, 35% parent, 5% admin
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

  private getRandomOrderStatus(): OrderStatus {
    const statuses: OrderStatus[] = ['draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const weights = [0.1, 0.2, 0.15, 0.1, 0.4, 0.05]; // Realistic distribution
    return this.getWeightedRandom(statuses, weights);
  }

  private getRandomPaymentStatus(): PaymentStatus {
    const statuses: PaymentStatus[] = ['pending', 'completed', 'failed', 'refunded'];
    const weights = [0.1, 0.8, 0.08, 0.02]; // Most payments complete successfully
    return this.getWeightedRandom(statuses, weights);
  }

  private getRandomDeliverySlot(): string {
    const slots = ['breakfast', 'lunch', 'snacks', 'dinner'];
    return slots[Math.floor(Math.random() * slots.length)];
  }

  private getRandomFutureDate(): Date {
    const daysAhead = Math.floor(Math.random() * 7) + 1; // 1-7 days ahead
    return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  }

  private getRandomFailureReason(): string {
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

  private getRandomMenuCategory(): string {
    const categories = ['MAIN_COURSE', 'SIDE_DISH', 'BEVERAGE', 'DESSERT', 'SNACK', 'BREAKFAST'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private getWeightedRandom<T>(items: T[], weights: number[]): T {
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

  /**
   * Generate payment history data for testing
   */
  async seedPaymentHistory(count: number): Promise<void> {
    // Generate payment history records for testing
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

  /**
   * Generate customer data (alias for generateUser for compatibility)
   */
  generateCustomer(): LoadTestUser {
    return this.generateUser();
  }

  /**
   * Get random menu items for testing
   */
  getRandomMenuItems(count: number = 5): any[] {
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