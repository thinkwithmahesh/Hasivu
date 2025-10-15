/// <reference types="node" />
import { z } from 'zod';
import { DatabaseService } from '../database.service';
import { CacheService } from '../cache.service';
import { NotificationService } from '../notification.service';
import { EventEmitter } from 'events';
declare const VendorProfileSchema: z.ZodObject<{
    vendorId: z.ZodString;
    basicInfo: z.ZodObject<{
        name: z.ZodString;
        registrationNumber: z.ZodString;
        taxId: z.ZodString;
        businessType: z.ZodEnum<{
            corporation: "corporation";
            llc: "llc";
            partnership: "partnership";
            sole_proprietorship: "sole_proprietorship";
        }>;
        establishedDate: z.ZodString;
        yearsInBusiness: z.ZodNumber;
        headquarters: z.ZodString;
        serviceAreas: z.ZodArray<z.ZodString>;
        website: z.ZodOptional<z.ZodString>;
        contactInfo: z.ZodObject<{
            primaryContact: z.ZodString;
            email: z.ZodString;
            phone: z.ZodString;
            emergencyContact: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    capabilities: z.ZodObject<{
        categories: z.ZodArray<z.ZodString>;
        specializations: z.ZodArray<z.ZodString>;
        capacity: z.ZodObject<{
            dailyVolume: z.ZodNumber;
            monthlyVolume: z.ZodNumber;
            peakCapacity: z.ZodNumber;
            scalabilityFactor: z.ZodNumber;
        }, z.core.$strip>;
        certifications: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            issuedBy: z.ZodString;
            validUntil: z.ZodString;
            status: z.ZodEnum<{
                active: "active";
                expired: "expired";
                pending: "pending";
            }>;
        }, z.core.$strip>>;
        qualityStandards: z.ZodArray<z.ZodString>;
        technologyStack: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    performance: z.ZodObject<{
        overallScore: z.ZodNumber;
        metrics: z.ZodObject<{
            qualityScore: z.ZodNumber;
            deliveryReliability: z.ZodNumber;
            communicationScore: z.ZodNumber;
            innovationScore: z.ZodNumber;
            sustainabilityScore: z.ZodNumber;
            complianceScore: z.ZodNumber;
        }, z.core.$strip>;
        trends: z.ZodObject<{
            overall: z.ZodEnum<{
                stable: "stable";
                improving: "improving";
                declining: "declining";
            }>;
            periods: z.ZodArray<z.ZodObject<{
                period: z.ZodString;
                score: z.ZodNumber;
                trend: z.ZodEnum<{
                    up: "up";
                    down: "down";
                    stable: "stable";
                }>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    financialHealth: z.ZodObject<{
        creditRating: z.ZodEnum<{
            A: "A";
            B: "B";
            C: "C";
            D: "D";
            AAA: "AAA";
            AA: "AA";
            BBB: "BBB";
            BB: "BB";
            CCC: "CCC";
            CC: "CC";
        }>;
        financialStability: z.ZodEnum<{
            critical: "critical";
            poor: "poor";
            excellent: "excellent";
            good: "good";
            fair: "fair";
        }>;
        riskLevel: z.ZodEnum<{
            high: "high";
            low: "low";
            medium: "medium";
            critical: "critical";
        }>;
        cashFlow: z.ZodObject<{
            status: z.ZodEnum<{
                positive: "positive";
                negative: "negative";
                volatile: "volatile";
            }>;
            trend: z.ZodEnum<{
                stable: "stable";
                improving: "improving";
                declining: "declining";
            }>;
            score: z.ZodNumber;
        }, z.core.$strip>;
        debtToEquityRatio: z.ZodOptional<z.ZodNumber>;
        liquidityRatio: z.ZodOptional<z.ZodNumber>;
        paymentHistory: z.ZodObject<{
            averagePaymentDays: z.ZodNumber;
            latePaymentRate: z.ZodNumber;
            disputeRate: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    compliance: z.ZodObject<{
        status: z.ZodEnum<{
            critical: "critical";
            compliant: "compliant";
            minor_issues: "minor_issues";
            major_issues: "major_issues";
        }>;
        regulations: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodEnum<{
                pending: "pending";
                compliant: "compliant";
                non_compliant: "non_compliant";
            }>;
            lastAuditDate: z.ZodString;
            nextAuditDate: z.ZodString;
            issues: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
        certificationStatus: z.ZodObject<{
            current: z.ZodNumber;
            expired: z.ZodNumber;
            pending: z.ZodNumber;
        }, z.core.$strip>;
        riskAssessment: z.ZodObject<{
            score: z.ZodNumber;
            factors: z.ZodArray<z.ZodString>;
            recommendations: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    marketPosition: z.ZodObject<{
        competitiveRanking: z.ZodNumber;
        marketShare: z.ZodNumber;
        uniqueSellingPoints: z.ZodArray<z.ZodString>;
        competitorComparison: z.ZodArray<z.ZodObject<{
            competitorId: z.ZodString;
            strengthComparison: z.ZodRecord<z.ZodString, z.ZodNumber>;
            recommendedStrategy: z.ZodString;
        }, z.core.$strip>>;
        pricingPosition: z.ZodEnum<{
            discount: "discount";
            premium: "premium";
            budget: "budget";
            competitive: "competitive";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
declare const VendorAnalyticsSchema: z.ZodObject<{
    vendorId: z.ZodString;
    period: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
        quarterly: "quarterly";
    }>;
    metrics: z.ZodObject<{
        orders: z.ZodObject<{
            total: z.ZodNumber;
            completed: z.ZodNumber;
            cancelled: z.ZodNumber;
            averageValue: z.ZodNumber;
            totalValue: z.ZodNumber;
        }, z.core.$strip>;
        performance: z.ZodObject<{
            onTimeDelivery: z.ZodNumber;
            qualityScore: z.ZodNumber;
            customerSatisfaction: z.ZodNumber;
            issueResolutionTime: z.ZodNumber;
        }, z.core.$strip>;
        financial: z.ZodObject<{
            revenue: z.ZodNumber;
            profitability: z.ZodNumber;
            paymentSpeed: z.ZodNumber;
            costEfficiency: z.ZodNumber;
        }, z.core.$strip>;
        sustainability: z.ZodObject<{
            carbonFootprint: z.ZodNumber;
            wasteReduction: z.ZodNumber;
            localSourcing: z.ZodNumber;
            sustainablePractices: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
    comparisons: z.ZodObject<{
        industryAverage: z.ZodRecord<z.ZodString, z.ZodNumber>;
        previousPeriod: z.ZodRecord<z.ZodString, z.ZodNumber>;
        topPerformers: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, z.core.$strip>;
    insights: z.ZodObject<{
        strengths: z.ZodArray<z.ZodString>;
        improvements: z.ZodArray<z.ZodString>;
        opportunities: z.ZodArray<z.ZodString>;
        risks: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
type VendorProfile = z.infer<typeof VendorProfileSchema>;
type VendorAnalytics = z.infer<typeof VendorAnalyticsSchema>;
export declare class VendorIntelligenceService extends EventEmitter {
    private db;
    private cache;
    private notifications;
    private monitoringConfig;
    constructor(db: DatabaseService, cache: CacheService, notifications: NotificationService);
    getVendorProfile(vendorId: string): Promise<VendorProfile>;
    updateVendorProfile(vendorId: string, updates: Partial<VendorProfile>): Promise<VendorProfile>;
    getVendorAnalytics(vendorId: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly', startDate?: string, endDate?: string): Promise<VendorAnalytics>;
    private initializeMonitoring;
    private monitorVendorPerformance;
    private monitorFinancialHealth;
    private monitorCompliance;
    private createAlert;
    private getVendorBasicInfo;
    private getVendorCapabilities;
    private calculatePerformanceMetrics;
    private assessFinancialHealth;
    private assessComplianceStatus;
    private analyzeMarketPosition;
    private getActiveVendors;
    private getRecentPerformanceMetrics;
    private getPerformanceTrends;
    private calculateFinancialRiskScore;
    private generateRecommendedActions;
    private shouldEscalate;
    private storeAlert;
    private sendAlertNotifications;
    private getAlertRecipients;
    private getSeverityLevel;
    private storeVendorProfileUpdate;
    private checkAlertConditions;
    private calculatePeriodMetrics;
    private getComparisonData;
    private generateVendorInsights;
    private getVendorsForFinancialMonitoring;
    private getLatestFinancialData;
    private getVendorsForComplianceMonitoring;
    private getComplianceStatus;
    private getExpiredCertifications;
    private getCertificationsExpiringSoon;
    private updateCompetitiveAnalysis;
}
export default VendorIntelligenceService;
//# sourceMappingURL=vendor-intelligence.service.d.ts.map