# HASIVU Platform - Security Implementation Guide

## Overview

The HASIVU school meal delivery platform implements comprehensive security measures to protect student data, ensure multi-tenant isolation, and comply with regulations including COPPA, PCI DSS, and GDPR.

## Security Architecture

### 1. Authentication & Authorization

#### JWT Authentication (`/src/lib/middleware/auth.ts`)

- **Token-based authentication** with JWT tokens
- **Role-based access control** (RBAC) with granular permissions
- **Multi-factor authentication** support for admin roles
- **Session timeout** based on user roles
- **Demo mode** support for development/testing

#### User Roles & Permissions

```typescript
// User Roles
(ADMIN, SCHOOL_ADMIN, KITCHEN_STAFF, PARENT, STUDENT, VENDOR);

// Sample Permissions
(READ_MENU, WRITE_MENU, MANAGE_MENU);
(PLACE_ORDERS, VIEW_OWN_ORDERS, UPDATE_ORDER_STATUS);
(MANAGE_USERS, PROCESS_PAYMENTS, ADMIN_ACCESS);
```

#### Implementation Example

```typescript
import { withAuth } from '@/lib/middleware/auth';
import { Permission, UserRole } from '@/types/auth';

export const GET = withAuth(secureHandler, {
  requiredPermissions: [Permission.READ_MENU],
  rateLimitKey: 'menu-read',
  maxRequests: 100,
  windowMs: 60000,
});
```

### 2. Input Validation & Sanitization

#### Security Validator (`/src/lib/security/validation.ts`)

- **XSS protection** with DOMPurify
- **SQL injection prevention** with pattern detection
- **Input sanitization** for all user inputs
- **File upload validation** with type/size restrictions
- **Email/password validation** with security requirements

#### Usage Examples

```typescript
import { securityValidator } from '@/lib/security/validation';

// Email validation
const emailResult = securityValidator.validateEmail(userInput);
if (!emailResult.isValid) {
  return { errors: emailResult.errors };
}

// Menu data validation
const menuValidation = validateForm(menuData, MENU_VALIDATION_RULES);
```

### 3. Multi-Tenant Security

#### School Isolation (`/src/lib/security/multi-tenant.ts`)

- **Strict tenant isolation** ensuring students only see their school's data
- **Cross-tenant access prevention** with audit logging
- **IP whitelisting** support per school
- **Parent-child authorization** for student data access
- **COPPA compliance** for student dietary information

#### Data Filtering

```typescript
// Apply role-based data filtering
const filteredData = multiTenantSecurity.applyDataFiltering(
  menuItems,
  { dataFiltering: true, fieldMasking: ['adminNotes'] },
  { userId: user.id, role: user.role, schoolId: user.schoolId }
);
```

### 4. Rate Limiting & CSRF Protection

#### Rate Limiting Configuration

```typescript
// Per-endpoint rate limits
auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }        // 5 requests per 15 min
menuRead: { maxRequests: 100, windowMs: 60 * 1000 }       // 100 requests per min
menuWrite: { maxRequests: 10, windowMs: 60 * 1000 }       // 10 requests per min
payment: { maxRequests: 5, windowMs: 60 * 1000 }          // 5 requests per min
```

#### CSRF Protection

- **Token-based CSRF protection** for state-changing operations
- **Automatic token generation** and validation
- **Time-based token expiry** (2 hours default)

### 5. Comprehensive Audit Logging

#### Audit System (`/src/lib/monitoring/audit-logger.ts`)

- **Complete operation tracking** with user context
- **Security incident detection** and automatic responses
- **Compliance reporting** for COPPA, PCI, GDPR
- **Risk-level assessment** for all operations
- **Real-time security monitoring**

#### Audit Categories

```typescript
// Menu operations
logMenuOperation(action, user, resource, details, result);

// Student data access (COPPA)
logStudentDataAccess(userId, studentId, dataType, purpose, parentAuth);

// Payment operations (PCI)
logPaymentOperation(userId, operation, amount, currency, details);

// Security incidents
logSecurityIncident(category, description, severity, user, details);
```

### 6. Data Protection & Privacy

#### COPPA Compliance

- **Parental consent** required for student data access
- **Age verification** and appropriate data handling
- **Minimal data collection** principles
- **Right to deletion** implementation
- **Comprehensive audit trails**

#### PCI DSS Compliance

- **Payment data encryption** at rest and in transit
- **Tokenization** of sensitive payment information
- **Access logging** for all payment operations
- **Network segmentation** for payment processing
- **Regular security assessments**

#### GDPR Compliance

- **Consent management** for data processing
- **Right to portability** and data export
- **Right to be forgotten** implementation
- **Data processing registry** maintenance
- **Privacy by design** principles

## Security Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security Settings
NODE_ENV=production
ALLOWED_ORIGINS=https://hasivu.edu,https://app.hasivu.edu
SECURITY_ALERT_EMAIL=security@hasivu.edu

# Feature Flags
MOCK_AUTH=false
SKIP_RATE_LIMITING=false
DEBUG_SECURITY=false
BYPASS_CSRF=false
```

### Security Headers

```typescript
'X-Content-Type-Options': 'nosniff',
'X-Frame-Options': 'DENY',
'X-XSS-Protection': '1; mode=block',
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
'Content-Security-Policy': "default-src 'self'; ..."
```

## Implementation Guidelines

### 1. API Route Security

#### Secure Menu API Example

```typescript
// /src/app/api/menu/secure/route.ts
import { withAuth } from '@/lib/middleware/auth';

export const GET = withAuth(secureMenuGet, {
  requiredPermissions: [Permission.READ_MENU],
  rateLimitKey: 'menu-read',
  maxRequests: 100,
  windowMs: 60000,
});

async function secureMenuGet(request: AuthenticatedRequest) {
  const user = request.user!;

  // 1. Validate input parameters
  const params = validateQueryParameters(request);

  // 2. Apply multi-tenant filtering
  const tenantAccess = await multiTenantSecurity.validateTenantAccess({
    userId: user.id,
    userRole: user.role,
    currentSchoolId: user.schoolId,
    requestedSchoolId: user.schoolId,
    resource: 'menu',
    operation: 'read',
  });

  if (!tenantAccess.allowed) {
    return NextResponse.json({ error: tenantAccess.reason }, { status: 403 });
  }

  // 3. Fetch and filter data
  const menuItems = await fetchMenuItems(params);
  const filteredItems = multiTenantSecurity.applyDataFiltering(
    menuItems,
    tenantAccess.restrictions,
    user
  );

  // 4. Audit logging
  await authMiddleware.logSecurityAction('menu_access', user, 'menu', params);

  return NextResponse.json({ data: filteredItems });
}
```

### 2. Frontend Security Integration

#### Authentication Hook

```typescript
import { useAuth } from '@/contexts/auth-context';

function MenuComponent() {
  const { user, hasPermission } = useAuth();

  if (!hasPermission(Permission.READ_MENU)) {
    return <AccessDenied />;
  }

  return <MenuList />;
}
```

#### CSRF Token Usage

```typescript
// Get CSRF token
const csrfToken = authMiddleware.generateCSRFToken(user.id);

// Include in requests
fetch('/api/menu/secure', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    Authorization: `Bearer ${authToken}`,
  },
  body: JSON.stringify(menuData),
});
```

### 3. Security Testing

#### Automated Security Tests

```bash
# Run security test suite
npm run test:security

# Run specific security tests
npm run test -- --grep "Security"
npm run test -- --grep "Authentication"
npm run test -- --grep "Multi-Tenant"
```

#### Test Categories

- **Authentication & Authorization Tests**
- **Input Validation Tests**
- **Multi-Tenant Security Tests**
- **Rate Limiting Tests**
- **CSRF Protection Tests**
- **Audit Logging Tests**
- **Integration Security Tests**

## Monitoring & Alerting

### Security Dashboards

- **Real-time security metrics** and incident tracking
- **Failed authentication attempts** monitoring
- **Cross-tenant access attempts** alerts
- **Rate limiting violations** tracking
- **Compliance report generation**

### Automated Responses

- **Account lockout** after failed attempts
- **IP blocking** for suspicious activity
- **Security team alerts** for critical incidents
- **Automatic incident escalation**

### Compliance Reporting

```typescript
// Generate COPPA compliance report
const coppaReport = auditLogger.generateComplianceReport(
  'coppa',
  '2024-01-01',
  '2024-12-31'
);

// Generate PCI compliance report
const pciReport = auditLogger.generateComplianceReport(
  'pci',
  '2024-01-01',
  '2024-12-31'
);
```

## Best Practices

### 1. Development Security

- **Never commit secrets** to version control
- **Use environment variables** for configuration
- **Regular security updates** for dependencies
- **Code security reviews** for all changes
- **Penetration testing** before production deployment

### 2. Production Security

- **HTTPS enforcement** for all communications
- **Database encryption** at rest and in transit
- **Regular backup verification** and recovery testing
- **Security monitoring** and incident response
- **Compliance audit** preparation

### 3. User Education

- **Password security** guidelines for users
- **Phishing awareness** training
- **Data privacy** education for parents
- **Incident reporting** procedures

## Incident Response

### Security Incident Categories

1. **Authentication Breaches** - Unauthorized access attempts
2. **Data Breaches** - Unauthorized data access or exposure
3. **System Compromises** - Malware or system intrusions
4. **Compliance Violations** - COPPA, PCI, GDPR violations

### Response Procedures

1. **Immediate containment** of security incidents
2. **Impact assessment** and affected user notification
3. **Evidence collection** and forensic analysis
4. **System remediation** and security improvements
5. **Compliance reporting** to relevant authorities

## Contact Information

- **Security Team**: security@hasivu.edu
- **Compliance Officer**: compliance@hasivu.edu
- **Emergency Contact**: +91-XXXX-XXXX-XX (24/7)

## Version History

- **v1.0.0** - Initial security implementation
  - JWT authentication and authorization
  - Multi-tenant security with school isolation
  - Comprehensive audit logging
  - COPPA, PCI, GDPR compliance measures
  - Input validation and sanitization
  - Rate limiting and CSRF protection
  - Security testing suite

---

**Last Updated**: September 2024
**Next Review**: December 2024
**Classification**: Internal Use Only
