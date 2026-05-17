# Archived Scripts

This directory contains corrupted or deprecated scripts that have been removed from active development.

## Archived Files

### accessibility-audit.js

- **Date Archived**: 2025-10-14
- **Reason**: Fatal parsing errors - file was severely corrupted with missing code blocks and syntax errors
- **Replacement**: Use `/web/scripts/accessibility-audit.js` (fully functional, 24KB)
- **Alternative**: Use `/web/accessibility-audit-simple.js` (lightweight version, 12KB)
- **Status**: Not used in codebase - no imports found

### advanced-security-fix.js

- **Date Archived**: 2025-10-14
- **Reason**: Fatal parsing errors - file was severely corrupted with incomplete function definitions and syntax errors
- **Replacement**: Use `/scripts/security-validation.js` (comprehensive, 9.4KB)
- **Alternatives**:
  - `/emergency-security-fix.js` (quick fixes)
  - `/fix-hooks-security.js` (hook-specific security)
  - `/scripts/production-security-hardening.js` (production hardening)
- **Status**: Not used in codebase - no imports found

## Actions Taken

1. Both files were moved from project root to this archived directory
2. ESLint configuration updated to ignore `scripts/archived/` directory
3. No code dependencies on these files were found in the codebase
4. Working alternatives exist and should be used for all functionality

## Recovery

If you need to restore these files:

1. Review git history: `git log --all --full-history -- "**/accessibility-audit.js"`
2. The files in this directory are already corrupted - do not attempt to use them
3. Use the working alternatives listed above instead
