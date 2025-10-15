"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedReportingRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_middleware_1 = require("../middleware/auth.middleware");
const logging_middleware_1 = require("../middleware/logging.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const structured_logging_service_1 = require("../services/structured-logging.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const router = (0, express_1.Router)();
exports.advancedReportingRoutes = router;
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
const requireReportingAccess = (req, res, next) => {
    if (!['admin', 'super_admin', 'school_admin', 'analyst'].includes(req.user.role)) {
        res.status(403).json({
            success: false,
            message: 'Insufficient permissions for advanced reporting access',
            errors: [],
            data: null
        });
        return;
    }
    next();
};
router.use(logging_middleware_1.requestLogger);
router.use(rateLimiter_middleware_1.generalRateLimit);
router.use(auth_middleware_1.authMiddleware);
router.use(requireReportingAccess);
router.post('/templates', [
    (0, express_validator_1.body)('name')
        .isLength({ min: 1, max: 255 })
        .withMessage('Template name is required and must be under 255 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be under 1000 characters'),
    (0, express_validator_1.body)('category')
        .isIn(['executive', 'operational', 'financial', 'academic', 'custom'])
        .withMessage('Invalid template category'),
    (0, express_validator_1.body)('layout')
        .isObject()
        .withMessage('Layout configuration is required'),
    (0, express_validator_1.body)('layout.sections')
        .isArray({ min: 1 })
        .withMessage('At least one section is required'),
    (0, express_validator_1.body)('dataRequirements')
        .isArray()
        .withMessage('Data requirements must be an array'),
    (0, express_validator_1.body)('parameters')
        .optional()
        .isArray()
        .withMessage('Parameters must be an array'),
    (0, express_validator_1.body)('scheduleOptions')
        .optional()
        .isObject()
        .withMessage('Schedule options must be an object'),
    (0, express_validator_1.body)('exportFormats')
        .isArray({ min: 1 })
        .withMessage('At least one export format is required')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const templateData = req.body;
        if (req.user.role === 'school_admin') {
            templateData.tenantId = req.user.schoolId || req.user.tenantId;
        }
        const reportingService = req.app.get('advancedReportingService');
        const template = await reportingService.createReportTemplate(templateData, req.user.id);
        structured_logging_service_1.structuredLogger.business({
            event: 'report_template_created',
            category: 'reporting',
            metadata: {
                templateId: template.id,
                templateName: template.name,
                category: template.category,
                userId: req.user.id
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
        res.status(201).json({
            success: true,
            message: 'Report template created successfully',
            errors: [],
            data: template
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/templates', [
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(['executive', 'operational', 'financial', 'academic', 'custom'])
        .withMessage('Invalid category filter'),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .toInt()
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .toInt()
        .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;
        const tenantId = req.user.role === 'school_admin' ?
            (req.user.schoolId || req.user.tenantId) : undefined;
        const reportingService = req.app.get('advancedReportingService');
        const templates = await reportingService.getReportTemplates({
            category: category,
            tenantId,
            page: page,
            limit: limit
        });
        res.json({
            success: true,
            message: 'Report templates retrieved successfully',
            errors: [],
            data: templates
        });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/generate', rateLimiter_middleware_1.authRateLimit, [
    (0, express_validator_1.body)('templateId')
        .isUUID()
        .withMessage('Template ID must be a valid UUID'),
    (0, express_validator_1.body)('parameters')
        .optional()
        .isObject()
        .withMessage('Parameters must be an object'),
    (0, express_validator_1.body)('dateRange')
        .optional()
        .isObject()
        .withMessage('Date range must be an object'),
    (0, express_validator_1.body)('dateRange.start')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('dateRange.end')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('End date must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('options')
        .optional()
        .isObject()
        .withMessage('Options must be an object'),
    (0, express_validator_1.body)('options.includeInsights')
        .optional()
        .isBoolean()
        .withMessage('Include insights must be a boolean'),
    (0, express_validator_1.body)('options.exportFormats')
        .optional()
        .isArray()
        .withMessage('Export formats must be an array'),
    (0, express_validator_1.body)('options.priority')
        .optional()
        .isIn(['low', 'normal', 'high'])
        .withMessage('Priority must be low, normal, or high')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { templateId, parameters = {}, dateRange, options = {} } = req.body;
        const tenantId = req.user.schoolId || req.user.tenantId || 'default';
        if (dateRange) {
            parameters.dateRange = dateRange;
        }
        const reportingService = req.app.get('advancedReportingService');
        const report = await reportingService.generateReport(templateId, parameters, req.user.id, tenantId, options);
        structured_logging_service_1.structuredLogger.business({
            event: 'report_generated',
            category: 'reporting',
            metadata: {
                reportId: report.id,
                templateId,
                executionTime: report.executionTime,
                sectionsGenerated: Object.keys(report.data.sections).length,
                insightsGenerated: report.insights.length,
                userId: req.user.id,
                tenantId
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
        res.status(201).json({
            success: true,
            message: 'Report generated successfully',
            errors: [],
            data: {
                reportId: report.id,
                status: report.status,
                executionTime: report.executionTime,
                exports: report.exports.map(exp => ({
                    id: exp.id,
                    format: exp.format,
                    size: exp.size,
                    downloadUrl: `/api/v1/reporting/reports/${report.id}/download/${exp.id}`
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/reports/:reportId', [
    (0, express_validator_1.param)('reportId')
        .isUUID()
        .withMessage('Report ID must be a valid UUID')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const reportingService = req.app.get('advancedReportingService');
        const report = await reportingService.getReport(reportId, req.user.id);
        const tenantId = req.user.schoolId || req.user.tenantId || 'default';
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found',
                errors: [],
                data: null
            });
            return;
        }
        if (req.user.role === 'school_admin' && report.tenantId !== tenantId) {
            res.status(403).json({
                success: false,
                message: 'Access denied to this report',
                errors: [],
                data: null
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report retrieved successfully',
            errors: [],
            data: report
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/reports/:reportId/status', [
    (0, express_validator_1.param)('reportId')
        .isUUID()
        .withMessage('Report ID must be a valid UUID')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const reportingService = req.app.get('advancedReportingService');
        const status = await reportingService.getReportStatus(reportId);
        res.json({
            success: true,
            message: 'Report status retrieved successfully',
            errors: [],
            data: status
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/reports/:reportId/download/:exportId', [
    (0, express_validator_1.param)('reportId')
        .isUUID()
        .withMessage('Report ID must be a valid UUID'),
    (0, express_validator_1.param)('exportId')
        .isUUID()
        .withMessage('Export ID must be a valid UUID')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { reportId, exportId } = req.params;
        const reportingService = req.app.get('advancedReportingService');
        const exportInfo = await reportingService.getReportExport(reportId, exportId, req.user.id);
        if (!exportInfo) {
            res.status(404).json({
                success: false,
                message: 'Export not found',
                errors: [],
                data: null
            });
            return;
        }
        if (!fs.existsSync(exportInfo.path)) {
            res.status(404).json({
                success: false,
                message: 'Export file not found',
                errors: [],
                data: null
            });
            return;
        }
        const filename = path.basename(exportInfo.path);
        const mimeTypes = {
            'pdf': 'application/pdf',
            'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            'json': 'application/json',
            'html': 'text/html'
        };
        res.setHeader('Content-Type', mimeTypes[exportInfo.format] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', exportInfo.size);
        const fileStream = fs.createReadStream(exportInfo.path);
        fileStream.pipe(res);
        await reportingService.incrementDownloadCount(exportId);
        structured_logging_service_1.structuredLogger.business({
            event: 'report_downloaded',
            category: 'reporting',
            metadata: {
                reportId,
                exportId,
                format: exportInfo.format,
                size: exportInfo.size,
                userId: req.user.id
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/schedule', [
    (0, express_validator_1.body)('templateId')
        .isUUID()
        .withMessage('Template ID must be a valid UUID'),
    (0, express_validator_1.body)('schedule')
        .isObject()
        .withMessage('Schedule configuration is required'),
    (0, express_validator_1.body)('schedule.frequency')
        .isIn(['hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])
        .withMessage('Invalid schedule frequency'),
    (0, express_validator_1.body)('schedule.timezone')
        .isLength({ min: 1 })
        .withMessage('Timezone is required'),
    (0, express_validator_1.body)('schedule.recipients')
        .isArray({ min: 1 })
        .withMessage('At least one recipient is required'),
    (0, express_validator_1.body)('parameters')
        .optional()
        .isObject()
        .withMessage('Parameters must be an object')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { templateId, schedule, parameters = {} } = req.body;
        const tenantId = req.user.schoolId || req.user.tenantId || 'default';
        const reportingService = req.app.get('advancedReportingService');
        const scheduleId = await reportingService.scheduleReport(templateId, schedule, req.user.id, tenantId);
        structured_logging_service_1.structuredLogger.business({
            event: 'report_scheduled',
            category: 'reporting',
            metadata: {
                scheduleId,
                templateId,
                frequency: schedule.frequency,
                userId: req.user.id,
                tenantId
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
        res.status(201).json({
            success: true,
            message: 'Report scheduled successfully',
            errors: [],
            data: { scheduleId }
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/dashboard', [
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('filters')
        .optional()
        .isJSON()
        .withMessage('Filters must be valid JSON')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { startDate, endDate, filters } = req.query;
        const tenantId = req.user.schoolId || req.user.tenantId || 'default';
        const dateRange = {
            start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: endDate ? new Date(endDate) : new Date()
        };
        const parsedFilters = filters ? JSON.parse(filters) : {};
        const reportingService = req.app.get('advancedReportingService');
        const dashboard = await reportingService.getAnalyticsDashboard(tenantId, dateRange, parsedFilters);
        res.json({
            success: true,
            message: 'Analytics dashboard retrieved successfully',
            errors: [],
            data: dashboard
        });
    }
    catch (error) {
        next(error);
    }
}));
router.post('/insights/analyze', rateLimiter_middleware_1.authRateLimit, [
    (0, express_validator_1.body)('data')
        .isObject()
        .withMessage('Data is required'),
    (0, express_validator_1.body)('analysisType')
        .isIn(['trends', 'anomalies', 'predictions', 'correlations', 'recommendations'])
        .withMessage('Invalid analysis type'),
    (0, express_validator_1.body)('config')
        .optional()
        .isObject()
        .withMessage('Configuration must be an object'),
    (0, express_validator_1.body)('dateRange')
        .optional()
        .isObject()
        .withMessage('Date range must be an object')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { data, analysisType, config = {}, dateRange } = req.body;
        const aiInsights = req.app.get('aiInsightsEngine');
        let insights = [];
        switch (analysisType) {
            case 'trends':
                insights = await aiInsights.analyzeTrends(data, dateRange || {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }, config);
                break;
            case 'anomalies':
                insights = await aiInsights.detectAnomalies(data, {
                    sensitivity: 0.8,
                    algorithm: 'isolation_forest',
                    ...config
                });
                break;
            case 'predictions':
                insights = await aiInsights.generatePredictions(data, {
                    horizon: '30d',
                    confidence: 0.85,
                    ...config
                });
                break;
            case 'correlations':
                insights = await aiInsights.findCorrelations(data, {
                    threshold: 0.7,
                    method: 'pearson',
                    ...config
                });
                break;
            case 'recommendations':
                insights = await aiInsights.generateRecommendations(data, {}, {
                    context: 'general',
                    priority: 'business_impact',
                    ...config
                });
                break;
        }
        structured_logging_service_1.structuredLogger.business({
            event: 'ai_insights_generated',
            category: 'reporting',
            metadata: {
                analysisType,
                insightsCount: insights.length,
                highPriorityInsights: insights.filter((i) => i.priority === 'high' || i.priority === 'critical').length,
                userId: req.user.id
            },
            context: { sessionId: req.sessionId || 'unknown', timestamp: new Date() }
        });
        res.json({
            success: true,
            message: 'AI insights generated successfully',
            errors: [],
            data: { insights, analysisType, count: insights.length }
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/insights/:insightId/explanation', [
    (0, express_validator_1.param)('insightId')
        .isUUID()
        .withMessage('Insight ID must be a valid UUID')
], handleValidationErrors, (async (req, res, next) => {
    try {
        const { insightId } = req.params;
        const reportingService = req.app.get('advancedReportingService');
        const aiInsights = req.app.get('aiInsightsEngine');
        const insight = await reportingService.getInsight(insightId);
        const explanation = await aiInsights.generateNaturalLanguageExplanation(insight, { userId: req.user.id, timestamp: new Date() });
        res.json({
            success: true,
            message: 'Insight explanation generated successfully',
            errors: [],
            data: explanation
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/exports/formats', (async (req, res, next) => {
    try {
        const formats = [
            {
                type: 'pdf',
                name: 'PDF Document',
                description: 'Portable document format suitable for sharing and printing',
                mimeType: 'application/pdf',
                features: ['charts', 'tables', 'formatting', 'branding'],
                maxFileSize: '50MB'
            },
            {
                type: 'excel',
                name: 'Excel Workbook',
                description: 'Microsoft Excel format with multiple sheets and formulas',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                features: ['multiple_sheets', 'formulas', 'charts', 'pivot_tables'],
                maxFileSize: '100MB'
            },
            {
                type: 'csv',
                name: 'CSV File',
                description: 'Comma-separated values for data analysis tools',
                mimeType: 'text/csv',
                features: ['tabular_data', 'lightweight', 'universal_compatibility'],
                maxFileSize: '500MB'
            },
            {
                type: 'json',
                name: 'JSON Data',
                description: 'JavaScript Object Notation for API consumption',
                mimeType: 'application/json',
                features: ['structured_data', 'api_friendly', 'metadata_included'],
                maxFileSize: '200MB'
            },
            {
                type: 'powerbi',
                name: 'Power BI Dataset',
                description: 'Microsoft Power BI compatible dataset',
                mimeType: 'application/json',
                features: ['business_intelligence', 'interactive_dashboards', 'real_time_updates'],
                maxFileSize: '1GB'
            },
            {
                type: 'tableau',
                name: 'Tableau Extract',
                description: 'Tableau compatible data extract',
                mimeType: 'application/json',
                features: ['advanced_analytics', 'data_blending', 'visual_analytics'],
                maxFileSize: '1GB'
            },
            {
                type: 'html',
                name: 'HTML Report',
                description: 'Interactive web-based report',
                mimeType: 'text/html',
                features: ['interactive_charts', 'responsive_design', 'web_sharing'],
                maxFileSize: '25MB'
            }
        ];
        res.json({
            success: true,
            message: 'Export formats retrieved successfully',
            errors: [],
            data: { formats, count: formats.length }
        });
    }
    catch (error) {
        next(error);
    }
}));
router.get('/health', (async (req, res, next) => {
    try {
        const reportingService = req.app.get('advancedReportingService');
        const aiInsights = req.app.get('aiInsightsEngine');
        const health = {
            reportingService: await reportingService.getHealthStatus(),
            aiInsights: await aiInsights.getHealthStatus(),
            timestamp: new Date()
        };
        const overallHealth = health.reportingService.status === 'healthy' && health.aiInsights.status === 'healthy';
        res.status(overallHealth ? 200 : 503).json({
            success: overallHealth,
            message: overallHealth ? 'Reporting services healthy' : 'Some reporting services unhealthy',
            errors: [],
            data: health
        });
    }
    catch (error) {
        next(error);
    }
}));
//# sourceMappingURL=advanced-reporting.routes.js.map