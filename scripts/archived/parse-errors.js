const fs = require('fs');

const content = fs.readFileSync('errors.log', 'utf8');
const lines = content.split('\n').filter(line => line.trim() && line.includes('error TS'));

const errors = {};

lines.forEach(line => {
  const match = line.match(/^([^:]+)\(\d+,\d+\): (error TS\d+: .+)$/);
  if (match) {
    const file = match[1];
    const message = match[2];
    if (!errors[file]) {
      errors[file] = { count: 0, messages: new Set() };
    }
    errors[file].count++;
    errors[file].messages.add(message);
  }
});

const result = Object.keys(errors)
  .sort()
  .map(file => {
    const { count, messages } = errors[file];
    return {
      file,
      count,
      uniqueMessages: Array.from(messages).sort(),
    };
  });

console.log(JSON.stringify(result, null, 2));
