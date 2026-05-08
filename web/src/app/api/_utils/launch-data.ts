import { NextResponse } from 'next/server';

export const inventoryItems = [
  {
    id: 'inv-rice-001',
    name: 'Brown rice',
    category: 'grains',
    subcategory: 'Staples',
    sku: 'RICE-BROWN-25',
    unit: 'kg',
    currentStock: 42,
    minStock: 15,
    maxStock: 100,
    supplier: {
      id: 'supplier-local-farm',
      name: 'Local Farm Cooperative',
      contact: '+91 90000 00001',
      email: 'orders@localfarm.example',
      rating: 4.7,
      reliability: 96,
      averageDeliveryTime: 2,
      totalOrders: 18,
    },
    lastUpdated: new Date().toISOString(),
    costPerUnit: 65,
    totalValue: 2730,
    status: 'in_stock',
    location: 'Dry Store A',
    usageRate: 8,
    daysUntilEmpty: 5,
    reorderPoint: 25,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-veg-001',
    name: 'Seasonal vegetables',
    category: 'vegetables',
    subcategory: 'Fresh produce',
    sku: 'VEG-SEASONAL-01',
    unit: 'kg',
    currentStock: 18,
    minStock: 20,
    maxStock: 60,
    supplier: {
      id: 'supplier-local-farm',
      name: 'Local Farm Cooperative',
      contact: '+91 90000 00001',
      email: 'orders@localfarm.example',
      rating: 4.7,
      reliability: 96,
      averageDeliveryTime: 2,
      totalOrders: 18,
    },
    lastUpdated: new Date().toISOString(),
    costPerUnit: 45,
    totalValue: 810,
    status: 'low_stock',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Cold Store B',
    usageRate: 10,
    daysUntilEmpty: 2,
    reorderPoint: 25,
    updatedAt: new Date().toISOString(),
  },
];

export const suppliers = [
  {
    id: 'supplier-local-farm',
    name: 'Local Farm Cooperative',
    contact: '+91 90000 00001',
    email: 'orders@localfarm.example',
    status: 'active',
    rating: 4.7,
    reliability: 96,
    averageDeliveryTime: 2,
    totalOrders: 18,
  },
];

export const purchaseOrders = [
  {
    id: 'po-weekly-produce',
    orderNumber: 'PO-2026-001',
    supplier: suppliers[0],
    supplierId: 'supplier-local-farm',
    items: [
      {
        itemId: 'inv-veg-001',
        itemName: 'Seasonal vegetables',
        quantity: 25,
        unitPrice: 45,
        totalPrice: 1125,
      },
    ],
    status: 'sent',
    orderDate: new Date().toISOString(),
    expectedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    totalAmount: 1125,
    notes: 'Weekly replenishment for lunch service',
    createdBy: 'Demo Kitchen',
  },
];

const today = new Date().toISOString().slice(0, 10);

export const staffMembers = [
  {
    id: 'staff-kitchen-demo',
    firstName: 'Demo',
    lastName: 'Kitchen',
    name: 'Demo Kitchen',
    role: 'kitchen_staff',
    department: 'kitchen',
    status: 'active',
    email: 'kitchen.demo@hasivu.local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const schedules = [
  {
    id: 'schedule-kitchen-demo-today',
    staffId: 'staff-kitchen-demo',
    date: today,
    startTime: '08:00',
    endTime: '15:00',
    status: 'scheduled',
    shiftId: 'lunch-service',
    notes: 'Lunch service and delivery confirmation coverage',
  },
];

export const kitchenOrders = [
  {
    id: 'kitchen-order-12342',
    orderNumber: '#12342',
    studentName: 'Arjun Patel',
    studentId: 'STU-002',
    schoolId: 'school-demo-hasivu-local',
    items: [
      {
        id: 'item-biryani',
        name: 'Chicken Biryani',
        quantity: 1,
        category: 'Main',
        allergens: [],
        preparationTime: 25,
      },
      {
        id: 'item-raita',
        name: 'Raita',
        quantity: 1,
        category: 'Side',
        allergens: ['dairy'],
        preparationTime: 5,
      },
    ],
    status: 'pending',
    priority: 'medium',
    orderTime: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    estimatedTime: 30,
    location: 'South Wing',
    totalAmount: 180,
    paymentStatus: 'paid',
    deliveryDate: new Date().toISOString(),
  },
  {
    id: 'kitchen-order-12343',
    orderNumber: '#12343',
    studentName: 'Meera Singh',
    studentId: 'STU-003',
    schoolId: 'school-demo-hasivu-local',
    items: [
      {
        id: 'item-pulao',
        name: 'Vegetable Pulao',
        quantity: 1,
        category: 'Main',
        allergens: [],
        preparationTime: 20,
      },
    ],
    status: 'ready',
    priority: 'low',
    orderTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    estimatedTime: 20,
    actualTime: 18,
    assignedStaff: 'Demo Kitchen',
    assignedStaffId: 'staff-kitchen-demo',
    location: 'Main Cafeteria',
    totalAmount: 95,
    paymentStatus: 'paid',
    deliveryDate: new Date().toISOString(),
  },
];

export function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

export function inventoryMetrics() {
  return {
    totalItems: inventoryItems.length,
    totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
    lowStockItems: inventoryItems.filter(item => item.status === 'low_stock').length,
    expiringSoonItems: inventoryItems.filter(item => item.expiryDate).length,
    outOfStockItems: inventoryItems.filter(item => item.status === 'out_of_stock').length,
    averageStockLevel: 72,
    monthlyConsumption: 45680,
    costSavings: 1240,
    activeSuppliers: suppliers.length,
    openPurchaseOrders: purchaseOrders.filter(order => order.status !== 'received').length,
  };
}

export function staffMetrics() {
  return {
    totalStaff: staffMembers.length,
    activeStaff: staffMembers.filter(member => member.status === 'active').length,
    scheduledToday: schedules.filter(schedule => schedule.date === today).length,
  };
}

export function kitchenMetrics() {
  return {
    ordersInProgress: kitchenOrders.filter(order =>
      ['pending', 'preparing', 'ready'].includes(order.status)
    ).length,
    averagePreparationTime: 18.5,
    completionRate: 94.2,
    staffEfficiency: 88.3,
    dailyRevenue: kitchenOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    customerSatisfaction: 4.6,
    lowStockItems: inventoryMetrics().lowStockItems,
    activeStaff: staffMetrics().activeStaff,
  };
}
