"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const fs_1 = require("fs");
const logger_1 = require("../shared/utils/logger");
const e2e_test_suite_1 = require("./e2e-test-suite");
const load_test_suite_1 = require("./load-test-suite");
const chaos_engineering_1 = require("./chaos-engineering");
const email_service_1 = require("../shared/services/email.service");
class TestRunner {
    static instance;
    config;
    redisService;
    performanceService;
    emailService;
    executionContext;
    isRunning = false;
    currentExecution = null;
    constructor(config) {
        this.config = config;
        this.redisService = null;
        this.performanceService = null;
        this.emailService = email_service_1.EmailService.getInstance();
        this.executionContext = this.createExecutionContext();
    }
    static getInstance(config) {
        if (!TestRunner.instance) {
            if (!config) {
                throw new Error('TestRunner configuration required for first initialization');
            }
            TestRunner.instance = new TestRunner(config);
        }
        return TestRunner.instance;
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
        logger_1.logger.info('Test runner configuration updated', {
            environment: this.config.environment,
            concurrent: this.config.concurrent,
            enabledSuites: {
                e2e: this.config.enableE2E,
                load: this.config.enableLoad,
                chaos: this.config.enableChaos
            }
        });
    }
    async runTestSuite() {
        if (this.isRunning) {
            throw new Error('Test suite is already running');
        }
        this.isRunning = true;
        this.currentExecution = this.generateExecutionId();
        const startTime = new Date();
        try {
            logger_1.logger.info('Starting comprehensive test suite', {
                executionId: this.currentExecution,
                environment: this.config.environment,
                concurrent: this.config.concurrent,
                enabledSuites: {
                    e2e: this.config.enableE2E,
                    load: this.config.enableLoad,
                    chaos: this.config.enableChaos
                }
            });
            if (this.config.enablePerformanceMonitoring) {
                await this.performanceService.startMonitoring();
            }
            await this.performHealthChecks();
            const testSuites = {};
            const issues = [];
            if (this.config.concurrent && this.config.environment !== 'production') {
                await this.runConcurrentTests(testSuites, issues);
            }
            else {
                await this.runSequentialTests(testSuites, issues);
            }
            const summary = await this.generateTestSummary(this.currentExecution, startTime, new Date(), testSuites, issues);
            if (this.config.reporting.enabled) {
                await this.generateReports(summary);
            }
            if (this.config.notifications.enabled) {
                await this.sendNotifications(summary);
            }
            await this.cleanup();
            logger_1.logger.info('Test suite execution completed', {
                executionId: this.currentExecution,
                duration: summary.duration,
                overallStatus: summary.overallStatus,
                totalTests: summary.totalTests,
                passedTests: summary.passedTests,
                failedTests: summary.failedTests
            });
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Test suite execution failed', {
                executionId: this.currentExecution,
                error: error.message,
                stack: error.stack
            });
            const errorSummary = await this.generateErrorSummary(this.currentExecution || 'unknown', startTime, new Date(), error);
            if (this.config.notifications.enabled && this.config.notifications.onFailure) {
                await this.sendFailureNotification(error);
            }
            throw error;
        }
        finally {
            this.isRunning = false;
            this.currentExecution = null;
            if (this.config.enablePerformanceMonitoring) {
                await this.performanceService.stopMonitoring();
            }
        }
    }
    async runConcurrentTests(testSuites, issues) {
        const promises = [];
        if (this.config.enableE2E) {
            promises.push(this.runE2ETests().then(result => ({ type: 'e2e', result })));
        }
        if (this.config.enableLoad) {
            promises.push(this.runLoadTests().then(result => ({ type: 'load', result })));
        }
        if (this.config.enableChaos && promises.length === 0) {
            promises.push(this.runChaosTests().then(result => ({ type: 'chaos', result })));
        }
        const concurrentResults = await Promise.allSettled(promises);
        concurrentResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const { type, result: testResult } = result.value;
                this.processTestResult(type, testResult, testSuites, issues);
            }
            else {
                logger_1.logger.error(`Concurrent test failed: ${result.reason}`);
                issues.push({
                    id: this.generateIssueId(),
                    type: 'error',
                    severity: 'critical',
                    component: 'system',
                    title: 'Concurrent Test Execution Failed',
                    description: `Test execution failed: ${result.reason}`,
                    timestamp: new Date()
                });
            }
        });
    }
    async runSequentialTests(testSuites, issues) {
        if (this.config.enableE2E) {
            try {
                logger_1.logger.info('Starting E2E test suite');
                const e2eResults = await this.runE2ETests();
                this.processTestResult('e2e', e2eResults, testSuites, issues);
                await this.delay(2000);
            }
            catch (error) {
                this.handleTestSuiteError('e2e', error, testSuites, issues);
                if (this.config.failFast)
                    return;
            }
        }
        if (this.config.enableLoad) {
            try {
                logger_1.logger.info('Starting Load test suite');
                const loadResults = await this.runLoadTests();
                this.processTestResult('load', loadResults, testSuites, issues);
                await this.delay(5000);
            }
            catch (error) {
                this.handleTestSuiteError('load', error, testSuites, issues);
                if (this.config.failFast)
                    return;
            }
        }
        if (this.config.enableChaos) {
            try {
                logger_1.logger.info('Starting Chaos engineering suite');
                const chaosResults = await this.runChaosTests();
                this.processTestResult('chaos', chaosResults, testSuites, issues);
            }
            catch (error) {
                this.handleTestSuiteError('chaos', error, testSuites, issues);
            }
        }
    }
    async runE2ETests() {
        const e2eSuite = e2e_test_suite_1.E2ETestSuite.getInstance(this.config.e2eConfig);
        return await e2eSuite.runTestSuite([]);
    }
    async runLoadTests() {
        const loadSuite = load_test_suite_1.LoadTestSuite.getInstance(this.config.loadConfig);
        return await loadSuite.runLoadTest('Comprehensive Load Test');
    }
    async runChaosTests() {
        const chaosSuite = chaos_engineering_1.ChaosEngineeringService.getInstance();
        const results = chaosSuite.getExperimentResults();
        return results;
    }
    processTestResult(type, result, testSuites, issues) {
        switch (type) {
            case 'e2e':
                testSuites.e2e = this.processE2EResults(result);
                this.extractE2EIssues(result, issues);
                break;
            case 'load':
                testSuites.load = this.processLoadResults(result);
                this.extractLoadIssues(result, issues);
                break;
            case 'chaos':
                testSuites.chaos = this.processChaosResults(result);
                this.extractChaosIssues(result, issues);
                break;
        }
    }
    processE2EResults(results) {
        const totalScenarios = results.length;
        const passedScenarios = results.filter(r => r.status === 'passed').length;
        const failedScenarios = results.filter(r => r.status === 'failed').length;
        const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / totalScenarios;
        const passRate = (passedScenarios / totalScenarios) * 100;
        const criticalFailures = results.filter(r => r.status === 'failed' && r.steps.some(s => s.critical)).length;
        return {
            status: passRate >= 95 ? 'passed' : 'failed',
            results,
            summary: {
                totalScenarios,
                passedScenarios,
                failedScenarios,
                averageResponseTime,
                passRate,
                criticalFailures
            }
        };
    }
    processLoadResults(result) {
        const successRate = ((result.metrics.totalRequests - result.metrics.failedRequests) / result.metrics.totalRequests) * 100;
        return {
            status: result.testStatus === 'warning' ? 'passed' : result.testStatus,
            results: result,
            summary: {
                totalRequests: result.metrics.totalRequests,
                successfulRequests: result.metrics.successfulRequests,
                failedRequests: result.metrics.failedRequests,
                averageResponseTime: result.metrics.averageResponseTime,
                throughput: Array.isArray(result.metrics.requestsPerSecond)
                    ? result.metrics.requestsPerSecond[result.metrics.requestsPerSecond.length - 1] || 0
                    : result.metrics.requestsPerSecond || 0,
                errorRate: result.metrics.errorRate,
                responseTime: result.metrics.p95ResponseTime
            }
        };
    }
    processChaosResults(results) {
        const totalExperiments = results.length;
        const successfulExperiments = results.filter(r => r.status === 'passed').length;
        const failedExperiments = results.filter(r => r.status === 'failed').length;
        const resilienceScore = results.reduce((sum, r) => sum + (r.resilienceMetrics?.overallScore || 0), 0) / totalExperiments;
        const recoveryTime = results.reduce((sum, r) => sum + (r.recoveryTime || 0), 0) / totalExperiments;
        const criticalIssues = results.filter(r => r.criticalFailures && r.criticalFailures.length > 0).length;
        return {
            status: resilienceScore >= 80 ? 'passed' : 'failed',
            results,
            summary: {
                totalExperiments,
                successfulExperiments,
                failedExperiments,
                resilienceScore,
                recoveryTime,
                criticalIssues
            }
        };
    }
    extractE2EIssues(results, issues) {
        results.forEach(result => {
            if (result.status === 'failed') {
                result.steps.forEach(step => {
                    if (step.status !== 'passed' && step.error) {
                        issues.push({
                            id: this.generateIssueId(),
                            type: 'failure',
                            severity: step.critical ? 'critical' : 'high',
                            component: 'e2e',
                            title: `E2E Step Failed: ${step.action || step.stepName}`,
                            description: step.error,
                            timestamp: new Date(),
                            affectedEndpoints: [step.endpoint || ''],
                            suggestedFix: this.generateE2ESuggestedFix(step)
                        });
                    }
                });
            }
        });
    }
    extractLoadIssues(result, issues) {
        if (result.metrics.p95ResponseTime > 2000) {
            issues.push({
                id: this.generateIssueId(),
                type: 'performance',
                severity: result.metrics.p95ResponseTime > 5000 ? 'critical' : 'high',
                component: 'load',
                title: 'High Response Time Detected',
                description: `P95 response time (${result.metrics.p95ResponseTime}ms) exceeds acceptable threshold`,
                timestamp: new Date(),
                suggestedFix: 'Consider optimizing database queries, adding caching, or scaling resources'
            });
        }
        if (result.metrics.errorRate > 5) {
            issues.push({
                id: this.generateIssueId(),
                type: 'error',
                severity: result.metrics.errorRate > 15 ? 'critical' : 'high',
                component: 'load',
                title: 'High Error Rate Detected',
                description: `Error rate (${result.metrics.errorRate}%) exceeds acceptable threshold`,
                timestamp: new Date(),
                suggestedFix: 'Investigate server logs for recurring errors and implement proper error handling'
            });
        }
        result.bottlenecks.forEach(bottleneck => {
            issues.push({
                id: this.generateIssueId(),
                type: 'performance',
                severity: bottleneck.severity,
                component: 'load',
                title: `Performance Bottleneck: ${bottleneck.component || 'unknown'}`,
                description: bottleneck.issue || bottleneck.description,
                timestamp: new Date(),
                suggestedFix: bottleneck.recommendation || bottleneck.suggestedFixes.join(', ')
            });
        });
    }
    extractChaosIssues(results, issues) {
        results.forEach(result => {
            if (result.criticalFailures) {
                result.criticalFailures.forEach(failure => {
                    issues.push({
                        id: this.generateIssueId(),
                        type: 'error',
                        severity: 'critical',
                        component: 'chaos',
                        title: `Chaos Experiment Critical Failure: ${result.experimentType}`,
                        description: failure,
                        timestamp: new Date(),
                        suggestedFix: 'Implement proper resilience patterns and error handling for this failure mode'
                    });
                });
            }
        });
    }
    async generateTestSummary(executionId, startTime, endTime, testSuites, issues) {
        const duration = endTime.getTime() - startTime.getTime();
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;
        Object.values(testSuites).forEach(suite => {
            if (suite?.summary) {
                if ('totalScenarios' in suite.summary) {
                    totalTests += suite.summary.totalScenarios;
                    passedTests += suite.summary.passedScenarios;
                    failedTests += suite.summary.failedScenarios;
                }
                if ('totalExperiments' in suite.summary) {
                    totalTests += suite.summary.totalExperiments;
                    passedTests += suite.summary.successfulExperiments;
                    failedTests += suite.summary.failedExperiments;
                }
            }
        });
        const criticalIssues = issues.filter(i => i.severity === 'critical').length;
        const overallStatus = criticalIssues > 0 ? 'failed' :
            failedTests > 0 ? 'partial' : 'passed';
        const performance = await this.generatePerformanceMetrics();
        const recommendations = this.generateRecommendations(testSuites, issues);
        const artifacts = await this.generateArtifactsPaths(executionId);
        return {
            executionId,
            startTime,
            endTime,
            duration,
            environment: this.config.environment,
            overallStatus,
            totalTests,
            passedTests,
            failedTests,
            skippedTests,
            testSuites,
            performance,
            issues,
            recommendations,
            artifacts
        };
    }
    async generatePerformanceMetrics() {
        if (!this.config.enablePerformanceMonitoring) {
            return {
                systemMetrics: {
                    cpuUsage: [],
                    memoryUsage: [],
                    networkIO: [],
                    diskIO: []
                },
                applicationMetrics: {
                    responseTime: [],
                    throughput: [],
                    errorRate: [],
                    concurrentUsers: []
                },
                recommendations: []
            };
        }
        const metrics = await this.performanceService.getMetrics();
        return {
            systemMetrics: {
                cpuUsage: metrics.system.cpu.history,
                memoryUsage: metrics.system.memory.history,
                networkIO: metrics.system.network.history,
                diskIO: metrics.system.disk.history
            },
            applicationMetrics: {
                responseTime: metrics.application.responseTime.history,
                throughput: metrics.application.throughput.history,
                errorRate: metrics.application.errorRate.history,
                concurrentUsers: metrics.application.concurrentUsers.history
            },
            recommendations: metrics.recommendations
        };
    }
    generateRecommendations(testSuites, issues) {
        const recommendations = [];
        if (testSuites.e2e && testSuites.e2e.summary.passRate < 95) {
            recommendations.push(`E2E pass rate (${testSuites.e2e.summary.passRate.toFixed(1)}%) below target (95%). Review failed scenarios and improve test stability.`);
        }
        if (testSuites.load && testSuites.load.summary.responseTime > 2000) {
            recommendations.push(`Load test response time (${testSuites.load.summary.responseTime}ms) exceeds target (2000ms). Consider performance optimization.`);
        }
        if (testSuites.chaos && testSuites.chaos.summary.resilienceScore < 80) {
            recommendations.push(`System resilience score (${testSuites.chaos.summary.resilienceScore.toFixed(1)}) below target (80). Implement additional resilience patterns.`);
        }
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        if (criticalIssues.length > 0) {
            recommendations.push(`${criticalIssues.length} critical issues detected. Address these immediately before production deployment.`);
        }
        const performanceIssues = issues.filter(i => i.type === 'performance');
        if (performanceIssues.length > 0) {
            recommendations.push(`${performanceIssues.length} performance issues detected. Review bottlenecks and optimize accordingly.`);
        }
        return recommendations;
    }
    async generateArtifactsPaths(executionId) {
        const timestamp = Date.now();
        const basePath = this.config.reporting.outputPath;
        return {
            reportPath: `${basePath}/test-report-${executionId}-${timestamp}.json`,
            metricsPath: `${basePath}/metrics-${executionId}-${timestamp}.json`,
            logsPath: `${basePath}/logs-${executionId}-${timestamp}.log`,
            screenshotsPath: this.config.enableE2E ? `${basePath}/screenshots-${executionId}` : undefined,
            videosPath: this.config.enableE2E ? `${basePath}/videos-${executionId}` : undefined
        };
    }
    async generateReports(summary) {
        const promises = [];
        if (this.config.reporting.formats.includes('json')) {
            promises.push(this.generateJSONReport(summary));
        }
        if (this.config.reporting.formats.includes('html')) {
            promises.push(this.generateHTMLReport(summary));
        }
        if (this.config.reporting.formats.includes('junit')) {
            promises.push(this.generateJUnitReport(summary));
        }
        if (this.config.reporting.formats.includes('csv')) {
            promises.push(this.generateCSVReport(summary));
        }
        await Promise.all(promises);
        logger_1.logger.info(`Test reports generated`, {
            reportPath: summary.artifacts.reportPath,
            metricsPath: summary.artifacts.metricsPath,
            formats: this.config.reporting.formats
        });
    }
    async generateJSONReport(summary) {
        const reportContent = JSON.stringify(summary, null, 2);
        await fs_1.promises.writeFile(summary.artifacts.reportPath, reportContent, 'utf8');
    }
    async generateHTMLReport(summary) {
        const htmlPath = summary.artifacts.reportPath.replace('.json', '.html');
        const htmlContent = this.generateHTMLContent(summary);
        await fs_1.promises.writeFile(htmlPath, htmlContent, 'utf8');
    }
    generateHTMLContent(summary) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report - ${summary.executionId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-partial { color: #ffc107; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #dc3545; background: #f8f9fa; }
        .recommendation { margin: 5px 0; padding: 8px; background: #d1ecf1; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Execution Report</h1>
        <p><strong>Execution ID:</strong> ${summary.executionId}</p>
        <p><strong>Environment:</strong> ${summary.environment}</p>
        <p><strong>Status:</strong> <span class="status-${summary.overallStatus}">${summary.overallStatus.toUpperCase()}</span></p>
        <p><strong>Duration:</strong> ${summary.duration}ms</p>
    </div>

    <div class="metrics">
        <h2>Test Metrics</h2>
        <div class="metric">
            <strong>Total Tests:</strong> ${summary.totalTests}
        </div>
        <div class="metric">
            <strong>Passed:</strong> <span class="status-passed">${summary.passedTests}</span>
        </div>
        <div class="metric">
            <strong>Failed:</strong> <span class="status-failed">${summary.failedTests}</span>
        </div>
        <div class="metric">
            <strong>Pass Rate:</strong> ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%
        </div>
    </div>

    ${this.generateTestSuiteHTML(summary.testSuites)}

    <div class="issues">
        <h2>Issues (${summary.issues.length})</h2>
        ${summary.issues.map(issue => `
            <div class="issue">
                <strong>${issue.title}</strong> [${issue.severity}]<br>
                <em>${issue.component}</em> - ${issue.description}
                ${issue.suggestedFix ? `<br><strong>Suggested Fix:</strong> ${issue.suggestedFix}` : ''}
            </div>
        `).join('')}
    </div>

    <div class="recommendations">
        <h2>Recommendations</h2>
        ${summary.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
    </div>
</body>
</html>`;
    }
    generateTestSuiteHTML(testSuites) {
        let html = '<div class="test-suites"><h2>Test Suites</h2>';
        if (testSuites.e2e) {
            html += `
        <h3>E2E Tests</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.e2e.status}">${testSuites.e2e.status}</td></tr>
          <tr><td>Total Scenarios</td><td>${testSuites.e2e.summary.totalScenarios}</td></tr>
          <tr><td>Passed</td><td>${testSuites.e2e.summary.passedScenarios}</td></tr>
          <tr><td>Failed</td><td>${testSuites.e2e.summary.failedScenarios}</td></tr>
          <tr><td>Pass Rate</td><td>${testSuites.e2e.summary.passRate.toFixed(1)}%</td></tr>
          <tr><td>Average Response Time</td><td>${testSuites.e2e.summary.averageResponseTime.toFixed(0)}ms</td></tr>
        </table>
      `;
        }
        if (testSuites.load) {
            html += `
        <h3>Load Tests</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.load.status}">${testSuites.load.status}</td></tr>
          <tr><td>Total Requests</td><td>${testSuites.load.summary.totalRequests}</td></tr>
          <tr><td>Successful</td><td>${testSuites.load.summary.successfulRequests}</td></tr>
          <tr><td>Failed</td><td>${testSuites.load.summary.failedRequests}</td></tr>
          <tr><td>Error Rate</td><td>${testSuites.load.summary.errorRate.toFixed(2)}%</td></tr>
          <tr><td>Average Response Time</td><td>${testSuites.load.summary.averageResponseTime.toFixed(0)}ms</td></tr>
          <tr><td>Throughput</td><td>${testSuites.load.summary.throughput.toFixed(0)} req/s</td></tr>
        </table>
      `;
        }
        if (testSuites.chaos) {
            html += `
        <h3>Chaos Engineering</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr><td>Status</td><td class="status-${testSuites.chaos.status}">${testSuites.chaos.status}</td></tr>
          <tr><td>Total Experiments</td><td>${testSuites.chaos.summary.totalExperiments}</td></tr>
          <tr><td>Successful</td><td>${testSuites.chaos.summary.successfulExperiments}</td></tr>
          <tr><td>Failed</td><td>${testSuites.chaos.summary.failedExperiments}</td></tr>
          <tr><td>Resilience Score</td><td>${testSuites.chaos.summary.resilienceScore.toFixed(1)}</td></tr>
          <tr><td>Average Recovery Time</td><td>${testSuites.chaos.summary.recoveryTime.toFixed(0)}ms</td></tr>
        </table>
      `;
        }
        html += '</div>';
        return html;
    }
    async generateJUnitReport(summary) {
        const xmlPath = summary.artifacts.reportPath.replace('.json', '.xml');
        const xmlContent = this.generateJUnitXML(summary);
        await fs_1.promises.writeFile(xmlPath, xmlContent, 'utf8');
    }
    generateJUnitXML(summary) {
        const duration = (summary.duration / 1000).toFixed(3);
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="HASIVU Test Suite" 
           tests="${summary.totalTests}" 
           failures="${summary.failedTests}" 
           errors="0" 
           time="${duration}">`;
        if (summary.testSuites.e2e) {
            xml += this.generateE2EJUnitXML(summary.testSuites.e2e);
        }
        if (summary.testSuites.load) {
            xml += this.generateLoadJUnitXML(summary.testSuites.load);
        }
        if (summary.testSuites.chaos) {
            xml += this.generateChaosJUnitXML(summary.testSuites.chaos);
        }
        xml += '\n</testsuites>';
        return xml;
    }
    generateE2EJUnitXML(e2e) {
        let xml = `\n  <testsuite name="E2E Tests" tests="${e2e.summary.totalScenarios}" failures="${e2e.summary.failedScenarios}" time="${(e2e.summary.averageResponseTime / 1000).toFixed(3)}">`;
        e2e.results.forEach(result => {
            const duration = (result.duration / 1000).toFixed(3);
            xml += `\n    <testcase classname="E2E" name="${result.scenarioName}" time="${duration}">`;
            if (result.status === 'failed') {
                const failedStep = result.steps.find(s => s.status !== 'passed');
                if (failedStep) {
                    xml += `\n      <failure message="${failedStep.error}">${failedStep.error}</failure>`;
                }
            }
            xml += '\n    </testcase>';
        });
        xml += '\n  </testsuite>';
        return xml;
    }
    generateLoadJUnitXML(load) {
        const duration = (load.results.duration / 1000).toFixed(3);
        const testName = `Load Test - ${load.results.testName}`;
        return `\n  <testsuite name="Load Tests" tests="1" failures="${load.status === 'failed' ? 1 : 0}" time="${duration}">
    <testcase classname="Load" name="${testName}" time="${duration}">
      ${load.status === 'failed' ? `<failure message="Load test failed">Performance targets not met</failure>` : ''}
    </testcase>
  </testsuite>`;
    }
    generateChaosJUnitXML(chaos) {
        let xml = `\n  <testsuite name="Chaos Engineering" tests="${chaos.summary.totalExperiments}" failures="${chaos.summary.failedExperiments}" time="0">`;
        chaos.results.forEach(result => {
            const duration = ((result.recoveryTime || 0) / 1000).toFixed(3);
            xml += `\n    <testcase classname="Chaos" name="${result.experimentType}" time="${duration}">`;
            if (result.status === 'failed') {
                xml += `\n      <failure message="Chaos experiment failed">${result.criticalFailures?.join(', ') || 'Unknown failure'}</failure>`;
            }
            xml += '\n    </testcase>';
        });
        xml += '\n  </testsuite>';
        return xml;
    }
    async generateCSVReport(summary) {
        const csvPath = summary.artifacts.reportPath.replace('.json', '.csv');
        const csvContent = this.generateCSVContent(summary);
        await fs_1.promises.writeFile(csvPath, csvContent, 'utf8');
    }
    generateCSVContent(summary) {
        let csv = 'Test Suite,Test Name,Status,Duration,Component,Details\n';
        if (summary.testSuites.e2e) {
            summary.testSuites.e2e.results.forEach(result => {
                csv += `E2E,"${result.scenarioName}",${result.status},${result.duration},E2E Testing,"Pass Rate: ${summary.testSuites.e2e.summary.passRate.toFixed(1)}%"\n`;
            });
        }
        if (summary.testSuites.load) {
            const throughput = Array.isArray(summary.testSuites.load.summary.throughput) ? summary.testSuites.load.summary.throughput[0] || 0 : summary.testSuites.load.summary.throughput || 0;
            csv += `Load,"${summary.testSuites.load.results.testName}",${summary.testSuites.load.status},${summary.testSuites.load.results.duration},Load Testing,"Throughput: ${throughput} req/s"\n`;
        }
        if (summary.testSuites.chaos) {
            summary.testSuites.chaos.results.forEach(result => {
                csv += `Chaos,"${result.experimentType}",${result.status},${result.recoveryTime || 0},Chaos Engineering,"Resilience Score: ${summary.testSuites.chaos.summary.resilienceScore.toFixed(1)}"\n`;
            });
        }
        return csv;
    }
    async sendNotifications(summary) {
        const shouldNotify = this.shouldSendNotification(summary);
        if (!shouldNotify) {
            return;
        }
        const promises = [];
        if (this.config.notifications.channels.includes('email')) {
            promises.push(this.sendEmailNotification(summary));
        }
        if (this.config.notifications.channels.includes('slack')) {
            promises.push(this.sendSlackNotification(summary));
        }
        if (this.config.notifications.channels.includes('webhook') && this.config.notifications.webhookUrl) {
            promises.push(this.sendWebhookNotification(summary));
        }
        await Promise.allSettled(promises);
    }
    shouldSendNotification(summary) {
        if (summary.overallStatus === 'failed' && this.config.notifications.onFailure) {
            return true;
        }
        if (summary.overallStatus === 'passed' && this.config.notifications.onSuccess) {
            return true;
        }
        if (this.config.notifications.onThreshold.enabled) {
            const thresholds = this.config.notifications.onThreshold;
            const passRate = (summary.passedTests / summary.totalTests) * 100;
            if (passRate < thresholds.passRateThreshold) {
                return true;
            }
            const e2eResponseTime = summary.testSuites.e2e?.summary.averageResponseTime;
            const loadResponseTime = summary.testSuites.load?.summary.averageResponseTime;
            if ((e2eResponseTime && e2eResponseTime > thresholds.responseTimeThreshold) ||
                (loadResponseTime && loadResponseTime > thresholds.responseTimeThreshold)) {
                return true;
            }
            const resilienceScore = summary.testSuites.chaos?.summary.resilienceScore;
            if (resilienceScore && resilienceScore < thresholds.resilienceScoreThreshold) {
                return true;
            }
        }
        return false;
    }
    async sendEmailNotification(summary) {
        try {
            const subject = `Test Execution ${summary.overallStatus.toUpperCase()} - ${summary.executionId}`;
            const htmlContent = this.generateEmailHTMLContent(summary);
            for (const recipient of this.config.notifications.recipients) {
                await this.emailService.sendEmail({
                    to: recipient,
                    subject,
                    html: htmlContent,
                    categories: ['testing', 'automated'],
                    customArgs: {
                        executionId: summary.executionId,
                        environment: summary.environment,
                        status: summary.overallStatus
                    }
                });
            }
            logger_1.logger.info('Email notifications sent successfully', {
                executionId: summary.executionId,
                recipients: this.config.notifications.recipients.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send email notification', {
                executionId: summary.executionId,
                error: error.message
            });
        }
    }
    generateEmailHTMLContent(summary) {
        const statusColor = summary.overallStatus === 'passed' ? '#28a745' :
            summary.overallStatus === 'partial' ? '#ffc107' : '#dc3545';
        return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: ${statusColor}; margin: 0;">
              Test Execution ${summary.overallStatus.toUpperCase()}
            </h2>
            <p><strong>Execution ID:</strong> ${summary.executionId}</p>
            <p><strong>Environment:</strong> ${summary.environment}</p>
            <p><strong>Duration:</strong> ${summary.duration}ms</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>Summary</h3>
            <ul>
              <li>Total Tests: ${summary.totalTests}</li>
              <li>Passed: <span style="color: #28a745;">${summary.passedTests}</span></li>
              <li>Failed: <span style="color: #dc3545;">${summary.failedTests}</span></li>
              <li>Pass Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%</li>
            </ul>
          </div>

          ${summary.issues.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h3>Critical Issues (${summary.issues.filter(i => i.severity === 'critical').length})</h3>
            <ul>
              ${summary.issues.filter(i => i.severity === 'critical').map(issue => `<li><strong>${issue.title}</strong> - ${issue.description}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div>
            <h3>Reports</h3>
            <p>Detailed reports and artifacts have been generated:</p>
            <ul>
              <li>JSON Report: ${summary.artifacts.reportPath}</li>
              <li>Metrics: ${summary.artifacts.metricsPath}</li>
              <li>Logs: ${summary.artifacts.logsPath}</li>
            </ul>
          </div>
        </body>
      </html>
    `;
    }
    async sendSlackNotification(summary) {
        logger_1.logger.info('Slack notification would be sent here', {
            executionId: summary.executionId
        });
    }
    async sendWebhookNotification(summary) {
        try {
            if (!this.config.notifications.webhookUrl) {
                return;
            }
            const payload = {
                executionId: summary.executionId,
                environment: summary.environment,
                status: summary.overallStatus,
                duration: summary.duration,
                totalTests: summary.totalTests,
                passedTests: summary.passedTests,
                failedTests: summary.failedTests,
                passRate: (summary.passedTests / summary.totalTests) * 100,
                criticalIssues: summary.issues.filter(i => i.severity === 'critical').length,
                timestamp: new Date().toISOString(),
                artifacts: summary.artifacts
            };
            const response = await fetch(this.config.notifications.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Webhook request failed with status ${response.status}`);
            }
            logger_1.logger.info('Webhook notification sent successfully', {
                executionId: summary.executionId,
                webhookUrl: this.config.notifications.webhookUrl
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send webhook notification', {
                executionId: summary.executionId,
                error: error.message
            });
        }
    }
    async sendFailureNotification(error) {
        try {
            const subject = `Test Execution FAILED - ${this.currentExecution}`;
            const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
            <div style="background: #f8d7da; padding: 20px; border-radius: 5px; border: 1px solid #f5c6cb;">
              <h2 style="color: #721c24; margin: 0;">Test Execution Failed</h2>
              <p><strong>Execution ID:</strong> ${this.currentExecution}</p>
              <p><strong>Environment:</strong> ${this.config.environment}</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <div style="margin-top: 20px;">
              <h3>Error Details</h3>
              <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;">
${error.stack}
              </pre>
            </div>
          </body>
        </html>
      `;
            for (const recipient of this.config.notifications.recipients) {
                await this.emailService.sendEmail({
                    to: recipient,
                    subject,
                    html: htmlContent,
                    categories: ['testing', 'error'],
                    customArgs: {
                        executionId: this.currentExecution || 'unknown',
                        environment: this.config.environment,
                        status: 'failed'
                    }
                });
            }
            logger_1.logger.info('Failure notifications sent successfully');
        }
        catch (notificationError) {
            logger_1.logger.error('Failed to send failure notification', {
                error: notificationError.message
            });
        }
    }
    async performHealthChecks() {
        const healthIssues = [];
        try {
            if (this.config.baseUrl) {
                const healthEndpoint = `${this.config.baseUrl}/health`;
                try {
                    const response = await fetch(healthEndpoint, {
                        method: 'GET'
                    });
                    if (!response.ok) {
                        healthIssues.push(`Health endpoint ${healthEndpoint} returned status ${response.status}`);
                    }
                }
                catch (error) {
                    healthIssues.push(`Health endpoint ${healthEndpoint} failed: ${error.message}`);
                }
            }
            if (this.config.enablePerformanceMonitoring) {
                try {
                    await this.redisService.ping();
                }
                catch (error) {
                    healthIssues.push(`Redis connectivity failed: ${error.message}`);
                }
            }
            if (this.config.reporting.enabled) {
                try {
                    await fs_1.promises.mkdir(this.config.reporting.outputPath, { recursive: true });
                }
                catch (error) {
                    healthIssues.push(`Cannot create reporting directory: ${error.message}`);
                }
            }
            if (healthIssues.length > 0) {
                logger_1.logger.warn('Health check issues detected', {
                    issues: healthIssues,
                    continueExecution: this.config.continueOnError
                });
                if (!this.config.continueOnError) {
                    throw new Error(`Health check failed: ${healthIssues.join(', ')}`);
                }
            }
            else {
                logger_1.logger.info('All health checks passed');
            }
        }
        catch (error) {
            logger_1.logger.error('Health check failed', {
                error: error.message,
                issues: healthIssues
            });
            throw error;
        }
    }
    handleTestSuiteError(suiteType, error, testSuites, issues) {
        logger_1.logger.error(`${suiteType} test suite failed`, {
            error: error.message,
            stack: error.stack
        });
        issues.push({
            id: this.generateIssueId(),
            type: 'error',
            severity: 'critical',
            component: suiteType,
            title: `${suiteType.toUpperCase()} Test Suite Failed`,
            description: error.message,
            stackTrace: error.stack,
            timestamp: new Date(),
            suggestedFix: `Review ${suiteType} test configuration and system requirements`
        });
        testSuites[suiteType] = {
            status: 'failed',
            results: null,
            summary: {
                totalScenarios: 0,
                passedScenarios: 0,
                failedScenarios: 0,
                averageResponseTime: 0,
                passRate: 0,
                criticalFailures: 1
            }
        };
    }
    async generateErrorSummary(executionId, startTime, endTime, error) {
        const duration = endTime.getTime() - startTime.getTime();
        const artifacts = await this.generateArtifactsPaths(executionId);
        return {
            executionId,
            startTime,
            endTime,
            duration,
            environment: this.config.environment,
            overallStatus: 'failed',
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            testSuites: {},
            performance: {
                systemMetrics: {
                    cpuUsage: [],
                    memoryUsage: [],
                    networkIO: [],
                    diskIO: []
                },
                applicationMetrics: {
                    responseTime: [],
                    throughput: [],
                    errorRate: [],
                    concurrentUsers: []
                },
                recommendations: []
            },
            issues: [{
                    id: this.generateIssueId(),
                    type: 'error',
                    severity: 'critical',
                    component: 'system',
                    title: 'Test Suite Execution Failed',
                    description: error.message,
                    stackTrace: error.stack,
                    timestamp: new Date()
                }],
            recommendations: [
                'Review system configuration and dependencies',
                'Check network connectivity and service availability',
                'Verify test configuration and environment variables'
            ],
            artifacts
        };
    }
    async cleanup() {
        try {
            if (this.config.cleanup.enabled && this.config.cleanup.autoCleanup) {
                await this.performCleanup();
            }
        }
        catch (error) {
            logger_1.logger.error('Cleanup failed', {
                error: error.message
            });
        }
    }
    async performCleanup() {
        const now = new Date();
        const cleanupPromises = [];
        if (this.config.cleanup.retainReports > 0) {
            cleanupPromises.push(this.cleanupOldFiles(this.config.reporting.outputPath, 'test-report-*.json', this.config.cleanup.retainReports));
        }
        if (this.config.cleanup.retainLogs > 0) {
            cleanupPromises.push(this.cleanupOldFiles(this.config.reporting.outputPath, 'logs-*.log', this.config.cleanup.retainLogs));
        }
        if (this.config.cleanup.retainArtifacts > 0) {
            cleanupPromises.push(this.cleanupOldFiles(this.config.reporting.outputPath, 'screenshots-*', this.config.cleanup.retainArtifacts));
            cleanupPromises.push(this.cleanupOldFiles(this.config.reporting.outputPath, 'videos-*', this.config.cleanup.retainArtifacts));
        }
        await Promise.allSettled(cleanupPromises);
        logger_1.logger.info('Cleanup completed successfully');
    }
    async cleanupOldFiles(basePath, pattern, retainDays) {
        try {
            const files = await fs_1.promises.readdir(basePath);
            const cutoffTime = new Date(Date.now() - (retainDays * 24 * 60 * 60 * 1000));
            for (const file of files) {
                if (this.matchesPattern(file, pattern)) {
                    const filePath = `${basePath}/${file}`;
                    const stats = await fs_1.promises.stat(filePath);
                    if (stats.mtime < cutoffTime) {
                        if (stats.isDirectory()) {
                            await fs_1.promises.rmdir(filePath, { recursive: true });
                        }
                        else {
                            await fs_1.promises.unlink(filePath);
                        }
                        logger_1.logger.debug('Cleaned up old file', { file: filePath });
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to cleanup old files', {
                basePath,
                pattern,
                error: error.message
            });
        }
    }
    matchesPattern(filename, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filename);
    }
    generateE2ESuggestedFix(step) {
        switch (step.action) {
            case 'GET':
            case 'POST':
            case 'PUT':
            case 'DELETE':
            case 'PATCH':
                return 'Check API endpoint availability, request format, and authentication';
            case 'NAVIGATE':
                return 'Verify URL accessibility and page load performance';
            case 'CLICK':
                return 'Ensure element is visible and clickable, check for overlays';
            case 'INPUT':
                return 'Verify input field is enabled and accepts the data format';
            case 'WAIT':
                return 'Adjust wait conditions or increase timeout for slow operations';
            default:
                return 'Review test step configuration and system state';
        }
    }
    createExecutionContext() {
        return {
            executionId: this.generateExecutionId(),
            startTime: new Date(),
            environment: this.config.environment,
            userAgent: 'HASIVU-TestRunner/1.0',
            systemInfo: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                memory: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                cpuCount: require('os').cpus().length
            }
        };
    }
    generateExecutionId() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const random = Math.random().toString(36).substr(2, 6);
        return `test-${timestamp}-${random}`;
    }
    generateIssueId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 4);
        return `issue-${timestamp}-${random}`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getExecutionStatus() {
        return {
            isRunning: this.isRunning,
            currentExecution: this.currentExecution,
            environment: this.config.environment,
            configuration: {
                concurrent: this.config.concurrent,
                enabledSuites: {
                    e2e: this.config.enableE2E,
                    load: this.config.enableLoad,
                    chaos: this.config.enableChaos
                },
                notifications: this.config.notifications.enabled,
                reporting: this.config.reporting.enabled
            }
        };
    }
    async stopExecution() {
        if (!this.isRunning) {
            throw new Error('No test execution currently running');
        }
        logger_1.logger.warn('Stopping test execution', {
            executionId: this.currentExecution
        });
        this.isRunning = false;
        if (this.config.enablePerformanceMonitoring) {
            await this.performanceService.stopMonitoring();
        }
        await this.cleanup();
    }
}
exports.TestRunner = TestRunner;
exports.default = TestRunner;
//# sourceMappingURL=test-runner.js.map