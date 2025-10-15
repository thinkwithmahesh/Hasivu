import { z } from 'zod';
import { DatabaseService } from '../database.service';
import { CacheService } from '../cache.service';
import { NotificationService } from '../notification.service';
import { VendorIntelligenceService } from './vendor-intelligence.service';
import SupplyChainService from './supply-chain-automation.service';
declare const ProcurementCriteriaSchema: z.ZodObject<{
    schoolId: z.ZodString;
    categoryId: z.ZodString;
    itemType: z.ZodString;
    quantity: z.ZodNumber;
    urgency: z.ZodEnum<{
        high: "high";
        low: "low";
        medium: "medium";
        critical: "critical";
    }>;
    budget: z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    qualitySpecs: z.ZodObject<{
        certifications: z.ZodOptional<z.ZodArray<z.ZodString>>;
        standards: z.ZodOptional<z.ZodArray<z.ZodString>>;
        customRequirements: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    deliveryRequirements: z.ZodObject<{
        location: z.ZodString;
        preferredDate: z.ZodString;
        maxDeliveryTime: z.ZodNumber;
        specialHandling: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    sustainabilityRequirements: z.ZodObject<{
        organicRequired: z.ZodDefault<z.ZodBoolean>;
        localPreferred: z.ZodDefault<z.ZodBoolean>;
        carbonFootprintLimit: z.ZodOptional<z.ZodNumber>;
        packagingRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    riskTolerance: z.ZodEnum<{
        moderate: "moderate";
        conservative: "conservative";
        aggressive: "aggressive";
    }>;
    diversificationRequired: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
declare const VendorMatchingResultSchema: z.ZodObject<{
    vendorId: z.ZodString;
    matchScore: z.ZodNumber;
    scores: z.ZodObject<{
        qualityScore: z.ZodNumber;
        priceScore: z.ZodNumber;
        deliveryScore: z.ZodNumber;
        reliabilityScore: z.ZodNumber;
        sustainabilityScore: z.ZodNumber;
        riskScore: z.ZodNumber;
        historicalPerformance: z.ZodNumber;
        financialStability: z.ZodNumber;
    }, z.core.$strip>;
    pricing: z.ZodObject<{
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        discounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            amount: z.ZodNumber;
            description: z.ZodString;
        }, z.core.$strip>>>;
        paymentTerms: z.ZodString;
    }, z.core.$strip>;
    capabilities: z.ZodObject<{
        capacity: z.ZodNumber;
        leadTime: z.ZodNumber;
        minimumOrder: z.ZodNumber;
        maximumOrder: z.ZodNumber;
        certifications: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    riskAssessment: z.ZodObject<{
        overallRisk: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
        }>;
        riskFactors: z.ZodArray<z.ZodString>;
        mitigationStrategies: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
declare const DemandForecastSchema: z.ZodObject<{
    schoolId: z.ZodString;
    itemType: z.ZodString;
    timeframe: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
        quarterly: "quarterly";
    }>;
    forecast: z.ZodObject<{
        predicted_demand: z.ZodNumber;
        confidence_interval: z.ZodObject<{
            lower: z.ZodNumber;
            upper: z.ZodNumber;
            confidence_level: z.ZodNumber;
        }, z.core.$strip>;
        trend: z.ZodEnum<{
            seasonal: "seasonal";
            stable: "stable";
            increasing: "increasing";
            decreasing: "decreasing";
        }>;
        seasonality_factors: z.ZodArray<z.ZodObject<{
            factor: z.ZodString;
            impact: z.ZodNumber;
            period: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    external_factors: z.ZodObject<{
        weather_impact: z.ZodOptional<z.ZodNumber>;
        event_impact: z.ZodOptional<z.ZodNumber>;
        market_trends: z.ZodOptional<z.ZodArray<z.ZodString>>;
        economic_indicators: z.ZodOptional<z.ZodObject<{
            inflation_rate: z.ZodOptional<z.ZodNumber>;
            commodity_prices: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    recommendations: z.ZodObject<{
        optimal_order_quantity: z.ZodNumber;
        optimal_order_timing: z.ZodString;
        safety_stock_level: z.ZodNumber;
        cost_optimization_suggestions: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const RFPGenerationConfigSchema: z.ZodObject<{
    schoolId: z.ZodString;
    procurementId: z.ZodString;
    template: z.ZodEnum<{
        maintenance: "maintenance";
        standard: "standard";
        services: "services";
        food_service: "food_service";
        equipment: "equipment";
    }>;
    urgency: z.ZodEnum<{
        emergency: "emergency";
        standard: "standard";
        expedited: "expedited";
    }>;
    evaluationCriteria: z.ZodObject<{
        price_weight: z.ZodNumber;
        quality_weight: z.ZodNumber;
        delivery_weight: z.ZodNumber;
        sustainability_weight: z.ZodNumber;
        innovation_weight: z.ZodNumber;
    }, z.core.$strip>;
    customRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    complianceRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
type ProcurementCriteria = z.infer<typeof ProcurementCriteriaSchema>;
type VendorMatchingResult = z.infer<typeof VendorMatchingResultSchema>;
type DemandForecast = z.infer<typeof DemandForecastSchema>;
type RFPGenerationConfig = z.infer<typeof RFPGenerationConfigSchema>;
export declare class AIProcurementEngine {
    private db;
    private cache;
    private notifications;
    private vendorIntelligence;
    private supplyChain;
    private modelConfig;
    constructor(db: DatabaseService, cache: CacheService, notifications: NotificationService, vendorIntelligence: VendorIntelligenceService, supplyChain: SupplyChainService);
    generateProcurementRecommendations(criteria: ProcurementCriteria): Promise<{
        vendors: VendorMatchingResult[];
        demandForecast: DemandForecast;
        optimizedTiming: {
            recommendedOrderDate: string;
            deliveryWindow: {
                start: string;
                end: string;
            };
            costOptimization: {
                savings: number;
                strategy: string;
            };
        };
        riskAssessment: {
            overallRisk: string;
            diversificationStrategy: string[];
            contingencyPlans: string[];
        };
    }>;
    private findOptimalVendors;
    private calculateVendorMatchScore;
    generateDemandForecast(schoolId: string, itemType: string): Promise<DemandForecast>;
    private calculateOptimalTiming;
    generateAutomatedRFP(config: RFPGenerationConfig, criteria: ProcurementCriteria): Promise<{
        rfpDocument: string;
        evaluationMatrix: any;
        timeline: any;
        complianceChecklist: string[];
    }>;
    private calculateQualityScore;
    private calculatePriceScore;
    private calculateDeliveryScore;
    private calculateReliabilityScore;
    private calculateSustainabilityScore;
    private calculateRiskScore;
    private calculateHistoricalPerformance;
    private calculateFinancialStability;
    private generatePricingEstimate;
    private generateVendorRiskAssessment;
    private generateVendorRecommendations;
    private applyVendorDiversification;
    private getExternalFactors;
    private applyDemandForecastingModel;
    private detectTrend;
    private getMarketPriceTrends;
    private calculateOptimalOrderDate;
    private calculateDeliveryWindow;
    private calculateCostOptimization;
    private assessProcurementRisks;
    private analyzeRequirements;
    private generateExecutiveSummary;
    private generateScopeOfWork;
    private generateTechnicalSpecs;
    private generateEvaluationCriteria;
    private generateTermsAndConditions;
    private generateSubmissionRequirements;
    private compileRFPDocument;
    private generateEvaluationMatrix;
    private generateRFPTimeline;
    private generateComplianceChecklist;
    private storeRFP;
}
export default AIProcurementEngine;
//# sourceMappingURL=ai-procurement-engine.d.ts.map