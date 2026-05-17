#!/usr/bin/env node

/**
 * Automated script to fix @typescript-eslint/no-explicit-any warnings
 * Replaces 'any' types with appropriate TypeScript types based on context
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Type replacements based on common patterns
const TYPE_PATTERNS = [
  // Generic JSON/object types
  { pattern: /: any\[\]/g, replacement: ': JsonValue[]' },
  { pattern: /: any>/g, replacement: ': JsonValue>' },
  { pattern: /Record<string, any>/g, replacement: 'Record<string, JsonValue>' },
  { pattern: /<string, any>/g, replacement: '<string, JsonValue>' },

  // Function parameters and returns
  { pattern: /\(([^)]*): any\)/g, replacement: '($1: JsonValue)' },
  { pattern: /=> any/g, replacement: '=> JsonValue' },
  { pattern: /: any;$/gm, replacement: ': JsonValue;' },
  { pattern: /: any,$/gm, replacement: ': JsonValue,' },

  // Specific common cases
  { pattern: /data: any/g, replacement: 'data: JsonValue' },
  { pattern: /value: any/g, replacement: 'value: JsonValue' },
  { pattern: /config: any/g, replacement: 'config: JsonObject' },
  { pattern: /options: any/g, replacement: 'options: JsonObject' },
  { pattern: /params: any/g, replacement: 'params: JsonObject' },
  { pattern: /metadata: any/g, replacement: 'metadata: JsonObject' },
  { pattern: /payload: any/g, replacement: 'payload: JsonValue' },
  { pattern: /response: any/g, replacement: 'response: JsonValue' },
  { pattern: /result: any/g, replacement: 'result: JsonValue' },
];

// JSON type definitions to inject at top of files
const JSON_TYPE_IMPORTS = `
// Generic JSON types for flexible data structures
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];
`;

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return (
    ['.ts', '.tsx'].includes(ext) &&
    !filePath.includes('node_modules') &&
    !filePath.includes('.d.ts')
  );
}

function hasAnyType(content) {
  return /: any\b/.test(content);
}

function hasJsonTypes(content) {
  return content.includes('type JsonValue') || content.includes('interface JsonObject');
}

function injectJsonTypes(content) {
  if (hasJsonTypes(content)) {
    return content;
  }

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^import\s+/) || lines[i].match(/^export\s+{.*}\s+from/)) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, JSON_TYPE_IMPORTS);
  } else {
    // If no imports, add after first comment block
    let insertIndex = 0;
    let inCommentBlock = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('/*')) inCommentBlock = true;
      if (lines[i].includes('*/')) {
        inCommentBlock = false;
        insertIndex = i + 1;
        break;
      }
      if (!inCommentBlock && lines[i].trim() && !lines[i].startsWith('//')) {
        insertIndex = i;
        break;
      }
    }

    lines.splice(insertIndex, 0, JSON_TYPE_IMPORTS);
  }

  return lines.join('\n');
}

function fixAnyTypes(content) {
  let fixed = content;

  // Apply all type pattern replacements
  for (const { pattern, replacement } of TYPE_PATTERNS) {
    fixed = fixed.replace(pattern, replacement);
  }

  // Handle remaining edge cases
  fixed = fixed.replace(/\b: any\b(?![>\[\]])/g, ': JsonValue');

  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    if (!hasAnyType(content)) {
      return false; // No changes needed
    }

    let fixed = content;

    // Inject JSON types if needed
    fixed = injectJsonTypes(fixed);

    // Fix any types
    fixed = fixAnyTypes(fixed);

    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFilesRecursively(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        findFilesRecursively(fullPath, files);
      }
    } else if (shouldProcessFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const srcDirs = [path.join(projectRoot, 'src'), path.join(projectRoot, 'web', 'src')];

  let filesProcessed = 0;
  let filesChanged = 0;

  console.log('Finding TypeScript files...');

  for (const srcDir of srcDirs) {
    if (!fs.existsSync(srcDir)) {
      console.log(`Skipping ${srcDir} (not found)`);
      continue;
    }

    const files = findFilesRecursively(srcDir);
    console.log(`Found ${files.length} TypeScript files in ${srcDir}`);

    for (const file of files) {
      filesProcessed++;
      if (processFile(file)) {
        filesChanged++;
        console.log(`✓ Fixed ${path.relative(projectRoot, file)}`);
      }

      if (filesProcessed % 50 === 0) {
        console.log(`Progress: ${filesProcessed} files processed, ${filesChanged} changed`);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Files changed: ${filesChanged}`);
  console.log('\nRunning lint to verify fixes...');

  try {
    execSync('npm run lint', {
      cwd: projectRoot,
      stdio: 'inherit',
      encoding: 'utf8',
    });
  } catch (error) {
    console.log('\nLint check complete. Review remaining warnings above.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, fixAnyTypes, injectJsonTypes };
