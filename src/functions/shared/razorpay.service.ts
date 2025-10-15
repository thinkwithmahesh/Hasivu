/**
 * HASIVU Platform - Razorpay Payment Service
 * Centralized Razorpay SDK integration with security measures
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface RazorpayOrderOptions {
  amount: number; // Amount in paise
  currency: string;
  receipt: string;
  payment_capture?: boolean;
  notes?: Record<string, string>;
}

// Use any for Razorpay types to avoid complex type issues
export type RazorpayOrder = any;
export type RazorpayPayment = any;
export type RazorpayRefund = any;

export class RazorpayService {
  private static instance: RazorpayService;
  private razorpay: Razorpay;
  private readonly keySecret: string;

  private constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !this.keySecret) {
      throw new Error(
        'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
      );
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: this.keySecret,
    });

    logger.info('Razorpay service initialized successfully');
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Create a new payment order
   */
  async createOrder(options: RazorpayOrderOptions): Promise<RazorpayOrder> {
    try {
      logger.info('Creating Razorpay order', {
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
      });

      const order = await this.razorpay.orders.create({
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        payment_capture: options.payment_capture ?? true,
        notes: options.notes || {},
      });

      logger.info('Razorpay order created successfully', {
        orderId: order.id,
        amount: order.amount,
        status: order.status,
      });

      return order;
    } catch (error) {
      logger.error('Failed to create Razorpay order', error as Error, {
        amount: options.amount,
        currency: options.currency,
      });
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Fetch payment details by ID
   */
  async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Failed to fetch Razorpay payment', error as Error, { paymentId });
      throw new Error('Payment not found');
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string = 'INR'
  ): Promise<RazorpayPayment> {
    try {
      logger.info('Capturing Razorpay payment', { paymentId, amount, currency });

      const payment = await this.razorpay.payments.capture(paymentId, amount, currency);

      logger.info('Payment captured successfully', {
        paymentId,
        amount: payment.amount,
        status: payment.status,
      });

      return payment;
    } catch (error) {
      logger.error('Failed to capture payment', error as Error, { paymentId, amount });
      throw new Error('Failed to capture payment');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    options: {
      amount?: number;
      notes?: Record<string, string>;
      receipt?: string;
      speed?: 'normal' | 'optimum';
    } = {}
  ): Promise<RazorpayRefund> {
    try {
      logger.info('Creating Razorpay refund', { paymentId, amount: options.amount });

      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: options.amount,
        notes: options.notes || {},
        receipt: options.receipt,
        speed: options.speed || 'normal',
      });

      logger.info('Refund created successfully', {
        refundId: refund.id,
        paymentId,
        amount: refund.amount,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund', error as Error, { paymentId });
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Fetch refund details
   */
  async fetchRefund(refundId: string): Promise<RazorpayRefund> {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      logger.error('Failed to fetch refund', error as Error, { refundId });
      throw new Error('Refund not found');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string = this.keySecret
  ): boolean {
    try {
      const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      logger.error('Webhook signature verification failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Generate signature for payment verification
   */
  generateSignature(orderId: string, paymentId: string, secret: string = this.keySecret): string {
    const sign = crypto.createHmac('sha256', secret);
    sign.update(`${orderId}|${paymentId}`);
    return sign.digest('hex');
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    secret: string = this.keySecret
  ): boolean {
    try {
      const expectedSignature = this.generateSignature(orderId, paymentId, secret);
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      logger.error('Payment signature verification failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get Razorpay instance (for advanced operations)
   */
  getRazorpayInstance(): Razorpay {
    return this.razorpay;
  }

  /**
   * Validate Razorpay configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.RAZORPAY_KEY_ID) {
      errors.push('RAZORPAY_KEY_ID environment variable is not set');
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      errors.push('RAZORPAY_KEY_SECRET environment variable is not set');
    }

    if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
      errors.push('RAZORPAY_KEY_ID appears to be invalid (should start with rzp_)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const razorpayService = RazorpayService.getInstance();
