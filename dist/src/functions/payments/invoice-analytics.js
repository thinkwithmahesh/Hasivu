"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceAnalyticsHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const logger = logger_service_1.LoggerService.getInstance();
const prisma = new client_1.PrismaClient();
const analyticsQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    reportType: zod_1.z.enum(['revenue', 'performance', 'compliance', 'delivery']).optional(),
    granularity: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
    includeDetails: zod_1.z.coerce.boolean().default(false),
    limit: zod_1.z.coerce.number().int().min(1).max(1000).default(100),
    offset: zod_1.z.coerce.number().int().min(0).default(0)
});
const complianceReportSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    schoolId: zod_1.z.string().uuid().optional(),
    reportFormat: zod_1.z.enum(['json', 'csv', 'pdf']).default('json'),
    includeAuditTrail: zod_1.z.boolean().default(true),
    complianceStandards: zod_1.z.array(zod_1.z.string()).optional()
});
const performanceMetricsSchema = zod_1.z.object({
    timeRange: zod_1.z.enum(['1h', '24h', '7d', '30d', '90d']).default('24h'),
    schoolId: zod_1.z.string().uuid().optional(),
    metrics: zod_1.z.array(zod_1.z.enum(['processing_time', 'success_rate', 'error_rate', 'volume'])).optional()
});
async function validateUserAccess(event, requestId) {
    const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
    const userId = event.headers['x-user-id'] || event.requestContext?.authorizer?.userId;
    const schoolId = event.headers['x-school-id'] || event.requestContext?.authorizer?.schoolId;
    const role = event.headers['x-user-role'] || event.requestContext?.authorizer?.role || 'admin';
    if (!userId) {
        logger.warn('Invoice analytics access denied - no user ID', {
            requestId,
            clientIP,
            userAgent: userAgent.substring(0, 200),
            action: 'authentication_failed'
        });
        throw new Error('Authentication required');
    }
    const allowedRoles = ['admin', 'super_admin', 'school_admin', 'finance_manager'];
    if (!allowedRoles.includes(role)) {
        logger.warn('Invoice analytics access denied - insufficient permissions', {
            requestId,
            userId,
            role,
            requiredRoles: allowedRoles,
            action: 'authorization_failed'
        });
        throw new Error('Insufficient permissions for analytics access');
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true }
    });
    if (!user || user.status !== 'ACTIVE') {
        throw new Error('Access denied');
    }
    return { userId, schoolId: schoolId || '', role };
}
async function generateRevenueAnalytics(query, userId, schoolId, requestId) {
    try {
        const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = query.endDate ? new Date(query.endDate) : new Date();
        const whereClause = {
            createdAt: {
                gte: startDate,
                lte: endDate
            },
            status: 'PAID'
        };
        if (schoolId) {
            whereClause.schoolId = schoolId;
        }
        const revenueSummary = await prisma.invoice.aggregate({
            where: whereClause,
            _sum: {
                totalAmount: true,
                taxAmount: true,
                discountAmount: true
            },
            _count: {
                id: true
            },
            _avg: {
                totalAmount: true
            }
        });
        let dateGroupBy;
        switch (query.granularity) {
            case 'daily':
                dateGroupBy = 'DATE(i."createdAt")';
                break;
            case 'weekly':
                dateGroupBy = 'DATE_TRUNC(\'week\', i."createdAt")';
                break;
            case 'quarterly':
                dateGroupBy = 'DATE_TRUNC(\'quarter\', i."createdAt")';
                break;
            default:
                dateGroupBy = 'DATE_TRUNC(\'month\', i."createdAt")';
                break;
        }
        const timeSeriesData = await prisma.$queryRaw `
      SELECT 
        ${dateGroupBy} as period,
        SUM(i."totalAmount") as revenue,
        COUNT(i.id) as invoice_count,
        AVG(i."totalAmount") as avg_invoice_value,
        SUM(i."taxAmount") as tax_collected,
        SUM(i."discountAmount") as discounts_given
      FROM "Invoice" i
      WHERE i."createdAt" >= ${startDate}
        AND i."createdAt" <= ${endDate}
        AND i."status" = 'PAID'
        ${schoolId ? `AND i."schoolId" = '${schoolId}'` : ''}
      GROUP BY ${dateGroupBy}
      ORDER BY period ASC
    `;
        const paymentMethodBreakdown = await prisma.$queryRaw `
      SELECT 
        p."method" as payment_method,
        COUNT(p.id) as transaction_count,
        SUM(p."amount") as total_amount,
        AVG(p."amount") as avg_amount
      FROM "Payment" p
      JOIN "Invoice" i ON p."invoiceId" = i.id
      WHERE i."createdAt" >= ${startDate}
        AND i."createdAt" <= ${endDate}
        AND p."status" = 'COMPLETED'
        ${schoolId ? `AND i."schoolId" = '${schoolId}'` : ''}
      GROUP BY p."method"
      ORDER BY total_amount DESC
    `;
        const topRevenueItems = await prisma.$queryRaw `
      SELECT 
        ii."menuItemId",
        mi."name" as item_name,
        SUM(ii."quantity" * ii."unitPrice") as revenue,
        SUM(ii."quantity") as total_quantity,
        COUNT(DISTINCT ii."invoiceId") as invoice_count
      FROM "InvoiceItem" ii
      JOIN "Invoice" i ON ii."invoiceId" = i.id
      JOIN "MenuItem" mi ON ii."menuItemId" = mi.id
      WHERE i."createdAt" >= ${startDate}
        AND i."createdAt" <= ${endDate}
        AND i."status" = 'PAID'
        ${schoolId ? `AND i."schoolId" = '${schoolId}'` : ''}
      GROUP BY ii."menuItemId", mi."name"
      ORDER BY revenue DESC
      LIMIT 10
    `;
        logger.info('Revenue analytics generated', {
            requestId,
            userId,
            schoolId,
            dateRange: { startDate, endDate },
            granularity: query.granularity,
            totalRevenue: revenueSummary._sum.totalAmount,
            invoiceCount: revenueSummary._count.id
        });
        return {
            summary: {
                totalRevenue: revenueSummary._sum.totalAmount || 0,
                totalInvoices: revenueSummary._count.id || 0,
                averageInvoiceValue: revenueSummary._avg.totalAmount || 0,
                totalTax: revenueSummary._sum.taxAmount || 0,
                totalDiscounts: revenueSummary._sum.discountAmount || 0,
                period: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    granularity: query.granularity
                }
            },
            timeSeries: timeSeriesData,
            paymentMethods: paymentMethodBreakdown,
            topItems: topRevenueItems,
            metadata: {
                generatedAt: new Date().toISOString(),
                requestId,
                userId
            }
        };
    }
    catch (error) {
        logger.error('Failed to generate revenue analytics', {
            requestId,
            userId,
            schoolId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
async function generatePerformanceMetrics(request, userId, schoolId, requestId) {
    try {
        const timeRangeHours = {
            '1h': 1,
            '24h': 24,
            '7d': 24 * 7,
            '30d': 24 * 30,
            '90d': 24 * 90
        }[request.timeRange];
        const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
        const endDate = new Date();
        const processingMetrics = await prisma.$queryRaw `
      SELECT 
        COUNT(p.id) as total_transactions,
        COUNT(CASE WHEN p."status" = 'COMPLETED' THEN 1 END) as successful_transactions,
        COUNT(CASE WHEN p."status" = 'FAILED' THEN 1 END) as failed_transactions,
        AVG(EXTRACT(EPOCH FROM (p."updatedAt" - p."createdAt"))) as avg_processing_time_seconds,
        MIN(p."createdAt") as earliest_transaction,
        MAX(p."createdAt") as latest_transaction
      FROM "Payment" p
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
        ${schoolId ? `AND p."schoolId" = '${schoolId}'` : ''}
    `;
        const errorAnalysis = await prisma.$queryRaw `
      SELECT 
        p."errorCode",
        p."errorMessage",
        COUNT(p.id) as error_count,
        COUNT(p.id) * 100.0 / (
          SELECT COUNT(*) FROM "Payment" 
          WHERE "createdAt" >= ${startDate} 
            AND "createdAt" <= ${endDate}
            ${schoolId ? `AND "schoolId" = '${schoolId}'` : ''}
        ) as error_percentage
      FROM "Payment" p
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
        AND p."status" = 'FAILED'
        AND p."errorCode" IS NOT NULL
        ${schoolId ? `AND p."schoolId" = '${schoolId}'` : ''}
      GROUP BY p."errorCode", p."errorMessage"
      ORDER BY error_count DESC
      LIMIT 10
    `;
        const gatewayPerformance = await prisma.$queryRaw `
      SELECT 
        p."gateway",
        COUNT(p.id) as transaction_count,
        COUNT(CASE WHEN p."status" = 'COMPLETED' THEN 1 END) as successful_count,
        AVG(EXTRACT(EPOCH FROM (p."updatedAt" - p."createdAt"))) as avg_processing_time,
        COUNT(CASE WHEN p."status" = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(p.id) as success_rate
      FROM "Payment" p
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
        ${schoolId ? `AND p."schoolId" = '${schoolId}'` : ''}
      GROUP BY p."gateway"
      ORDER BY success_rate DESC
    `;
        const invoiceMetrics = await prisma.$queryRaw `
      SELECT 
        COUNT(i.id) as total_invoices,
        AVG(EXTRACT(EPOCH FROM (i."updatedAt" - i."createdAt"))) as avg_generation_time,
        COUNT(CASE WHEN i."status" = 'PAID' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN i."status" = 'PENDING' THEN 1 END) as pending_invoices,
        COUNT(CASE WHEN i."status" = 'CANCELLED' THEN 1 END) as cancelled_invoices
      FROM "Invoice" i
      WHERE i."createdAt" >= ${startDate}
        AND i."createdAt" <= ${endDate}
        ${schoolId ? `AND i."schoolId" = '${schoolId}'` : ''}
    `;
        logger.info('Performance metrics generated', {
            requestId,
            userId,
            schoolId,
            timeRange: request.timeRange,
            metricsRequested: request.metrics
        });
        return {
            timeRange: {
                period: request.timeRange,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            processing: processingMetrics[0] || {},
            errors: errorAnalysis,
            gateways: gatewayPerformance,
            invoices: invoiceMetrics[0] || {},
            metadata: {
                generatedAt: new Date().toISOString(),
                requestId,
                userId
            }
        };
    }
    catch (error) {
        logger.error('Failed to generate performance metrics', {
            requestId,
            userId,
            schoolId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
        });
        throw error;
    }
}
async function generateComplianceReport(request, userId, schoolId, requestId) {
    try {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        const auditSummary = await prisma.$queryRaw `
      SELECT 
        COUNT(a.id) as total_audit_events,
        COUNT(DISTINCT a."userId") as unique_users,
        COUNT(CASE WHEN a."action" LIKE '%payment%' THEN 1 END) as payment_events,
        COUNT(CASE WHEN a."action" LIKE '%invoice%' THEN 1 END) as invoice_events,
        COUNT(CASE WHEN a."riskLevel" = 'HIGH' THEN 1 END) as high_risk_events
      FROM "AuditLog" a
      WHERE a."timestamp" >= ${startDate}
        AND a."timestamp" <= ${endDate}
        ${schoolId ? `AND a."schoolId" = '${schoolId}'` : ''}
    `;
        const financialCompliance = await prisma.$queryRaw `
      SELECT 
        COUNT(CASE WHEN i."totalAmount" != (
          SELECT SUM(ii."quantity" * ii."unitPrice") 
          FROM "InvoiceItem" ii 
          WHERE ii."invoiceId" = i.id
        ) + COALESCE(i."taxAmount", 0) - COALESCE(i."discountAmount", 0) THEN 1 END) as amount_discrepancies,
        COUNT(CASE WHEN p."amount" != i."totalAmount" THEN 1 END) as payment_mismatches,
        COUNT(CASE WHEN i."dueDate" < i."createdAt" THEN 1 END) as invalid_due_dates,
        COUNT(CASE WHEN i."status" = 'PAID' AND NOT EXISTS(
          SELECT 1 FROM "Payment" p2 
          WHERE p2."invoiceId" = i.id AND p2."status" = 'COMPLETED'
        ) THEN 1 END) as orphaned_payments
      FROM "Invoice" i
      LEFT JOIN "Payment" p ON p."invoiceId" = i.id AND p."status" = 'COMPLETED'
      WHERE i."createdAt" >= ${startDate}
        AND i."createdAt" <= ${endDate}
        ${schoolId ? `AND i."schoolId" = '${schoolId}'` : ''}
    `;
        const securityCompliance = await prisma.$queryRaw `
      SELECT 
        COUNT(CASE WHEN p."method" = 'CARD' AND p."cardToken" IS NULL THEN 1 END) as unencrypted_cards,
        COUNT(CASE WHEN p."ipAddress" IS NULL THEN 1 END) as missing_ip_addresses,
        COUNT(CASE WHEN a."riskLevel" = 'HIGH' AND a."action" LIKE '%payment%' THEN 1 END) as high_risk_payments,
        COUNT(CASE WHEN p."fraudScore" > 0.8 THEN 1 END) as high_fraud_score_payments
      FROM "Payment" p
      LEFT JOIN "AuditLog" a ON a."entityId" = p.id AND a."entityType" = 'payment'
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
        ${schoolId ? `AND p."schoolId" = '${schoolId}'` : ''}
    `;
        const dataRetention = await prisma.$queryRaw `
      SELECT 
        COUNT(CASE WHEN p."createdAt" < NOW() - INTERVAL '7 years' THEN 1 END) as payments_due_for_archival,
        COUNT(CASE WHEN i."createdAt" < NOW() - INTERVAL '7 years' THEN 1 END) as invoices_due_for_archival,
        COUNT(CASE WHEN a."timestamp" < NOW() - INTERVAL '3 years' THEN 1 END) as audit_logs_due_for_archival
      FROM "Payment" p
      CROSS JOIN "Invoice" i
      CROSS JOIN "AuditLog" a
      WHERE p."createdAt" >= ${startDate}
        AND p."createdAt" <= ${endDate}
        ${schoolId ? `AND p."schoolId" = '${schoolId}'` : ''}
    `;
        logger.info('Compliance report generated', {
            requestId,
            userId,
            schoolId,
            dateRange: { startDate, endDate },
            format: request.reportFormat
        });
        const reportData = {
            reportInfo: {
                generatedAt: new Date().toISOString(),
                period: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                scope: schoolId ? 'school' : 'system',
                standards: request.complianceStandards || ['PCI-DSS', 'GDPR', 'SOX'],
                requestId
            },
            auditSummary: auditSummary[0] || {},
            financialCompliance: financialCompliance[0] || {},
            securityCompliance: securityCompliance[0] || {},
            dataRetention: dataRetention[0] || {},
            recommendations: [
                ...((financialCompliance[0]?.amount_discrepancies > 0) ? ['Review invoice calculation logic'] : []),
                ...((securityCompliance[0]?.unencrypted_cards > 0) ? ['Implement card tokenization'] : []),
                ...((dataRetention[0]?.payments_due_for_archival > 0) ? ['Implement data archival policy'] : [])
            ]
        };
        if (request.reportFormat === 'csv') {
            return {
                format: 'csv',
                data: reportData,
                contentType: 'text/csv',
                fileName: `compliance-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.csv`
            };
        }
        else if (request.reportFormat === 'pdf') {
            return {
                format: 'pdf',
                data: reportData,
                contentType: 'application/pdf',
                fileName: `compliance-report-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.pdf`,
                message: 'PDF generation would be implemented with a PDF library'
            };
        }
        return reportData;
    }
    catch (error) {
        logger.error('Failed to generate compliance report', {
            requestId,
            userId,
            schoolId,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
const invoiceAnalyticsHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        const clientIP = event.requestContext?.identity?.sourceIp || 'unknown';
        const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || 'unknown';
        logger.info('Invoice analytics request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
            clientIP,
            userAgent: userAgent.substring(0, 200)
        });
        const { userId, schoolId, role } = await validateUserAccess(event, requestId);
        let result;
        switch (event.httpMethod) {
            case 'GET': {
                const queryParams = event.queryStringParameters || {};
                const analyticsQuery = analyticsQuerySchema.parse(queryParams);
                if (analyticsQuery.reportType === 'revenue' || !analyticsQuery.reportType) {
                    result = await generateRevenueAnalytics(analyticsQuery, userId, schoolId, requestId);
                }
                else if (analyticsQuery.reportType === 'performance') {
                    const perfRequest = {
                        timeRange: '24h',
                        schoolId: schoolId || undefined,
                        metrics: ['processing_time', 'success_rate', 'error_rate', 'volume']
                    };
                    result = await generatePerformanceMetrics(perfRequest, userId, schoolId, requestId);
                }
                else {
                    return (0, response_utils_1.createErrorResponse)(400, 'Invalid report type', undefined, 'INVALID_REPORT_TYPE', requestId);
                }
                break;
            }
            case 'POST': {
                if (!event.body) {
                    return (0, response_utils_1.createErrorResponse)(400, 'Request body required', undefined, 'MISSING_BODY', requestId);
                }
                const body = JSON.parse(event.body);
                if (event.path?.includes('/performance')) {
                    const perfRequest = performanceMetricsSchema.parse(body);
                    result = await generatePerformanceMetrics(perfRequest, userId, schoolId, requestId);
                }
                else if (event.path?.includes('/compliance')) {
                    const complianceRequest = complianceReportSchema.parse(body);
                    result = await generateComplianceReport(complianceRequest, userId, schoolId, requestId);
                }
                else {
                    return (0, response_utils_1.createErrorResponse)(400, 'Invalid endpoint', undefined, 'INVALID_ENDPOINT', requestId);
                }
                break;
            }
            default:
                return (0, response_utils_1.createErrorResponse)(405, `Method ${event.httpMethod} not allowed`, undefined, 'METHOD_NOT_ALLOWED', requestId);
        }
        const duration = Date.now() - startTime;
        logger.info('Invoice analytics request completed', {
            requestId,
            method: event.httpMethod,
            userId,
            schoolId,
            role,
            duration,
            success: true
        });
        return (0, response_utils_1.createSuccessResponse)(result, 'Invoice analytics generated successfully', 200, requestId);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Invoice analytics request failed', {
            requestId,
            method: event.httpMethod,
            error: error instanceof Error ? error.message : String(error),
            duration
        });
        if (error instanceof Error) {
            if (error instanceof Error ? error.message : String(error).includes('Authentication required')) {
                return (0, response_utils_1.createErrorResponse)(401, 'Authentication required', undefined, 'AUTHENTICATION_REQUIRED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('Insufficient permissions')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Insufficient permissions for analytics access', undefined, 'ACCESS_DENIED', requestId);
            }
            if (error instanceof Error ? error.message : String(error).includes('Access denied')) {
                return (0, response_utils_1.createErrorResponse)(403, 'Access denied', undefined, 'ACCESS_DENIED', requestId);
            }
        }
        return (0, response_utils_1.createErrorResponse)(500, 'Internal server error', undefined, 'INTERNAL_ERROR', requestId);
    }
};
exports.invoiceAnalyticsHandler = invoiceAnalyticsHandler;
//# sourceMappingURL=invoice-analytics.js.map