#!/usr/bin/env tsx
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const perf_hooks_1 = require("perf_hooks");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const lambda = new aws_sdk_1.Lambda({ region: process.env.AWS_REGION || 'ap-south-1' });
const cloudwatch = new aws_sdk_1.CloudWatch({ region: process.env.AWS_REGION || 'ap-south-1' });
const STAGE = process.env.STAGE || 'dev';
const CRITICAL_FUNCTIONS = [
    'auth-login',
    'auth-register',
    'payments-create-order',
    'payments-verify',
    'orders-list',
    'orders-create',
    'menus-daily',
    'rfid-verify-card',
    'users-get',
    'monitoring-dashboard',
];
function calculateStats(durations) {
    if (durations.length === 0) {
        return {
            mean: 0,
            median: 0,
            p95: 0,
            p99: 0,
            min: 0,
            max: 0,
            stdDev: 0,
        };
    }
    const sorted = [...durations].sort((a, b) => a - b);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    return {
        mean: Math.round(mean),
        median: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
        p99: Math.round(sorted[Math.floor(sorted.length * 0.99)]),
        min: Math.round(Math.min(...sorted)),
        max: Math.round(Math.max(...sorted)),
        stdDev: Math.round(stdDev),
    };
}
async function invokeLambda(functionName) {
    const start = perf_hooks_1.performance.now();
    try {
        await lambda
            .invoke({
            FunctionName: `hasivu-${STAGE}-${functionName}`,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
                httpMethod: 'GET',
                path: '/health',
                headers: {},
                queryStringParameters: null,
            }),
        })
            .promise();
        return perf_hooks_1.performance.now() - start;
    }
    catch (error) {
        console.error(`Error invoking ${functionName}:`, error);
        throw error;
    }
}
async function benchmarkFunction(functionName, warmIterations = 50) {
    console.log(`\nBenchmarking ${functionName}...`);
    const coldStartDurations = [];
    const warmStartDurations = [];
    let successCount = 0;
    let totalInvocations = 0;
    try {
        console.log(`  Measuring cold start...`);
        const coldDuration = await invokeLambda(functionName);
        coldStartDurations.push(coldDuration);
        successCount++;
        totalInvocations++;
        console.log(`  Cold start: ${Math.round(coldDuration)}ms`);
    }
    catch (error) {
        console.error(`  Cold start failed`);
        totalInvocations++;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`  Measuring ${warmIterations} warm starts...`);
    for (let i = 0; i < warmIterations; i++) {
        try {
            const duration = await invokeLambda(functionName);
            warmStartDurations.push(duration);
            successCount++;
            totalInvocations++;
            if ((i + 1) % 10 === 0) {
                console.log(`    Progress: ${i + 1}/${warmIterations}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        catch (error) {
            totalInvocations++;
        }
    }
    const successRate = (successCount / totalInvocations) * 100;
    return {
        function: functionName,
        coldStart: calculateStats(coldStartDurations),
        warmStart: calculateStats(warmStartDurations),
        successRate,
        totalInvocations,
    };
}
async function getCloudWatchMetrics(functionName) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000);
    try {
        const metrics = await cloudwatch
            .getMetricStatistics({
            Namespace: 'AWS/Lambda',
            MetricName: 'Duration',
            Dimensions: [
                {
                    Name: 'FunctionName',
                    Value: `hasivu-${STAGE}-${functionName}`,
                },
            ],
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600,
            Statistics: ['Average', 'Maximum', 'Minimum'],
        })
            .promise();
        return (metrics.Datapoints && metrics.Datapoints[0]) || null;
    }
    catch (error) {
        console.error(`Failed to get CloudWatch metrics for ${functionName}`);
        return null;
    }
}
function generateReport(results) {
    const timestamp = new Date().toISOString();
    let report = `# Performance Benchmark Report\n\n`;
    report += `**Date**: ${timestamp}\n`;
    report += `**Stage**: ${STAGE}\n`;
    report += `**Functions Tested**: ${results.length}\n\n`;
    report += `## Executive Summary\n\n`;
    const avgColdStart = results.reduce((sum, r) => sum + r.coldStart.mean, 0) / results.length;
    const avgWarmStart = results.reduce((sum, r) => sum + r.warmStart.mean, 0) / results.length;
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    report += `- **Average Cold Start**: ${Math.round(avgColdStart)}ms\n`;
    report += `- **Average Warm Start**: ${Math.round(avgWarmStart)}ms\n`;
    report += `- **Average Success Rate**: ${avgSuccessRate.toFixed(2)}%\n\n`;
    report += `## Performance Targets\n\n`;
    report += `| Metric | Current | Target | Status |\n`;
    report += `|--------|---------|--------|--------|\n`;
    report += `| Cold Start (Average) | ${Math.round(avgColdStart)}ms | <1000ms | ${avgColdStart < 1000 ? '✅' : '❌'} |\n`;
    report += `| Warm Start (Average) | ${Math.round(avgWarmStart)}ms | <150ms | ${avgWarmStart < 150 ? '✅' : '❌'} |\n`;
    report += `| Success Rate | ${avgSuccessRate.toFixed(2)}% | >99% | ${avgSuccessRate > 99 ? '✅' : '❌'} |\n\n`;
    report += `## Detailed Results\n\n`;
    report += `### Cold Start Performance\n\n`;
    report += `| Function | Mean | P95 | P99 | Max |\n`;
    report += `|----------|------|-----|-----|-----|\n`;
    results.forEach(r => {
        report += `| ${r.function} | ${r.coldStart.mean}ms | ${r.coldStart.p95}ms | ${r.coldStart.p99}ms | ${r.coldStart.max}ms |\n`;
    });
    report += `\n### Warm Start Performance\n\n`;
    report += `| Function | Mean | P95 | P99 | Max |\n`;
    report += `|----------|------|-----|-----|-----|\n`;
    results.forEach(r => {
        report += `| ${r.function} | ${r.warmStart.mean}ms | ${r.warmStart.p95}ms | ${r.warmStart.p99}ms | ${r.warmStart.max}ms |\n`;
    });
    report += `\n## Performance Issues\n\n`;
    const slowColdStarts = results.filter(r => r.coldStart.mean > 1000);
    const slowWarmStarts = results.filter(r => r.warmStart.mean > 150);
    const lowSuccessRate = results.filter(r => r.successRate < 99);
    if (slowColdStarts.length > 0) {
        report += `### Slow Cold Starts (>1000ms)\n\n`;
        slowColdStarts.forEach(r => {
            report += `- **${r.function}**: ${r.coldStart.mean}ms (${r.coldStart.mean - 1000}ms over target)\n`;
        });
        report += `\n`;
    }
    if (slowWarmStarts.length > 0) {
        report += `### Slow Warm Starts (>150ms)\n\n`;
        slowWarmStarts.forEach(r => {
            report += `- **${r.function}**: ${r.warmStart.mean}ms (${r.warmStart.mean - 150}ms over target)\n`;
        });
        report += `\n`;
    }
    if (lowSuccessRate.length > 0) {
        report += `### Low Success Rate (<99%)\n\n`;
        lowSuccessRate.forEach(r => {
            report += `- **${r.function}**: ${r.successRate.toFixed(2)}% (${r.totalInvocations - Math.round((r.totalInvocations * r.successRate) / 100)} failures)\n`;
        });
        report += `\n`;
    }
    if (slowColdStarts.length === 0 && slowWarmStarts.length === 0 && lowSuccessRate.length === 0) {
        report += `All functions meeting performance targets! ✅\n\n`;
    }
    report += `## Recommendations\n\n`;
    if (slowColdStarts.length > 0) {
        report += `### Cold Start Optimization\n\n`;
        report += `1. Enable provisioned concurrency for critical functions\n`;
        report += `2. Extract shared dependencies to Lambda layers\n`;
        report += `3. Optimize initialization code\n`;
        report += `4. Consider using ARM architecture (Graviton2)\n\n`;
    }
    if (slowWarmStarts.length > 0) {
        report += `### Warm Start Optimization\n\n`;
        report += `1. Optimize database queries with indexes\n`;
        report += `2. Implement caching layer (Redis)\n`;
        report += `3. Use connection pooling\n`;
        report += `4. Minimize external API calls\n\n`;
    }
    return report;
}
async function main() {
    console.log('='.repeat(60));
    console.log('HASIVU PLATFORM - PERFORMANCE BENCHMARK');
    console.log('='.repeat(60));
    console.log(`Stage: ${STAGE}`);
    console.log(`Functions to test: ${CRITICAL_FUNCTIONS.length}`);
    console.log('='.repeat(60));
    const results = [];
    for (const functionName of CRITICAL_FUNCTIONS) {
        try {
            const result = await benchmarkFunction(functionName);
            results.push(result);
            console.log(`\n  Summary:`);
            console.log(`    Cold Start: ${result.coldStart.mean}ms (P95: ${result.coldStart.p95}ms)`);
            console.log(`    Warm Start: ${result.warmStart.mean}ms (P95: ${result.warmStart.p95}ms)`);
            console.log(`    Success Rate: ${result.successRate.toFixed(2)}%`);
        }
        catch (error) {
            console.error(`\n  Failed to benchmark ${functionName}:`, error);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log(`\n${'='.repeat(60)}`);
    console.log('BENCHMARK COMPLETE');
    console.log('='.repeat(60));
    const report = generateReport(results);
    const reportPath = path.join(__dirname, '..', 'performance-benchmark-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log('\n=== SUMMARY TABLE ===\n');
    console.table(results.map(r => ({
        Function: r.function,
        'Cold Start (Mean)': `${r.coldStart.mean}ms`,
        'Cold Start (P95)': `${r.coldStart.p95}ms`,
        'Warm Start (Mean)': `${r.warmStart.mean}ms`,
        'Warm Start (P95)': `${r.warmStart.p95}ms`,
        'Success Rate': `${r.successRate.toFixed(2)}%`,
    })));
    const avgColdStart = results.reduce((sum, r) => sum + r.coldStart.mean, 0) / results.length;
    const avgWarmStart = results.reduce((sum, r) => sum + r.warmStart.mean, 0) / results.length;
    const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
    if (avgColdStart > 1000 || avgWarmStart > 150 || avgSuccessRate < 99) {
        console.log('\n⚠️  Performance targets not met. Review the report for details.');
        process.exit(1);
    }
    else {
        console.log('\n✅ All performance targets met!');
        process.exit(0);
    }
}
main().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
});
//# sourceMappingURL=performance-benchmark.js.map