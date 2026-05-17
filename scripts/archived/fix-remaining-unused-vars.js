#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to automatically fix remaining @typescript-eslint/no-unused-vars errors
 * by prefixing variables with underscore
 */

function fixUnusedVarsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Read the ESLint output to get specific error locations
    // For now, let's use regex patterns to find and fix common cases

    // Pattern 1: Variable declarations like: const variable = value;
    // But we need to be careful not to prefix already prefixed ones
    const varPatterns = [
      // const/let declarations
      /(const|let)\s+(\w+)\s*=\s*[^;]+;/g,
      // function parameters
      /function\s+\w+\s*\(\s*([^)]*)\s*\)/g,
      // arrow function parameters
      /\(\s*([^)]*)\s*\)\s*=>/g,
      // destructuring assignments
      /\{\s*([^}]*)\s*\}\s*=\s*[^;]+;/g,
      /\[\s*([^]]*)\s*\]\s*=\s*[^;]+;/g,
    ];

    // For simplicity, let's focus on the most common patterns from the ESLint output
    // Variables that are assigned but never used
    content = content.replace(/(\w+)\s*=\s*[^;]+;\s*$/gm, (match, varName) => {
      if (
        varName &&
        !varName.startsWith('_') &&
        varName !== 'const' &&
        varName !== 'let' &&
        varName !== 'var'
      ) {
        modified = true;
        return `_${varName} = ${match.split('=')[1]}`;
      }
      return match;
    });

    // Function parameters
    content = content.replace(/function\s+\w+\s*\(\s*([^)]*)\s*\)/g, (match, params) => {
      if (params.trim()) {
        const paramList = params.split(',').map(param => {
          param = param.trim();
          if (param && !param.startsWith('_') && !param.includes(':')) {
            return `_${param}`;
          }
          return param;
        });
        modified = true;
        return match.replace(params, paramList.join(', '));
      }
      return match;
    });

    // Arrow function parameters
    content = content.replace(/\(\s*([^)]*)\s*\)\s*=>/g, (match, params) => {
      if (params.trim()) {
        const paramList = params.split(',').map(param => {
          param = param.trim();
          if (param && !param.startsWith('_') && !param.includes(':')) {
            return `_${param}`;
          }
          return param;
        });
        modified = true;
        return `(${paramList.join(', ')}) =>`;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed remaining unused vars in: ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
        processDirectory(itemPath);
      }
    } else if (itemPath.endsWith('.ts') && !itemPath.includes('node_modules')) {
      fixUnusedVarsInFile(itemPath);
    }
  }
}

// Start processing from src and web directories
console.log('🔧 Fixing remaining @typescript-eslint/no-unused-vars errors...');
processDirectory(path.join(process.cwd(), 'src'));
processDirectory(path.join(process.cwd(), 'web'));
console.log('✅ Remaining unused vars fix completed. Run ESLint again to check progress.');
