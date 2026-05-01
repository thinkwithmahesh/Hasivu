# Route AuthZ Matrix

This matrix documents the effective authentication and authorization posture for currently wired backend routes in `src/app.ts`.

## Legend

- AuthN: Authentication required
- AuthZ: Role/permission checks
- RL: Rate limit
- IV: Input validation

## Effective Routes (Currently Mounted)

| Route Prefix    | Method/Path             | Middleware Chain                                      | AuthN               | AuthZ                      | RL              | IV                       | Notes                             |
| --------------- | ----------------------- | ----------------------------------------------------- | ------------------- | -------------------------- | --------------- | ------------------------ | --------------------------------- |
| `/health`       | `GET /`                 | `healthRouter`                                        | No                  | No                         | No              | No                       | Liveness/readiness style endpoint |
| `/api/health`   | `GET /`                 | `healthRouter`                                        | No                  | No                         | No              | No                       | API health mirror                 |
| `/api/auth`     | `POST /register`        | `registrationRateLimit`                               | No                  | No                         | Yes             | Basic route-level checks | Password hash + user creation     |
| `/api/auth`     | `POST /login`           | `authRateLimit`                                       | No                  | No                         | Yes             | Basic route-level checks | Sets httpOnly auth cookies        |
| `/api/auth`     | `POST /refresh`         | `authRateLimit`                                       | Refresh-token based | No                         | Yes             | Token format checks      | Rotates access cookie             |
| `/api/auth`     | `GET /me`               | `authMiddleware`                                      | Yes                 | No                         | Indirect/global | JWT + session verified   | Uses verified request user        |
| `/api/auth`     | `GET /status`           | `optionalAuthMiddleware`                              | Optional            | No                         | Indirect/global | N/A                      | Non-failing auth probe            |
| `/api/auth`     | `POST /logout`          | `authMiddleware`                                      | Yes                 | No                         | Indirect/global | N/A                      | Session invalidation              |
| `/api/auth`     | `POST /logout-all`      | `authMiddleware`                                      | Yes                 | No                         | Indirect/global | N/A                      | Logs out all sessions             |
| `/api/auth`     | `POST /forgot-password` | `passwordResetRateLimit`                              | No                  | No                         | Yes             | Basic route-level checks | Email enumeration resistant       |
| `/api/payments` | `POST /orders`          | `writeRateLimit -> authMiddleware -> validateRequest` | Yes                 | Resource checks in service | Yes             | Yes                      | Zod body validation               |
| `/api/payments` | `GET /orders/:id`       | `readRateLimit -> authMiddleware -> validateRequest`  | Yes                 | `canAccessPayment(...)`    | Yes             | Yes                      | UUID path validation              |
| `/api/payments` | `POST /:id/process`     | `writeRateLimit -> authMiddleware -> validateRequest` | Yes                 | `canAccessPayment(...)`    | Yes             | Yes                      | Ownership enforced                |

## App-Level Middleware Policy (Current)

From `src/app.ts`, app-level controls are applied before route handlers:

1. `helmet` security headers
2. `cors` with configured origins
3. `compression`
4. `express.json`/`express.urlencoded`
5. `cookie-parser`
6. `comprehensiveInputValidation` (dynamic import)
7. `generalRateLimit` (dynamic import)
8. `attachCSRFToken` and `/api` scoped `csrfProtection()`

## Known Gaps

1. Only `health`, `auth`, and `payments` routers are mounted in current boot path; other domain routes are present in repository but not active from `src/app.ts`.
2. Authorization policy is partly route-level and partly service-level; this should be unified with a declarative policy map.
3. Add explicit tests for:
   - unauthorized access (`401`)
   - forbidden resource access (`403`)
   - CSRF rejection on state-changing `/api` calls
   - rate-limit behavior for auth endpoints
