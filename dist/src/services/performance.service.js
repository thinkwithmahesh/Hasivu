"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceService = exports.PerformanceService = void 0;
class PerformanceService {
    static instance;
    static metrics = [];
    static startTimes = new Map();
    static isMonitoringActive = false;
    static benchmarks = [];
    constructor() { }
    static getInstance() {
        if (!PerformanceService.instance) {
            PerformanceService.instance = new PerformanceService();
        }
        return PerformanceService.instance;
    }
    startTracking(operationId) {
        PerformanceService.startTimes.set(operationId, Date.now());
    }
    endTracking(operationId, tags) {
        const startTime = PerformanceService.startTimes.get(operationId);
        if (!startTime) {
            throw new Error(`No start time found for operation: ${operationId}`);
        }
        const duration = Date.now() - startTime;
        PerformanceService.startTimes.delete(operationId);
        this.recordMetric({
            name: operationId,
            value: duration,
            unit: 'ms',
            timestamp: new Date(),
            tags,
        });
        return duration;
    }
    recordMetric(metric) {
        PerformanceService.metrics.push(metric);
        if (PerformanceService.metrics.length > 1000) {
            PerformanceService.metrics.shift();
        }
    }
    getMetrics(operationName, limit) {
        const filtered = PerformanceService.metrics.filter((m) => m.name === operationName);
        return limit ? filtered.slice(-limit) : filtered;
    }
    getAverage(operationName) {
        const metrics = this.getMetrics(operationName);
        if (metrics.length === 0)
            return 0;
        const sum = metrics.reduce((acc, m) => acc + m.value, 0);
        return sum / metrics.length;
    }
    getPercentile(operationName, percentile) {
        const metrics = this.getMetrics(operationName);
        if (metrics.length === 0)
            return 0;
        const sorted = metrics.map(m => m.value).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }
    generateReport(startDate, endDate) {
        const filtered = PerformanceService.metrics.filter((m) => m.timestamp >= startDate && m.timestamp <= endDate);
        const responseTimes = filtered.filter(m => m.unit === 'ms').map(m => m.value);
        const totalRequests = filtered.filter(m => m.name.includes('request')).length;
        const errors = filtered.filter(m => m.name.includes('error')).length;
        return {
            period: { start: startDate, end: endDate },
            metrics: filtered,
            summary: {
                avgResponseTime: responseTimes.length > 0
                    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
                    : 0,
                maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
                minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
                totalRequests,
                errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0,
            },
        };
    }
    clearMetrics() {
        PerformanceService.metrics = [];
        PerformanceService.startTimes.clear();
    }
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            rss: Math.round(usage.rss / 1024 / 1024),
        };
    }
    recordCustomMetric(name, value, unit = 'count', tags) {
        this.recordMetric({
            name,
            value,
            unit,
            timestamp: new Date(),
            tags,
        });
    }
    static startMonitoring() {
        PerformanceService.isMonitoringActive = true;
    }
    static stopMonitoring() {
        PerformanceService.isMonitoringActive = false;
    }
    static isMonitoring() {
        return PerformanceService.isMonitoringActive;
    }
    static async recordRequest(endpoint, responseTime, statusCode) {
        PerformanceService.getInstance().recordMetric({
            name: `request:${endpoint}`,
            value: responseTime,
            unit: 'ms',
            timestamp: new Date(),
            tags: { statusCode: statusCode.toString(), endpoint },
        });
    }
    static async collectMetrics() {
        return [...PerformanceService.metrics];
    }
    static async getPerformanceTrends(metricName, timeRange) {
        const filtered = PerformanceService.metrics.filter((m) => m.name === metricName && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
        if (filtered.length === 0) {
            return { trend: 'stable', data: [] };
        }
        const sorted = filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const values = sorted.map((m) => m.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        let trend;
        if (secondAvg > firstAvg * 1.1)
            trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9)
            trend = 'decreasing';
        else
            trend = 'stable';
        return {
            trend,
            data: sorted,
            average: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }
    static async getHealthStatus() {
        const memory = PerformanceService.getInstance().getMemoryUsage();
        const recentMetrics = PerformanceService.metrics.filter((m) => Date.now() - m.timestamp.getTime() < 300000);
        const errorRate = (recentMetrics.filter((m) => m.name.includes('error')).length /
            Math.max(recentMetrics.length, 1)) *
            100;
        let status = 'healthy';
        if (errorRate > 5)
            status = 'critical';
        else if (errorRate > 1)
            status = 'warning';
        return {
            status,
            memory,
            errorRate,
            totalMetrics: PerformanceService.metrics.length,
            monitoringActive: PerformanceService.isMonitoringActive,
            uptime: process.uptime(),
        };
    }
    static async getAggregatedMetrics(timeRange) {
        const now = Date.now();
        let startTime;
        switch (timeRange) {
            case '1h':
                startTime = now - 3600000;
                break;
            case '24h':
                startTime = now - 86400000;
                break;
            case '7d':
                startTime = now - 604800000;
                break;
            default:
                startTime = now - 3600000;
        }
        const filtered = PerformanceService.metrics.filter((m) => m.timestamp.getTime() >= startTime);
        const aggregated = {};
        filtered.forEach((metric) => {
            if (!aggregated[metric.name]) {
                aggregated[metric.name] = {
                    name: metric.name,
                    count: 0,
                    sum: 0,
                    min: Infinity,
                    max: -Infinity,
                    avg: 0,
                };
            }
            aggregated[metric.name].count++;
            aggregated[metric.name].sum += metric.value;
            aggregated[metric.name].min = Math.min(aggregated[metric.name].min, metric.value);
            aggregated[metric.name].max = Math.max(aggregated[metric.name].max, metric.value);
            aggregated[metric.name].avg = aggregated[metric.name].sum / aggregated[metric.name].count;
        });
        return Object.values(aggregated);
    }
    static async setBenchmark(benchmark) {
        PerformanceService.benchmarks.push({
            ...benchmark,
            id: Date.now().toString(),
            createdAt: new Date(),
        });
    }
    static async getBenchmarks() {
        return [...PerformanceService.benchmarks];
    }
    static checkBenchmarkCompliance(benchmark) {
        const recentMetrics = PerformanceService.metrics.filter((m) => m.name === benchmark.metricName &&
            Date.now() - m.timestamp.getTime() < (benchmark.timeWindow || 3600000));
        if (recentMetrics.length === 0)
            return false;
        const avgValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) /
            recentMetrics.length;
        switch (benchmark.condition) {
            case 'lessThan':
                return avgValue < benchmark.threshold;
            case 'greaterThan':
                return avgValue > benchmark.threshold;
            case 'equals':
                return Math.abs(avgValue - benchmark.threshold) < 0.01;
            default:
                return false;
        }
    }
}
exports.PerformanceService = PerformanceService;
exports.performanceService = PerformanceService.getInstance();
exports.default = PerformanceService;
//# sourceMappingURL=performance.service.js.map