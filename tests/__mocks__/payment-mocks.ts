/**
 * Enhanced Payment Testing Mocks and Fixtures
 * Epic 5: Advanced Payment Features - Story 5.1
 * Comprehensive mock data for testing payment functions
 */

import { PaymentMethod, PaymentStatus, PaymentMethodType } from '../../src/types/api.types';

// Define missing enum-like constants for compatibility
const Currency = {
  INR: 'INR',
  EUR: 'EUR'
} as const;

const PaymentGateway = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  PAYU: 'payu'
} as const;

const PaymentType = {
  MEAL: 'meal',
  TRANSPORT: 'transport',
  FEE: 'fee',
  SUBSCRIPTION: 'subscription'
} as const;

// Payment constants for mock data
const PAYMENT_TYPES = {
  CARD: 'card' as PaymentMethodType,
  UPI: 'upi' as PaymentMethodType,
  WALLET: 'wallet' as PaymentMethodType,
  BANK_ACCOUNT: 'bank_account' as PaymentMethodType,
  RFID: 'rfid' as PaymentMethodType,
  CASH: 'cash' as PaymentMethodType
};

const PAYMENT_STATUSES = {
  PENDING: 'pending' as PaymentStatus,
  PROCESSING: 'processing' as PaymentStatus,
  COMPLETED: 'completed' as PaymentStatus,
  FAILED: 'failed' as PaymentStatus,
  CANCELLED: 'cancelled' as PaymentStatus,
  REFUNDED: 'refunded' as PaymentStatus
};

const GATEWAYS = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe',
  PAYU: 'payu'
};

const CURRENCIES = {
  INR: 'INR',
  EUR: 'EUR'
};

// Mock user data
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-test-123',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+919876543210',
  role: 'student',
  schoolId: 'school-test-123',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock school data
export const createMockSchool = (overrides: Partial<any> = {}) => ({
  id: 'school-test-123',
  name: 'Test School',
  address: '123 Test Street, Test City',
  phone: '+919876543210',
  email: 'contact@testschool.edu',
  website: 'https://testschool.edu',
  principalName: 'Dr. Test Principal',
  isActive: true,
  settings: {
    paymentGateways: ['razorpay'],
    currencies: ['INR'],
    taxRate: 18,
    serviceCharges: 5
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock payment method data
export const createMockPaymentMethod = (overrides: Partial<any> = {}) => ({
  id: 'payment-method-test-123',
  userId: 'user-test-123',
  type: PAYMENT_TYPES.CARD,
  method: PAYMENT_TYPES.CARD,
  gateway: GATEWAYS.RAZORPAY,
  gatewayMethodId: 'card_test_razorpay_123',
  isDefault: false,
  cardLast4: '4242',
  cardBrand: 'visa',
  cardExpiry: '12/25',
  cardHolderName: 'Test User',
  bankName: 'Test Bank',
  accountNumber: '****1234',
  ifscCode: 'TEST0001234',
  upiHandle: 'testuser@paytm',
  walletProvider: 'paytm',
  isVerified: true,
  metadata: JSON.stringify({
    fingerprint: 'card_fingerprint_test',
    country: 'IN',
    network: 'Visa'
  }),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock UPI payment method
export const createMockUPIPaymentMethod = (overrides: Partial<any> = {}) => ({
  ...createMockPaymentMethod(),
  id: 'payment-method-upi-test-123',
  type: PAYMENT_TYPES.UPI,
  method: PAYMENT_TYPES.UPI,
  cardLast4: null,
  cardBrand: null,
  cardExpiry: null,
  cardHolderName: null,
  upiHandle: 'testuser@upi',
  metadata: JSON.stringify({
    upiAppName: 'PhonePe',
    verified: true
  }),
  ...overrides
});

// Mock wallet payment method
export const createMockWalletPaymentMethod = (overrides: Partial<any> = {}) => ({
  ...createMockPaymentMethod(),
  id: 'payment-method-wallet-test-123',
  type: PAYMENT_TYPES.WALLET,
  method: PAYMENT_TYPES.WALLET,
  cardLast4: null,
  cardBrand: null,
  cardExpiry: null,
  cardHolderName: null,
  upiHandle: null,
  walletProvider: 'paytm',
  metadata: JSON.stringify({
    walletBalance: 5000,
    kycVerified: true
  }),
  ...overrides
});

// Mock payment order
export const createMockPaymentOrder = (overrides: Partial<any> = {}) => ({
  id: 'order-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  amount: 15000, // 150.00 INR in paisa
  currency: CURRENCIES.INR,
  status: PAYMENT_STATUSES.PENDING,
  description: 'Test meal order payment',
  metadata: JSON.stringify({
    orderType: 'meal',
    items: [
      { name: 'Lunch Combo A', price: 15000, quantity: 1 }
    ]
  }),
  razorpayOrderId: 'order_test_razorpay_123',
  expiresAt: new Date('2024-01-02'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock payment transaction
export const createMockPaymentTransaction = (overrides: Partial<any> = {}) => ({
  id: 'transaction-test-123',
  orderId: 'order-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  paymentMethodId: 'payment-method-test-123',
  amount: 15000,
  currency: CURRENCIES.INR,
  status: PAYMENT_STATUSES.COMPLETED,
  type: PAYMENT_TYPES.CARD,
  method: PAYMENT_TYPES.CARD,
  gateway: GATEWAYS.RAZORPAY,
  razorpayPaymentId: 'pay_test_razorpay_123',
  gatewayTransactionId: 'txn_test_gateway_123',
  gatewayOrderId: 'order_test_razorpay_123',
  description: 'Test meal order payment',
  gatewayMetadata: JSON.stringify({
    payment_id: 'pay_test_razorpay_123',
    order_id: 'order_test_razorpay_123',
    signature: 'test_signature_123'
  }),
  fees: JSON.stringify({
    platformFee: 500,
    gatewayFee: 300,
    gst: 144
  }),
  failureReason: null,
  refundReason: null,
  notes: 'Test payment transaction',
  paidAt: new Date('2024-01-01T10:00:00Z'),
  capturedAt: new Date('2024-01-01T10:01:00Z'),
  refundedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock failed payment transaction
export const createMockFailedPaymentTransaction = (overrides: Partial<any> = {}) => ({
  ...createMockPaymentTransaction(),
  id: 'transaction-failed-test-123',
  status: PAYMENT_STATUSES.FAILED,
  razorpayPaymentId: 'pay_failed_test_123',
  failureReason: 'Insufficient funds',
  paidAt: null,
  capturedAt: null,
  ...overrides
});

// Mock order
export const createMockOrder = (overrides: Partial<any> = {}) => ({
  id: 'order-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  rfidTagId: 'tag-test-123',
  totalAmount: 15000,
  currency: Currency.INR,
  status: 'pending',
  type: 'meal',
  items: [
    { 
      id: 'item-test-123',
      name: 'Lunch Combo A', 
      price: 15000, 
      quantity: 1,
      category: 'lunch',
      description: 'Rice, Dal, Vegetables'
    }
  ],
  metadata: JSON.stringify({
    orderNumber: 'ORD-2024-001',
    deliveryLocation: 'Cafeteria Block A',
    specialInstructions: 'No spicy food'
  }),
  paymentTransactionId: 'transaction-test-123',
  estimatedPrepTime: 15,
  actualPrepTime: null,
  deliveredAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock RFID tag
export const createMockRFIDTag = (overrides: Partial<any> = {}) => ({
  id: 'tag-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  tagNumber: 'RFID123456789',
  balance: 50000, // 500.00 INR in paisa
  status: 'active',
  isBlocked: false,
  lastTransactionId: 'transaction-test-123',
  lastActivity: new Date('2024-01-01T10:00:00Z'),
  metadata: JSON.stringify({
    issueDate: '2024-01-01',
    expiryDate: '2025-01-01',
    cardType: 'student'
  }),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock payment retry
export const createMockPaymentRetry = (overrides: Partial<any> = {}) => ({
  id: 'retry-test-123',
  paymentTransactionId: 'transaction-test-123',
  retryCount: 1,
  maxRetries: 3,
  nextRetryAt: new Date('2024-01-01T11:00:00Z'),
  lastAttemptAt: new Date('2024-01-01T10:30:00Z'),
  failureReason: 'Network timeout',
  isExhausted: false,
  strategy: 'exponential_backoff',
  metadata: JSON.stringify({
    delayMs: 60000,
    backoffMultiplier: 2,
    maxDelayMs: 300000
  }),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock payment plan
export const createMockPaymentPlan = (overrides: Partial<any> = {}) => ({
  id: 'plan-test-123',
  name: 'Test Monthly Plan',
  description: 'Test plan for monthly payments',
  amount: 99900, // 999.00 INR in paisa
  currency: Currency.INR,
  interval: 'monthly',
  intervalCount: 1,
  trialPeriodDays: 7,
  maxCycles: null,
  setupFee: 0,
  metadata: JSON.stringify({
    features: ['feature1', 'feature2'],
    category: 'premium'
  }),
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock subscription
export const createMockSubscription = (overrides: Partial<any> = {}) => ({
  id: 'subscription-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  subscriptionPlanId: 'plan-test-123',
  paymentMethodId: 'payment-method-test-123',
  status: 'active',
  currentCycle: 1,
  totalCycles: null,
  nextBillingDate: new Date('2024-02-01'),
  trialStartDate: new Date('2024-01-01'),
  trialEndDate: new Date('2024-01-08'),
  activatedAt: new Date('2024-01-08'),
  metadata: JSON.stringify({ 
    planName: 'Premium Monthly', 
    features: ['feature1', 'feature2'],
    autoRenewal: true
  }),
  pausedAt: null,
  pauseReason: null,
  resumedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  suspendedAt: null,
  suspensionReason: null,
  lastBillingDate: null,
  lastPaymentDate: null,
  lastFailedPaymentAt: null,
  failedPaymentCount: 0,
  prorationAmount: null,
  discountAmount: 0,
  taxAmount: 17982, // 18% GST on 999 INR
  totalAmount: 99900,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  subscriptionPlan: createMockPaymentPlan(),
  user: createMockUser(),
  ...overrides
});

// Mock subscription plan
export const createMockSubscriptionPlan = (overrides: Partial<any> = {}) => ({
  id: 'plan-test-123',
  name: 'Test Premium Plan',
  description: 'Premium subscription plan for testing',
  amount: 99900,
  currency: Currency.INR,
  interval: 'monthly',
  intervalCount: 1,
  trialPeriodDays: 7,
  maxCycles: null,
  setupFee: 0,
  features: ['unlimited_meals', 'priority_support', 'nutritional_tracking'],
  metadata: JSON.stringify({ 
    category: 'premium', 
    popular: true,
    tierLevel: 3
  }),
  isActive: true,
  sortOrder: 2,
  isVisible: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock billing cycle
export const createMockBillingCycle = (overrides: Partial<any> = {}) => ({
  id: 'cycle-test-123',
  subscriptionId: 'subscription-test-123',
  cycleNumber: 1,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  billingDate: new Date('2024-01-01'),
  dueDate: new Date('2024-01-08'),
  amount: 99900,
  prorationAmount: 0,
  discountAmount: 0,
  taxAmount: 17982,
  totalAmount: 99900,
  status: 'completed',
  paymentTransactionId: 'transaction-test-123',
  invoice: JSON.stringify({
    number: 'INV-2024-001',
    items: [
      {
        description: 'Premium Plan - January 2024',
        amount: 99900,
        quantity: 1
      }
    ]
  }),
  paidAt: new Date('2024-01-01T10:00:00Z'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock subscription with trial
export const createMockTrialSubscription = (overrides: Partial<any> = {}) => createMockSubscription({
  status: 'trialing',
  trialStartDate: new Date('2024-01-01'),
  trialEndDate: new Date('2024-01-08'),
  activatedAt: null,
  nextBillingDate: new Date('2024-01-08'),
  ...overrides
});

// Mock cancelled subscription
export const createMockCancelledSubscription = (overrides: Partial<any> = {}) => createMockSubscription({
  status: 'cancelled',
  cancelledAt: new Date('2024-01-15'),
  cancellationReason: 'User requested cancellation',
  nextBillingDate: null,
  ...overrides
});

// Mock suspended subscription
export const createMockSuspendedSubscription = (overrides: Partial<any> = {}) => createMockSubscription({
  status: 'suspended',
  suspendedAt: new Date('2024-01-10'),
  suspensionReason: 'Payment failure',
  failedPaymentCount: 3,
  lastFailedPaymentAt: new Date('2024-01-10T09:00:00Z'),
  ...overrides
});

// Mock dunning configuration
export const createMockDunningConfig = (overrides: Partial<any> = {}) => ({
  id: 'dunning-config-test-123',
  schoolId: 'school-test-123',
  maxRetries: 3,
  retryIntervalDays: [1, 3, 7],
  gracePeriodDays: 3,
  autoSuspendAfterDays: 7,
  autoCancelAfterDays: 30,
  notificationSettings: {
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false
  },
  emailTemplates: JSON.stringify({
    reminder: 'payment_reminder_template',
    final_notice: 'payment_final_notice_template'
  }),
  smsTemplates: JSON.stringify({
    reminder: 'Your payment is due. Please pay to continue service.',
    final_notice: 'Final notice: Payment overdue. Service will be suspended.'
  }),
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock subscription analytics
export const createMockSubscriptionAnalytics = (overrides: Partial<any> = {}) => ({
  id: 'analytics-test-123',
  schoolId: 'school-test-123',
  period: 'monthly',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
  metrics: {
    totalSubscriptions: 150,
    activeSubscriptions: 140,
    newSubscriptions: 25,
    cancelledSubscriptions: 10,
    suspendedSubscriptions: 5,
    churnRate: 6.67,
    revenueGenerated: 13986000, // 139,860 INR
    averageRevenuePerUser: 99900,
    lifetimeValue: 999000,
    cohortAnalysis: {
      month1Retention: 95,
      month3Retention: 85,
      month6Retention: 75,
      month12Retention: 65
    }
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock refund
export const createMockRefund = (overrides: Partial<any> = {}) => ({
  id: 'refund-test-123',
  paymentTransactionId: 'transaction-test-123',
  orderId: 'order-test-123',
  userId: 'user-test-123',
  amount: 15000,
  currency: Currency.INR,
  reason: 'Customer requested refund',
  status: 'completed',
  type: 'full',
  gateway: PaymentGateway.RAZORPAY,
  gatewayRefundId: 'rfnd_test_razorpay_123',
  metadata: JSON.stringify({
    initiatedBy: 'admin',
    approvedBy: 'manager',
    customerNotes: 'Food quality issue'
  }),
  processedAt: new Date('2024-01-01T15:00:00Z'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

// Mock payment analytics
export const createMockPaymentAnalytics = (overrides: Partial<any> = {}) => ({
  schoolId: 'school-test-123',
  period: 'daily',
  date: new Date('2024-01-01'),
  metrics: {
    totalTransactions: 250,
    successfulTransactions: 238,
    failedTransactions: 12,
    totalAmount: 3750000, // 37,500 INR
    successfulAmount: 3570000, // 35,700 INR
    failedAmount: 180000, // 1,800 INR
    successRate: 95.2,
    averageTransactionAmount: 15000,
    paymentMethodDistribution: {
      card: 40,
      upi: 45,
      wallet: 10,
      netbanking: 5
    },
    gatewayDistribution: {
      razorpay: 85,
      payu: 15
    },
    hourlyDistribution: {
      '09': 15, '10': 25, '11': 35, '12': 50,
      '13': 45, '14': 30, '15': 25, '16': 15,
      '17': 10
    }
  },
  ...overrides
});

// Mock Razorpay API responses
export const mockRazorpayResponses = {
  // Order creation
  createOrder: {
    id: 'order_test_razorpay_123',
    entity: 'order',
    amount: 15000,
    amount_paid: 0,
    amount_due: 15000,
    currency: 'INR',
    receipt: 'order_test_123',
    status: 'created',
    attempts: 0,
    notes: {
      order_id: 'order-test-123',
      user_id: 'user-test-123'
    },
    created_at: 1642681800
  },

  // Customer creation
  createCustomer: {
    id: 'cust_test_razorpay_123',
    entity: 'customer',
    name: 'Test User',
    email: 'test@example.com',
    contact: '+919876543210',
    gstin: null,
    notes: {
      user_id: 'user-test-123'
    },
    created_at: 1642681800
  },

  // Payment capture
  capturePayment: {
    id: 'pay_test_razorpay_123',
    entity: 'payment',
    amount: 15000,
    currency: 'INR',
    status: 'captured',
    order_id: 'order_test_razorpay_123',
    invoice_id: null,
    international: false,
    method: 'card',
    amount_refunded: 0,
    refund_status: null,
    captured: true,
    description: 'Test meal order payment',
    card_id: 'card_test_razorpay_123',
    bank: 'HDFC',
    wallet: null,
    vpa: null,
    email: 'test@example.com',
    contact: '+919876543210',
    notes: {
      order_id: 'order-test-123'
    },
    fee: 300,
    tax: 54,
    error_code: null,
    error_description: null,
    created_at: 1642681800
  },

  // Payment failure
  failedPayment: {
    id: 'pay_failed_test_123',
    entity: 'payment',
    amount: 15000,
    currency: 'INR',
    status: 'failed',
    order_id: 'order_test_razorpay_123',
    method: 'card',
    captured: false,
    description: 'Test meal order payment',
    error_code: 'BAD_REQUEST_ERROR',
    error_description: 'Your card has insufficient funds',
    created_at: 1642681800
  },

  // Refund creation
  createRefund: {
    id: 'rfnd_test_razorpay_123',
    entity: 'refund',
    amount: 15000,
    currency: 'INR',
    payment_id: 'pay_test_razorpay_123',
    notes: {
      reason: 'Customer requested refund'
    },
    receipt: null,
    acquirer_data: {
      rrn: '123456789012'
    },
    created_at: 1642681800,
    batch_id: null,
    status: 'processed',
    speed_processed: 'normal'
  }
};

// Mock webhook payloads
export const mockWebhookPayloads = {
  // Payment success webhook
  paymentCaptured: {
    entity: 'event',
    account_id: 'acc_test_123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test_razorpay_123',
          entity: 'payment',
          amount: 15000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test_razorpay_123',
          invoice_id: null,
          international: false,
          method: 'card',
          amount_refunded: 0,
          refund_status: null,
          captured: true,
          description: 'Test meal order payment',
          card_id: 'card_test_razorpay_123',
          bank: 'HDFC',
          wallet: null,
          vpa: null,
          email: 'test@example.com',
          contact: '+919876543210',
          notes: {
            order_id: 'order-test-123'
          },
          fee: 300,
          tax: 54,
          error_code: null,
          error_description: null,
          acquirer_data: {
            rrn: '123456789012'
          },
          created_at: 1642681800
        }
      }
    },
    created_at: 1642681800
  },

  // Payment failed webhook
  paymentFailed: {
    entity: 'event',
    account_id: 'acc_test_123',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_failed_test_123',
          entity: 'payment',
          amount: 15000,
          currency: 'INR',
          status: 'failed',
          order_id: 'order_test_razorpay_123',
          method: 'card',
          captured: false,
          description: 'Test meal order payment',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Your card has insufficient funds',
          error_source: 'customer',
          error_step: 'payment_authentication',
          error_reason: 'card_declined',
          created_at: 1642681800
        }
      }
    },
    created_at: 1642681800
  },

  // Refund processed webhook
  refundProcessed: {
    entity: 'event',
    account_id: 'acc_test_123',
    event: 'refund.created',
    contains: ['refund'],
    payload: {
      refund: {
        entity: {
          id: 'rfnd_test_razorpay_123',
          entity: 'refund',
          amount: 15000,
          currency: 'INR',
          payment_id: 'pay_test_razorpay_123',
          notes: {
            reason: 'Customer requested refund'
          },
          receipt: null,
          acquirer_data: {
            rrn: '123456789012'
          },
          created_at: 1642681800,
          batch_id: null,
          status: 'processed',
          speed_processed: 'normal'
        }
      }
    },
    created_at: 1642681800
  },

  // Order paid webhook
  orderPaid: {
    entity: 'event',
    account_id: 'acc_test_123',
    event: 'order.paid',
    contains: ['order'],
    payload: {
      order: {
        entity: {
          id: 'order_test_razorpay_123',
          entity: 'order',
          amount: 15000,
          amount_paid: 15000,
          amount_due: 0,
          currency: 'INR',
          receipt: 'order_test_123',
          status: 'paid',
          attempts: 1,
          notes: {
            order_id: 'order-test-123',
            user_id: 'user-test-123'
          },
          created_at: 1642681800
        }
      }
    },
    created_at: 1642681800
  }
};

// Mock API Gateway events
export const createMockAPIGatewayEvent = (
  method: string,
  path: string,
  body?: any,
  pathParameters?: Record<string, string>,
  headers?: Record<string, string>
) => ({
  httpMethod: method,
  path,
  body: body ? JSON.stringify(body) : null,
  pathParameters: pathParameters || {},
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'jest-test-agent',
    'X-Request-ID': 'test-request-123',
    ...(headers || {})
  },
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  requestContext: {
    requestId: 'test-request-123',
    identity: {
      sourceIp: '127.0.0.1'
    },
    httpMethod: method,
    path,
    stage: 'test',
    requestTime: '01/Jan/2024:00:00:00 +0000',
    requestTimeEpoch: 1704067200
  },
  isBase64Encoded: false,
  resource: path,
  stageVariables: null,
  multiValueHeaders: {}
});

// Mock Lambda context
export const createMockLambdaContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-aws-request-123',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  identity: undefined,
  clientContext: undefined,
  getRemainingTimeInMillis: () => 30000
});

// Mock authenticated user result
export const createMockAuthResult = (overrides: Partial<any> = {}) => ({
  isAuthenticated: true,
  user: createMockUser(),
  school: createMockSchool(),
  permissions: ['read:meals', 'write:orders', 'read:payments'],
  session: {
    id: 'session-test-123',
    userId: 'user-test-123',
    token: 'jwt-token-test-123',
    refreshToken: 'refresh-token-test-123',
    expiresAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01')
  },
  ...overrides
});

// Mock unauthenticated result
export const createMockUnauthResult = () => ({
  isAuthenticated: false,
  user: null,
  school: null,
  permissions: [],
  session: null,
  error: 'Authentication required'
});

// Error scenarios
export const mockErrors = {
  // Payment errors
  insufficientFunds: new Error('Insufficient funds in account'),
  invalidCard: new Error('Invalid card details provided'),
  paymentTimeout: new Error('Payment processing timeout'),
  gatewayError: new Error('Payment gateway temporarily unavailable'),
  
  // Order errors
  orderNotFound: new Error('Order not found'),
  orderExpired: new Error('Order has expired'),
  orderAlreadyPaid: new Error('Order has already been paid'),
  
  // User errors
  userNotFound: new Error('User not found'),
  userNotActive: new Error('User account is not active'),
  insufficientBalance: new Error('Insufficient RFID balance'),
  
  // System errors
  databaseError: new Error('Database connection failed'),
  externalServiceError: new Error('External service unavailable'),
  validationError: new Error('Request validation failed')
};

// Test data generators
export const generateMultiplePaymentMethods = (count: number, userId: string = 'user-test-123'): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPaymentMethod({
      id: `payment-method-${index}`,
      userId,
      cardLast4: index % 2 === 0 ? `424${index}` : null,
      upiHandle: index % 2 === 1 ? `user${index}@paytm` : null,
      type: index % 2 === 0 ? PaymentType.MEAL : PaymentType.TRANSPORT,
      method: index % 2 === 0 ? PAYMENT_TYPES.CARD : PAYMENT_TYPES.UPI,
      isDefault: index === 0
    })
  );
};

export const generateMultipleTransactions = (count: number, userId: string = 'user-test-123'): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPaymentTransaction({
      id: `transaction-${index}`,
      userId,
      amount: 15000 + (index * 500),
      status: index % 10 === 0 ? PAYMENT_STATUSES.FAILED : PAYMENT_STATUSES.COMPLETED,
      razorpayPaymentId: `pay_test_${index}`,
      createdAt: new Date(`2024-01-${String(index % 28 + 1).padStart(2, '0')}`)
    })
  );
};

export const generateMultipleRetries = (count: number, transactionId: string = 'transaction-test-123'): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPaymentRetry({
      id: `retry-${index}`,
      paymentTransactionId: transactionId,
      retryCount: index + 1,
      lastAttemptAt: new Date(`2024-01-01T${String(10 + index).padStart(2, '0')}:00:00Z`)
    })
  );
};

export const generateMultipleSubscriptions = (count: number, userId: string = 'user-test-123'): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockSubscription({
      id: `subscription-${index}`,
      userId: userId || `user-${index}`,
      subscriptionPlanId: `plan-${index % 3}`,
      status: index % 4 === 0 ? 'cancelled' : 'active',
      currentCycle: index + 1
    })
  );
};

export const generateMultipleBillingCycles = (count: number, subscriptionId: string = 'subscription-test-123'): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockBillingCycle({
      id: `cycle-${index}`,
      subscriptionId,
      cycleNumber: index + 1,
      startDate: new Date(`2024-${String(index % 12 + 1).padStart(2, '0')}-01`),
      endDate: new Date(`2024-${String(index % 12 + 1).padStart(2, '0')}-28`)
    })
  );
};

export const generatePaymentAnalyticsData = (days: number = 30): any[] => {
  return Array.from({ length: days }, (_, index) => 
    createMockPaymentAnalytics({
      date: new Date(`2024-01-${String(index + 1).padStart(2, '0')}`),
      metrics: {
        ...createMockPaymentAnalytics().metrics,
        totalTransactions: 200 + Math.floor(Math.random() * 100),
        successRate: 92 + Math.random() * 6 // 92-98%
      }
    })
  );
};

// Mock payment webhook signature generation
export const generateMockWebhookSignature = (payload: string, secret: string = 'test_webhook_secret'): string => {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

// Mock payment form data
export const createMockPaymentFormData = (overrides: Partial<any> = {}) => ({
  amount: 15000,
  currency: 'INR',
  description: 'Test meal order',
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    contact: '+919876543210'
  },
  paymentMethod: {
    type: 'card',
    cardNumber: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '123',
    holderName: 'Test User'
  },
  billingAddress: {
    line1: '123 Test Street',
    line2: 'Test Area',
    city: 'Test City',
    state: 'Test State',
    postalCode: '123456',
    country: 'IN'
  },
  metadata: {
    orderId: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123'
  },
  ...overrides
});

// Mock UPI payment form data
export const createMockUPIFormData = (overrides: Partial<any> = {}) => ({
  amount: 15000,
  currency: 'INR',
  description: 'Test meal order',
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    contact: '+919876543210'
  },
  paymentMethod: {
    type: 'upi',
    vpa: 'testuser@paytm'
  },
  metadata: {
    orderId: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123'
  },
  ...overrides
});

// Mock wallet payment form data
export const createMockWalletFormData = (overrides: Partial<any> = {}) => ({
  amount: 15000,
  currency: 'INR',
  description: 'Test meal order',
  customer: {
    name: 'Test User',
    email: 'test@example.com',
    contact: '+919876543210'
  },
  paymentMethod: {
    type: 'wallet',
    provider: 'paytm'
  },
  metadata: {
    orderId: 'order-test-123',
    userId: 'user-test-123',
    schoolId: 'school-test-123'
  },
  ...overrides
});

// Mock payment validation responses
export const mockValidationResponses = {
  validCard: {
    isValid: true,
    cardType: 'visa',
    issuer: 'HDFC Bank',
    country: 'IN',
    warnings: []
  },
  
  invalidCard: {
    isValid: false,
    errors: ['Invalid card number', 'Expired card'],
    warnings: ['Issuer not supported']
  },
  
  validUPI: {
    isValid: true,
    provider: 'PhonePe',
    verified: true,
    warnings: []
  },
  
  invalidUPI: {
    isValid: false,
    errors: ['Invalid UPI handle format'],
    warnings: []
  }
};

// Mock payment flow states
export const mockPaymentFlowStates = {
  initiated: {
    orderId: 'order-test-123',
    status: 'initiated',
    step: 'payment_method_selection',
    progress: 25,
    nextAction: 'select_payment_method',
    timeRemaining: 600, // 10 minutes
    metadata: {
      sessionId: 'session-test-123',
      retryCount: 0
    }
  },
  
  processing: {
    orderId: 'order-test-123',
    status: 'processing',
    step: 'payment_authentication',
    progress: 75,
    nextAction: 'wait_for_gateway_response',
    timeRemaining: 120, // 2 minutes
    metadata: {
      sessionId: 'session-test-123',
      gatewayTransactionId: 'txn_test_123'
    }
  },
  
  completed: {
    orderId: 'order-test-123',
    status: 'completed',
    step: 'payment_confirmed',
    progress: 100,
    nextAction: 'redirect_to_success',
    timeRemaining: 0,
    metadata: {
      sessionId: 'session-test-123',
      paymentId: 'pay_test_razorpay_123',
      receiptUrl: 'https://example.com/receipt/test-123'
    }
  },
  
  failed: {
    orderId: 'order-test-123',
    status: 'failed',
    step: 'payment_authentication',
    progress: 50,
    nextAction: 'retry_payment',
    timeRemaining: 0,
    error: {
      code: 'CARD_DECLINED',
      message: 'Your card was declined',
      retryable: true
    },
    metadata: {
      sessionId: 'session-test-123',
      failureCount: 1
    }
  }
};

// Mock subscription lifecycle events
export const mockSubscriptionEvents = {
  subscriptionCreated: {
    id: 'subscription-test-123',
    event: 'subscription.created',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    data: createMockSubscription({
      status: 'trialing'
    })
  },
  
  subscriptionActivated: {
    id: 'subscription-test-123',
    event: 'subscription.activated',
    timestamp: new Date('2024-01-08T00:00:00Z'),
    data: createMockSubscription({
      status: 'active',
      activatedAt: new Date('2024-01-08T00:00:00Z')
    })
  },
  
  subscriptionCancelled: {
    id: 'subscription-test-123',
    event: 'subscription.cancelled',
    timestamp: new Date('2024-01-15T00:00:00Z'),
    data: createMockSubscription({
      status: 'cancelled',
      cancelledAt: new Date('2024-01-15T00:00:00Z'),
      cancellationReason: 'User requested'
    })
  },
  
  paymentFailed: {
    id: 'subscription-test-123',
    event: 'subscription.payment_failed',
    timestamp: new Date('2024-01-10T00:00:00Z'),
    data: {
      subscription: createMockSubscription({
        status: 'past_due',
        failedPaymentCount: 1,
        lastFailedPaymentAt: new Date('2024-01-10T00:00:00Z')
      }),
      payment: createMockFailedPaymentTransaction()
    }
  }
};

// Mock payment analytics aggregations
export const mockPaymentAnalyticsAggregations = {
  daily: {
    period: 'daily',
    data: generatePaymentAnalyticsData(30)
  },
  
  weekly: {
    period: 'weekly',
    data: Array.from({ length: 4 }, (_, index) => ({
      week: index + 1,
      weekStart: new Date(`2024-01-${String(index * 7 + 1).padStart(2, '0')}`),
      weekEnd: new Date(`2024-01-${String((index + 1) * 7).padStart(2, '0')}`),
      metrics: {
        totalTransactions: 1750 + Math.floor(Math.random() * 500),
        totalAmount: 26250000 + Math.floor(Math.random() * 5000000),
        successRate: 94 + Math.random() * 4
      }
    }))
  },
  
  monthly: {
    period: 'monthly',
    data: [{
      month: 1,
      year: 2024,
      monthStart: new Date('2024-01-01'),
      monthEnd: new Date('2024-01-31'),
      metrics: {
        totalTransactions: 7500,
        totalAmount: 112500000, // 1,125,000 INR
        successRate: 95.8,
        averageOrderValue: 15000,
        uniqueUsers: 500,
        repeatCustomers: 350
      }
    }]
  }
};

// Mock RFID transaction data
export const createMockRFIDTransaction = (overrides: Partial<any> = {}) => ({
  id: 'rfid-txn-test-123',
  rfidTagId: 'tag-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  type: 'debit', // debit | credit | transfer
  amount: 15000,
  balance: 35000, // Remaining balance after transaction
  description: 'Meal purchase - Lunch Combo A',
  orderId: 'order-test-123',
  merchantId: 'cafeteria-001',
  deviceId: 'pos-device-001',
  location: 'Main Cafeteria',
  metadata: JSON.stringify({
    items: [
      { name: 'Lunch Combo A', price: 15000, quantity: 1 }
    ],
    deviceInfo: {
      model: 'RFID-POS-V2',
      serialNumber: 'RFP123456'
    }
  }),
  processedAt: new Date('2024-01-01T12:00:00Z'),
  createdAt: new Date('2024-01-01T12:00:00Z'),
  updatedAt: new Date('2024-01-01T12:00:00Z'),
  ...overrides
});

// Mock RFID top-up transaction
export const createMockRFIDTopUpTransaction = (overrides: Partial<any> = {}) => ({
  ...createMockRFIDTransaction(),
  id: 'rfid-topup-test-123',
  type: 'credit',
  amount: 50000, // 500 INR top-up
  balance: 85000, // New balance after top-up
  description: 'RFID wallet top-up',
  orderId: null,
  merchantId: null,
  paymentTransactionId: 'transaction-topup-test-123',
  metadata: JSON.stringify({
    topUpMethod: 'online_payment',
    bonusAmount: 0,
    promoCode: null
  }),
  ...overrides
});

// Mock payment settlement data
export const createMockPaymentSettlement = (overrides: Partial<any> = {}) => ({
  id: 'settlement-test-123',
  schoolId: 'school-test-123',
  gateway: PaymentGateway.RAZORPAY,
  settlementId: 'setl_test_razorpay_123',
  amount: 1485000, // 14,850 INR (15,000 - fees)
  fees: 515, // Gateway + platform fees
  tax: 93, // GST on fees
  netAmount: 1484392,
  transactionCount: 100,
  period: {
    start: new Date('2024-01-01T00:00:00Z'),
    end: new Date('2024-01-01T23:59:59Z')
  },
  status: 'processed',
  bankAccount: {
    accountNumber: '****1234',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank'
  },
  metadata: JSON.stringify({
    settlementType: 'daily',
    processingTime: '2024-01-02T06:00:00Z',
    transactionIds: Array.from({ length: 100 }, (_, i) => `txn-${i}`)
  }),
  processedAt: new Date('2024-01-02T06:00:00Z'),
  createdAt: new Date('2024-01-01T23:59:59Z'),
  updatedAt: new Date('2024-01-02T06:00:00Z'),
  ...overrides
});

// Mock payment dispute data
export const createMockPaymentDispute = (overrides: Partial<any> = {}) => ({
  id: 'dispute-test-123',
  paymentTransactionId: 'transaction-test-123',
  userId: 'user-test-123',
  schoolId: 'school-test-123',
  gatewayDisputeId: 'disp_test_razorpay_123',
  amount: 15000,
  currency: Currency.INR,
  reason: 'fraud',
  status: 'open',
  phase: 'chargeback',
  evidence: JSON.stringify({
    customerCommunication: 'Email thread with customer',
    serviceDocumentation: 'Proof of service delivery',
    shippingDocumentation: 'Not applicable for digital service'
  }),
  dueBy: new Date('2024-01-15T23:59:59Z'),
  respondBy: new Date('2024-01-10T23:59:59Z'),
  gatewayNotifiedAt: new Date('2024-01-05T10:00:00Z'),
  resolvedAt: null,
  resolution: null,
  metadata: JSON.stringify({
    customerReason: 'Did not receive the service',
    riskScore: 'low',
    previousDisputes: 0
  }),
  createdAt: new Date('2024-01-05T10:00:00Z'),
  updatedAt: new Date('2024-01-05T10:00:00Z'),
  ...overrides
});

// Mock payment plan comparison data
export const mockPaymentPlanComparisons = {
  plans: [
    createMockPaymentPlan({
      id: 'plan-basic-123',
      name: 'Basic Plan',
      amount: 49900, // 499 INR
      features: ['feature1', 'feature2']
    }),
    createMockPaymentPlan({
      id: 'plan-premium-123',
      name: 'Premium Plan',
      amount: 99900, // 999 INR
      features: ['feature1', 'feature2', 'feature3', 'feature4']
    }),
    createMockPaymentPlan({
      id: 'plan-enterprise-123',
      name: 'Enterprise Plan',
      amount: 199900, // 1999 INR
      features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']
    })
  ],
  
  comparison: {
    mostPopular: 'plan-premium-123',
    bestValue: 'plan-premium-123',
    recommended: 'plan-premium-123'
  }
};

// Mock payment gateway health check
export const createMockGatewayHealthCheck = (overrides: Partial<any> = {}) => ({
  gateway: PaymentGateway.RAZORPAY,
  status: 'healthy',
  responseTime: 150, // milliseconds
  lastChecked: new Date('2024-01-01T12:00:00Z'),
  uptime: 99.98,
  errorRate: 0.02,
  metrics: {
    avgResponseTime: 145,
    maxResponseTime: 2000,
    minResponseTime: 50,
    timeoutRate: 0.01,
    successRate: 99.98
  },
  endpoints: {
    createOrder: { status: 'healthy', responseTime: 120 },
    capturePayment: { status: 'healthy', responseTime: 180 },
    createRefund: { status: 'healthy', responseTime: 200 },
    webhooks: { status: 'healthy', responseTime: 50 }
  },
  ...overrides
});

// Mock payment gateway error responses
export const mockGatewayErrors = {
  invalidRequest: {
    error: {
      code: 'BAD_REQUEST_ERROR',
      description: 'The request is not valid',
      source: 'business',
      step: 'payment_initiation',
      reason: 'invalid_request',
      metadata: {
        field: 'amount',
        value: 'invalid'
      }
    }
  },
  
  gatewayError: {
    error: {
      code: 'GATEWAY_ERROR',
      description: 'Payment processing failed',
      source: 'gateway',
      step: 'payment_processing',
      reason: 'gateway_unavailable'
    }
  },
  
  serverError: {
    error: {
      code: 'SERVER_ERROR',
      description: 'Something went wrong',
      source: 'internal',
      step: 'internal_processing',
      reason: 'server_error'
    }
  }
};

// Test helper functions
export const resetAllMocks = (): void => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export const setupPaymentMocks = (): void => {
  // Setup common mock implementations
  jest.mock('razorpay', () => ({
    orders: {
      create: jest.fn().mockResolvedValue(mockRazorpayResponses.createOrder),
      fetch: jest.fn().mockResolvedValue(mockRazorpayResponses.createOrder)
    },
    payments: {
      capture: jest.fn().mockResolvedValue(mockRazorpayResponses.capturePayment),
      fetch: jest.fn().mockResolvedValue(mockRazorpayResponses.capturePayment)
    },
    customers: {
      create: jest.fn().mockResolvedValue(mockRazorpayResponses.createCustomer)
    },
    refunds: {
      create: jest.fn().mockResolvedValue(mockRazorpayResponses.createRefund)
    }
  }));
};

export const setupDatabaseMocks = (): void => {
  // Mock database operations
  const mockDb = {
    paymentMethod: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    paymentTransaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };

  jest.mock('../../src/lib/database', () => ({
    db: mockDb
  }));
};

// Mock environment variables for testing
export const mockEnvVars = {
  RAZORPAY_KEY_ID: 'rzp_test_123456789',
  RAZORPAY_KEY_SECRET: 'test_secret_key_123',
  RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret_123',
  PAYMENT_CURRENCY: 'INR',
  PAYMENT_TIMEOUT: '300000',
  MAX_PAYMENT_RETRIES: '3',
  PAYMENT_SUCCESS_URL: 'https://example.com/payment/success',
  PAYMENT_FAILURE_URL: 'https://example.com/payment/failure'
};

// Setup test environment
export const setupTestEnvironment = (): void => {
  // Set environment variables
  Object.entries(mockEnvVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Setup mocks
  setupPaymentMocks();
  setupDatabaseMocks();
  
  // Mock console methods to reduce test noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
};

// Cleanup test environment
export const cleanupTestEnvironment = (): void => {
  // Reset environment variables
  Object.keys(mockEnvVars).forEach(key => {
    delete process.env[key];
  });
  
  // Reset all mocks
  resetAllMocks();
  
  // Restore console methods
  jest.restoreAllMocks();
};

// Mock date utilities for consistent testing
export const mockDateUtils = {
  now: new Date('2024-01-01T12:00:00Z'),
  tomorrow: new Date('2024-01-02T12:00:00Z'),
  yesterday: new Date('2023-12-31T12:00:00Z'),
  nextWeek: new Date('2024-01-08T12:00:00Z'),
  nextMonth: new Date('2024-02-01T12:00:00Z'),
  
  // Helper to create dates relative to mock "now"
  addDays: (days: number): Date => {
    const date = new Date(mockDateUtils.now);
    date.setDate(date.getDate() + days);
    return date;
  },
  
  addHours: (hours: number): Date => {
    const date = new Date(mockDateUtils.now);
    date.setHours(date.getHours() + hours);
    return date;
  },
  
  addMinutes: (minutes: number): Date => {
    const date = new Date(mockDateUtils.now);
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }
};

// Setup mock timers
export const setupMockTimers = (): void => {
  jest.useFakeTimers();
  jest.setSystemTime(mockDateUtils.now);
};

export const cleanupMockTimers = (): void => {
  jest.useRealTimers();
};

// Export all for easy testing
export * from './payment-mocks';

// Default export for convenience
export default {
  createMockUser,
  createMockSchool,
  createMockPaymentMethod,
  createMockUPIPaymentMethod,
  createMockWalletPaymentMethod,
  createMockPaymentOrder,
  createMockPaymentTransaction,
  createMockFailedPaymentTransaction,
  createMockOrder,
  createMockRFIDTag,
  createMockPaymentRetry,
  createMockPaymentPlan,
  createMockSubscription,
  createMockTrialSubscription,
  createMockCancelledSubscription,
  createMockSuspendedSubscription,
  createMockSubscriptionPlan,
  createMockBillingCycle,
  createMockDunningConfig,
  createMockSubscriptionAnalytics,
  createMockRefund,
  createMockPaymentAnalytics,
  createMockAPIGatewayEvent,
  createMockLambdaContext,
  createMockAuthResult,
  createMockUnauthResult,
  createMockPaymentFormData,
  createMockUPIFormData,
  createMockWalletFormData,
  createMockGatewayHealthCheck,
  createMockRFIDTransaction,
  createMockRFIDTopUpTransaction,
  createMockPaymentSettlement,
  createMockPaymentDispute,
  generateMultiplePaymentMethods,
  generateMultipleTransactions,
  generateMultipleRetries,
  generateMultipleSubscriptions,
  generateMultipleBillingCycles,
  generatePaymentAnalyticsData,
  generateMockWebhookSignature,
  mockRazorpayResponses,
  mockWebhookPayloads,
  mockErrors,
  mockValidationResponses,
  mockPaymentFlowStates,
  mockSubscriptionEvents,
  mockPaymentAnalyticsAggregations,
  mockGatewayErrors,
  mockPaymentPlanComparisons,
  mockDateUtils,
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupMockTimers,
  cleanupMockTimers,
  resetAllMocks,
  setupPaymentMocks,
  setupDatabaseMocks
};