#!/bin/bash

# Fix remaining function files with error handling issues

echo "Fixing remaining function files..."

# Fix mobile-tracking.ts (multiple occurrences)
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/rfid/mobile-tracking.ts

# Fix photo-verification.ts (multiple occurrences)
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/rfid/photo-verification.ts

# Fix static/serve-content.ts
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/static/serve-content.ts

# Fix static/serve-static.ts (multiple occurrences)
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/static/serve-static.ts

# Fix shared/cognito.service.ts
sed -i.bak 's/return handleError(error);/return handleError(error instanceof Error ? error : new Error(String(error)));/g' src/functions/shared/cognito.service.ts

echo "Remaining function files fixed. Running type check..."

npx tsc --noEmit

echo "TypeScript check completed."