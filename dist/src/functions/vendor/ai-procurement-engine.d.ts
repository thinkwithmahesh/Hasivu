import { PrismaClient } from '@prisma/client';
import { Logger } from '../../utils/logger';
declare class TenantContext {
    setTenant(_tenantId: string): Promise<void>;
}
declare class MetricsCollector {
    recordVendorMatching(_data: any): void;
    recordError(_type: string, _message: string, _data: any): void;
    recordDemandForecasting(_data: any): void;
    recordPriceOptimization(_data: any): void;
    recordRFPGeneration(_data: any): void;
}
declare class SecurityManager {
    validateRequest(_action: string, _data: any): Promise<void>;
}
declare class ComplianceValidator {
    validateDataAccess(_resource: string, _tenantId: string): Promise<void>;
}
interface VendorMatchingCriteria {
    schoolId: string;
    tenantId: string;
    productCategories: string[];
    deliveryRadius: number;
    budgetRange: [number?, number?, ...unknown[]];
    qualityRequirements: QualityStandard[];
    certificationRequirements: string[];
    deliverySchedule: DeliverySchedule;
    volumeRequirements: VolumeRequirement[];
    specialRequirements?: string[];
}
interface QualityStandard {
    category: string;
    standard: string;
    minimumScore: number;
    mandatory: boolean;
}
interface DeliverySchedule {
    days: string[];
    timeWindows: TimeWindow[];
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    advanceNotice: number;
}
interface TimeWindow {
    start: string;
    end: string;
    priority: 'high' | 'medium' | 'low';
}
interface VolumeRequirement {
    product: string;
    dailyQuantity: number;
    weeklyQuantity: number;
    seasonalVariation: number;
    growthProjection: number;
}
interface VendorProfile {
    vendorId: string;
    businessName: string;
    contactInfo: ContactInfo;
    certifications: Certification[];
    serviceAreas: ServiceArea[];
    productCategories: ProductCategory[];
    capacityProfile: CapacityProfile;
    qualityMetrics: QualityMetrics;
    financialProfile: FinancialProfile;
    performanceHistory: PerformanceHistory;
    riskProfile: RiskProfile;
}
interface ContactInfo {
    primaryContact: string;
    email: string;
    phone: string;
    address: Address;
    emergencyContact?: string;
}
interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: [number, number];
}
interface Certification {
    type: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    verificationStatus: 'verified' | 'pending' | 'expired';
    documentUrl?: string;
}
interface ServiceArea {
    region: string;
    radius: number;
    deliveryCapacity: number;
    preferredZones: string[];
}
interface ProductCategory {
    category: string;
    subcategories: string[];
    specializations: string[];
    minimumOrderQuantity: number;
    maximumOrderQuantity: number;
    unitPricing: PricingTier[];
}
interface PricingTier {
    minQuantity: number;
    maxQuantity: number;
    unitPrice: number;
    discountPercentage: number;
}
interface CapacityProfile {
    dailyCapacity: number;
    weeklyCapacity: number;
    peakCapacity: number;
    scalabilityFactor: number;
    resourceUtilization: number;
    expansionCapability: boolean;
}
interface QualityMetrics {
    overallScore: number;
    productQuality: number;
    deliveryReliability: number;
    customerService: number;
    compliance: number;
    innovation: number;
    sustainability: number;
    lastUpdated: Date;
}
interface FinancialProfile {
    creditRating: string;
    annualRevenue: number;
    profitabilityScore: number;
    cashFlowStability: number;
    insuranceCoverage: InsuranceCoverage[];
    bondingCapacity: number;
    paymentTerms: string;
}
interface InsuranceCoverage {
    type: string;
    provider: string;
    coverage: number;
    validTo: Date;
}
interface PerformanceHistory {
    totalOrders: number;
    completedOrders: number;
    averageDeliveryTime: number;
    qualityIncidents: number;
    customerSatisfaction: number;
    returnRate: number;
    escalationRate: number;
    performanceTrend: string;
}
interface RiskProfile {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    financialRisk: number;
    operationalRisk: number;
    complianceRisk: number;
    reputationalRisk: number;
    riskFactors: string[];
    mitigationStrategies: string[];
}
interface DemandForecast {
    product: string;
    forecastPeriod: string;
    predictedDemand: number;
    confidence: number;
    seasonalFactors: SeasonalFactor[];
    trendIndicators: TrendIndicator[];
    riskFactors: string[];
}
interface SeasonalFactor {
    period: string;
    multiplier: number;
    description: string;
}
interface TrendIndicator {
    indicator: string;
    impact: number;
    confidence: number;
    timeframe: string;
}
interface PriceOptimization {
    product: string;
    currentPrice: number;
    optimizedPrice: number;
    savings: number;
    marketComparison: MarketComparison;
    negotiationStrategy: string[];
    riskAssessment: string;
}
interface MarketComparison {
    marketAverage: number;
    competitorPrices: CompetitorPrice[];
    priceIndex: number;
    volatility: number;
}
interface CompetitorPrice {
    vendor: string;
    price: number;
    qualityScore: number;
    reliability: number;
}
interface RFPRequest {
    rfpId: string;
    schoolId: string;
    tenantId: string;
    requirements: ProcurementRequirement[];
    evaluationCriteria: EvaluationCriterion[];
    timeline: RFPTimeline;
    termsAndConditions: string[];
    generatedAt: Date;
    status: 'draft' | 'published' | 'responses_received' | 'evaluated' | 'awarded';
}
interface ProcurementRequirement {
    category: string;
    specifications: Specification[];
    quantity: QuantityRequirement;
    deliveryRequirements: DeliveryRequirement[];
    qualityStandards: QualityStandard[];
    complianceRequirements: string[];
}
interface Specification {
    attribute: string;
    requirement: string;
    mandatory: boolean;
    weight: number;
}
interface QuantityRequirement {
    minimum: number;
    maximum: number;
    preferred: number;
    unit: string;
    frequency: string;
}
interface DeliveryRequirement {
    location: string;
    timeWindow: TimeWindow;
    specialInstructions: string[];
    contactPerson: string;
}
interface EvaluationCriterion {
    criterion: string;
    weight: number;
    scoringMethod: 'linear' | 'threshold' | 'binary';
    passingScore: number;
    description: string;
}
interface RFPTimeline {
    publishDate: Date;
    questionDeadline: Date;
    responseDeadline: Date;
    evaluationComplete: Date;
    awardNotification: Date;
    contractStart: Date;
}
export declare class AIProcurementEngine {
    private prisma;
    private logger;
    private metrics;
    private security;
    private compliance;
    private tenantContext;
    constructor(prisma: PrismaClient, tenantContext: TenantContext, logger: Logger, metrics: MetricsCollector, security: SecurityManager, compliance: ComplianceValidator);
    matchVendors(criteria: VendorMatchingCriteria, options?: {
        maxResults?: number;
        includeAlternatives?: boolean;
        prioritizeLocal?: boolean;
        riskTolerance?: 'low' | 'medium' | 'high';
    }): Promise<{
        matches: VendorMatch[];
        alternatives: VendorMatch[];
        recommendations: string[];
        confidence: number;
        processingTime: number;
    }>;
    generateDemandForecast(schoolId: string, tenantId: string, products: string[], forecastHorizon?: number, options?: {
        includeSeasonality?: boolean;
        includeExternalFactors?: boolean;
        confidenceLevel?: number;
        granularity?: 'daily' | 'weekly' | 'monthly';
    }): Promise<{
        forecasts: DemandForecast[];
        accuracy: number;
        recommendations: string[];
        riskFactors: string[];
        processingTime: number;
    }>;
    optimizePricing(schoolId: string, tenantId: string, products: string[], vendors: string[], options?: {
        aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
        qualityThreshold?: number;
        negotiationBudget?: number;
        timeHorizon?: number;
    }): Promise<{
        optimizations: PriceOptimization[];
        totalSavings: number;
        riskAssessment: string;
        implementationPlan: string[];
        processingTime: number;
    }>;
    generateAutomatedRFP(schoolId: string, tenantId: string, requirements: any, options?: {
        template?: string;
        urgency?: 'low' | 'medium' | 'high' | 'critical';
        competitionLevel?: 'limited' | 'moderate' | 'high';
        customClauses?: string[];
        evaluationWeight?: {
            [key: string]: number;
        };
    }): Promise<{
        rfpId: string;
        rfpDocument: RFPRequest;
        recommendedVendors: string[];
        estimatedResponses: number;
        timeline: RFPTimeline;
        processingTime: number;
    }>;
    private getVendorPool;
    private calculateCompatibilityScores;
    private calculateLocationScore;
    private calculateCapacityScore;
    private calculateQualityScore;
    private calculatePriceScore;
    private calculateReliabilityScore;
    private calculateComplianceScore;
    private calculateDynamicWeights;
    private generateMatchReasons;
    private identifyVendorRisks;
    private identifyOpportunities;
    private applyRiskFiltering;
    private generateMatchingRecommendations;
    private calculateMatchingConfidence;
    private calculateVariance;
    private generateRFPId;
    private generateRFPTimeline;
    private calculateResponseRate;
    private collectHistoricalDemand;
    private generateBaselineForecasts;
    private applyTimeSeriesForecasting;
    private storeRFP;
    private generateForecastRecommendations;
    private identifyForecastRisks;
    private collectCurrentPricing;
    private collectMarketIntelligence;
    private analyzeVendorPricing;
    private optimizeProductPricing;
    private generateImplementationPlan;
    private assessOptimizationRisk;
    private analyzeAndGenerateSpecifications;
    private generateEvaluationCriteria;
    private generateTermsAndConditions;
    private getRecommendedVendorsForRFP;
}
interface VendorMatch {
    vendor: VendorProfile;
    scores: {
        location: number;
        capacity: number;
        quality: number;
        price: number;
        reliability: number;
        compliance: number;
        composite: number;
    };
    compositeScore: number;
    matchReasons: string[];
    risks: string[];
    opportunities: string[];
}
export default AIProcurementEngine;
//# sourceMappingURL=ai-procurement-engine.d.ts.map