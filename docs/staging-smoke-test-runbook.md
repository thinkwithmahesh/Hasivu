# Hasivu Staging Smoke Test Runbook

**Date:** ****\_\_\_****  
**Tester:** ****\_\_\_****  
**Environment:** `https://[STAGING_FRONTEND]` (or `http://[STAGING_FRONTEND]:3000`)  
**Backend:** `http://[STAGING_BACKEND]:3001`  
**Result:** PASS / FAIL

Replace placeholders throughout: `[STAGING_BACKEND]`, `[STAGING_FRONTEND]`, test emails/passwords from your staging seed.

---

## BLOCK 1 — Infrastructure Health (~5 min)

1. [ ] `curl -sS -i "http://[STAGING_BACKEND]:3001/health/ready"`  
       **Expected:** HTTP `200`; response body indicates database and cache (Redis) are healthy (not `503`).

2. [ ] `curl -sS -i "http://[STAGING_FRONTEND]:3000/"`  
       **Expected:** HTTP `200` (or `307` to login); HTML loads (proves Next is up).

3. [ ] `curl -sS -i "http://[STAGING_BACKEND]:3001/api/orders"`  
       **Expected:** HTTP `401` (route exists, unauthenticated requests rejected — not `404`).

4. [ ] `curl -sS -i "http://[STAGING_BACKEND]:3001/api/menus/items"`  
       **Expected:** HTTP `401` (menus router mounted; auth required).

---

## BLOCK 2 — Authentication (~5 min)

5. [ ] Parent login (through Next, same-origin cookie path):

   ```bash
   curl -sS -i -X POST "http://[STAGING_FRONTEND]:3000/api/auth/login" \
     -H 'Content-Type: application/json' \
     -d '{"email":"[TEST_PARENT_EMAIL]","password":"[TEST_PARENT_PASSWORD]"}'
   ```

   **Expected:** HTTP `200`; response headers include `Set-Cookie` with `accessToken`, `refreshToken`, and `sessionId`; JSON body includes success and user with parent (or equivalent) role.

6. [ ] Kitchen staff login:

   ```bash
   curl -sS -i -X POST "http://[STAGING_FRONTEND]:3000/api/auth/login" \
     -H 'Content-Type: application/json' \
     -d '{"email":"[TEST_KITCHEN_EMAIL]","password":"[TEST_KITCHEN_PASSWORD]"}'
   ```

   **Expected:** HTTP `200`; user role suitable for kitchen workflow (e.g. kitchen staff).

7. [ ] Remember-me (optional if Redis CLI available on staging):

   Repeat step 5 with `"rememberMe": true` in the JSON body.  
   **Expected:** HTTP `200`. If you can run `redis-cli` against staging Redis, confirm the session key TTL is on the order of **many days** (not ~1 hour) for that session — exact key name depends on server implementation.

---

## BLOCK 3 — Core ordering flow (~10 min — browser)

8. [ ] Open `http://[STAGING_FRONTEND]:3000/auth/login/parent`, sign in as test parent.  
       **Expected:** Successful redirect to parent home/dashboard; no blocking errors in the browser developer console.

9. [ ] Open the daily menu page (`/daily-menu` or your navigation link).  
       **Expected:** Menu lists real items from your school data (not obviously fake placeholder names if your DB is seeded).

10. [ ] Add **two** different meal line items to the cart.  
        **Expected:** Cart count or summary updates; no console errors.

11. [ ] Open `http://[STAGING_FRONTEND]:3000/cart`.  
        **Expected:** Page loads (not “page not found”); line items and total shown correctly.

12. [ ] Proceed to checkout; complete a **Razorpay test-mode** payment (use Razorpay’s current test card guidance from their dashboard).  
        **Expected:** Payment completes; user sees confirmation or order success state.

---

## BLOCK 4 — Kitchen workflow (~5 min)

13. [ ] In a **second** browser profile (or incognito), sign in as kitchen staff.

14. [ ] Open the kitchen orders view (your app’s kitchen dashboard route).  
        **Expected:** The order from step 12 appears in the list.

15. [ ] Change that order’s status (e.g. toward “ready” or your next valid step).  
        **Expected:** Update succeeds in the UI (no permission or “not found” error). This confirms the kitchen status call matches the live backend (`PUT` to update order by id).

---

## BLOCK 5 — Payment webhook (~5 min)

16. [ ] From the Razorpay test dashboard, send a **test webhook** to your staging payment webhook URL (as configured for the environment), e.g.  
        `http://[STAGING_BACKEND]:3001/api/payments/webhook`  
        **Expected:** Razorpay shows delivery `200`; application logs show no signature mismatch and no unexpected `403` from security middleware.

---

## RESULT

- [ ] **All 16 checks PASS** → Record in `docs/staging-smoke-test-results.md` (date, tester, PASS, short notes).
- [ ] **Any FAIL** → Open a GitHub issue with label **`launch-blocker`**, paste failing step number and response body/headers (redact secrets), do not advance the launch gate.

**Total time target:** under 30 minutes when credentials and URLs are ready.
