# HASIVU Platform - Security Documentation

## Overview

This document outlines the security measures, policies, and compliance standards implemented in the HASIVU Platform to protect user data, ensure payment security, and maintain system integrity.

**Last Updated:** October 12, 2025
**Security Rating:** 78/100 (Target: 85/100)
**Compliance:** PCI DSS Level 1, GDPR, ISO 27001 compliant

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Payment Security (PCI DSS)](#payment-security-pci-dss)
5. [Network Security](#network-security)
6. [Input Validation & Sanitization](#input-validation--sanitization)
7. [Security Headers](#security-headers)
8. [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
9. [Logging & Monitoring](#logging--monitoring)
10. [Incident Response](#incident-response)
11. [Security Audits](#security-audits)
12. [Vulnerability Management](#vulnerability-management)

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    CDN / WAF Layer                       │
│              (CloudFlare / AWS WAF)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               API Gateway / Load Balancer                │
│          (Rate Limiting, DDoS Protection)               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Application Security Layer                  │
│   (Authentication, Authorization, Validation)           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Access Layer                       │
│        (Encryption, Access Control, Auditing)           │
└─────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary access for all operations
3. **Zero Trust**: Verify everything, trust nothing
4. **Security by Design**: Security integrated from the start
5. **Fail Secure**: System fails in a secure state

---

## Authentication & Authorization

### Authentication Methods

1. **JWT-based Authentication**
   - Access tokens (15 minutes)
   - Refresh tokens (7 days)
   - Token rotation on refresh
   - Secure HttpOnly cookies

2. **AWS Cognito Integration**
   - Multi-factor authentication (MFA)
   - Social login (Google, Facebook)
   - Password policies enforcement
   - Account recovery flows

3. **API Key Authentication**
   - Service-to-service communication
   - API key rotation policy (90 days)
   - Rate limiting per API key
   - Usage tracking and alerts

### Authorization Model

**Role-Based Access Control (RBAC)**

```yaml
Roles:
  - super_admin: Full system access
  - school_admin: School-level administration
  - teacher: Class and student management
  - parent: Student information access
  - vendor: Marketplace operations
  - student: Personal information access
```

**Permission Matrix**

| Resource  | Super Admin | School Admin | Teacher | Parent | Vendor | Student |
| --------- | ----------- | ------------ | ------- | ------ | ------ | ------- |
| Users     | CRUD        | CRUD\*       | R       | R\*    | -      | R\*     |
| Schools   | CRUD        | RU\*         | R\*     | R\*    | R      | R\*     |
| Payments  | CRUD        | CRUD\*       | R\*     | CRUD\* | R\*    | R\*     |
| Analytics | CRUD        | CRUD\*       | R\*     | R\*    | R\*    | R\*     |

\*Limited to own scope

### Session Management

- Session timeout: 30 minutes (inactivity)
- Concurrent session limit: 3 devices
- Force logout on password change
- Session revocation capability
- Secure session storage (Redis)

---

## Data Protection

### Encryption Standards

**Data at Rest**

- AES-256 encryption for sensitive data
- AWS KMS for key management
- Encrypted database volumes
- Encrypted S3 buckets
- Regular key rotation (annual)

**Data in Transit**

- TLS 1.3 minimum
- Perfect Forward Secrecy (PFS)
- HSTS enabled (1 year)
- Certificate pinning for mobile apps

### Sensitive Data Handling

**Personally Identifiable Information (PII)**

```typescript
Encrypted Fields:
  - Full name
  - Email address
  - Phone number
  - Date of birth
  - Address
  - RFID card numbers
  - Payment information
  - Health/dietary information
```

**Data Minimization**

- Collect only necessary data
- Regular data cleanup (90 days inactive)
- Anonymization for analytics
- Data retention policies

### Data Classification

| Level        | Description      | Examples     | Protection              |
| ------------ | ---------------- | ------------ | ----------------------- |
| Public       | Non-sensitive    | Menu items   | Standard                |
| Internal     | Business use     | Analytics    | Access control          |
| Confidential | Sensitive        | User data    | Encryption + AC         |
| Restricted   | Highly sensitive | Payment data | Full encryption + Audit |

---

## Payment Security (PCI DSS)

### PCI DSS Compliance

**Compliance Level:** PCI DSS Level 1
**Last Audit:** October 2025
**Next Audit:** October 2026

### Payment Data Handling

**Never Store:**

- Full credit card numbers (PAN)
- CVV/CVC codes
- Magnetic stripe data
- PIN numbers

**Tokenization**

- Razorpay tokenization for card data
- Tokens stored encrypted
- No direct card processing

### PCI DSS Requirements Checklist

- [x] 1. Install and maintain firewall configuration
- [x] 2. Do not use vendor-supplied defaults
- [x] 3. Protect stored cardholder data
- [x] 4. Encrypt transmission of cardholder data
- [x] 5. Use and regularly update anti-virus software
- [x] 6. Develop and maintain secure systems
- [x] 7. Restrict access to cardholder data
- [x] 8. Assign unique ID to each person with access
- [x] 9. Restrict physical access to cardholder data
- [x] 10. Track and monitor all access
- [x] 11. Regularly test security systems
- [x] 12. Maintain information security policy

### Payment Endpoint Security

```typescript
Payment Endpoints Security Measures:
  - Strict CORS policy
  - Enhanced rate limiting (10 requests / 10 minutes)
  - Request signing and verification
  - Webhook signature validation
  - PCI compliance headers
  - Comprehensive audit logging
  - Real-time fraud detection
  - 3D Secure authentication
```

---

## Network Security

### Firewall Rules

**Inbound Rules**

```
- HTTPS (443): ALLOW from ALL
- HTTP (80): REDIRECT to HTTPS
- SSH (22): ALLOW from VPN only
- Database (5432): ALLOW from app servers only
- Redis (6379): ALLOW from app servers only
```

**Outbound Rules**

```
- HTTPS (443): ALLOW to all (external APIs)
- SMTP (587): ALLOW to email service
- Database: ALLOW to RDS
- Redis: ALLOW to ElastiCache
- All other ports: DENY
```

### Network Segmentation

```
┌────────────────────────────────────────────────────┐
│                   Public Subnet                     │
│         (Load Balancer, API Gateway)               │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│                 Private Subnet 1                    │
│              (Application Servers)                  │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│                 Private Subnet 2                    │
│         (Database, Cache, Message Queue)           │
└────────────────────────────────────────────────────┘
```

### VPN Access

- AWS Client VPN for team access
- MFA required for VPN connection
- IP whitelisting for production access
- VPN logs audited weekly

---

## Input Validation & Sanitization

### Protection Mechanisms

**1. NoSQL Injection Prevention**

```typescript
// Remove $ and . characters from MongoDB queries
express-mongo-sanitize middleware
```

**2. XSS Protection**

```typescript
// Sanitize HTML/JS in user input
xss-clean middleware
DOMPurify for frontend sanitization
```

**3. SQL Injection Prevention**

```typescript
// Parameterized queries only
// Pattern-based detection
// Prepared statements
```

**4. Path Traversal Protection**

```typescript
// Block ../ and ..\ patterns
// Validate file paths
// Whitelist allowed directories
```

### Input Validation Rules

**Email Validation**

```typescript
- Format: RFC 5322 compliant
- Domain validation
- Disposable email detection
- MX record verification
```

**Phone Number Validation**

```typescript
- Format: E.164 international format
- Length: 10-15 digits
- Country code validation
- Sanitization: Remove non-digits
```

**Password Requirements**

```typescript
- Minimum length: 12 characters
- Required: uppercase, lowercase, number, special char
- No common passwords (checked against breach database)
- No user information (name, email) in password
- Password history: Last 5 passwords
```

---

## Security Headers

### Implemented Headers

```http
# Content Security Policy
Content-Security-Policy: default-src 'self';
  script-src 'self' https://js.razorpay.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.razorpay.com wss:;
  frame-src 'self' https://api.razorpay.com;

# HTTP Strict Transport Security
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# X-Frame-Options (Clickjacking protection)
X-Frame-Options: SAMEORIGIN

# X-Content-Type-Options (MIME sniffing protection)
X-Content-Type-Options: nosniff

# Referrer-Policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions-Policy
Permissions-Policy: geolocation=(), microphone=(), camera=()

# X-XSS-Protection (Legacy browsers)
X-XSS-Protection: 1; mode=block
```

### API-Specific Headers

```http
X-API-Version: 1.0
X-Request-ID: <uuid>
X-Response-Time: <ms>
Cache-Control: no-store (for sensitive endpoints)
```

---

## Rate Limiting & DDoS Protection

### Rate Limit Configuration

| Endpoint Type  | Window | Max Requests | Action        |
| -------------- | ------ | ------------ | ------------- |
| General API    | 15 min | 200          | Block + Log   |
| Authentication | 15 min | 10           | Block + Alert |
| Password Reset | 1 hour | 3            | Block + Alert |
| Payment        | 10 min | 20           | Block + Alert |
| RFID Scan      | 1 min  | 50           | Block + Log   |
| Registration   | 1 hour | 5            | Block + Alert |
| Admin          | 5 min  | 500          | Block + Log   |

### DDoS Protection

**Layer 3/4 (Network)**

- AWS Shield Standard (included)
- CloudFlare DDoS protection
- Auto-scaling based on traffic

**Layer 7 (Application)**

- Rate limiting per IP
- Progressive delays
- CAPTCHA challenges
- IP reputation scoring
- Suspicious activity detection

### Suspicious Activity Detection

```typescript
Triggers:
  - Multiple failed login attempts
  - Unusual request patterns
  - Known attack signatures
  - Suspicious user agents
  - Path traversal attempts
  - SQL injection patterns
  - XSS attack patterns

Actions:
  - Strict rate limiting (1 req/hour)
  - Security team alert
  - Comprehensive logging
  - Temporary IP ban (configurable)
```

---

## Logging & Monitoring

### Security Event Logging

**Logged Events**

```typescript
Authentication:
  - Login attempts (success/failure)
  - Password changes
  - MFA events
  - Session creation/destruction
  - Token refresh

Authorization:
  - Access denied events
  - Privilege escalation attempts
  - Role changes

Data Access:
  - Payment transactions
  - PII data access
  - Admin operations
  - Sensitive data exports

Security:
  - Rate limit exceeded
  - Input validation failures
  - Suspicious activity detected
  - Security header violations
  - CORS policy violations
```

### Log Retention

| Log Type    | Retention | Storage        | Access          |
| ----------- | --------- | -------------- | --------------- |
| Security    | 1 year    | AWS CloudWatch | Admin only      |
| Audit       | 7 years   | S3 Glacier     | Compliance team |
| Application | 90 days   | CloudWatch     | Dev team        |
| Access      | 6 months  | S3             | Security team   |

### Real-Time Monitoring

**CloudWatch Alarms**

```yaml
Critical:
  - Failed login attempts > 10 (15 min)
  - Payment failures > 5 (10 min)
  - API error rate > 5%
  - Database connection failures
  - Security group changes

Warning:
  - Rate limit exceeded
  - Unusual traffic patterns
  - Certificate expiration (30 days)
  - Disk usage > 80%
```

### Security Dashboard

- Real-time threat detection
- Attack pattern visualization
- Geographic traffic analysis
- User behavior analytics
- Compliance status monitoring

---

## Incident Response

### Incident Response Plan

**Phase 1: Detection & Analysis**

1. Automated alerts trigger
2. Security team notified (< 5 minutes)
3. Initial assessment (< 15 minutes)
4. Severity classification

**Phase 2: Containment**

1. Isolate affected systems
2. Preserve evidence
3. Implement temporary fixes
4. Update firewall rules

**Phase 3: Eradication**

1. Identify root cause
2. Remove threat
3. Patch vulnerabilities
4. Update security controls

**Phase 4: Recovery**

1. Restore systems
2. Monitor closely
3. Verify security
4. Document changes

**Phase 5: Post-Incident**

1. Incident report
2. Lessons learned
3. Update procedures
4. Team training

### Incident Severity Classification

| Level    | Description                       | Response Time | Notification    |
| -------- | --------------------------------- | ------------- | --------------- |
| Critical | Data breach, system compromise    | < 15 min      | CEO, CTO, Legal |
| High     | Payment system down, major outage | < 30 min      | CTO, Security   |
| Medium   | Individual account compromise     | < 2 hours     | Security team   |
| Low      | Suspicious activity detected      | < 24 hours    | Dev team        |

### Communication Plan

**Internal**

- Slack security channel
- Email escalation
- Phone tree for critical incidents
- Status page updates

**External**

- Customer notification (if affected)
- Regulatory reporting (if required)
- Public disclosure (72 hours GDPR)
- Media relations (if necessary)

---

## Security Audits

### Regular Security Assessments

**Internal Audits**

- Weekly: Automated vulnerability scans
- Monthly: Security configuration review
- Quarterly: Code security review
- Annually: Comprehensive security audit

**External Audits**

- PCI DSS audit (annual)
- Penetration testing (bi-annual)
- Third-party security assessment
- Compliance certifications

### Security Testing

**Types of Testing**

1. **Static Application Security Testing (SAST)**
   - SonarQube integration
   - ESLint security plugin
   - Dependency vulnerability scanning

2. **Dynamic Application Security Testing (DAST)**
   - OWASP ZAP automated scans
   - Burp Suite professional
   - API security testing

3. **Penetration Testing**
   - External penetration test (bi-annual)
   - Internal penetration test (annual)
   - Social engineering tests
   - Physical security assessment

4. **Dependency Scanning**
   - npm audit (daily)
   - Snyk vulnerability scanning
   - Automated PR security checks
   - License compliance checking

### Audit Checklist

- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] PCI DSS requirements met
- [ ] GDPR compliance verified
- [ ] Encryption implementation reviewed
- [ ] Access controls validated
- [ ] Logging and monitoring functional
- [ ] Backup and recovery tested
- [ ] Incident response plan updated
- [ ] Security training completed
- [ ] Third-party security assessed

---

## Vulnerability Management

### Vulnerability Disclosure Program

**Responsible Disclosure Policy**

```
Email: security@hasivu.com
Response Time: 48 hours
Bug Bounty: Yes (HackerOne)
Scope: All production systems
Out of Scope: Staging, test environments
```

### Vulnerability Handling

**Process**

1. Report received
2. Acknowledgment (< 48 hours)
3. Investigation and validation
4. Severity assessment
5. Remediation planning
6. Fix deployment
7. Reporter notification
8. Public disclosure (30-90 days)

**Severity Levels**

```yaml
Critical (9.0-10.0):
  - Fix within 24 hours
  - Immediate deployment
  - Emergency change process

High (7.0-8.9):
  - Fix within 7 days
  - Scheduled deployment
  - Standard change process

Medium (4.0-6.9):
  - Fix within 30 days
  - Regular release cycle
  - Standard change process

Low (0.1-3.9):
  - Fix within 90 days
  - Next major release
  - Tracked in backlog
```

### Patch Management

**Critical Security Patches**

- Assessment: Within 24 hours
- Testing: 1-2 days
- Deployment: Within 7 days
- Verification: Post-deployment

**Regular Updates**

- Dependencies: Monthly
- Framework updates: Quarterly
- OS patches: Monthly
- Security tools: Weekly

---

## Security Checklist

### Development Security

- [ ] Code reviewed for security issues
- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Rate limiting applied
- [ ] Logging implemented
- [ ] Error handling secure
- [ ] Dependencies up-to-date
- [ ] Security tests passed

### Deployment Security

- [ ] Secrets not in code
- [ ] Environment variables secured
- [ ] TLS/SSL configured
- [ ] Firewall rules applied
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] Disaster recovery tested
- [ ] Access controls verified
- [ ] Security scanning completed
- [ ] Compliance requirements met

---

## Security Contacts

### Security Team

- **Chief Security Officer:** security-cso@hasivu.com
- **Security Operations:** security-ops@hasivu.com
- **Incident Response:** security-incident@hasivu.com
- **Vulnerability Reports:** security@hasivu.com

### Emergency Contact

**24/7 Security Hotline:** +1-XXX-XXX-XXXX
**Slack Channel:** #security-alerts
**PagerDuty:** security-oncall

---

## References & Compliance

### Standards & Frameworks

- OWASP Top 10 (2021)
- PCI DSS v3.2.1
- GDPR (EU Regulation 2016/679)
- ISO 27001:2013
- NIST Cybersecurity Framework
- CIS Controls v8

### External Resources

- [OWASP Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PCI Security Standards](https://www.pcisecuritystandards.org/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

**Document Version:** 2.0
**Last Review:** October 12, 2025
**Next Review:** January 12, 2026
**Owner:** Security Team
**Classification:** Internal
