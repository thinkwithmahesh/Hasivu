# Hasivu Service Quarantine - Pilot Scope Definition

**Date:** 2026-05-09
**Audit basis:** BMAD Production Audit (65/100 -> ~85/100 post-remediation)
**Purpose:** Explicitly define what is and is not in pilot scope

---

## Pilot Scope - Services Active And Tested

| Service | Routes | Test Coverage | Status |
|---------|--------|---------------|--------|
| auth.service.ts | /api/auth/* | Unit + E2E | LIVE |
| menu.service.ts | /api/menus/* | Unit + E2E | LIVE |
| order.service.ts | /api/orders/* | Unit + E2E | LIVE |
| payment.service.ts | /api/payments/* (Razorpay) | Unit + E2E | LIVE |
| rfid.service.ts | /api/rfid/* | Unit + E2E smoke | LIVE |
| notification.service.ts | Email via backend | Unit | LIVE (email only) |
| kitchen service path | /api/kitchen/* | E2E | LIVE |

---

## Quarantined - Phase 2 (Not Active In Pilot)

| Service | Reason | Target |
|---------|--------|--------|
| websocket.service.ts | No live push verified; browser flow currently uses polling/static launch data | Phase 2 |
| wallet.service.ts | Stub implementation | Phase 2 |
| invoice.service.ts | Stub implementation | Phase 2 |
| subscription.service.ts | Partial; billing lifecycle not wired | Phase 2 |
| fraud-detection.service.ts | Scope creep for pilot; not required for school meal MVP | Phase 2 |
| src/services/ml/* | Scope creep for pilot | Phase 3 |

---

## Formally Descoped - Will Not Implement For Pilot

| Feature | PRD Reference | Decision | Rationale |
|---------|---------------|----------|-----------|
| WhatsApp Business API | FR10 | Descoped to Phase 2 | API approval and template review can take 2-4 weeks |
| Stripe gateway | FR4 | Won't prioritize | Razorpay is sufficient for the India pilot |
| Hindi + Kannada i18n | NFR9 | Deferred to Phase 2 | English is acceptable for the first pilot cohort |
| Calendar meal scheduler | PRD section 03 | Deferred to Phase 2 | Basic menu selection is sufficient for pilot validation |
| React Native app | PRD mention | Descoped to Phase 3 | Web-first strategy confirmed |
| AI meal recommendations | N/A | Won't prioritize | Scope creep |
| Federated learning | N/A | Won't prioritize | Scope creep |

---

## API Routes With Explicit Phase-2 Responses

These routes exist for UI compatibility but now fail closed with a clear `501 FEATURE_DEFERRED`
response instead of returning static data:

| Route | Response | Notes |
|-------|-------------|-------|
| /api/inventory/* | 501 FEATURE_DEFERRED | Full inventory persistence is Phase 2 |
| /api/staff/* | 501 FEATURE_DEFERRED | Staff management persistence is Phase 2 |
| /api/schools/* | 501 FEATURE_DEFERRED | Multi-school onboarding administration is Phase 2 |
| /api/analytics/federated-learning | 503 unless explicit legacy Lambda URL is configured | Not active in pilot |
| /api/analytics/strategic-insights | 503 unless explicit legacy Lambda URL is configured | Not active in pilot |
| /api/analytics/revenue-optimization | 503 unless explicit legacy Lambda URL is configured | Not active in pilot |

Kitchen APIs are no longer backed by static launch data. They proxy to the canonical Express API where
the backend already supports the operation:

| Route | Backend path |
|-------|--------------|
| /api/kitchen/orders | /api/v1/orders |
| /api/kitchen/orders/:id/status | /api/v1/orders/:id |
| /api/kitchen/orders/:id/assign | /api/kitchen/orders/:id/assign |
| /api/kitchen/staff | /api/kitchen/staff |

---

## Sign-Off Required Before Pilot Launch

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| Product Manager | | | |
