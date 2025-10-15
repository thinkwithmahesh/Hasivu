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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._analyticsService = exports.AnalyticsService = void 0;
__exportStar(require("./analytics/types"), exports);
const metric_tracking_1 = require("./analytics/metric-tracking");
const query_execution_1 = require("./analytics/query-execution");
const dashboard_generation_1 = require("./analytics/dashboard-generation");
const report_generation_1 = require("./analytics/report-generation");
const cohort_analysis_1 = require("./analytics/cohort-analysis");
const predictive_analytics_1 = require("./analytics/predictive-analytics");
class AnalyticsService {
    static instance;
    static getInstance() {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }
    static async initialize() {
        await metric_tracking_1.MetricTrackingService.initialize();
    }
    static async trackMetric(name, value, dimensions = {}, metadata) {
        return metric_tracking_1.MetricTrackingService.trackMetric(name, value, dimensions, metadata);
    }
    static async executeQuery(query) {
        return query_execution_1.QueryExecutionService.executeQuery(query);
    }
    static async generateDashboard(dashboardId, userId, dateRange) {
        return dashboard_generation_1.DashboardGenerationService.generateDashboard(dashboardId, userId, dateRange);
    }
    static async generateReport(period, reportType) {
        return report_generation_1.ReportGenerationService.generateReport(period, reportType);
    }
    static async generateCohortAnalysis(startDate, endDate) {
        return cohort_analysis_1.CohortAnalysisService.generateCohortAnalysis(startDate, endDate);
    }
    static async generatePredictiveAnalytics() {
        return predictive_analytics_1.PredictiveAnalyticsService.generatePredictiveAnalytics();
    }
    static async getRealtimeMetrics() {
        return metric_tracking_1.MetricTrackingService.getRealtimeMetrics();
    }
}
exports.AnalyticsService = AnalyticsService;
exports._analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map