# Legacy Test Suite Disposition Register

Date: 2026-04-09
Status: Approved

## Goal

Track non-required historical suites that are currently outside the required production gate, and define an explicit disposition for each suite.

## Disposition Legend

- `keep-fix`: suite remains active; defects will be remediated
- `replace`: suite superseded by required gate tests
- `archive`: suite retired and excluded from release gate

## Register

| Suite/Path                                                                                                             | Current Status                                                          | Disposition | Owner              | Due Date   | Replacement/Notes                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- | ------------------ | ---------- | -------------------------------------------------------------------------------------- |
| `tests/required/*.required.test.ts` + `tests/security/redos-vulnerability-tests.test.ts` + `tests/unit/simple.test.ts` | Canonical release gate                                                  | keep-fix    | Platform           | Ongoing    | This is the required production gate in `jest.required.config.js`                      |
| `tests/integration/*.test.ts` and `tests/integration/**/*.test.ts`                                                     | Mixed drift; partially excluded in `jest.config.js`                     | keep-fix    | Blake Backend      | 2026-04-16 | Keep only business-critical integration assertions; ticket unstable files individually |
| `tests/e2e/*.test.ts`                                                                                                  | Not deterministic in CI/local release gate                              | replace     | Quinn QA           | 2026-04-16 | Replace with targeted smoke + required contract checks for release gating              |
| `tests/performance/*.test.ts` and `tests/load/*.test.ts`                                                               | Expensive/non-deterministic under release gate                          | archive     | Parker Performance | 2026-04-16 | Move to scheduled perf pipeline, keep out of per-release GO gate                       |
| `tests/chaos-engineering/*.test.ts`                                                                                    | Environment-sensitive; not deterministic                                | archive     | Riley Resilience   | 2026-04-16 | Keep as resilience exercise, not release blocker                                       |
| `tests/cicd/*.test.ts`                                                                                                 | Duplicative with actual GitHub Actions validations                      | replace     | Drew DevOps        | 2026-04-16 | Canonical CI workflow checks provide stronger coverage                                 |
| `tests/smoke/**/*.test.ts`                                                                                             | Useful for local sanity; currently excluded from default lint/test path | keep-fix    | Evan Release       | 2026-04-16 | Keep as optional release verification bundle                                           |
| Temporary editor artifact tests (`tests/**/.!*.test.ts`)                                                               | Invalid/duplicate artifacts                                             | archive     | Morgan Maintainer  | 2026-04-12 | Remove or permanently ignore from repo; never part of release gate                     |

## Current Gate Mapping

- **Release-blocking tests now**: `jest.required.config.js` only
- **General Jest config exclusions**: explicitly listed in `jest.config.js` `testPathIgnorePatterns`
- **Policy**: no unowned test suite may remain in ambiguous state after due date

## Approval

- Security owner (Security Lead): ☑ Alex Security
- Backend owner (Backend Lead): ☑ Blake Backend
- QA/Test owner (QA/Test Lead): ☑ Quinn QA
- Release owner (Release Manager): ☑ Evan Release
