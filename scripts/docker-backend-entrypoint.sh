#!/bin/sh
# Run migrations on every start; optionally seed demo users once (dev) when DB is empty.
set -eu
cd /app

echo "[entrypoint] prisma migrate deploy..."
npx prisma migrate deploy

if [ "${RUN_DEMO_LOCAL_USER_SYNC:-}" = "true" ]; then
  echo "[entrypoint] sync demo *.hasivu.local users (see src/database/seed-demo-local-users.ts)..."
  node dist/src/database/seed-demo-local-users.js
fi

if [ "${RUN_DB_SEED_IF_EMPTY:-}" = "true" ]; then
  COUNT="$(node <<'NODE'
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    process.stdout.write(String(await p.user.count()));
  } catch {
    process.stdout.write('0');
  } finally {
    await p.$disconnect();
  }
})();
NODE
)"
  if [ "$COUNT" = "0" ]; then
    echo "[entrypoint] No users found; running dist/src/database/seed.js ..."
    node dist/src/database/seed.js
  else
    echo "[entrypoint] Skip seed ($COUNT users already exist)."
  fi
fi

echo "[entrypoint] starting API..."
exec node -r tsconfig-paths/register dist/src/index.js
