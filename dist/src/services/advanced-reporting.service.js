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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedReportingService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const pdfkit_1 = __importDefault(require("pdfkit"));
const ExcelJS = __importStar(require("exceljs"));
const fs = __importStar(require("fs/promises"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const metrics_service_1 = require("./metrics.service");
const cache_manager_service_1 = require("./cache-manager.service");
const analytics_service_1 = require("./analytics.service");
class AdvancedReportingService extends events_1.EventEmitter {
    analyticsService;
    dataWarehouse;
    aiInsights;
    notifications;
    config;
    metrics = new metrics_service_1.MetricsCollector();
    cache = new cache_manager_service_1.CacheManager();
    templates = new Map();
    generatedReports = new Map();
    scheduledJobs = new Map();
    activeGenerations = new Set();
    isRunning = false;
    constructor(analyticsService, dataWarehouse, aiInsights, notifications, config) {
        super();
        this.analyticsService = analyticsService;
        this.dataWarehouse = dataWarehouse;
        this.aiInsights = aiInsights;
        this.notifications = notifications;
        this.config = config;
        this.setupEventHandlers();
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Advanced Reporting Service...');
            await fs.mkdir(this.config.exportPath, { recursive: true });
            await this.loadReportTemplates();
            this.startScheduledReportProcessor();
            if (this.config.aiInsightsEnabled) {
                await this.aiInsights.initialize();
            }
            this.isRunning = true;
            logger_1.logger.info('Advanced Reporting Service initialized successfully', {
                templatesLoaded: this.templates.size,
                aiInsightsEnabled: this.config.aiInsightsEnabled,
                exportPath: this.config.exportPath
            });
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Advanced Reporting Service', { error });
            throw error;
        }
    }
    async createReportTemplate(templateData, userId) {
        try {
            logger_1.logger.info('Creating report template', {
                name: templateData.name,
                category: templateData.category,
                userId
            });
            const template = {
                ...templateData,
                id: (0, uuid_1.v4)(),
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1
            };
            await this.validateReportTemplate(template);
            this.templates.set(template.id, template);
            await this.persistReportTemplate(template);
            logger_1.logger.info('Report template created successfully', {
                templateId: template.id,
                name: template.name
            });
            this.metrics.increment('reporting.template.created');
            this.emit('template:created', template);
            return template;
        }
        catch (error) {
            logger_1.logger.error('Failed to create report template', { error, templateData });
            this.metrics.increment('reporting.template.creation.failed');
            throw error;
        }
    }
    async generateReport(templateId, parameters, userId, tenantId, options = {}) {
        const startTime = Date.now();
        const reportId = (0, uuid_1.v4)();
        try {
            logger_1.logger.info('Starting report generation', {
                reportId,
                templateId,
                userId,
                tenantId,
                options
            });
            if (this.activeGenerations.size >= this.config.maxConcurrentGenerations) {
                throw new Error('Maximum concurrent report generations reached');
            }
            this.activeGenerations.add(reportId);
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error(`Report template not found: ${templateId}`);
            }
            if (template.tenantId && template.tenantId !== tenantId) {
                throw new Error('Access denied to this report template');
            }
            const report = {
                id: reportId,
                templateId,
                name: `${template.name} - ${new Date().toISOString().split('T')[0]}`,
                description: template.description,
                generatedAt: new Date(),
                generatedBy: userId,
                tenantId,
                parameters,
                dateRange: parameters.dateRange || this.getDefaultDateRange(),
                data: {
                    summary: {
                        totalRecords: 0,
                        dateRange: parameters.dateRange || this.getDefaultDateRange(),
                        generationTime: 0,
                        dataFreshness: new Date()
                    },
                    sections: {},
                    rawData: {},
                    calculations: {
                        kpis: {},
                        trends: {},
                        comparisons: {}
                    }
                },
                insights: [],
                metadata: {
                    templateVersion: template.version,
                    dataSourcesUsed: [],
                    generationMethod: 'automated',
                    qualityScore: 0
                },
                exports: [],
                status: 'generating',
                executionTime: 0
            };
            this.generatedReports.set(reportId, report);
            this.emit('report:generation:started', report);
            await this.generateReportData(report, template);
            if (options.includeInsights !== false && this.config.aiInsightsEnabled) {
                report.insights = await this.generateAIInsights(report, template);
            }
            const exportFormats = options.exportFormats || template.exportFormats.filter(f => f.enabled).map(f => f.type);
            for (const format of exportFormats) {
                const exportResult = await this.exportReport(report, format);
                report.exports.push(exportResult);
            }
            report.status = 'completed';
            report.executionTime = Date.now() - startTime;
            report.metadata.qualityScore = this.calculateQualityScore(report);
            this.generatedReports.set(reportId, report);
            this.activeGenerations.delete(reportId);
            await this.persistGeneratedReport(report);
            if (options.schedule) {
                await this.sendReportNotifications(report, template);
            }
            logger_1.logger.info('Report generated successfully', {
                reportId,
                executionTime: report.executionTime,
                sectionsGenerated: Object.keys(report.data.sections).length,
                insightsGenerated: report.insights.length,
                exportsCreated: report.exports.length
            });
            this.metrics.timing('reporting.generation.time', report.executionTime);
            this.metrics.increment('reporting.generation.completed');
            this.emit('report:generation:completed', report);
            return report;
        }
        catch (error) {
            this.activeGenerations.delete(reportId);
            const failedReport = this.generatedReports.get(reportId);
            if (failedReport) {
                failedReport.status = 'failed';
                failedReport.error = (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
                failedReport.executionTime = Date.now() - startTime;
            }
            logger_1.logger.error('Failed to generate report', {
                error,
                reportId,
                templateId,
                executionTime: Date.now() - startTime
            });
            this.metrics.timing('reporting.generation.time.failed', Date.now() - startTime);
            this.metrics.increment('reporting.generation.failed');
            this.emit('report:generation:failed', { reportId, error });
            throw error;
        }
    }
    async generateAIInsights(report, template) {
        try {
            logger_1.logger.debug('Generating AI insights', { reportId: report.id });
            const insights = [];
            const filteredRawData = {};
            for (const [key, value] of Object.entries(report.data.rawData)) {
                if (value !== undefined) {
                    filteredRawData[key] = value;
                }
            }
            const trendInsights = await this.aiInsights.analyzeTrends(filteredRawData, report.dateRange);
            const anomalyInsights = await this.aiInsights.detectAnomalies(filteredRawData, { sensitivity: 0.8, algorithm: 'isolation_forest' });
            const predictionInsights = await this.aiInsights.generatePredictions(filteredRawData, { horizon: '30d', confidence: 0.85 });
            const correlationInsights = await this.aiInsights.findCorrelations(filteredRawData, { threshold: 0.7, method: 'pearson' });
            const recommendations = await this.aiInsights.generateRecommendations(filteredRawData, report.data.calculations.kpis, { context: template.category, priority: 'business_impact' });
            insights.push(...trendInsights, ...anomalyInsights, ...predictionInsights, ...correlationInsights, ...recommendations);
            insights.sort((a, b) => {
                const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
                const aPriority = priorityWeight[a.priority] * a.confidence;
                const bPriority = priorityWeight[b.priority] * b.confidence;
                return bPriority - aPriority;
            });
            logger_1.logger.info('AI insights generated', {
                reportId: report.id,
                insightsCount: insights.length,
                criticalInsights: insights.filter(i => i.priority === 'critical').length
            });
            this.metrics.gauge('reporting.insights.generated', insights.length);
            return insights.slice(0, 20);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate AI insights', { error, reportId: report.id });
            return [];
        }
    }
    async exportReport(report, format) {
        try {
            logger_1.logger.debug('Exporting report', { reportId: report.id, format });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
            const exportPath = path.join(this.config.exportPath, `${filename}.${format}`);
            let exportResult;
            switch (format) {
                case 'pdf':
                    exportResult = await this.exportToPDF(report, exportPath);
                    break;
                case 'excel':
                    exportResult = await this.exportToExcel(report, exportPath);
                    break;
                case 'csv':
                    exportResult = await this.exportToCSV(report, exportPath);
                    break;
                case 'json':
                    exportResult = await this.exportToJSON(report, exportPath);
                    break;
                case 'powerbi':
                    exportResult = await this.exportToPowerBI(report, exportPath);
                    break;
                case 'tableau':
                    exportResult = await this.exportToTableau(report, exportPath);
                    break;
                case 'html':
                    exportResult = await this.exportToHTML(report, exportPath);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
            logger_1.logger.info('Report exported successfully', {
                reportId: report.id,
                format,
                fileSize: exportResult.size,
                exportPath
            });
            this.metrics.increment(`reporting.export.${format}.success`);
            return exportResult;
        }
        catch (error) {
            logger_1.logger.error('Failed to export report', { error, reportId: report.id, format });
            this.metrics.increment(`reporting.export.${format}.failed`);
            throw error;
        }
    }
    async scheduleReport(templateId, schedule, userId, tenantId) {
        try {
            logger_1.logger.info('Scheduling automated report', {
                templateId,
                frequency: schedule.frequency,
                userId,
                tenantId
            });
            const scheduleId = (0, uuid_1.v4)();
            const nextExecution = this.calculateNextExecution(schedule);
            const job = setTimeout(async () => {
                try {
                    await this.executeScheduledReport(templateId, schedule, userId, tenantId);
                    if (schedule.frequency !== 'custom') {
                        await this.scheduleReport(templateId, schedule, userId, tenantId);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Scheduled report execution failed', {
                        error,
                        templateId,
                        scheduleId
                    });
                }
            }, nextExecution.getTime() - Date.now());
            this.scheduledJobs.set(scheduleId, job);
            await this.persistReportSchedule({
                id: scheduleId,
                templateId,
                schedule,
                userId,
                tenantId,
                nextExecution,
                createdAt: new Date(),
                active: true
            });
            logger_1.logger.info('Report scheduled successfully', {
                scheduleId,
                templateId,
                nextExecution
            });
            this.metrics.increment('reporting.schedule.created');
            return scheduleId;
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule report', { error, templateId });
            throw error;
        }
    }
    async getAnalyticsDashboard(tenantId, dateRange, filters = {}) {
        try {
            logger_1.logger.debug('Generating analytics dashboard', { tenantId, dateRange });
            const cacheKey = `dashboard:${tenantId}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`;
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const kpis = await this.generateDashboardKPIs(tenantId, dateRange, filters);
            const charts = await this.generateDashboardCharts(tenantId, dateRange, filters);
            const realTimeMetrics = await analytics_service_1.AnalyticsService.getRealtimeMetrics();
            let insights = [];
            if (this.config.aiInsightsEnabled) {
                insights = await this.generateDashboardInsights(tenantId, dateRange, filters);
            }
            const dashboard = {
                kpis,
                charts,
                insights,
                realTimeMetrics,
                dataFreshness: new Date()
            };
            await this.cache.setex(cacheKey, 300, dashboard);
            this.metrics.increment('reporting.dashboard.generated');
            return dashboard;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate analytics dashboard', { error, tenantId });
            throw error;
        }
    }
    async getReportStatus(reportId) {
        const report = this.generatedReports.get(reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }
        const progress = this.calculateReportProgress(report);
        return {
            status: report.status,
            progress,
            estimatedCompletion: report.status === 'generating' ?
                new Date(Date.now() + (30000 * (1 - progress))) : undefined,
            error: report.error
        };
    }
    async generateReportData(report, template) {
        for (const section of template.layout.sections) {
            try {
                const sectionData = await this.generateSectionData(section, report, template);
                report.data.sections[section.id] = sectionData;
                this.emit('report:section:completed', { reportId: report.id, sectionId: section.id });
            }
            catch (error) {
                logger_1.logger.error('Failed to generate section data', {
                    error,
                    reportId: report.id,
                    sectionId: section.id
                });
                report.data.sections[section.id] = {
                    type: section.type,
                    data: null,
                    visualizations: [],
                    metadata: { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) }
                };
            }
        }
        report.data.summary.totalRecords = Object.values(report.data.rawData)
            .reduce((sum, data) => sum + (Array.isArray(data) ? data.length : 0), 0);
    }
    async generateSectionData(section, report, template) {
        switch (section.type) {
            case 'header':
                return this.generateHeaderSection(section, report, template);
            case 'summary':
                return this.generateSummarySection(section, report, template);
            case 'chart':
                return this.generateChartSection(section, report, template);
            case 'table':
                return this.generateTableSection(section, report, template);
            case 'kpi':
                return this.generateKPISection(section, report, template);
            case 'insights':
                return this.generateInsightsSection(section, report, template);
            default:
                throw new Error(`Unknown section type: ${section.type}`);
        }
    }
    async exportToPDF(report, exportPath) {
        const doc = new pdfkit_1.default();
        const stream = (0, fs_1.createWriteStream)(exportPath);
        doc.pipe(stream);
        doc.fontSize(20).text(report.name, 50, 50);
        doc.fontSize(12).text(`Generated: ${report.generatedAt.toISOString()}`, 50, 80);
        let yPosition = 120;
        for (const [sectionId, sectionData] of Object.entries(report.data.sections)) {
            doc.fontSize(16).text(sectionId, 50, yPosition);
            yPosition += 30;
            if (sectionData.data) {
                doc.fontSize(10).text(JSON.stringify(sectionData.data, null, 2), 50, yPosition);
                yPosition += 100;
            }
        }
        doc.end();
        return new Promise((resolve, reject) => {
            stream.on('finish', async () => {
                const stats = await fs.stat(exportPath);
                resolve({
                    id: (0, uuid_1.v4)(),
                    reportId: report.id,
                    format: 'pdf',
                    path: exportPath,
                    size: stats.size,
                    createdAt: new Date(),
                    downloadCount: 0
                });
            });
            stream.on('error', reject);
        });
    }
    async exportToExcel(report, exportPath) {
        const workbook = new ExcelJS.Workbook();
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];
        summarySheet.addRow({ metric: 'Report Name', value: report.name });
        summarySheet.addRow({ metric: 'Generated At', value: report.generatedAt });
        summarySheet.addRow({ metric: 'Total Records', value: report.data.summary.totalRecords });
        for (const [sectionId, sectionData] of Object.entries(report.data.sections)) {
            if (sectionData.data && Array.isArray(sectionData.data)) {
                const sheet = workbook.addWorksheet(sectionId);
                if (sectionData.data.length > 0) {
                    const headers = Object.keys(sectionData.data[0]);
                    sheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }));
                    sectionData.data.forEach(row => sheet.addRow(row));
                }
            }
        }
        await workbook.xlsx.writeFile(exportPath);
        const stats = await fs.stat(exportPath);
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'excel',
            path: exportPath,
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    async exportToCSV(report, exportPath) {
        const csvData = [];
        for (const [sectionId, sectionData] of Object.entries(report.data.sections)) {
            if (sectionData.data && Array.isArray(sectionData.data)) {
                csvData.push(...sectionData.data.map((row) => ({ section: sectionId, ...row })));
            }
        }
        if (csvData.length === 0) {
            throw new Error('No tabular data available for CSV export');
        }
        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map((row) => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        await fs.writeFile(exportPath, csvContent);
        const stats = await fs.stat(exportPath);
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'csv',
            path: exportPath,
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    async exportToJSON(report, exportPath) {
        const jsonData = {
            metadata: {
                reportId: report.id,
                name: report.name,
                generatedAt: report.generatedAt,
                generatedBy: report.generatedBy,
                tenantId: report.tenantId
            },
            data: report.data,
            insights: report.insights
        };
        await fs.writeFile(exportPath, JSON.stringify(jsonData, null, 2));
        const stats = await fs.stat(exportPath);
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'json',
            path: exportPath,
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    async exportToPowerBI(report, exportPath) {
        const powerBIData = {
            name: report.name,
            tables: Object.entries(report.data.sections).map(([sectionId, sectionData]) => ({
                name: sectionId,
                columns: sectionData.data ? Object.keys(sectionData.data[0] || {}).map(col => ({
                    name: col,
                    dataType: this.inferDataType(sectionData.data[0]?.[col])
                })) : [],
                rows: sectionData.data || []
            }))
        };
        await fs.writeFile(exportPath.replace('.powerbi', '.json'), JSON.stringify(powerBIData, null, 2));
        const stats = await fs.stat(exportPath.replace('.powerbi', '.json'));
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'powerbi',
            path: exportPath.replace('.powerbi', '.json'),
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    async exportToTableau(report, exportPath) {
        const tableauData = {
            extract: {
                datasource: {
                    name: report.name,
                    connection: {
                        class: 'json',
                        filename: exportPath
                    },
                    tables: Object.entries(report.data.sections).map(([sectionId, sectionData]) => ({
                        name: sectionId,
                        schema: sectionData.data ? Object.keys(sectionData.data[0] || {}).map(col => ({
                            name: col,
                            type: this.inferTableauType(sectionData.data[0]?.[col])
                        })) : [],
                        data: sectionData.data || []
                    }))
                }
            }
        };
        await fs.writeFile(exportPath.replace('.tableau', '.json'), JSON.stringify(tableauData, null, 2));
        const stats = await fs.stat(exportPath.replace('.tableau', '.json'));
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'tableau',
            path: exportPath.replace('.tableau', '.json'),
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    async exportToHTML(report, exportPath) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.name}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; }
          .insight { background: #f0f8ff; padding: 15px; margin: 10px 0; border-left: 4px solid #007acc; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report.name}</h1>
          <p>Generated: ${report.generatedAt.toISOString()}</p>
          <p>By: ${report.generatedBy}</p>
        </div>

        ${Object.entries(report.data.sections).map(([sectionId, sectionData]) => `
          <div class="section">
            <h2>${sectionId}</h2>
            ${this.renderSectionAsHTML(sectionData)}
          </div>
        `).join('')}

        ${report.insights.length > 0 ? `
          <div class="section">
            <h2>AI Insights</h2>
            ${report.insights.map(insight => `
              <div class="insight">
                <h3>${insight.title}</h3>
                <p>${insight.description}</p>
                <small>Confidence: ${(insight.confidence * 100).toFixed(1)}%</small>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </body>
      </html>
    `;
        await fs.writeFile(exportPath, html);
        const stats = await fs.stat(exportPath);
        return {
            id: (0, uuid_1.v4)(),
            reportId: report.id,
            format: 'html',
            path: exportPath,
            size: stats.size,
            createdAt: new Date(),
            downloadCount: 0
        };
    }
    renderSectionAsHTML(sectionData) {
        if (Array.isArray(sectionData.data) && sectionData.data.length > 0) {
            const headers = Object.keys(sectionData.data[0]);
            return `
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${sectionData.data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      `;
        }
        return `<p>${JSON.stringify(sectionData.data, null, 2)}</p>`;
    }
    inferDataType(value) {
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'boolean')
            return 'boolean';
        if (value instanceof Date)
            return 'datetime';
        return 'string';
    }
    inferTableauType(value) {
        if (typeof value === 'number')
            return 'real';
        if (typeof value === 'boolean')
            return 'boolean';
        if (value instanceof Date)
            return 'datetime';
        return 'string';
    }
    calculateQualityScore(report) {
        let score = 100;
        const totalSections = Object.keys(report.data.sections).length;
        const completedSections = Object.values(report.data.sections).filter(s => s.data !== null).length;
        score -= (totalSections - completedSections) * 10;
        if (report.data.summary.totalRecords < 10) {
            score -= 20;
        }
        score += Math.min(report.insights.length * 2, 10);
        return Math.max(0, Math.min(100, score));
    }
    calculateReportProgress(report) {
        if (report.status === 'completed')
            return 1;
        if (report.status === 'failed')
            return 0;
        const totalSections = Object.keys(report.data.sections).length || 1;
        const completedSections = Object.values(report.data.sections).filter(s => s.data !== null).length;
        return completedSections / totalSections;
    }
    getDefaultDateRange() {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { start, end };
    }
    setupEventHandlers() {
        this.on('report:generation:started', (report) => {
            logger_1.logger.info('Report generation started', { reportId: report.id });
            this.metrics.increment('reporting.generation.started');
        });
        this.on('report:generation:completed', (report) => {
            this.metrics.gauge('reporting.generation.quality', report.metadata.qualityScore);
        });
        this.on('template:created', (_template) => {
            this.metrics.gauge('reporting.templates.total', this.templates.size);
        });
    }
    async getReportTemplates(options) {
        const templates = Array.from(this.templates.values());
        let filtered = templates;
        if (options.category) {
            filtered = filtered.filter(t => t.category === options.category);
        }
        if (options.tenantId) {
            filtered = filtered.filter(t => !t.tenantId || t.tenantId === options.tenantId);
        }
        const page = options.page || 1;
        const limit = options.limit || 20;
        const start = (page - 1) * limit;
        const paginated = filtered.slice(start, start + limit);
        return {
            templates: paginated,
            total: filtered.length,
            page,
            limit
        };
    }
    async getReport(reportId, userId) {
        const report = this.generatedReports.get(reportId);
        if (!report) {
            return null;
        }
        if (report.generatedBy !== userId && !['admin', 'super_admin'].includes(userId)) {
            throw new Error('Access denied to this report');
        }
        return report;
    }
    async getReportExport(reportId, exportId, userId) {
        const report = await this.getReport(reportId, userId);
        if (!report) {
            return null;
        }
        const exportInfo = report.exports.find(e => e.id === exportId);
        return exportInfo || null;
    }
    async incrementDownloadCount(exportId) {
        for (const report of this.generatedReports.values()) {
            const exportInfo = report.exports.find(e => e.id === exportId);
            if (exportInfo) {
                exportInfo.downloadCount++;
                this.metrics.increment('reporting.export.downloaded');
                break;
            }
        }
    }
    async getInsight(insightId) {
        for (const report of this.generatedReports.values()) {
            const insight = report.insights.find(i => i.id === insightId);
            if (insight) {
                return insight;
            }
        }
        return null;
    }
    async getHealthStatus() {
        const templatesLoaded = this.templates.size;
        const reportsGenerated = this.generatedReports.size;
        const activeGenerations = this.activeGenerations.size;
        const reports = Array.from(this.generatedReports.values());
        const completedReports = reports.filter(r => r.status === 'completed');
        const averageGenerationTime = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + r.executionTime, 0) / completedReports.length
            : 0;
        let status = 'healthy';
        if (activeGenerations >= this.config.maxConcurrentGenerations) {
            status = 'degraded';
        }
        if (!this.isRunning) {
            status = 'unhealthy';
        }
        return {
            status,
            activeGenerations,
            templatesLoaded,
            reportsGenerated,
            averageGenerationTime
        };
    }
    async loadReportTemplates() { }
    async validateReportTemplate(_template) { }
    async persistReportTemplate(_template) { }
    async persistGeneratedReport(_report) { }
    async persistReportSchedule(_schedule) { }
    async executeScheduledReport(_templateId, _schedule, _userId, _tenantId) { }
    calculateNextExecution(_schedule) { return new Date(Date.now() + 86400000); }
    async sendReportNotifications(_report, _template) { }
    startScheduledReportProcessor() { }
    async generateDashboardKPIs(_tenantId, _dateRange, _filters) { return []; }
    async generateDashboardCharts(_tenantId, _dateRange, _filters) { return []; }
    async generateDashboardInsights(_tenantId, _dateRange, _filters) { return []; }
    async generateHeaderSection(_section, _report, _template) { return {}; }
    async generateSummarySection(_section, _report, _template) { return {}; }
    async generateChartSection(_section, _report, _template) { return {}; }
    async generateTableSection(_section, _report, _template) { return {}; }
    async generateKPISection(_section, _report, _template) { return {}; }
    async generateInsightsSection(_section, _report, _template) { return {}; }
}
exports.AdvancedReportingService = AdvancedReportingService;
//# sourceMappingURL=advanced-reporting.service.js.map