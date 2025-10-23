"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/jwt.service");
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    const jwtResult = await jwt_service_1.jwtService.verifyToken(token);
    if (!jwtResult.isValid || !jwtResult.payload || !jwtResult.payload.userId) {
        throw new Error('Invalid authentication token');
    }
    return {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        role: jwtResult.payload.role,
        districtId: jwtResult.payload.districtId,
        tenantId: jwtResult.payload.tenantId,
        isActive: true,
    };
}
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Enterprise billing consolidation request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path,
        });
        let authResult;
        try {
            authResult = await authenticateLambda(event);
        }
        catch (authError) {
            logger_1.logger.warn('Authentication failed', { requestId, error: authError.message });
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401);
        }
        if (!['district_admin', 'super_admin', 'billing_admin', 'finance_admin'].includes(authResult.role)) {
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', 'Insufficient permissions for billing operations', 403);
        }
        const { httpMethod: method } = event;
        const pathParameters = event.pathParameters || {};
        const { invoiceId } = pathParameters;
        const db = database_service_1.databaseService.client;
        switch (method) {
            case 'GET':
                if (event.path?.includes('/usage-metrics')) {
                    return await getUsageMetrics(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/billing-config')) {
                    return await getBillingConfiguration(authResult, db);
                }
                else if (event.path?.includes('/invoices')) {
                    if (invoiceId) {
                        return await getInvoice(invoiceId, authResult, db);
                    }
                    else {
                        return await listInvoices(event.queryStringParameters, authResult, db);
                    }
                }
                else if (event.path?.includes('/payments')) {
                    return await getPaymentHistory(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/financial-summary')) {
                    return await getFinancialSummary(event.queryStringParameters, authResult, db);
                }
                break;
            case 'POST':
                if (event.path?.includes('/generate-invoice')) {
                    return await generateConsolidatedInvoice(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/process-payment')) {
                    return await processPayment(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/calculate-usage')) {
                    return await calculateUsageCharges(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/send-invoice')) {
                    return await sendInvoice(JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            case 'PUT':
                if (event.path?.includes('/billing-config')) {
                    return await updateBillingConfiguration(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (invoiceId && event.path?.includes('/update')) {
                    return await updateInvoice(invoiceId, JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            case 'DELETE':
                if (invoiceId && event.path?.includes('/cancel')) {
                    return await cancelInvoice(invoiceId, authResult, db);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        return (0, response_utils_1.createErrorResponse)('INVALID_PATH', 'Invalid request path', 400);
    }
    catch (error) {
        logger_1.logger.error('Enterprise billing consolidation request failed', error, {
            requestId,
        });
        return (0, response_utils_1.handleError)(error, 'Billing consolidation operation failed');
    }
};
exports.handler = handler;
async function getUsageMetrics(queryParams, user, db) {
    try {
        const startDate = queryParams?.startDate
            ? new Date(queryParams.startDate)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = queryParams?.endDate ? new Date(queryParams.endDate) : new Date();
        const { districtId } = user;
        if (!districtId && user.role !== 'super_admin') {
            return (0, response_utils_1.createErrorResponse)('DISTRICT_REQUIRED', 'District ID required', 400);
        }
        const [schoolMetrics, orderMetrics, userMetrics, systemMetrics] = await Promise.all([
            getSchoolUsageMetrics(districtId, startDate, endDate, db),
            getOrderUsageMetrics(districtId, startDate, endDate, db),
            getUserUsageMetrics(districtId, startDate, endDate, db),
            getSystemUsageMetrics(districtId, startDate, endDate, db),
        ]);
        const usageMetrics = {
            schoolCount: schoolMetrics.activeSchools,
            studentCount: userMetrics.totalStudents,
            orderCount: orderMetrics.totalOrders,
            apiCalls: systemMetrics.apiCalls,
            storageGB: systemMetrics.storageGB,
            bandwidthGB: systemMetrics.bandwidthGB,
            activeUsers: userMetrics.activeUsers,
        };
        const billingConfig = await getBillingConfigurationData(districtId, db);
        const calculatedCharges = calculateUsageBasedCharges(usageMetrics, billingConfig);
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                period: { startDate, endDate },
                metrics: usageMetrics,
                calculatedCharges,
                billingConfig,
            },
            message: 'Usage metrics retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve usage metrics');
    }
}
async function getSchoolUsageMetrics(districtId, startDate, endDate, db) {
    const result = (await db.$queryRaw `
    SELECT
      COUNT(*) as total_schools,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_schools,
      COUNT(CASE WHEN created_at BETWEEN ${startDate} AND ${endDate} THEN 1 END) as new_schools
    FROM schools
    WHERE (district_id = ${districtId} OR ${!districtId})
  `);
    return {
        totalSchools: parseInt(result[0]?.total_schools || '0'),
        activeSchools: parseInt(result[0]?.active_schools || '0'),
        newSchools: parseInt(result[0]?.new_schools || '0'),
    };
}
async function getOrderUsageMetrics(districtId, startDate, endDate, db) {
    const result = (await db.$queryRaw `
    SELECT
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      COUNT(DISTINCT user_id) as unique_customers,
      AVG(total_amount) as avg_order_value
    FROM orders o
    JOIN schools s ON o.school_id = s.id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND o.created_at BETWEEN ${startDate} AND ${endDate}
  `);
    return {
        totalOrders: parseInt(result[0]?.total_orders || '0'),
        totalRevenue: parseFloat(result[0]?.total_revenue || '0'),
        uniqueCustomers: parseInt(result[0]?.unique_customers || '0'),
        avgOrderValue: parseFloat(result[0]?.avg_order_value || '0'),
    };
}
async function getUserUsageMetrics(districtId, startDate, endDate, db) {
    const result = (await db.$queryRaw `
    SELECT
      COUNT(CASE WHEN u.role = 'student' THEN 1 END) as total_students,
      COUNT(CASE WHEN u.role = 'student' AND u.is_active = true THEN 1 END) as active_students,
      COUNT(CASE WHEN u.last_login >= ${startDate} THEN 1 END) as active_users
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
  `);
    return {
        totalStudents: parseInt(result[0]?.total_students || '0'),
        activeStudents: parseInt(result[0]?.active_students || '0'),
        activeUsers: parseInt(result[0]?.active_users || '0'),
    };
}
async function getSystemUsageMetrics(districtId, startDate, endDate, db) {
    const schools = (await db.$queryRaw `
    SELECT COUNT(*) as count FROM schools
    WHERE (district_id = ${districtId} OR ${!districtId})
    AND is_active = true
  `);
    const schoolCount = parseInt(schools[0]?.count || '0');
    return {
        apiCalls: schoolCount * 1000,
        storageGB: schoolCount * 5,
        bandwidthGB: schoolCount * 10,
    };
}
async function getBillingConfiguration(user, db) {
    try {
        const { districtId } = user;
        if (!districtId && user.role !== 'super_admin') {
            return (0, response_utils_1.createErrorResponse)('DISTRICT_REQUIRED', 'District ID required', 400);
        }
        const config = await getBillingConfigurationData(districtId, db);
        return (0, response_utils_1.createSuccessResponse)({
            data: { config },
            message: 'Billing configuration retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve billing configuration');
    }
}
async function getBillingConfigurationData(districtId, db) {
    return {
        districtId: districtId || '',
        billingModel: 'HYBRID',
        baseFee: 500,
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
function calculateUsageBasedCharges(metrics, config) {
    const charges = {
        baseFee: config.baseFee,
        studentCharges: metrics.studentCount * config.usageRates.perStudent,
        orderCharges: metrics.orderCount * config.usageRates.perOrder,
        apiCharges: metrics.apiCalls * config.usageRates.perAPICall,
        storageCharges: metrics.storageGB * config.usageRates.perGBStorage,
        bandwidthCharges: metrics.bandwidthGB * config.usageRates.perGBBandwidth,
    };
    const subtotal = Object.values(charges).reduce((sum, charge) => sum + charge, 0);
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
async function generateConsolidatedInvoice(invoiceData, user, db) {
    try {
        const { billingPeriod, includeUsage = true } = invoiceData;
        const { districtId } = user;
        if (!districtId && user.role !== 'super_admin') {
            return (0, response_utils_1.createErrorResponse)('DISTRICT_REQUIRED', 'District ID required', 400);
        }
        const startDate = new Date(billingPeriod.startDate);
        const endDate = new Date(billingPeriod.endDate);
        const usageMetrics = await getUsageMetrics({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        }, user, db);
        if (usageMetrics.statusCode !== 200) {
            return usageMetrics;
        }
        const usageData = JSON.parse(usageMetrics.body).data;
        const { billingConfig } = usageData;
        const lineItems = [];
        lineItems.push({
            id: `base_${Date.now()}`,
            type: 'BASE_FEE',
            description: 'Monthly Base Fee',
            quantity: 1,
            unitPrice: billingConfig.baseFee,
            amount: billingConfig.baseFee,
        });
        if (includeUsage) {
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
        const subtotal = lineItems
            .filter(item => item.type !== 'DISCOUNT' && item.type !== 'TAX')
            .reduce((sum, item) => sum + item.amount, 0);
        const discounts = Math.abs(lineItems.filter(item => item.type === 'DISCOUNT').reduce((sum, item) => sum + item.amount, 0));
        const taxRate = 0.18;
        const taxes = (subtotal - discounts) * taxRate;
        lineItems.push({
            id: `tax_${Date.now()}`,
            type: 'TAX',
            description: 'GST (18%)',
            quantity: 1,
            unitPrice: taxes,
            amount: taxes,
        });
        const total = subtotal - discounts + taxes;
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const invoice = {
            id: invoiceId,
            invoiceNumber,
            districtId: districtId,
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
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await db.$queryRaw `
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
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoice },
            message: 'Consolidated invoice generated successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to generate consolidated invoice');
    }
}
async function getInvoice(invoiceId, user, db) {
    try {
        const invoice = (await db.$queryRaw `
      SELECT * FROM district_billing
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `);
        if (!invoice.length) {
            return (0, response_utils_1.createErrorResponse)('INVOICE_NOT_FOUND', 'Invoice not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoice: invoice[0] },
            message: 'Invoice retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve invoice');
    }
}
async function listInvoices(queryParams, user, db) {
    try {
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '20');
        const offset = (page - 1) * limit;
        let whereCondition = '';
        const params = [];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition = 'WHERE district_id = $1';
            params.push(user.districtId);
        }
        if (queryParams?.status) {
            if (whereCondition) {
                whereCondition += ` AND payment_status = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE payment_status = $${params.length + 1}`;
            }
            params.push(queryParams.status);
        }
        if (queryParams?.period) {
            if (whereCondition) {
                whereCondition += ` AND billing_period = $${params.length + 1}`;
            }
            else {
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
            db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
            db.$queryRawUnsafe(dataQuery, ...params),
        ]);
        const totalCount = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(totalCount / limit);
        return (0, response_utils_1.createSuccessResponse)({
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
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to list invoices');
    }
}
async function processPayment(paymentData, user, db) {
    try {
        const { invoiceId, amount, method, paymentDetails } = paymentData;
        if (!invoiceId || !amount || !method) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invoice ID, amount, and payment method are required', 400);
        }
        const invoice = (await db.$queryRaw `
      SELECT * FROM district_billing
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND payment_status IN ('PENDING', 'OVERDUE')
    `);
        if (!invoice.length) {
            return (0, response_utils_1.createErrorResponse)('INVOICE_NOT_PAYABLE', 'Invoice not found or not eligible for payment', 404);
        }
        const invoiceData = invoice[0];
        if (Math.abs(amount - invoiceData.total_amount) > 0.01) {
            return (0, response_utils_1.createErrorResponse)('AMOUNT_MISMATCH', 'Payment amount does not match invoice total', 400);
        }
        const paymentResult = await processPaymentWithGateway(amount, method, paymentDetails);
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.$queryRaw `
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
        if (paymentResult.status === 'COMPLETED') {
            await db.$queryRaw `
        UPDATE district_billing
        SET payment_status = 'PAID', paid_at = NOW(), updated_at = NOW()
        WHERE id = ${invoiceId}
      `;
        }
        const payment = {
            id: paymentId,
            invoiceId,
            amount,
            currency: invoiceData.currency,
            method,
            status: paymentResult.status,
            transactionId: paymentResult.transactionId,
            processedAt: paymentResult.status === 'COMPLETED' ? new Date() : undefined,
            metadata: paymentResult.metadata,
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { payment },
            message: paymentResult.status === 'COMPLETED'
                ? 'Payment processed successfully'
                : 'Payment initiated, processing...',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to process payment');
    }
}
async function processPaymentWithGateway(amount, method, paymentDetails) {
    return new Promise(resolve => {
        setTimeout(() => {
            const success = Math.random() > 0.1;
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
            }
            else {
                resolve({
                    status: 'FAILED',
                    metadata: {
                        gateway: 'mock_gateway',
                        failureReason: 'Insufficient funds',
                        amount,
                    },
                });
            }
        }, 1000);
    });
}
async function getPaymentHistory(queryParams, user, db) {
    try {
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '20');
        const offset = (page - 1) * limit;
        const payments = (await db.$queryRaw `
      SELECT
        pr.*,
        db.invoice_number,
        db.billing_period
      FROM payment_records pr
      JOIN district_billing db ON pr.invoice_id = db.id
      WHERE (db.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      ORDER BY pr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
        return (0, response_utils_1.createSuccessResponse)({
            data: { payments },
            pagination: {
                page,
                limit,
                total: payments.length,
                pages: Math.ceil(payments.length / limit),
                hasNext: payments.length === limit,
                hasPrev: page > 1,
            },
            message: 'Payment history retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve payment history');
    }
}
async function getFinancialSummary(queryParams, user, db) {
    try {
        const period = queryParams?.period || '12';
        const { districtId } = user;
        const summary = (await db.$queryRaw `
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
    `);
        const summaryData = summary[0] || {};
        const monthlyBreakdown = (await db.$queryRaw `
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
    `);
        const financialSummary = {
            overview: {
                totalInvoices: parseInt(summaryData.total_invoices || '0'),
                totalBilled: parseFloat(summaryData.total_billed || '0'),
                totalPaid: parseFloat(summaryData.total_paid || '0'),
                totalPending: parseFloat(summaryData.total_pending || '0'),
                totalOverdue: parseFloat(summaryData.total_overdue || '0'),
                avgInvoiceAmount: parseFloat(summaryData.avg_invoice_amount || '0'),
                paymentRate: summaryData.total_billed > 0
                    ? (parseFloat(summaryData.total_paid) / parseFloat(summaryData.total_billed)) * 100
                    : 0,
            },
            monthlyBreakdown: monthlyBreakdown.map(month => ({
                month: month.month,
                invoiceCount: parseInt(month.invoice_count),
                totalAmount: parseFloat(month.total_amount),
                paidAmount: parseFloat(month.paid_amount),
                paymentRate: month.total_amount > 0
                    ? (parseFloat(month.paid_amount) / parseFloat(month.total_amount)) * 100
                    : 0,
            })),
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { summary: financialSummary },
            message: 'Financial summary retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve financial summary');
    }
}
async function updateBillingConfiguration(configData, user, db) {
    try {
        const { districtId } = user;
        if (!districtId && user.role !== 'super_admin') {
            return (0, response_utils_1.createErrorResponse)('DISTRICT_REQUIRED', 'District ID required', 400);
        }
        if (!configData.billingModel || !configData.baseFee || !configData.currency) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Billing model, base fee, and currency are required', 400);
        }
        await db.$queryRaw `
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
        return (0, response_utils_1.createSuccessResponse)({
            data: { config: configData },
            message: 'Billing configuration updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update billing configuration');
    }
}
async function calculateUsageCharges(calculationData, user, db) {
    try {
        const { metrics, config } = calculationData;
        if (!metrics || !config) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Metrics and configuration are required', 400);
        }
        const charges = calculateUsageBasedCharges(metrics, config);
        return (0, response_utils_1.createSuccessResponse)({
            data: { charges },
            message: 'Usage charges calculated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to calculate usage charges');
    }
}
async function sendInvoice(sendData, user, db) {
    try {
        const { invoiceId, recipients, method = 'EMAIL' } = sendData;
        if (!invoiceId || !recipients) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Invoice ID and recipients are required', 400);
        }
        await db.$queryRaw `
      UPDATE district_billing
      SET payment_status = 'SENT', updated_at = NOW()
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `;
        logger_1.logger.info('Invoice sent', {
            invoiceId,
            recipients,
            method,
            sentBy: user.id,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoiceId, status: 'SENT' },
            message: 'Invoice sent successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to send invoice');
    }
}
async function updateInvoice(invoiceId, updateData, user, db) {
    try {
        const updateFields = [];
        const params = [];
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
            return (0, response_utils_1.createErrorResponse)('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
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
        const result = (await db.$queryRawUnsafe(query, ...params));
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('INVOICE_NOT_FOUND', 'Invoice not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoice: result[0] },
            message: 'Invoice updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update invoice');
    }
}
async function cancelInvoice(invoiceId, user, db) {
    try {
        const result = (await db.$queryRaw `
      UPDATE district_billing
      SET payment_status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${invoiceId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND payment_status IN ('PENDING', 'SENT', 'OVERDUE')
      RETURNING id
    `);
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('INVOICE_NOT_CANCELLABLE', 'Invoice not found or cannot be cancelled', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { invoiceId },
            message: 'Invoice cancelled successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to cancel invoice');
    }
}
exports.default = exports.handler;
//# sourceMappingURL=enterprise-billing-consolidation.js.map