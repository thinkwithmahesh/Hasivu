# Runtime route map

Single reference for **where HTTP traffic is handled** in this repository. Update when adding routes or Lambdas.

| Area                            | Base path / trigger                    | Runtime                             | Source                                                      |
| ------------------------------- | -------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Health                          | `GET /health`, `GET /api/health`       | Express (`src/app.ts`)              | `src/routes/health.routes.ts`                               |
| Auth                            | `/api/auth/*`                          | Express                             | `src/routes/auth.routes.ts`                                 |
| Payments                        | `/api/payments/*`                      | Express                             | `src/routes/payments.routes.ts`                             |
| Orders (v1)                     | `/api/v1/orders/*`                     | Express                             | `src/routes/orders.routes.ts`                               |
| Kitchen                         | `/api/kitchen/*`                       | Express                             | `src/routes/kitchen.routes.ts`                              |
| Next BFF / web                  | `/api/*` on web host (e.g. `:3001`)    | Next.js App Router / route handlers | `web/src/app/api/**`                                        |
| Order Lambdas (legacy / hybrid) | API Gateway paths per `serverless.yml` | AWS Lambda                          | `src/functions/orders/*.ts`                                 |
| Enterprise / analytics Lambdas  | Per `serverless.yml`                   | AWS Lambda                          | `src/functions/enterprise/**`, `src/functions/analytics/**` |

## Notes

- **Express** is the default backend for local Docker (`docker-compose.dev.yml` → backend container) and VPS-style deploys that run `node dist/src/index.js`.
- **Next BFF** proxies selected auth calls to the Express backend; JWT signing material must match (`JWT_SECRET`).
- **Lambda** handlers use `src/shared/database.service.ts` (re-export of `DatabaseService` from `src/services/database.service.ts`) for Prisma access with the same schema as Express.
