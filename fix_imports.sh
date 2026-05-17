#!/bin/bash

# Fix import syntax: change ": _Name as _Name" to " as _Name"

find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read -r file; do
  # Use sed to replace the pattern
  sed -i '' 's/: \(_[^[:space:]]*\) as \1/ as \1/g' "$file"
done

echo "Import syntax fixes applied."