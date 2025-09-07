#!/usr/bin/env ts-node
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
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const perf_hooks_1 = require("perf_hooks");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ComprehensivePerformanceOrchestrator {
    config;
    results = {};
    executionLog = [];
    startTime;
    constructor(config) {
        this.config = config;
        this.startTime = perf_hooks_1.performance.now();
    }
    async executePerformanceAnalysis() {
        console.log('🚀 HASIVU PLATFORM - COMPREHENSIVE PERFORMANCE ANALYSIS');
        console.log('=====================================================');
        console.log(`Environment: ${this.config.environment.toUpperCase()}`);
        console.log(`Target Load: ${this.config.concurrentUsers} concurrent users`);
        console.log(`Test Duration: ${this.config.testDuration} seconds`);
        console.log('');
        try {
            if (this.config.runDatabaseAnalysis) {
                await this.executeDatabaseAnalysis();
            }
            if (this.config.runLambdaAnalysis) {
                await this.executeLambdaAnalysis();
            }
            if (this.config.runRealTimeTests) {
                await this.executeRealTimeTests();
            }
            if (this.config.enableOptimizations) {
                await this.applyOptimizations();
            }
            if (this.config.runComprehensiveReport) {
                await this.generateComprehensiveReport();
            }
            const orchestrationReport = await this.generateOrchestrationReport();
            this.displayFinalSummary(orchestrationReport);
            return orchestrationReport;
        }
        catch (error) {
            console.error('❌ Performance analysis failed:', error);
            throw error;
        }
    }
    async executeDatabaseAnalysis() {
        console.log('📊 Phase 1: Database Performance Analysis');
        console.log('------------------------------------------');
        try {
            this.log('Starting database performance analysis...');
            const { databasePerformanceService } = await Promise.resolve().then(() => __importStar(require('../src/services/database-performance.service')));
            console.log('  🔍 Collecting database metrics...');
            const metrics = await databasePerformanceService.getPerformanceMetrics();
            console.log('  📈 Generating optimization recommendations...');
            const recommendations = await databasePerformanceService.getOptimizationRecommendations();
            this.results.database = {
                metrics,
                recommendations,
                timestamp: new Date().toISOString()
            };
            console.log(`  ✅ Database analysis completed`);
            console.log(`     Status: ${metrics.status}`);
            console.log(`     Avg Query Time: ${metrics.performance.avgQueryTime.toFixed(2)}ms`);
            console.log(`     Connection Pool Usage: ${metrics.performance.connectionPoolUsage.toFixed(1)}%`);
            console.log(`     Recommendations: ${recommendations.length}`);
            this.log(`Database analysis completed with ${recommendations.length} recommendations`);
        }
        catch (error) {
            console.error('  ❌ Database analysis failed:', error);
            this.log(`Database analysis failed: ${error.message}`);
            throw error;
        }
    }
    async executeLambdaAnalysis() {
        console.log('\n⚡ Phase 2: Lambda Performance Analysis');
        console.log('--------------------------------------');
        try {
            this.log('Starting Lambda performance analysis...');
            console.log('  🔍 Analyzing Lambda functions...');
            const { stdout, stderr } = await execAsync('node scripts/lambda-performance-analyzer.js', {
                env: {
                    ...process.env,
                    STAGE: this.config.environment,
                    AWS_REGION: process.env.AWS_REGION || 'ap-south-1'
                }
            });
            if (stderr) {
                console.warn('  ⚠️ Lambda analyzer warnings:', stderr);
            }
            const resultsPattern = /Analysis results saved to: (.*\.json)/;
            const match = stdout.match(resultsPattern);
            if (match) {
                const resultsPath = match[1];
                const rawResults = await fs.readFile(resultsPath, 'utf-8');
                this.results.lambda = JSON.parse(rawResults);
            }
            console.log('  ✅ Lambda analysis completed');
            if (this.results.lambda && this.results.lambda.summary) {
                console.log(`     Functions Analyzed: ${this.results.lambda.summary.totalFunctions}`);
                console.log(`     Avg Cold Start: ${this.results.lambda.summary.avgColdStartDuration?.toFixed(0)}ms`);
                console.log(`     Critical Issues: ${this.results.lambda.summary.criticalIssues}`);
            }
            this.log('Lambda analysis completed successfully');
        }
        catch (error) {
            console.error('  ❌ Lambda analysis failed:', error);
            this.log(`Lambda analysis failed: ${error.message}`);
            this.results.lambda = {
                summary: {
                    totalFunctions: 0,
                    avgColdStartDuration: 0,
                    criticalIssues: 0
                }
            };
        }
    }
    async executeRealTimeTests() {
        console.log('\n🌐 Phase 3: Real-time Performance Testing');
        console.log('-----------------------------------------');
        try {
            this.log('Starting real-time performance tests...');
            console.log('  🚀 Initiating load testing...');
            console.log(`     Concurrent Users: ${this.config.concurrentUsers}`);
            console.log(`     Test Duration: ${this.config.testDuration}s`);
            const RealTimePerformanceTestSuite = (await Promise.resolve().then(() => __importStar(require('./real-time-performance-tests')))).default;
            const testConfig = {
                baseUrl: this.getBaseUrl(),
                webSocketUrl: this.getWebSocketUrl(),
                redisUrl: this.getRedisUrl(),
                concurrentUsers: this.config.concurrentUsers,
                testDuration: this.config.testDuration,
                rampUpTime: Math.ceil(this.config.testDuration * 0.1),
                environment: this.config.environment
            };
            const testSuite = new RealTimePerformanceTestSuite(testConfig);
            await testSuite.runComprehensiveTests();
            const resultsFiles = await fs.readdir('./');
            const latestResults = resultsFiles
                .filter(f => f.startsWith('performance-test-') && f.endsWith('.json'))
                .sort()
                .pop();
            if (latestResults) {
                const rawResults = await fs.readFile(latestResults, 'utf-8');
                this.results.realTime = JSON.parse(rawResults);
            }
            console.log('  ✅ Real-time testing completed');
            if (this.results.realTime) {
                console.log(`     API Endpoints Tested: ${this.results.realTime.api?.length || 0}`);
                console.log(`     WebSocket Latency: ${this.results.realTime.webSocket?.averageLatency?.toFixed(0)}ms`);
                console.log(`     Redis Hit Ratio: ${this.results.realTime.redis?.cacheHitRatio?.toFixed(1)}%`);
            }
            this.log('Real-time performance tests completed successfully');
        }
        catch (error) {
            console.error('  ❌ Real-time testing failed:', error);
            this.log(`Real-time testing failed: ${error.message}`);
            this.results.realTime = {};
        }
    }
    async applyOptimizations() {
        console.log('\n⚙️ Phase 4: Applying Performance Optimizations');
        console.log('----------------------------------------------');
        try {
            this.log('Starting optimization application...');
            const optimizations = {
                applied: [],
                failed: [],
                recommendations: []
            };
            if (this.results.database && this.results.database.recommendations) {
                console.log('  🗄️ Applying database optimizations...');
                try {
                    const { databasePerformanceService } = await Promise.resolve().then(() => __importStar(require('../src/services/database-performance.service')));
                    const dbOptimizations = await databasePerformanceService.applyAutomaticOptimizations();
                    optimizations.applied.push(...dbOptimizations.applied);
                    optimizations.failed.push(...dbOptimizations.failed);
                    optimizations.recommendations.push(...dbOptimizations.recommendations);
                    console.log(`     ✅ Applied ${dbOptimizations.applied.length} database optimizations`);
                }
                catch (error) {
                    console.warn(`     ⚠️ Database optimization failed: ${error.message}`);
                }
            }
            if (this.results.lambda && this.results.lambda.recommendations) {
                console.log('  ⚡ Generating Lambda optimization recommendations...');
                for (const rec of this.results.lambda.recommendations.slice(0, 5)) {
                    optimizations.recommendations.push({
                        queryPattern: 'Lambda Function',
                        table: rec.functions?.join(', ') || 'Multiple functions',
                        issue: rec.description,
                        recommendation: rec.action,
                        priority: rec.priority,
                        estimatedImprovement: rec.impact,
                        implementationSteps: [`Implement: ${rec.action}`]
                    });
                }
                console.log(`     📝 Generated ${optimizations.recommendations.length} Lambda recommendations`);
            }
            this.results.optimization = optimizations;
            console.log('  ✅ Optimization phase completed');
            console.log(`     Applied: ${optimizations.applied.length}`);
            console.log(`     Recommendations: ${optimizations.recommendations.length}`);
            this.log(`Optimization phase completed: ${optimizations.applied.length} applied, ${optimizations.recommendations.length} recommendations`);
        }
        catch (error) {
            console.error('  ❌ Optimization application failed:', error);
            this.log(`Optimization application failed: ${error.message}`);
        }
    }
    async generateComprehensiveReport() {
        console.log('\n📊 Phase 5: Generating Comprehensive Report');
        console.log('------------------------------------------');
        try {
            this.log('Starting comprehensive report generation...');
            console.log('  📄 Compiling performance data...');
            const combinedResults = {
                timestamp: new Date().toISOString(),
                environment: this.config.environment,
                testConfiguration: {
                    concurrentUsers: this.config.concurrentUsers,
                    testDuration: this.config.testDuration
                },
                ...this.results
            };
            const resultsPath = './performance-analysis-results/combined-results.json';
            await fs.mkdir('./performance-analysis-results', { recursive: true });
            await fs.writeFile(resultsPath, JSON.stringify(combinedResults, null, 2));
            console.log('  📊 Generating benchmark report...');
            const PerformanceBenchmarkReporter = (await Promise.resolve().then(() => __importStar(require('./performance-benchmark-reporter')))).default;
            const reporter = new PerformanceBenchmarkReporter();
            await reporter.generateBenchmarkReport(resultsPath);
            console.log('  ✅ Comprehensive report generated');
            this.log('Comprehensive report generation completed');
        }
        catch (error) {
            console.error('  ❌ Report generation failed:', error);
            this.log(`Report generation failed: ${error.message}`);
        }
    }
    async generateOrchestrationReport() {
        const endTime = perf_hooks_1.performance.now();
        const duration = (endTime - this.startTime) / 1000;
        const testsExecuted = [];
        if (this.config.runDatabaseAnalysis)
            testsExecuted.push('Database Analysis');
        if (this.config.runLambdaAnalysis)
            testsExecuted.push('Lambda Analysis');
        if (this.config.runRealTimeTests)
            testsExecuted.push('Real-time Testing');
        if (this.config.enableOptimizations)
            testsExecuted.push('Optimization Application');
        if (this.config.runComprehensiveReport)
            testsExecuted.push('Report Generation');
        const summary = this.calculateSummaryMetrics();
        const report = {
            startTime: new Date(Date.now() - duration * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration,
            environment: this.config.environment,
            testsExecuted,
            results: this.results,
            summary,
            nextSteps: this.generateNextSteps(summary)
        };
        if (this.config.saveResults) {
            await this.saveOrchestrationReport(report);
        }
        return report;
    }
    calculateSummaryMetrics() {
        let overallScore = 0;
        let scoreCount = 0;
        let criticalIssues = 0;
        let optimizationsApplied = 0;
        let recommendationsGenerated = 0;
        if (this.results.database) {
            const dbStatus = this.results.database.metrics?.status;
            if (dbStatus === 'healthy')
                overallScore += 85;
            else if (dbStatus === 'degraded')
                overallScore += 65;
            else
                overallScore += 40;
            scoreCount++;
            recommendationsGenerated += this.results.database.recommendations?.length || 0;
        }
        if (this.results.lambda && this.results.lambda.summary) {
            const lambdaScore = this.calculateLambdaScore(this.results.lambda.summary);
            overallScore += lambdaScore;
            scoreCount++;
            criticalIssues += this.results.lambda.summary.criticalIssues || 0;
        }
        if (this.results.realTime) {
            const realtimeScore = this.calculateRealtimeScore(this.results.realTime);
            overallScore += realtimeScore;
            scoreCount++;
        }
        if (this.results.optimization) {
            optimizationsApplied = this.results.optimization.applied?.length || 0;
            recommendationsGenerated += this.results.optimization.recommendations?.length || 0;
        }
        const finalScore = scoreCount > 0 ? Math.round(overallScore / scoreCount) : 0;
        const readinessLevel = Math.max(0, finalScore - (criticalIssues * 10));
        return {
            overallScore: finalScore,
            readinessLevel: Math.min(100, readinessLevel),
            criticalIssues,
            optimizationsApplied,
            recommendationsGenerated
        };
    }
    calculateLambdaScore(summary) {
        let score = 100;
        if (summary.avgColdStartDuration > 3000)
            score -= 30;
        else if (summary.avgColdStartDuration > 1500)
            score -= 15;
        if (summary.avgExecutionDuration > 5000)
            score -= 20;
        else if (summary.avgExecutionDuration > 2000)
            score -= 10;
        if (summary.criticalIssues > 5)
            score -= 25;
        else if (summary.criticalIssues > 2)
            score -= 10;
        return Math.max(0, score);
    }
    calculateRealtimeScore(realTime) {
        let score = 100;
        if (realTime.api && realTime.api.length > 0) {
            const avgResponse = realTime.api.reduce((sum, api) => sum + api.averageResponseTime, 0) / realTime.api.length;
            const avgError = realTime.api.reduce((sum, api) => sum + api.errorRate, 0) / realTime.api.length;
            if (avgResponse > 500)
                score -= 20;
            else if (avgResponse > 200)
                score -= 10;
            if (avgError > 5)
                score -= 25;
            else if (avgError > 1)
                score -= 10;
        }
        if (realTime.webSocket) {
            if (realTime.webSocket.averageLatency > 100)
                score -= 15;
            if (realTime.webSocket.errorRate > 5)
                score -= 20;
        }
        if (realTime.redis) {
            if (realTime.redis.cacheHitRatio < 80)
                score -= 15;
            if (realTime.redis.averageGetTime > 20)
                score -= 10;
        }
        return Math.max(0, score);
    }
    generateNextSteps(summary) {
        const nextSteps = [];
        if (summary.overallScore < 70) {
            nextSteps.push('🚨 Address critical performance issues before production deployment');
        }
        if (summary.criticalIssues > 0) {
            nextSteps.push(`⚠️ Resolve ${summary.criticalIssues} critical issues identified in analysis`);
        }
        if (summary.readinessLevel < 85) {
            nextSteps.push('🔧 Implement recommended optimizations to improve production readiness');
        }
        if (summary.optimizationsApplied === 0 && summary.recommendationsGenerated > 0) {
            nextSteps.push('💡 Review and implement performance optimization recommendations');
        }
        if (summary.overallScore >= 85) {
            nextSteps.push('✅ System is ready for production deployment');
            nextSteps.push('📊 Set up continuous performance monitoring');
        }
        nextSteps.push('📈 Schedule regular performance testing and optimization cycles');
        return nextSteps;
    }
    async saveOrchestrationReport(report) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const reportsDir = './performance-orchestration-reports';
            await fs.mkdir(reportsDir, { recursive: true });
            const reportPath = path.join(reportsDir, `orchestration-report-${timestamp}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            const logPath = path.join(reportsDir, `execution-log-${timestamp}.txt`);
            await fs.writeFile(logPath, this.executionLog.join('\n'));
            console.log(`\n📄 Orchestration report saved: ${reportPath}`);
            console.log(`📝 Execution log saved: ${logPath}`);
        }
        catch (error) {
            console.error('Failed to save orchestration report:', error);
        }
    }
    displayFinalSummary(report) {
        console.log('\n🎯 FINAL PERFORMANCE ANALYSIS SUMMARY');
        console.log('=====================================');
        console.log(`⏱️  Total Execution Time: ${Math.round(report.duration)}s`);
        console.log(`🧪 Tests Executed: ${report.testsExecuted.join(', ')}`);
        console.log(`📊 Overall Performance Score: ${report.summary.overallScore}/100`);
        console.log(`🚀 Production Readiness: ${report.summary.readinessLevel}%`);
        console.log(`⚠️  Critical Issues: ${report.summary.criticalIssues}`);
        console.log(`⚙️  Optimizations Applied: ${report.summary.optimizationsApplied}`);
        console.log(`💡 Recommendations Generated: ${report.summary.recommendationsGenerated}`);
        console.log('\n🎯 NEXT STEPS:');
        for (const step of report.nextSteps) {
            console.log(`   ${step}`);
        }
        console.log('\n✅ Comprehensive performance analysis completed!');
        console.log('💡 Check the generated reports for detailed insights and optimization steps.');
    }
    getBaseUrl() {
        switch (this.config.environment) {
            case 'production':
                return process.env.PRODUCTION_API_URL || 'https://api.hasivu.com';
            case 'staging':
                return process.env.STAGING_API_URL || 'https://staging-api.hasivu.com';
            default:
                return 'http://localhost:3000';
        }
    }
    getWebSocketUrl() {
        switch (this.config.environment) {
            case 'production':
                return process.env.PRODUCTION_WS_URL || 'wss://api.hasivu.com';
            case 'staging':
                return process.env.STAGING_WS_URL || 'wss://staging-api.hasivu.com';
            default:
                return 'ws://localhost:3000';
        }
    }
    getRedisUrl() {
        switch (this.config.environment) {
            case 'production':
                return process.env.PRODUCTION_REDIS_URL || 'redis://production-redis:6379';
            case 'staging':
                return process.env.STAGING_REDIS_URL || 'redis://staging-redis:6379';
            default:
                return 'redis://localhost:6379';
        }
    }
    log(message) {
        const timestamp = new Date().toISOString();
        this.executionLog.push(`[${timestamp}] ${message}`);
    }
}
const configurations = {
    development: {
        environment: 'development',
        runDatabaseAnalysis: true,
        runLambdaAnalysis: false,
        runRealTimeTests: true,
        runComprehensiveReport: true,
        concurrentUsers: 10,
        testDuration: 60,
        enableOptimizations: true,
        saveResults: true
    },
    staging: {
        environment: 'staging',
        runDatabaseAnalysis: true,
        runLambdaAnalysis: true,
        runRealTimeTests: true,
        runComprehensiveReport: true,
        concurrentUsers: 50,
        testDuration: 300,
        enableOptimizations: false,
        saveResults: true
    },
    production: {
        environment: 'production',
        runDatabaseAnalysis: true,
        runLambdaAnalysis: true,
        runRealTimeTests: true,
        runComprehensiveReport: true,
        concurrentUsers: 100,
        testDuration: 600,
        enableOptimizations: false,
        saveResults: true
    },
    quick: {
        environment: 'development',
        runDatabaseAnalysis: true,
        runLambdaAnalysis: false,
        runRealTimeTests: false,
        runComprehensiveReport: true,
        concurrentUsers: 5,
        testDuration: 30,
        enableOptimizations: false,
        saveResults: true
    }
};
async function main() {
    const configName = process.argv[2] || 'development';
    if (!configurations[configName]) {
        console.error(`❌ Invalid configuration: ${configName}`);
        console.error(`Available configurations: ${Object.keys(configurations).join(', ')}`);
        process.exit(1);
    }
    const config = configurations[configName];
    console.log(`🔧 Using configuration: ${configName}`);
    const orchestrator = new ComprehensivePerformanceOrchestrator(config);
    try {
        const report = await orchestrator.executePerformanceAnalysis();
        if (report.summary.criticalIssues > 0) {
            process.exit(2);
        }
        else if (report.summary.overallScore < 70) {
            process.exit(1);
        }
        else {
            process.exit(0);
        }
    }
    catch (error) {
        console.error('❌ Performance analysis failed:', error);
        process.exit(3);
    }
}
if (require.main === module) {
    main();
}
exports.default = ComprehensivePerformanceOrchestrator;
//# sourceMappingURL=comprehensive-performance-orchestrator.js.map