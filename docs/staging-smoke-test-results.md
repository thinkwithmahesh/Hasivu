# Staging smoke test — results log

| Field               | Value                                             |
| ------------------- | ------------------------------------------------- |
| **Date**            | 2026-05-01                                        |
| **Tester**          | Codex (automated local dry-run)                   |
| **Environment**     | `http://localhost:3000` / `http://localhost:3001` |
| **Runbook version** | `docs/staging-smoke-test-runbook.md`              |

## Outcome

- [ ] **PASS** — All 16 steps in the runbook completed as expected
- [x] **FAIL** — See “Failures” below; launch gate blocked until resolved

## Notes (optional)

Executed as a local staging-equivalent dry-run after creating GitHub `staging` environment secrets.
Docker compose build failed due npm peer-resolution conflict in image build (`openai` peerOptional `zod ^3.23.8` vs root `zod ^4.x`), so services were brought up via local `npm run dev` for backend and web.
This run is **not** a full staging validation; browser + Razorpay + real staging infra checks remain pending.

## Failures (if any)

| Step # | Expected                                                | Actual                                                                                 | Issue link |
| ------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| 1      | `GET /health/ready` returns `200` with db/redis healthy | `404 Route GET /health/ready not found` on local backend instance                      | N/A        |
| 3      | `GET /api/orders` returns `401`                         | `404 Route GET /api/orders not found`                                                  | N/A        |
| 4      | `GET /api/menus/items` returns `401`                    | `404 Route GET /api/menus/items not found`                                             | N/A        |
| 5      | `POST /api/auth/login` returns `200` + cookies          | `500 Internal server error` on local web proxy                                         | N/A        |
| 8-16   | Browser + checkout + webhook checks                     | Blocked: no real staging URLs/seed creds/Razorpay webhook target in this local dry-run | N/A        |
