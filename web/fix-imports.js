const fs = require('fs');
const files = [
  'src/components/sections/admin/Dashboard.tsx',
  'src/components/sections/admin/MenuManagement.tsx',
  'src/components/sections/kitchen/ByMealView.tsx',
  'src/components/sections/parent/CheckoutSheet.tsx',
  'src/components/sections/parent/HomeScreen.tsx',
  'src/components/sections/parent/OrderHistory.tsx',
  'src/components/ui/ClassCard.tsx',
  'src/components/ui/MealCard.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ui\/Card'/g, "ui/card'");
  content = content.replace(/ui\/Badge'/g, "ui/badge'");
  content = content.replace(/ui\/Switch'/g, "ui/switch'");
  content = content.replace(/ui\/Drawer'/g, "ui/drawer'");
  content = content.replace(/ui\/Button'/g, "ui/button'");
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
}
