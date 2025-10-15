#!/usr/bin/env tsx
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const school = await prisma.school.create({
        data: {
            id: 'school-1',
            name: 'Demo School',
            code: 'DEMO001',
            address: JSON.stringify({
                street: '123 Education Lane',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
            }),
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            phone: '+91-9876543210',
            email: 'admin@demoschool.edu',
            principalName: 'Dr. Smith',
            isActive: true,
        },
    });
    const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
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
            parentId: 'user-parent-1',
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
    ];
    const parent = await prisma.user.create({
        data: users[1],
    });
    const admin = await prisma.user.create({
        data: users[0],
    });
    const student = await prisma.user.create({
        data: {
            ...users[2],
            parentId: parent.id,
        },
    });
    const kitchen = await prisma.user.create({
        data: users[3],
    });
    const vendor = await prisma.user.create({
        data: users[4],
    });
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
    });
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
    ];
    for (const menuItem of menuItems) {
        const created = await prisma.menuItem.create({
            data: menuItem,
        });
    }
    await prisma.rFIDCard.create({
        data: {
            id: 'rfid-1',
            cardNumber: 'CARD001234567890',
            studentId: student.id,
            schoolId: school.id,
            isActive: true,
        },
    });
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
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            paymentStatus: 'pending',
        },
    });
    await prisma.orderItem.create({
        data: {
            orderId: order.id,
            menuItemId: 'menu-1',
            quantity: 1,
            unitPrice: 85.0,
            totalPrice: 85.0,
        },
    });
}
main()
    .catch(e => {
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map