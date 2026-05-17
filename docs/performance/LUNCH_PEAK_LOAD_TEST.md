# Lunch-peak load test — scenario and SLO alignment

## Purpose

Validate behaviour under **concurrent parents** placing orders near the lunch cutoff, aligned with PRD-style NFRs (throughput and latency). This document is the **planning artifact**; execution uses existing npm scripts and infrastructure.

## Scenario (baseline)

| Parameter     | Starting point                              |
| ------------- | ------------------------------------------- |
| Virtual users | 50–200 parents (ramp over 2–5 minutes)      |
| Actions       | Login → list menu → create order → confirm  |
| Think time    | 3–8 s between steps                         |
| Spike         | Optional burst at T+4 min (deadline stress) |

## SLOs to record (tune with product)

| Metric                         | Target (draft)   | Notes                                             |
| ------------------------------ | ---------------- | ------------------------------------------------- |
| Order submit success rate      | ≥ 99% under load | Exclude intentional validation errors             |
| p95 API latency (order create) | &lt; 2 s         | Express `/api/v1/orders` or BFF path used in prod |
| Error rate (5xx)               | &lt; 0.5%        | Logged server-side                                |

## How to run (tooling in repo)

```bash
# Orchestrated suite (see package.json for env knobs)
npm run test:load:dev
# or staging / production-labelled configs:
npm run test:load:staging
```

For **API-only** spikes against a deployed URL, use your runner of choice (k6, Artillery) pointed at health + auth + order endpoints; capture **RPS**, **p95/p99**, and **error mix**.

## Evidence to archive

- Runner output (HTML/JSON), timestamp, git SHA, environment (staging vs prod-like).
- DB connection pool and Redis latency snapshots if available.

## Follow-ups

- Compare results to `docs/PRODUCTION_READINESS_100_PLAN.md` performance pillar.
- If Express is the bottleneck, profile hot handlers and DB queries before scaling out.
