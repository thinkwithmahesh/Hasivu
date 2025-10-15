#!/bin/bash

# Comprehensive TypeScript Syntax Error Fixer
# Fixes common syntax errors across the entire codebase

echo "Starting comprehensive syntax error fixes..."

# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)

# Fix _boolean to boolean
echo "Fixing _boolean to boolean..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/_boolean/boolean/g' "$file"
done

# Fix _null to null
echo "Fixing _null to null..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/_null/null/g' "$file"
done

# Fix Number.MAXVALUE to Number.MAX_VALUE
echo "Fixing Number.MAXVALUE..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/Number\.MAXVALUE/Number.MAX_VALUE/g' "$file"
done

# Fix arrow functions _param = > to (param) =>
echo "Fixing arrow functions..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/\b_\([a-zA-Z_][a-zA-Z0-9_]*\) = >/(\1) =>/g' "$file"
done

# Fix property access _property to .property
echo "Fixing property access..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/\._\([a-zA-Z_][a-zA-Z0-9_]*\)/.\1/g' "$file"
done

# Fix assignment operators = to ===
echo "Fixing comparison operators..."
find src -name "*.ts" -type f | while read -r file; do
    # Be careful not to change === to ==== or = in declarations
    sed -i.bak 's/\([^=!<>]\)==\([^=]\)/\1===\2/g' "$file"
done

# Fix incomplete reduce calls (common pattern)
echo "Fixing incomplete reduce calls..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/reduce((sum, dp)/reduce((sum, dp) => sum + dp.value, 0)/g' "$file"
done

# Fix incomplete filter/map calls
echo "Fixing incomplete filter/map calls..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/\.filter(_\([a-zA-Z_][a-zA-Z0-9_]*\)/.filter((\1)/g' "$file"
    sed -i.bak 's/\.map(_\([a-zA-Z_][a-zA-Z0-9_]*\)/.map((\1)/g' "$file"
    sed -i.bak 's/\.forEach(_\([a-zA-Z_][a-zA-Z0-9_]*\)/.forEach((\1)/g' "$file"
done

# Fix incomplete find calls
echo "Fixing incomplete find calls..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/\.find(a/\.find((a)/g' "$file"
    sed -i.bak 's/\.find(_\([a-zA-Z_][a-zA-Z0-9_]*\)/.find((\1)/g' "$file"
done

# Fix missing closing parentheses in function calls
echo "Fixing missing parentheses..."
find src -name "*.ts" -type f | while read -r file; do
    # This is tricky, but try to fix common patterns
    sed -i.bak 's/=> this\.filterByTimeRange(series, timeRange)/=> this.filterByTimeRange(series, timeRange))/g' "$file"
    sed -i.bak 's/=> alert\.status/=> alert.status)/g' "$file"
done

# Fix enum member issues
echo "Fixing enum issues..."
find src -name "*.ts" -type f | while read -r file; do
    sed -i.bak 's/^\([[:space:]]*\)[A-Z_][A-Z0-9_]*,$/\1\1,/g' "$file"
done

echo "Syntax fixes completed. Running type check..."

npx tsc --noEmit

echo "TypeScript check completed."