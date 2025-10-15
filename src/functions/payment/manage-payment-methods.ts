/**
 * HASIVU Platform - Payment Methods Management Lambda Function
 * Handles: GET/POST/PUT/DELETE /payments/methods
 * Implements Epic 5: Payment Processing - Payment Method Management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { prisma } from '@/database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payment method request interface
 */
interface CreatePaymentMethodRequest {
  methodType: 'card' | 'upi' | 'wallet' | 'bank_transfer';
  provider: string;
  providerMethodId?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardNetwork?: string;
  cardType?: string;
  upiHandle?: string;
  walletProvider?: string;
  isDefault?: boolean;
}

/**
 * Payment method response interface
 */
interface PaymentMethodResponse {
  id: string;
  methodType: string;
  provider: string;
  cardLast4?: string;
  cardBrand?: string;
  cardNetwork?: string;
  cardType?: string;
  upiHandle?: string;
  walletProvider?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validate payment method data
 */
function validatePaymentMethodData(data: CreatePaymentMethodRequest): void {
  const { methodType, provider } = data;

  if (!methodType || !provider) {
    throw new Error('methodType and provider are required');
  }

  const validMethodTypes = ['card', 'upi', 'wallet', 'bank_transfer'];
  if (!validMethodTypes.includes(methodType)) {
    throw new Error(`Invalid methodType. Must be one of: ${validMethodTypes.join(', ')}`);
  }

  // Validate method-specific fields
  switch (methodType) {
    case 'card':
      if (!data.cardLast4 || !data.cardBrand) {
        throw new Error('cardLast4 and cardBrand are required for card payments');
      }
      break;
    case 'upi':
      if (!data.upiHandle) {
        throw new Error('upiHandle is required for UPI payments');
      }
      break;
    case 'wallet':
      if (!data.walletProvider) {
        throw new Error('walletProvider is required for wallet payments');
      }
      break;
  }
}

/**
 * Get user's payment methods
 */
export const getPaymentMethods = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('getPaymentMethods', { event, context });

  try {
    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Get user's payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    const response: PaymentMethodResponse[] = paymentMethods.map(method => ({
      id: method.id,
      methodType: method.methodType,
      provider: method.provider,
      cardLast4: method.cardLast4 || undefined,
      cardBrand: method.cardBrand || undefined,
      cardNetwork: method.cardNetwork || undefined,
      cardType: method.cardType || undefined,
      upiHandle: method.upiHandle || undefined,
      walletProvider: method.walletProvider || undefined,
      isDefault: method.isDefault,
      isActive: method.isActive,
      createdAt: method.createdAt,
      updatedAt: method.updatedAt,
    }));

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('getPaymentMethods', {
      statusCode: 200,
      duration,
      count: response.length,
    });

    return createSuccessResponse({
      data: {
        paymentMethods: response,
      },
      message: `Retrieved ${response.length} payment methods`,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('getPaymentMethods', { statusCode: 500, duration });
    return handleError(error, 'Failed to retrieve payment methods');
  }
};

/**
 * Create new payment method
 */
export const createPaymentMethod = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('createPaymentMethod', { event, context });

  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Parse request body
    const body: CreatePaymentMethodRequest = JSON.parse(event.body || '{}');
    logger.info('Processing create payment method request', {
      userId,
      methodType: body.methodType,
    });

    // Validate request data
    validatePaymentMethodData(body);

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Create payment method
    const paymentMethodData: any = {
      id: uuidv4(),
      userId,
      methodType: body.methodType,
      provider: body.provider,
      isDefault: body.isDefault || false,
      isActive: true,
    };

    // Add optional fields if provided
    if (body.providerMethodId) paymentMethodData.providerMethodId = body.providerMethodId;
    if (body.cardLast4) paymentMethodData.cardLast4 = body.cardLast4;
    if (body.cardBrand) paymentMethodData.cardBrand = body.cardBrand;
    if (body.cardNetwork) paymentMethodData.cardNetwork = body.cardNetwork;
    if (body.cardType) paymentMethodData.cardType = body.cardType;
    if (body.upiHandle) paymentMethodData.upiHandle = body.upiHandle;
    if (body.walletProvider) paymentMethodData.walletProvider = body.walletProvider;

    const paymentMethod = await prisma.paymentMethod.create({
      data: paymentMethodData,
    });

    const response: PaymentMethodResponse = {
      id: paymentMethod.id,
      methodType: paymentMethod.methodType,
      provider: paymentMethod.provider,
      cardLast4: paymentMethod.cardLast4 || undefined,
      cardBrand: paymentMethod.cardBrand || undefined,
      cardNetwork: paymentMethod.cardNetwork || undefined,
      cardType: paymentMethod.cardType || undefined,
      upiHandle: paymentMethod.upiHandle || undefined,
      walletProvider: paymentMethod.walletProvider || undefined,
      isDefault: paymentMethod.isDefault,
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('createPaymentMethod', {
      statusCode: 201,
      duration,
      paymentMethodId: paymentMethod.id,
    });

    return createSuccessResponse(
      {
        data: {
          paymentMethod: response,
        },
        message: 'Payment method created successfully',
      },
      201
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('createPaymentMethod', { statusCode: 500, duration });
    return handleError(error, 'Failed to create payment method');
  }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('updatePaymentMethod', { event, context });

  try {
    // Only allow PUT method
    if (event.httpMethod !== 'PUT') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract payment method ID from path
    const paymentMethodId = event.pathParameters?.paymentMethodId;
    if (!paymentMethodId) {
      return createErrorResponse('MISSING_PAYMENT_METHOD_ID', 'Payment method ID required', 400);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Parse request body
    const body: Partial<CreatePaymentMethodRequest> = JSON.parse(event.body || '{}');

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Update payment method
    const paymentMethod = await prisma.paymentMethod.update({
      where: {
        id: paymentMethodId,
        userId, // Ensure user owns this payment method
      },
      data: {
        providerMethodId: body.providerMethodId,
        cardLast4: body.cardLast4,
        cardBrand: body.cardBrand,
        cardNetwork: body.cardNetwork,
        cardType: body.cardType,
        upiHandle: body.upiHandle,
        walletProvider: body.walletProvider,
        isDefault: body.isDefault,
        updatedAt: new Date(),
      },
    });

    const response: PaymentMethodResponse = {
      id: paymentMethod.id,
      methodType: paymentMethod.methodType,
      provider: paymentMethod.provider,
      cardLast4: paymentMethod.cardLast4 || undefined,
      cardBrand: paymentMethod.cardBrand || undefined,
      cardNetwork: paymentMethod.cardNetwork || undefined,
      cardType: paymentMethod.cardType || undefined,
      upiHandle: paymentMethod.upiHandle || undefined,
      walletProvider: paymentMethod.walletProvider || undefined,
      isDefault: paymentMethod.isDefault,
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('updatePaymentMethod', { statusCode: 200, duration, paymentMethodId });

    return createSuccessResponse({
      data: {
        paymentMethod: response,
      },
      message: 'Payment method updated successfully',
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('updatePaymentMethod', { statusCode: 500, duration });
    return handleError(error, 'Failed to update payment method');
  }
};

/**
 * Delete payment method
 */
export const deletePaymentMethod = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('deletePaymentMethod', { event, context });

  try {
    // Only allow DELETE method
    if (event.httpMethod !== 'DELETE') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract payment method ID from path
    const paymentMethodId = event.pathParameters?.paymentMethodId;
    if (!paymentMethodId) {
      return createErrorResponse('MISSING_PAYMENT_METHOD_ID', 'Payment method ID required', 400);
    }

    // Extract userId from event context
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Check if payment method is being used by active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        userId,
        paymentMethodId,
        status: { in: ['active', 'trial'] },
      },
    });

    if (activeSubscriptions > 0) {
      return createErrorResponse(
        'PAYMENT_METHOD_IN_USE',
        'Cannot delete payment method currently used by active subscriptions',
        400
      );
    }

    // Soft delete payment method
    await prisma.paymentMethod.update({
      where: {
        id: paymentMethodId,
        userId, // Ensure user owns this payment method
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('deletePaymentMethod', { statusCode: 200, duration, paymentMethodId });

    return createSuccessResponse({
      message: 'Payment method deleted successfully',
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('deletePaymentMethod', { statusCode: 500, duration });
    return handleError(error, 'Failed to delete payment method');
  }
};

/**
 * Main handler - route to appropriate function based on HTTP method and path
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path } = event;

  // Route based on method and path
  if (httpMethod === 'GET' && path.endsWith('/methods')) {
    return getPaymentMethods(event, context);
  }

  if (httpMethod === 'POST' && path.endsWith('/methods')) {
    return createPaymentMethod(event, context);
  }

  if (httpMethod === 'PUT' && path.includes('/methods/')) {
    return updatePaymentMethod(event, context);
  }

  if (httpMethod === 'DELETE' && path.includes('/methods/')) {
    return deletePaymentMethod(event, context);
  }

  return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed for this endpoint', 405);
};
