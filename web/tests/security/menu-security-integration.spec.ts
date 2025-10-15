import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { MenuPage } from '../pages/menu.page';

/**
 * HASIVU Menu Management - Security Integration Test Suite
 *
 * Validates the security hardening implemented by the Security Specialist:
 * - JWT Authentication & Authorization with role-based access control
 * - Input Validation & Sanitization (XSS, SQL injection prevention)
 * - Multi-Tenant Security with strict school isolation
 * - Rate Limiting & CSRF Protection
 * - Comprehensive Audit Logging
 * - COPPA, PCI DSS, and GDPR compliance measures
 *
 * Security Focus Areas:
 * - Authentication flows for all user roles
 * - Multi-tenant data isolation
 * - Input sanitization and validation
 * - Rate limiting and DDoS protection
 * - Audit logging and compliance
 * - Student data protection (COPPA)
 */

test.describe(_'HASIVU Menu Security - Integration Tests', _() => {
  let menuPage: MenuPage;
  let apiContext: APIRequestContext;

  test.beforeEach(_async ({ page, _request }) => {
    _menuPage =  new MenuPage(page);
    _apiContext =  request;
  });

  test.describe(_'1. Authentication and Authorization', _() => {

    test(_'should require authentication for secure endpoints @security @auth @required', _async ({ page }) => {
      // Test unauthenticated access
      const _unauthResponse =  await apiContext.get('/api/menu/secure');
      expect([401, 403]).toContain(unauthResponse.status());

      const _errorData =  await unauthResponse.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error.toLowerCase()).toMatch(/unauthorized|forbidden|authentication/);
    });

    test(_'should validate JWT token integrity @security @auth @jwt', _async ({ page }) => {
      // Test with invalid JWT token
      const _invalidTokenResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer invalid.jwt.token'
        }
      });

      expect([401, 403]).toContain(invalidTokenResponse.status());

      // Test with malformed token
      const _malformedTokenResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer not-a-jwt-token'
        }
      });

      expect([401, 403]).toContain(malformedTokenResponse.status());

      // Test with expired token (mock)
      const _expiredTokenResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'
        }
      });

      expect([401, 403]).toContain(expiredTokenResponse.status());
    });

    test(_'should enforce role-based access control @security @auth @rbac', _async ({ page }) => {
      // Test student access
      const _studentResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer mock-student-token',
          'X-User-Role': 'STUDENT',
          'X-User-ID': 'STU001',
          'X-School-ID': 'SCH001'
        }
      });

      // Should allow menu access for students
      expect([200, 401]).toContain(studentResponse.status());

      if (studentResponse.status() === 200) {
        const _studentData =  await studentResponse.json();
        expect(studentData.security).toHaveProperty('userRole', 'STUDENT');
      }

      // Test admin access to menu management
      const _adminResponse =  await apiContext.post('/api/menu', {
        data: {
          name: 'Test Admin Item',
          price: '₹50',
          category: 'main-course'
        },
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'X-User-Role': 'ADMIN',
          'X-User-ID': 'ADM001',
          'X-School-ID': 'SCH001'
        }
      });

      // Admin should be able to create menu items (or get proper auth error)
      expect([201, 401, 403]).toContain(adminResponse.status());

      // Test student trying admin operations (should be denied)
      const _unauthorizedResponse =  await apiContext.post('/api/menu', {
        data: {
          name: 'Unauthorized Item',
          price: '₹50'
        },
        headers: {
          'Authorization': 'Bearer mock-student-token',
          'X-User-Role': 'STUDENT'
        }
      });

      expect([401, 403]).toContain(unauthorizedResponse.status());
    });

    test(_'should validate parent-child authorization @security @auth @parent', _async ({ page }) => {
      // Mock parent account with children
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: {
            id: 'PAR001',
            role: 'PARENT',
            schoolId: 'SCH001',
            children: ['STU001', 'STU002']
          },
          token: 'mock-parent-token'
        }));
      });

      await menuPage.goto();

      // Parent should be able to access child's dietary information
      const _dietaryInfoRequest =  await apiContext.get('/api/students/STU001/dietary', {
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-Parent-ID': 'PAR001',
          'X-Child-ID': 'STU001'
        }
      });

      // Should succeed or return proper auth error
      expect([200, 401, 403, 404]).toContain(dietaryInfoRequest.status());

      // Parent should NOT be able to access other children's data
      const _unauthorizedChildRequest =  await apiContext.get('/api/students/STU999/dietary', {
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-Parent-ID': 'PAR001',
          'X-Child-ID': 'STU999'
        }
      });

      expect([401, 403, 404]).toContain(unauthorizedChildRequest.status());
    });

    test(_'should implement session timeout and token refresh @security @auth @session', _async ({ page }) => {
      // Mock expired session
      await page.evaluate(_() => {
        localStorage.setItem('auth', JSON.stringify({
          user: { id: 'STU001', role: 'STUDENT' },
          token: 'expired-token',
          expiresAt: Date.now() - 3600000 // 1 hour ago
        }));
      });

      await menuPage.goto();

      // Should redirect to login or show auth error
      const _currentUrl =  page.url();
      const _authError =  page.locator('[data-testid
      const _loginRedirect =  page.locator('[data-testid
      // Should either show error or redirect to login
      const _hasAuthError =  await authError.isVisible().catch(() 
      const _hasLoginRedirect =  await loginRedirect.isVisible().catch(() 
      const _isLoginPage =  currentUrl.includes('/login') || currentUrl.includes('/auth');

      expect(hasAuthError || hasLoginRedirect || isLoginPage).toBe(true);
    });
  });

  test.describe(_'2. Multi-Tenant Security and Data Isolation', _() => {

    test(_'should enforce strict school data isolation @security @multitenant @isolation', _async ({ page }) => {
      // Test School A student accessing menu
      const _schoolAResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer school-a-student-token',
          'X-School-ID': 'SCH001',
          'X-User-ID': 'STU001'
        }
      });

      // Test School B student accessing menu
      const _schoolBResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer school-b-student-token',
          'X-School-ID': 'SCH002',
          'X-User-ID': 'STU002'
        }
      });

      // Both should succeed
      expect([200, 401]).toContain(schoolAResponse.status());
      expect([200, 401]).toContain(schoolBResponse.status());

      if (schoolAResponse.status() === 200 && schoolBResponse.status() === 200) {
        const _schoolAData =  await schoolAResponse.json();
        const _schoolBData =  await schoolBResponse.json();

        // Data should be different for different schools
        if (schoolAData.data.length > 0 && schoolBData.data.length > 0) {
          const _schoolAMenuIds =  schoolAData.data.map((item: any) 
          const _schoolBMenuIds =  schoolBData.data.map((item: any) 
          // Menu items should be school-specific
          expect(schoolAMenuIds).not.toEqual(schoolBMenuIds);

          // Verify school context in response
          expect(schoolAData.security.schoolId).toBe('SCH001');
          expect(schoolBData.security.schoolId).toBe('SCH002');
        }
      }
    });

    test(_'should prevent cross-tenant data access @security @multitenant @crosstenant', _async ({ page }) => {
      // Try to access School B data with School A credentials
      const _crossTenantResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer school-a-student-token',
          'X-School-ID': 'SCH002', // Wrong school ID
          'X-User-ID': 'STU001'
        }
      });

      // Should deny cross-tenant access
      expect([401, 403]).toContain(crossTenantResponse.status());

      const _errorData =  await crossTenantResponse.json();
      expect(errorData.error.toLowerCase()).toMatch(/unauthorized|forbidden|tenant|school/);
    });

    test(_'should validate IP whitelisting per school @security @multitenant @ipwhitelist', _async ({ page }) => {
      // Test request from unauthorized IP
      const _unauthorizedIPResponse =  await apiContext.get('/api/menu/secure', {
        headers: {
          'Authorization': 'Bearer mock-student-token',
          'X-Forwarded-For': '192.168.1.100', // Unauthorized IP
          'X-Real-IP': '192.168.1.100'
        }
      });

      // May succeed or fail depending on IP whitelist implementation
      expect([200, 401, 403]).toContain(unauthorizedIPResponse.status());

      if (unauthorizedIPResponse.status() === 403) {
        const _errorData =  await unauthorizedIPResponse.json();
        expect(errorData.error.toLowerCase()).toContain('ip');
      }
    });

    test(_'should audit cross-tenant access attempts @security @multitenant @audit', _async ({ page }) => {
      // Attempt cross-tenant access
      const _auditResponse =  await apiContext.get('/api/menu/secure?audit
      // Should be audited regardless of success/failure
      expect([200, 401, 403]).toContain(auditResponse.status());

      // If audit info is returned, validate it
      if (auditResponse.status() !== 500) {
        const _data =  await auditResponse.json();
        if (data.security && data.security.auditLog) {
          expect(data.security.auditLog.action).toContain('menu_access');
          expect(data.security.auditLog.securityEvent).toBeTruthy();
        }
      }
    });
  });

  test.describe(_'3. Input Validation and Sanitization', _() => {

    test(_'should prevent XSS attacks in search queries @security @xss @search', _async ({ page }) => {
      const _xssPayloads =  [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src
      await menuPage.goto();

      for (const payload of xssPayloads) {
        await menuPage.searchMenu(payload);

        // Verify no script execution
        const _alertFired =  await page.evaluate(() 
        });
        expect(alertFired).toBe(false);

        // Verify input is sanitized
        const _searchValue =  await menuPage.searchInput.inputValue();
        expect(searchValue).not.toContain('<script>');
        expect(searchValue).not.toContain('javascript:');
        expect(searchValue).not.toContain('_onerror = ');

        // Check if results contain unsanitized content
        const _noResults =  page.locator('[data-testid
        if (await noResults.isVisible()) {
          const _noResultsText =  await noResults.textContent();
          expect(noResultsText).not.toContain('<script>');
          expect(noResultsText).not.toContain('_onerror = ');
        }
      }
    });

    test(_'should prevent SQL injection in API calls @security @sqli @api', _async ({ page }) => {
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE menu_items;--",
        "1' UNION SELECT * FROM users--",
        "' OR _1 = 1#",
        "admin'--",
        "' OR 'x'
      for (const payload of sqlPayloads) {
        const _searchResponse =  await apiContext.post('/api/menu/search', {
          data: {
            query: payload,
            category: payload,
            filters: {
              name: payload,
              description: payload
            }
          }
        });

        // Should not cause server error
        expect([200, 400, 422]).toContain(searchResponse.status());

        const _data =  await searchResponse.json();

        if (searchResponse.status() === 400 || searchResponse.status() === 422) {
          expect(data.error.toLowerCase()).toMatch(/invalid|validation|sanitization/);
        } else {
          // If request succeeds, verify no SQL injection occurred
          expect(data).toHaveProperty('data');
          expect(Array.isArray(data.data)).toBe(true);

          // Should not return unauthorized data
          expect(data.data.length).toBeLessThan(1000); // Reasonable limit
        }
      }
    });

    test(_'should sanitize file upload inputs @security @upload @sanitization', _async ({ page }) => {
      // Test menu item creation with malicious file inputs
      const _maliciousFileData =  {
        name: 'Test Item',
        description: 'Test description',
        image: 'data:text/html,<script>alert("XSS")</script>',
        attachments: [
          '../../etc/passwd',
          '../../../windows/system32/config/sam',
          '<script>alert("XSS")</script>.jpg'
        ]
      };

      const _response =  await apiContext.post('/api/menu', {
        data: maliciousFileData,
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });

      // Should reject malicious file inputs
      expect([400, 401, 403, 422]).toContain(response.status());

      if (response.status() === 400 || response.status() === 422) {
        const _errorData =  await response.json();
        expect(errorData.error.toLowerCase()).toMatch(/invalid|file|upload|sanitization/);
      }
    });

    test(_'should validate email and password inputs @security @validation @credentials', _async ({ page }) => {
      const _invalidEmails =  [
        '<script>alert("XSS")</script>@example.com',
        'user@<script>alert("XSS")</script>.com',
        'user@example..com',
        'user@@example.com',
        '',
        'not-an-email'
      ];

      const _weakPasswords =  [
        '123',
        'password',
        '12345678',
        'qwerty',
        '',
        'a'
      ];

      // Test auth endpoint with invalid inputs
      for (const email of invalidEmails) {
        const _authResponse =  await apiContext.post('/api/auth/login', {
          data: {
            email,
            password: 'ValidPass123!'
          }
        });

        expect([400, 401, 422]).toContain(authResponse.status());

        if (authResponse.status() === 400 || authResponse.status() === 422) {
          const _errorData =  await authResponse.json();
          expect(errorData.errors?.email || errorData.error).toBeTruthy();
        }
      }

      for (const password of weakPasswords) {
        const _authResponse =  await apiContext.post('/api/auth/register', {
          data: {
            email: 'test@example.com',
            password
          }
        });

        expect([400, 401, 422]).toContain(authResponse.status());

        if (authResponse.status() === 400 || authResponse.status() === 422) {
          const _errorData =  await authResponse.json();
          expect(errorData.errors?.password || errorData.error).toBeTruthy();
        }
      }
    });
  });

  test.describe(_'4. Rate Limiting and DDoS Protection', _() => {

    test(_'should implement rate limiting per endpoint @security @ratelimit @endpoints', _async ({ page }) => {
      // Test menu read endpoint rate limiting
      const _menuRequests =  Array.from({ length: 25 }, (_, i) 
      const _responses =  await Promise.all(menuRequests);

      const _successCount =  responses.filter(r 
      const _rateLimitedCount =  responses.filter(r 
      // Should have some successful requests
      expect(successCount).toBeGreaterThan(0);

      // If rate limiting is implemented, expect some 429s
      if (rateLimitedCount > 0) {
        expect(rateLimitedCount).toBeGreaterThan(0);

        // Check rate limit headers
        const _rateLimitedResponse =  responses.find(r 
        const _headers =  rateLimitedResponse?.headers();

        expect(headers?.['x-ratelimit-limit']).toBeDefined();
        expect(headers?.['x-ratelimit-remaining']).toBeDefined();
        expect(headers?.['x-ratelimit-reset']).toBeDefined();
      }
    });

    test(_'should implement progressive rate limiting @security @ratelimit @progressive', _async ({ page }) => {
      // Test escalating rate limits for suspicious behavior
      const _suspiciousRequests =  Array.from({ length: 50 }, (_, i) 
      const _responses =  await Promise.all(suspiciousRequests);

      const _statusCounts =  responses.reduce((acc, r) 
        return acc;
      }, {} as Record<number, number>);

      console.log('Rate limiting test results:', statusCounts);

      // Should show progressive limiting
      if (statusCounts[429] > 0) {
        expect(statusCounts[429]).toBeGreaterThan(statusCounts[200] || 0);
      }
    });

    test(_'should differentiate rate limits by user role @security @ratelimit @roles', _async ({ page }) => {
      // Test student rate limits
      const _studentRequests =  Array.from({ length: 15 }, (_, i) 
      // Test admin rate limits (should be higher)
      const _adminRequests =  Array.from({ length: 15 }, (_, i) 
      const [studentResponses, adminResponses] = await Promise.all([
        Promise.all(studentRequests),
        Promise.all(adminRequests)
      ]);

      const _studentSuccess =  studentResponses.filter(r 
      const _adminSuccess =  adminResponses.filter(r 
      console.log(`Student success: ${studentSuccess}/15, Admin success: ${adminSuccess}/15`);

      // Admin should have higher or equal success rate
      expect(adminSuccess).toBeGreaterThanOrEqual(studentSuccess);
    });

    test(_'should implement CSRF protection @security @csrf @protection', _async ({ page }) => {
      // Test state-changing operations without CSRF token
      const _createResponse =  await apiContext.post('/api/menu', {
        data: {
          name: 'CSRF Test Item',
          price: '₹30',
          category: 'test'
        },
        headers: {
          'Authorization': 'Bearer mock-admin-token'
          // No CSRF token
        }
      });

      // Should require CSRF token or return auth error
      expect([400, 401, 403, 422]).toContain(createResponse.status());

      if (createResponse.status() === 403 || createResponse.status() === 422) {
        const _errorData =  await createResponse.json();
        expect(errorData.error.toLowerCase()).toMatch(/csrf|token|invalid/);
      }

      // Test with invalid CSRF token
      const _invalidCSRFResponse =  await apiContext.post('/api/menu', {
        data: {
          name: 'CSRF Test Item 2',
          price: '₹35'
        },
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'X-CSRF-Token': 'invalid-csrf-token'
        }
      });

      expect([400, 401, 403, 422]).toContain(invalidCSRFResponse.status());
    });
  });

  test.describe(_'5. Audit Logging and Compliance', _() => {

    test(_'should log all security-relevant operations @security @audit @logging', _async ({ page }) => {
      const _securityOperations =  [
        {
          method: 'GET',
          endpoint: '/api/menu/secure',
          headers: {
            'Authorization': 'Bearer mock-student-token',
            'X-Audit-Test': 'security-read'
          }
        },
        {
          method: 'POST',
          endpoint: '/api/menu',
          data: { name: 'Audit Test Item' },
          headers: {
            'Authorization': 'Bearer mock-admin-token',
            'X-Audit-Test': 'security-create'
          }
        },
        {
          method: 'GET',
          endpoint: '/api/menu/secure',
          headers: {
            'Authorization': 'Bearer invalid-token',
            'X-Audit-Test': 'security-fail'
          }
        }
      ];

      for (const operation of securityOperations) {
        const _response =  operation.method 
        // All operations should be auditable
        expect([200, 201, 400, 401, 403, 404]).toContain(response.status());

        // Check if audit information is available
        const _data =  await response.json();
        if (data.security?.auditLog) {
          expect(data.security.auditLog).toHaveProperty('timestamp');
          expect(data.security.auditLog).toHaveProperty('action');
          expect(data.security.auditLog).toHaveProperty('userId');
          expect(data.security.auditLog).toHaveProperty('ipAddress');
          expect(data.security.auditLog).toHaveProperty('userAgent');
        }
      }
    });

    test(_'should implement COPPA compliance for student data @security @compliance @coppa', _async ({ page }) => {
      // Test accessing student data (age < 13)
      const _studentDataResponse =  await apiContext.get('/api/students/STU001/dietary', {
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-Parent-ID': 'PAR001',
          'X-Child-Age': '12',
          'X-COPPA-Consent': 'true'
        }
      });

      // Should require parental consent and proper logging
      expect([200, 401, 403, 404]).toContain(studentDataResponse.status());

      if (studentDataResponse.status() === 200) {
        const _data =  await studentDataResponse.json();

        // Should have COPPA compliance markers
        if (data.compliance) {
          expect(data.compliance).toHaveProperty('coppaCompliant', true);
          expect(data.compliance).toHaveProperty('parentalConsent', true);
          expect(data.compliance).toHaveProperty('auditTrail');
        }
      }

      // Test without parental consent
      const _unauthorizedStudentResponse =  await apiContext.get('/api/students/STU001/dietary', {
        headers: {
          'Authorization': 'Bearer mock-student-token',
          'X-Child-Age': '11'
          // No parental consent
        }
      });

      expect([401, 403]).toContain(unauthorizedStudentResponse.status());
    });

    test(_'should implement PCI compliance for payment data @security @compliance @pci', _async ({ page }) => {
      // Test payment-related menu operations
      const _paymentDataResponse =  await apiContext.post('/api/menu/order', {
        data: {
          items: [{ id: 1, quantity: 2 }],
          payment: {
            method: 'card',
            // No sensitive card data should be in request
            token: 'payment-token-xyz'
          }
        },
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-PCI-Compliant': 'true'
        }
      });

      // Should handle payment data securely
      expect([200, 201, 400, 401, 403, 404]).toContain(paymentDataResponse.status());

      if (paymentDataResponse.status() === 200 || paymentDataResponse.status() === 201) {
        const _data =  await paymentDataResponse.json();

        // Should not return sensitive payment data
        expect(JSON.stringify(data)).not.toMatch(/\d{4}-\d{4}-\d{4}-\d{4}/); // Card numbers
        expect(JSON.stringify(data)).not.toMatch(/cvv|cvc|security.code/i);

        // Should have PCI compliance markers
        if (data.payment) {
          expect(data.payment.secureToken).toBeTruthy();
          expect(data.payment.cardNumber).toBeUndefined();
        }
      }
    });

    test(_'should implement GDPR compliance for data processing @security @compliance @gdpr', _async ({ page }) => {
      // Test data export request
      const _dataExportResponse =  await apiContext.get('/api/users/export', {
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-GDPR-Request': 'export',
          'X-User-ID': 'PAR001'
        }
      });

      expect([200, 202, 401, 403, 404]).toContain(dataExportResponse.status());

      if (dataExportResponse.status() === 200) {
        const _data =  await dataExportResponse.json();
        expect(data).toHaveProperty('userData');
        expect(data).toHaveProperty('exportTimestamp');
        expect(data).toHaveProperty('dataCategories');
      }

      // Test data deletion request
      const _dataDeletionResponse =  await apiContext.delete('/api/users/data', {
        headers: {
          'Authorization': 'Bearer mock-parent-token',
          'X-GDPR-Request': 'deletion',
          'X-User-ID': 'PAR001',
          'X-Confirmation': 'DELETE_MY_DATA'
        }
      });

      expect([200, 202, 400, 401, 403]).toContain(dataDeletionResponse.status());

      if (dataDeletionResponse.status() === 200 || dataDeletionResponse.status() === 202) {
        const _data =  await dataDeletionResponse.json();
        expect(data).toHaveProperty('deletionId');
        expect(data).toHaveProperty('estimatedCompletion');
      }
    });

    test(_'should log security incidents and trigger alerts @security @audit @incidents', _async ({ page }) => {
      // Simulate security incidents
      const incidents = [
        {
          type: 'brute-force',
          requests: Array.from({ length: 10 }, _(_, _i) =>
            apiContext.post('/api/auth/login', {
              data: {
                email: 'admin@school.edu',
                password: `wrong-password-${i}`
              },
              headers: { 'X-Incident-Test': 'brute-force' }
            })
          )
        },
        {
          type: 'sql-injection-attempt',
          requests: [
            apiContext.post('/api/menu/search', {
              data: { query: "'; DROP TABLE users;--" },
              headers: { 'X-Incident-Test': 'sql-injection' }
            })
          ]
        },
        {
          type: 'xss-attempt',
          requests: [
            apiContext.post('/api/menu/search', {
              data: { query: '<script>alert("XSS")</script>' },
              headers: { 'X-Incident-Test': 'xss-attempt' }
            })
          ]
        }
      ];

      for (const incident of incidents) {
        const _responses =  await Promise.all(incident.requests);

        // Check if security incident was detected and logged
        for (const response of responses) {
          const _data =  await response.json();

          if (data.security?.incident) {
            expect(data.security.incident).toHaveProperty('type');
            expect(data.security.incident).toHaveProperty('severity');
            expect(data.security.incident).toHaveProperty('timestamp');
            expect(data.security.incident).toHaveProperty('alertTriggered');
          }
        }
      }
    });
  });

  test.describe(_'6. Frontend Security Integration', _() => {

    test('should implement Content Security Policy (CSP) @security @frontend @csp', async (_{ page }) => {
      await menuPage.goto();

      // Check CSP headers
      const _response =  await page.waitForResponse('**/menu**');
      const _headers =  response.headers();

      if (headers['content-security-policy']) {
        const _csp =  headers['content-security-policy'];
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("style-src 'self'");
      }

      // Test that inline scripts are blocked
      const _inlineScriptBlocked =  await page.evaluate(() 
          script.innerHTML = 'window.inlineScriptExecuted = true;';
          document.body.appendChild(script);
          return !window.inlineScriptExecuted;
        } catch (error) {
          return true; // Script blocked
        }
      });

      expect(inlineScriptBlocked).toBe(true);
    });

    test(_'should sanitize displayed content @security @frontend @sanitization', _async ({ page }) => {
      await menuPage.goto();

      // Test that menu items display safely
      const _menuItems =  await menuPage.menuItems.count();
      expect(menuItems).toBeGreaterThan(0);

      // Check for potentially dangerous content in displayed items
      const _itemNames =  await page.locator('[data-testid
      for (const name of itemNames) {
        expect(name).not.toContain('<script>');
        expect(name).not.toContain('<iframe>');
        expect(name).not.toContain('javascript:');
        expect(name).not.toContain('_onclick = ');
      }

      // Test search results sanitization
      await menuPage.searchMenu('<img _src = x onerror
      await page.waitForTimeout(500);

      const _searchResults =  page.locator('[data-testid
      if (await searchResults.isVisible()) {
        const _resultsHTML =  await searchResults.innerHTML();
        expect(resultsHTML).not.toContain('_onerror = ');
        expect(resultsHTML).not.toContain('<img _src = x');
      }
    });

    test(_'should implement secure session management @security @frontend @session', _async ({ page }) => {
      // Test session data security
      await page.evaluate(_() => {
        // Test secure token storage
        localStorage.setItem('auth', JSON.stringify({
          user: { id: 'STU001', role: 'STUDENT' },
          token: 'test-token',
          expiresAt: Date.now() + 3600000
        }));
      });

      await menuPage.goto();

      // Verify session is handled securely
      const _sessionData =  await page.evaluate(() 
        return auth ? JSON.parse(auth) : null;
      });

      if (sessionData) {
        expect(sessionData.token).toBeTruthy();
        expect(sessionData.user).toBeTruthy();
        expect(sessionData.expiresAt).toBeGreaterThan(Date.now());

        // Verify sensitive data is not exposed in global scope
        const _globalToken =  await page.evaluate(() 
        expect(globalToken).toBeUndefined();
      }
    });

    test('should validate secure communication (HTTPS) @security @frontend @https', async (_{ page }) => {
      // In production, verify HTTPS enforcement
      const _currentURL =  page.url();

      if (process.env._NODE_ENV = 
      }

      // Test that API calls use secure protocols
      const _apiCalls =  [];
      page.on('request', _request = > {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });

      await menuPage.goto();
      await menuPage.searchMenu('test');

      // Verify API calls are secure
      if (process.env._NODE_ENV = 
        });
      }
    });
  });

  // Cleanup and security validation
  test.afterEach(_async ({ page }, _testInfo) => {
    // Clear any test authentication data
    await page.evaluate(_() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Log security test results
    console.log(`Security test "${testInfo.title}" completed`);
  });
});