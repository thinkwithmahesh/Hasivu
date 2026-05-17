#!/bin/bash

# Fix remaining function files with error handling issues

echo "Fixing remaining function files..."

# Fix payments/reconciliation.ts
sed -i.bak 's/return handleError(error, requestId);/return handleError(error instanceof Error ? error : new Error(String(error)), requestId);/g' src/functions/payments/reconciliation.ts

# Fix rfid/delivery-verification.ts
sed -i.bak 's/return handleError(error, requestId);/return handleError(error instanceof Error ? error : new Error(String(error)), requestId);/g' src/functions/rfid/delivery-verification.ts

# Fix rfid/mobile-card-management.ts (multiple occurrences)
sed -i.bak 's/return handleError(error, requestId);/return handleError(error instanceof Error ? error : new Error(String(error)), requestId);/g' src/functions/rfid/mobile-card-management.ts

# Fix rfid/mobile-tracking.ts (multiple occurrences)
sed -i.bak 's/return handleError(error, requestId);/return handleError(error instanceof Error ? error : new Error(String(error)), requestId);/g' src/functions/rfid/mobile-tracking.ts

echo "Function files fixed. Running type check..."

npx tsc --noEmit

echo "TypeScript check completed."