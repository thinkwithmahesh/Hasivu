#!/bin/bash

# Fix TypeScript errors systematically
cd ~/Downloads/hasivu-platform

echo "Fixing TypeScript errors in restored functions..."

# The errors show createErrorResponse is being called with wrong parameters
# Old signature from .bak files doesn't match current signature
# Current: errorResponse(code: string, message: string, statusCode?: number, details?: any)

# Since the main issue is number → string conversions for status codes,
# let me use a comprehensive TypeScript fix

npx tsc --noEmit 2>&1 | tee typescript-errors.log

echo "Total error count:"
grep "error TS" typescript-errors.log | wc -l

echo ""
echo "Error breakdown:"
grep "error TS" typescript-errors.log | cut -d':' -f3- | sort | uniq -c | sort -rn
