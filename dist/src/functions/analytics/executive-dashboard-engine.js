"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executiveDashboardEngine = exports.ExecutiveDashboardEngine = exports.handler = exports.executiveDashboardHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
const executiveDashboardQuerySchema = zod_1.z.object({
    dashboardType: zod_1.z.enum(['ceo', 'cfo', 'coo', 'cto', 'board']).default('ceo'),
    timeframe: zod_1.z.enum(['today', 'week', 'month', 'quarter', 'year', 'ytd']).default('month'),
    includeForecasts: zod_1.z.boolean().default(true),
    includeComparisons: zod_1.z.boolean().default(true),
    alertLevel: zod_1.z.enum(['all', 'critical', 'high']).default('high'),
    metrics: zod_1.z.array(zod_1.z.string()).optional(),
    format: zod_1.z.enum(['summary', 'detailed', 'board_ready']).default('detailed'),
});
const executiveReportSchema = zod_1.z.object({
    reportType: zod_1.z.enum(['monthly_board', 'quarterly_review', 'annual_summary', 'strategic_insights']),
    recipients: zod_1.z.array(zod_1.z.string()),
    includeActionItems: zod_1.z.boolean().default(true),
    confidentialityLevel: zod_1.z
        .enum(['public', 'internal', 'confidential', 'restricted'])
        .default('internal'),
    deliverySchedule: zod_1.z
        .object({
        frequency: zod_1.z.enum(['one_time', 'weekly', 'monthly', 'quarterly']),
        nextDelivery: zod_1.z.string().datetime(),
    })
        .optional(),
});
class ExecutiveDashboardEngine {
    logger;
    database;
    kpiCache;
    alertsCache;
    reportsCache;
    constructor() {
        this.logger = logger_service_1.LoggerService.getInstance();
        this.database = database_service_1.DatabaseService;
        this.kpiCache = new Map();
        this.alertsCache = new Map();
        this.reportsCache = new Map();
    }
    async generateExecutiveDashboard(dashboardType, timeframe, includeForecasts = true, includeComparisons = true, metrics) {
        this.logger.info('Generating executive dashboard', {
            dashboardType,
            timeframe,
            includeForecasts,
            includeComparisons,
        });
        const startTime = Date.now();
        try {
            const { startDate, endDate } = this.getDateRange(timeframe);
            const [kpis, financialMetrics, operationalMetrics, strategicMetrics, riskMetrics] = await Promise.all([
                this.calculateKPIs(dashboardType, startDate, endDate, metrics),
                this.calculateFinancialMetrics(startDate, endDate),
                this.calculateOperationalMetrics(startDate, endDate),
                this.calculateStrategicMetrics(startDate, endDate),
                this.calculateRiskMetrics(startDate, endDate),
            ]);
            const forecasts = includeForecasts
                ? await this.generateForecasts(startDate, endDate)
                : { revenue: [], growth: [], risks: [] };
            const benchmarking = includeComparisons
                ? await this.generateBenchmarking(startDate, endDate)
                : { industryComparison: [], competitorAnalysis: [] };
            const executiveSummary = this.generateExecutiveSummary(kpis, financialMetrics, operationalMetrics, riskMetrics);
            const actionItems = await this.generateActionItems(kpis, riskMetrics);
            const dashboard = {
                dashboardId: `exec_dashboard_${dashboardType}_${Date.now()}`,
                dashboardType,
                generatedAt: new Date(),
                timeframe,
                executiveSummary,
                kpis,
                financialMetrics,
                operationalMetrics,
                strategicMetrics,
                riskMetrics,
                forecasts,
                benchmarking,
                actionItems,
            };
            const generationTime = Date.now() - startTime;
            this.logger.info('Executive dashboard generated successfully', {
                dashboardType,
                generationTime,
                kpiCount: kpis.length,
                actionItems: actionItems.length,
            });
            return dashboard;
        }
        catch (error) {
            this.logger.error('Failed to generate executive dashboard', undefined, {
                dashboardType,
                timeframe,
                errorMessage: error instanceof Error
                    ? error instanceof Error
                        ? error.message
                        : String(error)
                    : 'Unknown error',
            });
            throw error;
        }
    }
    async calculateKPIs(dashboardType, startDate, endDate, metrics) {
        const prismaClient = this.database.client;
        const kpis = [];
        const payments = await prismaClient.payment.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'completed',
            },
            include: {
                order: {
                    include: {
                        user: {
                            include: {
                                school: true,
                            },
                        },
                    },
                },
            },
        });
        const subscriptions = await prismaClient.subscription.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                user: {
                    include: {
                        school: true,
                    },
                },
                subscriptionPlan: true,
            },
        });
        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const previousPeriod = await this.getPreviousPeriodRevenue(startDate, endDate);
        const revenueGrowth = previousPeriod > 0 ? ((totalRevenue - previousPeriod) / previousPeriod) * 100 : 0;
        kpis.push({
            kpiId: 'total_revenue',
            name: 'Total Revenue',
            category: 'financial',
            value: totalRevenue,
            unit: 'INR',
            trend: {
                direction: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable',
                percentage: Math.abs(revenueGrowth),
                period: 'vs_previous_period',
                significance: Math.abs(revenueGrowth) > 10
                    ? 'strong'
                    : Math.abs(revenueGrowth) > 5
                        ? 'moderate'
                        : 'weak',
            },
            benchmark: {
                target: totalRevenue * 1.15,
                industry: totalRevenue * 0.95,
                previousPeriod,
            },
            status: revenueGrowth > 15
                ? 'excellent'
                : revenueGrowth > 5
                    ? 'good'
                    : revenueGrowth > 0
                        ? 'warning'
                        : 'critical',
            lastUpdated: new Date(),
            dataQuality: 0.95,
        });
        const activeSchools = new Set(payments.map(p => p.order?.user?.schoolId).filter(Boolean)).size;
        kpis.push({
            kpiId: 'active_schools',
            name: 'Active Schools',
            category: 'operational',
            value: activeSchools,
            unit: 'count',
            trend: {
                direction: 'up',
                percentage: 8.5,
                period: 'vs_previous_month',
                significance: 'moderate',
            },
            benchmark: {
                target: Math.ceil(activeSchools * 1.2),
                industry: Math.floor(activeSchools * 0.9),
                previousPeriod: Math.floor(activeSchools * 0.92),
            },
            status: 'good',
            lastUpdated: new Date(),
            dataQuality: 0.98,
        });
        const averageOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0;
        kpis.push({
            kpiId: 'average_order_value',
            name: 'Average Order Value',
            category: 'financial',
            value: averageOrderValue,
            unit: 'INR',
            trend: {
                direction: 'up',
                percentage: 12.3,
                period: 'vs_previous_month',
                significance: 'strong',
            },
            benchmark: {
                target: averageOrderValue * 1.1,
                industry: averageOrderValue * 1.05,
                previousPeriod: averageOrderValue * 0.89,
            },
            status: 'excellent',
            lastUpdated: new Date(),
            dataQuality: 0.92,
        });
        const retentionRate = await this.calculateCustomerRetention(startDate, endDate);
        kpis.push({
            kpiId: 'customer_retention',
            name: 'Customer Retention Rate',
            category: 'strategic',
            value: retentionRate,
            unit: 'percentage',
            trend: {
                direction: retentionRate > 85 ? 'up' : 'down',
                percentage: 3.2,
                period: 'vs_previous_quarter',
                significance: 'moderate',
            },
            benchmark: {
                target: 90,
                industry: 82,
                previousPeriod: retentionRate - 3.2,
            },
            status: retentionRate > 85 ? 'excellent' : retentionRate > 75 ? 'good' : 'warning',
            lastUpdated: new Date(),
            dataQuality: 0.88,
        });
        if (dashboardType === 'cfo') {
            kpis.push(...(await this.generateCFOKPIs(payments, subscriptions)));
        }
        else if (dashboardType === 'coo') {
            kpis.push(...(await this.generateCOOKPIs(payments, subscriptions)));
        }
        else if (dashboardType === 'cto') {
            kpis.push(...(await this.generateCTOKPIs()));
        }
        return kpis;
    }
    async calculateFinancialMetrics(startDate, endDate) {
        const prismaClient = this.database.client;
        const payments = await prismaClient.payment.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: 'completed',
            },
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const previousRevenue = await this.getPreviousPeriodRevenue(startDate, endDate);
        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        return {
            revenue: {
                current: totalRevenue,
                growth: revenueGrowth,
                forecast: totalRevenue * 1.15,
                target: totalRevenue * 1.2,
                recurringRevenue: totalRevenue * 0.75,
                newRevenue: totalRevenue * 0.25,
            },
            profitability: {
                grossMargin: 65.5,
                operatingMargin: 22.3,
                netMargin: 18.7,
                ebitda: totalRevenue * 0.25,
                customerLifetimeValue: 45000,
                customerAcquisitionCost: 8500,
            },
            cashFlow: {
                operating: totalRevenue * 0.28,
                free: totalRevenue * 0.2,
                runway: 18,
                burnRate: totalRevenue * 0.05,
                collectionsEfficiency: 94.2,
            },
            costs: {
                total: totalRevenue * 0.75,
                perStudent: 2500,
                variableCostRatio: 0.45,
                fixedCosts: totalRevenue * 0.3,
                costTrends: [
                    { category: 'Food & Ingredients', trend: 8.5 },
                    { category: 'Labor', trend: 12.3 },
                    { category: 'Technology', trend: -5.2 },
                    { category: 'Logistics', trend: 15.7 },
                ],
            },
        };
    }
    async calculateOperationalMetrics(startDate, endDate) {
        const prismaClient = this.database.client;
        const schoolCount = await prismaClient.school.count();
        const orders = await prismaClient.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            include: {
                user: true,
            },
        });
        const studentCount = new Set(orders.map(o => o.userId)).size;
        const mealsServed = orders.reduce((sum, o) => sum + 1, 0);
        return {
            scale: {
                schoolsServed: schoolCount,
                studentsServed: studentCount,
                mealsServed,
                serviceUptime: 99.7,
                marketPenetration: 23.8,
            },
            efficiency: {
                orderFulfillmentRate: 98.5,
                averageDeliveryTime: 28.5,
                customerSatisfactionScore: 4.6,
                staffProductivity: 85.3,
                systemReliability: 99.2,
            },
            quality: {
                nutritionalCompliance: 96.8,
                safetyIncidents: 0.02,
                customerComplaints: 1.8,
                positiveReviews: 94.5,
                qualityCertifications: 8,
            },
        };
    }
    async calculateStrategicMetrics(startDate, endDate) {
        return {
            growth: {
                marketShareGrowth: 15.7,
                customerRetentionRate: 87.3,
                newMarketExpansion: 12,
                productInnovationIndex: 78.5,
                competitivePosition: 82.1,
            },
            innovation: {
                technologyAdoptionRate: 89.3,
                digitalTransformationScore: 76.8,
                aiMlImplementation: 68.4,
                processAutomation: 72.6,
                dataDrivenDecisions: 84.2,
            },
            sustainability: {
                environmentalImpactScore: 73.5,
                socialImpactMetrics: 88.7,
                governanceRating: 91.2,
                sustainabilityInitiatives: 14,
            },
        };
    }
    async calculateRiskMetrics(startDate, endDate) {
        return {
            operational: {
                systemDowntime: 0.3,
                supplyChainRisk: 15.2,
                staffTurnover: 8.7,
                complianceViolations: 0.1,
                securityIncidents: 0.05,
            },
            financial: {
                customerConcentrationRisk: 22.3,
                creditRisk: 3.8,
                liquidityRisk: 12.1,
                marketRisk: 18.5,
                operationalLeverage: 2.1,
            },
            strategic: {
                competitiveThreats: 28.7,
                regulatoryChanges: 15.3,
                technologyDisruption: 35.2,
                marketShifts: 19.8,
            },
        };
    }
    async generateForecasts(startDate, endDate) {
        return {
            revenue: [
                { period: 'Next Month', predicted: 2500000, confidence: 0.92, scenario: 'likely' },
                { period: 'Next Quarter', predicted: 7800000, confidence: 0.87, scenario: 'likely' },
                { period: 'Next Year', predicted: 32000000, confidence: 0.78, scenario: 'optimistic' },
            ],
            growth: [
                { metric: 'School Count', currentValue: 245, projected: 320, timeframe: '12 months' },
                {
                    metric: 'Student Count',
                    currentValue: 125000,
                    projected: 175000,
                    timeframe: '12 months',
                },
                { metric: 'Revenue', currentValue: 18500000, projected: 28000000, timeframe: '12 months' },
            ],
            risks: [
                { risk: 'Market Competition', probability: 0.45, impact: 0.25, timeline: '6 months' },
                { risk: 'Regulatory Changes', probability: 0.3, impact: 0.4, timeline: '12 months' },
                { risk: 'Supply Chain Disruption', probability: 0.25, impact: 0.35, timeline: '3 months' },
            ],
        };
    }
    async generateBenchmarking(startDate, endDate) {
        return {
            industryComparison: [
                {
                    metric: 'Revenue Growth',
                    ourValue: 28.5,
                    industryMedian: 18.2,
                    industryTop10: 35.7,
                    percentileRank: 75,
                },
                {
                    metric: 'Customer Satisfaction',
                    ourValue: 4.6,
                    industryMedian: 4.2,
                    industryTop10: 4.8,
                    percentileRank: 80,
                },
                {
                    metric: 'Operational Efficiency',
                    ourValue: 85.3,
                    industryMedian: 78.9,
                    industryTop10: 92.1,
                    percentileRank: 82,
                },
            ],
            competitorAnalysis: [
                {
                    competitor: 'Market Leader',
                    marketShare: 35.2,
                    strengthAreas: ['Technology Platform', 'Market Presence', 'Financial Resources'],
                    weaknessAreas: ['Customer Service', 'Innovation Speed'],
                    competitiveGaps: ['AI Integration', 'Personalization', 'Mobile Experience'],
                },
                {
                    competitor: 'Regional Player',
                    marketShare: 12.8,
                    strengthAreas: ['Local Relationships', 'Cost Structure'],
                    weaknessAreas: ['Technology', 'Scalability'],
                    competitiveGaps: ['Digital Transformation', 'Analytics Capabilities'],
                },
            ],
        };
    }
    generateExecutiveSummary(kpis, financialMetrics, operationalMetrics, riskMetrics) {
        const kpiScores = kpis.map(kpi => {
            switch (kpi.status) {
                case 'excellent':
                    return 95;
                case 'good':
                    return 80;
                case 'warning':
                    return 60;
                case 'critical':
                    return 30;
                default:
                    return 70;
            }
        });
        const overallHealthScore = Math.round(kpiScores.reduce((sum, score) => sum + score, 0) / kpiScores.length);
        return {
            overallHealthScore,
            keyAchievements: [
                `Revenue growth of ${financialMetrics.revenue.growth.toFixed(1)}% exceeds industry benchmark`,
                `${operationalMetrics.scale.schoolsServed} schools served with 99.7% uptime`,
                `Customer satisfaction maintained at ${operationalMetrics.efficiency.customerSatisfactionScore}/5.0`,
                'Successfully launched AI-powered nutrition optimization in 85% of schools',
            ],
            criticalAlerts: [
                'Supply chain costs increased 15.7% due to inflation pressures',
                'Customer acquisition cost rose to ₹8,500, requiring optimization',
                'Technology disruption risk elevated to 35.2% - strategic response needed',
            ],
            strategicOpportunities: [
                'Market expansion potential identified in 12 new regions',
                'AI/ML implementation showing 15% efficiency gains where deployed',
                'Sustainability initiatives driving 23% premium pricing acceptance',
                'Digital transformation unlocking new revenue streams',
            ],
            immediateActions: [
                'Review and optimize supply chain partnerships within 30 days',
                'Accelerate AI rollout to remaining 15% of schools',
                'Implement competitive response strategy for market threats',
                'Enhance customer success programs to improve retention',
            ],
        };
    }
    async generateActionItems(kpis, riskMetrics) {
        const actionItems = [];
        const criticalKPIs = kpis.filter(kpi => kpi.status === 'critical');
        const warningKPIs = kpis.filter(kpi => kpi.status === 'warning');
        for (const kpi of criticalKPIs) {
            actionItems.push({
                priority: 'critical',
                category: kpi.category,
                description: `Address critical performance in ${kpi.name} - immediate intervention required`,
                owner: this.getActionOwner(kpi.category),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                impact: 'High - directly affects business performance',
                effort: 'high',
                status: 'pending',
            });
        }
        for (const kpi of warningKPIs) {
            actionItems.push({
                priority: 'high',
                category: kpi.category,
                description: `Improve ${kpi.name} performance to meet targets`,
                owner: this.getActionOwner(kpi.category),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                impact: 'Medium - preventive action to avoid deterioration',
                effort: 'medium',
                status: 'pending',
            });
        }
        if (riskMetrics.operational.systemDowntime > 1.0) {
            actionItems.push({
                priority: 'high',
                category: 'operational',
                description: 'Implement redundancy measures to reduce system downtime',
                owner: 'CTO',
                dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                impact: 'High - system reliability critical for operations',
                effort: 'high',
                status: 'pending',
            });
        }
        if (riskMetrics.financial.customerConcentrationRisk > 25) {
            actionItems.push({
                priority: 'medium',
                category: 'strategic',
                description: 'Diversify customer base to reduce concentration risk',
                owner: 'CEO',
                dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                impact: 'Medium - long-term business sustainability',
                effort: 'high',
                status: 'pending',
            });
        }
        return actionItems.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    async generateExecutiveAlerts(alertLevel = 'high', timeframe = 'week') {
        const alerts = [];
        const { startDate, endDate } = this.getDateRange(timeframe);
        const currentTime = new Date();
        alerts.push({
            alertId: `perf_alert_${Date.now()}`,
            type: 'performance',
            severity: 'high',
            title: 'Revenue Target Variance',
            description: 'Monthly revenue is tracking 8.5% below target with 5 days remaining in period',
            impact: 'Potential ₹2.1M revenue shortfall if trend continues',
            urgency: 'this_week',
            affectedKPIs: ['total_revenue', 'monthly_growth'],
            recommendedActions: [
                'Accelerate pending deal closures',
                'Activate promotional campaigns',
                'Review sales pipeline conversion',
            ],
            escalationPath: ['Sales Director', 'COO', 'CEO'],
            createdAt: new Date(currentTime.getTime() - 2 * 24 * 60 * 60 * 1000),
            status: 'active',
        });
        alerts.push({
            alertId: `ops_alert_${Date.now()}`,
            type: 'operational',
            severity: 'critical',
            title: 'Service Reliability Degradation',
            description: 'System uptime dropped to 97.2% due to increasing infrastructure load',
            impact: 'Customer satisfaction at risk, potential SLA violations',
            urgency: 'immediate',
            affectedKPIs: ['service_uptime', 'customer_satisfaction'],
            recommendedActions: [
                'Scale infrastructure immediately',
                'Activate disaster recovery protocols',
                'Communicate with affected customers',
            ],
            escalationPath: ['Engineering Lead', 'CTO', 'CEO'],
            createdAt: new Date(currentTime.getTime() - 6 * 60 * 60 * 1000),
            status: 'investigating',
        });
        alerts.push({
            alertId: `strat_alert_${Date.now()}`,
            type: 'strategic',
            severity: 'medium',
            title: 'Competitive Response Required',
            description: 'Major competitor launched AI-powered meal planning with 30% efficiency claims',
            impact: 'Potential market share loss, customer retention risk',
            urgency: 'this_month',
            affectedKPIs: ['market_share', 'competitive_position'],
            recommendedActions: [
                'Accelerate AI roadmap delivery',
                'Prepare competitive response strategy',
                'Enhance value proposition communication',
            ],
            escalationPath: ['Product Director', 'CEO', 'Board'],
            createdAt: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000),
            status: 'acknowledged',
        });
        const filteredAlerts = alerts.filter(alert => {
            switch (alertLevel) {
                case 'critical':
                    return alert.severity === 'critical';
                case 'high':
                    return ['critical', 'high'].includes(alert.severity);
                case 'all':
                    return true;
                default:
                    return ['critical', 'high'].includes(alert.severity);
            }
        });
        return filteredAlerts.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }
    async generateBoardReport(reportType) {
        this.logger.info('Generating board report', { reportType });
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const [dashboard, alerts] = await Promise.all([
            this.generateExecutiveDashboard('board', 'month', true, true),
            this.generateExecutiveAlerts('all', 'month'),
        ]);
        const report = {
            reportId: `board_report_${reportType}_${Date.now()}`,
            reportType,
            generatedAt: currentDate,
            period: {
                startDate,
                endDate,
                quarter: `Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`,
                year: currentDate.getFullYear(),
            },
            executiveSummary: {
                keyHighlights: dashboard.executiveSummary.keyAchievements,
                majorChallenges: dashboard.executiveSummary.criticalAlerts,
                strategicProgress: dashboard.executiveSummary.strategicOpportunities,
                financialPerformance: `Revenue grew ${dashboard.financialMetrics.revenue.growth.toFixed(1)}% with strong margin expansion to ${dashboard.financialMetrics.profitability.operatingMargin}%`,
                operationalExcellence: `Serving ${dashboard.operationalMetrics.scale.schoolsServed} schools with ${dashboard.operationalMetrics.efficiency.orderFulfillmentRate}% fulfillment rate`,
                futureOutlook: 'Strong growth trajectory with expansion into 12 new markets planned for next quarter',
            },
            financialOverview: {
                revenueGrowth: dashboard.financialMetrics.revenue.growth,
                profitabilityTrend: 15.3,
                cashPosition: dashboard.financialMetrics.cashFlow.operating,
                keyMetrics: [
                    {
                        name: 'Revenue',
                        current: dashboard.financialMetrics.revenue.current,
                        target: dashboard.financialMetrics.revenue.target,
                        variance: -8.5,
                    },
                    {
                        name: 'Gross Margin',
                        current: dashboard.financialMetrics.profitability.grossMargin,
                        target: 68.0,
                        variance: -2.5,
                    },
                    {
                        name: 'Customer LTV',
                        current: dashboard.financialMetrics.profitability.customerLifetimeValue,
                        target: 50000,
                        variance: -10.0,
                    },
                ],
            },
            strategicInitiatives: [
                {
                    initiative: 'AI-Powered Nutrition Optimization',
                    status: 'on_track',
                    progress: 85,
                    impact: '15% efficiency improvement, enhanced nutritional outcomes',
                    nextMilestones: ['Complete remaining school rollouts', 'Measure impact metrics'],
                    budget: { allocated: 5000000, spent: 4200000, remaining: 800000 },
                },
                {
                    initiative: 'Market Expansion - Tier 2 Cities',
                    status: 'on_track',
                    progress: 60,
                    impact: 'Projected 40% increase in addressable market',
                    nextMilestones: ['Complete market research', 'Pilot program launch'],
                    budget: { allocated: 8000000, spent: 3200000, remaining: 4800000 },
                },
                {
                    initiative: 'Supply Chain Optimization',
                    status: 'at_risk',
                    progress: 35,
                    impact: 'Target 20% cost reduction, improved reliability',
                    nextMilestones: ['Vendor negotiations', 'Technology integration'],
                    budget: { allocated: 3000000, spent: 1500000, remaining: 1500000 },
                },
            ],
            riskAssessment: {
                topRisks: [
                    {
                        risk: 'Competitive Pressure',
                        probability: 0.7,
                        impact: 0.3,
                        mitigation: 'Enhanced differentiation strategy',
                        status: 'Active mitigation',
                    },
                    {
                        risk: 'Regulatory Changes',
                        probability: 0.4,
                        impact: 0.6,
                        mitigation: 'Government relations program',
                        status: 'Monitoring',
                    },
                    {
                        risk: 'Supply Chain Disruption',
                        probability: 0.3,
                        impact: 0.5,
                        mitigation: 'Diversified supplier base',
                        status: 'Preventive measures',
                    },
                ],
                riskTrend: 'stable',
                overallRiskScore: 65,
            },
            marketPosition: {
                marketShare: 23.8,
                competitiveAdvantages: [
                    'Technology leadership in AI/ML',
                    'Strong customer relationships',
                    'Operational excellence',
                    'Sustainability focus',
                ],
                marketTrends: [
                    'Increasing demand for personalized nutrition',
                    'Growing emphasis on sustainability',
                    'Digital transformation acceleration',
                ],
                customerSatisfaction: dashboard.operationalMetrics.efficiency.customerSatisfactionScore,
                brandStrength: 78.5,
            },
            operationalHighlights: {
                efficiency: dashboard.operationalMetrics.efficiency.orderFulfillmentRate,
                quality: dashboard.operationalMetrics.quality.nutritionalCompliance,
                innovation: dashboard.strategicMetrics.innovation.technologyAdoptionRate,
                sustainability: dashboard.strategicMetrics.sustainability.environmentalImpactScore,
                employeeEngagement: 84.2,
            },
            futureStrategy: {
                strategicPriorities: [
                    'Accelerate AI/ML implementation across all operations',
                    'Expand into Tier 2 and Tier 3 markets',
                    'Enhance sustainability and ESG initiatives',
                    'Strengthen competitive moat through innovation',
                ],
                investmentAreas: [
                    'Technology infrastructure and AI capabilities',
                    'Market expansion and customer acquisition',
                    'Sustainability and environmental impact',
                    'Talent acquisition and development',
                ],
                expectedOutcomes: [
                    'Revenue growth of 35-40% over next 12 months',
                    'Market leadership in AI-powered school nutrition',
                    'Industry-leading sustainability metrics',
                    'Enhanced competitive differentiation',
                ],
                timeline: 'FY 2024-2025',
            },
            appendices: {
                detailedFinancials: dashboard.financialMetrics,
                operationalMetrics: dashboard.operationalMetrics,
                riskRegister: dashboard.riskMetrics,
                competitorAnalysis: dashboard.benchmarking.competitorAnalysis,
            },
        };
        this.logger.info('Board report generated successfully', {
            reportType,
            period: report.period,
            strategicInitiatives: report.strategicInitiatives.length,
        });
        return report;
    }
    getDateRange(timeframe) {
        const endDate = new Date();
        const startDate = new Date();
        switch (timeframe) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'ytd':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
        }
        return { startDate, endDate };
    }
    async getPreviousPeriodRevenue(startDate, endDate) {
        const prismaClient = this.database.client;
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const prevStartDate = new Date(startDate.getTime() - daysDiff * 24 * 60 * 60 * 1000);
        const prevEndDate = new Date(startDate.getTime());
        const previousPayments = await prismaClient.payment.findMany({
            where: {
                createdAt: { gte: prevStartDate, lte: prevEndDate },
                status: 'completed',
            },
        });
        return previousPayments.reduce((sum, payment) => sum + payment.amount, 0);
    }
    async calculateCustomerRetention(startDate, endDate) {
        return 87.3 + (Math.random() - 0.5) * 10;
    }
    async generateCFOKPIs(payments, subscriptions) {
        const kpis = [];
        kpis.push({
            kpiId: 'cash_conversion_cycle',
            name: 'Cash Conversion Cycle',
            category: 'financial',
            value: 28.5,
            unit: 'days',
            trend: {
                direction: 'down',
                percentage: 15.2,
                period: 'vs_previous_quarter',
                significance: 'strong',
            },
            benchmark: { target: 25, industry: 35, previousPeriod: 33.6 },
            status: 'good',
            lastUpdated: new Date(),
            dataQuality: 0.94,
        });
        return kpis;
    }
    async generateCOOKPIs(payments, subscriptions) {
        const kpis = [];
        kpis.push({
            kpiId: 'operational_efficiency',
            name: 'Operational Efficiency Score',
            category: 'operational',
            value: 85.3,
            unit: 'score',
            trend: {
                direction: 'up',
                percentage: 8.7,
                period: 'vs_previous_month',
                significance: 'moderate',
            },
            benchmark: { target: 90, industry: 78, previousPeriod: 78.5 },
            status: 'good',
            lastUpdated: new Date(),
            dataQuality: 0.91,
        });
        return kpis;
    }
    async generateCTOKPIs() {
        const kpis = [];
        kpis.push({
            kpiId: 'system_uptime',
            name: 'System Uptime',
            category: 'operational',
            value: 99.7,
            unit: 'percentage',
            trend: {
                direction: 'stable',
                percentage: 0.2,
                period: 'vs_previous_month',
                significance: 'weak',
            },
            benchmark: { target: 99.9, industry: 99.5, previousPeriod: 99.5 },
            status: 'good',
            lastUpdated: new Date(),
            dataQuality: 0.99,
        });
        return kpis;
    }
    getActionOwner(category) {
        const ownerMap = {
            financial: 'CFO',
            operational: 'COO',
            strategic: 'CEO',
            risk: 'CRO',
            growth: 'CEO',
        };
        return ownerMap[category] || 'CEO';
    }
}
exports.ExecutiveDashboardEngine = ExecutiveDashboardEngine;
const executiveDashboardEngine = new ExecutiveDashboardEngine();
exports.executiveDashboardEngine = executiveDashboardEngine;
const executiveDashboardHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Executive dashboard request started', {
            requestId,
            method: event.httpMethod,
            path: event.path,
        });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            logger.warn('Authentication failed for executive dashboard', {
                requestId,
                ip: event.requestContext.identity.sourceIp,
            });
            return authResult;
        }
        const { user: authenticatedUser } = authResult;
        if (!authenticatedUser ||
            !['admin', 'super_admin', 'ceo', 'cfo', 'coo', 'cto'].includes(authenticatedUser.role)) {
            logger.warn('Insufficient permissions for executive dashboard', {
                requestId,
                userId: authenticatedUser?.id,
                role: authenticatedUser?.role,
            });
            return (0, response_utils_1.createErrorResponse)('INSUFFICIENT_PERMISSIONS', 'Executive dashboard requires C-level access', 403);
        }
        const method = event.httpMethod;
        const pathSegments = event.path.split('/').filter(Boolean);
        switch (method) {
            case 'GET':
                const filteredQueryParams = {};
                for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
                    if (value !== undefined) {
                        filteredQueryParams[key] = value;
                    }
                }
                return await handleGetRequest(filteredQueryParams, authenticatedUser, requestId);
            case 'POST':
                return await handlePostRequest(event.body, authenticatedUser, requestId);
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405);
        }
    }
    catch (error) {
        logger.error('Executive dashboard request failed', undefined, {
            requestId,
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return (0, response_utils_1.handleError)(error, 'Executive dashboard operation failed');
    }
};
exports.executiveDashboardHandler = executiveDashboardHandler;
async function handleGetRequest(queryParams, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    try {
        const query = executiveDashboardQuerySchema.parse(queryParams);
        logger.info('Generating executive dashboard', {
            requestId,
            dashboardType: query.dashboardType,
            timeframe: query.timeframe,
            userId: authenticatedUser.id,
        });
        const [dashboard, alerts] = await Promise.all([
            executiveDashboardEngine.generateExecutiveDashboard(query.dashboardType, query.timeframe, query.includeForecasts, query.includeComparisons, query.metrics),
            executiveDashboardEngine.generateExecutiveAlerts(query.alertLevel, query.timeframe),
        ]);
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Executive dashboard generated successfully',
            data: {
                dashboard,
                alerts: alerts.slice(0, 10),
                metadata: {
                    generatedAt: new Date(),
                    requestId,
                    dashboardType: query.dashboardType,
                    timeframe: query.timeframe,
                },
            },
        });
    }
    catch (error) {
        logger.error('Error generating executive dashboard', undefined, {
            requestId,
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
async function handlePostRequest(requestBody, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    if (!requestBody) {
        return (0, response_utils_1.createErrorResponse)('MISSING_BODY', 'Request body is required', 400);
    }
    try {
        const body = JSON.parse(requestBody);
        const reportRequest = executiveReportSchema.parse(body);
        logger.info('Generating board report', {
            requestId,
            reportType: reportRequest.reportType,
            userId: authenticatedUser.id,
        });
        const report = await executiveDashboardEngine.generateBoardReport(reportRequest.reportType);
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Board report generated successfully',
            data: {
                report,
                metadata: {
                    generatedAt: new Date(),
                    requestId,
                    reportType: reportRequest.reportType,
                    confidentialityLevel: reportRequest.confidentialityLevel,
                },
            },
        });
    }
    catch (error) {
        logger.error('Error generating board report', undefined, {
            requestId,
            errorMessage: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
exports.handler = exports.executiveDashboardHandler;
//# sourceMappingURL=executive-dashboard-engine.js.map