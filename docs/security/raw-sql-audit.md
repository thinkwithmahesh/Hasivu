# Raw SQL Audit — BMAD Blocker 2

**Date:** 2026-05-02 | **Agent:** Amelia (Security) + Winston (Architecture)

## Summary

- **Total `$queryRawUnsafe` call sites:** 18
- **Category A (already parameterized — SAFE):** 16
- **Category B (wrapper with guard added):** 2
- **Category C (string concat — DANGEROUS):** 0

## Category A — Already Parameterized (SAFE)

All enterprise functions use the `(query, ...params)` pattern with `$N` placeholders.
These are **safe** as-is — no user input is concatenated into the SQL string.

| #   | File                                                           | Line | Pattern                                               | Risk    |
| --- | -------------------------------------------------------------- | ---- | ----------------------------------------------------- | ------- |
| 1   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 258  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 2   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 259  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 3   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 678  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 4   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 740  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 5   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 184  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 6   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 432  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 7   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 620  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 8   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 621  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 9   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 926  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 10  | `src/functions/enterprise/school-hierarchy-manager.ts`         | 927  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 11  | `src/functions/enterprise/school-hierarchy-manager.ts`         | 1040 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 12  | `src/functions/enterprise/cross-school-analytics.ts`           | 820  | `$queryRawUnsafe(baseQuery, ...params)`               | ✅ Safe |
| 13  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 768  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 14  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 769  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 15  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 1226 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 16  | `src/functions/analytics/business-intelligence-aggregator.ts`  | 1048 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |

## Category B — Wrapper with Guard (FIXED)

These are generic wrapper functions. Guards added to block multi-statement injection and warn on missing `$N` placeholders.

| #   | File                                        | Line | Status         |
| --- | ------------------------------------------- | ---- | -------------- |
| 17  | `src/database/DatabaseManager.ts`           | 123  | ✅ Guard added |
| 18  | `src/services/analytics/query-execution.ts` | 199  | ✅ Guard added |

## Category C — String Concatenation (DANGEROUS)

**None found.** All 18 call sites use parameterized patterns.

## Note on `$queryRaw` (tagged template — safe by design)

The remaining ~40 calls using `$queryRaw` with tagged template literals (backtick syntax) are safe by Prisma design — values are automatically parameterized. No action needed.

## Conclusion

**Risk level after audit: LOW.** All raw SQL calls are properly parameterized. The two generic wrappers now have runtime injection guards.
