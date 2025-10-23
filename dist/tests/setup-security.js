"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_CONFIG = exports.securityHelpers = void 0;
const globals_1 = require("@jest/globals");
const dotenv_1 = require("dotenv");
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: '.env.test' });
const SECURITY_CONFIG = {
    targetUrl: process.env.SECURITY_TEST_URL || 'http://localhost:3001',
    apiKey: process.env.SECURITY_API_KEY || 'test-api-key',
    testTimeout: 300000,
    reports: {
        outputDir: './test-results/security',
        vulnerabilityReport: 'vulnerability-report.json',
        penetrationReport: 'penetration-test-report.json',
        complianceReport: 'compliance-report.json'
    },
    tools: {
        zapProxy: process.env.ZAP_PROXY_URL || 'http://localhost:8080',
        niktoPath: process.env.NIKTO_PATH || 'nikto',
        sqlmapPath: process.env.SQLMAP_PATH || 'sqlmap'
    },
    testData: {
        maliciousPayloads: [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "admin'--",
            "admin' #",
            "admin'/*",
            "' or 1=1#",
            "' or 1=1--",
            "' or 1=1/*",
            "') or '1'='1--",
            "') or ('1'='1--",
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "<iframe src=javascript:alert('XSS')></iframe>",
            "; ls -la",
            "| whoami",
            "&& cat /etc/passwd",
            "`id`",
            "$(whoami)",
            "*)(uid=*",
            "*)(|(mail=*))",
            "*))%00",
            "';return 'a'=='a' && ''==''",
            '",$where:"function(){return true}"',
            "\",$where:\"function(){return true}\"",
            "{$gt:''}",
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd"
        ],
        authBypassAttempts: [
            { username: "admin'", password: "password" },
            { username: "' OR '1'='1' --", password: "" },
            { username: "admin", password: "' OR '1'='1' --" },
            { username: "'/**/OR/**/1=1#", password: "password" }
        ]
    }
};
exports.SECURITY_CONFIG = SECURITY_CONFIG;
(0, globals_1.beforeAll)(async () => {
    console.log('🔒 Setting up security test environment...');
    global.securityTestState = {
        vulnerabilities: [],
        complianceChecks: new Map(),
        performanceImpact: new Map()
    };
    try {
        await promises_1.default.mkdir(SECURITY_CONFIG.reports.outputDir, { recursive: true });
        console.log('✅ Security reports directory created');
    }
    catch (error) {
        console.error('❌ Failed to create reports directory:', error);
    }
    await verifySecurityTools();
    console.log('✅ Security test environment setup complete');
}, 60000);
(0, globals_1.beforeEach)(async () => {
    global.securityTestState.vulnerabilities = [];
    global.securityTestState.complianceChecks.clear();
    global.securityTestState.performanceImpact.clear();
});
(0, globals_1.afterEach)(async () => {
    const testName = expect.getState().currentTestName || 'unknown';
    await generateSecurityReport(testName);
});
(0, globals_1.afterAll)(async () => {
    console.log('📊 Generating comprehensive security report...');
    try {
        await generateFinalSecurityReport();
        console.log('✅ Security testing completed');
    }
    catch (error) {
        console.error('❌ Failed to generate security report:', error);
    }
});
exports.securityHelpers = {
    async testSqlInjection(endpoint, parameters) {
        const vulnerabilities = [];
        for (const payload of SECURITY_CONFIG.testData.maliciousPayloads.slice(0, 10)) {
            for (const [param, value] of Object.entries(parameters)) {
                const testData = { ...parameters, [param]: payload };
                try {
                    const response = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SECURITY_CONFIG.apiKey}`
                        },
                        body: JSON.stringify(testData)
                    });
                    const responseText = await response.text();
                    if (responseText.includes('SQL syntax') ||
                        responseText.includes('mysql_fetch') ||
                        responseText.includes('ORA-') ||
                        responseText.includes('PostgreSQL')) {
                        vulnerabilities.push({
                            severity: 'critical',
                            type: 'SQL Injection',
                            description: `SQL injection vulnerability found in parameter '${param}'`,
                            endpoint,
                            payload,
                            evidence: responseText.substring(0, 500)
                        });
                    }
                }
                catch (error) {
                    if (error instanceof Error && error instanceof Error ? error.message : String(error).includes('ECONNRESET')) {
                        vulnerabilities.push({
                            severity: 'high',
                            type: 'SQL Injection',
                            description: `Potential SQL injection causing connection reset in parameter '${param}'`,
                            endpoint,
                            payload
                        });
                    }
                }
            }
        }
        global.securityTestState.vulnerabilities.push(...vulnerabilities);
        return vulnerabilities;
    },
    async testXss(endpoint, parameters) {
        const vulnerabilities = [];
        const xssPayloads = SECURITY_CONFIG.testData.maliciousPayloads.filter(p => p.includes('<script>') || p.includes('<img') || p.includes('javascript:'));
        for (const payload of xssPayloads) {
            for (const [param, value] of Object.entries(parameters)) {
                const testData = { ...parameters, [param]: payload };
                try {
                    const response = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SECURITY_CONFIG.apiKey}`
                        },
                        body: JSON.stringify(testData)
                    });
                    const responseText = await response.text();
                    if (responseText.includes(payload)) {
                        vulnerabilities.push({
                            severity: 'high',
                            type: 'Cross-Site Scripting (XSS)',
                            description: `XSS vulnerability found in parameter '${param}'`,
                            endpoint,
                            payload,
                            evidence: responseText.substring(0, 500)
                        });
                    }
                }
                catch (error) {
                    console.log(`XSS test error for ${param}:`, error instanceof Error ? error.message : String(error));
                }
            }
        }
        global.securityTestState.vulnerabilities.push(...vulnerabilities);
        return vulnerabilities;
    },
    async testAuthenticationBypass(loginEndpoint) {
        const vulnerabilities = [];
        for (const attempt of SECURITY_CONFIG.testData.authBypassAttempts) {
            try {
                const response = await fetch(`${SECURITY_CONFIG.targetUrl}${loginEndpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(attempt)
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.token || result.success || result.user) {
                        vulnerabilities.push({
                            severity: 'critical',
                            type: 'Authentication Bypass',
                            description: 'Authentication bypass vulnerability detected',
                            endpoint: loginEndpoint,
                            payload: JSON.stringify(attempt),
                            evidence: JSON.stringify(result)
                        });
                    }
                }
            }
            catch (error) {
                console.log('Auth bypass test error:', error instanceof Error ? error.message : String(error));
            }
        }
        global.securityTestState.vulnerabilities.push(...vulnerabilities);
        return vulnerabilities;
    },
    async testRateLimiting(endpoint, requests = 100) {
        const startTime = Date.now();
        let successCount = 0;
        let blockedCount = 0;
        const promises = Array.from({ length: requests }, async () => {
            try {
                const response = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SECURITY_CONFIG.apiKey}`
                    }
                });
                if (response.status === 429) {
                    blockedCount++;
                }
                else if (response.ok) {
                    successCount++;
                }
            }
            catch (error) {
                blockedCount++;
            }
        });
        await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        global.securityTestState.performanceImpact.set(`rate-limit-${endpoint}`, duration);
        const rateLimitEffective = blockedCount > 0 && successCount < requests * 0.8;
        if (!rateLimitEffective) {
            global.securityTestState.vulnerabilities.push({
                severity: 'medium',
                type: 'Rate Limiting',
                description: `Insufficient rate limiting on endpoint ${endpoint}`,
                endpoint,
                evidence: `Success: ${successCount}, Blocked: ${blockedCount}, Total: ${requests}`
            });
        }
        return { successCount, blockedCount, duration, rateLimitEffective };
    },
    async testSecurityHeaders(endpoint) {
        const requiredHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security',
            'Content-Security-Policy'
        ];
        try {
            const response = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}`);
            const { headers } = response;
            const missingHeaders = requiredHeaders.filter(header => !headers.has(header));
            if (missingHeaders.length > 0) {
                global.securityTestState.vulnerabilities.push({
                    severity: 'medium',
                    type: 'Missing Security Headers',
                    description: `Missing security headers: ${missingHeaders.join(', ')}`,
                    endpoint,
                    evidence: `Missing: ${missingHeaders.join(', ')}`
                });
            }
            const csp = headers.get('Content-Security-Policy');
            if (csp && csp.includes("'unsafe-inline'")) {
                global.securityTestState.vulnerabilities.push({
                    severity: 'medium',
                    type: 'Weak Content Security Policy',
                    description: 'CSP allows unsafe-inline which may enable XSS attacks',
                    endpoint,
                    evidence: csp
                });
            }
            global.securityTestState.complianceChecks.set(`security-headers-${endpoint}`, missingHeaders.length === 0);
            return { missingHeaders, allHeaders: Object.fromEntries(headers.entries()) };
        }
        catch (error) {
            console.error('Security headers test failed:', error);
            return { missingHeaders: requiredHeaders, allHeaders: {} };
        }
    },
    async testGdprCompliance(endpoints) {
        const complianceIssues = [];
        for (const endpoint of endpoints) {
            try {
                const deleteResponse = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}/test-user-data`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${SECURITY_CONFIG.apiKey}`
                    }
                });
                if (!deleteResponse.ok && deleteResponse.status !== 404) {
                    complianceIssues.push(`Data deletion not supported on ${endpoint}`);
                }
            }
            catch (error) {
                complianceIssues.push(`Data deletion test failed on ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
            }
            try {
                const exportResponse = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}/export`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SECURITY_CONFIG.apiKey}`
                    }
                });
                if (!exportResponse.ok && exportResponse.status !== 404) {
                    complianceIssues.push(`Data export not supported on ${endpoint}`);
                }
            }
            catch (error) {
                complianceIssues.push(`Data export test failed on ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const isCompliant = complianceIssues.length === 0;
        global.securityTestState.complianceChecks.set('gdpr-compliance', isCompliant);
        if (!isCompliant) {
            global.securityTestState.vulnerabilities.push({
                severity: 'high',
                type: 'GDPR Compliance',
                description: 'GDPR compliance issues detected',
                endpoint: 'multiple',
                evidence: complianceIssues.join('; ')
            });
        }
        return { isCompliant, issues: complianceIssues };
    }
};
async function verifySecurityTools() {
    console.log('🔧 Verifying security testing tools...');
    const tools = ['curl', 'wget'];
    for (const tool of tools) {
        try {
            await new Promise((resolve, reject) => {
                const process = (0, child_process_1.spawn)(tool, ['--version']);
                process.on('close', (code) => {
                    if (code === 0) {
                        console.log(`✅ ${tool} is available`);
                        resolve(true);
                    }
                    else {
                        console.log(`⚠️ ${tool} is not available`);
                        resolve(false);
                    }
                });
                process.on('error', () => {
                    console.log(`⚠️ ${tool} is not available`);
                    resolve(false);
                });
            });
        }
        catch (error) {
            console.log(`⚠️ Could not verify ${tool}`);
        }
    }
}
async function generateSecurityReport(testName) {
    const report = {
        testName,
        timestamp: new Date().toISOString(),
        vulnerabilities: global.securityTestState.vulnerabilities,
        complianceChecks: Object.fromEntries(global.securityTestState.complianceChecks),
        performanceImpact: Object.fromEntries(global.securityTestState.performanceImpact)
    };
    try {
        const reportPath = path_1.default.join(SECURITY_CONFIG.reports.outputDir, `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-security-report.json`);
        await promises_1.default.writeFile(reportPath, JSON.stringify(report, null, 2));
    }
    catch (error) {
        console.error('Failed to write security report:', error);
    }
}
async function generateFinalSecurityReport() {
    const finalReport = {
        summary: {
            totalVulnerabilities: global.securityTestState.vulnerabilities.length,
            criticalCount: global.securityTestState.vulnerabilities.filter(v => v.severity === 'critical').length,
            highCount: global.securityTestState.vulnerabilities.filter(v => v.severity === 'high').length,
            mediumCount: global.securityTestState.vulnerabilities.filter(v => v.severity === 'medium').length,
            lowCount: global.securityTestState.vulnerabilities.filter(v => v.severity === 'low').length
        },
        vulnerabilities: global.securityTestState.vulnerabilities,
        complianceResults: Object.fromEntries(global.securityTestState.complianceChecks),
        performanceMetrics: Object.fromEntries(global.securityTestState.performanceImpact),
        recommendations: generateSecurityRecommendations(),
        timestamp: new Date().toISOString()
    };
    const reportPath = path_1.default.join(SECURITY_CONFIG.reports.outputDir, 'final-security-report.json');
    await promises_1.default.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    const csvReport = generateCsvReport(finalReport);
    const csvPath = path_1.default.join(SECURITY_CONFIG.reports.outputDir, 'security-vulnerabilities.csv');
    await promises_1.default.writeFile(csvPath, csvReport);
    console.log(`📊 Security reports generated at: ${SECURITY_CONFIG.reports.outputDir}`);
}
function generateSecurityRecommendations() {
    const recommendations = [];
    const { vulnerabilities } = global.securityTestState;
    if (vulnerabilities.some(v => v.type === 'SQL Injection')) {
        recommendations.push('Implement parameterized queries and input validation to prevent SQL injection attacks');
    }
    if (vulnerabilities.some(v => v.type === 'Cross-Site Scripting (XSS)')) {
        recommendations.push('Implement proper output encoding and Content Security Policy to prevent XSS attacks');
    }
    if (vulnerabilities.some(v => v.type === 'Authentication Bypass')) {
        recommendations.push('Review authentication logic and implement proper input validation');
    }
    if (vulnerabilities.some(v => v.type === 'Rate Limiting')) {
        recommendations.push('Implement proper rate limiting to prevent abuse and DDoS attacks');
    }
    if (vulnerabilities.some(v => v.type === 'Missing Security Headers')) {
        recommendations.push('Add all required security headers to improve application security posture');
    }
    return recommendations;
}
function generateCsvReport(report) {
    const headers = 'Severity,Type,Description,Endpoint,Payload\n';
    const rows = report.vulnerabilities.map((v) => `"${v.severity}","${v.type}","${v.description}","${v.endpoint}","${v.payload || ''}"`).join('\n');
    return headers + rows;
}
//# sourceMappingURL=setup-security.js.map