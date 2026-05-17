# Clean repository export guide

Use this when you want a **fresh Git history** with only production-relevant files (no agent status reports, installers, or local secrets).

## What HASIVU is

**HASIVU** is a school meal ordering platform for Indian schools:

| Role        | Capabilities                                                              |
| ----------- | ------------------------------------------------------------------------- |
| **Parent**  | Browse menus, cart, checkout (Razorpay), children profiles, order history |
| **Student** | Menu, orders, RFID pickup guidance                                        |
| **Admin**   | Users, menus, analytics, school operations                                |
| **Kitchen** | Prep queue, inventory, order status                                       |
| **Vendor**  | Orders, inventory, forecasting, payments                                  |

**Stack (as built):** Next.js (`web/`) + Express API (`src/`) + Prisma/PostgreSQL + Redis. Docker Compose for local and VPS-style deploy. Five product roles only (no teacher/super-admin surfaces).

**Code intelligence:** Index with `npx gitnexus analyze` and jcodemunch `index_folder` on the repo root after large changes.

## What belongs in the export

| Include                  | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `src/`                   | Express API, services, routes                     |
| `web/`                   | Next.js App Router UI                             |
| `tests/`                 | Jest + Playwright                                 |
| `scripts/`               | Deploy, smoke, performance                        |
| `prisma/`                | Schema and migrations                             |
| `docs/`                  | Runbooks, architecture, PRD shards, quality       |
| `.github/`               | CI workflows                                      |
| `infrastructure/`        | Docker/IaC                                        |
| `docker-compose*.yml`    | Local/prod compose                                |
| Root configs             | `package.json`, `tsconfig*`, `.env.example`, etc. |
| `README.md`, `AGENTS.md` | Onboarding                                        |

| Exclude                                      | Reason                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| `node_modules/`, `dist/`, `.next/`, coverage | Build/install artifacts                                         |
| `legacy/`                                    | Quarantined serverless (see `docs/pilot/SERVICE_QUARANTINE.md`) |
| Root `*_REPORT.md`, `*_SUMMARY.md`           | Agent/session noise (~170 files)                                |
| `AWSCLIV2.pkg`                               | Local installer (~40MB)                                         |
| `.env`, `.env.secrets`, `.env.production`    | Secrets — use `.env.example` only                               |
| `.gitnexus/`, `graphify-out/`                | Local indexes                                                   |

## Steps

### 1. Clean this working tree

```bash
cd /path/to/hasivu-platform
chmod +x scripts/prepare-clean-export.sh

# Preview
DRY_RUN=1 ./scripts/prepare-clean-export.sh

# Apply (removes root status markdown, AWS pkg, local build dirs)
./scripts/prepare-clean-export.sh
```

Refresh GitNexus after cleanup:

```bash
npx gitnexus analyze
```

### 2. Optional: rsync to a sibling export folder

```bash
CREATE_EXPORT=1 EXPORT_DIR=../hasivu-platform-clean ./scripts/prepare-clean-export.sh
cd ../hasivu-platform-clean
cp .env.example .env.local
# edit .env.local — never commit real secrets
```

### 3. Fresh Git repository (replaces old history)

**Do this only when you intend to replace the remote** (backup first).

```bash
cd ../hasivu-platform-clean   # or stay in cleaned repo

git init
git add .
git commit -m "Initial commit: HASIVU school meal platform (production export)"

# New empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_ORG/hasivu-platform.git
git branch -M main
git push -u origin main
```

To **retire** the old repo: archive it on GitHub or delete after verifying the new remote. Do not force-push to `main` on the old remote without team agreement.

### 4. Verify before publish

```bash
npm ci
npm --prefix web ci
npm run type-check
npm run test:unit
cd web && npx playwright test --project=Accessibility tests/accessibility/accessibility-testing.accessibility.spec.ts
```

## Related docs

- [README.md](../README.md) — quick start and architecture
- [docs/architecture/RUNTIME_ROUTE_MAP.md](architecture/RUNTIME_ROUTE_MAP.md) — Express vs Next routes
- [docs/HASIVU_UI_UX_AS_BUILT.md](HASIVU_UI_UX_AS_BUILT.md) — UI route map
- [docs/runbooks/](runbooks/) — deploy, rollback, secrets
