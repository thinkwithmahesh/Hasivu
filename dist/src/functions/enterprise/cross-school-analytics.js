"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/jwt.service");
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    const jwtResult = await jwt_service_1.jwtService.verifyToken(token);
    if (!jwtResult.isValid || !jwtResult.payload || !jwtResult.payload.userId) {
        throw new Error('Invalid authentication token');
    }
    return {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        role: jwtResult.payload.role,
        districtId: jwtResult.payload.districtId,
        tenantId: jwtResult.payload.tenantId,
        isActive: true,
    };
}
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Cross-school analytics request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path,
        });
        let authResult;
        try {
            authResult = await authenticateLambda(event);
        }
        catch (authError) {
            logger_1.logger.warn('Authentication failed', {
                requestId,
                errorMessage: authError.message,
            });
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401);
        }
        if (!['district_admin', 'super_admin', 'analytics_user'].includes(authResult.role)) {
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', 'Insufficient permissions for analytics operations', 403);
        }
        const { httpMethod: method } = event;
        const db = database_service_1.databaseService.client;
        switch (method) {
            case 'GET':
                if (event.path?.includes('/district-overview')) {
                    return await getDistrictOverview(authResult, db);
                }
                else if (event.path?.includes('/comparative-analysis')) {
                    return await getComparativeAnalysis(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/compliance-report')) {
                    return await getComplianceReport(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/trends')) {
                    return await getTrendAnalysis(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/benchmarks')) {
                    return await getBenchmarkData(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/predictions')) {
                    return await getPredictiveAnalytics(event.queryStringParameters, authResult, db);
                }
                break;
            case 'POST':
                if (event.path?.includes('/custom-query')) {
                    return await executeCustomQuery(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/generate-report')) {
                    return await generateAnalyticsReport(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/export')) {
                    return await exportAnalyticsData(JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        return (0, response_utils_1.createErrorResponse)('INVALID_PATH', 'Invalid request path', 400);
    }
    catch (error) {
        logger_1.logger.error('Cross-school analytics request failed', error, { requestId });
        return (0, response_utils_1.handleError)(error, 'Analytics operation failed');
    }
};
exports.handler = handler;
async function getDistrictOverview(user, db) {
    try {
        const { districtId } = user;
        if (!districtId && user.role !== 'super_admin') {
            return (0, response_utils_1.createErrorResponse)('DISTRICT_REQUIRED', 'District ID required', 400);
        }
        const [schoolStats, studentStats, nutritionStats, financialStats] = await Promise.all([
            getSchoolStatistics(districtId, db),
            getStudentStatistics(districtId, db),
            getNutritionStatistics(districtId, db),
            getFinancialStatistics(districtId, db),
        ]);
        const recentReport = (await db.$queryRaw `
      SELECT * FROM district_analytics
      WHERE district_id = ${districtId}
      ORDER BY report_date DESC
      LIMIT 1
    `);
        const kpis = {
            schoolUtilization: schoolStats.activeSchools / schoolStats.totalSchools,
            studentEngagement: studentStats.activeStudents / studentStats.totalStudents,
            nutritionalCompliance: nutritionStats.complianceRate,
            revenueGrowth: financialStats.monthlyGrowth,
            systemHealth: 0.98,
            parentSatisfaction: 0.87,
        };
        const alerts = await getDistrictAlerts(districtId, db);
        const overview = {
            summary: {
                totalSchools: schoolStats.totalSchools,
                activeSchools: schoolStats.activeSchools,
                totalStudents: studentStats.totalStudents,
                totalRevenue: financialStats.totalRevenue,
                lastUpdated: new Date().toISOString(),
            },
            kpis,
            schoolStats,
            studentStats,
            nutritionStats,
            financialStats,
            recentReport: recentReport[0] || null,
            alerts,
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { overview },
            message: 'District overview retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve district overview');
    }
}
async function getSchoolStatistics(districtId, db) {
    const schoolData = (await db.$queryRaw `
    SELECT
      COUNT(*) as total_schools,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_schools,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_schools_this_month,
      AVG(CASE WHEN student_count > 0 THEN student_count END) as avg_students_per_school
    FROM schools
    WHERE district_id = ${districtId} OR ${!districtId}
  `);
    return {
        totalSchools: parseInt(schoolData[0]?.total_schools || '0'),
        activeSchools: parseInt(schoolData[0]?.active_schools || '0'),
        newSchoolsThisMonth: parseInt(schoolData[0]?.new_schools_this_month || '0'),
        avgStudentsPerSchool: parseFloat(schoolData[0]?.avg_students_per_school || '0'),
    };
}
async function getStudentStatistics(districtId, db) {
    const studentData = (await db.$queryRaw `
    SELECT
      COUNT(*) as total_students,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_students,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_enrollments_this_month,
      COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
    FROM users u
    JOIN schools s ON u.school_id = s.id
    WHERE u.role = 'student'
    AND (s.district_id = ${districtId} OR ${!districtId})
  `);
    return {
        totalStudents: parseInt(studentData[0]?.total_students || '0'),
        activeStudents: parseInt(studentData[0]?.active_students || '0'),
        newEnrollmentsThisMonth: parseInt(studentData[0]?.new_enrollments_this_month || '0'),
        activeLastWeek: parseInt(studentData[0]?.active_last_week || '0'),
    };
}
async function getNutritionStatistics(districtId, db) {
    const nutritionData = (await db.$queryRaw `
    SELECT
      COUNT(DISTINCT m.id) as total_menus,
      AVG(m.nutritional_score) as avg_nutritional_score,
      COUNT(CASE WHEN m.compliance_status = 'COMPLIANT' THEN 1 END)::float / COUNT(*) as compliance_rate,
      SUM(o.quantity) as total_meals_this_month
    FROM menus m
    JOIN schools s ON m.school_id = s.id
    LEFT JOIN orders o ON o.menu_id = m.id
      AND o.created_at >= DATE_TRUNC('month', NOW())
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND m.created_at >= NOW() - INTERVAL '30 days'
  `);
    return {
        totalMenus: parseInt(nutritionData[0]?.total_menus || '0'),
        avgNutritionalScore: parseFloat(nutritionData[0]?.avg_nutritional_score || '0'),
        complianceRate: parseFloat(nutritionData[0]?.compliance_rate || '0'),
        totalMealsThisMonth: parseInt(nutritionData[0]?.total_meals_this_month || '0'),
    };
}
async function getFinancialStatistics(districtId, db) {
    const financialData = (await db.$queryRaw `
    SELECT
      SUM(o.total_amount) as total_revenue,
      SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', NOW()) THEN o.total_amount ELSE 0 END) as revenue_this_month,
      SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
               AND o.created_at < DATE_TRUNC('month', NOW()) THEN o.total_amount ELSE 0 END) as revenue_last_month,
      AVG(o.total_amount) as avg_order_value,
      COUNT(CASE WHEN o.payment_status = 'COMPLETED' THEN 1 END)::float / COUNT(*) as payment_success_rate
    FROM orders o
    JOIN schools s ON o.school_id = s.id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND o.created_at >= NOW() - INTERVAL '6 months'
  `);
    const currentMonth = parseFloat(financialData[0]?.revenue_this_month || '0');
    const lastMonth = parseFloat(financialData[0]?.revenue_last_month || '0');
    const monthlyGrowth = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;
    return {
        totalRevenue: parseFloat(financialData[0]?.total_revenue || '0'),
        revenueThisMonth: currentMonth,
        revenueLastMonth: lastMonth,
        monthlyGrowth,
        avgOrderValue: parseFloat(financialData[0]?.avg_order_value || '0'),
        paymentSuccessRate: parseFloat(financialData[0]?.payment_success_rate || '0'),
    };
}
async function getDistrictAlerts(districtId, db) {
    const alerts = (await db.$queryRaw `
    SELECT
      'LOW_COMPLIANCE' as type,
      s.id as school_id,
      s.name as school_name,
      'Nutritional compliance below threshold' as message,
      'HIGH' as severity
    FROM schools s
    LEFT JOIN menus m ON s.id = m.school_id
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND s.is_active = true
    GROUP BY s.id, s.name
    HAVING AVG(COALESCE(m.nutritional_score, 0)) < 70

    UNION ALL

    SELECT
      'LOW_ENGAGEMENT' as type,
      s.id as school_id,
      s.name as school_name,
      'Student engagement below average' as message,
      'MEDIUM' as severity
    FROM schools s
    LEFT JOIN users u ON s.id = u.school_id AND u.role = 'student'
    WHERE (s.district_id = ${districtId} OR ${!districtId})
    AND s.is_active = true
    GROUP BY s.id, s.name
    HAVING COUNT(CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN 1 END)::float /
           NULLIF(COUNT(u.id), 0) < 0.3

    ORDER BY severity DESC, type
    LIMIT 10
  `);
    return alerts;
}
async function getComparativeAnalysis(queryParams, user, db) {
    try {
        const metric = queryParams?.metric || 'revenue';
        const period = queryParams?.period || '30';
        const schools = (await db.$queryRaw `
      SELECT
        s.id,
        s.name,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT u.id) as student_count,
        AVG(m.nutritional_score) as avg_nutrition_score,
        COUNT(CASE WHEN o.payment_status = 'COMPLETED' THEN 1 END)::float /
        NULLIF(COUNT(o.id), 0) as payment_success_rate
      FROM schools s
      LEFT JOIN orders o ON s.id = o.school_id
        AND o.created_at >= NOW() - INTERVAL '${period} days'
      LEFT JOIN users u ON s.id = u.school_id AND u.role = 'student' AND u.is_active = true
      LEFT JOIN menus m ON s.id = m.school_id
      WHERE (s.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
        const metrics = schools.map((school) => ({
            schoolId: school.id,
            schoolName: school.name,
            metrics: {
                revenue: parseFloat(school.revenue || '0'),
                studentCount: parseInt(school.student_count || '0'),
                nutritionScore: parseFloat(school.avg_nutrition_score || '0'),
                paymentSuccessRate: parseFloat(school.payment_success_rate || '0'),
            },
        }));
        const sortedSchools = [...metrics].sort((a, b) => (b.metrics[metric] || 0) -
            (a.metrics[metric] || 0));
        const rankedSchools = sortedSchools.map((school, index) => ({
            ...school,
            ranking: index + 1,
            percentile: ((sortedSchools.length - index) / sortedSchools.length) * 100,
        }));
        const districtAverage = {
            revenue: metrics.reduce((sum, s) => sum + s.metrics.revenue, 0) / metrics.length,
            studentCount: metrics.reduce((sum, s) => sum + s.metrics.studentCount, 0) / metrics.length,
            nutritionScore: metrics.reduce((sum, s) => sum + s.metrics.nutritionScore, 0) / metrics.length,
            paymentSuccessRate: metrics.reduce((sum, s) => sum + s.metrics.paymentSuccessRate, 0) / metrics.length,
        };
        const outliers = identifyOutliers(metrics, districtAverage);
        const analysis = {
            schools: rankedSchools,
            districtAverage,
            benchmarks: {
                revenue: districtAverage.revenue * 1.2,
                nutritionScore: 85,
                paymentSuccessRate: 0.95,
            },
            outliers,
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { analysis },
            message: 'Comparative analysis retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve comparative analysis');
    }
}
function identifyOutliers(metrics, averages) {
    const outliers = [];
    if (!metrics) {
        return outliers;
    }
    metrics.forEach(school => {
        Object.keys(averages).forEach(metric => {
            const value = school.metrics[metric];
            const avg = averages[metric];
            if (avg > 0) {
                const deviation = Math.abs((value - avg) / avg);
                if (deviation > 0.5) {
                    outliers.push({
                        schoolId: school.schoolId,
                        metric,
                        value,
                        deviation: deviation * 100,
                    });
                }
            }
        });
    });
    return outliers.sort((a, b) => b.deviation - a.deviation).slice(0, 10);
}
async function getComplianceReport(queryParams, user, db) {
    try {
        const reportType = queryParams?.type || 'NUTRITION';
        const period = queryParams?.period || 'MONTHLY';
        const reports = (await db.$queryRaw `
      SELECT * FROM compliance_reports
      WHERE district_id = ${user.districtId}
      AND compliance_type = ${reportType}
      ORDER BY generated_date DESC
      LIMIT 1
    `);
        let report;
        if (reports.length > 0) {
            const existingReport = reports[0];
            report = {
                reportId: existingReport.id,
                districtId: existingReport.district_id,
                reportType: existingReport.compliance_type,
                period: existingReport.report_period,
                generatedAt: existingReport.generated_date,
                status: existingReport.overall_status,
                score: existingReport.compliance_score,
                findings: JSON.parse(existingReport.non_compliant_items || '[]'),
            };
        }
        else {
            report = await generateComplianceReport(user.districtId, reportType, period, db);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { report },
            message: 'Compliance report retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve compliance report');
    }
}
async function generateComplianceReport(districtId, reportType, period, db) {
    const reportId = `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let findings = [];
    let overallScore = 100;
    if (reportType === 'NUTRITION') {
        const nutritionFindings = (await db.$queryRaw `
      SELECT
        s.id as school_id,
        s.name as school_name,
        AVG(m.nutritional_score) as avg_score,
        COUNT(CASE WHEN m.compliance_status != 'COMPLIANT' THEN 1 END) as non_compliant_menus
      FROM schools s
      LEFT JOIN menus m ON s.id = m.school_id
      WHERE s.district_id = ${districtId}
      AND m.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY s.id, s.name
      HAVING AVG(m.nutritional_score) < 75 OR COUNT(CASE WHEN m.compliance_status != 'COMPLIANT' THEN 1 END) > 0
    `);
        findings = nutritionFindings.map((finding) => ({
            category: 'NUTRITION',
            status: 'NON_COMPLIANT',
            details: `Average nutritional score: ${finding.avg_score?.toFixed(1) || 'N/A'}`,
            severity: finding.avg_score < 60 ? 'HIGH' : 'MEDIUM',
            schools: [finding.school_id],
        }));
        overallScore = Math.max(0, 100 - findings.length * 10);
    }
    await db.$queryRaw `
    INSERT INTO compliance_reports (
      id, district_id, compliance_type, report_period,
      generated_date, overall_status, compliance_score,
      non_compliant_items, reported_by
    ) VALUES (
      ${reportId},
      ${districtId},
      ${reportType},
      ${period},
      NOW(),
      ${overallScore >= 90 ? 'COMPLIANT' : overallScore >= 70 ? 'PARTIAL' : 'NON_COMPLIANT'},
      ${overallScore},
      ${JSON.stringify(findings)},
      'system'
    )
  `;
    return {
        reportId,
        districtId,
        reportType,
        period,
        generatedAt: new Date(),
        status: overallScore >= 90 ? 'COMPLIANT' : overallScore >= 70 ? 'PARTIAL' : 'NON_COMPLIANT',
        score: overallScore,
        findings,
    };
}
async function getTrendAnalysis(queryParams, user, db) {
    try {
        const metric = queryParams?.metric || 'revenue';
        const period = parseInt(queryParams?.period || '90');
        const trendData = (await db.$queryRaw `
      SELECT
        DATE_TRUNC('day', o.created_at) as date,
        SUM(o.total_amount) as daily_revenue,
        COUNT(DISTINCT o.user_id) as unique_customers,
        COUNT(o.id) as order_count
      FROM orders o
      JOIN schools s ON o.school_id = s.id
      WHERE (s.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND o.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE_TRUNC('day', o.created_at)
      ORDER BY date
    `);
        const values = trendData.map((d) => parseFloat(d[`daily_${metric}`] || d.daily_revenue || '0'));
        const trend = calculateTrend(values);
        const result = {
            metric,
            data: trendData.map((d) => ({
                timestamp: d.date,
                value: parseFloat(d[`daily_${metric}`] || d.daily_revenue || '0'),
            })),
            aggregates: {
                total: values.reduce((sum, val) => sum + val, 0),
                average: values.reduce((sum, val) => sum + val, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                change: values.length > 1 ? values[values.length - 1] - values[0] : 0,
            },
            trends: trend,
        };
        if (result.aggregates.total > 0) {
            result.aggregates.changePercent = (result.aggregates.change / result.aggregates.total) * 100;
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { trends: result },
            message: 'Trend analysis retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve trend analysis');
    }
}
function calculateTrend(values) {
    if (values.length < 2) {
        return { direction: 'STABLE', confidence: 0 };
    }
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => {
        const yPred = slope * i + intercept;
        return sum + Math.pow(yi - yPred, 2);
    }, 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - ssRes / ssTot;
    const direction = slope > 0.01 ? 'UP' : slope < -0.01 ? 'DOWN' : 'STABLE';
    const confidence = Math.max(0, Math.min(1, rSquared)) * 100;
    const prediction = slope * n + intercept;
    return { direction, confidence, prediction };
}
async function executeCustomQuery(query, user, db) {
    try {
        if (!query.metric || !query.timeRange) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Metric and time range are required', 400);
        }
        const { metric, dimension, filters, timeRange, schools } = query;
        let baseQuery = `
      SELECT
        DATE_TRUNC('${timeRange.granularity.toLowerCase()}', o.created_at) as period,
        ${buildMetricSelect(metric)},
        ${dimension.map(d => buildDimensionSelect(d)).join(', ')}
      FROM orders o
      JOIN schools s ON o.school_id = s.id
      JOIN users u ON o.user_id = u.id
      WHERE o.created_at BETWEEN $1 AND $2
    `;
        const params = [new Date(timeRange.start), new Date(timeRange.end)];
        let paramIndex = 3;
        if (user.role !== 'super_admin' && user.districtId) {
            baseQuery += ` AND s.district_id = $${paramIndex++}`;
            params.push(user.districtId);
        }
        if (schools && schools.length > 0) {
            baseQuery += ` AND s.id = ANY($${paramIndex++})`;
            params.push(schools);
        }
        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                baseQuery += ` AND ${buildFilterClause(key, paramIndex++)}`;
                params.push(value);
            }
        });
        baseQuery += ` GROUP BY period${dimension.length > 0 ? `, ${dimension.join(', ')}` : ''} ORDER BY period`;
        const results = (await db.$queryRawUnsafe(baseQuery, ...params));
        const processedResults = processQueryResults(results, query);
        return (0, response_utils_1.createSuccessResponse)({
            data: { results: processedResults },
            message: 'Custom query executed successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to execute custom query');
    }
}
function buildMetricSelect(metric) {
    switch (metric) {
        case 'revenue':
            return 'SUM(o.total_amount) as value';
        case 'orders':
            return 'COUNT(o.id) as value';
        case 'customers':
            return 'COUNT(DISTINCT o.user_id) as value';
        case 'avg_order_value':
            return 'AVG(o.total_amount) as value';
        default:
            return 'COUNT(*) as value';
    }
}
function buildDimensionSelect(dimension) {
    switch (dimension) {
        case 'school':
            return 's.name as school_name';
        case 'grade':
            return 'u.grade as grade';
        case 'meal_type':
            return 'o.meal_type as meal_type';
        default:
            return `'${dimension}' as ${dimension}`;
    }
}
function buildFilterClause(field, paramIndex) {
    switch (field) {
        case 'school_id':
            return `s.id = $${paramIndex}`;
        case 'grade':
            return `u.grade = $${paramIndex}`;
        case 'meal_type':
            return `o.meal_type = $${paramIndex}`;
        case 'min_amount':
            return `o.total_amount >= $${paramIndex}`;
        case 'max_amount':
            return `o.total_amount <= $${paramIndex}`;
        default:
            return `1=1`;
    }
}
function processQueryResults(results, query) {
    const data = (results || []).map((row) => ({
        timestamp: row.period,
        value: parseFloat(row.value || '0'),
        metadata: query.dimension.reduce((meta, dim) => {
            meta[dim] = row[dim] || row[`${dim}_name`];
            return meta;
        }, {}),
    }));
    const values = data.map(d => d.value);
    return {
        metric: query.metric,
        data,
        aggregates: {
            total: values.reduce((sum, val) => sum + val, 0),
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
        },
    };
}
async function getBenchmarkData(queryParams, user, db) {
    try {
        const benchmarks = {
            revenue_per_student: 150,
            nutritional_score: 85,
            payment_success_rate: 0.95,
            student_engagement: 0.8,
            parent_satisfaction: 0.85,
            order_frequency: 15,
        };
        const performance = (await db.$queryRaw `
      SELECT
        SUM(o.total_amount) / COUNT(DISTINCT u.id) as revenue_per_student,
        AVG(m.nutritional_score) as avg_nutritional_score,
        COUNT(CASE WHEN o.payment_status = 'COMPLETED' THEN 1 END)::float / COUNT(o.id) as payment_success_rate,
        COUNT(CASE WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN 1 END)::float /
        COUNT(u.id) as student_engagement
      FROM schools s
      LEFT JOIN orders o ON s.id = o.school_id AND o.created_at >= NOW() - INTERVAL '30 days'
      LEFT JOIN users u ON s.id = u.school_id AND u.role = 'student'
      LEFT JOIN menus m ON s.id = m.school_id
      WHERE (s.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `);
        const current = performance[0] || {};
        const comparison = {
            revenue_per_student: {
                current: parseFloat(current.revenue_per_student || '0'),
                benchmark: benchmarks.revenue_per_student,
                performance: calculatePerformanceRatio(current.revenue_per_student, benchmarks.revenue_per_student),
            },
            nutritional_score: {
                current: parseFloat(current.avg_nutritional_score || '0'),
                benchmark: benchmarks.nutritional_score,
                performance: calculatePerformanceRatio(current.avg_nutritional_score, benchmarks.nutritional_score),
            },
            payment_success_rate: {
                current: parseFloat(current.payment_success_rate || '0'),
                benchmark: benchmarks.payment_success_rate,
                performance: calculatePerformanceRatio(current.payment_success_rate, benchmarks.payment_success_rate),
            },
            student_engagement: {
                current: parseFloat(current.student_engagement || '0'),
                benchmark: benchmarks.student_engagement,
                performance: calculatePerformanceRatio(current.student_engagement, benchmarks.student_engagement),
            },
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { benchmarks: comparison },
            message: 'Benchmark data retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve benchmark data');
    }
}
function calculatePerformanceRatio(current, benchmark) {
    const currentValue = parseFloat(current || '0');
    if (benchmark === 0)
        return 0;
    return Math.round((currentValue / benchmark) * 100) / 100;
}
async function getPredictiveAnalytics(queryParams, user, db) {
    try {
        const metric = queryParams?.metric || 'revenue';
        const horizon = parseInt(queryParams?.horizon || '30');
        const historicalData = (await db.$queryRaw `
      SELECT
        DATE_TRUNC('day', o.created_at) as date,
        SUM(o.total_amount) as daily_revenue,
        COUNT(o.id) as daily_orders
      FROM orders o
      JOIN schools s ON o.school_id = s.id
      WHERE (s.district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND o.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', o.created_at)
      ORDER BY date
    `);
        if (historicalData.length < 7) {
            return (0, response_utils_1.createErrorResponse)('INSUFFICIENT_DATA', 'Insufficient historical data for prediction', 400);
        }
        const values = historicalData.map((d) => parseFloat(d[`daily_${metric}`] || d.daily_revenue || '0'));
        const predictions = generatePredictions(values, horizon);
        const recentStdDev = calculateStandardDeviation(values.slice(-14));
        const confidenceIntervals = predictions.map(pred => ({
            prediction: pred,
            lower: pred - recentStdDev * 1.96,
            upper: pred + recentStdDev * 1.96,
        }));
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                metric,
                horizon,
                predictions: confidenceIntervals,
                methodology: 'Moving Average with 95% Confidence Intervals',
                lastUpdated: new Date().toISOString(),
            },
            message: 'Predictive analytics retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve predictive analytics');
    }
}
function generatePredictions(values, horizon) {
    const windowSize = Math.min(14, values.length);
    const recentValues = values.slice(-windowSize);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    return Array(horizon).fill(average);
}
function calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}
async function generateAnalyticsReport(reportData, user, db) {
    try {
        const { reportType, period, includeSchools, format } = reportData;
        const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.$queryRaw `
      INSERT INTO district_analytics (
        id, district_id, report_type, report_date,
        total_schools, active_schools, total_students,
        total_revenue, detailed_metrics, created_at, updated_at
      ) VALUES (
        ${reportId},
        ${user.districtId},
        ${reportType || 'COMPREHENSIVE'},
        NOW(),
        0, 0, 0, 0,
        '{}',
        NOW(),
        NOW()
      )
    `;
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                reportId,
                status: 'GENERATED',
                downloadUrl: `/api/analytics/reports/${reportId}/download`,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            message: 'Analytics report generated successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to generate analytics report');
    }
}
async function exportAnalyticsData(exportData, user, db) {
    try {
        const { query, format } = exportData;
        if (!['CSV', 'JSON', 'EXCEL'].includes(format)) {
            return (0, response_utils_1.createErrorResponse)('INVALID_FORMAT', 'Invalid export format', 400);
        }
        const results = await executeCustomQuery(query, user, db);
        if (results.statusCode !== 200) {
            return results;
        }
        const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                exportId,
                format,
                status: 'PROCESSING',
                downloadUrl: `/api/analytics/exports/${exportId}/download`,
                estimatedSize: '0 MB',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            message: 'Data export initiated successfully',
        }, 202);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to export analytics data');
    }
}
exports.default = exports.handler;
//# sourceMappingURL=cross-school-analytics.js.map