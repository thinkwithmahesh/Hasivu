#!/bin/bash

# Fix final remaining function files with error handling issues

echo "Fixing final remaining function files..."

# Fix static/serve-content.ts (multiple occurrences)
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/static/serve-content.ts

# Fix static/serve-static.ts (multiple occurrences)
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/static/serve-static.ts

echo "Final function files fixed. Running type check..."

npx tsc --noEmit

echo "TypeScript check completed."