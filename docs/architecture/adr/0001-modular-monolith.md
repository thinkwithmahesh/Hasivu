# ADR 0001: Modular monolith (defer full microservice split)

## Status

Accepted — 2026-05-04

## Context

The product PRD and early designs described a **microservices-oriented** decomposition (separate deployables per domain, RFID SLAs, high scale). Day-to-day delivery runs primarily on **one Express API**, **one Next.js app**, and **select AWS Lambda** functions wired from `serverless.yml`.

## Decision

We intentionally ship a **modular monolith**:

- Domain logic lives under `src/services`, `src/routes`, and `src/repositories` with clear boundaries.
- Lambdas remain for **hybrid** workloads (existing Serverless routes, background-style enterprise modules) rather than mandatory per-request service splits.
- PostgreSQL is the **single** system of record; Prisma is the shared data access layer.

## Consequences

- **Positive:** Simpler local dev, fewer moving parts, faster iteration, one migration history (`prisma/migrations`).
- **Negative:** Scaling and blast-radius isolation are coarser than a pure microservice topology; RFID and peak-load SLOs must be validated at the monolith + DB layer.
- **Review:** Revisit this ADR if traffic, compliance, or team topology **requires** independent scaling or deploy cycles for a subdomain.
