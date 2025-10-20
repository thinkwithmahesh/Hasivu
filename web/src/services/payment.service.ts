// Production-level Payment Service for HASIVU Platform
// Maps all payment-related backend API endpoints to TypeScript service methods
// Razorpay integration with comprehensive error handling and type safety

import apiClient from './api';

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Generic API response wrapper
 */
interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Razorpay Order - Created when initiating payment
 */
interface RazorpayOrder {
  id: string; // Razorpay order ID (order_xxx)
  entity: 'order';
  amount: number; // Amount in paise (100 paise = 1 INR)
  amount_paid: number;
  amount_due: number;
  currency: string; // e.g., 'INR'
  receipt: string; // Custom receipt ID
  status: 'created' | 'attempted' | 'paid';
  attempts: number;
  notes: Record<string, string>;
  created_at: number; // Unix timestamp
}

/**
 * Payment creation request
 */
interface CreatePaymentRequest {
  orderId: string; // Internal order ID
  amount: number; // Amount in INR
  currency?: string; // Default: 'INR'
  receipt?: string; // Custom receipt ID
  notes?: Record<string, string>; // Additional metadata
}

/**
 * Payment creation response
 */
interface CreatePaymentResponse {
  razorpayOrder: RazorpayOrder;
  keyId: string; // Razorpay key ID for frontend
  orderDetails: {
    orderId: string;
    amount: number;
    currency: string;
  };
}

/**
 * Payment verification request
 */
interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Payment verification response
 */
interface VerifyPaymentResponse {
  verified: boolean;
  paymentId: string;
  orderId: string;
  status: 'success' | 'failed';
  transactionId?: string;
}

/**
 * Payment status response
 */
interface PaymentStatus {
  orderId: string;
  paymentId?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  method?: string; // card, netbanking, upi, wallet
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

/**
 * Refund request
 */
interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund amount (if not provided, full refund)
  notes?: Record<string, string>;
  reason?: string;
}

/**
 * Refund response
 */
interface RefundResponse {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  createdAt: string;
  notes?: Record<string, string>;
}

/**
 * Payment retry request
 */
interface RetryPaymentRequest {
  orderId: string;
  paymentId?: string;
  retryReason?: string;
}

/**
 * Payment retry response
 */
interface RetryPaymentResponse {
  newOrderId: string;
  razorpayOrder: RazorpayOrder;
  retryAttempt: number;
  maxRetries: number;
}

/**
 * Wallet details
 */
interface Wallet {
  id: string;
  userId: string;
  balance: number; // Available balance
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Wallet creation request
 */
interface CreateWalletRequest {
  userId: string;
  initialBalance?: number;
  currency?: string;
}

/**
 * Wallet recharge request
 */
interface RechargeWalletRequest {
  walletId: string;
  amount: number;
  paymentMethod: 'razorpay' | 'card' | 'netbanking' | 'upi';
}

/**
 * Wallet recharge response
 */
interface RechargeWalletResponse {
  walletId: string;
  transactionId: string;
  amount: number;
  newBalance: number;
  razorpayOrder?: RazorpayOrder; // If payment gateway is used
}

/**
 * Transaction record
 */
interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'wallet_recharge' | 'wallet_debit';
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paymentId?: string;
  orderId?: string;
  walletId?: string;
  method?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transaction list query parameters
 */
interface TransactionListParams {
  userId?: string;
  type?: 'payment' | 'refund' | 'wallet_recharge' | 'wallet_debit';
  status?: 'pending' | 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Transaction receipt
 */
interface TransactionReceipt {
  transactionId: string;
  receiptNumber: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  itemDetails?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  pdfUrl?: string; // URL to download PDF receipt
}

/**
 * Payment method details
 */
interface PaymentMethod {
  id: string;
  type: 'card' | 'netbanking' | 'upi' | 'wallet';
  provider?: string; // e.g., 'visa', 'paytm', 'phonepe'
  last4?: string; // Last 4 digits for cards
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'blocked';
  createdAt: string;
}

/**
 * Webhook payload from Razorpay
 */
interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: unknown;
    };
    order?: {
      entity: unknown;
    };
    refund?: {
      entity: unknown;
    };
  };
  created_at: number;
}

// ============================================================================
// Payment API - Core payment operations
// ============================================================================

export const paymentApi = {
  /**
   * Create a new Razorpay order for payment
   * @param paymentData - Payment creation request data
   * @returns Razorpay order details with key ID for frontend
   */
  createOrder: async (
    paymentData: CreatePaymentRequest
  ): Promise<ApiResponse<CreatePaymentResponse>> => {
    const response = await apiClient.post('/payments/orders', paymentData);
    return response.data;
  },

  /**
   * Verify payment signature after successful payment
   * @param verificationData - Razorpay verification data (order_id, payment_id, signature)
   * @returns Verification result with payment status
   */
  verifyPayment: async (
    verificationData: VerifyPaymentRequest
  ): Promise<ApiResponse<VerifyPaymentResponse>> => {
    const response = await apiClient.post('/payments/verify', verificationData);
    return response.data;
  },

  /**
   * Get payment status by order ID
   * @param orderId - Order ID to check status
   * @returns Current payment status
   */
  getPaymentStatus: async (orderId: string): Promise<ApiResponse<PaymentStatus>> => {
    const response = await apiClient.get(`/payments/status/${orderId}`);
    return response.data;
  },

  /**
   * Process payment refund
   * @param refundData - Refund request data (payment ID, amount, reason)
   * @returns Refund details and status
   */
  processRefund: async (refundData: RefundRequest): Promise<ApiResponse<RefundResponse>> => {
    const response = await apiClient.post('/payments/refund', refundData);
    return response.data;
  },

  /**
   * Retry failed payment
   * @param retryData - Retry request data (order ID, payment ID)
   * @returns New Razorpay order for retry attempt
   */
  retryPayment: async (
    retryData: RetryPaymentRequest
  ): Promise<ApiResponse<RetryPaymentResponse>> => {
    const response = await apiClient.post('/payments/retry', retryData);
    return response.data;
  },

  /**
   * Handle Razorpay webhook (internal use - typically called by Razorpay servers)
   * Note: This endpoint should be secured and verified using webhook secret
   * @param webhookPayload - Razorpay webhook payload
   * @returns Acknowledgment of webhook processing
   */
  handleWebhook: async (
    webhookPayload: RazorpayWebhookPayload
  ): Promise<ApiResponse<{ processed: boolean }>> => {
    const response = await apiClient.post('/payments/webhook', webhookPayload);
    return response.data;
  },

  /**
   * Get payment methods for user
   * @returns List of saved payment methods
   */
  getPaymentMethods: async (): Promise<ApiResponse<PaymentMethod[]>> => {
    const response = await apiClient.get('/payments/methods');
    return response.data;
  },

  /**
   * Add new payment method
   * @param methodData - Payment method details
   * @returns Created payment method
   */
  addPaymentMethod: async (
    methodData: Omit<PaymentMethod, 'id' | 'createdAt' | 'status'>
  ): Promise<ApiResponse<PaymentMethod>> => {
    const response = await apiClient.post('/payments/methods', methodData);
    return response.data;
  },

  /**
   * Update payment method
   * @param methodId - Payment method ID
   * @param updateData - Updated payment method data
   * @returns Updated payment method
   */
  updatePaymentMethod: async (
    methodId: string,
    updateData: Partial<PaymentMethod>
  ): Promise<ApiResponse<PaymentMethod>> => {
    const response = await apiClient.put(`/payments/methods/${methodId}`, updateData);
    return response.data;
  },

  /**
   * Delete payment method
   * @param methodId - Payment method ID to delete
   * @returns Deletion confirmation
   */
  deletePaymentMethod: async (methodId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/payments/methods/${methodId}`);
    return response.data;
  },
};

// ============================================================================
// Wallet API - Wallet management operations
// ============================================================================

export const walletApi = {
  /**
   * Create a new wallet for user
   * @param walletData - Wallet creation request
   * @returns Created wallet details
   */
  createWallet: async (walletData: CreateWalletRequest): Promise<ApiResponse<Wallet>> => {
    const response = await apiClient.post('/wallet/create', walletData);
    return response.data;
  },

  /**
   * Get wallet balance for user
   * @param userId - User ID (optional, defaults to authenticated user)
   * @returns Wallet details with current balance
   */
  getWalletBalance: async (userId?: string): Promise<ApiResponse<Wallet>> => {
    const params = userId ? { userId } : {};
    const response = await apiClient.get('/wallet/balance', { params });
    return response.data;
  },

  /**
   * Recharge wallet with specified amount
   * @param rechargeData - Wallet recharge request
   * @returns Recharge transaction details and new balance
   */
  rechargeWallet: async (
    rechargeData: RechargeWalletRequest
  ): Promise<ApiResponse<RechargeWalletResponse>> => {
    const response = await apiClient.post('/wallet/recharge', rechargeData);
    return response.data;
  },
};

// ============================================================================
// Transaction API - Transaction history and receipts
// ============================================================================

export const transactionApi = {
  /**
   * Get transaction history with filtering
   * @param params - Query parameters for filtering transactions
   * @returns List of transactions with pagination
   */
  getTransactions: async (
    params?: TransactionListParams
  ): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  },

  /**
   * Get transaction receipt
   * @param transactionId - Transaction ID
   * @returns Transaction receipt with details
   */
  getTransactionReceipt: async (
    transactionId: string
  ): Promise<ApiResponse<TransactionReceipt>> => {
    const response = await apiClient.get(`/transactions/${transactionId}/receipt`);
    return response.data;
  },

  /**
   * Download transaction receipt as PDF
   * @param transactionId - Transaction ID
   * @returns PDF blob for download
   */
  downloadReceipt: async (transactionId: string): Promise<Blob> => {
    const response = await apiClient.get(`/transactions/${transactionId}/receipt`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });
    return response.data;
  },
};

// ============================================================================
// Advanced Payment Features (Epic 5 Story 5.1)
// ============================================================================

export const advancedPaymentApi = {
  /**
   * Create advanced payment with custom options
   * @param paymentData - Advanced payment creation data
   * @returns Payment creation result
   */
  createAdvancedPayment: async (
    paymentData: CreatePaymentRequest & {
      installments?: number;
      recurring?: boolean;
      recurringInterval?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<ApiResponse<CreatePaymentResponse>> => {
    const response = await apiClient.post('/payments/advanced/create', paymentData);
    return response.data;
  },

  /**
   * Validate payment before processing
   * @param validationData - Payment validation data
   * @returns Validation result
   */
  validatePayment: async (validationData: {
    amount: number;
    currency: string;
    method: string;
  }): Promise<
    ApiResponse<{
      valid: boolean;
      errors?: string[];
      warnings?: string[];
    }>
  > => {
    const response = await apiClient.post('/payments/advanced/validate', validationData);
    return response.data;
  },

  /**
   * Create installment payment plan
   * @param installmentData - Installment plan data
   * @returns Installment plan details
   */
  createInstallmentPlan: async (installmentData: {
    orderId: string;
    totalAmount: number;
    numberOfInstallments: number;
    frequency: 'weekly' | 'monthly';
  }): Promise<
    ApiResponse<{
      planId: string;
      installments: Array<{
        installmentNumber: number;
        amount: number;
        dueDate: string;
        status: 'pending' | 'paid';
      }>;
    }>
  > => {
    const response = await apiClient.post('/payments/advanced/installment', installmentData);
    return response.data;
  },

  /**
   * Get advanced payment details
   * @param paymentId - Payment ID
   * @returns Advanced payment details
   */
  getAdvancedPayment: async (
    paymentId: string
  ): Promise<
    ApiResponse<{
      paymentId: string;
      details: Record<string, unknown>;
    }>
  > => {
    const response = await apiClient.get(`/payments/advanced/${paymentId}`);
    return response.data;
  },
};

// ============================================================================
// Payment Retry & Recovery (Epic 5 Story 5.1)
// ============================================================================

export const paymentRetryApi = {
  /**
   * Schedule payment retry for later
   * @param scheduleData - Retry schedule data
   * @returns Scheduled retry details
   */
  scheduleRetry: async (scheduleData: {
    paymentId: string;
    retryAt: string; // ISO date string
    maxAttempts?: number;
  }): Promise<
    ApiResponse<{
      retryId: string;
      scheduledAt: string;
      status: 'scheduled';
    }>
  > => {
    const response = await apiClient.post('/payments/retry/schedule', scheduleData);
    return response.data;
  },

  /**
   * Process scheduled retries (internal/admin use)
   * @returns Processing result
   */
  processScheduledRetries: async (): Promise<
    ApiResponse<{
      processed: number;
      successful: number;
      failed: number;
    }>
  > => {
    const response = await apiClient.post('/payments/retry/process-scheduled');
    return response.data;
  },

  /**
   * Get retry history for payment
   * @param paymentId - Payment ID
   * @returns Retry history
   */
  getRetryHistory: async (
    paymentId: string
  ): Promise<
    ApiResponse<
      Array<{
        retryId: string;
        attemptNumber: number;
        attemptedAt: string;
        status: 'success' | 'failed';
        failureReason?: string;
      }>
    >
  > => {
    const response = await apiClient.get(`/payments/retry/${paymentId}`);
    return response.data;
  },

  /**
   * Cancel scheduled retry
   * @param retryId - Retry schedule ID
   * @returns Cancellation confirmation
   */
  cancelScheduledRetry: async (retryId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/payments/retry/${retryId}`);
    return response.data;
  },
};

// ============================================================================
// Payment Analytics (Epic 5 Story 5.1)
// ============================================================================

export const paymentAnalyticsApi = {
  /**
   * Get payment analytics dashboard
   * @param params - Query parameters (date range, filters)
   * @returns Payment analytics dashboard data
   */
  getDashboard: async (params?: {
    startDate?: string;
    endDate?: string;
    schoolId?: string;
  }): Promise<
    ApiResponse<{
      totalRevenue: number;
      totalTransactions: number;
      successRate: number;
      averageTransactionValue: number;
      topPaymentMethods: Array<{ method: string; count: number; percentage: number }>;
      dailyTrends: Array<{ date: string; revenue: number; transactions: number }>;
    }>
  > => {
    const response = await apiClient.get('/payments/analytics/dashboard', { params });
    return response.data;
  },

  /**
   * Get payment trends analysis
   * @param params - Query parameters
   * @returns Payment trends data
   */
  getTrends: async (params?: {
    period?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get('/payments/analytics/trends', { params });
    return response.data;
  },

  /**
   * Get payment failure analysis
   * @returns Failure analysis data
   */
  getFailureAnalysis: async (): Promise<
    ApiResponse<{
      totalFailures: number;
      failureRate: number;
      topReasons: Array<{ reason: string; count: number; percentage: number }>;
      recommendations: string[];
    }>
  > => {
    const response = await apiClient.get('/payments/analytics/failure-analysis');
    return response.data;
  },

  /**
   * Get customer payment behavior analysis
   * @param params - Query parameters
   * @returns Customer behavior insights
   */
  getCustomerBehavior: async (params?: {
    schoolId?: string;
    period?: string;
  }): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get('/payments/analytics/customer-behavior', { params });
    return response.data;
  },

  /**
   * Get school-specific payment analytics
   * @param schoolId - School ID
   * @returns School payment analytics
   */
  getSchoolAnalytics: async (schoolId: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get(`/payments/analytics/${schoolId}`);
    return response.data;
  },

  /**
   * Generate custom payment report
   * @param reportData - Report generation parameters
   * @returns Generated report
   */
  generateReport: async (reportData: {
    reportType: 'summary' | 'detailed' | 'reconciliation';
    startDate: string;
    endDate: string;
    format?: 'pdf' | 'excel' | 'csv';
  }): Promise<ApiResponse<{ reportUrl: string; expiresAt: string }>> => {
    const response = await apiClient.post('/payments/analytics/generate-report', reportData);
    return response.data;
  },

  /**
   * Update customer payment behavior data
   * @param behaviorData - Behavior update data
   * @returns Update confirmation
   */
  updateBehaviorData: async (behaviorData: {
    customerId: string;
    behaviors: Record<string, unknown>;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/payments/analytics/update-behavior', behaviorData);
    return response.data;
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert amount from INR to paise (Razorpay format)
 * @param amountInRupees - Amount in Indian Rupees
 * @returns Amount in paise
 */
export const convertToPaise = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100);
};

/**
 * Convert amount from paise to INR
 * @param amountInPaise - Amount in paise
 * @returns Amount in Indian Rupees
 */
export const convertToRupees = (amountInPaise: number): number => {
  return amountInPaise / 100;
};

/**
 * Format currency for display
 * @param amount - Amount in INR
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Validate Razorpay signature (client-side verification helper)
 * Note: Actual signature verification MUST be done on the backend
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Razorpay signature
 * @returns Verification data ready for backend
 */
export const prepareVerificationData = (
  orderId: string,
  paymentId: string,
  signature: string
): VerifyPaymentRequest => {
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  };
};

// ============================================================================
// Export all interfaces for use in components
// ============================================================================

export type {
  ApiResponse,
  RazorpayOrder,
  CreatePaymentRequest,
  CreatePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentStatus,
  RefundRequest,
  RefundResponse,
  RetryPaymentRequest,
  RetryPaymentResponse,
  Wallet,
  CreateWalletRequest,
  RechargeWalletRequest,
  RechargeWalletResponse,
  Transaction,
  TransactionListParams,
  TransactionReceipt,
  PaymentMethod,
  RazorpayWebhookPayload,
};

// Default export
export default {
  payment: paymentApi,
  wallet: walletApi,
  transaction: transactionApi,
  advanced: advancedPaymentApi,
  retry: paymentRetryApi,
  analytics: paymentAnalyticsApi,
};
