const fs = require('fs');

const content = fs.readFileSync('eslint-output.json', 'utf8');
const files = JSON.parse(content);

const result = {};

files.forEach(file => {
  const filePath = file.filePath.replace('/Users/mahesha/Downloads/hasivu-platform/', '');
  const errors = [];
  const warnings = [];

  file.messages.forEach(msg => {
    if (msg.severity === 2) {
      errors.push(msg.message);
    } else if (msg.severity === 1) {
      warnings.push(msg.message);
    }
  });

  const uniqueErrors = [...new Set(errors)];
  const uniqueWarnings = [...new Set(warnings)];

  result[filePath] = {
    errors: errors.length,
    warnings: warnings.length,
    uniqueErrorMessages: uniqueErrors,
    uniqueWarningMessages: uniqueWarnings,
  };
});

console.log(JSON.stringify(result, null, 2));
