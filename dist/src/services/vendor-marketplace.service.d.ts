export interface VendorSearchCriteria {
    schoolId: string;
    categoryId: string;
    itemType: string;
    quantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    budget: {
        min: number;
        max: number;
        currency: string;
    };
    qualitySpecs: {
        certifications?: string[];
        standards?: string[];
        customRequirements?: string;
    };
    deliveryRequirements: {
        location: string;
        preferredDate: string;
        maxDeliveryTime: number;
        specialHandling?: string[];
    };
    sustainabilityRequirements: {
        organicRequired: boolean;
        localPreferred: boolean;
        carbonFootprintLimit?: number;
        packagingRequirements?: string[];
    };
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    diversificationRequired: boolean;
}
export interface VendorMatchResult {
    vendorId: string;
    vendorName: string;
    matchScore: number;
    priceEstimate: number;
    deliveryTime: number;
    qualityRating: number;
    sustainabilityScore: number;
    riskScore: number;
    capabilities: string[];
    certifications: string[];
    location: {
        address: string;
        distance: number;
    };
    businessMetrics: {
        onTimeDelivery: number;
        qualityScore: number;
        customerSatisfaction: number;
        priceCompetitiveness: number;
    };
}
export interface RFPConfig {
    schoolId: string;
    procurementId: string;
    template: 'standard' | 'food_service' | 'equipment' | 'services' | 'maintenance';
    urgency: 'standard' | 'expedited' | 'emergency';
    evaluationCriteria: {
        price_weight: number;
        quality_weight: number;
        delivery_weight: number;
        sustainability_weight: number;
        innovation_weight: number;
    };
    customRequirements?: string[];
    complianceRequirements?: string[];
}
export interface OrderConfig {
    orderId: string;
    schoolId: string;
    orderType: 'standard' | 'urgent' | 'bulk' | 'special';
    items: Array<{
        itemId: string;
        quantity: number;
        specifications?: Record<string, unknown>;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        qualityRequirements?: string[];
    }>;
    deliveryRequirements: {
        location: string;
        preferredDate: string;
        timeWindow: {
            start: string;
            end: string;
        };
        specialInstructions?: string;
        contactPerson: string;
        alternateContacts?: string[];
    };
    budgetConstraints: {
        maxBudget: number;
        currency: string;
        paymentTerms?: string;
    };
    qualityStandards: {
        inspectionRequired: boolean;
        certificationRequirements?: string[];
        customQualityChecks?: string[];
    };
    sustainabilityRequirements: {
        carbonFootprintLimit?: number;
        localSourcingPreferred: boolean;
        organicRequired: boolean;
        packagingRequirements?: string[];
    };
}
export declare class VendorMarketplaceService {
    private db;
    private cache;
    private notifications;
    constructor();
    searchAndMatchVendors(criteria: VendorSearchCriteria, userId: string): Promise<{
        vendors: VendorMatchResult[];
        searchMetadata: {
            totalVendors: number;
            searchTime: number;
            algorithm: string;
            filtersApplied: string[];
        };
    }>;
    generateRFP(config: RFPConfig, criteria: VendorSearchCriteria, userId: string): Promise<{
        rfpDocument: {
            id: string;
            title: string;
            sections: Array<{
                title: string;
                content: string;
                requirements: string[];
            }>;
            timeline: {
                issueDate: string;
                submissionDeadline: string;
                evaluationPeriod: string;
                awardDate: string;
            };
            evaluationCriteria: Record<string, number>;
        };
        metadata: {
            template: string;
            generationTime: number;
            aiAssisted: boolean;
        };
    }>;
    placeOrder(orderConfig: OrderConfig, userId: string): Promise<{
        orderId: string;
        status: string;
        timeline: {
            orderPlaced: string;
            estimatedDelivery: string;
            trackingAvailable: boolean;
        };
        vendors: Array<{
            vendorId: string;
            items: string[];
            estimatedDelivery: string;
        }>;
    }>;
    getVendorProfile(vendorId: string, analysisType?: 'basic' | 'comprehensive' | 'risk_assessment'): Promise<{
        vendor: {
            id: string;
            name: string;
            category: string[];
            location: {
                address: string;
                coordinates: {
                    lat: number;
                    lng: number;
                };
            };
            contact: {
                primaryContact: string;
                phone: string;
                email: string;
            };
            businessInfo: {
                established: string;
                employees: number;
                annualRevenue: number;
                certifications: string[];
            };
        };
        analytics: {
            performanceMetrics: {
                onTimeDelivery: number;
                qualityScore: number;
                customerSatisfaction: number;
                priceCompetitiveness: number;
            };
            riskAssessment: {
                overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
                factors: Array<{
                    category: string;
                    risk: string;
                    impact: string;
                    mitigation: string;
                }>;
            };
            sustainabilityMetrics: {
                carbonFootprint: number;
                sustainabilityRating: number;
                certifications: string[];
            };
            financialHealth: {
                creditRating: string;
                paymentHistory: number;
                businessStability: number;
            };
        };
    }>;
    getAnalyticsDashboard(filters: {
        timeframe: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
        metrics?: string[];
        vendorIds?: string[];
        categories?: string[];
        startDate?: string;
        endDate?: string;
    }): Promise<{
        widgets: Array<{
            id: string;
            type: string;
            title: string;
            data: unknown;
            lastUpdated: string;
        }>;
        metrics: {
            totalOrders: number;
            totalValue: number;
            averageDeliveryTime: number;
            qualityScore: number;
            vendorPerformance: number;
            sustainabilityScore: number;
        };
    }>;
    private findMatchingVendors;
    private rankVendorsByMatchScore;
    private calculateMatchScore;
    private calculatePriceScore;
    private calculateDeliveryScore;
    private calculateDistance;
    private deg2rad;
    private getAppliedFilters;
    private assessVendorRisks;
    private applyDiversificationFilter;
    private logVendorSearch;
    private loadRFPTemplate;
    private generateRFPSections;
    private calculateRFPTimeline;
    private storeRFP;
    private validateOrderConfig;
    private checkInventoryAvailability;
    private optimizeVendorAssignment;
    private findBestVendorsForItem;
    private createOrderRecord;
    private initializeOrderTracking;
    private notifyVendorsOfNewOrder;
    private calculateEstimatedDelivery;
    private getVendorById;
    private getBasicVendorAnalytics;
    private getRiskAssessmentAnalytics;
    private getComprehensiveVendorAnalytics;
    private getPerformanceMetrics;
    private assessVendorRisk;
    private getSustainabilityMetrics;
    private getFinancialHealth;
    private calculateTimeRange;
    private getCoreMetrics;
    private generateDashboardWidgets;
    private estimatePrice;
    private estimateDeliveryTime;
    getRFPById(rfpId: string, schoolId?: string): Promise<Record<string, unknown>>;
    getRFPSubmissions(rfpId: string): Promise<Record<string, unknown>[]>;
    processQualityInspection(inspectionConfig: Record<string, unknown>, userId: string): Promise<{
        inspectionId: string;
        results: Array<{
            itemId: string;
            passed: boolean;
            score: number;
            issues: string[];
            recommendations: string[];
        }>;
        overallQuality: {
            score: number;
            grade: string;
            certification: boolean;
        };
    }>;
    trackSustainabilityMetrics(sustainabilityData: Record<string, unknown>, userId: string): Promise<{
        trackingId: string;
        carbonFootprint: {
            total: number;
            breakdown: Record<string, number>;
            offsetCredits: number;
            netImpact: number;
        };
        sustainabilityScore: number;
        certifications: string[];
        recommendations: string[];
    }>;
    private inspectItem;
    private performQualityCheck;
    private getQualityGrade;
    private calculateSustainabilityScore;
    private generateSustainabilityRecommendations;
    getOrderById(orderId: string): Promise<Record<string, unknown>>;
    getOrderTracking(orderId: string, _userId: string): Promise<{
        orderId: string;
        status: string;
        timeline: Array<{
            stage: string;
            status: 'completed' | 'in_progress' | 'pending';
            timestamp?: Date;
            details: string;
        }>;
        vendors: Array<{
            vendorId: string;
            name: string;
            status: string;
            items: Array<{
                itemId: string;
                name: string;
                quantity: number;
                status: string;
                tracking?: {
                    trackingNumber: string;
                    carrier: string;
                    estimatedDelivery: Date;
                    currentLocation: string;
                };
            }>;
        }>;
        deliveryInfo: {
            estimatedDelivery: Date;
            deliveryAddress: string;
            specialInstructions?: string;
        };
    }>;
}
//# sourceMappingURL=vendor-marketplace.service.d.ts.map