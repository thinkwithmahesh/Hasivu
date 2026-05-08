#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const serverlessPath = path.join(repoRoot, 'serverless.yml');

if (!fs.existsSync(serverlessPath)) {
  console.error('serverless.yml not found');
  process.exit(1);
}

const content = fs.readFileSync(serverlessPath, 'utf8');
const handlers = content
  .split(/\r?\n/)
  .map(line => line.match(/^\s*handler:\s*([^\s#]+)\s*$/))
  .filter(Boolean)
  .map(match => match[1]);

const missing = [];
for (const handler of handlers) {
  const [modulePath] = handler.split('.');
  const tsPath = path.join(repoRoot, `${modulePath}.ts`);
  const jsPath = path.join(repoRoot, `${modulePath}.js`);
  if (!fs.existsSync(tsPath) && !fs.existsSync(jsPath)) {
    missing.push({ handler, expected: `${modulePath}.ts|js` });
  }
}

if (missing.length > 0) {
  console.error(`Invalid serverless handler references: ${missing.length}/${handlers.length}`);
  for (const item of missing) {
    console.error(`- ${item.handler} -> missing ${item.expected}`);
  }
  process.exit(1);
}

console.log(`Serverless handler references valid: ${handlers.length}/${handlers.length}`);
