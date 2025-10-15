/// <reference types="node" />
import { z } from 'zod';
import { DatabaseService } from '../database.service';
import { CacheService } from '../cache.service';
import { NotificationService } from '../notification.service';
import { VendorIntelligenceService } from './vendor-intelligence.service';
import { EventEmitter } from 'events';
declare const OrderOrchestrationConfigSchema: z.ZodObject<{
    orderId: z.ZodString;
    schoolId: z.ZodString;
    orderType: z.ZodEnum<{
        urgent: "urgent";
        bulk: "bulk";
        standard: "standard";
        special: "special";
    }>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        specifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        urgency: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>;
        qualityRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    deliveryRequirements: z.ZodObject<{
        location: z.ZodString;
        preferredDate: z.ZodString;
        timeWindow: z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, z.core.$strip>;
        specialInstructions: z.ZodOptional<z.ZodString>;
        contactPerson: z.ZodString;
        alternateContacts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    budgetConstraints: z.ZodObject<{
        maxBudget: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        paymentTerms: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    qualityStandards: z.ZodObject<{
        inspectionRequired: z.ZodDefault<z.ZodBoolean>;
        certificationRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
        customQualityChecks: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    sustainabilityRequirements: z.ZodObject<{
        carbonFootprintLimit: z.ZodOptional<z.ZodNumber>;
        localSourcingPreferred: z.ZodDefault<z.ZodBoolean>;
        organicRequired: z.ZodDefault<z.ZodBoolean>;
        packagingRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const InventoryManagementConfigSchema: z.ZodObject<{
    schoolId: z.ZodString;
    itemId: z.ZodString;
    currentStock: z.ZodNumber;
    safetyStockLevel: z.ZodNumber;
    reorderPoint: z.ZodNumber;
    maxStockLevel: z.ZodNumber;
    demandPatterns: z.ZodObject<{
        averageDailyUsage: z.ZodNumber;
        seasonalFactors: z.ZodArray<z.ZodObject<{
            season: z.ZodString;
            multiplier: z.ZodNumber;
        }, z.core.$strip>>;
        trendDirection: z.ZodEnum<{
            stable: "stable";
            increasing: "increasing";
            decreasing: "decreasing";
        }>;
        volatility: z.ZodNumber;
    }, z.core.$strip>;
    supplierInfo: z.ZodObject<{
        primaryVendorId: z.ZodString;
        backupVendorIds: z.ZodArray<z.ZodString>;
        leadTimes: z.ZodRecord<z.ZodString, z.ZodNumber>;
        minimumOrderQuantities: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, z.core.$strip>;
    qualityRequirements: z.ZodObject<{
        shelfLife: z.ZodOptional<z.ZodNumber>;
        storageConditions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        handlingRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const LogisticsOptimizationSchema: z.ZodObject<{
    deliveryDate: z.ZodString;
    region: z.ZodString;
    deliveries: z.ZodArray<z.ZodObject<{
        orderId: z.ZodString;
        schoolId: z.ZodString;
        location: z.ZodObject<{
            address: z.ZodString;
            coordinates: z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, z.core.$strip>;
            accessInstructions: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        timeWindow: z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
            flexibility: z.ZodNumber;
        }, z.core.$strip>;
        items: z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            quantity: z.ZodNumber;
            weight: z.ZodNumber;
            volume: z.ZodNumber;
            specialHandling: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        priority: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>;
        contactInfo: z.ZodObject<{
            primary: z.ZodString;
            backup: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    vehicleConstraints: z.ZodObject<{
        maxWeight: z.ZodNumber;
        maxVolume: z.ZodNumber;
        maxDeliveries: z.ZodNumber;
        specialCapabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    optimizationObjectives: z.ZodObject<{
        minimizeCost: z.ZodNumber;
        minimizeTime: z.ZodNumber;
        minimizeDistance: z.ZodNumber;
        maximizeEfficiency: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const QualityControlConfigSchema: z.ZodObject<{
    inspectionId: z.ZodString;
    orderId: z.ZodString;
    vendorId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        batchNumber: z.ZodOptional<z.ZodString>;
        expiryDate: z.ZodOptional<z.ZodString>;
        qualityStandards: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    inspectionType: z.ZodEnum<{
        hybrid: "hybrid";
        automated: "automated";
        visual: "visual";
        laboratory: "laboratory";
    }>;
    qualityChecks: z.ZodArray<z.ZodObject<{
        checkType: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        acceptanceCriteria: z.ZodObject<{
            minValue: z.ZodOptional<z.ZodNumber>;
            maxValue: z.ZodOptional<z.ZodNumber>;
            allowedValues: z.ZodOptional<z.ZodArray<z.ZodString>>;
            tolerance: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
        automationEnabled: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    samplingStrategy: z.ZodObject<{
        samplingMethod: z.ZodEnum<{
            random: "random";
            systematic: "systematic";
            stratified: "stratified";
            cluster: "cluster";
        }>;
        sampleSize: z.ZodNumber;
        confidence: z.ZodNumber;
    }, z.core.$strip>;
    documentation: z.ZodObject<{
        photographyRequired: z.ZodDefault<z.ZodBoolean>;
        videoRequired: z.ZodDefault<z.ZodBoolean>;
        reportTemplate: z.ZodString;
        certificationRequired: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const SustainabilityTrackingSchema: z.ZodObject<{
    trackingId: z.ZodString;
    orderId: z.ZodString;
    vendorId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        quantity: z.ZodNumber;
        sourceLocation: z.ZodString;
        transportMethod: z.ZodString;
        packagingType: z.ZodString;
    }, z.core.$strip>>;
    carbonFootprint: z.ZodObject<{
        production: z.ZodNumber;
        transportation: z.ZodNumber;
        packaging: z.ZodNumber;
        total: z.ZodNumber;
        offsetCredits: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    sustainability: z.ZodObject<{
        organicCertified: z.ZodBoolean;
        locallySourced: z.ZodBoolean;
        fairTrade: z.ZodBoolean;
        sustainablePackaging: z.ZodBoolean;
        renewableEnergy: z.ZodBoolean;
    }, z.core.$strip>;
    wasteMetrics: z.ZodObject<{
        packagingWaste: z.ZodNumber;
        foodWaste: z.ZodNumber;
        recyclablePercentage: z.ZodNumber;
        compostablePercentage: z.ZodNumber;
    }, z.core.$strip>;
    socialImpact: z.ZodObject<{
        localJobs: z.ZodNumber;
        communityBenefit: z.ZodOptional<z.ZodString>;
        supplierDiversity: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
type OrderOrchestrationConfig = z.infer<typeof OrderOrchestrationConfigSchema>;
type InventoryManagementConfig = z.infer<typeof InventoryManagementConfigSchema>;
type LogisticsOptimization = z.infer<typeof LogisticsOptimizationSchema>;
type QualityControlConfig = z.infer<typeof QualityControlConfigSchema>;
type SustainabilityTracking = z.infer<typeof SustainabilityTrackingSchema>;
export declare class SupplyChainAutomationService extends EventEmitter {
    private db;
    private cache;
    private notifications;
    private vendorIntelligence;
    private aiModels;
    private automationConfig;
    constructor(db: DatabaseService, cache: CacheService, notifications: NotificationService, vendorIntelligence: VendorIntelligenceService);
    orchestrateOrder(config: OrderOrchestrationConfig): Promise<{
        orchestrationId: string;
        vendorAssignments: Array<{
            vendorId: string;
            items: OrderOrchestrationConfig['items'];
            estimatedDelivery: string;
            cost: number;
            qualityScore: number;
        }>;
        timeline: {
            orderProcessing: string;
            procurement: string;
            qualityControl: string;
            logistics: string;
            delivery: string;
        };
        riskAssessment: {
            overallRisk: string;
            riskFactors: string[];
            mitigationStrategies: string[];
        };
        sustainabilityImpact: {
            carbonFootprint: number;
            sustainabilityScore: number;
            recommendations: string[];
        };
    }>;
    private optimizeVendorAssignments;
    manageInventory(config: InventoryManagementConfig): Promise<{
        recommendations: Array<{
            action: 'reorder' | 'reduce' | 'maintain' | 'urgent_reorder';
            quantity: number;
            reasoning: string;
            urgency: string;
            estimatedCost: number;
        }>;
        forecast: {
            demandPrediction: number[];
            stockoutRisk: number;
            excessStockRisk: number;
            optimalOrderQuantity: number;
            optimalOrderTiming: string;
        };
        automation: {
            autoReorderTriggered: boolean;
            reorderQuantity?: number;
            selectedVendor?: string;
            estimatedDelivery?: string;
        };
    }>;
    private predictInventoryDemand;
    optimizeLogistics(config: LogisticsOptimization): Promise<{
        optimizedRoutes: Array<{
            routeId: string;
            deliveries: LogisticsOptimization['deliveries'];
            totalDistance: number;
            totalTime: number;
            estimatedCost: number;
            efficiency: number;
        }>;
        trackingInfo: {
            trackingEnabled: boolean;
            realTimeUpdates: boolean;
            estimatedDeliveryTimes: Record<string, string>;
        };
        costSavings: {
            originalCost: number;
            optimizedCost: number;
            savings: number;
            savingsPercentage: number;
        };
        environmentalImpact: {
            carbonReduction: number;
            fuelSavings: number;
            efficiencyGain: number;
        };
    }>;
    private optimizeDeliveryRoutes;
    automateQualityControl(config: QualityControlConfig): Promise<{
        inspectionResults: {
            overallScore: number;
            passedChecks: number;
            failedChecks: number;
            warningChecks: number;
            detailedResults: Array<{
                checkType: string;
                result: 'pass' | 'fail' | 'warning';
                score: number;
                details: Record<string, unknown>;
                automation: boolean;
            }>;
        };
        automation: {
            automatedChecks: number;
            humanReviewRequired: number;
            confidence: number;
            recommendedAction: 'approve' | 'reject' | 'review';
        };
        documentation: {
            images: string[];
            videos: string[];
            certificates: string[];
            reports: string[];
        };
        recommendations: string[];
    }>;
    private performAutomatedVisualInspection;
    trackSustainability(config: SustainabilityTracking): Promise<{
        carbonFootprint: {
            breakdown: {
                production: number;
                transportation: number;
                packaging: number;
                total: number;
            };
            comparison: {
                industryAverage: number;
                bestPractice: number;
                improvement: number;
            };
            offsetOptions: Array<{
                provider: string;
                cost: number;
                method: string;
                impact: number;
            }>;
        };
        sustainabilityScore: {
            overall: number;
            categories: {
                sourcing: number;
                production: number;
                transportation: number;
                packaging: number;
                waste: number;
            };
            certification: {
                organic: boolean;
                fairTrade: boolean;
                carbonNeutral: boolean;
                sustainable: boolean;
            };
        };
        recommendations: {
            immediate: string[];
            shortTerm: string[];
            longTerm: string[];
            costImpact: Record<string, number>;
        };
        automation: {
            offsetPurchased: boolean;
            reportGenerated: boolean;
            stakeholdersNotified: boolean;
        };
    }>;
    private initializeAutomation;
    private groupItemsByOptimizationCriteria;
    private findSuitableVendors;
    private selectOptimalVendor;
    private calculateVendorScore;
    private calculatePriceCompetitiveness;
    private getItemCategory;
    private areItemsSimilar;
    private getMarketAveragePrice;
    private getVendorPrice;
    private calculateTotalCost;
    private calculateEstimatedDelivery;
    private runInventoryAutomation;
    private runQualityAutomation;
    private runDeliveryAutomation;
    private runSustainabilityAutomation;
    private createProcurementTimeline;
    private assessOrderRisks;
    private calculateSustainabilityImpact;
    private initializeOrderTracking;
    private setupAutomatedQualityControl;
    private setupLogisticsOptimization;
    private storeOrderOrchestration;
    private getHistoricalDemandData;
    private getExternalDemandFactors;
    private applyLSTMDemandModel;
    private calculateStockoutRisk;
    private calculateExcessStockRisk;
    private calculateOptimalInventoryLevels;
    private generateInventoryRecommendations;
    private checkAutomatedReordering;
    private updateInventoryAnalytics;
    private getRealTimeTrafficData;
    private getHistoricalDeliveryData;
    private applyGeneticAlgorithmOptimization;
    private setupDeliveryTracking;
    private calculateLogisticsCostSavings;
    private assessLogisticsEnvironmentalImpact;
    private initializeDeliveryMonitoring;
    private captureInspectionImages;
    private analyzeDefects;
    private assessFreshness;
    private classifySize;
    private calculateVisualScore;
    private runAutomatedQualityChecks;
    private generateInspectionDocumentation;
    private calculateInspectionResults;
    private assessAutomationConfidence;
    private generateQualityRecommendations;
    private storeQualityInspectionResults;
    private calculateDetailedCarbonFootprint;
    private assessSustainabilityScore;
    private generateSustainabilityRecommendations;
    private executeAutomatedSustainabilityActions;
    private updateSustainabilityAnalytics;
}
export default SupplyChainAutomationService;
//# sourceMappingURL=supply-chain-automation.service.d.ts.map