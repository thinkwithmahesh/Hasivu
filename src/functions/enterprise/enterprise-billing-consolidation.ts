/**
 * HASIVU Platform - Enterprise Billing Consolidation Lambda Function
 * Epic 7.3: Enterprise Multi-School Management Platform
 *
 * Centralized billing and invoicing for enterprise multi-school systems
 * Features: Consolidated billing, usage tracking, invoice generation, payment processing, financial reporting
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { databaseService } from '../../shared/database.service';
import { jwtService } from '../../shared/jwt.service';

// Types
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  districtId?: string;
  tenantId?: string;
  isActive: boolean;
}

interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  status: 'CURRENT' | 'CLOSED' | 'FUTURE';
}

interface UsageMetrics {
  schoolCount: number;
  studentCount: number;
  orderCount: number;
  apiCalls: number;
  storageGB: number;
  bandwidthGB: number;
  activeUsers: number;
}

interface BillingLineItem {
  id: string;
  type: 'BASE_FEE' | 'USAGE' | 'OVERAGE' | 'DISCOUNT' | 'TAX';
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  schoolId?: string;
  metadata?: Record<string, any>;
}

interface ConsolidatedInvoice {
  id: string;
  invoiceNumber: string;
  districtId: string;
  billingPeriod: BillingPeriod;
  lineItems: BillingLineItem[];
  subtotal: number;
  discounts: number;
  taxes: number;
  total: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'WIRE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
  processedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

interface BillingConfiguration {
  districtId: string;
  billingModel: 'FIXED' | 'USAGE_BASED' | 'TIERED' | 'HYBRID';
  baseFee: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  usageRates: {
    perStudent: number;
    perOrder: number;
    perAPICall: number;
    perGBStorage: number;
    perGBBandwidth: number;
  };
  discounts: {
    volumeDiscounts: Array<{ threshold: number; percentage: number }>;
    loyaltyDiscount: number;
    earlyPaymentDiscount: number;
  };
  limits: {
    maxSchools: number;
    maxStudents: number;
    maxAPICallsPerMonth: number;
    maxStorageGB: number;
  };
}

// Authentication middleware
async function authenticateLambda(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authentication token provided');
  }

  const jwtResult = await jwtService.verifyToken(token);
  if (!jwtResult.isValid || !jwtResult.payload || !jwtResult.payload.userId) {
    throw new Error('Invalid authentication token');
  }

  return {
    id: jwtResult.payload.userId,
    email: jwtResult.payload.email,
    role: jwtResult.payload.role,
    districtId: (jwtResult.payload as any).districtId,
    tenantId: (jwtResult.payload as any).tenantId,
    isActive: true,
  };
}

/**
 * Enterprise Billing Consolidation Lambda Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    logger.info('Enterprise billing consolidation request started', {
      requestId,
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // Authentication
    let authResult: AuthenticatedUser;
    try {
      authResult = await authenticateLambda(event as any);
    } catch (authError) {
      logger.warn('Authentication failed', { requestId, error: (authError as Error).message });
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Authorization check - only district admins, billing admins, and super admins allowed
    if (
      !['district_admin', 'super_admin', 'billing_admin', 'finance_admin'].includes(authResult.role)
    ) {
      return createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions for billing operations',
        403
      );
    }

    const { httpMethod: method } = event;
    const pathParameters = event.pathParameters || {};
    const { invoiceId } = pathParameters;
    const db = databaseService.client;

    switch (method) {
      case 'GET':
        if (event.path?.includes('/usage-metrics')) {
          return await getUsageMetrics(event.queryStringParameters, authResult, db);
        } else if (event.path?.includes('/billing-config')) {
          return await getBillingConfiguration(authResult, db);
        } else if (event.path?.includes('/invoices')) {
          if (invoiceId) {
            return await getInvoice(invoiceId, authResult, db);
          } else {
            return await listInvoices(event.queryStringParameters, authResult, db);
          }
        } else if (event.path?.includes('/payments')) {
          return await getPaymentHistory(event.queryStringParameters, authResult, db);
        } else if (event.path?.includes('/financial-summary')) {
          return await getFinancialSummary(event.queryStringParameters, authResult, db);
        }
        break;

      case 'POST':
        if (event.path?.includes('/generate-invoice')) {
          return await generateConsolidatedInvoice(JSON.parse(event.body || '{}'), authResult, db);
        } else if (event.path?.includes('/process-payment')) {
          return await processPayment(JSON.parse(event.body || '{}'), authResult, db);
        } else if (event.path?.includes('/calculate-usage')) {
          return await calculateUsageCharges(JSON.parse(event.body || '{}'), authResult, db);
        } else if (event.path?.includes('/send-invoice')) {
          return await sendInvoice(JSON.parse(event.body || '{}'), authResult, db);
        }
        break;

      case 'PUT':
        if (event.path?.includes('/billing-config')) {
          return await updateBillingConfiguration(JSON.parse(event.body || '{}'), authResult, db);
        } else if (invoiceId && event.path?.includes('/update')) {
          return await updateInvoice(invoiceId, JSON.parse(event.body || '{}'), authResult, db);
        }
        break;

      case 'DELETE':
        if (invoiceId && event.path?.includes('/cancel')) {
          return await cancelInvoice(invoiceId, authResult, db);
        }
        break;

      default:
        return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return createErrorResponse('INVALID_PATH', 'Invalid request path', 400);
  } catch (error: unknown) {
    logger.error('Enterprise billing consolidation request failed', error as Error, {
      requestId,
    });

    return handleError(error, 'Billing consolidation operation failed');
  }
};

/**
 * Get usage metrics for billing calculation
 */
async function getUsageMetrics(
  queryParams: { [key: string]: string | undefined } | null,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const startDate = queryParams?.startDate
      ? new Date(queryParams.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Start of current month
    const endDate = queryParams?.endDate ? new Date(queryParams.endDate) : new Date();

    const { districtId } = user;

    if (!districtId && user.role !== 'super_admin') {
      return createErrorResponse('DISTRICT_REQUIRED', 'District ID required', 400);
    }

    // Get usage metrics from various sources
    const [schoolMetrics, orderMetrics, userMetrics, systemMetrics] = await Promise.all([
      getSchoolUsageMetrics(districtId, startDate, endDate, db),
      getOrderUsageMetrics(districtId, startDate, endDate, db),
      getUserUsageMetrics(districtId, startDate, endDate, db),
      getSystemUsageMetrics(districtId, startDate, endDate, db),
    ]);

    const usageMetrics: UsageMetrics = {
      schoolCount: schoolMetrics.activeSchools,
      studentCount: userMetrics.totalStudents,
      orderCount: orderMetrics.totalOrders,
      apiCalls: systemMetrics.apiCalls,
      storageGB: systemMetrics.storageGB,
      bandwidthGB: systemMetrics.bandwidthGB,
      activeUsers: userMetrics.activeUsers,
    };

    // Calculate costs based on usage
    const billingConfig = await getBillingConfigurationData(districtId, db);
    const calculatedCharges = calculateUsageBasedCharges(usageMetrics, billingConfig);

    return createSuccessResponse({
      data: {
        period: { startDate, endDate },
        metrics: usageMetrics,
        calculatedCharges,
        billingConfig,
      },
      message: 'Usage metrics retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve usage metrics');
  }
}

/**
 * Get school usage metrics
 */
async function getSchoolUsageMetrics(
  districtId: string | undefined,
  startDate: Date,
  endDate: Date,
  db: any
): Promise<any> {
  const result = (await db.$queryRaw`
    SELECT
      COUNT(*) as total_schools,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_schools,
      COUNT(CASE WHEN created_at BETWEEN ${startDate} AND ${endDate} THEN 1 END) as new_schools
    FROM schools
    WHERE (district_id = ${districtId} OR ${!districtId})
  `) as any[];

  return {
    totalSchools: parseInt(result[0]?.total_schools || '0'),
    activeSchools: parseInt(result[0]?.active_schools || '0'),
    newSchools: parseInt(result[0]?.new_schools || '0'),
  };
}

/**
 * Get order usage metrics
 */
async function getOrderUsageMetrics(
  districtId: string | undefined,
  startDate: Date,
  endDate: Date,
  db: any
): Promise<any> {
  const result = (await db.$queryRaw`
    SELECT
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      COUNT(DISTINCT user_id) as unique_customers,
      AVG(total_amount) as avg_order_value
    FROM orders o
    JOIN schools s ON o.school_id = s.id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND o.created_at BETWEEN ${startDate} AND ${endDate}
  `) as any[];

  return {
    totalOrders: parseInt(result[0]?.total_orders || '0'),
    totalRevenue: parseFloat(result[0]?.total_revenue || '0'),
    uniqueCustomers: parseInt(result[0]?.unique_customers || '0'),
    avgOrderValue: parseFloat(result[0]?.avg_order_value || '0'),
  };
}

/**
 * Get user usage metrics
 */
async function getUserUsageMetrics(
  districtId: string | undefined,
  startDate: Date,
  endDate: Date,
  db: any
): Promise<any> {
  const result = (await db.$queryRaw`
    SELECT
      COUNT(CASE WHEN u.role = 'student' THEN 1 END) as total_students,
      COUNT(CASE WHEN u.role = 'student' AND u.is_active = true THEN 1 END) as active_students,
      COUNT(CASE WHEN u.last_login >= ${startDate} THEN 1 END) as active_users
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
  `) as any[];

  return {
    totalStudents: parseInt(result[0]?.total_students || '0'),
    activeStudents: parseInt(result[0]?.active_students || '0'),
    activeUsers: parseInt(result[0]?.active_users || '0'),
  };
}

/**
 * Get system usage metrics
 */
async function getSystemUsageMetrics(
  districtId: string | undefined,
  startDate: Date,
  endDate: Date,
  db: any
): Promise<any> {
  // In a real implementation, this would query actual system metrics
  // For now, we'll use estimated values
  const schools = (await db.$queryRaw`
    SELECT COUNT(*) as count FROM schools
    WHERE (district_id = ${districtId} OR ${!districtId})
    AND is_active = true
  `) as any[];

  const schoolCount = parseInt(schools[0]?.count || '0');

  return {
    apiCalls: schoolCount * 1000, // Estimated 1000 calls per school per month
    storageGB: schoolCount * 5, // Estimated 5GB per school
    bandwidthGB: schoolCount * 10, // Estimated 10GB per school
  };
}

/**
 * Get billing configuration
 */
async function getBillingConfiguration(
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { districtId } = user;

    if (!districtId && user.role !== 'super_admin') {
      return createErrorResponse('DISTRICT_REQUIRED', 'District ID required', 400);
    }

    const config = await getBillingConfigurationData(districtId, db);

    return createSuccessResponse({
      data: { config },
      message: 'Billing configuration retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve billing configuration');
  }
}

/**
 * Get billing configuration data
 */
async function getBillingConfigurationData(
  districtId: string | undefined,
  db: any
): Promise<BillingConfiguration> {
  // In a real implementation, this would query the billing configuration from the database
  // For now, we'll return default configuration
  return {
    districtId: districtId || '',
    billingModel: 'HYBRID',
    baseFee: 500, // Monthly base fee
    currency: 'INR',
    billingCycle: 'MONTHLY',
    usageRates: {
      perStudent: 5,
      perOrder: 0.5,
      perAPICall: 0.001,
      perGBStorage: 2,
      perGBBandwidth: 1,
    },
    discounts: {
      volumeDiscounts: [
        { threshold: 1000, percentage: 5 },
        { threshold: 5000, percentage: 10 },
        { threshold: 10000, percentage: 15 },
      ],
      loyaltyDiscount: 2,
      earlyPaymentDiscount: 3,
    },
    limits: {
      maxSchools: 100,
      maxStudents: 50000,
      maxAPICallsPerMonth: 1000000,
      maxStorageGB: 1000,
    },
  };
}

/**
 * Calculate usage-based charges
 */
function calculateUsageBasedCharges(metrics: UsageMetrics, config: BillingConfiguration): any {
  const charges = {
    baseFee: config.baseFee,
    studentCharges: metrics.studentCount * config.usageRates.perStudent,
    orderCharges: metrics.orderCount * config.usageRates.perOrder,
    apiCharges: metrics.apiCalls * config.usageRates.perAPICall,
    storageCharges: metrics.storageGB * config.usageRates.perGBStorage,
    bandwidthCharges: metrics.bandwidthGB * config.usageRates.perGBBandwidth,
  };

  const subtotal = Object.values(charges).reduce((sum, charge) => sum + charge, 0);

  // Apply volume discounts
  let discount = 0;
  for (const volumeDiscount of config.discounts.volumeDiscounts) {
    if (metrics.studentCount >= volumeDiscount.threshold) {
      discount = (subtotal * volumeDiscount.percentage) / 100;
    }
  }

  const total = subtotal - discount;

  return {
    charges,
    subtotal,
    discount,
    total,
    currency: config.currency,
  };
}

/**
 * Generate consolidated invoice
 */
async function generateConsolidatedInvoice(
  invoiceData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { billingPeriod, includeUsage = true } = invoiceData;

    const { districtId } = user;
    if (!districtId && user.role !== 'super_admin') {
      return createErrorResponse('DISTRICT_REQUIRED', 'District ID required', 400);
    }

    // Parse billing period
    const startDate = new Date(billingPeriod.startDate);
    const endDate = new Date(billingPeriod.endDate);

    // Get usage metrics for the period
    const usageMetrics = await getUsageMetrics(
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      user,
      db
    );

    if (usageMetrics.statusCode !== 200) {
      return usageMetrics;
    }

    const usageData = JSON.parse(usageMetrics.body).data;
    const { billingConfig } = usageData;

    // Create line items
    const lineItems: BillingLineItem[] = [];

    // Base fee
    lineItems.push({
      id: `base_${Date.now()}`,
      type: 'BASE_FEE',
      description: 'Monthly Base Fee',
      quantity: 1,
      unitPrice: billingConfig.baseFee,
      amount: billingConfig.baseFee,
    });

    if (includeUsage) {
      // Usage-based charges
      const { charges } = usageData.calculatedCharges;

      if (charges.studentCharges > 0) {
        lineItems.push({
          id: `students_${Date.now()}`,
          type: 'USAGE',
          description: `Student Usage (${usageData.metrics.studentCount} students)`,
          quantity: usageData.metrics.studentCount,
          unitPrice: billingConfig.usageRates.perStudent,
          amount: charges.studentCharges,
        });
      }

      if (charges.orderCharges > 0) {
        lineItems.push({
          id: `orders_${Date.now()}`,
          type: 'USAGE',
          description: `Order Processing (${usageData.metrics.orderCount} orders)`,
          quantity: usageData.metrics.orderCount,
          unitPrice: billingConfig.usageRates.perOrder,
          amount: charges.orderCharges,
        });
      }

      if (charges.storageCharges > 0) {
        lineItems.push({
          id: `storage_${Date.now()}`,
          type: 'USAGE',
          description: `Storage Usage (${usageData.metrics.storageGB} GB)`,
          quantity: usageData.metrics.storageGB,
          unitPrice: billingConfig.usageRates.perGBStorage,
          amount: charges.storageCharges,
        });
      }
    }

    // Apply discounts
    if (usageData.calculatedCharges.discount > 0) {
      lineItems.push({
        id: `discount_${Date.now()}`,
        type: 'DISCOUNT',
        description: 'Volume Discount',
        quantity: 1,
        unitPrice: -usageData.calculatedCharges.discount,
        amount: -usageData.calculatedCharges.discount,
      });
    }

    // Calculate totals
    const subtotal = lineItems
      .filter(item => item.type !== 'DISCOUNT' && item.type !== 'TAX')
      .reduce((sum, item) => sum + item.amount, 0);

    const discounts = Math.abs(
      lineItems.filter(item => item.type === 'DISCOUNT').reduce((sum, item) => sum + item.amount, 0)
    );

    const taxRate = 0.18; // 18% GST
    const taxes = (subtotal - discounts) * taxRate;

    // Add tax line item
    lineItems.push({
      id: `tax_${Date.now()}`,
      type: 'TAX',
      description: 'GST (18%)',
      quantity: 1,
      unitPrice: taxes,
      amount: taxes,
    });

    const total = subtotal - discounts + taxes;

    // Generate invoice
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const invoice: ConsolidatedInvoice = {
      id: invoiceId,
      invoiceNumber,
      districtId: districtId!,
      billingPeriod: {
        startDate,
        endDate,
        type: billingPeriod.type || 'MONTHLY',
        status: 'CURRENT',
      },
      lineItems,
      subtotal,
      discounts,
      taxes,
      total,
      currency: billingConfig.currency,
      status: 'DRAFT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save invoice to database
    await db.$queryRaw`
      INSERT INTO district_billing (
        id, district_id, invoice_number, billing_period,
        billing_start_date, billing_end_date, school_count, student_count,
        subtotal, tax_amount, total_amount, currency,
        payment_status, due_date, created_at, updated_at
      ) VALUES (
        ${invoiceId},
        ${districtId},
        ${invoiceNumber},
        ${billingPeriod.type || 'MONTHLY'},
        ${startDate},
        ${endDate},
        ${usageData.metrics.schoolCount},
        ${usageData.metrics.studentCount},
        ${subtotal},
        ${taxes},
        ${total},
        ${billingConfig.currency},
        'PENDING',
        ${invoice.dueDate},
        NOW(),
        NOW()
      )
    `;

    return createSuccessResponse(
      {
        data: { invoice },
        message: 'Consolidated invoice generated successfully',
      },
      201
    );
  } catch (error: unknown) {
    return handleError(error, 'Failed to generate consolidated invoice');
  }
}

/**
 * Get invoice details
 */
async function getInvoice(
  invoiceId: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const invoice = (await db.$queryRaw`
      SELECT * FROM district_billing
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `) as any[];

    if (!invoice.length) {
      return createErrorResponse('INVOICE_NOT_FOUND', 'Invoice not found', 404);
    }

    return createSuccessResponse({
      data: { invoice: invoice[0] },
      message: 'Invoice retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve invoice');
  }
}

/**
 * List invoices with filtering and pagination
 */
async function listInvoices(
  queryParams: { [key: string]: string | undefined } | null,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const page = parseInt(queryParams?.page || '1');
    const limit = parseInt(queryParams?.limit || '20');
    const offset = (page - 1) * limit;

    let whereCondition = '';
    const params: any[] | undefined = [];

    // District filter for non-super admins
    if (user.role !== 'super_admin' && user.districtId) {
      whereCondition = 'WHERE district_id = $1';
      params.push(user.districtId);
    }

    // Status filter
    if (queryParams?.status) {
      if (whereCondition) {
        whereCondition += ` AND payment_status = $${params.length + 1}`;
      } else {
        whereCondition = `WHERE payment_status = $${params.length + 1}`;
      }
      params.push(queryParams.status);
    }

    // Period filter
    if (queryParams?.period) {
      if (whereCondition) {
        whereCondition += ` AND billing_period = $${params.length + 1}`;
      } else {
        whereCondition = `WHERE billing_period = $${params.length + 1}`;
      }
      params.push(queryParams.period);
    }

    const countQuery = `SELECT COUNT(*) as total FROM district_billing ${whereCondition}`;
    const dataQuery = `
      SELECT * FROM district_billing
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const [countResult, invoices] = await Promise.all([
      db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) as any[],
      db.$queryRawUnsafe(dataQuery, ...params) as any[],
    ]);

    const totalCount = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / limit);

    return createSuccessResponse({
      data: { invoices },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: 'Invoices retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to list invoices');
  }
}

/**
 * Process payment for invoice
 */
async function processPayment(
  paymentData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { invoiceId, amount, method, paymentDetails } = paymentData;

    if (!invoiceId || !amount || !method) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invoice ID, amount, and payment method are required',
        400
      );
    }

    // Verify invoice exists and belongs to user's district
    const invoice = (await db.$queryRaw`
      SELECT * FROM district_billing
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND payment_status IN ('PENDING', 'OVERDUE')
    `) as any[];

    if (!invoice.length) {
      return createErrorResponse(
        'INVOICE_NOT_PAYABLE',
        'Invoice not found or not eligible for payment',
        404
      );
    }

    const invoiceData = invoice[0];

    // Validate payment amount
    if (Math.abs(amount - invoiceData.total_amount) > 0.01) {
      return createErrorResponse(
        'AMOUNT_MISMATCH',
        'Payment amount does not match invoice total',
        400
      );
    }

    // Process payment (integrate with payment gateway)
    const paymentResult = await processPaymentWithGateway(amount, method, paymentDetails);

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record payment
    await db.$queryRaw`
      INSERT INTO payment_records (
        id, invoice_id, amount, currency, method,
        status, transaction_id, processed_at,
        metadata, created_at, updated_at
      ) VALUES (
        ${paymentId},
        ${invoiceId},
        ${amount},
        ${invoiceData.currency},
        ${method},
        ${paymentResult.status},
        ${paymentResult.transactionId},
        ${paymentResult.status === 'COMPLETED' ? new Date() : null},
        ${JSON.stringify(paymentResult.metadata || {})},
        NOW(),
        NOW()
      )
    `;

    // Update invoice status if payment successful
    if (paymentResult.status === 'COMPLETED') {
      await db.$queryRaw`
        UPDATE district_billing
        SET payment_status = 'PAID', paid_at = NOW(), updated_at = NOW()
        WHERE id = ${invoiceId}
      `;
    }

    const payment: PaymentRecord = {
      id: paymentId,
      invoiceId,
      amount,
      currency: invoiceData.currency,
      method,
      status: paymentResult.status as 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
      transactionId: paymentResult.transactionId,
      processedAt: paymentResult.status === 'COMPLETED' ? new Date() : undefined,
      metadata: paymentResult.metadata,
    };

    return createSuccessResponse(
      {
        data: { payment },
        message:
          paymentResult.status === 'COMPLETED'
            ? 'Payment processed successfully'
            : 'Payment initiated, processing...',
      },
      201
    );
  } catch (error: unknown) {
    return handleError(error, 'Failed to process payment');
  }
}

/**
 * Mock payment gateway integration
 */
async function processPaymentWithGateway(
  amount: number,
  method: string,
  paymentDetails: any
): Promise<{ status: string; transactionId?: string; metadata?: any }> {
  // Mock payment processing
  // In a real implementation, this would integrate with Razorpay, Stripe, etc.

  return new Promise(resolve => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        resolve({
          status: 'COMPLETED',
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: {
            gateway: 'mock_gateway',
            processedAt: new Date().toISOString(),
            method,
            amount,
          },
        });
      } else {
        resolve({
          status: 'FAILED',
          metadata: {
            gateway: 'mock_gateway',
            failureReason: 'Insufficient funds',
            amount,
          },
        });
      }
    }, 1000); // Simulate processing delay
  });
}

/**
 * Get payment history
 */
async function getPaymentHistory(
  queryParams: { [key: string]: string | undefined } | null,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const page = parseInt(queryParams?.page || '1');
    const limit = parseInt(queryParams?.limit || '20');
    const offset = (page - 1) * limit;

    const payments = (await db.$queryRaw`
      SELECT
        pr.*,
        db.invoice_number,
        db.billing_period
      FROM payment_records pr
      JOIN district_billing db ON pr.invoice_id = db.id
      WHERE (db.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as any[];

    return createSuccessResponse({
      data: { payments },
      pagination: {
        page,
        limit,
        total: payments.length, // Simplified for this example
        pages: Math.ceil(payments.length / limit),
        hasNext: payments.length === limit,
        hasPrev: page > 1,
      },
      message: 'Payment history retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve payment history');
  }
}

/**
 * Get financial summary
 */
async function getFinancialSummary(
  queryParams: { [key: string]: string | undefined } | null,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const period = queryParams?.period || '12'; // months
    const { districtId } = user;

    // Get financial summary
    const summary = (await db.$queryRaw`
      SELECT
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_billed,
        SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN payment_status = 'PENDING' THEN total_amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN payment_status = 'OVERDUE' THEN total_amount ELSE 0 END) as total_overdue,
        AVG(total_amount) as avg_invoice_amount
      FROM district_billing
      WHERE (district_id = ${districtId} OR ${user.role === 'super_admin'})
      AND created_at >= NOW() - INTERVAL '${period} months'
    `) as any[];

    const summaryData = summary[0] || {};

    // Get monthly breakdown
    const monthlyBreakdown = (await db.$queryRaw`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as invoice_count,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN payment_status = 'PAID' THEN total_amount ELSE 0 END) as paid_amount
      FROM district_billing
      WHERE (district_id = ${districtId} OR ${user.role === 'super_admin'})
      AND created_at >= NOW() - INTERVAL '${period} months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `) as any[];

    const financialSummary = {
      overview: {
        totalInvoices: parseInt(summaryData.total_invoices || '0'),
        totalBilled: parseFloat(summaryData.total_billed || '0'),
        totalPaid: parseFloat(summaryData.total_paid || '0'),
        totalPending: parseFloat(summaryData.total_pending || '0'),
        totalOverdue: parseFloat(summaryData.total_overdue || '0'),
        avgInvoiceAmount: parseFloat(summaryData.avg_invoice_amount || '0'),
        paymentRate:
          summaryData.total_billed > 0
            ? (parseFloat(summaryData.total_paid) / parseFloat(summaryData.total_billed)) * 100
            : 0,
      },
      monthlyBreakdown: monthlyBreakdown.map(month => ({
        month: month.month,
        invoiceCount: parseInt(month.invoice_count),
        totalAmount: parseFloat(month.total_amount),
        paidAmount: parseFloat(month.paid_amount),
        paymentRate:
          month.total_amount > 0
            ? (parseFloat(month.paid_amount) / parseFloat(month.total_amount)) * 100
            : 0,
      })),
    };

    return createSuccessResponse({
      data: { summary: financialSummary },
      message: 'Financial summary retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve financial summary');
  }
}

/**
 * Update billing configuration
 */
async function updateBillingConfiguration(
  configData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { districtId } = user;

    if (!districtId && user.role !== 'super_admin') {
      return createErrorResponse('DISTRICT_REQUIRED', 'District ID required', 400);
    }

    // Validate configuration data
    if (!configData.billingModel || !configData.baseFee || !configData.currency) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Billing model, base fee, and currency are required',
        400
      );
    }

    // Update configuration in database (simplified implementation)
    await db.$queryRaw`
      INSERT INTO billing_configurations (
        district_id, billing_model, base_fee, currency,
        billing_cycle, usage_rates, discounts, limits,
        created_at, updated_at
      ) VALUES (
        ${districtId},
        ${configData.billingModel},
        ${configData.baseFee},
        ${configData.currency},
        ${configData.billingCycle || 'MONTHLY'},
        ${JSON.stringify(configData.usageRates || {})},
        ${JSON.stringify(configData.discounts || {})},
        ${JSON.stringify(configData.limits || {})},
        NOW(),
        NOW()
      ) ON CONFLICT (district_id) DO UPDATE SET
        billing_model = EXCLUDED.billing_model,
        base_fee = EXCLUDED.base_fee,
        currency = EXCLUDED.currency,
        billing_cycle = EXCLUDED.billing_cycle,
        usage_rates = EXCLUDED.usage_rates,
        discounts = EXCLUDED.discounts,
        limits = EXCLUDED.limits,
        updated_at = NOW()
    `;

    return createSuccessResponse({
      data: { config: configData },
      message: 'Billing configuration updated successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to update billing configuration');
  }
}

/**
 * Calculate usage charges
 */
async function calculateUsageCharges(
  calculationData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { metrics, config } = calculationData;

    if (!metrics || !config) {
      return createErrorResponse('VALIDATION_ERROR', 'Metrics and configuration are required', 400);
    }

    const charges = calculateUsageBasedCharges(metrics, config);

    return createSuccessResponse({
      data: { charges },
      message: 'Usage charges calculated successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to calculate usage charges');
  }
}

/**
 * Send invoice
 */
async function sendInvoice(
  sendData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const { invoiceId, recipients, method = 'EMAIL' } = sendData;

    if (!invoiceId || !recipients) {
      return createErrorResponse('VALIDATION_ERROR', 'Invoice ID and recipients are required', 400);
    }

    // Update invoice status to SENT
    await db.$queryRaw`
      UPDATE district_billing
      SET payment_status = 'SENT', updated_at = NOW()
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `;

    // In a real implementation, this would integrate with email/SMS services
    // For now, we'll just log the action
    logger.info('Invoice sent', {
      invoiceId,
      recipients,
      method,
      sentBy: user.id,
    });

    return createSuccessResponse({
      data: { invoiceId, status: 'SENT' },
      message: 'Invoice sent successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to send invoice');
  }
}

/**
 * Update invoice
 */
async function updateInvoice(
  invoiceId: string,
  updateData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const updateFields = [];
    const params: any[] | undefined = [];
    let paramIndex = 1;

    if (updateData.dueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`);
      params.push(new Date(updateData.dueDate));
    }

    if (updateData.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      params.push(updateData.notes);
    }

    if (updateFields.length === 0) {
      return createErrorResponse('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(invoiceId);
    params.push(user.districtId);

    const query = `
      UPDATE district_billing
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++}
      AND (district_id = $${paramIndex++} OR ${user.role === 'super_admin'})
      RETURNING *
    `;

    const result = (await db.$queryRawUnsafe(query, ...params)) as any[];

    if (!result.length) {
      return createErrorResponse('INVOICE_NOT_FOUND', 'Invoice not found', 404);
    }

    return createSuccessResponse({
      data: { invoice: result[0] },
      message: 'Invoice updated successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to update invoice');
  }
}

/**
 * Cancel invoice
 */
async function cancelInvoice(
  invoiceId: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const result = (await db.$queryRaw`
      UPDATE district_billing
      SET payment_status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND payment_status IN ('PENDING', 'SENT', 'OVERDUE')
      RETURNING id
    `) as any[];

    if (!result.length) {
      return createErrorResponse(
        'INVOICE_NOT_CANCELLABLE',
        'Invoice not found or cannot be cancelled',
        404
      );
    }

    return createSuccessResponse({
      data: { invoiceId },
      message: 'Invoice cancelled successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to cancel invoice');
  }
}

export default handler;
