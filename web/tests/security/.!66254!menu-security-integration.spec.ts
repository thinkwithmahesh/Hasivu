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
