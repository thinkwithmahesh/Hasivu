#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a school
  const school = await prisma.school.create({
    data: {
      id: 'school-1',
      name: 'Demo School',
      code: 'DEMO001',
      address: JSON.stringify({
        street: '123 Education Lane',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001'
      }),
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      phone: '+91-9876543210',
      email: 'admin@demoschool.edu',
      principalName: 'Dr. Smith',
      isActive: true,
    },
  })

  console.log('✅ Created school:', school.name)

  // Create test users for different roles
  const hashedPassword = await bcrypt.hash('password123', 10)

  const users = [
    {
      id: 'user-admin-1',
      email: 'admin@hasivu.com',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      schoolId: school.id,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'user-parent-1',
      email: 'parent@example.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Parent',
      role: 'parent',
      schoolId: school.id,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'user-student-1',
      email: 'student@example.com',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'student',
      schoolId: school.id,
      parentId: 'user-parent-1', // Will be created after parent
      grade: '5',
      section: 'A',
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'user-kitchen-1',
      email: 'kitchen@example.com',
      passwordHash: hashedPassword,
      firstName: 'Chef',
      lastName: 'Manager',
      role: 'kitchen',
      schoolId: school.id,
      emailVerified: true,
      isActive: true,
    },
    {
      id: 'user-vendor-1',
      email: 'vendor@example.com',
      passwordHash: hashedPassword,
      firstName: 'Vendor',
      lastName: 'Manager',
      role: 'vendor',
      schoolId: school.id,
      emailVerified: true,
      isActive: true,
    },
  ]

  // Create parent first
  const parent = await prisma.user.create({
    data: users[1], // parent
  })
  console.log('✅ Created parent user:', parent.email)

  // Create admin
  const admin = await prisma.user.create({
    data: users[0], // admin
  })
  console.log('✅ Created admin user:', admin.email)

  // Create student with parent reference
  const student = await prisma.user.create({
    data: {
      ...users[2], // student
      parentId: parent.id,
    },
  })
  console.log('✅ Created student user:', student.email)

  // Create kitchen user
  const kitchen = await prisma.user.create({
    data: users[3], // kitchen
  })
  console.log('✅ Created kitchen user:', kitchen.email)

  // Create vendor user
  const vendor = await prisma.user.create({
    data: users[4], // vendor
  })
  console.log('✅ Created vendor user:', vendor.email)

  // Create student-parent relationship
  await prisma.studentParent.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      relationship: 'parent',
      isPrimary: true,
      canOrder: true,
      canPickup: true,
      isActive: true,
    },
  })

  console.log('✅ Created student-parent relationship')

  // Create some menu items
  const menuItems = [
    {
      id: 'menu-1',
      name: 'Vegetable Biryani',
      description: 'Aromatic rice with mixed vegetables and spices',
      category: 'main_course',
      price: 85.0,
      currency: 'INR',
      available: true,
      featured: true,
      nutritionalInfo: JSON.stringify({
        calories: 350,
        protein: 12,
        carbs: 65,
        fat: 8,
      }),
      allergens: JSON.stringify(['gluten']),
      schoolId: school.id,
    },
    {
      id: 'menu-2',
      name: 'Paneer Sandwich',
      description: 'Grilled sandwich with paneer and vegetables',
      category: 'snacks',
      price: 45.0,
      currency: 'INR',
      available: true,
      featured: false,
      nutritionalInfo: JSON.stringify({
        calories: 280,
        protein: 15,
        carbs: 35,
        fat: 12,
      }),
      allergens: JSON.stringify(['dairy', 'gluten']),
      schoolId: school.id,
    },
    {
      id: 'menu-3',
      name: 'Fresh Fruit Juice',
      description: 'Seasonal fresh fruit juice',
      category: 'beverages',
      price: 25.0,
      currency: 'INR',
      available: true,
      featured: false,
      nutritionalInfo: JSON.stringify({
        calories: 120,
        protein: 2,
        carbs: 28,
        fat: 0,
      }),
      allergens: JSON.stringify([]),
      schoolId: school.id,
    },
  ]

  for (const menuItem of menuItems) {
    const created = await prisma.menuItem.create({
      data: menuItem,
    })
    console.log('✅ Created menu item:', created.name)
  }

  // Create an RFID card for the student
  await prisma.rFIDCard.create({
    data: {
      id: 'rfid-1',
      cardNumber: 'CARD001234567890',
      studentId: student.id,
      schoolId: school.id,
      isActive: true,
    },
  })

  console.log('✅ Created RFID card for student')

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      id: 'order-1',
      orderNumber: 'ORD-001',
      userId: parent.id,
      studentId: student.id,
      schoolId: school.id,
      status: 'pending',
      totalAmount: 85.0,
      currency: 'INR',
      deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      paymentStatus: 'pending',
    },
  })

  console.log('✅ Created sample order:', order.orderNumber)

  // Create order item
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      menuItemId: 'menu-1',
      quantity: 1,
      unitPrice: 85.0,
      totalPrice: 85.0,
    },
  })

  console.log('✅ Created order item')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📋 Test Credentials:')
  console.log('Admin: admin@hasivu.com / password123')
  console.log('Parent: parent@example.com / password123')
  console.log('Student: student@example.com / password123')
  console.log('Kitchen: kitchen@example.com / password123')
  console.log('Vendor: vendor@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
