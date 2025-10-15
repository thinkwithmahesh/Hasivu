/**
 * Security Test Setup Configuration
 * Enhanced setup for security testing including penetration testing and vulnerability scanning
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { config } from 'dotenv';
import crypto from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

// Load test environment variables
config({ path: '.env.test' });

// Security test configuration
const SECURITY_CONFIG = {
  targetUrl: process.env.SECURITY_TEST_URL || 'http://localhost:3001',
  apiKey: process.env.SECURITY_API_KEY || 'test-api-key',
  testTimeout: 300000, // 5 minutes for security tests
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
      // SQL Injection payloads
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

      // XSS payloads
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')></iframe>",

      // Command injection payloads
      "; ls -la",
      "| whoami",
      "&& cat /etc/passwd",
      "`id`",
      "$(whoami)",

      // LDAP injection payloads
      "*)(uid=*",
      "*)(|(mail=*))",
      "*))%00",

      // NoSQL injection payloads
      "';return 'a'=='a' && ''==''",
      '",$where:"function(){return true}"',
      "\",$where:\"function(){return true}\"",
      "{$gt:''}",

      // File path traversal
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

// Global security test state
interface SecurityTestState {
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    endpoint: string;
    payload?: string;
    evidence?: string;
  }>;
  complianceChecks: Map<string, boolean>;
  performanceImpact: Map<string, number>;
}

declare global {
  var securityTestState: SecurityTestState;
}

beforeAll(async () => {
  console.log('🔒 Setting up security test environment...');

  // Initialize security test state
  global.securityTestState = {
    vulnerabilities: [],
    complianceChecks: new Map(),
    performanceImpact: new Map()
  };

  // Create reports directory
  try {
    await fs.mkdir(SECURITY_CONFIG.reports.outputDir, { recursive: true });
    console.log('✅ Security reports directory created');
  } catch (error) {
    console.error('❌ Failed to create reports directory:', error);
  }

  // Verify security testing tools
  await verifySecurityTools();

  console.log('✅ Security test environment setup complete');
}, 60000);

beforeEach(async () => {
  // Reset test state for each test
  global.securityTestState.vulnerabilities = [];
  global.securityTestState.complianceChecks.clear();
  global.securityTestState.performanceImpact.clear();
});

afterEach(async () => {
  // Generate test-specific security report
  const testName = expect.getState().currentTestName || 'unknown';
  await generateSecurityReport(testName);
});

afterAll(async () => {
  console.log('📊 Generating comprehensive security report...');

  try {
    // Generate final security reports
    await generateFinalSecurityReport();
    console.log('✅ Security testing completed');
  } catch (error) {
    console.error('❌ Failed to generate security report:', error);
  }
});

// Security testing helper functions
export const securityHelpers = {
  // Vulnerability testing
  async testSqlInjection(endpoint: string, parameters: Record<string, string>) {
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

          // Check for SQL error indicators
          if (responseText.includes('SQL syntax') ||
              responseText.includes('mysql_fetch') ||
              responseText.includes('ORA-') ||
              responseText.includes('PostgreSQL')) {

            vulnerabilities.push({
              severity: 'critical' as const,
              type: 'SQL Injection',
              description: `SQL injection vulnerability found in parameter '${param}'`,
              endpoint,
              payload,
              evidence: responseText.substring(0, 500)
            });
          }
        } catch (error) {
          // Network errors might indicate successful injection
          if (error instanceof Error && error instanceof Error ? error.message : String(error).includes('ECONNRESET')) {
            vulnerabilities.push({
              severity: 'high' as const,
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

  async testXss(endpoint: string, parameters: Record<string, string>) {
    const vulnerabilities = [];
    const xssPayloads = SECURITY_CONFIG.testData.maliciousPayloads.filter(p =>
      p.includes('<script>') || p.includes('<img') || p.includes('javascript:')
    );

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

          // Check if payload is reflected in response without proper encoding
          if (responseText.includes(payload)) {
            vulnerabilities.push({
              severity: 'high' as const,
              type: 'Cross-Site Scripting (XSS)',
              description: `XSS vulnerability found in parameter '${param}'`,
              endpoint,
              payload,
              evidence: responseText.substring(0, 500)
            });
          }
        } catch (error) {
          // Log but don't treat as vulnerability
          console.log(`XSS test error for ${param}:`, error instanceof Error ? error.message : String(error));
        }
      }
    }

    global.securityTestState.vulnerabilities.push(...vulnerabilities);
    return vulnerabilities;
  },

  async testAuthenticationBypass(loginEndpoint: string) {
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

          // Check if authentication was bypassed
          if (result.token || result.success || result.user) {
            vulnerabilities.push({
              severity: 'critical' as const,
              type: 'Authentication Bypass',
              description: 'Authentication bypass vulnerability detected',
              endpoint: loginEndpoint,
              payload: JSON.stringify(attempt),
              evidence: JSON.stringify(result)
            });
          }
        }
      } catch (error) {
        console.log('Auth bypass test error:', error instanceof Error ? error.message : String(error));
      }
    }

    global.securityTestState.vulnerabilities.push(...vulnerabilities);
    return vulnerabilities;
  },

  async testRateLimiting(endpoint: string, requests: number = 100) {
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
        } else if (response.ok) {
          successCount++;
        }
      } catch (error) {
        // Network errors due to rate limiting
        blockedCount++;
      }
    });

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    global.securityTestState.performanceImpact.set(`rate-limit-${endpoint}`, duration);

    // Rate limiting should block requests after threshold
    const rateLimitEffective = blockedCount > 0 && successCount < requests * 0.8;

    if (!rateLimitEffective) {
      global.securityTestState.vulnerabilities.push({
        severity: 'medium' as const,
        type: 'Rate Limiting',
        description: `Insufficient rate limiting on endpoint ${endpoint}`,
        endpoint,
        evidence: `Success: ${successCount}, Blocked: ${blockedCount}, Total: ${requests}`
      });
    }

    return { successCount, blockedCount, duration, rateLimitEffective };
  },

  async testSecurityHeaders(endpoint: string) {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];

    try {
      const response = await fetch(`${SECURITY_CONFIG.targetUrl}${endpoint}`);
      const {headers} = response;

      const missingHeaders = requiredHeaders.filter(header => !headers.has(header));

      if (missingHeaders.length > 0) {
        global.securityTestState.vulnerabilities.push({
          severity: 'medium' as const,
          type: 'Missing Security Headers',
          description: `Missing security headers: ${missingHeaders.join(', ')}`,
          endpoint,
          evidence: `Missing: ${missingHeaders.join(', ')}`
        });
      }

      // Check for weak security header values
      const csp = headers.get('Content-Security-Policy');
      if (csp && csp.includes("'unsafe-inline'")) {
        global.securityTestState.vulnerabilities.push({
          severity: 'medium' as const,
          type: 'Weak Content Security Policy',
          description: 'CSP allows unsafe-inline which may enable XSS attacks',
          endpoint,
          evidence: csp
        });
      }

      global.securityTestState.complianceChecks.set(`security-headers-${endpoint}`, missingHeaders.length === 0);

      return { missingHeaders, allHeaders: Object.fromEntries(headers.entries()) };
    } catch (error) {
      console.error('Security headers test failed:', error);
      return { missingHeaders: requiredHeaders, allHeaders: {} };
    }
  },

  // Compliance testing
  async testGdprCompliance(endpoints: string[]) {
    const complianceIssues = [];

    for (const endpoint of endpoints) {
      // Test data deletion
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
      } catch (error) {
        complianceIssues.push(`Data deletion test failed on ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Test data export
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
      } catch (error) {
        complianceIssues.push(`Data export test failed on ${endpoint}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const isCompliant = complianceIssues.length === 0;
    global.securityTestState.complianceChecks.set('gdpr-compliance', isCompliant);

    if (!isCompliant) {
      global.securityTestState.vulnerabilities.push({
        severity: 'high' as const,
        type: 'GDPR Compliance',
        description: 'GDPR compliance issues detected',
        endpoint: 'multiple',
        evidence: complianceIssues.join('; ')
      });
    }

    return { isCompliant, issues: complianceIssues };
  }
};

// Utility functions
async function verifySecurityTools() {
  console.log('🔧 Verifying security testing tools...');

  // Check if common security tools are available
  const tools = ['curl', 'wget'];

  for (const tool of tools) {
    try {
      await new Promise((resolve, reject) => {
        const process = spawn(tool, ['--version']);
        process.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ ${tool} is available`);
            resolve(true);
          } else {
            console.log(`⚠️ ${tool} is not available`);
            resolve(false);
          }
        });
        process.on('error', () => {
          console.log(`⚠️ ${tool} is not available`);
          resolve(false);
        });
      });
    } catch (error) {
      console.log(`⚠️ Could not verify ${tool}`);
    }
  }
}

async function generateSecurityReport(testName: string) {
  const report = {
    testName,
    timestamp: new Date().toISOString(),
    vulnerabilities: global.securityTestState.vulnerabilities,
    complianceChecks: Object.fromEntries(global.securityTestState.complianceChecks),
    performanceImpact: Object.fromEntries(global.securityTestState.performanceImpact)
  };

  try {
    const reportPath = path.join(
      SECURITY_CONFIG.reports.outputDir,
      `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-security-report.json`
    );

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  } catch (error) {
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

  const reportPath = path.join(SECURITY_CONFIG.reports.outputDir, 'final-security-report.json');
  await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));

  // Generate CSV report for easy analysis
  const csvReport = generateCsvReport(finalReport);
  const csvPath = path.join(SECURITY_CONFIG.reports.outputDir, 'security-vulnerabilities.csv');
  await fs.writeFile(csvPath, csvReport);

  console.log(`📊 Security reports generated at: ${SECURITY_CONFIG.reports.outputDir}`);
}

function generateSecurityRecommendations() {
  const recommendations = [];
  const {vulnerabilities} = global.securityTestState;

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

function generateCsvReport(report: any) {
  const headers = 'Severity,Type,Description,Endpoint,Payload\n';
  const rows = report.vulnerabilities.map((v: any) =>
    `"${v.severity}","${v.type}","${v.description}","${v.endpoint}","${v.payload || ''}"`
  ).join('\n');

  return headers + rows;
}

export { SECURITY_CONFIG };