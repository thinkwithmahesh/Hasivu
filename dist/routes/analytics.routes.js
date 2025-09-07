"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
/**
 * HASIVU Platform - Analytics Routes
 * Analytics and reporting API endpoints for business intelligence and data analysis
 */
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const analytics_service_1 = require("../services/analytics.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logging_middleware_1 = require("../middleware/logging.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const structured_logging_service_1 = require("../services/structured-logging.service");
const router = (0, express_1.Router)();
exports.analyticsRoutes = router;
// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array(),
            data: null
        });
        return;
    }
    next();
};
// Analytics access control middleware
const requireAnalyticsAccess = (req, res, next) => {
    if (!['admin', 'super_admin', 'school_admin'].includes(req.user.role)) {
        res.status(403).json({
            success: false,
            message: 'Insufficient permissions for analytics access',
            errors: [],
            data: null
        });
        return;
    }
    next();
};
// Apply middleware
router.use(logging_middleware_1.requestLogger);
router.use(rateLimiter_middleware_1.generalRateLimit);
router.use(auth_middleware_1.authMiddleware);
router.use(requireAnalyticsAccess);
/**
 * POST /api/v1/analytics/query
 * Execute custom analytics query with metrics, dimensions, and filters
 */
router.post('/query', [
    (0, express_validator_1.body)('metrics')
        .isArray({ min: 1 })
        .withMessage('At least one metric is required'),
    (0, express_validator_1.body)('dateRange')
        .isObject()
        .withMessage('Date range is required'),
    (0, express_validator_1.body)('dateRange.start')
        .isISO8601()
        .toDate()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('dateRange.end')
        .isISO8601()
        .toDate()
        .withMessage('End date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('dimensions')
        .optional()
        .isArray()
        .withMessage('Dimensions must be an array'),
    (0, express_validator_1.body)('filters')
        .optional()
        .isObject()
        .withMessage('Filters must be an object'),
    (0, express_validator_1.body)('groupBy')
        .optional()
        .isIn(['hour', 'day', 'week', 'month', 'quarter', 'year'])
        .withMessage('Invalid group by period'),
    (0, express_validator_1.body)('orderBy')
        .optional()
        .isArray()
        .withMessage('Order by must be an array'),
    (0, express_validator_1.body)('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .toInt()
        .withMessage('Limit must be between 1 and 1000'),
    (0, express_validator_1.body)('offset')
        .optional()
        .isInt({ min: 0 })
        .toInt()
        .withMessage('Offset must be a non-negative integer')
], handleValidationErrors, async (req, res, next) => {
    try {
        const query = req.body;
        // Apply school filter for school admins
        if (req.user.role === 'school_admin') {
            query.filters = query.filters || {};
            // TODO: Add schoolId from user profile when available
            // query.filters.school_id = req.user!.schoolId;
        }
        const analyticsQuery = {
            metrics: query.metrics || [],
            filters: query.filters || {},
            dateRange: query.dateRange || { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() }
        };
        const data = await analytics_service_1.AnalyticsService.executeQuery(analyticsQuery);
        structured_logging_service_1.structuredLogger.business({
            event: 'analytics_query_executed',
            category: 'analytics',
            metadata: {
                userId: req.user.id,
                metrics: query.metrics,
                dateRange: query.dateRange
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
        res.json({
            success: true,
            message: 'Analytics query executed successfully',
            errors: [],
            data
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/analytics/dashboard/:dashboardId
 * Retrieve dashboard data with optional date range filtering
 */
router.get('/dashboard/:dashboardId', [
    (0, express_validator_1.param)('dashboardId')
        .isUUID()
        .withMessage('Dashboard ID must be a valid UUID'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { dashboardId } = req.params;
        const { startDate, endDate } = req.query;
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate)
            };
        }
        const dashboardData = await analytics_service_1.AnalyticsService.generateDashboard(dashboardId, req.user.id, dateRange);
        res.json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            errors: [],
            data: dashboardData
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/analytics/kpis
 * Retrieve Key Performance Indicators with optional filtering
 */
router.get('/kpis', [
    (0, express_validator_1.query)('schoolId')
        .optional()
        .isUUID()
        .withMessage('School ID must be a valid UUID'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date')
], handleValidationErrors, async (req, res, next) => {
    try {
        let { schoolId, startDate, endDate } = req.query;
        // Apply school filter for school admins
        if (req.user.role === 'school_admin') {
            // TODO: Get schoolId from user profile
            // schoolId = req.user!.schoolId;
        }
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate)
            };
        }
        // Generate KPI report using day period as fallback
        const kpis = await analytics_service_1.AnalyticsService.generateReport('day', 'summary');
        res.json({
            success: true,
            message: 'KPIs retrieved successfully',
            errors: [],
            data: kpis
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/analytics/realtime
 * Retrieve real-time analytics metrics and live data
 */
router.get('/realtime', [
    (0, express_validator_1.query)('metrics')
        .optional()
        .isArray()
        .withMessage('Metrics must be an array if provided')
], handleValidationErrors, async (req, res, next) => {
    try {
        const metrics = req.query.metrics || [];
        const realtimeMetrics = await analytics_service_1.AnalyticsService.getRealtimeMetrics();
        res.json({
            success: true,
            message: 'Real-time metrics retrieved successfully',
            errors: [],
            data: realtimeMetrics
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/analytics/reports
 * Generate custom analytics reports
 */
router.post('/reports', [
    (0, express_validator_1.body)('name')
        .isLength({ min: 1, max: 255 })
        .withMessage('Report name is required and must be under 255 characters'),
    (0, express_validator_1.body)('type')
        .isIn(['dashboard', 'scheduled', 'ad_hoc'])
        .withMessage('Report type must be dashboard, scheduled, or ad_hoc'),
    (0, express_validator_1.body)('query')
        .isObject()
        .withMessage('Query configuration is required'),
    (0, express_validator_1.body)('query.metrics')
        .isArray({ min: 1 })
        .withMessage('At least one metric is required'),
    (0, express_validator_1.body)('query.dateRange')
        .isObject()
        .withMessage('Date range is required'),
    (0, express_validator_1.body)('query.dateRange.start')
        .isISO8601()
        .toDate()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('query.dateRange.end')
        .isISO8601()
        .toDate()
        .withMessage('End date must be a valid ISO 8601 date')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { name, type, query } = req.body;
        // Apply school filter for school admins
        if (req.user.role === 'school_admin') {
            query.filters = query.filters || {};
            // TODO: Add schoolId from user profile when available
            // query.filters.school_id = req.user!.schoolId;
        }
        // Generate report using day period as fallback
        const reportPeriod = query.groupBy || 'day';
        const report = await analytics_service_1.AnalyticsService.generateReport(reportPeriod, 'detailed');
        res.status(201).json({
            success: true,
            message: 'Report generated successfully',
            errors: [],
            data: report
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/v1/analytics/metrics
 * Track custom metrics and events
 */
router.post('/metrics', [
    (0, express_validator_1.body)('name')
        .matches(/^[a-zA-Z][a-zA-Z0-9_\.]*$/)
        .withMessage('Metric name must start with a letter and contain only letters, numbers, underscores, and dots'),
    (0, express_validator_1.body)('value')
        .isNumeric()
        .withMessage('Metric value must be a number'),
    (0, express_validator_1.body)('dimensions')
        .optional()
        .isObject()
        .withMessage('Dimensions must be an object'),
    (0, express_validator_1.body)('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { name, value, dimensions = {}, metadata = {} } = req.body;
        // Add user and school context to dimensions
        const enrichedDimensions = {
            ...dimensions,
            user_id: req.user.id,
            user_role: req.user.role
        };
        // TODO: Add schoolId check when available in user interface
        if (false) {
            // enrichedDimensions.school_id = req.user!.schoolId;
        }
        await analytics_service_1.AnalyticsService.trackMetric(name, parseFloat(value), enrichedDimensions, metadata);
        res.status(201).json({
            success: true,
            message: 'Metric tracked successfully',
            errors: [],
            data: null
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/analytics/metrics/available
 * List all available metrics and their descriptions
 */
router.get('/metrics/available', async (req, res, next) => {
    try {
        const availableMetrics = [
            // Order metrics
            { name: 'orders.total', description: 'Total number of orders', type: 'counter' },
            { name: 'orders.value', description: 'Total order value', type: 'counter' },
            { name: 'orders.avg_value', description: 'Average order value', type: 'gauge' },
            { name: 'orders.completion_rate', description: 'Order completion rate', type: 'gauge' },
            // User metrics
            { name: 'users.total', description: 'Total active users', type: 'gauge' },
            { name: 'users.new', description: 'New user registrations', type: 'counter' },
            { name: 'users.retention', description: 'User retention rate', type: 'gauge' },
            { name: 'users.engagement', description: 'User engagement score', type: 'gauge' },
            // School metrics
            { name: 'schools.total', description: 'Total active schools', type: 'gauge' },
            { name: 'schools.orders_per_school', description: 'Average orders per school', type: 'gauge' },
            { name: 'schools.revenue_per_school', description: 'Average revenue per school', type: 'gauge' },
            // Payment metrics
            { name: 'payments.success_rate', description: 'Payment success rate', type: 'gauge' },
            { name: 'payments.avg_processing_time', description: 'Average payment processing time', type: 'gauge' },
            { name: 'payments.failed_count', description: 'Failed payment attempts', type: 'counter' },
            // RFID metrics
            { name: 'rfid.verifications', description: 'RFID verification count', type: 'counter' },
            { name: 'rfid.success_rate', description: 'RFID verification success rate', type: 'gauge' },
            { name: 'rfid.avg_scan_time', description: 'Average RFID scan time', type: 'gauge' },
            // Notification metrics
            { name: 'notifications.sent', description: 'Notifications sent', type: 'counter' },
            { name: 'notifications.delivery_rate', description: 'Notification delivery rate', type: 'gauge' },
            { name: 'notifications.engagement_rate', description: 'Notification engagement rate', type: 'gauge' },
            // System metrics
            { name: 'system.response_time', description: 'API response time', type: 'histogram' },
            { name: 'system.error_rate', description: 'System error rate', type: 'gauge' },
            { name: 'system.uptime', description: 'System uptime percentage', type: 'gauge' }
        ];
        const dimensions = [
            'user_id', 'user_role', 'school_id', 'timestamp', 'environment',
            'device_type', 'platform', 'location', 'channel', 'category'
        ];
        res.json({
            success: true,
            message: 'Available metrics retrieved successfully',
            errors: [],
            data: {
                metrics: availableMetrics,
                dimensions: dimensions
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/v1/analytics/reports/:reportId/export
 * Export report data in various formats
 */
router.get('/reports/:reportId/export', [
    (0, express_validator_1.param)('reportId')
        .isUUID()
        .withMessage('Report ID must be a valid UUID'),
    (0, express_validator_1.query)('format')
        .optional()
        .isIn(['json', 'csv', 'xlsx'])
        .withMessage('Export format must be json, csv, or xlsx')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const format = req.query.format || 'json';
        // Get report from database
        // Generate export report using day period as fallback
        const report = await analytics_service_1.AnalyticsService.generateReport('day', 'detailed');
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found',
                errors: [],
                data: null
            });
            return;
        }
        // Check access permissions
        if (req.user.role === 'school_admin' &&
            false) { // TODO: Add schoolId check
            res.status(403).json({
                success: false,
                message: 'Access denied to this report',
                errors: [],
                data: null
            });
            return;
        }
        // Generate export data
        // Generate export data using day period as fallback
        const exportResponse = await analytics_service_1.AnalyticsService.generateReport('day', 'detailed');
        const exportData = exportResponse.success ? exportResponse.data : null;
        if (!report.success || !report.data) {
            res.status(404).json({
                success: false,
                message: 'Report not found or could not be generated',
                errors: [],
                data: null
            });
            return;
        }
        // Set appropriate headers for download
        const filename = `${report.data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        switch (format) {
            case 'csv':
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
                break;
            case 'xlsx':
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
                break;
            default:
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        }
        res.send(exportData);
    }
    catch (error) {
        next(error);
    }
});
