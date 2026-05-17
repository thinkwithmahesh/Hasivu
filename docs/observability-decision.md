# Observability decision (MVP)

## Status: Accepted risk (Option B)

## Date: 2026-05-01

## What is in place

- Structured logging and health endpoints on the Node API (`/health`, `/api/health`).
- AWS-oriented deployment configuration in-repo (for example `serverless.yml` patterns referenced by ops) suitable for CloudWatch log shipping when deployed to AWS.

## What is missing

- `@sentry/node` / `@sentry/nextjs` are **not** wired in this sprint (no `Sentry.init`, no automatic JS error capture).
- No committed distributed tracing configuration for the web + API split.
- No in-repo alerting runbooks tied to Sentry or APM.

## Risk accepted

Errors in production will rely primarily on **log aggregation (e.g. CloudWatch)** and manual investigation. There is **no** default real-time frontend error stream or Sentry-style issue workflow for MVP.

**Sign-off**

| Role        | Name               | Date |
| ----------- | ------------------ | ---- |
| Product     | [PM Name]          |      |
| Engineering | [Engineering Lead] |      |
