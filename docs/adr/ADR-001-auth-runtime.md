# ADR-001: Authentication Runtime Path

## Status: ACCEPTED

## Date: 2026-05-01 (closure: 2026-05-01)

## Context

The browser authenticates through **same-origin** calls to `/api/auth/*` from `AuthApiService` (`web/src/services/auth-api.service.ts` **47–50**: `this.baseUrl = '/api'`). The **authoritative credential and session logic** for MVP lives in **Express** (`src/routes/auth.routes.ts`).

Optional **Lambda** integration exists for teams that host auth on Lambda: when `LAMBDA_AUTH_LOGIN_URL` / `LAMBDA_AUTH_REFRESH_URL` resolve via `resolveProxyUrl` (`web/src/app/api/_utils/proxy.ts` **72–85**), the corresponding Next **Route Handlers** proxy to those URLs instead of Express.

## Decision

**ACCEPTED — Express is the default auth server; Lambda is opt-in.**

- **Default (no Lambda URLs):** Next Route Handlers **forward** the request to Express using `NEXT_PUBLIC_API_URL` (see `forwardToExpressApi` in `web/src/app/api/_utils/proxy.ts`, used from `web/src/app/api/auth/login/route.ts` and `web/src/app/api/auth/refresh/route.ts`).
- **Opt-in Lambda:** When `LAMBDA_AUTH_LOGIN_URL` / `LAMBDA_AUTH_REFRESH_URL` are set and pass `resolveProxyUrl`, the same Route Handlers call Lambda instead.

`next.config.js` **165–171** defines a **rewrite** of `/api/:path*` → `${NEXT_PUBLIC_API_URL}/:path*`. **Route Handlers under `app/api/` take precedence** over that rewrite for matching paths, so auth traffic is governed by the handlers above—not by the rewrite alone.

## Consequences

- **Required env for local/staging web + API:** `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001/api`) so Express forwarding works when Lambda is unset (`web/src/app/api/_utils/proxy.ts` **getExpressApiBaseUrl**).
- **Lambda deployments:** Set `LAMBDA_AUTH_*` URLs; unset or omit them when using Express-only to avoid accidental dual configuration.
- Clients that call **`NEXT_PUBLIC_API_BASE_URL` directly** (e.g. `web/src/services/api.ts` **5–6**) still talk to Express for resource APIs; auth cookies must remain consistent with whichever host sets them (Next forward copies `Set-Cookie` from Express).

## Code Evidence

| File                                    | Lines                                                | What it proves                                                                                         |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `web/src/services/auth-api.service.ts`  | 47–50                                                | Browser auth uses same-origin `/api`.                                                                  |
| `web/src/app/api/auth/login/route.ts`   | (full)                                               | Lambda branch if `LAMBDA_AUTH_LOGIN_URL`; else `forwardToExpressApi` → Express `POST /api/auth/login`. |
| `web/src/app/api/auth/refresh/route.ts` | (full)                                               | Same pattern for refresh.                                                                              |
| `web/src/app/api/_utils/proxy.ts`       | 72–85, `getExpressApiBaseUrl`, `forwardToExpressApi` | Lambda resolution rules + Express base URL.                                                            |
| `web/next.config.js`                    | 165–171                                              | Rewrite to Express for `/api/*` when no handler matches.                                               |
| `src/routes/auth.routes.ts`             | 209–295, 301–333                                     | Express implements login, refresh, cookies.                                                            |

## Migration Notes

1. **Production:** Prefer **either** resolved Lambda URLs **or** Express forwarding—set `NEXT_PUBLIC_API_URL` to the internal/API ingress that runs `auth.routes`. Avoid leaving placeholder Lambda URLs in secrets (`resolveProxyUrl` treats placeholders as unset — **72–78**).
2. **B6-style guard (optional):** If ops standardizes on Express-only in production, ensure `LAMBDA_AUTH_*` are **absent** from the Next runtime environment so the forward path always runs; accidental Lambda URLs should be caught in config review / CI secret lint.
