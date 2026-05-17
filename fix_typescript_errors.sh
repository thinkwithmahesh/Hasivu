#!/bin/bash

# HASIVU Platform - Comprehensive TypeScript Error Fixer Script
# Fixes common TypeScript strict mode errors across the entire codebase

echo "Starting comprehensive TypeScript error fixes..."

# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Fix 'error' is of type 'unknown' in catch blocks
echo "Fixing error handling in catch blocks..."

# Find all TypeScript files and fix catch blocks
find src -name "*.ts" -type f | while read -r file; do
    # Create backup
    cp "$file" "backups/$(date +%Y%m%d_%H%M%S)/$(basename "$file")"

    # Fix catch blocks where error is used directly
    sed -i.bak 's/catch (error) {/catch (error: unknown) {/g' "$file"

    # Fix error.message and error.stack usage
    sed -i.bak 's/error\.message/(error instanceof Error ? error.message : String(error))/g' "$file"
    sed -i.bak 's/error\.stack/(error instanceof Error ? error.stack : undefined)/g' "$file"

    # Fix logger calls with error parameter
    sed -i.bak 's/logger\.\(error\|warn\|info\|debug\)([^,]*, error)/logger.\1(\2, { error: error instanceof Error ? error.message : String(error) })/g' "$file"
    sed -i.bak 's/logger\.\(error\|warn\|info\|debug\)([^,]*, { error })/logger.\1(\2, { error: error instanceof Error ? error.message : String(error) })/g' "$file"
done

# Fix undefined property access
echo "Fixing undefined property access..."

find src -name "*.ts" -type f | xargs sed -i.bak 's/\.getGauge([^)]*)/\.getGauge($1) || 0/g'
find src -name "*.ts" -type f | xargs sed -i.bak 's/\.getCounter([^)]*)/\.getCounter($1) || 0/g'

# Fix null/undefined assignments
echo "Fixing null/undefined type issues..."

find src -name "*.ts" -type f | xargs sed -i.bak 's/: Date | null/: Date | null | undefined/g'
find src -name "*.ts" -type f | xargs sed -i.bak 's/: string | null/: string | null | undefined/g'

# Fix array type issues
echo "Fixing array type issues..."

find src -name "*.ts" -type f | xargs sed -i.bak 's/: any\[\]/: any[] | undefined/g'

# Fix optional chaining issues
echo "Fixing optional chaining issues..."

find src -name "*.ts" -type f | xargs sed -i.bak 's/\?\./\?\./g'

# Fix type assertions for database results
echo "Fixing database result types..."

find src -name "*.ts" -type f | xargs sed -i.bak 's/user\.schoolId/user.schoolId || undefined/g'
find src -name "*.ts" -type f | xargs sed -i.bak 's/user\.firstName/user.firstName || undefined/g'
find src -name "*.ts" -type f | xargs sed -i.bak 's/user\.lastName/user.lastName || undefined/g'
find src -name "*.ts" -type f | xargs sed -i.bak 's/user\.emailVerified/user.emailVerified || undefined/g'

echo "TypeScript error fixes completed. Running type check..."

npx tsc --noEmit

echo "TypeScript check completed."
