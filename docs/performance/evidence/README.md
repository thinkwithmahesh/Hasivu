# Load / performance evidence

Store **dated** outputs from load or performance runs here (or link to CI artifacts).

Each run should record:

- Git SHA and branch  
- Environment (local / staging / prod-like)  
- Command (e.g. `npm run test:load:staging`)  
- Summary metrics (RPS, p95, error rate) and raw log attachment  

See `docs/performance/LUNCH_PEAK_LOAD_TEST.md` for the scenario template.

## Latest run log

- **2026-05-05 (local agent run)**  
  - Command: `LOAD_TEST_URL="https://app.hasivu.com" LOAD_ENDPOINT="/api/health" TEST_ENVIRONMENT=staging TEST_TYPE=load npm run test:load`
  - Evidence: `load-2026-05-05T15-22-26-622Z.json` and `load-2026-05-05T15-22-26-622Z.md`
  - Result: `statusCounts={"0":250}` with `fetch failed` for all requests.
  - Blocker: DNS resolution from this execution environment (`curl: Could not resolve host: app.hasivu.com`).
  - Next attempt: rerun from network that can resolve the staging/prod domain, or set `LOAD_TEST_URL` to an internally reachable preview URL.

- **2026-05-05 (local docker stack, refreshed build)**  
  - Command: `LOAD_TEST_URL="http://localhost:3000" LOAD_ENDPOINT="/health" TEST_ENVIRONMENT=development TEST_TYPE=load npm run test:load`
  - Evidence: `load-2026-05-05T15-37-31-918Z.json` and `load-2026-05-05T15-37-31-918Z.md`
  - Result: `statusCounts={"200":100,"429":150}` (`p95=43ms`).
  - Interpretation: latency is acceptable on healthy responses, but rate-limiter throttling dominates at this request burst profile.

- **2026-05-05 (local docker stack, canary profile after backend restart)**  
  - Command: `LOAD_VUS=4 LOAD_REQUESTS=80 LOAD_BATCH_DELAY_MS=120 LOAD_TEST_URL="http://localhost:3000" LOAD_ENDPOINT="/health" TEST_ENVIRONMENT=development TEST_TYPE=load npm run test:load`
  - Evidence: `load-2026-05-05T15-50-21-927Z.json` and `load-2026-05-05T15-50-21-927Z.md`
  - Result: `statusCounts={"200":80}`, success `100%`, `p95=14ms`.
  - Interpretation: service baseline is healthy at canary load; previous `429` spikes were primarily limiter-window behavior, not backend instability.
