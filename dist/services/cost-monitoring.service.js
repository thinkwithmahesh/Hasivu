"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostMonitoringService = void 0;
/**
 * HASIVU Platform - Cost Monitoring & Optimization Service
 * Enterprise-grade cost monitoring with intelligent optimization recommendations,
 * budget alerts, and financial analytics for AWS resource management
 * @author HASIVU Development Team
 * @version 2.0.0
 * @since 2024
 */
const aws_sdk_1 = require("aws-sdk");
const logger_1 = require("@/utils/logger");
const pg_1 = require("pg");
/**
 * AWS cost monitoring and optimization service
 */
class CostMonitoringService {
    costExplorer;
    cloudwatch;
    budgets;
    dbClient;
    monitoringInterval = null;
    constructor() {
        // Initialize AWS services
        this.costExplorer = new aws_sdk_1.CostExplorer({ region: 'us-east-1' }); // Cost Explorer is only available in us-east-1
        this.cloudwatch = new aws_sdk_1.CloudWatch({ region: process.env.AWS_REGION });
        this.budgets = new aws_sdk_1.Budgets({ region: 'us-east-1' }); // Budgets is only available in us-east-1
        // Initialize database connection
        this.dbClient = new pg_1.Client({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
    }
    /**
     * Generate comprehensive cost report
     */
    async generateCostReport(period = 'daily') {
        const startTime = Date.now();
        const reportId = `cost_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger_1.logger.info(`Generating cost report for period: ${period}`, { reportId });
        try {
            // Get date range based on period
            const { startDate, endDate } = this.getDateRange(period);
            // Parallel execution of cost data collection
            const [costBreakdown, costTrends, budgetStatuses, efficiencyMetrics, recommendations, anomalies] = await Promise.all([
                this.getCostBreakdown(startDate, endDate),
                this.getCostTrends(startDate, endDate),
                this.getBudgetStatuses(),
                this.getCostEfficiencyMetrics(),
                this.generateOptimizationRecommendations(),
                this.detectCostAnomalies(startDate, endDate)
            ]);
            // Calculate total cost
            const totalCost = costBreakdown.reduce((sum, item) => sum + item.amount, 0);
            // Generate alerts based on data
            const alerts = this.generateCostAlerts(budgetStatuses, anomalies, costTrends);
            const report = {
                period,
                totalCost,
                currency: 'USD',
                breakdown: costBreakdown,
                trends: costTrends,
                budgets: budgetStatuses,
                efficiency: efficiencyMetrics,
                recommendations,
                alerts,
                timestamp: new Date(),
                reportId
            };
            // Store report in database
            await this.storeCostReport(report);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info(`Cost report generated in ${processingTime}ms`, { reportId, totalCost });
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate cost report:', error);
            throw new Error(`Cost report generation failed: ${error.message}`);
        }
    }
    /**
     * Get cost breakdown by service
     */
    async getCostBreakdown(startDate, endDate) {
        try {
            const params = {
                TimePeriod: {
                    Start: startDate,
                    End: endDate
                },
                Granularity: 'DAILY',
                Metrics: ['BlendedCost'],
                GroupBy: [
                    {
                        Type: 'DIMENSION',
                        Key: 'SERVICE'
                    }
                ]
            };
            const result = await this.costExplorer.getCostAndUsage(params).promise();
            const breakdown = [];
            if (result.ResultsByTime && result.ResultsByTime.length > 0) {
                const latestResults = result.ResultsByTime[result.ResultsByTime.length - 1];
                if (latestResults.Groups) {
                    for (const group of latestResults.Groups) {
                        const serviceName = group.Keys ? group.Keys[0] : 'Unknown';
                        const amount = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
                        if (amount > 0) {
                            breakdown.push({
                                service: serviceName,
                                amount,
                                currency: group.Metrics?.BlendedCost?.Unit || 'USD',
                                percentage: 0, // Will be calculated after all services are processed
                                trend: await this.calculateServiceTrend(serviceName, startDate, endDate),
                                details: {
                                    usage: 0,
                                    unit: 'hours'
                                }
                            });
                        }
                    }
                }
            }
            // Calculate percentages
            const totalCost = breakdown.reduce((sum, item) => sum + item.amount, 0);
            breakdown.forEach(item => {
                item.percentage = totalCost > 0 ? (item.amount / totalCost) * 100 : 0;
            });
            // Sort by cost descending
            return breakdown.sort((a, b) => b.amount - a.amount);
        }
        catch (error) {
            logger_1.logger.error('Failed to get cost breakdown:', error);
            return [];
        }
    }
    /**
     * Calculate service cost trend
     */
    async calculateServiceTrend(serviceName, startDate, endDate) {
        try {
            // Get last 7 days for comparison
            const previousStartDate = this.subtractDays(startDate, 7);
            const params = {
                TimePeriod: {
                    Start: previousStartDate,
                    End: endDate
                },
                Granularity: 'DAILY',
                Metrics: ['BlendedCost'],
                GroupBy: [
                    {
                        Type: 'DIMENSION',
                        Key: 'SERVICE'
                    }
                ],
                Filter: {
                    Dimensions: {
                        Key: 'SERVICE',
                        Values: [serviceName]
                    }
                }
            };
            const result = await this.costExplorer.getCostAndUsage(params).promise();
            if (result.ResultsByTime && result.ResultsByTime.length >= 2) {
                const recent = parseFloat(result.ResultsByTime[result.ResultsByTime.length - 1].Total?.BlendedCost?.Amount || '0');
                const previous = parseFloat(result.ResultsByTime[0].Total?.BlendedCost?.Amount || '0');
                const changePercent = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
                if (changePercent > 10)
                    return 'increasing';
                if (changePercent < -10)
                    return 'decreasing';
                return 'stable';
            }
            return 'stable';
        }
        catch (error) {
            logger_1.logger.warn(`Failed to calculate trend for service ${serviceName}:`, error);
            return 'stable';
        }
    }
    /**
     * Get cost trends analysis
     */
    async getCostTrends(startDate, endDate) {
        try {
            // Get extended period for trend calculation
            const extendedStartDate = this.subtractDays(startDate, 90);
            const params = {
                TimePeriod: {
                    Start: extendedStartDate,
                    End: endDate
                },
                Granularity: 'DAILY',
                Metrics: ['BlendedCost']
            };
            const result = await this.costExplorer.getCostAndUsage(params).promise();
            if (!result.ResultsByTime || result.ResultsByTime.length < 7) {
                return this.getDefaultTrends();
            }
            const dailyCosts = result.ResultsByTime.map(item => parseFloat(item.Total?.BlendedCost?.Amount || '0'));
            // Calculate growth rates
            const dailyGrowth = this.calculateGrowthRate(dailyCosts.slice(-2));
            const weeklyGrowth = this.calculateGrowthRate([
                dailyCosts.slice(-14, -7).reduce((a, b) => a + b, 0),
                dailyCosts.slice(-7).reduce((a, b) => a + b, 0)
            ]);
            const monthlyGrowth = this.calculateGrowthRate([
                dailyCosts.slice(-60, -30).reduce((a, b) => a + b, 0),
                dailyCosts.slice(-30).reduce((a, b) => a + b, 0)
            ]);
            // Generate forecast using simple linear regression
            const forecast = this.generateCostForecast(dailyCosts);
            // Analyze seasonality
            const seasonality = this.analyzeSeasonality(dailyCosts);
            return {
                dailyGrowth,
                weeklyGrowth,
                monthlyGrowth,
                yearOverYear: 0, // Would need a full year of data
                forecast,
                seasonality
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cost trends:', error);
            return this.getDefaultTrends();
        }
    }
    /**
     * Get budget statuses
     */
    async getBudgetStatuses() {
        try {
            const result = await this.budgets.describeBudgets({
                AccountId: process.env.AWS_ACCOUNT_ID || 'current'
            }).promise();
            const budgetStatuses = [];
            if (result.Budgets) {
                for (const budget of result.Budgets) {
                    const budgetLimit = parseFloat(budget.BudgetLimit?.Amount || '0');
                    // Get actual spend
                    const actualSpend = await this.getBudgetActualSpend(budget.BudgetName || '');
                    // Get forecasted spend (simplified calculation)
                    const forecastedSpend = actualSpend * 1.1; // Rough estimate
                    const utilizationPercentage = budgetLimit > 0 ? (actualSpend / budgetLimit) * 100 : 0;
                    let status = 'ok';
                    if (utilizationPercentage >= 100)
                        status = 'exceeded';
                    else if (utilizationPercentage >= 90)
                        status = 'critical';
                    else if (utilizationPercentage >= 75)
                        status = 'warning';
                    // Calculate days remaining in budget period
                    const daysRemaining = this.calculateDaysRemaining(budget.TimePeriod);
                    budgetStatuses.push({
                        name: budget.BudgetName || 'Unknown',
                        budgetLimit,
                        actualSpend,
                        forecastedSpend,
                        utilizationPercentage,
                        status,
                        daysRemaining,
                        alertThresholds: [75, 90, 100]
                    });
                }
            }
            return budgetStatuses;
        }
        catch (error) {
            logger_1.logger.error('Failed to get budget statuses:', error);
            return [];
        }
    }
    /**
     * Get cost efficiency metrics
     */
    async getCostEfficiencyMetrics() {
        try {
            // This would typically integrate with AWS Trusted Advisor or Cost Optimization Hub
            // For now, we'll return mock data structure
            return {
                rightsizingOpportunities: [],
                unusedResources: [],
                reservedInstanceUtilization: {
                    utilization: 85,
                    coverage: 70,
                    savings: 15
                },
                spotInstanceOpportunities: []
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cost efficiency metrics:', error);
            return {
                rightsizingOpportunities: [],
                unusedResources: [],
                reservedInstanceUtilization: {
                    utilization: 0,
                    coverage: 0,
                    savings: 0
                },
                spotInstanceOpportunities: []
            };
        }
    }
    /**
     * Generate optimization recommendations
     */
    async generateOptimizationRecommendations() {
        const recommendations = [];
        try {
            // Get rightsizing recommendations from Cost Explorer
            const rightsizingParams = {
                Service: 'AmazonEC2',
                Configuration: {
                    BenefitsConsidered: true,
                    RecommendationTarget: 'SAME_INSTANCE_FAMILY'
                }
            };
            const rightsizingResult = await this.costExplorer.getRightsizingRecommendation(rightsizingParams).promise();
            if (rightsizingResult.RightsizingRecommendations) {
                for (const rec of rightsizingResult.RightsizingRecommendations) {
                    if (rec.RightsizingType === 'Modify' && rec.ModifyRecommendationDetail) {
                        recommendations.push({
                            type: 'rightsizing',
                            priority: 'high',
                            description: `Rightsize ${rec.CurrentInstance?.ResourceId} from current instance to recommended instance (${rec.ModifyRecommendationDetail.TargetInstances?.length || 0} options)`,
                            potentialSavings: parseFloat(rec.ModifyRecommendationDetail.TargetInstances?.[0]?.EstimatedMonthlySavings || '0'),
                            implementation: [
                                'Stop the instance',
                                'Change instance type',
                                'Start the instance',
                                'Monitor performance'
                            ],
                            impact: 'medium',
                            effort: 'easy',
                            resourcesAffected: [rec.CurrentInstance?.ResourceId || ''],
                            estimatedTimeToImplement: '30 minutes'
                        });
                    }
                }
            }
            // Add generic recommendations
            recommendations.push({
                type: 'reserved_instances',
                priority: 'medium',
                description: 'Consider purchasing Reserved Instances for consistent workloads',
                potentialSavings: 500,
                implementation: [
                    'Analyze usage patterns',
                    'Purchase appropriate Reserved Instances',
                    'Monitor utilization'
                ],
                impact: 'high',
                effort: 'moderate',
                resourcesAffected: ['EC2', 'RDS'],
                estimatedTimeToImplement: '1-2 hours'
            });
            return recommendations;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate optimization recommendations:', error);
            return recommendations;
        }
    }
    /**
     * Detect cost anomalies
     */
    async detectCostAnomalies(startDate, endDate) {
        try {
            const params = {
                DateInterval: {
                    StartDate: startDate,
                    EndDate: endDate
                },
                MonitorArn: process.env.COST_ANOMALY_MONITOR_ARN
            };
            if (!process.env.COST_ANOMALY_MONITOR_ARN) {
                logger_1.logger.warn('Cost anomaly monitor ARN not configured');
                return [];
            }
            const result = await this.costExplorer.getAnomalies(params).promise();
            const anomalies = [];
            if (result.Anomalies) {
                for (const anomaly of result.Anomalies) {
                    anomalies.push({
                        service: anomaly.DimensionValue || 'Unknown',
                        anomalyScore: anomaly.AnomalyScore?.MaxScore || 0,
                        impact: parseFloat(String(anomaly.Impact?.MaxImpact || '0')),
                        rootCauses: anomaly.RootCauses?.map(rc => rc.Service || '') || [],
                        detected: new Date(anomaly.AnomalyStartDate || Date.now()),
                        dimension: anomaly.Dimension || '',
                        dimensionValue: anomaly.DimensionValue || ''
                    });
                }
            }
            return anomalies;
        }
        catch (error) {
            logger_1.logger.error('Failed to detect cost anomalies:', error);
            return [];
        }
    }
    /**
     * Generate cost alerts
     */
    generateCostAlerts(budgets, anomalies, trends) {
        const alerts = [];
        // Budget alerts
        for (const budget of budgets) {
            if (budget.status === 'exceeded') {
                alerts.push({
                    type: 'budget_threshold',
                    severity: 'critical',
                    message: `Budget "${budget.name}" has been exceeded. Utilization: ${budget.utilizationPercentage.toFixed(1)}%`,
                    affectedResources: [budget.name],
                    recommendedActions: [
                        'Review recent spending',
                        'Implement cost controls',
                        'Consider increasing budget if justified'
                    ],
                    triggerValue: budget.utilizationPercentage,
                    timestamp: new Date()
                });
            }
            else if (budget.status === 'critical') {
                alerts.push({
                    type: 'budget_threshold',
                    severity: 'warning',
                    message: `Budget "${budget.name}" is at ${budget.utilizationPercentage.toFixed(1)}% utilization`,
                    affectedResources: [budget.name],
                    recommendedActions: [
                        'Monitor spending closely',
                        'Review upcoming expenses',
                        'Consider optimization opportunities'
                    ],
                    triggerValue: budget.utilizationPercentage,
                    timestamp: new Date()
                });
            }
        }
        // Anomaly alerts
        for (const anomaly of anomalies) {
            if (anomaly.anomalyScore > 80) {
                alerts.push({
                    type: 'anomaly_detection',
                    severity: 'critical',
                    message: `Cost anomaly detected in ${anomaly.service} with score ${anomaly.anomalyScore.toFixed(1)}`,
                    affectedResources: [anomaly.service],
                    recommendedActions: [
                        'Investigate root cause',
                        'Review resource usage',
                        'Check for unauthorized usage'
                    ],
                    triggerValue: anomaly.anomalyScore,
                    timestamp: new Date()
                });
            }
        }
        // Trend alerts
        if (trends.dailyGrowth > 50) {
            alerts.push({
                type: 'cost_spike',
                severity: 'warning',
                message: `Daily cost increased by ${trends.dailyGrowth.toFixed(1)}%`,
                affectedResources: ['Overall'],
                recommendedActions: [
                    'Investigate cost spike',
                    'Review recent changes',
                    'Check for scaling events'
                ],
                triggerValue: trends.dailyGrowth,
                timestamp: new Date()
            });
        }
        return alerts;
    }
    /**
     * Store cost report in database
     */
    async storeCostReport(report) {
        try {
            await this.dbClient.connect();
            const query = `
        INSERT INTO cost_reports (
          report_id, period, total_cost, currency, 
          breakdown, trends, budgets, efficiency, 
          recommendations, alerts, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (report_id) DO UPDATE SET
          total_cost = EXCLUDED.total_cost,
          breakdown = EXCLUDED.breakdown,
          trends = EXCLUDED.trends,
          budgets = EXCLUDED.budgets,
          efficiency = EXCLUDED.efficiency,
          recommendations = EXCLUDED.recommendations,
          alerts = EXCLUDED.alerts,
          timestamp = EXCLUDED.timestamp
      `;
            await this.dbClient.query(query, [
                report.reportId,
                report.period,
                report.totalCost,
                report.currency,
                JSON.stringify(report.breakdown),
                JSON.stringify(report.trends),
                JSON.stringify(report.budgets),
                JSON.stringify(report.efficiency),
                JSON.stringify(report.recommendations),
                JSON.stringify(report.alerts),
                report.timestamp
            ]);
            await this.dbClient.end();
        }
        catch (error) {
            logger_1.logger.error('Failed to store cost report:', error);
        }
    }
    /**
     * Start continuous cost monitoring
     */
    startContinuousMonitoring(intervalMs = 3600000) {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.generateCostReport('daily');
            }
            catch (error) {
                logger_1.logger.error('Continuous cost monitoring error:', error);
            }
        }, intervalMs);
        logger_1.logger.info(`Started continuous cost monitoring with ${intervalMs}ms interval`);
    }
    /**
     * Stop continuous cost monitoring
     */
    stopContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            logger_1.logger.info('Stopped continuous cost monitoring');
        }
    }
    // Helper methods
    /**
     * Get date range based on period
     */
    getDateRange(period) {
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
            case 'daily':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarterly':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default:
                startDate.setDate(startDate.getDate() - 1);
        }
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }
    /**
     * Subtract days from date string
     */
    subtractDays(dateString, days) {
        const date = new Date(dateString);
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }
    /**
     * Calculate growth rate between two values
     */
    calculateGrowthRate(values) {
        if (values.length !== 2 || values[0] === 0)
            return 0;
        return ((values[1] - values[0]) / values[0]) * 100;
    }
    /**
     * Generate cost forecast
     */
    generateCostForecast(historicalCosts) {
        const avgDailyCost = historicalCosts.reduce((a, b) => a + b, 0) / historicalCosts.length;
        const trend = historicalCosts.length > 1 ?
            (historicalCosts[historicalCosts.length - 1] - historicalCosts[0]) / historicalCosts.length : 0;
        return {
            nextWeek: (avgDailyCost + trend) * 7,
            nextMonth: (avgDailyCost + trend) * 30,
            nextQuarter: (avgDailyCost + trend) * 90
        };
    }
    /**
     * Analyze seasonality
     */
    analyzeSeasonality(historicalCosts) {
        const variance = this.calculateVariance(historicalCosts);
        const mean = historicalCosts.reduce((a, b) => a + b, 0) / historicalCosts.length;
        const cv = variance / mean;
        let pattern;
        let confidence;
        if (cv < 0.1) {
            pattern = 'stable';
            confidence = 0.9;
        }
        else if (cv > 0.3) {
            pattern = 'volatile';
            confidence = 0.8;
        }
        else {
            pattern = 'seasonal';
            confidence = 0.7;
        }
        return { pattern, confidence };
    }
    /**
     * Calculate variance
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
    /**
     * Get default trends when data is insufficient
     */
    getDefaultTrends() {
        return {
            dailyGrowth: 0,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            yearOverYear: 0,
            forecast: {
                nextWeek: 0,
                nextMonth: 0,
                nextQuarter: 0
            },
            seasonality: {
                pattern: 'stable',
                confidence: 0.5
            }
        };
    }
    /**
     * Get budget actual spend
     */
    async getBudgetActualSpend(budgetName) {
        try {
            const result = await this.budgets.describeBudgetPerformanceHistory({
                AccountId: process.env.AWS_ACCOUNT_ID || 'current',
                BudgetName: budgetName,
                MaxResults: 1
            }).promise();
            if (result.BudgetPerformanceHistory?.BudgetedAndActualAmountsList?.[0]) {
                return parseFloat(result.BudgetPerformanceHistory.BudgetedAndActualAmountsList[0].ActualAmount?.Amount || '0');
            }
            return 0;
        }
        catch (error) {
            logger_1.logger.warn(`Failed to get actual spend for budget ${budgetName}:`, error);
            return 0;
        }
    }
    /**
     * Calculate days remaining in budget period
     */
    calculateDaysRemaining(timePeriod) {
        try {
            if (timePeriod?.End) {
                const endDate = new Date(timePeriod.End);
                const now = new Date();
                const diffTime = endDate.getTime() - now.getTime();
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stopContinuousMonitoring();
        try {
            await this.dbClient.end();
        }
        catch (error) {
            logger_1.logger.warn('Error closing database connection:', error);
        }
    }
}
exports.CostMonitoringService = CostMonitoringService;
exports.default = CostMonitoringService;
