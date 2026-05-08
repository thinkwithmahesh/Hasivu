/**
 * Lightweight load/performance runner for HASIVU.
 * Writes machine + markdown evidence into docs/performance/evidence/.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

type TestType = 'load' | 'smoke' | 'full' | 'chaos' | 'e2e';

interface Sample {
  ok: boolean;
  status: number;
  durationMs: number;
  error?: string;
}

interface LoadSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRatePct: number;
  errorRatePct: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  totalDurationMs: number;
  throughputRps: number;
  statusCounts: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
}

function nowIsoCompact(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function pct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function toNumber(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function hitOnce(url: string, timeoutMs: number): Promise<Sample> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runLoad(url: string): Promise<{ samples: Sample[]; summary: LoadSummary }> {
  const vus = toNumber(process.env.LOAD_VUS, 25);
  const totalRequests = toNumber(process.env.LOAD_REQUESTS, 250);
  const timeoutMs = toNumber(process.env.LOAD_TIMEOUT_MS, 6000);
  const interBatchDelayMs = toNumber(process.env.LOAD_BATCH_DELAY_MS, 25);

  const samples: Sample[] = [];
  const start = Date.now();

  let remaining = totalRequests;
  while (remaining > 0) {
    const batchSize = Math.min(vus, remaining);
    const batch = Array.from({ length: batchSize }, () => hitOnce(url, timeoutMs));
    const settled = await Promise.all(batch);
    samples.push(...settled);
    remaining -= batchSize;
    if (remaining > 0 && interBatchDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, interBatchDelayMs));
    }
  }

  const totalDurationMs = Date.now() - start;
  const durations = samples.map(s => s.durationMs);
  const successes = samples.filter(s => s.ok).length;
  const failures = samples.length - successes;
  const avgMs =
    durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

  const summary: LoadSummary = {
    totalRequests: samples.length,
    successfulRequests: successes,
    failedRequests: failures,
    successRatePct: samples.length ? (successes / samples.length) * 100 : 0,
    errorRatePct: samples.length ? (failures / samples.length) * 100 : 0,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    avgMs,
    minMs: durations.length ? Math.min(...durations) : 0,
    maxMs: durations.length ? Math.max(...durations) : 0,
    totalDurationMs,
    throughputRps: totalDurationMs > 0 ? (samples.length * 1000) / totalDurationMs : 0,
    statusCounts: {},
    topErrors: [],
  };

  for (const sample of samples) {
    const key = String(sample.status);
    summary.statusCounts[key] = (summary.statusCounts[key] || 0) + 1;
  }

  const errorCounts: Record<string, number> = {};
  for (const sample of samples) {
    if (sample.error) {
      errorCounts[sample.error] = (errorCounts[sample.error] || 0) + 1;
    }
  }
  summary.topErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { samples, summary };
}

async function writeEvidence(payload: Record<string, unknown>): Promise<void> {
  const dir = path.join(process.cwd(), 'docs', 'performance', 'evidence');
  await fs.mkdir(dir, { recursive: true });

  const stamp = nowIsoCompact();
  const jsonPath = path.join(dir, `load-${stamp}.json`);
  const mdPath = path.join(dir, `load-${stamp}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');

  const summary = payload.summary as LoadSummary;
  const markdown = `# Load Test Evidence (${stamp})

- Command: \`npm run test:load\`
- Environment: \`${payload.environment}\`
- Target: \`${payload.target}\`
- Git SHA: \`${payload.gitSha}\`
- Branch: \`${payload.branch}\`

## Metrics

- Total requests: **${summary.totalRequests}**
- Success rate: **${pct(summary.successRatePct)}**
- Error rate: **${pct(summary.errorRatePct)}**
- Throughput: **${summary.throughputRps.toFixed(2)} req/s**
- Latency p50/p95/p99: **${summary.p50Ms} / ${summary.p95Ms} / ${summary.p99Ms} ms**
- Avg/min/max latency: **${summary.avgMs.toFixed(2)} / ${summary.minMs} / ${summary.maxMs} ms**
- Status counts: **${JSON.stringify(summary.statusCounts)}**
${summary.topErrors.length > 0 ? `- Top errors: **${JSON.stringify(summary.topErrors)}**` : ''}
`;

  await fs.writeFile(mdPath, markdown, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Load evidence saved:\n- ${jsonPath}\n- ${mdPath}`);
}

async function main(): Promise<void> {
  const testType = (process.env.TEST_TYPE || 'load') as TestType;
  if (testType !== 'load') {
    // eslint-disable-next-line no-console
    console.log(`TEST_TYPE=${testType} is not implemented in this lightweight runner; exiting.`);
    return;
  }

  const base = process.env.LOAD_TEST_URL || process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  const endpoint = process.env.LOAD_ENDPOINT || '/health';
  if (!base) {
    throw new Error(
      'Missing target URL. Set LOAD_TEST_URL (preferred) or API_BASE_URL / NEXT_PUBLIC_API_URL.'
    );
  }

  const target = new URL(endpoint, base).toString();
  const { summary } = await runLoad(target);

  const payload = {
    generatedAt: new Date().toISOString(),
    testType,
    environment: process.env.TEST_ENVIRONMENT || process.env.NODE_ENV || 'development',
    target,
    gitSha: process.env.GIT_SHA || 'local',
    branch: process.env.GIT_BRANCH || 'local',
    summary,
  };

  await writeEvidence(payload);
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
