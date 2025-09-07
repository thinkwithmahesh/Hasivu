/**
 * Payment Webhook Lambda Function
 * Handles: POST /payments/webhook
 * Implements Story 2.2: Payment Processing - Razorpay Webhook Handler
 * Security-hardened webhook handler with comprehensive validation
 * 
 * Features:
 * - Security-hardened signature verification with timing attack protection
 * - Rate limiting and DoS protection
 * - Comprehensive payload validation and replay attack prevention
 * - Multi-event webhook processing (payment authorized/captured/failed, refunds)
 * - Atomic database operations with transaction support
 * - Comprehensive error handling and security logging
 * - Timeout protection for webhook processing
 * - Production-ready monitoring and audit trail
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { LoggerService } from '../shared/logger.service';
import { ValidationService } from '../shared/validation.service';
import { LambdaDatabaseService } from '../shared/database.service';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import * as crypto from 'crypto';
import { z } from 'zod';

// Initialize services
const logger = LoggerService.getInstance();
const validator = ValidationService.getInstance();
const db = LambdaDatabaseService.getInstance();

/**
 * Razorpay webhook event types
 */
enum WebhookEventType {
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_CREATED = 'refund.created',
  REFUND_PROCESSED = 'refund.processed'
}

/**
 * Razorpay webhook payload interface
 */
interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: WebhookEventType;
  contains: string[];
  payload: {
    payment?: {
      entity: any;
    };
    order?: {
      entity: any;
    };
    refund?: {
      entity: any;
    };
  };
  created_at: number;
}

/**
 * Security configuration
 */
const WEBHOOK_CONFIG = {
  MAX_BODY_SIZE: 1024 * 1024, // 1MB
  PROCESSING_TIMEOUT: 25000, // 25 seconds
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100
};

/**
 * In-memory rate limiting (in production, use Redis or DynamoDB)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting check
 */
function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `webhook_${clientIP}`;
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitStore.set(key, { count: 1, resetTime: now + WEBHOOK_CONFIG.RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (current.count >= WEBHOOK_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  current.count++;
  return { allowed: true };
}

/**
 * Verify webhook signature with enhanced security and timing attack protection
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    if (!signature || !body) {
      logger.error('Missing signature or body for webhook verification');
      return false;
    }
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.length < 32) {
      logger.error('Razorpay webhook secret not configured or too short');
      return false;
    }
    
    // Validate signature format
    if (!signature.startsWith('sha256=') || signature.length !== 71) { // sha256= + 64 hex chars
      logger.error('Invalid signature format');
      return false;
    }
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex');
    
    // Extract provided signature (remove sha256= prefix)
    const providedSignature = signature.slice(7);
    
    // Use timing-safe comparison to prevent timing attacks
    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }
    
    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
    }
    
    const isValid = result === 0;
    if (!isValid) {
      logger.warn('Webhook signature verification failed', {
        expectedLength: expectedSignature.length,
        providedLength: providedSignature.length,
        signaturePrefix: signature.substring(0, 15) + '...'
      });
    }
    
    return isValid;
  } catch (error) {
    logger.error('Webhook signature verification error', { error: error.message });
    return false;
  }
}

/**
 * Webhook payload validation schema
 */
const webhookPayloadSchema = z.object({
  entity: z.string().min(1),
  account_id: z.string().min(1),
  event: z.nativeEnum(WebhookEventType),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({ entity: z.any() }).optional(),
    order: z.object({ entity: z.any() }).optional(),
    refund: z.object({ entity: z.any() }).optional()
  }),
  created_at: z.number().positive()
});

/**
 * Validate webhook payload structure with comprehensive checks
 */
function validatePayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Basic structure validation with Zod
    const validationResult = webhookPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      errors.push(...validationResult.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ));
    }
    
    // Additional security validations
    if (payload.created_at) {
      // Check payload age (prevent replay attacks)
      const maxAge = 300000; // 5 minutes
      const now = Date.now();
      const payloadAge = now - (payload.created_at * 1000);
      
      if (payloadAge > maxAge) {
        errors.push('Payload too old - possible replay attack');
      }
      
      if (payloadAge < -60000) { // Allow 1 minute clock skew
        errors.push('Payload from future - possible replay attack');
      }
    }
    
    // Validate required payload content based on event type
    if (payload.event && validationResult.success) {
      switch (payload.event) {
        case WebhookEventType.PAYMENT_AUTHORIZED:
        case WebhookEventType.PAYMENT_CAPTURED:
        case WebhookEventType.PAYMENT_FAILED:
          if (!payload.payload?.payment?.entity) {
            errors.push('Payment entity missing for payment event');
          }
          break;
        case WebhookEventType.REFUND_CREATED:
        case WebhookEventType.REFUND_PROCESSED:
          if (!payload.payload?.refund?.entity) {
            errors.push('Refund entity missing for refund event');
          }
          break;
      }
    }
  } catch (error) {
    errors.push(`Payload validation error: ${error.message}`);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(paymentData: any): Promise<void> {
  const paymentId = paymentData.id;
  logger.info('Processing payment authorized event', { paymentId });
  
  try {
    // Find the payment order
    const paymentOrder = await db.prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: paymentData.order_id },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        userId: true,
        orderId: true
      }
    });
    
    if (!paymentOrder) {
      logger.warn('Payment order not found for authorized payment', { 
        paymentId, 
        orderId: paymentData.order_id 
      });
      return;
    }
    
    // Check if transaction already exists to prevent duplicate processing
    const existingTransaction = await db.prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId: paymentId }
    });
    
    if (existingTransaction) {
      logger.info('Payment transaction already exists', { paymentId });
      return;
    }
    
    // Create payment transaction record with validation
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.prisma.paymentTransaction.create({
      data: {
        id: transactionId,
        paymentOrderId: paymentOrder.id,
        razorpayPaymentId: paymentId,
        amount: parseFloat(paymentData.amount) / 100, // Convert from paise
        currency: paymentData.currency || 'INR',
        status: 'authorized',
        method: paymentData.method || 'unknown',
        gateway: 'razorpay',
        fees: JSON.stringify(paymentData.fee ? { fee: paymentData.fee } : {})
      }
    });
    
    // Create audit log
    await db.prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityType: 'payment_transaction',
        entityId: transactionId,
        action: 'payment_authorized',
        changes: JSON.stringify({
          paymentId,
          amount: paymentData.amount,
          method: paymentData.method
        }),
        createdById: 'system-webhook-handler',
        ipAddress: 'webhook',
        userAgent: 'razorpay-webhook'
      }
    });
    
    logger.info('Payment authorized event processed successfully', {
      paymentId,
      transactionId,
      amount: paymentData.amount
    });
  } catch (error) {
    logger.error('Failed to process payment authorized event', { 
      paymentId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(paymentData: any): Promise<void> {
  const paymentId = paymentData.id;
  logger.info('Processing payment captured event', { paymentId });
  
  try {
    // Use database transaction for atomicity
    await db.prisma.$transaction(async (prisma) => {
      // Find the payment transaction
      const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: paymentId },
        include: {
          paymentOrder: {
            select: {
              id: true,
              orderId: true,
              userId: true,
              amount: true,
              currency: true
            }
          }
        }
      });
      
      if (!paymentTransaction) {
        logger.warn('Payment transaction not found for captured payment', { paymentId });
        return;
      }
      
      // Update transaction status with captured details
      await prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: {
          status: 'captured',
          capturedAt: new Date(),
          fees: JSON.stringify({
            ...JSON.parse(paymentTransaction.fees || '{}'),
            capturedFee: paymentData.fee || 0,
            capturedAt: new Date().toISOString(),
            captureId: paymentData.id,
            captureAmount: paymentData.amount
          })
        }
      });
      
      // Update payment order status
      await prisma.paymentOrder.update({
        where: { id: paymentTransaction.paymentOrderId },
        data: {
          status: 'paid'
        }
      });
      
      // Update linked meal order if exists
      if (paymentTransaction.paymentOrder.orderId) {
        try {
          await prisma.order.update({
            where: { id: paymentTransaction.paymentOrder.orderId },
            data: {
              paymentStatus: 'paid',
              status: 'confirmed',
            }
          });
        } catch (orderError) {
          logger.warn('Failed to update order payment status', { 
            orderId: paymentTransaction.paymentOrder.orderId,
            error: orderError.message 
          });
          // Continue - this is not critical for webhook processing
        }
      }
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType: 'payment_transaction',
          entityId: paymentTransaction.id,
          action: 'payment_captured',
          changes: JSON.stringify({
            paymentId,
            amount: paymentData.amount,
            capturedAt: new Date().toISOString(),
            orderId: paymentTransaction.paymentOrderId
          }),
          createdById: 'system-webhook-handler',
          ipAddress: 'webhook',
          userAgent: 'razorpay-webhook'
        }
      });
    });
    
    logger.info('Payment captured event processed successfully', {
      paymentId,
      amount: paymentData.amount
    });
  } catch (error) {
    logger.error('Failed to process payment captured event', { 
      paymentId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(paymentData: any): Promise<void> {
  const paymentId = paymentData.id;
  const failureReason = paymentData.error_description || paymentData.error_reason || 'Payment failed';
  
  logger.info('Processing payment failed event', { paymentId, failureReason });
  
  try {
    await db.prisma.$transaction(async (prisma) => {
      // Find the payment order
      const paymentOrder = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: paymentData.order_id },
        select: {
          id: true,
          amount: true,
          currency: true,
          userId: true,
          orderId: true
        }
      });
      
      if (!paymentOrder) {
        logger.warn('Payment order not found for failed payment', { 
          paymentId, 
          orderId: paymentData.order_id 
        });
        return;
      }
      
      // Check if transaction already exists
      const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: paymentId }
      });
      
      if (existingTransaction) {
        // Update existing transaction
        await prisma.paymentTransaction.update({
          where: { id: existingTransaction.id },
          data: {
            status: 'failed',
          }
        });
      } else {
        // Create new transaction record
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.paymentTransaction.create({
          data: {
            id: transactionId,
            paymentOrderId: paymentOrder.id,
            razorpayPaymentId: paymentId,
            amount: parseFloat(paymentData.amount) / 100, // Convert from paise
            currency: paymentData.currency || 'INR',
            status: 'failed',
            method: paymentData.method || 'unknown',
            gateway: 'razorpay',
            fees: JSON.stringify({}),
          }
        });
      }
      
      // Update payment order status
      await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'failed'
        }
      });
      
      // Update meal order status if exists
      if (paymentOrder.orderId) {
        try {
          await prisma.order.update({
            where: { id: paymentOrder.orderId },
            data: {
              paymentStatus: 'failed',
            }
          });
        } catch (orderError) {
          logger.warn('Failed to update order payment status', { 
            orderId: paymentOrder.orderId,
            error: orderError.message 
          });
        }
      }
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType: 'payment_transaction',
          entityId: existingTransaction?.id || `transaction_for_${paymentId}`,
          action: 'payment_failed',
          changes: JSON.stringify({
            paymentId,
            amount: paymentData.amount,
            failureReason,
            errorCode: paymentData.error_code,
            failedAt: new Date().toISOString()
          }),
          createdById: 'system-webhook-handler',
          ipAddress: 'webhook',
          userAgent: 'razorpay-webhook'
        }
      });
    });
    
    logger.info('Payment failed event processed successfully', {
      paymentId,
      reason: failureReason
    });
  } catch (error) {
    logger.error('Failed to process payment failed event', { 
      paymentId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Handle refund events
 */
async function handleRefundEvent(refundData: any, eventType: string): Promise<void> {
  const refundId = refundData.id;
  const paymentId = refundData.payment_id;
  
  logger.info('Processing refund event', { refundId, eventType, paymentId });
  
  try {
    await db.prisma.$transaction(async (prisma) => {
      // Find the payment transaction
      const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: paymentId },
        select: {
          id: true,
          amount: true,
          currency: true,
          paymentOrderId: true,
          status: true
        }
      });
      
      if (!paymentTransaction) {
        logger.warn('Payment transaction not found for refund', { 
          refundId, 
          paymentId 
        });
        return;
      }
      
      // Check if refund record already exists
      const existingRefund = await prisma.paymentRefund.findUnique({
        where: { razorpayRefundId: refundId }
      });
      
      const refundAmount = parseFloat(refundData.amount) / 100; // Convert from paise
      const isProcessed = eventType === WebhookEventType.REFUND_PROCESSED;
      
      if (existingRefund) {
        // Update existing refund
        await prisma.paymentRefund.update({
          where: { id: existingRefund.id },
          data: {
            status: refundData.status,
            processedAt: isProcessed ? new Date() : existingRefund.processedAt,
          }
        });
      } else {
        // Create new refund record
        const refundTransactionId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.paymentRefund.create({
          data: {
            id: refundTransactionId,
            razorpayRefundId: refundId,
            paymentId: paymentTransaction.id,
            amount: refundAmount,
            currency: refundData.currency || 'INR',
            status: refundData.status,
            reason: refundData.reason || 'customer_request',
            processedAt: isProcessed ? new Date() : null,
          }
        });
      }
      
      // Update payment transaction if refund is processed
      if (isProcessed) {
        await prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: 'refunded',
            refundedAt: new Date(),
          }
        });
      }
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          entityType: 'payment_refund',
          entityId: existingRefund?.id || refundId,
          action: `refund_${eventType.split('.')[1]}`, // refund_created or refund_processed
          changes: JSON.stringify({
            refundId,
            paymentId,
            amount: refundData.amount,
            status: refundData.status,
            eventType,
            processedAt: isProcessed ? new Date().toISOString() : null
          }),
          createdById: 'system-webhook-handler',
          ipAddress: 'webhook',
          userAgent: 'razorpay-webhook'
        }
      });
    });
    
    logger.info('Refund event processed successfully', {
      refundId,
      amount: refundData.amount,
      status: refundData.status,
      eventType
    });
  } catch (error) {
    logger.error('Failed to process refund event', { 
      refundId, 
      eventType, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Process webhook event with comprehensive error handling and monitoring
 */
async function processWebhookEvent(payload: RazorpayWebhookPayload): Promise<void> {
  const eventType = payload.event;
  const eventStartTime = Date.now();
  
  try {
    logger.info('Processing webhook event', {
      eventType,
      accountId: payload.account_id,
      entityId: payload.payload.payment?.entity?.id || payload.payload.refund?.entity?.id
    });
    
    switch (eventType) {
      case WebhookEventType.PAYMENT_AUTHORIZED:
        if (payload.payload.payment?.entity) {
          await handlePaymentAuthorized(payload.payload.payment.entity);
        } else {
          throw new Error('Payment entity missing for payment.authorized event');
        }
        break;
        
      case WebhookEventType.PAYMENT_CAPTURED:
        if (payload.payload.payment?.entity) {
          await handlePaymentCaptured(payload.payload.payment.entity);
        } else {
          throw new Error('Payment entity missing for payment.captured event');
        }
        break;
        
      case WebhookEventType.PAYMENT_FAILED:
        if (payload.payload.payment?.entity) {
          await handlePaymentFailed(payload.payload.payment.entity);
        } else {
          throw new Error('Payment entity missing for payment.failed event');
        }
        break;
        
      case WebhookEventType.REFUND_CREATED:
      case WebhookEventType.REFUND_PROCESSED:
        if (payload.payload.refund?.entity) {
          await handleRefundEvent(payload.payload.refund.entity, eventType);
        } else {
          throw new Error('Refund entity missing for refund event');
        }
        break;
        
      default:
        logger.warn('Unhandled webhook event type', { 
          eventType,
          availableEvents: Object.values(WebhookEventType)
        });
        // Don't throw error for unknown event types - just log and continue
        break;
    }
    
    const eventDuration = Date.now() - eventStartTime;
    logger.info('Webhook event processed successfully', {
      eventType,
      duration: `${eventDuration}ms`
    });
    
  } catch (error) {
    const eventDuration = Date.now() - eventStartTime;
    logger.error('Webhook event processing failed', {
      eventType,
      duration: `${eventDuration}ms`,
      error: error.message
    });
    throw error;
  }
}

/**
 * Payment Webhook Lambda Function Handler
 * Security-hardened webhook processing with comprehensive validation
 */
export const paymentWebhookHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  const startTime = Date.now();
  
  try {
    // Extract client information for security logging
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const requestPath = event.path || '/payments/webhook';
    
    logger.info('Webhook request received', { 
      requestId,
      clientIP, 
      userAgent,
      path: requestPath,
      method: event.httpMethod
    });
    
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
    }
    
    // Security: Rate limiting
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for webhook', { clientIP, requestId });
      return createErrorResponse(
        429, 
        'Rate limit exceeded', 
        rateLimitResult.retryAfter ? { 'Retry-After': rateLimitResult.retryAfter.toString() } : {},
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Extract and validate request body
    const body = event.body;
    if (!body || body.trim().length === 0) {
      logger.error('Webhook request missing body', { requestId, clientIP });
      return createErrorResponse(400, 'Request body is required', undefined, 'MISSING_BODY');
    }
    
    // Security: Limit body size to prevent DoS attacks
    if (body.length > WEBHOOK_CONFIG.MAX_BODY_SIZE) {
      logger.error('Webhook request body too large', { 
        requestId,
        bodySize: body.length, 
        maxSize: WEBHOOK_CONFIG.MAX_BODY_SIZE,
        clientIP
      });
      return createErrorResponse(413, 'Request body too large', undefined, 'PAYLOAD_TOO_LARGE');
    }
    
    // Extract signature from headers (case-insensitive)
    const signature = event.headers['x-razorpay-signature'] || 
                     event.headers['X-Razorpay-Signature'] ||
                     event.headers['X-RAZORPAY-SIGNATURE'];
    
    if (!signature || typeof signature !== 'string') {
      logger.error('Missing webhook signature', { 
        requestId,
        headers: Object.keys(event.headers),
        clientIP 
      });
      return createErrorResponse(401, 'Missing webhook signature', undefined, 'MISSING_SIGNATURE');
    }
    
    // Security: Verify webhook signature with timing-safe comparison
    const isValidSignature = verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      logger.error('Invalid webhook signature', {
        requestId,
        signatureProvided: !!signature,
        bodyLength: body.length,
        clientIP
      });
      return createErrorResponse(401, 'Invalid webhook signature', undefined, 'INVALID_SIGNATURE');
    }
    
    // Parse webhook payload with error handling
    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (parseError) {
      logger.error('Failed to parse webhook payload', { 
        requestId,
        body: body.substring(0, 100) + '...', 
        error: parseError.message,
        clientIP
      });
      return createErrorResponse(400, 'Invalid JSON payload', undefined, 'INVALID_JSON');
    }
    
    // Validate payload structure and content
    const validation = validatePayload(payload);
    if (!validation.valid) {
      logger.error('Invalid webhook payload', { 
        requestId,
        errors: validation.errors,
        eventType: payload.event,
        clientIP
      });
      return createErrorResponse(
        400, 
        `Invalid payload: ${validation.errors.join(', ')}`, 
        undefined,
        'INVALID_PAYLOAD'
      );
    }
    
    logger.info('Processing Razorpay webhook', {
      requestId,
      eventType: payload.event,
      paymentId: payload.payload.payment?.entity?.id,
      orderId: payload.payload.payment?.entity?.order_id,
      amount: payload.payload.payment?.entity?.amount,
      clientIP,
      accountId: payload.account_id
    });
    
    // Process the webhook event with timeout protection
    const processingPromise = processWebhookEvent(payload);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Webhook processing timeout')), 
        WEBHOOK_CONFIG.PROCESSING_TIMEOUT
      );
    });
    
    await Promise.race([processingPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    logger.info('Webhook processed successfully', {
      requestId,
      eventType: payload.event,
      duration: `${duration}ms`,
      clientIP
    });
    
    return createSuccessResponse(
      {
        success: true,
        eventType: payload.event,
        processedAt: new Date().toISOString()
      },
      'Webhook processed successfully',
      200
    );
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Webhook processing failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined,
      clientIP: event.requestContext?.identity?.sourceIp
    });
    
    // Handle specific error types with appropriate responses
    if (error instanceof Error) {
      if (error.message === 'Webhook processing timeout') {
        return createErrorResponse(408, 'Processing timeout', undefined, 'PROCESSING_TIMEOUT');
      }
      
      if (error.message.includes('signature')) {
        return createErrorResponse(401, 'Authentication failed', undefined, 'AUTH_FAILED');
      }
      
      if (error.message.includes('rate limit')) {
        return createErrorResponse(429, 'Rate limit exceeded', undefined, 'RATE_LIMITED');
      }
      
      if (error.message.includes('validation')) {
        return createErrorResponse(400, 'Validation failed', undefined, 'VALIDATION_ERROR');
      }
    }
    
    return handleError(error as Error, requestId);
  }
};