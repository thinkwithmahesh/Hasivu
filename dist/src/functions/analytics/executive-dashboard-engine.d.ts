import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
interface ExecutiveKPI {
    kpiId: string;
    name: string;
    category: 'financial' | 'operational' | 'strategic' | 'risk' | 'growth';
    value: number;
    unit: string;
    trend: {
        direction: 'up' | 'down' | 'stable' | 'volatile';
        percentage: number;
        period: string;
        significance: 'strong' | 'moderate' | 'weak';
    };
    benchmark: {
        target: number;
        industry: number;
        previousPeriod: number;
    };
    status: 'excellent' | 'good' | 'warning' | 'critical';
    lastUpdated: Date;
    dataQuality: number;
}
interface ExecutiveDashboard {
    dashboardId: string;
    dashboardType: string;
    generatedAt: Date;
    timeframe: string;
    executiveSummary: {
        overallHealthScore: number;
        keyAchievements: string[];
        criticalAlerts: string[];
        strategicOpportunities: string[];
        immediateActions: string[];
    };
    kpis: ExecutiveKPI[];
    financialMetrics: {
        revenue: {
            current: number;
            growth: number;
            forecast: number;
            target: number;
            recurringRevenue: number;
            newRevenue: number;
        };
        profitability: {
            grossMargin: number;
            operatingMargin: number;
            netMargin: number;
            ebitda: number;
            customerLifetimeValue: number;
            customerAcquisitionCost: number;
        };
        cashFlow: {
            operating: number;
            free: number;
            runway: number;
            burnRate: number;
            collectionsEfficiency: number;
        };
        costs: {
            total: number;
            perStudent: number;
            variableCostRatio: number;
            fixedCosts: number;
            costTrends: Array<{
                category: string;
                trend: number;
            }>;
        };
    };
    operationalMetrics: {
        scale: {
            schoolsServed: number;
            studentsServed: number;
            mealsServed: number;
            serviceUptime: number;
            marketPenetration: number;
        };
        efficiency: {
            orderFulfillmentRate: number;
            averageDeliveryTime: number;
            customerSatisfactionScore: number;
            staffProductivity: number;
            systemReliability: number;
        };
        quality: {
            nutritionalCompliance: number;
            safetyIncidents: number;
            customerComplaints: number;
            positiveReviews: number;
            qualityCertifications: number;
        };
    };
    strategicMetrics: {
        growth: {
            marketShareGrowth: number;
            customerRetentionRate: number;
            newMarketExpansion: number;
            productInnovationIndex: number;
            competitivePosition: number;
        };
        innovation: {
            technologyAdoptionRate: number;
            digitalTransformationScore: number;
            aiMlImplementation: number;
            processAutomation: number;
            dataDrivenDecisions: number;
        };
        sustainability: {
            environmentalImpactScore: number;
            socialImpactMetrics: number;
            governanceRating: number;
            sustainabilityInitiatives: number;
        };
    };
    riskMetrics: {
        operational: {
            systemDowntime: number;
            supplyChainRisk: number;
            staffTurnover: number;
            complianceViolations: number;
            securityIncidents: number;
        };
        financial: {
            customerConcentrationRisk: number;
            creditRisk: number;
            liquidityRisk: number;
            marketRisk: number;
            operationalLeverage: number;
        };
        strategic: {
            competitiveThreats: number;
            regulatoryChanges: number;
            technologyDisruption: number;
            marketShifts: number;
        };
    };
    forecasts: {
        revenue: Array<{
            period: string;
            predicted: number;
            confidence: number;
            scenario: 'conservative' | 'likely' | 'optimistic';
        }>;
        growth: Array<{
            metric: string;
            currentValue: number;
            projected: number;
            timeframe: string;
        }>;
        risks: Array<{
            risk: string;
            probability: number;
            impact: number;
            timeline: string;
        }>;
    };
    benchmarking: {
        industryComparison: Array<{
            metric: string;
            ourValue: number;
            industryMedian: number;
            industryTop10: number;
            percentileRank: number;
        }>;
        competitorAnalysis: Array<{
            competitor: string;
            marketShare: number;
            strengthAreas: string[];
            weaknessAreas: string[];
            competitiveGaps: string[];
        }>;
    };
    actionItems: Array<{
        priority: 'critical' | 'high' | 'medium' | 'low';
        category: string;
        description: string;
        owner: string;
        dueDate: Date;
        impact: string;
        effort: 'low' | 'medium' | 'high';
        status: 'pending' | 'in_progress' | 'completed';
    }>;
}
interface ExecutiveAlert {
    alertId: string;
    type: 'performance' | 'financial' | 'operational' | 'strategic' | 'risk';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    urgency: 'immediate' | 'today' | 'this_week' | 'this_month';
    affectedKPIs: string[];
    recommendedActions: string[];
    escalationPath: string[];
    createdAt: Date;
    resolvedAt?: Date;
    status: 'active' | 'acknowledged' | 'investigating' | 'resolved';
}
interface BoardReport {
    reportId: string;
    reportType: string;
    generatedAt: Date;
    period: {
        startDate: Date;
        endDate: Date;
        quarter?: string;
        year: number;
    };
    executiveSummary: {
        keyHighlights: string[];
        majorChallenges: string[];
        strategicProgress: string[];
        financialPerformance: string;
        operationalExcellence: string;
        futureOutlook: string;
    };
    financialOverview: {
        revenueGrowth: number;
        profitabilityTrend: number;
        cashPosition: number;
        keyMetrics: Array<{
            name: string;
            current: number;
            target: number;
            variance: number;
        }>;
    };
    strategicInitiatives: Array<{
        initiative: string;
        status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
        progress: number;
        impact: string;
        nextMilestones: string[];
        budget: {
            allocated: number;
            spent: number;
            remaining: number;
        };
    }>;
    riskAssessment: {
        topRisks: Array<{
            risk: string;
            probability: number;
            impact: number;
            mitigation: string;
            status: string;
        }>;
        riskTrend: 'improving' | 'stable' | 'deteriorating';
        overallRiskScore: number;
    };
    marketPosition: {
        marketShare: number;
        competitiveAdvantages: string[];
        marketTrends: string[];
        customerSatisfaction: number;
        brandStrength: number;
    };
    operationalHighlights: {
        efficiency: number;
        quality: number;
        innovation: number;
        sustainability: number;
        employeeEngagement: number;
    };
    futureStrategy: {
        strategicPriorities: string[];
        investmentAreas: string[];
        expectedOutcomes: string[];
        timeline: string;
    };
    appendices: {
        detailedFinancials: any;
        operationalMetrics: any;
        riskRegister: any;
        competitorAnalysis: any;
    };
}
declare class ExecutiveDashboardEngine {
    private logger;
    private database;
    private kpiCache;
    private alertsCache;
    private reportsCache;
    constructor();
    generateExecutiveDashboard(dashboardType: string, timeframe: string, includeForecasts?: boolean, includeComparisons?: boolean, metrics?: string[]): Promise<ExecutiveDashboard>;
    private calculateKPIs;
    private calculateFinancialMetrics;
    private calculateOperationalMetrics;
    private calculateStrategicMetrics;
    private calculateRiskMetrics;
    private generateForecasts;
    private generateBenchmarking;
    private generateExecutiveSummary;
    private generateActionItems;
    generateExecutiveAlerts(alertLevel?: string, timeframe?: string): Promise<ExecutiveAlert[]>;
    generateBoardReport(reportType: string): Promise<BoardReport>;
    private getDateRange;
    private getPreviousPeriodRevenue;
    private calculateCustomerRetention;
    private generateCFOKPIs;
    private generateCOOKPIs;
    private generateCTOKPIs;
    private getActionOwner;
}
declare const executiveDashboardEngine: ExecutiveDashboardEngine;
export declare const executiveDashboardHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export { ExecutiveDashboardEngine, executiveDashboardEngine };
//# sourceMappingURL=executive-dashboard-engine.d.ts.map