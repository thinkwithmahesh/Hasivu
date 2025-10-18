/**
 * HASIVU Epic 3 → Story 5: Reporting API Integration
 *
 * TypeScript API client for advanced reporting and insights:
 * - Report template management
 * - Report generation and status tracking
 * - Export management and downloads
 * - AI insights and analysis
 * - Scheduled reporting
 *
 * Production-ready implementation with error handling and type safety
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 * @since 2024-09-18
 */

import { ApiClient } from './client';
import { ApiResponse } from './types';

// Types
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
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'summary' | 'chart' | 'table' | 'text' | 'kpi' | 'insights';
  title: string;
  position: { row: number; column: number; span: number };
  config: {
    dataSource?: string;
    visualization?: VisualizationConfig;
    formatting?: FormattingConfig;
    filters?: FilterConfig[];
  };
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  generatedAt: string;
  generatedBy: string;
  tenantId: string;
  parameters: Record<string, any>;
  dateRange: { start: string; end: string };
  data: ReportData;
  insights: AIGeneratedInsight[];
  metadata: ReportMetadata;
  exports: ReportExport[];
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  executionTime: number;
  error?: string;
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
  dataPoints: any[];
  metadata: {
    algorithm: string;
    modelVersion: string;
    generatedAt: string;
    reviewStatus: 'pending' | 'approved' | 'rejected';
  };
}

export interface DashboardData {
  kpis: Array<{
    id: string;
    name: string;
    value: number;
    trend: number;
    format: string;
    target?: number;
  }>;
  charts: Array<{
    id: string;
    type: string;
    title: string;
    data: any[];
    config: any;
  }>;
  insights: AIGeneratedInsight[];
  realTimeMetrics: Record<string, any>;
  dataFreshness: string;
}

export interface ReportGenerationRequest {
  templateId: string;
  parameters?: Record<string, any>;
  dateRange?: { start: string; end: string };
  options?: {
    includeInsights?: boolean;
    exportFormats?: string[];
    schedule?: boolean;
    priority?: 'low' | 'normal' | 'high';
  };
}

export interface ReportGenerationResponse {
  reportId: string;
  status: string;
  executionTime?: number;
  estimatedCompletion?: string;
  exports: Array<{
    id: string;
    format: string;
    size: number;
    downloadUrl: string;
  }>;
}

export interface ReportStatus {
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  estimatedCompletion?: string;
  error?: string;
}

export interface ScheduleReportRequest {
  templateId: string;
  schedule: ScheduleConfig;
  parameters?: Record<string, any>;
}

export interface AIInsightAnalysisRequest {
  data: Record<string, any[]>;
  analysisType: 'trends' | 'anomalies' | 'predictions' | 'correlations' | 'recommendations';
  config?: Record<string, any>;
  dateRange?: { start: string; end: string };
}

export interface ExportFormat {
  type: 'pdf' | 'excel' | 'csv' | 'json' | 'powerbi' | 'tableau' | 'html';
  name: string;
  description: string;
  mimeType: string;
  features: string[];
  maxFileSize: string;
}

// Supporting interfaces
interface ReportStyling {
  colors: string[];
  fonts: Record<string, string>;
  layout: Record<string, any>;
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
  defaultValue?: any;
  validation?: any;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  interval?: number;
  cronExpression?: string;
  timezone: string;
  recipients: RecipientConfig[];
  deliveryOptions: DeliveryConfig;
}

interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'treemap';
  dimensions: string[];
  metrics: string[];
  colors: string[];
  animations: boolean;
  interactions: boolean;
  responsive: boolean;
}

interface ReportData {
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    generationTime: number;
    dataFreshness: string;
  };
  sections: Record<string, any>;
  rawData: Record<string, any[]>;
  calculations: {
    kpis: Record<string, number>;
    trends: Record<string, any>;
    comparisons: Record<string, any>;
  };
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
  createdAt: string;
  downloadCount: number;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed?: boolean;
}

interface RecipientConfig {
  email: string;
  name: string;
  role: string;
}

interface DeliveryConfig {
  method: 'email' | 'dashboard' | 'api';
  options: Record<string, any>;
}

interface FormattingConfig {
  numberFormat?: string;
  dateFormat?: string;
  currency?: string;
}

interface FilterConfig {
  field: string;
  operator: string;
  value: any;
}

/**
 * Advanced Reporting API Client
 */
export class ReportingAPI {
  constructor(private client: ApiClient) {}

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(params: {
    startDate?: string;
    endDate?: string;
    filters?: string;
  }): Promise<DashboardData> {
    const response = await this.client.get<ApiResponse<DashboardData>>(
      '/api/v1/reporting/dashboard',
      { params }
    );
    return response.data.data;
  }

  /**
   * Create a new report template
   */
  async createReportTemplate(
    template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<ReportTemplate> {
    const response = await this.client.post<ApiResponse<ReportTemplate>>(
      '/api/v1/reporting/templates',
      template
    );
    return response.data.data;
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(params?: { category?: string; page?: number; limit?: number }): Promise<{
    templates: ReportTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.client.get<
      ApiResponse<{
        templates: ReportTemplate[];
        total: number;
        page: number;
        limit: number;
      }>
    >('/api/v1/reporting/templates', { params });
    return response.data.data;
  }

  /**
   * Get a specific report template
   */
  async getReportTemplate(templateId: string): Promise<ReportTemplate> {
    const response = await this.client.get<ApiResponse<ReportTemplate>>(
      `/api/v1/reporting/templates/${templateId}`
    );
    return response.data.data;
  }

  /**
   * Update a report template
   */
  async updateReportTemplate(
    templateId: string,
    updates: Partial<ReportTemplate>
  ): Promise<ReportTemplate> {
    const response = await this.client.put<ApiResponse<ReportTemplate>>(
      `/api/v1/reporting/templates/${templateId}`,
      updates
    );
    return response.data.data;
  }

  /**
   * Delete a report template
   */
  async deleteReportTemplate(templateId: string): Promise<void> {
    await this.client.delete(`/api/v1/reporting/templates/${templateId}`);
  }

  /**
   * Generate a new report
   */
  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    const response = await this.client.post<ApiResponse<ReportGenerationResponse>>(
      '/api/v1/reporting/generate',
      request
    );
    return response.data.data;
  }

  /**
   * Get report generation status
   */
  async getReportStatus(reportId: string): Promise<ReportStatus> {
    const response = await this.client.get<ApiResponse<ReportStatus>>(
      `/api/v1/reporting/reports/${reportId}/status`
    );
    return response.data.data;
  }

  /**
   * Get generated report details
   */
  async getReport(reportId: string): Promise<GeneratedReport> {
    const response = await this.client.get<ApiResponse<GeneratedReport>>(
      `/api/v1/reporting/reports/${reportId}`
    );
    return response.data.data;
  }

  /**
   * Get report export details
   */
  async getReportExport(reportId: string, exportId: string): Promise<ReportExport> {
    const response = await this.client.get<ApiResponse<ReportExport>>(
      `/api/v1/reporting/reports/${reportId}/exports/${exportId}`
    );
    return response.data.data;
  }

  /**
   * Download a report export
   */
  async downloadReportExport(reportId: string, exportId: string): Promise<Blob> {
    const response = await this.client.get(
      `/api/v1/reporting/reports/${reportId}/download/${exportId}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  /**
   * Schedule automated report generation
   */
  async scheduleReport(request: ScheduleReportRequest): Promise<{ scheduleId: string }> {
    const response = await this.client.post<ApiResponse<{ scheduleId: string }>>(
      '/api/v1/reporting/schedule',
      request
    );
    return response.data.data;
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports(params?: { status?: string; page?: number; limit?: number }): Promise<{
    schedules: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.client.get<
      ApiResponse<{
        schedules: any[];
        total: number;
        page: number;
        limit: number;
      }>
    >('/api/v1/reporting/schedules', { params });
    return response.data.data;
  }

  /**
   * Update a scheduled report
   */
  async updateScheduledReport(scheduleId: string, updates: Partial<ScheduleConfig>): Promise<any> {
    const response = await this.client.put<ApiResponse<any>>(
      `/api/v1/reporting/schedules/${scheduleId}`,
      updates
    );
    return response.data.data;
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(scheduleId: string): Promise<void> {
    await this.client.delete(`/api/v1/reporting/schedules/${scheduleId}`);
  }

  /**
   * Generate AI insights for custom data
   */
  async analyzeWithAI(request: AIInsightAnalysisRequest): Promise<{
    insights: AIGeneratedInsight[];
    analysisType: string;
    count: number;
  }> {
    const response = await this.client.post<
      ApiResponse<{
        insights: AIGeneratedInsight[];
        analysisType: string;
        count: number;
      }>
    >('/api/v1/reporting/insights/analyze', request);
    return response.data.data;
  }

  /**
   * Get natural language explanation for an insight
   */
  async getInsightExplanation(insightId: string): Promise<{
    summary: string;
    detailed: string;
  }> {
    const response = await this.client.get<
      ApiResponse<{
        summary: string;
        detailed: string;
      }>
    >(`/api/v1/reporting/insights/${insightId}/explanation`);
    return response.data.data;
  }

  /**
   * Review an AI insight
   */
  async reviewInsight(
    insightId: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ): Promise<void> {
    await this.client.post(`/api/v1/reporting/insights/${insightId}/review`, {
      status,
      feedback,
    });
  }

  /**
   * Get available export formats
   */
  async getExportFormats(): Promise<{ formats: ExportFormat[]; count: number }> {
    const response = await this.client.get<
      ApiResponse<{
        formats: ExportFormat[];
        count: number;
      }>
    >('/api/v1/reporting/exports/formats');
    return response.data.data;
  }

  /**
   * Get reporting service health status
   */
  async getHealthStatus(): Promise<{
    reportingService: { healthy: boolean; details: any };
    aiInsights: { healthy: boolean; details: any };
    timestamp: string;
  }> {
    const response = await this.client.get<
      ApiResponse<{
        reportingService: { healthy: boolean; details: any };
        aiInsights: { healthy: boolean; details: any };
        timestamp: string;
      }>
    >('/api/v1/reporting/health');
    return response.data.data;
  }

  /**
   * Get report generation history
   */
  async getReportHistory(params?: {
    templateId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    reports: GeneratedReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.client.get<
      ApiResponse<{
        reports: GeneratedReport[];
        total: number;
        page: number;
        limit: number;
      }>
    >('/api/v1/reporting/history', { params });
    return response.data.data;
  }

  /**
   * Cancel report generation
   */
  async cancelReportGeneration(reportId: string): Promise<void> {
    await this.client.post(`/api/v1/reporting/reports/${reportId}/cancel`);
  }

  /**
   * Duplicate a report template
   */
  async duplicateTemplate(templateId: string, name: string): Promise<ReportTemplate> {
    const response = await this.client.post<ApiResponse<ReportTemplate>>(
      `/api/v1/reporting/templates/${templateId}/duplicate`,
      { name }
    );
    return response.data.data;
  }

  /**
   * Export template configuration
   */
  async exportTemplate(templateId: string): Promise<Blob> {
    const response = await this.client.get(`/api/v1/reporting/templates/${templateId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Import template configuration
   */
  async importTemplate(file: File): Promise<ReportTemplate> {
    const _formData = new FormData();
    formData.append('template', file);

    const response = await this.client.post<ApiResponse<ReportTemplate>>(
      '/api/v1/reporting/templates/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }
}

// Create singleton instance
export const _reportingApi = new ReportingAPI(new ApiClient());
