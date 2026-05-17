const fs = require('fs');
const path = require('path');

// Files with no-case-declarations errors
const filesToFix = [
  'src/functions/analytics/revenue-optimization-analyzer.ts',
  'src/functions/analytics/strategic-insights-generator.ts',
  'src/functions/enterprise/district-admin.ts',
  'src/functions/epic-7-2-parent-dashboard/parent-dashboard-orchestrator.ts',
  'src/routes/orders.routes.ts',
  'src/services/business-metrics-dashboard.service.ts',
  'src/services/crypto.service.ts',
  'src/services/graceful-degradation.service.ts',
];

function fixCaseDeclarations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern to match switch cases with lexical declarations
    const casePattern = /case\s+['"]?[^'"]+['"]?\s*:\s*\n\s*(const|let|var)\s+[^;]+;/g;

    const fixedContent = content.replace(casePattern, (match, declarationType, variableName) => {
      // Add opening brace after case
      const fixed = match.replace(/:\s*\n\s*(const|let|var)/, ': {\n        $1');
      modified = true;
      return fixed;
    });

    if (modified) {
      // Also need to add closing braces
      const lines = fixedContent.split('\n');
      let braceLevel = 0;
      let inCaseBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('case ') && line.includes(': {')) {
          braceLevel++;
          inCaseBlock = true;
        } else if (line.includes('case ') && !line.includes('{')) {
          // Regular case without brace
        } else if (line.includes('break;') && inCaseBlock) {
          // Add closing brace before break if we're in a braced case
          lines[i] = `        }\n        ${line}`;
          braceLevel--;
          inCaseBlock = false;
        } else if (line.includes('return ') && inCaseBlock) {
          // Add closing brace before return if we're in a braced case
          lines[i] = `        }\n        ${line}`;
          braceLevel--;
          inCaseBlock = false;
        }
      }

      const finalContent = lines.join('\n');
      fs.writeFileSync(filePath, finalContent);
      console.log(`Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixCaseDeclarations);
console.log('Finished fixing case declarations');
