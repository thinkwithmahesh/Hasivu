const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix private property declarations
    content = content.replace(/private _([a-zA-Z_][a-zA-Z0-9_]*) =/g, 'private $1 =');

    // Fix property accesses
    content = content.replace(/this\._([a-zA-Z_][a-zA-Z0-9_]*)/g, 'this.$1');

    // Fix variable declarations with _ prefix
    content = content.replace(/const _([a-zA-Z_][a-zA-Z0-9_]*) =/g, 'const $1 =');

    // Fix type references
    content = content.replace(/_([A-Z][a-zA-Z0-9_]*)/g, '$1');

    fs.writeFileSync(filePath, content);
    console.log(`Fixed prefixes in: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

// Process analytics directory
console.log('🔧 Fixing _ prefixes in analytics files...');
processDirectory(path.join(process.cwd(), 'src', 'analytics'));
console.log('✅ Analytics prefix fixes completed.');
