# HASIVU Platform - Architecture Quick Reference

**Last Updated**: October 26, 2025
**Status**: ✅ Production Ready

---

## 🎯 Three Architecture Patterns

### Pattern 1: Direct Lambda (Microservices)

```
Mobile/Client → API Gateway → Lambda → Database
```

**Epics**: Auth, Payments, RFID, Mobile Backend

### Pattern 2: BFF Proxy (Backend for Frontend)

```
Web Frontend → Next.js Proxy → Lambda → Database/ML
            (cookies, auth)   (compute)
```

**Epics**: Analytics, Nutrition

### Pattern 3: Next.js Native (Monolithic)

```
Web Frontend → Next.js Routes → Prisma → Database
            (SSR, caching)
```

**Epics**: Menu Management

---

## 📊 Epic Architecture Matrix

| Epic                        | Pattern   | Lambda Functions | Next.js Routes | Status |
| --------------------------- | --------- | ---------------- | -------------- | ------ |
| **Epic 1**: Authentication  | Pattern 1 | 8                | 0              | ✅     |
| **Epic 2**: Menu Management | Pattern 3 | 0                | ~6 (native)    | ✅     |
| **Epic 3**: Payments        | Pattern 1 | 7                | 0              | ✅     |
| **Epic 4**: RFID            | Pattern 1 | 8                | 0              | ✅     |
| **Epic 5**: Mobile Backend  | Pattern 1 | 6                | 0              | ✅     |
| **Epic 6**: Analytics       | Pattern 2 | 11               | 11 (proxy)     | ✅     |
| **Epic 7**: Nutrition       | Pattern 2 | 6                | 5 (proxy)      | ✅     |

**Total**: 46 Lambda functions, 16 proxy routes, ~6 native routes

---

## 🔧 When to Use Each Pattern

### Use Pattern 1 (Direct Lambda) When:

- ✅ Mobile apps need direct API access
- ✅ Simple request/response flow
- ✅ Write-heavy operations
- ✅ Microservices isolation required

### Use Pattern 2 (BFF Proxy) When:

- ✅ Web frontend with httpOnly cookies
- ✅ Complex ML/AI Lambda functions
- ✅ Need request validation before Lambda
- ✅ Want error transformation for users
- ✅ Future caching layer planned

### Use Pattern 3 (Next.js Native) When:

- ✅ Read-heavy operations (>80% reads)
- ✅ Predictable traffic patterns
- ✅ Direct database access benefits
- ✅ No ML/AI processing needed
- ✅ Simpler deployment preferred

---

## 🚀 Quick Decision Framework

```
Need Lambda? ──YES──> Mobile access? ──NO──> Pattern 2 (BFF Proxy)
    │                       │
    NO                     YES
    │                       │
    ▼                       ▼
Pattern 3              Pattern 1
(Next.js Native)    (Direct Lambda)
```

---

## 📁 Key Files

### Documentation

- `/docs/architecture/ADR-001-hybrid-backend-architecture.md` - Full architecture decisions
- `/docs/architecture/CLEANUP-TASKS.md` - Optional improvements
- `/ARCHITECTURE-RESOLUTION-REPORT.md` - Complete analysis

### Backend

- `/src/functions/` - All Lambda functions
- `/web/src/app/api/` - Next.js API routes (proxy + native)
- `/serverless.yml` - Lambda deployment configuration

### Frontend

- `/web/src/services/api/hasivu-api.service.ts` - API client
- `/web/.env.example` - Configuration examples

---

## ⚙️ Configuration

### Frontend API Base URL

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://app.hasivu.com/api
```

### Lambda Endpoints (for Next.js proxy routes)

```bash
# Nutrition
LAMBDA_NUTRITION_ANALYZE_URL=https://[api-gateway].amazonaws.com/prod/nutrition/analyze

# Analytics
LAMBDA_EXECUTIVE_DASHBOARD_URL=https://[api-gateway].amazonaws.com/prod/analytics/executive/dashboard
```

---

## 🔍 How to Verify Architecture

### Check Lambda Functions

```bash
ls -la src/functions/[epic-name]/
grep -A10 "[function-name]:" serverless.yml
```

### Check Next.js Routes

```bash
find web/src/app/api -name "route.ts" | grep [epic-name]
```

### Check if Route is Proxy or Native

```bash
# Proxy routes forward to Lambda
head -20 web/src/app/api/[epic]/[route]/route.ts | grep LAMBDA_

# Native routes use Prisma
head -20 web/src/app/api/[epic]/[route]/route.ts | grep prisma
```

---

## 🎓 Examples

### Example 1: Analytics Dashboard Request

**Flow**:

```
1. Frontend calls: hasiviApi.getDashboardData()
2. API service routes to: ${BASE_URL}/analytics/dashboard
3. Next.js proxy route: /web/src/app/api/analytics/executive-dashboard/route.ts
4. Proxy forwards to Lambda: LAMBDA_EXECUTIVE_DASHBOARD_URL
5. Lambda function: src/functions/analytics/executive-dashboard-engine.ts
6. Lambda returns processed data
7. Proxy transforms response for frontend
```

**Why BFF Proxy?**

- Cookie-based authentication (secure)
- Complex ML aggregations in Lambda
- Error transformation at proxy layer

### Example 2: Menu Browse Request

**Flow**:

```
1. Frontend calls: hasiviApi.getMenuItems()
2. API service routes to: ${BASE_URL}/menu/items
3. Next.js route: /web/src/app/api/menu/items/route.ts
4. Direct Prisma query: prisma.menuItem.findMany()
5. Returns menu data
```

**Why Next.js Native?**

- Read-heavy operation
- Benefits from SSR caching
- No complex compute needed

### Example 3: Payment Create (Mobile)

**Flow**:

```
1. Mobile app calls: https://[api-gateway].amazonaws.com/prod/payments/orders
2. API Gateway routes to Lambda: payments-create-order
3. Lambda function: src/functions/payments/create-order.ts
4. Lambda returns payment order
```

**Why Direct Lambda?**

- Mobile needs direct API access
- Write-heavy operation
- PCI compliance isolation

---

## 📈 Performance Targets

### Pattern 1 (Direct Lambda)

- **Cold Start**: <2s
- **Warm Response**: <200ms
- **Throughput**: Auto-scales

### Pattern 2 (BFF Proxy)

- **Proxy Overhead**: <100ms
- **Total Response**: <2s (including Lambda)
- **Target**: Cache expensive ML calls

### Pattern 3 (Next.js Native)

- **SSR Response**: <500ms
- **Cached Response**: <50ms
- **Database Query**: <100ms

---

## 🔒 Security Considerations

### Pattern 1 (Direct Lambda)

- API Gateway throttling configured
- Lambda execution role least privilege
- Request validation at API Gateway

### Pattern 2 (BFF Proxy)

- httpOnly cookies (XSS protection)
- Cookie flags: secure, sameSite
- Request validation at proxy layer
- Lambda URL not exposed to frontend

### Pattern 3 (Next.js Native)

- Same httpOnly cookie security
- Direct Prisma parameterized queries
- Server-side validation

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to Lambda"

**Check**: Environment variables in Next.js proxy routes

```bash
grep LAMBDA_ web/.env.production
```

### Issue: "Authentication failed"

**Check**: Cookie configuration and httpOnly flags

```bash
grep "httpOnly\|secure\|sameSite" web/src/app/api/
```

### Issue: "Slow dashboard loading"

**Check**:

1. Lambda cold start times
2. Proxy overhead
3. Consider implementing caching

---

## 📚 Further Reading

1. **ADR-001**: Complete architecture decisions and rationale
2. **CLEANUP-TASKS.md**: Optional improvements (60 min effort)
3. **ARCHITECTURE-RESOLUTION-REPORT.md**: Full analysis and findings

---

## ✅ Health Checklist

- [x] All 7 epics using correct patterns
- [x] No duplicate implementations (proxies are intentional)
- [x] Frontend configured correctly
- [x] Lambda functions deployed
- [x] Decision framework documented
- [ ] Optional: Architecture diagram created
- [ ] Optional: Proxy routes documented with comments

**Architecture Health**: 100% ✅

---

**For Questions**: See `/docs/architecture/ADR-001-hybrid-backend-architecture.md`
