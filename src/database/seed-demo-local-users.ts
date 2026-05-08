/**
 * Idempotent demo users for local / Docker dev (*.hasivu.local).
 * Password for all: Hasivu123!
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Hasivu123!';

const DEMO_USERS = [
  { email: 'student.demo@hasivu.local', firstName: 'Demo', lastName: 'Student', role: 'student' as const },
  { email: 'parent.demo@hasivu.local', firstName: 'Demo', lastName: 'Parent', role: 'parent' as const },
  { email: 'admin.demo@hasivu.local', firstName: 'Demo', lastName: 'Admin', role: 'admin' as const },
  { email: 'kitchen.demo@hasivu.local', firstName: 'Demo', lastName: 'Kitchen', role: 'kitchen' as const },
  { email: 'vendor.demo@hasivu.local', firstName: 'Demo', lastName: 'Vendor', role: 'vendor' as const },
];

const DEMO_MENU_ITEMS = [
  {
    id: 'menu-demo-vegetable-biryani',
    name: 'Vegetable Biryani',
    description: 'Aromatic rice with mixed vegetables and gentle school-safe spices.',
    category: 'main_course',
    price: 85,
    featured: true,
    preparationTime: 20,
    portionSize: '1 bowl',
    calories: 350,
    allergens: ['gluten'],
    tags: ['vegetarian', 'lunch'],
    nutritionalInfo: {
      calories: 350,
      protein: 12,
      carbs: 65,
      fat: 8,
    },
  },
  {
    id: 'menu-demo-paneer-sandwich',
    name: 'Paneer Sandwich',
    description: 'Grilled paneer and vegetable sandwich for a filling snack break.',
    category: 'snacks',
    price: 45,
    featured: false,
    preparationTime: 12,
    portionSize: '1 sandwich',
    calories: 280,
    allergens: ['dairy', 'gluten'],
    tags: ['vegetarian', 'snack'],
    nutritionalInfo: {
      calories: 280,
      protein: 15,
      carbs: 35,
      fat: 12,
    },
  },
  {
    id: 'menu-demo-fresh-fruit-juice',
    name: 'Fresh Fruit Juice',
    description: 'Seasonal fresh fruit juice prepared without added sugar.',
    category: 'beverages',
    price: 25,
    featured: false,
    preparationTime: 5,
    portionSize: '250 ml',
    calories: 120,
    allergens: [],
    tags: ['drink', 'fruit'],
    nutritionalInfo: {
      calories: 120,
      protein: 2,
      carbs: 28,
      fat: 0,
    },
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const school = await prisma.school.upsert({
    where: { code: 'HASIVU-DEMO-LOCAL' },
    create: {
      id: 'school-demo-hasivu-local',
      name: 'Hasivu Demo (Local)',
      code: 'HASIVU-DEMO-LOCAL',
      address: '{}',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      isActive: true,
    },
    update: { isActive: true },
  });

  for (const u of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: {
        id: `user-${u.role}-demo-local`,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        schoolId: school.id,
        emailVerified: true,
        isActive: true,
      },
      update: {
        passwordHash,
        isActive: true,
        emailVerified: true,
        schoolId: school.id,
      },
    });
  }

  for (const item of DEMO_MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        currency: 'INR',
        available: true,
        featured: item.featured,
        preparationTime: item.preparationTime,
        portionSize: item.portionSize,
        calories: item.calories,
        nutritionalInfo: JSON.stringify(item.nutritionalInfo),
        allergens: JSON.stringify(item.allergens),
        tags: JSON.stringify(item.tags),
        schoolId: school.id,
      },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        available: true,
        featured: item.featured,
        preparationTime: item.preparationTime,
        portionSize: item.portionSize,
        calories: item.calories,
        nutritionalInfo: JSON.stringify(item.nutritionalInfo),
        allergens: JSON.stringify(item.allergens),
        tags: JSON.stringify(item.tags),
        schoolId: school.id,
      },
    });
  }

  console.log(
    `[seed-demo-local-users] Upserted ${DEMO_USERS.length} users and ${DEMO_MENU_ITEMS.length} menu items; password for all: ${DEMO_PASSWORD}`
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
