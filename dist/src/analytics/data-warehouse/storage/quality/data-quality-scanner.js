"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataQualityScanner = void 0;
const logger_1 = require("../../../../utils/logger");
class DataQualityScanner {
    config;
    qualityChecks = new Map();
    scanHistory = new Map();
    constructor(config = {}) {
        this.config = {
            enableScanning: true,
            autoScan: true,
            scanInterval: 3600,
            qualityThreshold: 0.8,
            sampleSize: 10000,
            maxIssuesPerCheck: 100,
            retentionDays: 90,
            ...config
        };
        this.initializeDefaultChecks();
        logger_1.logger.info('DataQualityScanner initialized', {
            enableScanning: this.config.enableScanning,
            qualityThreshold: this.config.qualityThreshold
        });
    }
    async scanDataset(datasetId, data) {
        const startTime = Date.now();
        const scanId = `scan_${datasetId}_${Date.now()}`;
        try {
            if (!this.config.enableScanning) {
                throw new Error('Data quality scanning is disabled');
            }
            logger_1.logger.info('Starting data quality scan', {
                datasetId,
                scanId,
                recordCount: data?.length || 0
            });
            const sampleData = this.sampleData(data);
            const metrics = {
                completeness: 0,
                accuracy: 0,
                consistency: 0,
                validity: 0,
                uniqueness: 0,
                timeliness: 0,
                totalRecords: data?.length || 0,
                qualityScore: 0
            };
            const issues = [];
            const recommendations = [];
            for (const [checkId, check] of this.qualityChecks) {
                try {
                    const checkResult = await this.runQualityCheck(check, sampleData, datasetId);
                    if (checkResult.issue) {
                        issues.push(checkResult.issue);
                    }
                    this.updateMetrics(metrics, check, checkResult);
                    if (checkResult.recommendation) {
                        recommendations.push(checkResult.recommendation);
                    }
                }
                catch (error) {
                    logger_1.logger.warn('Quality check failed', { checkId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
                }
            }
            const overallScore = this.calculateOverallScore(metrics);
            metrics.qualityScore = overallScore;
            const executionTime = Date.now() - startTime;
            const result = {
                datasetId,
                scanId,
                timestamp: new Date(),
                metrics,
                issues,
                recommendations: this.deduplicateRecommendations(recommendations),
                overallScore,
                executionTime
            };
            this.storeScanResult(datasetId, result);
            logger_1.logger.info('Data quality scan completed', {
                datasetId,
                scanId,
                overallScore,
                issueCount: issues.length,
                executionTime
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Data quality scan failed', { datasetId, scanId, error });
            throw new Error(`Data quality scan failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async addQualityCheck(check) {
        try {
            logger_1.logger.info('Adding quality check', { checkId: check.id, name: check.name });
            this.qualityChecks.set(check.id, check);
            logger_1.logger.info('Quality check added successfully', { checkId: check.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to add quality check', { checkId: check.id, error });
            throw new Error(`Quality check addition failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async removeQualityCheck(checkId) {
        try {
            logger_1.logger.info('Removing quality check', { checkId });
            if (!this.qualityChecks.has(checkId)) {
                throw new Error(`Quality check not found: ${checkId}`);
            }
            this.qualityChecks.delete(checkId);
            logger_1.logger.info('Quality check removed successfully', { checkId });
        }
        catch (error) {
            logger_1.logger.error('Failed to remove quality check', { checkId, error });
            throw new Error(`Quality check removal failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getQualityReport(datasetId) {
        try {
            const scanResults = this.scanHistory.get(datasetId) || [];
            if (scanResults.length === 0) {
                throw new Error(`No quality scans found for dataset: ${datasetId}`);
            }
            const latestScan = scanResults[scanResults.length - 1];
            const trend = this.calculateQualityTrend(scanResults);
            const report = {
                datasetId,
                generatedAt: new Date(),
                latestScan,
                historicalData: scanResults.slice(-10),
                trend,
                summary: {
                    currentScore: latestScan.overallScore,
                    averageScore: trend.averageScore,
                    trendDirection: trend.trend,
                    criticalIssues: latestScan.issues.filter(i => i.severity === 'critical').length,
                    totalIssues: latestScan.issues.length
                },
                recommendations: this.generateReportRecommendations(latestScan, trend)
            };
            return report;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate quality report', { datasetId, error });
            throw new Error(`Quality report generation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getQualityTrends(datasetId, days = 30) {
        try {
            const scanResults = this.scanHistory.get(datasetId) || [];
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const recentScans = scanResults.filter(scan => scan.timestamp >= cutoffDate);
            if (recentScans.length === 0) {
                throw new Error(`No recent quality scans found for dataset: ${datasetId}`);
            }
            return this.calculateQualityTrend(recentScans);
        }
        catch (error) {
            logger_1.logger.error('Failed to get quality trends', { datasetId, error });
            throw new Error(`Quality trends retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getDatasetSummary(datasetId) {
        try {
            const scanResults = this.scanHistory.get(datasetId) || [];
            if (scanResults.length === 0) {
                return {
                    latestScore: 0,
                    lastScanDate: new Date(0),
                    totalScans: 0,
                    criticalIssues: 0,
                    status: 'critical'
                };
            }
            const latestScan = scanResults[scanResults.length - 1];
            const criticalIssues = latestScan.issues.filter(i => i.severity === 'critical').length;
            let status = 'healthy';
            if (latestScan.overallScore < 0.6 || criticalIssues > 0) {
                status = 'critical';
            }
            else if (latestScan.overallScore < 0.8) {
                status = 'warning';
            }
            return {
                latestScore: latestScan.overallScore,
                lastScanDate: latestScan.timestamp,
                totalScans: scanResults.length,
                criticalIssues,
                status
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get dataset summary', { datasetId, error });
            throw new Error(`Dataset summary retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    initializeDefaultChecks() {
        this.qualityChecks.set('null_check', {
            id: 'null_check',
            name: 'Null Value Check',
            description: 'Check for null or missing values in required fields',
            severity: 'high',
            category: 'completeness',
            rule: {
                type: 'null_check',
                parameters: { threshold: 0.05 }
            }
        });
        this.qualityChecks.set('duplicate_check', {
            id: 'duplicate_check',
            name: 'Duplicate Record Check',
            description: 'Check for duplicate records based on key fields',
            severity: 'medium',
            category: 'uniqueness',
            rule: {
                type: 'duplicate_check',
                parameters: { keyFields: ['id'] }
            }
        });
        this.qualityChecks.set('data_type_check', {
            id: 'data_type_check',
            name: 'Data Type Validation',
            description: 'Validate data types against expected schema',
            severity: 'high',
            category: 'validity',
            rule: {
                type: 'data_type_check',
                parameters: {}
            }
        });
        this.qualityChecks.set('range_check', {
            id: 'range_check',
            name: 'Range Validation',
            description: 'Check if numeric values fall within expected ranges',
            severity: 'medium',
            category: 'validity',
            rule: {
                type: 'range_check',
                parameters: { numericFields: true }
            }
        });
        this.qualityChecks.set('pattern_check', {
            id: 'pattern_check',
            name: 'Pattern Validation',
            description: 'Validate string patterns (email, phone, etc.)',
            severity: 'medium',
            category: 'validity',
            rule: {
                type: 'pattern_check',
                parameters: {}
            }
        });
        this.qualityChecks.set('referential_integrity', {
            id: 'referential_integrity',
            name: 'Referential Integrity',
            description: 'Check foreign key relationships',
            severity: 'high',
            category: 'consistency',
            rule: {
                type: 'referential_integrity',
                parameters: {}
            }
        });
    }
    sampleData(data) {
        if (!data || data.length <= this.config.sampleSize) {
            return data;
        }
        const step = Math.floor(data.length / this.config.sampleSize);
        const sample = [];
        for (let i = 0; i < data.length; i += step) {
            sample.push(data[i]);
            if (sample.length >= this.config.sampleSize) {
                break;
            }
        }
        return sample;
    }
    async runQualityCheck(check, data, datasetId) {
        switch (check.rule.type) {
            case 'null_check':
                return this.runNullCheck(check, data);
            case 'duplicate_check':
                return this.runDuplicateCheck(check, data);
            case 'data_type_check':
                return this.runDataTypeCheck(check, data);
            case 'range_check':
                return this.runRangeCheck(check, data);
            case 'pattern_check':
                return this.runPatternCheck(check, data);
            case 'referential_integrity':
                return this.runReferentialIntegrityCheck(check, data);
            default:
                return { score: 1.0 };
        }
    }
    runNullCheck(check, data) {
        if (!data || data.length === 0) {
            return { score: 0 };
        }
        const threshold = check.rule.parameters?.threshold || 0.05;
        const issues = [];
        const columns = Object.keys(data[0] || {});
        const columnIssues = {};
        data.forEach((record, index) => {
            columns.forEach(column => {
                if (record[column] == null) {
                    columnIssues[column] = (columnIssues[column] || 0) + 1;
                }
            });
        });
        const problematicColumns = Object.entries(columnIssues)
            .filter(([_, count]) => (count / data.length) > threshold)
            .map(([column, count]) => ({ column, count, percentage: count / data.length }));
        if (problematicColumns.length > 0) {
            const affectedRecords = Math.max(...problematicColumns.map(c => c.count));
            const affectedColumns = problematicColumns.map(c => c.column);
            const issue = {
                checkId: check.id,
                severity: check.severity,
                category: check.category,
                description: `High null value percentage in columns: ${affectedColumns.join(', ')}`,
                affectedRecords,
                affectedColumns,
                sampleValues: [],
                suggestedFix: 'Review data collection process and implement validation rules'
            };
            const score = Math.max(0, 1 - (problematicColumns.length / columns.length));
            return {
                issue,
                recommendation: 'Consider implementing default values or mandatory field validation',
                score
            };
        }
        return { score: 1.0 };
    }
    runDuplicateCheck(check, data) {
        if (!data || data.length === 0) {
            return { score: 1.0 };
        }
        const keyFields = check.rule.parameters?.keyFields || ['id'];
        const seen = new Set();
        const duplicates = [];
        data.forEach((record, index) => {
            const key = keyFields.map((field) => record[field]).join('|');
            if (seen.has(key)) {
                duplicates.push({ record, index });
            }
            else {
                seen.add(key);
            }
        });
        if (duplicates.length > 0) {
            const issue = {
                checkId: check.id,
                severity: check.severity,
                category: check.category,
                description: `Found ${duplicates.length} duplicate records`,
                affectedRecords: duplicates.length,
                affectedColumns: keyFields,
                sampleValues: duplicates.slice(0, 5).map(d => d.record),
                suggestedFix: 'Implement unique constraints or deduplication process'
            };
            const score = Math.max(0, 1 - (duplicates.length / data.length));
            return {
                issue,
                recommendation: 'Add unique constraints on key fields and implement deduplication',
                score
            };
        }
        return { score: 1.0 };
    }
    runDataTypeCheck(check, data) {
        if (!data || data.length === 0) {
            return { score: 1.0 };
        }
        const columns = Object.keys(data[0]);
        const typeIssues = [];
        columns.forEach(column => {
            const values = data.map(record => record[column]).filter(val => val != null);
            if (values.length === 0)
                return;
            const expectedType = this.inferExpectedType(values);
            const incorrectValues = values.filter(val => typeof val !== expectedType);
            if (incorrectValues.length > values.length * 0.1) {
                typeIssues.push({
                    column,
                    expectedType,
                    incorrectCount: incorrectValues.length,
                    sampleIncorrect: incorrectValues.slice(0, 3)
                });
            }
        });
        if (typeIssues.length > 0) {
            const totalIncorrect = typeIssues.reduce((sum, issue) => sum + issue.incorrectCount, 0);
            const issue = {
                checkId: check.id,
                severity: check.severity,
                category: check.category,
                description: `Data type inconsistencies in ${typeIssues.length} columns`,
                affectedRecords: totalIncorrect,
                affectedColumns: typeIssues.map(issue => issue.column),
                sampleValues: typeIssues.flatMap(issue => issue.sampleIncorrect),
                suggestedFix: 'Implement data type validation and conversion rules'
            };
            const score = Math.max(0, 1 - (typeIssues.length / columns.length));
            return {
                issue,
                recommendation: 'Add data type validation and conversion in ETL pipeline',
                score
            };
        }
        return { score: 1.0 };
    }
    runRangeCheck(check, data) {
        if (!data || data.length === 0) {
            return { score: 1.0 };
        }
        const numericColumns = this.getNumericColumns(data);
        const outliers = [];
        numericColumns.forEach(column => {
            const values = data.map(record => record[column])
                .filter(val => val != null && typeof val === 'number');
            if (values.length === 0)
                return;
            const { q1, q3, iqr } = this.calculateQuartiles(values);
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            const columnOutliers = data.filter(record => {
                const value = record[column];
                return typeof value === 'number' && (value < lowerBound || value > upperBound);
            });
            if (columnOutliers.length > values.length * 0.05) {
                outliers.push(...columnOutliers.map(record => ({ record, column })));
            }
        });
        if (outliers.length > 0) {
            const issue = {
                checkId: check.id,
                severity: check.severity,
                category: check.category,
                description: `Found ${outliers.length} values outside expected ranges`,
                affectedRecords: outliers.length,
                affectedColumns: Array.from(new Set(outliers.map(o => o.column))),
                sampleValues: outliers.slice(0, 5).map(o => o.record),
                suggestedFix: 'Review data collection and implement range validation'
            };
            const score = Math.max(0, 1 - (outliers.length / data.length));
            return {
                issue,
                recommendation: 'Implement range validation and outlier detection',
                score
            };
        }
        return { score: 1.0 };
    }
    runPatternCheck(check, data) {
        const patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-()]{10,}$/,
            url: /^https?:\/\/.+/
        };
        const patternIssues = [];
        if (!data || data.length === 0) {
            return { score: 1.0 };
        }
        const columns = Object.keys(data[0]);
        columns.forEach(column => {
            const values = data.map(record => record[column])
                .filter(val => val != null && typeof val === 'string');
            if (values.length === 0)
                return;
            let pattern;
            if (column.toLowerCase().includes('email')) {
                pattern = patterns.email;
            }
            else if (column.toLowerCase().includes('phone')) {
                pattern = patterns.phone;
            }
            else if (column.toLowerCase().includes('url')) {
                pattern = patterns.url;
            }
            if (pattern) {
                const invalidValues = values.filter(val => !pattern.test(val));
                if (invalidValues.length > values.length * 0.1) {
                    patternIssues.push({
                        column,
                        patternType: Object.keys(patterns).find((key) => patterns[key] === pattern),
                        invalidCount: invalidValues.length,
                        sampleInvalid: invalidValues.slice(0, 3)
                    });
                }
            }
        });
        if (patternIssues.length > 0) {
            const totalInvalid = patternIssues.reduce((sum, issue) => sum + issue.invalidCount, 0);
            const issue = {
                checkId: check.id,
                severity: check.severity,
                category: check.category,
                description: `Pattern validation failures in ${patternIssues.length} columns`,
                affectedRecords: totalInvalid,
                affectedColumns: patternIssues.map(issue => issue.column),
                sampleValues: patternIssues.flatMap(issue => issue.sampleInvalid),
                suggestedFix: 'Implement pattern validation in data entry forms'
            };
            const score = Math.max(0, 1 - (patternIssues.length / columns.length));
            return {
                issue,
                recommendation: 'Add pattern validation for structured data fields',
                score
            };
        }
        return { score: 1.0 };
    }
    runReferentialIntegrityCheck(check, data) {
        return { score: 1.0 };
    }
    updateMetrics(metrics, check, result) {
        switch (check.category) {
            case 'completeness':
                metrics.completeness = Math.max(metrics.completeness, result.score);
                break;
            case 'accuracy':
                metrics.accuracy = Math.max(metrics.accuracy, result.score);
                break;
            case 'consistency':
                metrics.consistency = Math.max(metrics.consistency, result.score);
                break;
            case 'validity':
                metrics.validity = Math.max(metrics.validity, result.score);
                break;
            case 'uniqueness':
                metrics.uniqueness = Math.max(metrics.uniqueness, result.score);
                break;
            case 'timeliness':
                metrics.timeliness = Math.max(metrics.timeliness, result.score);
                break;
        }
    }
    calculateOverallScore(metrics) {
        const weights = {
            completeness: 0.2,
            accuracy: 0.2,
            consistency: 0.15,
            validity: 0.2,
            uniqueness: 0.15,
            timeliness: 0.1
        };
        return (metrics.completeness * weights.completeness +
            metrics.accuracy * weights.accuracy +
            metrics.consistency * weights.consistency +
            metrics.validity * weights.validity +
            metrics.uniqueness * weights.uniqueness +
            metrics.timeliness * weights.timeliness);
    }
    calculateQualityTrend(scanResults) {
        const scores = scanResults.map(scan => scan.overallScore);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        let trend = 'stable';
        if (scores.length >= 2) {
            const recentScores = scores.slice(-5);
            const olderScores = scores.slice(0, -5);
            if (olderScores.length > 0) {
                const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
                const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;
                if (recentAvg > olderAvg + 0.05) {
                    trend = 'improving';
                }
                else if (recentAvg < olderAvg - 0.05) {
                    trend = 'declining';
                }
            }
        }
        return {
            datasetId: scanResults[0]?.datasetId || '',
            period: `${scores.length} scans`,
            scores,
            averageScore,
            trend,
            recommendations: this.generateTrendRecommendations(trend, averageScore)
        };
    }
    generateTrendRecommendations(trend, averageScore) {
        const recommendations = [];
        if (trend === 'declining') {
            recommendations.push('Data quality is declining - immediate attention required');
            recommendations.push('Review recent changes to data collection processes');
        }
        if (averageScore < 0.7) {
            recommendations.push('Quality score below acceptable threshold - implement quality improvements');
        }
        if (trend === 'stable' && averageScore > 0.9) {
            recommendations.push('Excellent data quality - maintain current processes');
        }
        return recommendations;
    }
    generateReportRecommendations(latestScan, trend) {
        const recommendations = new Set();
        latestScan.recommendations.forEach(rec => recommendations.add(rec));
        trend.recommendations.forEach(rec => recommendations.add(rec));
        const criticalIssues = latestScan.issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.add('Address critical data quality issues immediately');
        }
        return Array.from(recommendations);
    }
    deduplicateRecommendations(recommendations) {
        return Array.from(new Set(recommendations));
    }
    storeScanResult(datasetId, result) {
        const history = this.scanHistory.get(datasetId) || [];
        history.push(result);
        const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
        const filteredHistory = history.filter(scan => scan.timestamp >= cutoffDate);
        this.scanHistory.set(datasetId, filteredHistory);
    }
    inferExpectedType(values) {
        if (!values || values.length === 0) {
            return 'string';
        }
        const types = values.map(val => typeof val);
        const typeCounts = types.reduce((counts, type) => {
            counts[type] = (counts[type] || 0) + 1;
            return counts;
        }, {});
        return Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)[0][0];
    }
    getNumericColumns(data) {
        if (!data || data.length === 0)
            return [];
        const columns = Object.keys(data[0]);
        return columns.filter(column => {
            const values = data.map(record => record[column]).filter(val => val != null);
            return values.length > 0 && values.every(val => typeof val === 'number');
        });
    }
    calculateQuartiles(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;
        const q1 = sorted[Math.floor(len * 0.25)];
        const q3 = sorted[Math.floor(len * 0.75)];
        const iqr = q3 - q1;
        return { q1, q3, iqr };
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Data Quality Scanner');
            this.scanHistory = new Map();
            this.qualityChecks = new Map();
            this.setupDefaultThresholds();
            logger_1.logger.info('Data Quality Scanner initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Data Quality Scanner', { error });
            throw new Error(`Data Quality Scanner initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Data Quality Scanner');
        this.scanHistory.clear();
        this.qualityChecks.clear();
        logger_1.logger.info('Data Quality Scanner shutdown complete');
    }
    setupDefaultThresholds() {
        const defaultThresholds = {
            completeness: { min: 0.95, target: 0.99 },
            accuracy: { min: 0.90, target: 0.98 },
            consistency: { min: 0.85, target: 0.95 },
            validity: { min: 0.90, target: 0.98 },
            uniqueness: { min: 0.95, target: 0.99 },
            timeliness: { min: 0.80, target: 0.95 }
        };
        logger_1.logger.debug('Default quality thresholds configured', { thresholds: defaultThresholds });
    }
}
exports.DataQualityScanner = DataQualityScanner;
exports.default = DataQualityScanner;
//# sourceMappingURL=data-quality-scanner.js.map