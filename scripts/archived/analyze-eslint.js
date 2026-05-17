const fs = require('fs');

// Read the ESLint JSON output from file
const eslintOutput = JSON.parse(fs.readFileSync('full-eslint-output.json', 'utf-8'));

// Initialize data structures
const directoryIssues = {};
const ruleIssues = {};
const severityCounts = { 1: 0, 2: 0 }; // 1=warning, 2=error

eslintOutput.forEach(file => {
  const filePath = file.filePath.replace('/Users/mahesha/Downloads/hasivu-platform/', '');
  const directory = filePath.split('/').slice(0, -1).join('/') || 'root';

  if (!directoryIssues[directory]) {
    directoryIssues[directory] = { total: 0, warnings: 0, errors: 0, rules: {} };
  }

  file.messages.forEach(message => {
    const ruleId = message.ruleId || 'parsing-error';
    const { severity } = message;

    // Count by directory
    directoryIssues[directory].total++;
    if (severity === 1) directoryIssues[directory].warnings++;
    else if (severity === 2) directoryIssues[directory].errors++;

    if (!directoryIssues[directory].rules[ruleId]) {
      directoryIssues[directory].rules[ruleId] = 0;
    }
    directoryIssues[directory].rules[ruleId]++;

    // Count by rule
    if (!ruleIssues[ruleId]) {
      ruleIssues[ruleId] = { total: 0, warnings: 0, errors: 0, directories: {} };
    }
    ruleIssues[ruleId].total++;
    if (severity === 1) ruleIssues[ruleId].warnings++;
    else if (severity === 2) ruleIssues[ruleId].errors++;

    if (!ruleIssues[ruleId].directories[directory]) {
      ruleIssues[ruleId].directories[directory] = 0;
    }
    ruleIssues[ruleId].directories[directory]++;

    // Overall severity
    severityCounts[severity]++;
  });
});

// Sort directories by total issues
const sortedDirectories = Object.entries(directoryIssues).sort(([, a], [, b]) => b.total - a.total);

// Sort rules by total issues
const sortedRules = Object.entries(ruleIssues).sort(([, a], [, b]) => b.total - a.total);

console.log('=== ESLINT ANALYSIS REPORT ===\n');

console.log('OVERALL SUMMARY:');
console.log(`Total files with issues: ${eslintOutput.length}`);
console.log(`Total issues: ${severityCounts[1] + severityCounts[2]}`);
console.log(`Warnings: ${severityCounts[1]}`);
console.log(`Errors: ${severityCounts[2]}\n`);

console.log('ISSUES BY DIRECTORY (sorted by total issues):');
sortedDirectories.forEach(([dir, stats]) => {
  console.log(
    `\n${dir}/ (${stats.total} issues - ${stats.warnings} warnings, ${stats.errors} errors)`
  );
  const topRules = Object.entries(stats.rules)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  topRules.forEach(([rule, count]) => {
    console.log(`  - ${rule}: ${count}`);
  });
});

console.log('\n\nISSUES BY RULE TYPE (sorted by total issues):');
sortedRules.forEach(([rule, stats]) => {
  console.log(
    `\n${rule} (${stats.total} total - ${stats.warnings} warnings, ${stats.errors} errors)`
  );
  const topDirs = Object.entries(stats.directories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  topDirs.forEach(([dir, count]) => {
    console.log(`  - ${dir}/: ${count}`);
  });
});

console.log('\n=== END REPORT ===');
