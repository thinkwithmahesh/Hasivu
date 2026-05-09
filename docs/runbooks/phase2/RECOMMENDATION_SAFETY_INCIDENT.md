# Runbook: Recommendation Safety Incident

**Use when:** A recommendation explanation contains unsafe medical, therapeutic, discriminatory, or unverifiable nutrition claims.

## Immediate Response

1. Set `RECOMMENDATIONS_ENABLED=false`.
2. Capture `runId`, `recommendationItemId`, explanation text, user ID, and timestamp.
3. Do not re-enable until a regression test covers the exact failing phrase or rule.

## Diagnose

- Inspect `RecommendationRun`, `RecommendationItem`, and feedback records.
- Check whether the unsafe text came from the rule-based explanation builder or future external engine.
- Confirm the safety policy rejected known medical phrasing.

## Fix Criteria

- Add or update safety-policy tests.
- Confirm low-confidence fallback still avoids medical claims.
- Product signs off that explanation copy is acceptable.
