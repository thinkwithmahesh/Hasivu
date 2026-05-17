#!/usr/bin/env node
/**
 * Lightweight secret scanner for pre-commit and CI.
 * Fails on high-confidence patterns outside allowed template files.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'coverage',
  'dist',
  'build',
  'playwright-report',
  'test-results',
]);

const ALLOWLIST_FILES = new Set([
  '.env.example',
  '.env.sample',
  'web/.env.example',
  'docs/audit/BASELINE_COMMAND_OUTPUTS.md',
  'docs/audit/BASELINE_FINDINGS.md',
]);

const INCLUDED_PATH_PREFIXES = ['src/', 'web/src/', 'prisma/', 'scripts/', '.github/workflows/'];

const INCLUDED_EXACT_FILES = new Set([
  'package.json',
  'web/package.json',
  'Dockerfile',
  'docker-compose.yml',
  '.env.example',
  '.env.sample',
  'web/.env.example',
]);

const HIGH_CONFIDENCE_PATTERNS = [
  { name: 'AWS Access Key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/g },
  {
    name: 'JWT Secret Assignment',
    regex: /\bJWT_(?:REFRESH_)?SECRET\s*=\s*["']?[A-Za-z0-9_\-+=/]{24,}/g,
  },
  {
    name: 'Razorpay Secret Assignment',
    regex: /\bRAZORPAY_KEY_SECRET\s*=\s*["']?[A-Za-z0-9_\-]{16,}/g,
  },
  {
    name: 'Generic Secret Assignment',
    regex: /\b(?:API_KEY|SECRET_KEY|PRIVATE_KEY)\s*=\s*["']?[A-Za-z0-9_\-+=/]{20,}/g,
  },
];

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    ['.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.md', '.env', '.sample'].includes(
      ext
    ) || path.basename(filePath).startsWith('.env')
  );
}

function getCandidateFiles() {
  const cmd = process.env.CI ? 'git ls-files' : 'git diff --cached --name-only --diff-filter=ACMR';
  let raw = '';
  try {
    raw = execSync(cmd, { encoding: 'utf8' });
  } catch {
    raw = execSync('git ls-files', { encoding: 'utf8' });
  }
  return raw
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .map(rel => rel.replace(/\\/g, '/'));
}

const files = getCandidateFiles()
  .map(rel => ({ rel, full: path.join(ROOT, rel) }))
  .filter(f => {
    if (!fs.existsSync(f.full)) return false;
    if (f.rel.split('/').some(seg => EXCLUDED_DIRS.has(seg))) return false;
    if (!isTextFile(f.full)) return false;
    if (INCLUDED_EXACT_FILES.has(f.rel)) return true;
    return INCLUDED_PATH_PREFIXES.some(prefix => f.rel.startsWith(prefix));
  });

const findings = [];
for (const f of files) {
  if (ALLOWLIST_FILES.has(f.rel)) continue;
  const content = fs.readFileSync(f.full, 'utf8');
  for (const p of HIGH_CONFIDENCE_PATTERNS) {
    const matches = content.match(p.regex);
    if (matches && matches.length > 0) {
      const sample = matches[0];
      // Ignore common placeholder/test strings to reduce false positives.
      if (/(your-|replace-|test-|example|dummy|changeme)/i.test(sample)) {
        continue;
      }
      findings.push({ file: f.rel, pattern: p.name, sample: sample.slice(0, 80) });
    }
  }
}

if (findings.length > 0) {
  console.error('Secret scan failed. High-confidence secrets detected:');
  findings.slice(0, 100).forEach((f, i) => {
    console.error(`${i + 1}. ${f.file} [${f.pattern}] -> ${f.sample}`);
  });
  process.exit(1);
}

console.log('Secret scan passed (no high-confidence secrets).');
