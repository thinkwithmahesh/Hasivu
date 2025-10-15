const fs = require('fs');
const path = require('path');

// Files with remaining no-case-declarations errors
const filesToFix = [
  'src/functions/analytics/strategic-insights-generator.ts',
  'src/functions/enterprise/district-admin.ts',
  'src/routes/orders.routes.ts',
  'src/services/graceful-degradation.service.ts',
];

function fixCaseDeclarations(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Split into lines for easier processing
    const lines = content.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this is a case statement followed by a lexical declaration
      if (line.match(/^\s*case\s+.*:\s*$/) && i + 1 < lines.length) {
        const nextLine = lines[i + 1];

        // Check if next line has a lexical declaration (const, let, var)
        if (nextLine.match(/^\s*(const|let|var)\s+/)) {
          // Add opening brace to case
          result.push(line.replace(/:\s*$/, ': {'));
          result.push(nextLine);

          // Find the end of this case block and add closing brace
          let j = i + 2;
          let braceAdded = false;

          while (j < lines.length) {
            const caseLine = lines[j];

            // If we hit another case or default, add closing brace before it
            if (caseLine.match(/^\s*(case|default)\s+.*:\s*$/)) {
              result.push('        }');
              result.push(caseLine);
              braceAdded = true;
              break;
            }

            // If we hit break or return, add closing brace after it
            if (caseLine.match(/^\s*(break|return|throw)\s*.*;\s*$/)) {
              result.push(caseLine);
              result.push('        }');
              braceAdded = true;
              j++; // Skip the next line we just added
              break;
            }

            result.push(caseLine);
            j++;
          }

          // If we reached the end without finding break/return/case, add closing brace
          if (!braceAdded && j >= lines.length) {
            result.push('        }');
          }

          i = j;
          modified = true;
          continue;
        }
      }

      result.push(line);
      i++;
    }

    if (modified) {
      const finalContent = result.join('\n');
      fs.writeFileSync(filePath, finalContent);
      console.log(`Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixCaseDeclarations);
console.log('Finished fixing remaining case declarations');
