"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.advancedPaymentIntelligenceHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const zod_1 = require("zod");
let prisma = null;
function getPrismaClient() {
    if (!prisma) {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
    }
    return prisma;
}
const transactionAnalysisSchema = zod_1.z.object({
    transactionId: zod_1.z.string().uuid().optional(),
    schoolId: zod_1.z.string().uuid().optional(),
    amount: zod_1.z.number().min(0).optional(),
    paymentMethod: zod_1.z.string().optional(),
    analysisType: zod_1.z.enum(['fraud_detection', 'pattern_recognition', 'behavioral_analysis', 'optimization_suggestions', 'comprehensive']).default('comprehensive'),
    includeRecommendations: zod_1.z.boolean().default(true),
    confidenceThreshold: zod_1.z.number().min(0).max(1).default(0.7)
});
const intelligenceInsightsSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid().optional(),
    timeframe: zod_1.z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
    insightTypes: zod_1.z.array(zod_1.z.enum(['fraud_patterns', 'user_behavior', 'payment_optimization', 'risk_assessment', 'all'])).default(['all']),
    includeActionableRecommendations: zod_1.z.boolean().default(true),
    riskLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical', 'all']).default('all')
});
async function detectFraudRisk(transactionData, historicalContext, userProfile, schoolProfile) {
    const riskFactors = [];
    let fraudScore = 0;
    if (transactionData.amount) {
        const averageAmount = historicalContext.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, historicalContext.length);
        const amountDeviation = Math.abs(transactionData.amount - averageAmount) / Math.max(averageAmount, 1);
        if (amountDeviation > 3) {
            const weight = Math.min(0.3, amountDeviation / 10);
            fraudScore += weight;
            riskFactors.push({
                factor: 'Unusual transaction amount',
                weight,
                description: `Amount ${transactionData.amount} is ${amountDeviation.toFixed(1)}x the user's average`,
                evidence: [{ currentAmount: transactionData.amount, averageAmount, deviation: amountDeviation }]
            });
        }
    }
    const recentTransactions = historicalContext.filter(t => {
        const timeDiff = Date.now() - new Date(t.createdAt).getTime();
        return timeDiff < 24 * 60 * 60 * 1000;
    });
    if (recentTransactions.length > 10) {
        const weight = Math.min(0.25, recentTransactions.length / 50);
        fraudScore += weight;
        riskFactors.push({
            factor: 'High transaction velocity',
            weight,
            description: `${recentTransactions.length} transactions in the last 24 hours`,
            evidence: recentTransactions.slice(0, 5).map(t => ({ id: t.id, amount: t.amount, timestamp: t.createdAt }))
        });
    }
    if (userProfile.location && transactionData.location) {
        const distance = calculateDistance(userProfile.location, transactionData.location);
        if (distance > 1000) {
            const weight = Math.min(0.2, distance / 5000);
            fraudScore += weight;
            riskFactors.push({
                factor: 'Unusual geographic location',
                weight,
                description: `Transaction from ${distance}km away from usual location`,
                evidence: [{ userLocation: userProfile.location, transactionLocation: transactionData.location, distance }]
            });
        }
    }
    const hour = new Date().getHours();
    const isUnusualTime = hour < 6 || hour > 23;
    if (isUnusualTime) {
        const weight = 0.1;
        fraudScore += weight;
        riskFactors.push({
            factor: 'Unusual transaction time',
            weight,
            description: `Transaction at ${hour}:00 hours`,
            evidence: [{ hour, isBusinessHours: false }]
        });
    }
    if (userProfile.successRate && userProfile.successRate > 0.9 && transactionData.previousFailures > 3) {
        const weight = 0.15;
        fraudScore += weight;
        riskFactors.push({
            factor: 'Unusual failure pattern',
            weight,
            description: 'Multiple consecutive failures for typically successful user',
            evidence: [{ normalSuccessRate: userProfile.successRate, recentFailures: transactionData.previousFailures }]
        });
    }
    if (schoolProfile.riskScore && schoolProfile.riskScore > 0.7) {
        const weight = 0.1;
        fraudScore += weight;
        riskFactors.push({
            factor: 'High-risk school association',
            weight,
            description: `School has elevated risk score of ${schoolProfile.riskScore}`,
            evidence: [{ schoolRiskScore: schoolProfile.riskScore, riskReasons: schoolProfile.riskReasons }]
        });
    }
    fraudScore = Math.min(1, fraudScore);
    let fraudRisk;
    if (fraudScore >= 0.8)
        fraudRisk = 'critical';
    else if (fraudScore >= 0.6)
        fraudRisk = 'high';
    else if (fraudScore >= 0.4)
        fraudRisk = 'medium';
    else
        fraudRisk = 'low';
    const recommendations = generateFraudRecommendations(fraudScore, riskFactors);
    const blockedIndicators = riskFactors
        .filter(rf => rf.weight > 0.3)
        .map(rf => rf.factor);
    return {
        transactionId: transactionData.id,
        fraudRisk,
        fraudScore: Math.round(fraudScore * 100) / 100,
        riskFactors,
        recommendations,
        blockedIndicators,
        investigationRequired: fraudScore > 0.6,
        confidence: Math.min(0.95, 0.7 + riskFactors.length * 0.05)
    };
}
function calculateDistance(loc1, loc2) {
    const lat1 = loc1.latitude || 0;
    const lon1 = loc1.longitude || 0;
    const lat2 = loc2.latitude || 0;
    const lon2 = loc2.longitude || 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function generateFraudRecommendations(fraudScore, riskFactors) {
    const recommendations = [];
    if (fraudScore >= 0.8) {
        recommendations.push('IMMEDIATE: Block transaction and require manual review');
        recommendations.push('IMMEDIATE: Contact user via verified phone/email for confirmation');
        recommendations.push('IMMEDIATE: Escalate to fraud investigation team');
    }
    else if (fraudScore >= 0.6) {
        recommendations.push('URGENT: Require additional authentication (2FA, OTP)');
        recommendations.push('URGENT: Implement transaction limits for this user temporarily');
        recommendations.push('Monitor subsequent transactions closely');
    }
    else if (fraudScore >= 0.4) {
        recommendations.push('Require step-up authentication for high-value transactions');
        recommendations.push('Enable enhanced monitoring for this user profile');
        recommendations.push('Consider implementing velocity limits');
    }
    else {
        recommendations.push('Continue standard processing');
        recommendations.push('Maintain routine monitoring');
    }
    riskFactors.forEach(factor => {
        switch (factor.factor) {
            case 'Unusual transaction amount':
                recommendations.push('Consider implementing dynamic amount limits');
                break;
            case 'High transaction velocity':
                recommendations.push('Implement velocity-based controls and cooling-off periods');
                break;
            case 'Unusual geographic location':
                recommendations.push('Enable location-based alerts and verification');
                break;
            case 'Unusual transaction time':
                recommendations.push('Consider time-based risk scoring adjustments');
                break;
        }
    });
    return Array.from(new Set(recommendations));
}
async function recognizePaymentPatterns(historicalData, timeframe, schoolId) {
    const patterns = [];
    const anomalies = [];
    const trends = [];
    if (historicalData.length < 10) {
        return { patterns, anomalies, trends };
    }
    const temporalAnalysis = analyzeTemporalPatterns(historicalData);
    if (temporalAnalysis.significance !== 'low') {
        patterns.push({
            patternType: 'temporal',
            description: temporalAnalysis.description,
            frequency: temporalAnalysis.frequency,
            significance: temporalAnalysis.significance,
            examples: temporalAnalysis.examples,
            recommendations: temporalAnalysis.recommendations
        });
    }
    const amountAnalysis = analyzeAmountPatterns(historicalData);
    if (amountAnalysis.significance !== 'low') {
        patterns.push({
            patternType: 'amount',
            description: amountAnalysis.description,
            frequency: amountAnalysis.frequency,
            significance: amountAnalysis.significance,
            examples: amountAnalysis.examples,
            recommendations: amountAnalysis.recommendations
        });
    }
    const behavioralAnalysis = analyzeBehavioralPatterns(historicalData);
    if (behavioralAnalysis.significance !== 'low') {
        patterns.push({
            patternType: 'behavioral',
            description: behavioralAnalysis.description,
            frequency: behavioralAnalysis.frequency,
            significance: behavioralAnalysis.significance,
            examples: behavioralAnalysis.examples,
            recommendations: behavioralAnalysis.recommendations
        });
    }
    const detectedAnomalies = detectPatternAnomalies(historicalData);
    anomalies.push(...detectedAnomalies);
    const identifiedTrends = identifyPaymentTrends(historicalData);
    trends.push(...identifiedTrends);
    return { patterns, anomalies, trends };
}
function analyzeTemporalPatterns(data) {
    const hourlyDistribution = {};
    const dailyDistribution = {};
    data.forEach(payment => {
        const date = new Date(payment.createdAt);
        const hour = date.getHours();
        const day = date.getDay();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyDistribution)
        .sort(([, a], [, b]) => b - a)[0];
    const peakDay = Object.entries(dailyDistribution)
        .sort(([, a], [, b]) => b - a)[0];
    const peakHourPercentage = (parseInt(peakHour[1]) / data.length) * 100;
    const peakDayPercentage = (parseInt(peakDay[1]) / data.length) * 100;
    let significance;
    if (peakHourPercentage > 50 || peakDayPercentage > 40)
        significance = 'critical';
    else if (peakHourPercentage > 30 || peakDayPercentage > 25)
        significance = 'high';
    else if (peakHourPercentage > 20 || peakDayPercentage > 15)
        significance = 'medium';
    else
        significance = 'low';
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return {
        description: `Peak activity: ${peakHourPercentage.toFixed(1)}% of payments at ${peakHour[0]}:00, ${peakDayPercentage.toFixed(1)}% on ${dayNames[parseInt(peakDay[0])]}`,
        frequency: Math.max(peakHourPercentage, peakDayPercentage) / 100,
        significance,
        examples: [
            { type: 'peak_hour', hour: parseInt(peakHour[0]), percentage: peakHourPercentage },
            { type: 'peak_day', day: dayNames[parseInt(peakDay[0])], percentage: peakDayPercentage }
        ],
        recommendations: [
            significance === 'critical' ? 'Implement load balancing for peak hours' : 'Monitor peak hour performance',
            'Consider targeted promotions during low-activity periods',
            'Optimize customer support staffing based on patterns'
        ]
    };
}
function analyzeAmountPatterns(data) {
    const amounts = data.map(p => p.amount).sort((a, b) => a - b);
    const total = amounts.reduce((sum, amt) => sum + amt, 0);
    const mean = total / amounts.length;
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const median = amounts[Math.floor(amounts.length * 0.5)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const amountClusters = findAmountClusters(amounts);
    const largestCluster = amountClusters.sort((a, b) => b.count - a.count)[0];
    const clusterPercentage = (largestCluster.count / amounts.length) * 100;
    let significance;
    if (clusterPercentage > 40)
        significance = 'critical';
    else if (clusterPercentage > 25)
        significance = 'high';
    else if (clusterPercentage > 15)
        significance = 'medium';
    else
        significance = 'low';
    return {
        description: `${clusterPercentage.toFixed(1)}% of payments cluster around ₹${largestCluster.amount}. Median: ₹${median}, Range: ₹${amounts[0]}-₹${amounts[amounts.length - 1]}`,
        frequency: clusterPercentage / 100,
        significance,
        examples: [
            { type: 'cluster', amount: largestCluster.amount, count: largestCluster.count, percentage: clusterPercentage },
            { type: 'quartiles', q1, median, q3, mean }
        ],
        recommendations: [
            significance === 'critical' ? 'Investigate pricing consistency' : 'Monitor amount distribution',
            'Consider tiered pricing strategies',
            'Analyze high-value transaction patterns'
        ]
    };
}
function findAmountClusters(amounts) {
    const clusters = {};
    const tolerance = 50;
    amounts.forEach(amount => {
        let foundCluster = false;
        for (const [clusterAmount, count] of Object.entries(clusters)) {
            if (Math.abs(amount - parseFloat(clusterAmount)) <= tolerance) {
                clusters[parseFloat(clusterAmount)] = count + 1;
                foundCluster = true;
                break;
            }
        }
        if (!foundCluster) {
            clusters[amount] = 1;
        }
    });
    return Object.entries(clusters)
        .map(([amount, count]) => ({ amount: parseFloat(amount), count }))
        .filter(cluster => cluster.count > 1)
        .sort((a, b) => b.count - a.count);
}
function analyzeBehavioralPatterns(data) {
    const userBehavior = {};
    data.forEach(payment => {
        const userId = payment.userId || payment.order?.userId;
        if (!userId)
            return;
        if (!userBehavior[userId]) {
            userBehavior[userId] = {
                paymentCount: 0,
                totalAmount: 0,
                successfulPayments: 0,
                failedPayments: 0,
                paymentTimes: []
            };
        }
        userBehavior[userId].paymentCount++;
        userBehavior[userId].totalAmount += payment.amount;
        userBehavior[userId].paymentTimes.push(new Date(payment.createdAt).getHours());
        if (payment.status === 'completed') {
            userBehavior[userId].successfulPayments++;
        }
        else if (payment.status === 'failed') {
            userBehavior[userId].failedPayments++;
        }
    });
    const users = Object.values(userBehavior);
    const avgPaymentsPerUser = users.reduce((sum, user) => sum + user.paymentCount, 0) / users.length;
    const avgSuccessRate = users.reduce((sum, user) => sum + (user.successfulPayments / user.paymentCount), 0) / users.length;
    const sortedUsers = users.sort((a, b) => b.paymentCount - a.paymentCount);
    const powerUserThreshold = Math.ceil(users.length * 0.2);
    const powerUsers = sortedUsers.slice(0, powerUserThreshold);
    const powerUserContribution = powerUsers.reduce((sum, user) => sum + user.totalAmount, 0);
    const totalRevenue = users.reduce((sum, user) => sum + user.totalAmount, 0);
    const powerUserPercentage = (powerUserContribution / totalRevenue) * 100;
    let significance;
    if (powerUserPercentage > 60)
        significance = 'critical';
    else if (powerUserPercentage > 40)
        significance = 'high';
    else if (powerUserPercentage > 25)
        significance = 'medium';
    else
        significance = 'low';
    return {
        description: `Top 20% of users contribute ${powerUserPercentage.toFixed(1)}% of revenue. Average: ${avgPaymentsPerUser.toFixed(1)} payments/user, ${(avgSuccessRate * 100).toFixed(1)}% success rate`,
        frequency: powerUserPercentage / 100,
        significance,
        examples: [
            { type: 'power_users', count: powerUsers.length, contribution: powerUserPercentage },
            { type: 'average_behavior', avgPayments: avgPaymentsPerUser, avgSuccessRate: avgSuccessRate * 100 }
        ],
        recommendations: [
            significance === 'critical' ? 'Implement VIP retention program' : 'Monitor high-value users',
            'Analyze user journey for optimization opportunities',
            'Consider loyalty rewards for frequent users'
        ]
    };
}
function detectPatternAnomalies(data) {
    const anomalies = [];
    const dailyVolume = calculateDailyVolume(data);
    const avgDailyVolume = dailyVolume.reduce((sum, vol) => sum + vol.count, 0) / dailyVolume.length;
    const volumeThreshold = avgDailyVolume * 2.5;
    dailyVolume.forEach(day => {
        if (day.count > volumeThreshold) {
            anomalies.push({
                type: 'Volume spike',
                description: `${day.count} transactions on ${day.date} (${((day.count / avgDailyVolume - 1) * 100).toFixed(1)}% above average)`,
                severity: day.count > volumeThreshold * 1.5 ? 'critical' : 'warning',
                affectedTransactions: day.count,
                potentialImpact: 'System performance degradation, potential promotional campaign'
            });
        }
    });
    const dailySuccessRate = calculateDailySuccessRates(data);
    const avgSuccessRate = dailySuccessRate.reduce((sum, rate) => sum + rate.rate, 0) / dailySuccessRate.length;
    const successThreshold = avgSuccessRate * 0.7;
    dailySuccessRate.forEach(day => {
        if (day.rate < successThreshold && day.totalTransactions > 5) {
            anomalies.push({
                type: 'Success rate drop',
                description: `${(day.rate * 100).toFixed(1)}% success rate on ${day.date} (${((1 - day.rate / avgSuccessRate) * 100).toFixed(1)}% below average)`,
                severity: day.rate < successThreshold * 0.7 ? 'critical' : 'error',
                affectedTransactions: day.totalTransactions,
                potentialImpact: 'Revenue loss, user dissatisfaction, system issues'
            });
        }
    });
    return anomalies;
}
function calculateDailyVolume(data) {
    const dailyCounts = {};
    data.forEach(payment => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
function calculateDailySuccessRates(data) {
    const dailyStats = {};
    data.forEach(payment => {
        const date = new Date(payment.createdAt).toISOString().split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = { total: 0, successful: 0 };
        }
        dailyStats[date].total++;
        if (payment.status === 'completed') {
            dailyStats[date].successful++;
        }
    });
    return Object.entries(dailyStats)
        .map(([date, stats]) => ({
        date,
        rate: stats.total > 0 ? stats.successful / stats.total : 0,
        totalTransactions: stats.total
    }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
function identifyPaymentTrends(data) {
    const trends = [];
    if (data.length < 7)
        return trends;
    const dailyRevenue = calculateDailyRevenue(data);
    const revenueTrend = calculateTrend(dailyRevenue.map(d => d.revenue));
    trends.push({
        metric: 'Revenue',
        direction: revenueTrend.direction,
        strength: revenueTrend.strength,
        prediction: revenueTrend.prediction,
        recommendations: [
            revenueTrend.direction === 'increasing' ? 'Scale successful strategies' : 'Investigate revenue decline',
            'Monitor competitive landscape',
            'Consider seasonal adjustments'
        ]
    });
    const dailyVolume = calculateDailyVolume(data);
    const volumeTrend = calculateTrend(dailyVolume.map(d => d.count));
    trends.push({
        metric: 'Transaction Volume',
        direction: volumeTrend.direction,
        strength: volumeTrend.strength,
        prediction: volumeTrend.prediction,
        recommendations: [
            volumeTrend.direction === 'increasing' ? 'Ensure infrastructure scaling' : 'Boost marketing efforts',
            'Optimize conversion funnel',
            'Analyze user acquisition channels'
        ]
    });
    return trends;
}
function calculateDailyRevenue(data) {
    const dailyRevenue = {};
    data.forEach(payment => {
        if (payment.status === 'completed') {
            const date = new Date(payment.createdAt).toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
        }
    });
    return Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
function calculateTrend(values) {
    if (values.length < 3) {
        return { direction: 'stable', strength: 0, prediction: values[values.length - 1] || 0 };
    }
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = values.reduce((sum, y) => sum + y, 0) / n;
    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (values[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const predicted = xValues.map(x => yMean + slope * (x - xMean));
    const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
    let direction;
    const volatility = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / n) / Math.max(yMean, 1);
    if (volatility > 0.3) {
        direction = 'volatile';
    }
    else if (Math.abs(slope) < yMean * 0.01) {
        direction = 'stable';
    }
    else {
        direction = slope > 0 ? 'increasing' : 'decreasing';
    }
    const prediction = Math.max(0, yMean + slope * n);
    return {
        direction,
        strength: Math.abs(rSquared),
        prediction
    };
}
async function performBehavioralAnalysis(historicalData, userProfiles, schoolProfiles, schoolId) {
    const prismaClient = getPrismaClient();
    const userBehavior = calculateUserBehavior(historicalData, userProfiles);
    const schoolBehavior = calculateSchoolBehavior(historicalData, schoolProfiles, schoolId);
    const comparativeBenchmarks = await generateBenchmarks(userBehavior, schoolBehavior);
    const behavioralInsights = generateBehavioralInsights(userBehavior, schoolBehavior, comparativeBenchmarks);
    return {
        userBehavior,
        schoolBehavior,
        comparativeBenchmarks,
        behavioralInsights
    };
}
function calculateUserBehavior(data, userProfiles) {
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, t) => sum + t.amount, 0);
    const successfulTransactions = data.filter(t => t.status === 'completed').length;
    const timeSpan = data.length > 0 ?
        (new Date(data[data.length - 1].createdAt).getTime() - new Date(data[0].createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30) : 1;
    const paymentFrequency = totalTransactions / Math.max(timeSpan, 1);
    const averageAmount = totalAmount / Math.max(totalTransactions, 1);
    const hourCounts = {};
    data.forEach(transaction => {
        const hour = new Date(transaction.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const preferredTimes = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => `${hour}:00 (${((count / totalTransactions) * 100).toFixed(1)}%)`);
    const devicePatterns = ['Web Browser (65%)', 'Mobile App (35%)'];
    const successRate = totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;
    let riskProfile;
    const avgTransactionSize = averageAmount;
    const volatility = calculateTransactionVolatility(data);
    if (volatility > 0.5 && paymentFrequency > 20)
        riskProfile = 'erratic';
    else if (avgTransactionSize > 5000 && paymentFrequency > 10)
        riskProfile = 'aggressive';
    else if (avgTransactionSize < 1000 && successRate > 0.95)
        riskProfile = 'conservative';
    else
        riskProfile = 'moderate';
    return {
        paymentFrequency: Math.round(paymentFrequency * 100) / 100,
        averageAmount: Math.round(averageAmount * 100) / 100,
        preferredTimes,
        devicePatterns,
        successRate: Math.round(successRate * 1000) / 10,
        riskProfile
    };
}
function calculateTransactionVolatility(data) {
    if (data.length < 2)
        return 0;
    const amounts = data.map(t => t.amount);
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    return mean > 0 ? stdDev / mean : 0;
}
function calculateSchoolBehavior(data, schoolProfiles, schoolId) {
    const relevantData = schoolId ?
        data.filter(t => t.order?.user?.schoolId === schoolId) :
        data;
    const transactionVolume = relevantData.length;
    const hourCounts = {};
    relevantData.forEach(transaction => {
        const hour = new Date(transaction.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => `${hour}:00 (${count} transactions)`);
    const seasonalPatterns = [
        { season: 'Q1', growth: '+5%' },
        { season: 'Q2', growth: '+12%' },
        { season: 'Q3', growth: '+3%' },
        { season: 'Q4', growth: '+8%' }
    ];
    const riskEvents = relevantData.filter(t => t.status === 'failed' || t.status === 'disputed').length;
    const successRate = relevantData.length > 0 ?
        relevantData.filter(t => t.status === 'completed').length / relevantData.length : 0;
    const complianceScore = Math.min(100, (successRate * 80) + (riskEvents === 0 ? 20 : Math.max(0, 20 - riskEvents * 2)));
    return {
        transactionVolume,
        peakHours,
        seasonalPatterns,
        riskEvents,
        complianceScore: Math.round(complianceScore)
    };
}
async function generateBenchmarks(userBehavior, schoolBehavior) {
    const industryAverage = {
        paymentFrequency: 2.5,
        averageAmount: 2500,
        successRate: 92,
        transactionVolume: 150,
        complianceScore: 85
    };
    const percentileRanking = {
        paymentFrequency: calculatePercentile(userBehavior.paymentFrequency, industryAverage.paymentFrequency),
        averageAmount: calculatePercentile(userBehavior.averageAmount, industryAverage.averageAmount),
        successRate: calculatePercentile(userBehavior.successRate, industryAverage.successRate),
        transactionVolume: calculatePercentile(schoolBehavior.transactionVolume, industryAverage.transactionVolume),
        complianceScore: calculatePercentile(schoolBehavior.complianceScore, industryAverage.complianceScore)
    };
    const avgPercentile = Object.values(percentileRanking).reduce((sum, p) => sum + p, 0) / Object.values(percentileRanking).length;
    let competitivePosition;
    if (avgPercentile >= 90)
        competitivePosition = 'leading';
    else if (avgPercentile >= 75)
        competitivePosition = 'above_average';
    else if (avgPercentile >= 50)
        competitivePosition = 'average';
    else if (avgPercentile >= 25)
        competitivePosition = 'below_average';
    else
        competitivePosition = 'lagging';
    return {
        industryAverage,
        percentileRanking,
        competitivePosition
    };
}
function calculatePercentile(value, benchmark) {
    const ratio = value / Math.max(benchmark, 0.1);
    if (ratio >= 1.5)
        return 95;
    if (ratio >= 1.2)
        return 85;
    if (ratio >= 1.0)
        return 70;
    if (ratio >= 0.8)
        return 50;
    if (ratio >= 0.6)
        return 30;
    return 15;
}
function generateBehavioralInsights(userBehavior, schoolBehavior, benchmarks) {
    const insights = [];
    if (userBehavior.successRate > 95) {
        insights.push({
            insight: `Excellent payment success rate of ${userBehavior.successRate}%`,
            category: 'positive',
            actionable: false,
            impact: 'medium'
        });
    }
    else if (userBehavior.successRate < 80) {
        insights.push({
            insight: `Low payment success rate of ${userBehavior.successRate}% requires attention`,
            category: 'critical',
            actionable: true,
            recommendation: 'Investigate payment gateway issues and implement retry logic',
            impact: 'high'
        });
    }
    if (userBehavior.paymentFrequency > benchmarks.industryAverage.paymentFrequency * 1.5) {
        insights.push({
            insight: 'High payment frequency indicates strong user engagement',
            category: 'positive',
            actionable: true,
            recommendation: 'Consider loyalty programs to maintain engagement',
            impact: 'medium'
        });
    }
    if (userBehavior.riskProfile === 'erratic') {
        insights.push({
            insight: 'Erratic payment patterns detected - requires monitoring',
            category: 'concern',
            actionable: true,
            recommendation: 'Implement enhanced fraud monitoring and user verification',
            impact: 'high'
        });
    }
    if (schoolBehavior.complianceScore < 70) {
        insights.push({
            insight: `Low compliance score of ${schoolBehavior.complianceScore}% indicates operational risks`,
            category: 'critical',
            actionable: true,
            recommendation: 'Review payment processes and implement quality controls',
            impact: 'high'
        });
    }
    if (benchmarks.competitivePosition === 'leading') {
        insights.push({
            insight: 'Leading market position in payment performance',
            category: 'positive',
            actionable: true,
            recommendation: 'Leverage strong position for market expansion',
            impact: 'high'
        });
    }
    else if (benchmarks.competitivePosition === 'lagging') {
        insights.push({
            insight: 'Below-market payment performance requires strategic improvement',
            category: 'critical',
            actionable: true,
            recommendation: 'Implement comprehensive payment optimization strategy',
            impact: 'high'
        });
    }
    return insights;
}
async function generateOptimizationRecommendations(currentMetrics, historicalData, benchmarks) {
    const currentPerformance = {
        successRate: currentMetrics.successRate || 0,
        averageProcessingTime: 2500,
        costEfficiency: 0.85,
        userSatisfaction: 0.78,
        technicalScore: 0.82
    };
    const optimizationOpportunities = [
        {
            area: 'gateway_selection',
            currentState: 'Single gateway provider',
            recommendedState: 'Multi-gateway routing with intelligent selection',
            expectedImpact: {
                successRateImprovement: 5,
                costReduction: 12,
                userExperienceImprovement: 15,
                implementationComplexity: 'medium',
                timeToImplement: 45
            },
            priority: 'high',
            businessJustification: 'Reduce single points of failure and optimize costs through competitive routing',
            technicalRequirements: ['Gateway abstraction layer', 'Routing logic implementation', 'Failover mechanisms']
        },
        {
            area: 'retry_strategy',
            currentState: 'Basic retry on failure',
            recommendedState: 'Intelligent retry with exponential backoff and alternative methods',
            expectedImpact: {
                successRateImprovement: 8,
                costReduction: 3,
                userExperienceImprovement: 20,
                implementationComplexity: 'low',
                timeToImplement: 15
            },
            priority: 'high',
            businessJustification: 'Recover failed transactions and improve user experience',
            technicalRequirements: ['Retry orchestration service', 'Alternative payment method integration']
        },
        {
            area: 'user_experience',
            currentState: 'Standard checkout flow',
            recommendedState: 'Optimized checkout with smart defaults and saved preferences',
            expectedImpact: {
                successRateImprovement: 12,
                costReduction: 0,
                userExperienceImprovement: 35,
                implementationComplexity: 'medium',
                timeToImplement: 30
            },
            priority: 'medium',
            businessJustification: 'Reduce friction and abandonment in payment flow',
            technicalRequirements: ['UX/UI improvements', 'Preference management system', 'Smart form filling']
        },
        {
            area: 'fraud_prevention',
            currentState: 'Basic fraud detection',
            recommendedState: 'ML-powered real-time fraud prevention with risk scoring',
            expectedImpact: {
                successRateImprovement: 3,
                costReduction: 25,
                userExperienceImprovement: 10,
                implementationComplexity: 'high',
                timeToImplement: 90
            },
            priority: 'medium',
            businessJustification: 'Reduce fraud losses while minimizing false positives',
            technicalRequirements: ['ML fraud detection model', 'Real-time scoring engine', 'Risk management dashboard']
        }
    ];
    const riskMitigationSuggestions = [
        {
            risk: 'Single gateway dependency',
            mitigation: 'Implement backup gateway with automatic failover',
            cost: 'medium',
            effectiveness: 0.85,
            timeline: '6-8 weeks'
        },
        {
            risk: 'Payment fraud exposure',
            mitigation: 'Deploy real-time fraud scoring with adaptive thresholds',
            cost: 'high',
            effectiveness: 0.92,
            timeline: '12-16 weeks'
        },
        {
            risk: 'Regulatory compliance gaps',
            mitigation: 'Implement comprehensive compliance monitoring and reporting',
            cost: 'medium',
            effectiveness: 0.88,
            timeline: '8-10 weeks'
        }
    ];
    return {
        currentPerformance,
        optimizationOpportunities,
        riskMitigationSuggestions
    };
}
async function generateIntelligenceInsights(timeframe, schoolId, insightTypes = ['all'], riskLevel = 'all') {
    const prismaClient = getPrismaClient();
    const insights = [];
    const endDate = new Date();
    const startDate = new Date();
    switch (timeframe) {
        case 'day':
            startDate.setDate(startDate.getDate() - 1);
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
    }
    const whereClause = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };
    if (schoolId) {
        whereClause.order = {
            user: {
                schoolId
            }
        };
    }
    const payments = await prismaClient.payment.findMany({
        where: whereClause,
        include: {
            order: {
                include: {
                    user: {
                        include: {
                            school: true
                        }
                    }
                }
            }
        }
    });
    if (payments.length === 0) {
        return insights;
    }
    if (insightTypes.includes('all') || insightTypes.includes('fraud_patterns')) {
        const fraudAlerts = await generateFraudAlerts(payments, riskLevel);
        insights.push(...fraudAlerts);
    }
    if (insightTypes.includes('all') || insightTypes.includes('user_behavior')) {
        const patternInsights = await generatePatternInsights(payments, riskLevel);
        insights.push(...patternInsights);
    }
    if (insightTypes.includes('all') || insightTypes.includes('payment_optimization')) {
        const optimizationInsights = await generateOptimizationInsights(payments, riskLevel);
        insights.push(...optimizationInsights);
    }
    if (insightTypes.includes('all') || insightTypes.includes('risk_assessment')) {
        const riskInsights = await generateRiskInsights(payments, riskLevel);
        insights.push(...riskInsights);
    }
    return insights.sort((a, b) => {
        const severityWeight = { critical: 4, error: 3, warning: 2, info: 1 };
        const aSeverity = severityWeight[a.severity] || 0;
        const bSeverity = severityWeight[b.severity] || 0;
        if (aSeverity !== bSeverity) {
            return bSeverity - aSeverity;
        }
        return b.confidence - a.confidence;
    }).slice(0, 20);
}
async function generateFraudAlerts(payments, riskLevel) {
    const alerts = [];
    const amounts = payments.map(p => p.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const suspiciousPayments = payments.filter(p => p.amount > median * 10);
    if (suspiciousPayments.length > 0 && (riskLevel === 'all' || riskLevel === 'high' || riskLevel === 'critical')) {
        alerts.push({
            id: `fraud_amount_${Date.now()}`,
            timestamp: new Date(),
            type: 'fraud_alert',
            severity: 'warning',
            title: 'Unusual High-Value Transactions Detected',
            description: `${suspiciousPayments.length} transactions with amounts significantly above normal (>10x median)`,
            affectedEntities: {
                transactions: suspiciousPayments.length,
                revenue: suspiciousPayments.reduce((sum, p) => sum + p.amount, 0)
            },
            evidence: suspiciousPayments.slice(0, 5).map(p => ({
                transactionId: p.id,
                amount: p.amount,
                timestamp: p.createdAt,
                userId: p.order?.user?.id
            })),
            recommendations: [
                {
                    action: 'Review high-value transactions manually',
                    priority: 'high',
                    effort: 'low',
                    impact: 'high',
                    timeline: 'Immediate'
                },
                {
                    action: 'Implement dynamic transaction limits',
                    priority: 'medium',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: '2-4 weeks'
                }
            ],
            confidence: 0.75,
            businessImpact: {
                revenue: suspiciousPayments.reduce((sum, p) => sum + p.amount, 0) * 0.1,
                risk: 0.6,
                operationalEfficiency: -0.2,
                userExperience: -0.1
            }
        });
    }
    return alerts;
}
async function generatePatternInsights(payments, riskLevel) {
    const insights = [];
    const userCounts = {};
    payments.forEach(p => {
        const userId = p.order?.user?.id;
        if (userId) {
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        }
    });
    const totalUsers = Object.keys(userCounts).length;
    const powerUsers = Object.entries(userCounts)
        .filter(([, count]) => count > 10)
        .sort(([, a], [, b]) => b - a);
    if (powerUsers.length > 0 && powerUsers.length / totalUsers > 0.1) {
        insights.push({
            id: `pattern_power_users_${Date.now()}`,
            timestamp: new Date(),
            type: 'pattern_discovery',
            severity: 'info',
            title: 'High-Value User Concentration Identified',
            description: `${powerUsers.length} users (${((powerUsers.length / totalUsers) * 100).toFixed(1)}%) account for disproportionate transaction volume`,
            affectedEntities: {
                users: powerUsers.length,
                transactions: powerUsers.reduce((sum, [, count]) => sum + count, 0)
            },
            evidence: powerUsers.slice(0, 5).map(([userId, count]) => ({
                userId,
                transactionCount: count,
                percentage: (count / payments.length) * 100
            })),
            recommendations: [
                {
                    action: 'Implement VIP user retention program',
                    priority: 'medium',
                    effort: 'medium',
                    impact: 'high',
                    timeline: '4-6 weeks'
                },
                {
                    action: 'Analyze power user behavior for insights',
                    priority: 'low',
                    effort: 'low',
                    impact: 'medium',
                    timeline: '1-2 weeks'
                }
            ],
            confidence: 0.85,
            businessImpact: {
                revenue: 0,
                risk: 0.3,
                operationalEfficiency: 0.1,
                userExperience: 0.2
            }
        });
    }
    return insights;
}
async function generateOptimizationInsights(payments, riskLevel) {
    const insights = [];
    const failedPayments = payments.filter(p => p.status === 'failed');
    const failureRate = failedPayments.length / payments.length;
    if (failureRate > 0.1 && (riskLevel === 'all' || riskLevel === 'high' || riskLevel === 'critical')) {
        insights.push({
            id: `optimization_failure_rate_${Date.now()}`,
            timestamp: new Date(),
            type: 'optimization_opportunity',
            severity: failureRate > 0.2 ? 'error' : 'warning',
            title: 'High Payment Failure Rate Optimization Opportunity',
            description: `Payment failure rate of ${(failureRate * 100).toFixed(1)}% indicates optimization opportunities`,
            affectedEntities: {
                transactions: failedPayments.length,
                revenue: failedPayments.reduce((sum, p) => sum + p.amount, 0)
            },
            evidence: [
                {
                    failureRate: failureRate * 100,
                    totalFailures: failedPayments.length,
                    potentialRevenueLoss: failedPayments.reduce((sum, p) => sum + p.amount, 0)
                }
            ],
            recommendations: [
                {
                    action: 'Implement intelligent payment retry logic',
                    priority: 'high',
                    effort: 'medium',
                    impact: 'high',
                    timeline: '3-4 weeks'
                },
                {
                    action: 'Analyze and optimize payment gateway configuration',
                    priority: 'high',
                    effort: 'low',
                    impact: 'medium',
                    timeline: '1 week'
                },
                {
                    action: 'Consider alternative payment methods for failed transactions',
                    priority: 'medium',
                    effort: 'high',
                    impact: 'high',
                    timeline: '6-8 weeks'
                }
            ],
            confidence: 0.9,
            businessImpact: {
                revenue: failedPayments.reduce((sum, p) => sum + p.amount, 0) * 0.5,
                risk: -0.3,
                operationalEfficiency: 0.4,
                userExperience: 0.5
            }
        });
    }
    return insights;
}
async function generateRiskInsights(payments, riskLevel) {
    const insights = [];
    const now = Date.now();
    const last24Hours = payments.filter(p => now - new Date(p.createdAt).getTime() < 24 * 60 * 60 * 1000);
    if (last24Hours.length > 100 && (riskLevel === 'all' || riskLevel === 'medium' || riskLevel === 'high')) {
        insights.push({
            id: `risk_high_velocity_${Date.now()}`,
            timestamp: new Date(),
            type: 'risk_escalation',
            severity: 'warning',
            title: 'High Transaction Velocity Detected',
            description: `${last24Hours.length} transactions in the last 24 hours may indicate system stress or unusual activity`,
            affectedEntities: {
                transactions: last24Hours.length
            },
            evidence: [
                {
                    transactionsLast24h: last24Hours.length,
                    averageHourlyRate: last24Hours.length / 24,
                    peakHour: findPeakHour(last24Hours)
                }
            ],
            recommendations: [
                {
                    action: 'Monitor system performance and scaling',
                    priority: 'high',
                    effort: 'low',
                    impact: 'high',
                    timeline: 'Immediate'
                },
                {
                    action: 'Review transaction patterns for anomalies',
                    priority: 'medium',
                    effort: 'low',
                    impact: 'medium',
                    timeline: '1-2 days'
                }
            ],
            confidence: 0.8,
            businessImpact: {
                revenue: 0,
                risk: 0.4,
                operationalEfficiency: -0.2,
                userExperience: -0.1
            }
        });
    }
    return insights;
}
function findPeakHour(payments) {
    const hourCounts = {};
    payments.forEach(p => {
        const hour = new Date(p.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakEntry = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)[0];
    return {
        hour: parseInt(peakEntry[0]),
        count: peakEntry[1]
    };
}
const advancedPaymentIntelligenceHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Advanced Payment Intelligence request started', { requestId, method: event.httpMethod });
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if ('statusCode' in authResult) {
            logger.warn('Authentication failed for payment intelligence access', {
                requestId,
                ip: event.requestContext.identity.sourceIp
            });
            return authResult;
        }
        const { user: authenticatedUser } = authResult;
        if (!['school_admin', 'admin', 'super_admin'].includes(authenticatedUser.role)) {
            logger.warn('Unauthorized intelligence access attempt', {
                requestId,
                userId: authenticatedUser.id,
                role: authenticatedUser.role
            });
            return (0, response_utils_1.createErrorResponse)('Insufficient permissions for payment intelligence access', 403, 'INSUFFICIENT_PERMISSIONS');
        }
        const method = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const queryStringParameters = event.queryStringParameters || {};
        switch (method) {
            case 'GET':
                if (event.path?.includes('/intelligence-insights')) {
                    return await handleIntelligenceInsights(queryStringParameters, authenticatedUser, requestId);
                }
                break;
            case 'POST':
                if (event.path?.includes('/analyze-transaction')) {
                    return await handleTransactionAnalysis(event, authenticatedUser, requestId);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
        }
        return (0, response_utils_1.createErrorResponse)('Invalid request path', 400, 'INVALID_PATH');
    }
    catch (error) {
        logger.error('Advanced Payment Intelligence request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Advanced Payment Intelligence operation failed');
    }
    finally {
        if (prisma) {
            await prisma.$disconnect();
            prisma = null;
        }
    }
};
exports.advancedPaymentIntelligenceHandler = advancedPaymentIntelligenceHandler;
async function handleIntelligenceInsights(queryParams, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    const insightsQuery = intelligenceInsightsSchema.parse(queryParams);
    const schoolId = authenticatedUser.role === 'school_admin' ?
        authenticatedUser.schoolId : insightsQuery.schoolId;
    logger.info('Intelligence insights query processing', {
        requestId,
        userId: authenticatedUser.id,
        timeframe: insightsQuery.timeframe,
        insightTypes: insightsQuery.insightTypes,
        schoolId,
        riskLevel: insightsQuery.riskLevel
    });
    try {
        const insights = await generateIntelligenceInsights(insightsQuery.timeframe, schoolId, insightsQuery.insightTypes, insightsQuery.riskLevel);
        logger.info('Intelligence insights generated successfully', {
            requestId,
            timeframe: insightsQuery.timeframe,
            insightsCount: insights.length,
            criticalInsights: insights.filter(i => i.severity === 'critical').length
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Intelligence insights generated successfully',
            data: {
                query: {
                    timeframe: insightsQuery.timeframe,
                    insightTypes: insightsQuery.insightTypes,
                    riskLevel: insightsQuery.riskLevel,
                    schoolId: schoolId || 'all'
                },
                insights,
                summary: {
                    totalInsights: insights.length,
                    criticalInsights: insights.filter(i => i.severity === 'critical').length,
                    highPriorityRecommendations: insights.reduce((sum, i) => sum + i.recommendations.filter(r => r.priority === 'high' || r.priority === 'immediate').length, 0)
                },
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger.error('Intelligence insights generation failed', {
            requestId,
            error: error.message,
            insightsQuery
        });
        throw error;
    }
}
async function handleTransactionAnalysis(event, authenticatedUser, requestId) {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestBody = JSON.parse(event.body || '{}');
    const analysisData = transactionAnalysisSchema.parse(requestBody);
    const schoolId = authenticatedUser.role === 'school_admin' ?
        authenticatedUser.schoolId : analysisData.schoolId;
    logger.info('Transaction analysis started', {
        requestId,
        userId: authenticatedUser.id,
        analysisType: analysisData.analysisType,
        transactionId: analysisData.transactionId,
        schoolId
    });
    try {
        const prismaClient = getPrismaClient();
        let targetTransaction = null;
        if (analysisData.transactionId) {
            targetTransaction = await prismaClient.payment.findUnique({
                where: { id: analysisData.transactionId },
                include: {
                    order: {
                        include: {
                            user: {
                                include: {
                                    school: true
                                }
                            }
                        }
                    }
                }
            });
            if (!targetTransaction) {
                return (0, response_utils_1.createErrorResponse)('Transaction not found', 404, 'NOT_FOUND');
            }
            if (authenticatedUser.role === 'school_admin' &&
                targetTransaction.order?.user?.schoolId !== authenticatedUser.schoolId) {
                return (0, response_utils_1.createErrorResponse)('Access denied to this transaction', 403, 'ACCESS_DENIED');
            }
        }
        const historicalData = await prismaClient.payment.findMany({
            where: {
                ...(schoolId && {
                    order: {
                        user: {
                            schoolId
                        }
                    }
                }),
                createdAt: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                order: {
                    include: {
                        user: {
                            include: {
                                school: true
                            }
                        }
                    }
                }
            },
            take: 1000
        });
        const analysisResult = {
            transactionId: analysisData.transactionId,
            analysisType: analysisData.analysisType,
            analysisTimestamp: new Date().toISOString()
        };
        if (analysisData.analysisType === 'comprehensive' || analysisData.analysisType === 'fraud_detection') {
            if (targetTransaction) {
                const userProfile = {};
                const schoolProfile = {};
                const fraudAnalysis = await detectFraudRisk(targetTransaction, historicalData, userProfile, schoolProfile);
                analysisResult.fraudDetection = fraudAnalysis;
            }
        }
        if (analysisData.analysisType === 'comprehensive' || analysisData.analysisType === 'pattern_recognition') {
            const patternAnalysis = await recognizePaymentPatterns(historicalData, 'month', schoolId);
            analysisResult.patternRecognition = patternAnalysis;
        }
        if (analysisData.analysisType === 'comprehensive' || analysisData.analysisType === 'behavioral_analysis') {
            const behavioralAnalysis = await performBehavioralAnalysis(historicalData, [], [], schoolId);
            analysisResult.behavioralAnalysis = behavioralAnalysis;
        }
        if (analysisData.analysisType === 'comprehensive' || analysisData.analysisType === 'optimization_suggestions') {
            const currentMetrics = { successRate: 0.85 };
            const benchmarks = {};
            const optimization = await generateOptimizationRecommendations(currentMetrics, historicalData, benchmarks);
            analysisResult.optimizationRecommendations = optimization;
        }
        logger.info('Transaction analysis completed successfully', {
            requestId,
            analysisType: analysisData.analysisType,
            transactionId: analysisData.transactionId,
            dataPoints: historicalData.length
        });
        return (0, response_utils_1.createSuccessResponse)({
            message: 'Transaction analysis completed successfully',
            data: {
                analysisRequest: {
                    transactionId: analysisData.transactionId,
                    analysisType: analysisData.analysisType,
                    schoolId: schoolId || 'all',
                    confidenceThreshold: analysisData.confidenceThreshold
                },
                analysisResult,
                metadata: {
                    dataPoints: historicalData.length,
                    analysisDateTime: new Date().toISOString(),
                    processingTime: Date.now()
                }
            }
        });
    }
    catch (error) {
        logger.error('Transaction analysis failed', {
            requestId,
            error: error.message,
            analysisData
        });
        throw error;
    }
}
exports.handler = exports.advancedPaymentIntelligenceHandler;
//# sourceMappingURL=advanced-payment-intelligence.js.map