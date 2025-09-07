#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚨 Emergency TODO Corruption Cleanup Script');
console.log('Targeting: "TODO: Add proper ReDoS protection" corruption pattern');

// Find all corrupted files
const findCorruptedFiles = () => {
  try {
    const result = execSync('find src -name "*.ts" -exec grep -l "TODO: Add proper ReDoS protection" {} \\;', { encoding: 'utf8' });
    return result.trim().split('\n').filter(file => file);
  } catch (error) {
    console.error('Error finding corrupted files:', error.message);
    return [];
  }
};

// Clean TODO corruption from a file
const cleanFile = (filePath) => {
  try {
    console.log(`\nProcessing: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    let cleanedContent = content;
    
    // Pattern 1: Remove all TODO injection comments
    cleanedContent = cleanedContent.replace(/\/\/\s*TODO: Add proper ReDoS protection\s*/g, '');
    cleanedContent = cleanedContent.replace(/\/\*\*?\s*TODO: Add proper ReDoS protection\s*\*?\*?\//g, '');
    
    // Pattern 2: Fix broken imports with TODO injections
    cleanedContent = cleanedContent.replace(/from\s+['"]@\/[^'"]*TODO[^'"]*['"]/g, (match) => {
      const cleaned = match.replace(/TODO[^'"]*/, '').replace(/\s+/g, ' ').trim();
      return cleaned;
    });
    
    // Pattern 3: Fix broken import paths with spaces and TODO fragments
    cleanedContent = cleanedContent.replace(/from\s+['"]@\/\s+([^'"]+)\s*['"]/g, 'from "@/$1"');
    cleanedContent = cleanedContent.replace(/from\s+['"]\.\.\/\s+\.\.\/\s*([^'"]+)\s*['"]/g, 'from "../../$1"');
    
    // Pattern 4: Fix malformed comment blocks
    cleanedContent = cleanedContent.replace(/^\s*\*\s*[^*\n]*TODO[^*\n]*$/gm, '');
    
    // Pattern 5: Fix broken object/interface definitions
    cleanedContent = cleanedContent.replace(/{\s*}\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=[:{])/g, '$1: {');
    
    // Pattern 6: Fix broken function signatures
    cleanedContent = cleanedContent.replace(/\)\s*:\s*Promise<[^>]+>\s*=>\s*{}\s*([^}])/g, '): Promise<APIGatewayProxyResult> => {\n  $1');
    
    // Pattern 7: Clean up malformed strings and expressions
    cleanedContent = cleanedContent.replace(/`[^`]*TODO[^`]*`/g, (match) => {
      // Try to reconstruct the string by removing TODO corruption
      return match.replace(/TODO[^`]*/, '').replace(/\s+/g, ' ').trim() || "''";
    });
    
    // Pattern 8: Fix incomplete statements and declarations
    cleanedContent = cleanedContent.replace(/;\s*\*\s*[^*\n]*$/gm, ';');
    
    // Pattern 9: Clean up empty lines and formatting
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`  ✅ Cleaned corruption patterns`);
      return true;
    } else {
      console.log(`  ℹ️  No corruption patterns found`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const main = () => {
  console.log('\n🔍 Scanning for corrupted files...');
  
  const corruptedFiles = findCorruptedFiles();
  console.log(`Found ${corruptedFiles.length} corrupted files`);
  
  if (corruptedFiles.length === 0) {
    console.log('No corrupted files found. Exiting.');
    return;
  }
  
  console.log('\n🔧 Starting cleanup operation...');
  let cleanedCount = 0;
  
  for (const file of corruptedFiles) {
    if (cleanFile(file)) {
      cleanedCount++;
    }
  }
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`  Total files processed: ${corruptedFiles.length}`);
  console.log(`  Files cleaned: ${cleanedCount}`);
  console.log(`  Files unchanged: ${corruptedFiles.length - cleanedCount}`);
  
  // Check TypeScript compilation after cleanup
  console.log('\n🧪 Testing TypeScript compilation...');
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    console.log('  ✅ TypeScript compilation successful!');
  } catch (error) {
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (errorOutput.match(/error TS/g) || []).length;
    console.log(`  ⚠️  ${errorCount} TypeScript errors remaining`);
    
    // Show first 10 errors for analysis
    const errors = errorOutput.split('\n').filter(line => line.includes('error TS')).slice(0, 10);
    if (errors.length > 0) {
      console.log('\n  First 10 remaining errors:');
      errors.forEach(error => console.log(`    ${error}`));
    }
  }
  
  console.log('\n🚀 Cleanup operation complete!');
};

main();