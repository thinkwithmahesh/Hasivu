const fs = require('fs');
const files = [
  'src/components/ui/ClassCard.tsx',
  'src/components/ui/MealCard.tsx',
  'src/components/sections/admin/Dashboard.tsx',
  'src/components/sections/admin/MenuManagement.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\.\/Badge/g, './badge');
  content = content.replace(/\.\.\/\.\.\/ui\/Badge/g, '../../ui/badge');
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
}
