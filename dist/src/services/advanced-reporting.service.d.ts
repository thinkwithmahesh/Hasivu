/// <reference types="node" />
import { EventEmitter } from 'events';
import { AnalyticsService } from './analytics.service';
import { DataWarehouseOrchestrator } from '../analytics/data-warehouse/core/warehouse-orchestrator';
import { AIInsightsEngine } from './ai-insights.service';
import { NotificationService } from './notification.service';
export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: 'executive' | 'operational' | 'financial' | 'academic' | 'custom';
    layout: {
        sections: ReportSection[];
        styling: ReportStyling;
        branding: BrandingConfig;
    };
    dataRequirements: DataRequirement[];
    parameters: ReportParameter[];
    scheduleOptions: ScheduleConfig;
    exportFormats: ExportFormat[];
    tenantId?: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export interface ReportSection {
    id: string;
    type: 'header' | 'summary' | 'chart' | 'table' | 'text' | 'kpi' | 'insights';
    title: string;
    position: {
        row: number;
        column: number;
        span: number;
    };
    config: {
        dataSource?: string;
        visualization?: VisualizationConfig;
        formatting?: FormattingConfig;
        filters?: FilterConfig[];
    };
}
export interface VisualizationConfig {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'treemap';
    dimensions: string[];
    metrics: string[];
    colors: string[];
    animations: boolean;
    interactions: boolean;
    responsive: boolean;
}
export interface ScheduleConfig {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    interval?: number;
    cronExpression?: string;
    timezone: string;
    recipients: RecipientConfig[];
    deliveryOptions: DeliveryConfig;
}
export interface ExportFormat {
    type: 'pdf' | 'excel' | 'csv' | 'json' | 'powerbi' | 'tableau' | 'html';
    enabled: boolean;
    options: Record<string, unknown>;
    compression?: boolean;
    password?: boolean;
}
export interface GeneratedReport {
    id: string;
    templateId: string;
    name: string;
    description?: string;
    generatedAt: Date;
    generatedBy: string;
    tenantId: string;
    parameters: Record<string, unknown>;
    dateRange: {
        start: Date;
        end: Date;
    };
    data: ReportData;
    insights: AIGeneratedInsight[];
    metadata: ReportMetadata;
    exports: ReportExport[];
    status: 'generating' | 'completed' | 'failed' | 'scheduled';
    executionTime: number;
    error?: string;
}
export interface ReportData {
    summary: {
        totalRecords: number;
        dateRange: {
            start: Date;
            end: Date;
        };
        generationTime: number;
        dataFreshness: Date;
    };
    sections: {
        [sectionId: string]: {
            type: string;
            data: Record<string, unknown>;
            visualizations: Array<Record<string, unknown>>;
            metadata: Record<string, unknown>;
        };
    };
    rawData: {
        [sourceId: string]: Array<Record<string, unknown>> | undefined;
    };
    calculations: {
        kpis: Record<string, number>;
        trends: Record<string, TrendAnalysis>;
        comparisons: Record<string, ComparisonAnalysis>;
    };
}
export interface AIGeneratedInsight {
    id: string;
    type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'correlation';
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    title: string;
    description: string;
    details: string;
    visualizations: VisualizationConfig[];
    actionItems: ActionItem[];
    dataPoints: Array<Record<string, unknown>> | undefined;
    metadata: {
        algorithm: string;
        modelVersion: string;
        generatedAt: Date;
        reviewStatus: 'pending' | 'approved' | 'rejected';
    };
}
export interface TrendAnalysis {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    significance: number;
    projectedValue: number;
    confidence: number;
    timeSeriesData: Array<{
        date: Date;
        value: number;
        prediction?: number;
    }>;
}
export interface ComparisonAnalysis {
    baseline: Record<string, unknown>;
    current: Record<string, unknown>;
    change: {
        absolute: number;
        percentage: number;
        significance: number;
    };
    context: string[];
}
export declare class AdvancedReportingService extends EventEmitter {
    private readonly analyticsService;
    private readonly dataWarehouse;
    private readonly aiInsights;
    private readonly notifications;
    private readonly config;
    private readonly metrics;
    private readonly cache;
    private readonly templates;
    private readonly generatedReports;
    private readonly scheduledJobs;
    private readonly activeGenerations;
    private isRunning;
    constructor(analyticsService: AnalyticsService, dataWarehouse: DataWarehouseOrchestrator, aiInsights: AIInsightsEngine, notifications: NotificationService, config: {
        maxConcurrentGenerations: number;
        cacheTimeout: number;
        exportPath: string;
        aiInsightsEnabled: boolean;
        securityLevel: 'basic' | 'enhanced' | 'enterprise';
    });
    initialize(): Promise<void>;
    createReportTemplate(templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>, userId: string): Promise<ReportTemplate>;
    generateReport(templateId: string, parameters: Record<string, unknown>, userId: string, tenantId: string, options?: {
        includeInsights?: boolean;
        exportFormats?: string[];
        schedule?: boolean;
        priority?: 'low' | 'normal' | 'high';
    }): Promise<GeneratedReport>;
    private generateAIInsights;
    exportReport(report: GeneratedReport, format: 'pdf' | 'excel' | 'csv' | 'json' | 'powerbi' | 'tableau' | 'html'): Promise<ReportExport>;
    scheduleReport(templateId: string, schedule: ScheduleConfig, userId: string, tenantId: string): Promise<string>;
    getAnalyticsDashboard(tenantId: string, dateRange: {
        start: Date;
        end: Date;
    }, filters?: Record<string, unknown>): Promise<{
        kpis: Array<{
            id: string;
            name: string;
            value: number;
            trend: number;
            format: string;
        }>;
        charts: Array<{
            id: string;
            type: string;
            data: Array<Record<string, unknown>> | undefined;
            config: Record<string, unknown>;
        }>;
        insights: AIGeneratedInsight[];
        realTimeMetrics: Record<string, unknown>;
        dataFreshness: Date;
    }>;
    getReportStatus(reportId: string): Promise<{
        status: string;
        progress: number;
        estimatedCompletion?: Date;
        error?: string;
    }>;
    private generateReportData;
    private generateSectionData;
    private exportToPDF;
    private exportToExcel;
    private exportToCSV;
    private exportToJSON;
    private exportToPowerBI;
    private exportToTableau;
    private exportToHTML;
    private renderSectionAsHTML;
    private inferDataType;
    private inferTableauType;
    private calculateQualityScore;
    private calculateReportProgress;
    private getDefaultDateRange;
    private setupEventHandlers;
    getReportTemplates(options: {
        category?: string;
        tenantId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        templates: ReportTemplate[];
        total: number;
        page: number;
        limit: number;
    }>;
    getReport(reportId: string, userId: string): Promise<GeneratedReport | null>;
    getReportExport(reportId: string, exportId: string, userId: string): Promise<ReportExport | null>;
    incrementDownloadCount(exportId: string): Promise<void>;
    getInsight(insightId: string): Promise<AIGeneratedInsight | null>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeGenerations: number;
        templatesLoaded: number;
        reportsGenerated: number;
        averageGenerationTime: number;
    }>;
    private loadReportTemplates;
    private validateReportTemplate;
    private persistReportTemplate;
    private persistGeneratedReport;
    private persistReportSchedule;
    private executeScheduledReport;
    private calculateNextExecution;
    private sendReportNotifications;
    private startScheduledReportProcessor;
    private generateDashboardKPIs;
    private generateDashboardCharts;
    private generateDashboardInsights;
    private generateHeaderSection;
    private generateSummarySection;
    private generateChartSection;
    private generateTableSection;
    private generateKPISection;
    private generateInsightsSection;
}
interface ReportStyling {
    colors: string[];
    fonts: Record<string, string>;
    layout: Record<string, unknown>;
}
interface BrandingConfig {
    logo?: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
}
interface DataRequirement {
    source: string;
    query: string;
    dependencies: string[];
    caching: boolean;
}
interface ReportParameter {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    validation?: Record<string, unknown>;
}
interface RecipientConfig {
    email: string;
    name: string;
    role: string;
}
interface DeliveryConfig {
    method: 'email' | 'dashboard' | 'api';
    options: Record<string, unknown>;
}
interface ActionItem {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
}
interface ReportMetadata {
    templateVersion: number;
    dataSourcesUsed: string[];
    generationMethod: string;
    qualityScore: number;
}
interface ReportExport {
    id: string;
    reportId: string;
    format: string;
    path: string;
    size: number;
    createdAt: Date;
    downloadCount: number;
}
interface FormattingConfig {
    numberFormat?: string;
    dateFormat?: string;
    currency?: string;
}
interface FilterConfig {
    field: string;
    operator: string;
    value: unknown;
}
export {};
//# sourceMappingURL=advanced-reporting.service.d.ts.map