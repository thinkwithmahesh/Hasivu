/**
 * Mock Payment Processor
 * 
 * Comprehensive mock implementation for payment processing operations
 * used in load testing and integration testing scenarios.
 */

import { PaymentStatus, OrderStatus } from '../../src/types/index';

export interface PaymentProcessorResult {
  success: boolean;
  payment?: any;
  message?: string;
  error?: string;
  transactionId?: string;
  paymentId?: string;
}

export interface PaymentProcessorConfig {
  successRate?: number; // 0-1, default 0.95
  averageResponseTime?: number; // milliseconds, default 500
  maxResponseTime?: number; // milliseconds, default 2000
  enableRandomFailures?: boolean; // default true
  enableNetworkDelay?: boolean; // default true
}

export class MockPaymentProcessor {
  private config: Required<PaymentProcessorConfig>;
  private processedPayments: Map<string, any> = new Map();
  private paymentCounter = 0;

  constructor(config: Partial<PaymentProcessorConfig> = {}) {
    this.config = {
      successRate: config.successRate ?? 0.95,
      averageResponseTime: config.averageResponseTime ?? 500,
      maxResponseTime: config.maxResponseTime ?? 2000,
      enableRandomFailures: config.enableRandomFailures ?? true,
      enableNetworkDelay: config.enableNetworkDelay ?? true,
      ...config
    };
  }

  /**
   * Process a payment order
   */
  async processPayment(orderData: any): Promise<PaymentProcessorResult> {
    // Simulate network delay
    if (this.config.enableNetworkDelay) {
      await this.simulateNetworkDelay();
    }

    const paymentId = `mock_payment_${++this.paymentCounter}_${Date.now()}`;
    const transactionId = `mock_txn_${this.paymentCounter}_${Date.now()}`;

    // Simulate random failures based on success rate
    const shouldSucceed = this.config.enableRandomFailures 
      ? Math.random() < this.config.successRate
      : true;

    if (!shouldSucceed) {
      const failureReason = this.getRandomFailureReason();
      return {
        success: false,
        error: failureReason,
        message: `Payment processing failed: ${failureReason}`,
        transactionId
      };
    }

    // Create successful payment record
    const payment = {
      id: paymentId,
      transactionId,
      orderId: orderData.orderId || orderData.id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      status: 'completed' as PaymentStatus,
      method: orderData.paymentMethodId || 'card',
      gateway: 'mock_gateway',
      gatewayPaymentId: paymentId,
      gatewayTransactionId: transactionId,
      processedAt: new Date(),
      metadata: {
        customerName: orderData.customerName || 'Mock Customer',
        orderType: 'load_test',
        processor: 'MockPaymentProcessor'
      }
    };

    // Store payment record
    this.processedPayments.set(paymentId, payment);

    return {
      success: true,
      payment,
      transactionId,
      paymentId,
      message: 'Payment processed successfully'
    };
  }

  /**
   * Create a payment record (alternative method name)
   */
  async createPaymentRecord(orderData: any): Promise<PaymentProcessorResult> {
    return this.processPayment(orderData);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<PaymentProcessorResult> {
    if (this.config.enableNetworkDelay) {
      await this.simulateNetworkDelay();
    }

    const payment = this.processedPayments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${paymentId} not found`
      };
    }

    // Update payment status
    payment.status = status;
    payment.updatedAt = new Date();

    this.processedPayments.set(paymentId, payment);

    return {
      success: true,
      payment,
      paymentId,
      message: `Payment status updated to ${status}`
    };
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentProcessorResult> {
    if (this.config.enableNetworkDelay) {
      await this.simulateNetworkDelay();
    }

    const payment = this.processedPayments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${paymentId} not found`
      };
    }

    return {
      success: true,
      payment,
      paymentId,
      message: 'Payment retrieved successfully'
    };
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentProcessorResult> {
    if (this.config.enableNetworkDelay) {
      await this.simulateNetworkDelay();
    }

    const payment = this.processedPayments.get(paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${paymentId} not found`
      };
    }

    const refundAmount = amount || payment.amount;
    const refundId = `mock_refund_${Date.now()}`;

    // Simulate occasional refund failures
    const shouldSucceed = Math.random() < 0.98; // 98% success rate for refunds

    if (!shouldSucceed) {
      return {
        success: false,
        error: 'refund_failed',
        message: 'Refund processing failed due to gateway error'
      };
    }

    const refund = {
      id: refundId,
      paymentId,
      amount: refundAmount,
      currency: payment.currency,
      status: 'processed',
      reason: reason || 'Customer requested refund',
      processedAt: new Date(),
      gatewayRefundId: refundId
    };

    // Update original payment
    payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
    payment.refundStatus = payment.refundedAmount >= payment.amount ? 'full' : 'partial';
    payment.updatedAt = new Date();

    this.processedPayments.set(paymentId, payment);

    return {
      success: true,
      payment: refund,
      transactionId: refundId,
      message: 'Refund processed successfully'
    };
  }

  /**
   * Get payment statistics
   */
  getStatistics(): any {
    const payments = Array.from(this.processedPayments.values());
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'completed').length;
    const failedPayments = totalPayments - successfulPayments;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = payments.reduce((sum, p) => sum + (p.refundedAmount || 0), 0);

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      totalAmount,
      totalRefunded,
      netAmount: totalAmount - totalRefunded,
      averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
      processingStats: {
        averageResponseTime: this.config.averageResponseTime,
        maxResponseTime: this.config.maxResponseTime,
        successRate: this.config.successRate * 100
      }
    };
  }

  /**
   * Reset processor state
   */
  reset(): void {
    this.processedPayments.clear();
    this.paymentCounter = 0;
  }

  /**
   * Configure processor behavior
   */
  configure(config: Partial<PaymentProcessorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Simulate network delay
   */
  private async simulateNetworkDelay(): Promise<void> {
    const delay = Math.min(
      this.config.averageResponseTime + (Math.random() * 200 - 100), // ±100ms variance
      this.config.maxResponseTime
    );
    await new Promise(resolve => setTimeout(resolve, Math.max(delay, 50)));
  }

  /**
   * Get random failure reason for realistic testing
   */
  private getRandomFailureReason(): string {
    const reasons = [
      'insufficient_funds',
      'card_declined',
      'expired_card',
      'network_error',
      'gateway_timeout',
      'invalid_card_details',
      'authentication_failed',
      'daily_limit_exceeded',
      'blocked_card',
      'issuer_unavailable'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * Get all processed payments (for testing/debugging)
   */
  getAllPayments(): any[] {
    return Array.from(this.processedPayments.values());
  }

  /**
   * Check if payment exists
   */
  hasPayment(paymentId: string): boolean {
    return this.processedPayments.has(paymentId);
  }

  /**
   * Get payment count
   */
  getPaymentCount(): number {
    return this.processedPayments.size;
  }

  /**
   * Set failure rate for testing
   */
  setFailureRate(rate: number): void {
    this.config.successRate = 1 - rate;
  }

  /**
   * Set network delay for testing
   */
  setNetworkDelay(delay: number): void {
    this.config.averageResponseTime = delay;
    this.config.enableNetworkDelay = true;
  }

  /**
   * Set rate limit for testing (placeholder)
   */
  setRateLimit(limit: number): void {
    // This is a mock implementation, could be extended for rate limiting simulation
    console.log(`Rate limit set to ${limit} requests per second`);
  }
}