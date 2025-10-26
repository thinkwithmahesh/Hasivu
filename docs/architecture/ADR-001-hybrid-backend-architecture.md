# ADR-001: Hybrid Backend Architecture Strategy

## Status

**ACCEPTED** - October 26, 2025

## Context

The HASIVU Platform backend architecture evolved with both AWS Lambda functions and Next.js API routes serving different epics. This ADR documents the intentional hybrid architecture strategy and provides a decision framework for future backend implementations.

## Architecture Overview

### Pattern 1: Direct Lambda (Microservices)

These epics expose Lambda functions directly via API Gateway:

1. **Epic 1: Authentication & Authorization**
   - Direct Lambda exposure for auth flows
   - Independent scaling for authentication load
   - Security isolation

2. **Epic 3: Payment Integration**
   - Direct Lambda for payment processing
   - Auto-scaling for payment spikes
   - PCI compliance isolation

3. **Epic 4: RFID Card Management**
   - Direct Lambda for card verification
   - High-throughput independent scaling
   - Real-time processing requirements

4. **Epic 5: Mobile App Backend**
   - Direct Lambda for mobile API
   - Independent mobile-specific scaling
   - Version-specific endpoints

### Pattern 2: BFF Proxy (Backend for Frontend)

These epics use Next.js API routes as **proxy layer** to Lambda functions:

1. **Epic 6: Analytics & Reporting**
   - **Backend**: 11 Lambda functions for analytics processing
   - **Proxy**: Next.js API routes forward to Lambda
   - **Benefits**: Cookie-based auth, request transformation, response caching
   - ML/AI model integration capabilities

2. **Epic 7: Nutrition & Meal Planning**
   - **Backend**: 6 Lambda functions for nutrition calculations
   - **Proxy**: Next.js API routes forward to Lambda
   - **Benefits**: Auth token handling, validation, error transformation
   - ML-powered meal optimization

### Pattern 3: Next.js Native (Monolithic)

This epic uses Next.js API routes with direct database access:

1. **Epic 2: Menu Management**
   - Next.js API routes with direct Prisma access
   - Read-heavy operations benefit from SSR
   - No Lambda functions (intentional simplicity)
   - Built-in caching capabilities

## Decision

### Three-Pattern Architecture Strategy

**Pattern 1: Direct Lambda (Default for Microservices)**
Use AWS Lambda functions directly for:

- Write-heavy operations (Orders, Payments, RFID writes)
- Independent scaling requirements
- Microservices separation
- Simple request/response flows
- Direct mobile API access

**Pattern 2: BFF Proxy (Lambda + Next.js Proxy)**
Use Next.js API routes as proxy to Lambda for:

- Web frontend security (httpOnly cookies)
- Complex ML/AI Lambda functions (Analytics, Nutrition)
- Request/response transformation needs
- Frontend-specific error handling
- Potential response caching at proxy layer

**Pattern 3: Next.js Native (Exception for Simplicity)**
Use Next.js API routes with direct DB access for:

- Read-heavy operations (Menu browsing)
- Simpler deployment requirements
- Direct Prisma integration benefits
- Built-in Next.js SSR and caching

## Rationale

### Pattern 1: Direct Lambda Benefits

- **Independent Scaling**: Each epic scales based on traffic
- **Cost Efficiency**: Pay-per-use model
- **Isolation**: Security and failure isolation
- **Technology Flexibility**: Different runtimes per function
- **Mobile Access**: Direct API Gateway access for mobile apps

### Pattern 2: BFF Proxy Benefits

- **Security**: httpOnly cookies (not exposed to client JS)
- **Authentication**: Centralized token management
- **Transformation**: Frontend-specific request/response shaping
- **Validation**: Early request validation before Lambda
- **Error Handling**: User-friendly error messages
- **Future Caching**: Potential proxy-level caching layer
- **Lambda Isolation**: Backend complexity hidden from frontend

### Pattern 3: Next.js Native Benefits

- **SSR Optimization**: Pre-rendering for menu display
- **Simplified Deployment**: Single Next.js deployment
- **Lower Latency**: No cold start for frequent access
- **Query Complexity**: Direct Prisma for complex filtering
- **Caching Strategy**: Built-in ISR (Incremental Static Regeneration)

### Epic-Specific Justifications

**Authentication (Pattern 1: Direct Lambda)**

- Mobile apps need direct Lambda access
- Token refresh flows require low latency
- Security isolation from other services

**Payments (Pattern 1: Direct Lambda)**

- PCI compliance isolation
- Direct webhook integration
- Independent payment gateway scaling

**RFID (Pattern 1: Direct Lambda)**

- Real-time card verification
- High throughput requirements
- Mobile delivery app integration

**Mobile Backend (Pattern 1: Direct Lambda)**

- Direct API Gateway exposure
- Version-specific endpoints
- Independent mobile scaling

**Menu (Pattern 3: Next.js Native)**

- Read-heavy operations (90%+ reads)
- Infrequent menu changes allow caching
- Complex filtering benefits from Prisma
- No Lambda overhead needed

**Analytics (Pattern 2: BFF Proxy)**

- **Why Lambda?** Complex aggregations, ML models, heavy compute
- **Why Proxy?** Cookie-based auth, response transformation, potential caching

**Nutrition (Pattern 2: BFF Proxy)**

- **Why Lambda?** AI meal optimization, ML recommendations, complex calculations
- **Why Proxy?** Auth token handling, validation, user-friendly errors

## Implementation Guidelines

### Decision Framework

```
┌─────────────────────────────────────────────────────────────┐
│ Does the feature need Lambda?                               │
│ (ML/AI, complex compute, independent scaling, write-heavy)  │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─── YES ──> ┌─────────────────────────────────────┐
             │            │ Is frontend web-only with cookies?  │
             │            │ OR needs request transformation?    │
             │            └────────┬────────────────────────────┘
             │                     │
             │                     ├─── YES ──> Pattern 2: BFF Proxy
             │                     │            (Next.js → Lambda)
             │                     │
             │                     └─── NO ──> Pattern 1: Direct Lambda
             │                                 (API Gateway → Lambda)
             │
             └─── NO ──> Pattern 3: Next.js Native
                         (Next.js → Prisma → Database)
```

### Pattern Selection Criteria

**Use Pattern 1 (Direct Lambda) when:**

- Mobile apps need direct API access
- Simple request/response flow
- No cookie-based authentication needed
- Write-heavy operations
- Microservices isolation required

**Use Pattern 2 (BFF Proxy) when:**

- Web frontend with httpOnly cookies
- Complex Lambda functions (ML/AI)
- Need request validation before Lambda
- Want error transformation for users
- Future caching layer planned

**Use Pattern 3 (Next.js Native) when:**

- Read-heavy operations (>80% reads)
- Predictable traffic patterns
- Direct database access benefits
- No ML/AI processing needed
- Simpler deployment preferred

## Consequences

### Positive

- Clear architecture decision framework
- Optimal performance for each epic
- Cost efficiency (Lambda for spikes, Next.js for steady state)
- Simplified operations for read-heavy menu
- Scalability where needed (analytics, nutrition, payments)

### Negative

- Mixed backend architecture (requires documentation)
- Developers need to understand routing strategy
- Deployment complexity (Lambda + Next.js)
- Different monitoring strategies per pattern

### Mitigations

- This ADR documents the intentional strategy
- Clear decision framework for future epics
- Consistent API naming conventions
- Unified frontend API service layer

## Current Architecture Status

### Pattern 1: Direct Lambda (Fully Implemented)

✅ **Epic 1: Authentication** - 8 Lambda functions configured
✅ **Epic 3: Payments** - 7 Lambda functions configured
✅ **Epic 4: RFID** - 8 Lambda functions configured
✅ **Epic 5: Mobile Backend** - 6 Lambda functions configured

### Pattern 2: BFF Proxy (Fully Implemented)

✅ **Epic 6: Analytics** - 11 Lambda functions + 11 Next.js proxy routes
✅ **Epic 7: Nutrition** - 6 Lambda functions + 5 Next.js proxy routes

**Architecture Flow**:

```
Frontend → Next.js Proxy → Lambda → Database/ML Models
         (httpOnly cookies)  (compute)
```

### Pattern 3: Next.js Native (Fully Implemented)

✅ **Epic 2: Menu Management** - Next.js routes with Prisma (NO Lambda)

**Note**: Menu Lambda functions were intentionally NOT implemented. The `.bak` files in `src/functions/menu/` are from early prototyping and should be removed.

## No Migration Required

**CRITICAL FINDING**: All epics are using their intended architecture patterns correctly:

1. **Nutrition**: BFF Proxy pattern is CORRECT (not duplicate)
   - Lambda functions handle AI/ML processing
   - Next.js routes provide cookie auth and error handling
   - Frontend uses Next.js routes (not direct Lambda)

2. **Analytics**: BFF Proxy pattern is CORRECT (not duplicate)
   - Lambda functions handle complex aggregations
   - Next.js routes provide authentication layer
   - Frontend uses Next.js routes (not direct Lambda)

3. **Menu**: Next.js Native is CORRECT (no Lambda needed)
   - Simple CRUD operations
   - Direct Prisma database access
   - No complex compute requirements

## Success Criteria

✅ **Clarity**: Development team understands when to use Lambda vs Next.js
✅ **Consistency**: Each epic has single backend implementation (no duplicates)
✅ **Performance**: Menu uses Next.js caching, others use Lambda scaling
✅ **Documentation**: ADR explains all architecture decisions
✅ **Frontend Integration**: Single API service layer abstracts backend differences

## References

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- HASIVU Platform Architecture Documentation
- Team 1 Frontend Cleanup Report
- Team 2 Backend Analytics Verification Report

## Related ADRs

- ADR-002: Analytics Lambda Architecture (to be created)
- ADR-003: Nutrition Lambda Architecture (to be created)
- ADR-004: Frontend API Service Layer Design (to be created)

---

**Last Updated**: October 26, 2025
**Next Review**: January 2026 or when adding new epics
