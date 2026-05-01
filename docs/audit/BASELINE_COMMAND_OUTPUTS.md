# Baseline Command Outputs

Date: 2026-04-09

## 1) `npm audit --audit-level=moderate`

- Status: failed threshold
- Summary:
  - 91 vulnerabilities total
  - 3 critical, 68 high, 7 moderate, 13 low
- Examples from output:
  - `basic-ftp` critical path traversal advisory
  - `fast-xml-parser` critical DoS advisories
  - `axios` high-severity advisories

## 2) `npm test -- --coverage`

- Status: failed
- Key failures:
  - Jest ESM parse error (`node-fetch` import usage under current transform setup)
  - broad functional failures in E2E/integration/unit suites

## 3) `npx ts-prune`

- Status: completed
- Result: extensive unused exports reported across app/test modules.

## 4) `npx depcheck`

- Status: completed with issues
- Result:
  - many unused dependencies/devDependencies
  - missing dependencies across tests and archived scripts

## 5) `npx madge --circular --extensions ts,tsx src/`

- Status: completed
- Result: no circular dependencies found.

## 6) `python3 -m json.tool swagger.json`

- Status: failed
- Error:
  - `Expecting property name enclosed in double quotes: line 6 column 5 (char 100)`

## 7) `git log --all --full-history -- "**/.env"`

- Status: completed
- Result: no output.

## 8) `git log --all --full-history -- ".env"`

- Status: completed
- Result: `.env` appears in repository history.
