/**
 * Payment Gateway Service for HASIVU Platform
 * Handles payment processing, gateway integration, and transaction management
 */

import { DatabaseService } from './database.service';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, BusinessLogicError } from '../utils/errors';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  provider: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, any>;
  amount: number;
  currency: string;
  fees?: number;
  netAmount?: number;
  processedAt?: Date;
  failureReason?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  processedAt?: Date;
  gatewayRefundId?: string;
}

export interface WebhookPayload {
  event: string;
  transactionId: string;
  gatewayTransactionId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  signature: string;
  data: Record<string, any>;
}

export class PaymentGatewayService {
  private static instance: PaymentGatewayService;
  private db = DatabaseService.getInstance();
  private logger = logger;

  private constructor() {}

  public static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  /**
   * Process a payment request
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const user = await this.db.client.user.findUnique({
        where: { id: request.userId },
      });

      if (!user) {
        throw new NotFoundError('User', request.userId);
      }

      const order = await this.db.client.order.findUnique({
        where: { id: request.orderId },
      });

      if (!order) {
        throw new NotFoundError('Order', request.orderId);
      }

      if (order.totalAmount !== request.amount) {
        throw new BusinessLogicError(
          'Payment amount does not match order amount',
          'amount_mismatch'
        );
      }

      // Create payment record
      const payment = await this.db.client.payment.create({
        data: {
          orderId: request.orderId,
          userId: request.userId,
          amount: request.amount,
          currency: request.currency,
          status: 'PENDING',
          paymentType: 'ORDER',
          paymentMethodId: request.paymentMethodId,
        },
      });

      // Process with gateway
      const gatewayResponse = await this.processWithGateway(payment, request);

      // Update payment status
      const updatedPayment = await this.db.client.payment.update({
        where: { id: payment.id },
        data: {
          status: (gatewayResponse.status || 'pending').toUpperCase(),
          razorpayPaymentId: gatewayResponse.gatewayTransactionId,
          gatewayResponse: JSON.stringify(gatewayResponse.gatewayResponse || {}),
          paidAt: gatewayResponse.processedAt || new Date(),
          failureReason: gatewayResponse.failureReason,
        },
      });

      return {
        transactionId: updatedPayment.id,
        status: gatewayResponse.status || 'pending',
        gatewayTransactionId: gatewayResponse.gatewayTransactionId,
        gatewayResponse: gatewayResponse.gatewayResponse,
        amount: request.amount,
        currency: request.currency,
        fees: gatewayResponse.fees,
        netAmount: gatewayResponse.netAmount,
        processedAt: gatewayResponse.processedAt,
        failureReason: gatewayResponse.failureReason,
      };
    } catch (error: unknown) {
      this.logger.error('Error processing payment', error instanceof Error ? error : undefined, {
        request,
      });
      throw error;
    }
  }

  /**
   * Process refund request
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const payment = await this.db.client.payment.findUnique({
        where: { id: request.transactionId },
        include: { order: true },
      });

      if (!payment) {
        throw new NotFoundError('Payment', request.transactionId);
      }

      if (payment.status !== 'COMPLETED') {
        throw new BusinessLogicError(
          'Can only refund completed payments',
          'invalid_payment_status'
        );
      }

      const refundAmount = request.amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new BusinessLogicError(
          'Refund amount cannot exceed payment amount',
          'invalid_refund_amount'
        );
      }

      // Create refund record
      const refund = await this.db.client.paymentRefund.create({
        data: {
          paymentId: payment.id,
          amount: Math.round(refundAmount * 100), // Convert to paisa/cents
          currency: 'INR',
          reason: request.reason,
          status: 'PENDING',
          razorpayRefundId: `temp_${Date.now()}`, // Will be updated after gateway processing
          notes: JSON.stringify(request.metadata || {}),
        },
      });

      // Process refund with gateway
      const gatewayRefund = await this.processRefundWithGateway(payment, refund);

      // Update refund status
      const updatedRefund = await this.db.client.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: (gatewayRefund.status || 'pending').toUpperCase(),
          razorpayRefundId: gatewayRefund.gatewayRefundId || refund.razorpayRefundId,
          processedAt: gatewayRefund.processedAt,
        },
      });

      return {
        refundId: updatedRefund.id,
        status: gatewayRefund.status || 'pending',
        amount: refundAmount,
        processedAt: gatewayRefund.processedAt,
        gatewayRefundId: gatewayRefund.gatewayRefundId,
      };
    } catch (error: unknown) {
      this.logger.error('Error processing refund', error instanceof Error ? error : undefined, {
        request,
      });
      throw error;
    }
  }

  /**
   * Handle webhook notifications from payment gateway
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload)) {
        throw new ValidationError('Invalid webhook signature');
      }

      const payment = await this.db.client.payment.findFirst({
        where: {
          OR: [{ id: payload.transactionId }, { razorpayPaymentId: payload.gatewayTransactionId }],
        },
      });

      if (!payment) {
        this.logger.warn('Webhook received for unknown payment', { payload });
        return;
      }

      // Update payment status based on webhook
      await this.db.client.payment.update({
        where: { id: payment.id },
        data: {
          status: this.mapGatewayStatus(payload.status),
          gatewayResponse: {
            ...(payment.gatewayResponse as any),
            webhook: payload.data,
          },
          updatedAt: new Date(),
        },
      });

      // Handle status-specific actions
      await this.handleStatusUpdate(payment.id, payload.status, payload.event);

      this.logger.info('Webhook processed successfully', {
        transactionId: payment.id,
        event: payload.event,
        status: payload.status,
      });
    } catch (error: unknown) {
      this.logger.error('Error processing webhook', error instanceof Error ? error : undefined, {
        payload,
      });
      throw error;
    }
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await this.db.client.paymentMethod.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      return paymentMethods.map((pm: any) => this.mapToPaymentMethod(pm));
    } catch (error: unknown) {
      this.logger.error(
        'Error fetching payment methods',
        error instanceof Error ? error : undefined,
        { userId }
      );
      throw error;
    }
  }

  /**
   * Add payment method for user
   */
  async addPaymentMethod(
    userId: string,
    methodData: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    try {
      const user = await this.db.client.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // If this is the first payment method, make it default
      const existingMethods = await this.db.client.paymentMethod.count({
        where: { userId, isActive: true },
      });

      const paymentMethod = await this.db.client.paymentMethod.create({
        data: {
          userId,
          methodType: methodData.type || 'card',
          provider: methodData.provider || 'unknown',
          providerMethodId: `method_${Date.now()}`,
          cardLast4: methodData.last4,
          isDefault: existingMethods === 0 || methodData.isDefault || false,
          isActive: true,
        },
      });

      return this.mapToPaymentMethod(paymentMethod);
    } catch (error: unknown) {
      this.logger.error('Error adding payment method', error instanceof Error ? error : undefined, {
        userId,
        methodData,
      });
      throw error;
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0', 'amount');
    }

    if (!request.currency) {
      throw new ValidationError('Currency is required', 'currency');
    }

    if (!request.orderId) {
      throw new ValidationError('Order ID is required', 'orderId');
    }

    if (!request.userId) {
      throw new ValidationError('User ID is required', 'userId');
    }
  }

  /**
   * Process payment with gateway (mock implementation)
   */
  private async processWithGateway(
    payment: any,
    request: PaymentRequest
  ): Promise<Partial<PaymentResponse>> {
    // Mock gateway processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        status: 'completed',
        gatewayTransactionId: `gw_${Date.now()}`,
        gatewayResponse: {
          gateway: 'razorpay',
          method: 'card',
          network: 'Visa',
        },
        fees: Math.round(request.amount * 0.02), // 2% fee
        netAmount: Math.round(request.amount * 0.98),
        processedAt: new Date(),
      };
    } else {
      return {
        status: 'failed',
        failureReason: 'Payment declined by bank',
      };
    }
  }

  /**
   * Process refund with gateway (mock implementation)
   */
  private async processRefundWithGateway(
    _payment: any,
    _refund: any
  ): Promise<Partial<RefundResponse>> {
    // Mock refund processing
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      status: 'completed',
      gatewayRefundId: `rfnd_${Date.now()}`,
      processedAt: new Date(),
    };
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    // Mock signature verification
    return Boolean(payload.signature && payload.signature.length > 0);
  }

  /**
   * Map gateway status to internal status
   */
  private mapGatewayStatus(gatewayStatus: string): string {
    const statusMap: Record<string, string> = {
      created: 'PENDING',
      authorized: 'PROCESSING',
      captured: 'COMPLETED',
      failed: 'FAILED',
      cancelled: 'CANCELLED',
    };

    return statusMap[gatewayStatus] || 'PENDING';
  }

  /**
   * Handle status update actions
   */
  private async handleStatusUpdate(
    _paymentId: string,
    status: string,
    _event: string
  ): Promise<void> {
    switch (status) {
      case 'completed':
        // Update order status, send confirmation email, etc.
        break;
      case 'failed':
        // Handle payment failure, notify user, etc.
        break;
      case 'refunded':
        // Handle refund completion, update order, etc.
        break;
    }
  }

  /**
   * Map database record to PaymentMethod interface
   */
  private mapToPaymentMethod(record: any): PaymentMethod {
    return {
      id: record.id,
      type: record.type,
      provider: record.provider,
      last4: record.last4,
      expiryMonth: record.expiryMonth,
      expiryYear: record.expiryYear,
      isDefault: record.isDefault,
      isActive: record.isActive,
      metadata: record.metadata,
    };
  }
}
