#!/usr/bin/env tsx
/**
 * Performance Benchmark Script
 * Comprehensive performance testing for Hasivu Platform
 *
 * Usage:
 *   npm run perf:benchmark
 *   tsx scripts/performance-benchmark.ts
 */

import { Lambda, CloudWatch } from 'aws-sdk';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

const lambda = new Lambda({ region: process.env.AWS_REGION || 'ap-south-1' });
const cloudwatch = new CloudWatch({ region: process.env.AWS_REGION || 'ap-south-1' });

const STAGE = process.env.STAGE || 'dev';

interface BenchmarkResult {
  function: string;
  coldStart: PerformanceStats;
  warmStart: PerformanceStats;
  successRate: number;
  totalInvocations: number;
}

interface PerformanceStats {
  mean: number;
  median: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  stdDev: number;
}

// Critical functions to benchmark
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

/**
 * Calculate statistical metrics
 */
function calculateStats(durations: number[]): PerformanceStats {
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

  // Calculate standard deviation
  const variance =
    durations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / durations.length;
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

/**
 * Invoke Lambda function and measure performance
 */
async function invokeLambda(functionName: string): Promise<number> {
  const start = performance.now();

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

    return performance.now() - start;
  } catch (error) {
    console.error(`Error invoking ${functionName}:`, error);
    throw error;
  }
}

/**
 * Benchmark a single function
 */
async function benchmarkFunction(
  functionName: string,
  warmIterations: number = 50
): Promise<BenchmarkResult> {
  console.log(`\nBenchmarking ${functionName}...`);

  const coldStartDurations: number[] = [];
  const warmStartDurations: number[] = [];
  let successCount = 0;
  let totalInvocations = 0;

  // Measure cold start
  try {
    console.log(`  Measuring cold start...`);
    const coldDuration = await invokeLambda(functionName);
    coldStartDurations.push(coldDuration);
    successCount++;
    totalInvocations++;
    console.log(`  Cold start: ${Math.round(coldDuration)}ms`);
  } catch (error) {
    console.error(`  Cold start failed`);
    totalInvocations++;
  }

  // Wait for Lambda to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Measure warm starts
  console.log(`  Measuring ${warmIterations} warm starts...`);
  for (let i = 0; i < warmIterations; i++) {
    try {
      const duration = await invokeLambda(functionName);
      warmStartDurations.push(duration);
      successCount++;
      totalInvocations++;

      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`    Progress: ${i + 1}/${warmIterations}`);
      }

      // Small delay between requests to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
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

/**
 * Query CloudWatch for function metrics
 */
async function getCloudWatchMetrics(functionName: string): Promise<any> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 3600000); // Last hour

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
  } catch (error) {
    console.error(`Failed to get CloudWatch metrics for ${functionName}`);
    return null;
  }
}

/**
 * Generate performance report
 */
function generateReport(results: BenchmarkResult[]): string {
  const timestamp = new Date().toISOString();

  let report = `# Performance Benchmark Report\n\n`;
  report += `**Date**: ${timestamp}\n`;
  report += `**Stage**: ${STAGE}\n`;
  report += `**Functions Tested**: ${results.length}\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;

  const avgColdStart = results.reduce((sum, r) => sum + r.coldStart.mean, 0) / results.length;
  const avgWarmStart = results.reduce((sum, r) => sum + r.warmStart.mean, 0) / results.length;
  const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;

  report += `- **Average Cold Start**: ${Math.round(avgColdStart)}ms\n`;
  report += `- **Average Warm Start**: ${Math.round(avgWarmStart)}ms\n`;
  report += `- **Average Success Rate**: ${avgSuccessRate.toFixed(2)}%\n\n`;

  // Performance Targets
  report += `## Performance Targets\n\n`;
  report += `| Metric | Current | Target | Status |\n`;
  report += `|--------|---------|--------|--------|\n`;
  report += `| Cold Start (Average) | ${Math.round(avgColdStart)}ms | <1000ms | ${avgColdStart < 1000 ? '✅' : '❌'} |\n`;
  report += `| Warm Start (Average) | ${Math.round(avgWarmStart)}ms | <150ms | ${avgWarmStart < 150 ? '✅' : '❌'} |\n`;
  report += `| Success Rate | ${avgSuccessRate.toFixed(2)}% | >99% | ${avgSuccessRate > 99 ? '✅' : '❌'} |\n\n`;

  // Detailed Results
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

  // Performance Issues
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

  // Recommendations
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

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('HASIVU PLATFORM - PERFORMANCE BENCHMARK');
  console.log('='.repeat(60));
  console.log(`Stage: ${STAGE}`);
  console.log(`Functions to test: ${CRITICAL_FUNCTIONS.length}`);
  console.log('='.repeat(60));

  const results: BenchmarkResult[] = [];

  // Benchmark each function
  for (const functionName of CRITICAL_FUNCTIONS) {
    try {
      const result = await benchmarkFunction(functionName);
      results.push(result);

      // Display summary
      console.log(`\n  Summary:`);
      console.log(`    Cold Start: ${result.coldStart.mean}ms (P95: ${result.coldStart.p95}ms)`);
      console.log(`    Warm Start: ${result.warmStart.mean}ms (P95: ${result.warmStart.p95}ms)`);
      console.log(`    Success Rate: ${result.successRate.toFixed(2)}%`);
    } catch (error) {
      console.error(`\n  Failed to benchmark ${functionName}:`, error);
    }

    // Small delay between functions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('BENCHMARK COMPLETE');
  console.log('='.repeat(60));

  // Generate and save report
  const report = generateReport(results);
  const reportPath = path.join(__dirname, '..', 'performance-benchmark-report.md');

  fs.writeFileSync(reportPath, report);
  console.log(`\nReport saved to: ${reportPath}`);

  // Display summary table
  console.log('\n=== SUMMARY TABLE ===\n');
  console.table(
    results.map(r => ({
      Function: r.function,
      'Cold Start (Mean)': `${r.coldStart.mean}ms`,
      'Cold Start (P95)': `${r.coldStart.p95}ms`,
      'Warm Start (Mean)': `${r.warmStart.mean}ms`,
      'Warm Start (P95)': `${r.warmStart.p95}ms`,
      'Success Rate': `${r.successRate.toFixed(2)}%`,
    }))
  );

  // Exit with appropriate code
  const avgColdStart = results.reduce((sum, r) => sum + r.coldStart.mean, 0) / results.length;
  const avgWarmStart = results.reduce((sum, r) => sum + r.warmStart.mean, 0) / results.length;
  const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;

  if (avgColdStart > 1000 || avgWarmStart > 150 || avgSuccessRate < 99) {
    console.log('\n⚠️  Performance targets not met. Review the report for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All performance targets met!');
    process.exit(0);
  }
}

// Run benchmarks
main().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
