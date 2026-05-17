#!/usr/bin/env node

/**
 * HASIVU Platform - Lambda Performance Analyzer
 * Analyzes cold start performance and provides optimization recommendations
 * Production-ready tool for AWS Lambda function optimization
 */

const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');

// AWS Configuration
const cloudwatch = new AWS.CloudWatch({ region: process.env.AWS_REGION || 'ap-south-1' });
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'ap-south-1' });

class LambdaPerformanceAnalyzer {
  constructor() {
    this.stage = process.env.STAGE || 'dev';
    this.serviceName = 'hasivu-platform';
    this.analysisResults = {
      functions: [],
      summary: {},
      recommendations: [],
      optimizations: [],
    };
  }

  /**
   * Analyze all Lambda functions for performance
   */
  async analyzeAllFunctions() {
    console.log('🔍 Starting Lambda Performance Analysis...');
    console.log(`📊 Stage: ${this.stage}, Service: ${this.serviceName}`);

    try {
      // Get all Lambda functions for this service
      const functions = await this.getLambdaFunctions();
      console.log(`📋 Found ${functions.length} Lambda functions to analyze`);

      // Analyze each function
      for (const func of functions) {
        console.log(`⚡ Analyzing function: ${func.FunctionName}`);
        const analysis = await this.analyzeFunctionPerformance(func);
        this.analysisResults.functions.push(analysis);
      }

      // Generate summary and recommendations
      this.generateSummary();
      this.generateRecommendations();

      // Save results
      await this.saveAnalysisResults();

      // Display results
      this.displayResults();
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      process.exit(1);
    }
  }

  /**
   * Get all Lambda functions for the service
   */
  async getLambdaFunctions() {
    try {
      const prefix = `${this.serviceName}-${this.stage}`;
      const functions = [];
      let nextMarker = null;

      do {
        const params = {
          MaxItems: 50,
          ...(nextMarker && { Marker: nextMarker }),
        };

        const result = await lambda.listFunctions(params).promise();

        const serviceFunctions = result.Functions.filter(func =>
          func.FunctionName.startsWith(prefix)
        );

        functions.push(...serviceFunctions);
        nextMarker = result.NextMarker;
      } while (nextMarker);

      return functions;
    } catch (error) {
      console.error('Failed to list Lambda functions:', error);
      throw error;
    }
  }

  /**
   * Analyze individual function performance
   */
  async analyzeFunctionPerformance(func) {
    const functionName = func.FunctionName;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    try {
      // Get CloudWatch metrics
      const [coldStartMetrics, durationMetrics, errorMetrics, invocationMetrics, memoryMetrics] =
        await Promise.all([
          this.getColdStartMetrics(functionName, startTime, endTime),
          this.getDurationMetrics(functionName, startTime, endTime),
          this.getErrorMetrics(functionName, startTime, endTime),
          this.getInvocationMetrics(functionName, startTime, endTime),
          this.getMemoryMetrics(functionName, startTime, endTime),
        ]);

      // Get function configuration
      const config = await lambda.getFunction({ FunctionName: functionName }).promise();

      // Calculate performance indicators
      const analysis = {
        functionName,
        config: {
          runtime: config.Configuration.Runtime,
          memorySize: config.Configuration.MemorySize,
          timeout: config.Configuration.Timeout,
          codeSize: config.Configuration.CodeSize,
          lastModified: config.Configuration.LastModified,
          environment: config.Configuration.Environment?.Variables || {},
        },
        performance: {
          coldStart: {
            frequency: coldStartMetrics.frequency,
            avgDuration: coldStartMetrics.avgDuration,
            maxDuration: coldStartMetrics.maxDuration,
            impact: this.calculateColdStartImpact(coldStartMetrics, invocationMetrics),
          },
          duration: {
            average: durationMetrics.average,
            p95: durationMetrics.p95,
            p99: durationMetrics.p99,
            max: durationMetrics.max,
          },
          errors: {
            rate: errorMetrics.rate,
            count: errorMetrics.count,
            types: errorMetrics.types,
          },
          invocations: {
            total: invocationMetrics.total,
            concurrency: invocationMetrics.concurrency,
            throttles: invocationMetrics.throttles,
          },
          memory: {
            used: memoryMetrics.used,
            allocated: memoryMetrics.allocated,
            efficiency: memoryMetrics.efficiency,
          },
        },
        issues: [],
        optimizations: [],
      };

      // Identify performance issues
      this.identifyPerformanceIssues(analysis);

      // Generate optimization suggestions
      this.generateOptimizationSuggestions(analysis);

      return analysis;
    } catch (error) {
      console.error(`Failed to analyze function ${functionName}:`, error);
      return {
        functionName,
        error: error.message,
        performance: null,
      };
    }
  }

  /**
   * Get cold start metrics
   */
  async getColdStartMetrics(functionName, startTime, endTime) {
    try {
      // Cold starts are indicated by high initialization duration
      const params = {
        MetricName: 'InitDuration',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour
        Statistics: ['Average', 'Maximum', 'SampleCount'],
      };

      const result = await cloudwatch.getMetricStatistics(params).promise();

      if (result.Datapoints.length === 0) {
        return { frequency: 0, avgDuration: 0, maxDuration: 0 };
      }

      const totalSamples = result.Datapoints.reduce((sum, dp) => sum + dp.SampleCount, 0);
      const avgDuration =
        result.Datapoints.reduce((sum, dp) => sum + dp.Average, 0) / result.Datapoints.length;
      const maxDuration = Math.max(...result.Datapoints.map(dp => dp.Maximum));

      return {
        frequency: totalSamples,
        avgDuration: avgDuration || 0,
        maxDuration: maxDuration || 0,
      };
    } catch (error) {
      console.warn(`Could not get cold start metrics for ${functionName}:`, error.message);
      return { frequency: 0, avgDuration: 0, maxDuration: 0 };
    }
  }

  /**
   * Get duration metrics
   */
  async getDurationMetrics(functionName, startTime, endTime) {
    try {
      const params = {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average', 'Maximum'],
        ExtendedStatistics: ['p95', 'p99'],
      };

      const result = await cloudwatch.getMetricStatistics(params).promise();

      if (result.Datapoints.length === 0) {
        return { average: 0, p95: 0, p99: 0, max: 0 };
      }

      const latestDatapoint = result.Datapoints[result.Datapoints.length - 1];

      return {
        average: latestDatapoint.Average || 0,
        p95: latestDatapoint.ExtendedStatistics?.p95 || 0,
        p99: latestDatapoint.ExtendedStatistics?.p99 || 0,
        max: latestDatapoint.Maximum || 0,
      };
    } catch (error) {
      console.warn(`Could not get duration metrics for ${functionName}:`, error.message);
      return { average: 0, p95: 0, p99: 0, max: 0 };
    }
  }

  /**
   * Get error metrics
   */
  async getErrorMetrics(functionName, startTime, endTime) {
    try {
      const [errorsResult, invocationsResult] = await Promise.all([
        cloudwatch
          .getMetricStatistics({
            MetricName: 'Errors',
            Namespace: 'AWS/Lambda',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600,
            Statistics: ['Sum'],
          })
          .promise(),
        cloudwatch
          .getMetricStatistics({
            MetricName: 'Invocations',
            Namespace: 'AWS/Lambda',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600,
            Statistics: ['Sum'],
          })
          .promise(),
      ]);

      const totalErrors = errorsResult.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);
      const totalInvocations = invocationsResult.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);

      return {
        count: totalErrors,
        rate: totalInvocations > 0 ? (totalErrors / totalInvocations) * 100 : 0,
        types: [], // Would need CloudWatch Logs analysis for detailed error types
      };
    } catch (error) {
      console.warn(`Could not get error metrics for ${functionName}:`, error.message);
      return { count: 0, rate: 0, types: [] };
    }
  }

  /**
   * Get invocation metrics
   */
  async getInvocationMetrics(functionName, startTime, endTime) {
    try {
      const [invocationsResult, throttlesResult] = await Promise.all([
        cloudwatch
          .getMetricStatistics({
            MetricName: 'Invocations',
            Namespace: 'AWS/Lambda',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 300, // 5 minutes for better granularity
            Statistics: ['Sum', 'Maximum'],
          })
          .promise(),
        cloudwatch
          .getMetricStatistics({
            MetricName: 'Throttles',
            Namespace: 'AWS/Lambda',
            Dimensions: [{ Name: 'FunctionName', Value: functionName }],
            StartTime: startTime,
            EndTime: endTime,
            Period: 3600,
            Statistics: ['Sum'],
          })
          .promise(),
      ]);

      const totalInvocations = invocationsResult.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);
      const maxConcurrency = Math.max(...invocationsResult.Datapoints.map(dp => dp.Maximum), 0);
      const totalThrottles = throttlesResult.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);

      return {
        total: totalInvocations,
        concurrency: maxConcurrency,
        throttles: totalThrottles,
      };
    } catch (error) {
      console.warn(`Could not get invocation metrics for ${functionName}:`, error.message);
      return { total: 0, concurrency: 0, throttles: 0 };
    }
  }

  /**
   * Get memory metrics
   */
  async getMemoryMetrics(functionName, startTime, endTime) {
    try {
      const params = {
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Average', 'Maximum'],
      };

      const result = await cloudwatch.getMetricStatistics(params).promise();

      if (result.Datapoints.length === 0) {
        return { used: 0, allocated: 0, efficiency: 0 };
      }

      const avgUtilization =
        result.Datapoints.reduce((sum, dp) => sum + dp.Average, 0) / result.Datapoints.length;

      // Get allocated memory from function config
      const config = await lambda.getFunction({ FunctionName: functionName }).promise();
      const allocatedMemory = config.Configuration.MemorySize;

      return {
        used: (avgUtilization / 100) * allocatedMemory,
        allocated: allocatedMemory,
        efficiency: avgUtilization,
      };
    } catch (error) {
      console.warn(`Could not get memory metrics for ${functionName}:`, error.message);
      return { used: 0, allocated: 0, efficiency: 0 };
    }
  }

  /**
   * Calculate cold start impact
   */
  calculateColdStartImpact(coldStartMetrics, invocationMetrics) {
    if (invocationMetrics.total === 0) return 'low';

    const coldStartRate = (coldStartMetrics.frequency / invocationMetrics.total) * 100;

    if (coldStartRate > 20 || coldStartMetrics.avgDuration > 3000) return 'high';
    if (coldStartRate > 10 || coldStartMetrics.avgDuration > 1500) return 'medium';
    return 'low';
  }

  /**
   * Identify performance issues
   */
  identifyPerformanceIssues(analysis) {
    const issues = [];
    const perf = analysis.performance;

    // Cold start issues
    if (perf.coldStart.impact === 'high') {
      issues.push({
        type: 'cold_start',
        severity: 'high',
        description: `High cold start impact: ${perf.coldStart.avgDuration.toFixed(0)}ms average`,
        recommendation: 'Consider provisioned concurrency or code optimization',
      });
    }

    // Duration issues
    if (perf.duration.p95 > 5000) {
      issues.push({
        type: 'high_duration',
        severity: 'high',
        description: `High execution duration: P95 ${perf.duration.p95.toFixed(0)}ms`,
        recommendation: 'Optimize code, increase memory, or consider async processing',
      });
    }

    // Memory issues
    if (perf.memory.efficiency < 30) {
      issues.push({
        type: 'memory_underutilization',
        severity: 'medium',
        description: `Low memory utilization: ${perf.memory.efficiency.toFixed(1)}%`,
        recommendation: 'Reduce allocated memory to save costs',
      });
    } else if (perf.memory.efficiency > 90) {
      issues.push({
        type: 'memory_overutilization',
        severity: 'high',
        description: `High memory utilization: ${perf.memory.efficiency.toFixed(1)}%`,
        recommendation: 'Increase allocated memory to improve performance',
      });
    }

    // Error rate issues
    if (perf.errors.rate > 1) {
      issues.push({
        type: 'high_error_rate',
        severity: 'high',
        description: `High error rate: ${perf.errors.rate.toFixed(2)}%`,
        recommendation: 'Investigate and fix error causes',
      });
    }

    // Throttling issues
    if (perf.invocations.throttles > 0) {
      issues.push({
        type: 'throttling',
        severity: 'medium',
        description: `Function throttling detected: ${perf.invocations.throttles} throttles`,
        recommendation: 'Increase reserved concurrency or optimize invocation patterns',
      });
    }

    analysis.issues = issues;
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(analysis) {
    const optimizations = [];
    const perf = analysis.performance;

    // Provisioned concurrency for critical functions
    if (perf.coldStart.impact === 'high' && this.isCriticalFunction(analysis.functionName)) {
      optimizations.push({
        type: 'provisioned_concurrency',
        priority: 'high',
        description: 'Enable provisioned concurrency for critical function',
        implementation: `aws lambda put-provisioned-concurrency-config --function-name ${analysis.functionName} --provisioned-concurrency-capacity 5`,
        estimatedCost: '$15-50/month',
        expectedImprovement: '80-95% cold start reduction',
      });
    }

    // Memory optimization
    if (perf.memory.efficiency < 30) {
      const recommendedMemory = Math.max(128, Math.ceil(analysis.config.memorySize * 0.7));
      optimizations.push({
        type: 'memory_reduction',
        priority: 'medium',
        description: `Reduce memory allocation from ${analysis.config.memorySize}MB to ${recommendedMemory}MB`,
        implementation: `Update serverless.yml memorySize to ${recommendedMemory}`,
        estimatedCost: '-20-30% cost reduction',
        expectedImprovement: 'Cost optimization with no performance impact',
      });
    } else if (perf.memory.efficiency > 90) {
      const recommendedMemory = Math.min(3008, Math.ceil(analysis.config.memorySize * 1.5));
      optimizations.push({
        type: 'memory_increase',
        priority: 'high',
        description: `Increase memory allocation from ${analysis.config.memorySize}MB to ${recommendedMemory}MB`,
        implementation: `Update serverless.yml memorySize to ${recommendedMemory}`,
        estimatedCost: '+20-40% cost increase',
        expectedImprovement: '20-40% performance improvement',
      });
    }

    // Bundle size optimization
    if (analysis.config.codeSize > 10485760) {
      // 10MB
      optimizations.push({
        type: 'bundle_optimization',
        priority: 'medium',
        description: 'Large bundle size detected, optimize code package',
        implementation: 'Use webpack bundling, tree shaking, and exclude dev dependencies',
        estimatedCost: 'Development time',
        expectedImprovement: '30-50% faster cold starts',
      });
    }

    // Runtime optimization
    if (analysis.config.runtime === 'nodejs14.x') {
      optimizations.push({
        type: 'runtime_upgrade',
        priority: 'low',
        description: 'Upgrade to newer Node.js runtime',
        implementation: 'Update runtime to nodejs18.x in serverless.yml',
        estimatedCost: 'Minimal',
        expectedImprovement: '5-15% performance improvement',
      });
    }

    analysis.optimizations = optimizations;
  }

  /**
   * Check if function is critical (payment, RFID, authentication)
   */
  isCriticalFunction(functionName) {
    const criticalPatterns = ['payments', 'auth', 'rfid', 'webhook', 'health'];

    return criticalPatterns.some(pattern => functionName.toLowerCase().includes(pattern));
  }

  /**
   * Generate analysis summary
   */
  generateSummary() {
    const functions = this.analysisResults.functions.filter(f => f.performance);

    if (functions.length === 0) {
      this.analysisResults.summary = { message: 'No functions to analyze' };
      return;
    }

    const summary = {
      totalFunctions: functions.length,
      avgColdStartDuration:
        functions.reduce((sum, f) => sum + f.performance.coldStart.avgDuration, 0) /
        functions.length,
      avgExecutionDuration:
        functions.reduce((sum, f) => sum + f.performance.duration.average, 0) / functions.length,
      totalErrors: functions.reduce((sum, f) => sum + f.performance.errors.count, 0),
      avgErrorRate:
        functions.reduce((sum, f) => sum + f.performance.errors.rate, 0) / functions.length,
      totalMemoryAllocated: functions.reduce((sum, f) => sum + f.config.memorySize, 0),
      avgMemoryEfficiency:
        functions.reduce((sum, f) => sum + f.performance.memory.efficiency, 0) / functions.length,
      highImpactColdStarts: functions.filter(f => f.performance.coldStart.impact === 'high').length,
      criticalIssues: functions.reduce(
        (sum, f) => sum + f.issues.filter(i => i.severity === 'high').length,
        0
      ),
      optimizationOpportunities: functions.reduce((sum, f) => sum + f.optimizations.length, 0),
    };

    this.analysisResults.summary = summary;
  }

  /**
   * Generate overall recommendations
   */
  generateRecommendations() {
    const functions = this.analysisResults.functions.filter(f => f.performance);
    const recommendations = [];

    // Critical functions with high cold start impact
    const criticalColdStartFunctions = functions.filter(
      f => this.isCriticalFunction(f.functionName) && f.performance.coldStart.impact === 'high'
    );

    if (criticalColdStartFunctions.length > 0) {
      recommendations.push({
        priority: 'immediate',
        title: 'Enable Provisioned Concurrency for Critical Functions',
        description: `${criticalColdStartFunctions.length} critical functions have high cold start impact`,
        functions: criticalColdStartFunctions.map(f => f.functionName),
        action: 'Configure provisioned concurrency',
        impact: 'High - Improved user experience and reduced latency',
      });
    }

    // Memory optimization opportunities
    const overAllocatedFunctions = functions.filter(f => f.performance.memory.efficiency < 30);
    const underAllocatedFunctions = functions.filter(f => f.performance.memory.efficiency > 90);

    if (overAllocatedFunctions.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Optimize Memory Allocation',
        description: `${overAllocatedFunctions.length} functions are over-allocated, ${underAllocatedFunctions.length} are under-allocated`,
        functions: [
          ...overAllocatedFunctions.map(f => f.functionName),
          ...underAllocatedFunctions.map(f => f.functionName),
        ],
        action: 'Adjust memory allocation based on utilization',
        impact: 'Medium - Cost optimization and performance improvement',
      });
    }

    // Bundle size optimization
    const largeBundleFunctions = functions.filter(f => f.config.codeSize > 10485760);
    if (largeBundleFunctions.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize Bundle Sizes',
        description: `${largeBundleFunctions.length} functions have large bundle sizes`,
        functions: largeBundleFunctions.map(f => f.functionName),
        action: 'Implement webpack optimization and tree shaking',
        impact: 'Medium - Faster cold starts and deployment',
      });
    }

    this.analysisResults.recommendations = recommendations;
  }

  /**
   * Save analysis results to file
   */
  async saveAnalysisResults() {
    const resultsDir = './performance-analysis-results';

    try {
      await fs.mkdir(resultsDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `lambda-performance-${this.stage}-${timestamp}.json`;
      const filePath = path.join(resultsDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(this.analysisResults, null, 2));

      console.log(`\n📄 Analysis results saved to: ${filePath}`);

      // Also save a summary report
      const summaryFileName = `lambda-summary-${this.stage}-${timestamp}.md`;
      const summaryPath = path.join(resultsDir, summaryFileName);
      const summaryReport = this.generateMarkdownReport();

      await fs.writeFile(summaryPath, summaryReport);
      console.log(`📄 Summary report saved to: ${summaryPath}`);
    } catch (error) {
      console.error('Failed to save analysis results:', error);
    }
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { summary, recommendations, functions } = this.analysisResults;

    let report = `# Lambda Performance Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Stage**: ${this.stage}\n`;
    report += `**Service**: ${this.serviceName}\n\n`;

    // Executive Summary
    report += `## Executive Summary\n\n`;
    report += `- **Total Functions Analyzed**: ${summary.totalFunctions}\n`;
    report += `- **Average Cold Start Duration**: ${summary.avgColdStartDuration?.toFixed(0)}ms\n`;
    report += `- **Average Execution Duration**: ${summary.avgExecutionDuration?.toFixed(0)}ms\n`;
    report += `- **Critical Issues**: ${summary.criticalIssues}\n`;
    report += `- **Optimization Opportunities**: ${summary.optimizationOpportunities}\n\n`;

    // Recommendations
    if (recommendations.length > 0) {
      report += `## Priority Recommendations\n\n`;
      for (const rec of recommendations) {
        report += `### ${rec.title} (${rec.priority.toUpperCase()})\n`;
        report += `${rec.description}\n\n`;
        report += `**Action**: ${rec.action}\n`;
        report += `**Impact**: ${rec.impact}\n`;
        report += `**Functions**: ${rec.functions.join(', ')}\n\n`;
      }
    }

    // Function Details
    report += `## Function Performance Details\n\n`;
    for (const func of functions.filter(f => f.performance)) {
      report += `### ${func.functionName}\n`;
      report += `- **Runtime**: ${func.config.runtime}\n`;
      report += `- **Memory**: ${func.config.memorySize}MB (${func.performance.memory.efficiency.toFixed(1)}% utilized)\n`;
      report += `- **Code Size**: ${(func.config.codeSize / 1024 / 1024).toFixed(1)}MB\n`;
      report += `- **Average Duration**: ${func.performance.duration.average.toFixed(0)}ms\n`;
      report += `- **Cold Start Impact**: ${func.performance.coldStart.impact}\n`;
      report += `- **Error Rate**: ${func.performance.errors.rate.toFixed(2)}%\n`;

      if (func.issues.length > 0) {
        report += `\n**Issues**:\n`;
        for (const issue of func.issues) {
          report += `- ${issue.description} (${issue.severity})\n`;
        }
      }

      if (func.optimizations.length > 0) {
        report += `\n**Optimizations**:\n`;
        for (const opt of func.optimizations) {
          report += `- ${opt.description} - ${opt.expectedImprovement}\n`;
        }
      }

      report += `\n`;
    }

    return report;
  }

  /**
   * Display analysis results
   */
  displayResults() {
    console.log('\n🎯 LAMBDA PERFORMANCE ANALYSIS RESULTS');
    console.log('=====================================');

    const { summary, recommendations } = this.analysisResults;

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Functions Analyzed: ${summary.totalFunctions}`);
    console.log(`   Avg Cold Start: ${summary.avgColdStartDuration?.toFixed(0)}ms`);
    console.log(`   Avg Execution: ${summary.avgExecutionDuration?.toFixed(0)}ms`);
    console.log(`   Critical Issues: ${summary.criticalIssues}`);
    console.log(`   Memory Efficiency: ${summary.avgMemoryEfficiency?.toFixed(1)}%`);

    // Recommendations
    if (recommendations.length > 0) {
      console.log(`\n🚀 PRIORITY RECOMMENDATIONS:`);
      for (const rec of recommendations.slice(0, 3)) {
        console.log(`   ${rec.priority.toUpperCase()}: ${rec.title}`);
        console.log(`   → ${rec.description}`);
      }
    }

    // Performance grade
    const grade = this.calculatePerformanceGrade(summary);
    console.log(`\n🏆 PERFORMANCE GRADE: ${grade}`);

    console.log('\n✅ Analysis completed successfully!');
    console.log('💡 Check the generated reports for detailed optimization steps.');
  }

  /**
   * Calculate overall performance grade
   */
  calculatePerformanceGrade(summary) {
    let score = 100;

    // Deduct points for issues
    score -= summary.criticalIssues * 10;
    score -= summary.highImpactColdStarts * 5;

    // Deduct for poor metrics
    if (summary.avgColdStartDuration > 3000) score -= 15;
    if (summary.avgExecutionDuration > 5000) score -= 10;
    if (summary.avgErrorRate > 1) score -= 20;
    if (summary.avgMemoryEfficiency < 30 || summary.avgMemoryEfficiency > 90) score -= 5;

    if (score >= 90) return 'A+ (Excellent)';
    if (score >= 80) return 'A (Very Good)';
    if (score >= 70) return 'B (Good)';
    if (score >= 60) return 'C (Fair)';
    return 'D (Needs Improvement)';
  }
}

// Main execution
async function main() {
  const analyzer = new LambdaPerformanceAnalyzer();
  await analyzer.analyzeAllFunctions();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LambdaPerformanceAnalyzer;
