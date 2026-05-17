# Dependency audit policy

## Goals

1. **Block regressions** on **production** dependency trees for **critical** severity (npm advisory database).
2. **Surface** full dev+prod vulnerability counts for triage without pretending the tree is clean.
3. **Automate** routine upgrades via Dependabot.

## Why runtime-only and critical-first

The repository graph is large (`graphify-out/GRAPH_REPORT.md` reports thousands of nodes and communities). Transitive **devDependencies** (Storybook, Dredd, ESLint plugins, test tooling) carry many moderate/high findings that do **not** ship to production. Gating CI on `npm audit` without `--omit=dev` creates noise and false urgency.

**CI gate:** `npm audit --omit=dev --audit-level=critical` at the repo root **and** under `web/`.

**Local check (same as CI):**

```bash
npm run audit:prod-critical
```

## Full reports (optional)

Developers may run a full audit for backlog work:

```bash
npm audit --json > /tmp/audit-root.json
(cd web && npm audit --json > /tmp/audit-web.json)
```

## Waiver process

If a **critical** finding is accepted temporarily:

1. Open a ticket with **CVE ID**, **affected package**, **exploitability** for our deployment model, and **exit date**.
2. Prefer **pin / override / patch upgrade** over a waiver.
3. Document the waiver in the ticket only; do not commit live secrets or long-lived `npm audit` ignore flags without review.

## jcodemunch (blast radius before major bumps)

Indexed repo id: resolve with MCP `resolve_repo` on the workspace path (currently `local/hasivu-platform-f501c264`).

Before upgrading major versions of **Next.js**, **auth**, **payments**, or **Prisma**:

- `search_text` / `find_references` on the old and new import paths.
- `get_blast_radius` (when available) for the symbol under change.

After large lockfile changes, run **`index_folder`** on the repo root with `incremental: true` so symbol search stays accurate.

## Dependabot

GitHub Dependabot configuration lives in `.github/dependabot.yml` (npm ecosystems: repository root and `web/`). Security PRs should pass `audit:prod-critical` and the existing CI pipeline.

## Graphify (architecture + impact)

With `graphify-out/` present, use the **Graphify** CLI (`graphify query "<question>"` from the repo root) for broad questions like “where does the web app depend on Next server APIs?” or “what touches Razorpay?” — the graph links communities across `web/` and `src/` without hand-grepping the whole tree.

## Related

- `docs/PRODUCTION_READINESS_100_PLAN.md` — MoSCoW item on dependency hygiene.
- `docs/runbooks/SECRETS_ROTATION.md` — credential rotation (separate from npm advisories).
