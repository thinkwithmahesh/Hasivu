/// <reference types="node" />
import { z } from 'zod';
import { EventEmitter } from 'events';
import { DatabaseService } from '../services/database.service';
import { CacheService } from '../services/cache.service';
import { NotificationService } from '../services/notification.service';
declare const VendorMarketplaceRequestSchema: z.ZodObject<{
    schoolId: z.ZodString;
    userId: z.ZodString;
    action: z.ZodEnum<{
        risk_assessment: "risk_assessment";
        generate_rfp: "generate_rfp";
        search_vendors: "search_vendors";
        place_order: "place_order";
        track_delivery: "track_delivery";
        quality_inspection: "quality_inspection";
        vendor_analysis: "vendor_analysis";
        sustainability_report: "sustainability_report";
        inventory_optimization: "inventory_optimization";
        cost_analysis: "cost_analysis";
    }>;
    parameters: z.ZodOptional<z.ZodObject<{}, z.core.$catchall<z.ZodUnknown>>>;
    priority: z.ZodDefault<z.ZodEnum<{
        high: "high";
        low: "low";
        medium: "medium";
        critical: "critical";
    }>>;
    metadata: z.ZodOptional<z.ZodObject<{}, z.core.$catchall<z.ZodUnknown>>>;
}, z.core.$strip>;
declare const AnalyticsDashboardSchema: z.ZodObject<{
    schoolId: z.ZodString;
    timeframe: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
        hourly: "hourly";
        realtime: "realtime";
    }>;
    metrics: z.ZodArray<z.ZodEnum<{
        cost_savings: "cost_savings";
        delivery_reliability: "delivery_reliability";
        vendor_performance: "vendor_performance";
        quality_scores: "quality_scores";
        user_satisfaction: "user_satisfaction";
        inventory_optimization: "inventory_optimization";
        sustainability_impact: "sustainability_impact";
        risk_metrics: "risk_metrics";
    }>>;
    filters: z.ZodOptional<z.ZodObject<{
        vendorIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type VendorMarketplaceRequest = z.infer<typeof VendorMarketplaceRequestSchema>;
type AnalyticsDashboard = z.infer<typeof AnalyticsDashboardSchema>;
export declare class VendorMarketplaceIntegration extends EventEmitter {
    private db;
    private cache;
    private notifications;
    private procurementEngine;
    private vendorIntelligence;
    private supplyChainAutomation;
    private performanceMetrics;
    private eventQueues;
    private processingEvents;
    private serviceStatus;
    constructor(db: DatabaseService, cache: CacheService, notifications: NotificationService);
    processRequest(request: VendorMarketplaceRequest): Promise<{
        success: boolean;
        data?: Record<string, unknown>;
        error?: string;
        metadata: {
            requestId: string;
            executionTime: number;
            servicesInvolved: string[];
            cacheHit: boolean;
        };
    }>;
    private routeRequest;
    private handleVendorSearch;
    private handleRFPGeneration;
    private handleOrderPlacement;
    private handleDeliveryTracking;
    private handleQualityInspection;
    private handleVendorAnalysis;
    private handleSustainabilityReport;
    private handleInventoryOptimization;
    private handleCostAnalysis;
    private handleRiskAssessment;
    generateAnalyticsDashboard(config: AnalyticsDashboard): Promise<{
        overview: {
            totalVendors: number;
            activeOrders: number;
            totalSpend: number;
            averageDeliveryTime: number;
            qualityScore: number;
            sustainabilityScore: number;
        };
        performance: {
            vendorPerformance: Array<Record<string, unknown>>;
            deliveryReliability: Array<Record<string, unknown>>;
            qualityTrends: Array<Record<string, unknown>>;
            costTrends: Array<Record<string, unknown>>;
        };
        insights: {
            topPerformers: Array<Record<string, unknown>>;
            improvementOpportunities: Array<Record<string, unknown>>;
            riskAlerts: Array<Record<string, unknown>>;
            recommendations: string[];
        };
        sustainability: {
            carbonFootprint: number;
            sustainabilityScore: number;
            greenInitiatives: Array<Record<string, unknown>>;
            improvements: Array<Record<string, unknown>>;
        };
        forecasts: {
            demandPrediction: Array<Record<string, unknown>>;
            costProjection: Array<Record<string, unknown>>;
            riskProjection: Array<Record<string, unknown>>;
        };
    }>;
    private emitIntegrationEvent;
    private processEvent;
    private handleIntegrationEvent;
    private initializeServices;
    private initializeMonitoring;
    private initializeEventProcessing;
    private generateCacheKey;
    private isCacheableAction;
    private getCacheTTL;
    private updateAverageResponseTime;
    private storeRFPGeneration;
    private setupOrderMonitoring;
    private getDeliveryTrackingData;
    private getLogisticsOptimizationData;
    private updateVendorPerformance;
    private generateCompetitiveAnalysis;
    private generateVendorRecommendations;
    private generateSustainabilityReport;
    private buildProcurementCriteriaFromInventory;
    private analyzeProcurementCosts;
    private analyzeVendorCosts;
    private identifyCostOptimizationOpportunities;
    private assessPerformanceRisk;
    private calculateOverallRisk;
    private assessSupplyChainRisks;
    private generateRiskMitigationStrategies;
    private calculateOverallRiskScore;
    private generateOverviewMetrics;
    private generatePerformanceAnalytics;
    private generateAnalyticsInsights;
    private generateSustainabilityAnalytics;
    private generateForecastAnalytics;
    private handleVendorPerformanceAlert;
    private handleOrderStatusChange;
    private handleQualityInspectionFailed;
    private handleDeliveryDelayed;
    private handleSustainabilityAlert;
    private checkServiceHealth;
    private processEventQueues;
    private updatePerformanceMetrics;
    private storeProcessedEvent;
}
export default VendorMarketplaceIntegration;
//# sourceMappingURL=vendor-marketplace-integration.d.ts.map