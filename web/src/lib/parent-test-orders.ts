import type { Cart } from '@/types/cart';
import type { Order } from '@/types/order';

const TEST_ORDERS_STORAGE_KEY = 'hasivu_parent_test_orders';

function safeParseOrders(value: string | null): Order[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getParentTestOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  return safeParseOrders(window.localStorage.getItem(TEST_ORDERS_STORAGE_KEY));
}

export function getParentTestOrder(orderId: string): Order | null {
  return getParentTestOrders().find(order => order.id === orderId) ?? null;
}

export function createParentTestOrder(orderId: string, cart: Cart): Order {
  const now = new Date();
  const deliveryDate = cart.items[0]?.deliveryDate ?? now;

  return {
    id: orderId,
    orderNumber: orderId.replace(/^test-order-/, 'QA-'),
    studentId: 'student_1',
    student: {
      id: 'student_1',
      firstName: 'Emma',
      lastName: 'Doe',
      grade: '5',
      section: 'A',
      schoolId: 'school_1',
    },
    school: {
      id: 'school_1',
      name: process.env.NEXT_PUBLIC_SCHOOL_DISPLAY_NAME || 'HASIVU School',
    },
    deliveryDate:
      deliveryDate instanceof Date ? deliveryDate.toISOString() : new Date(deliveryDate).toISOString(),
    status: 'confirmed',
    paymentStatus: 'completed',
    subtotal: cart.subtotal,
    tax: cart.tax,
    deliveryFee: cart.deliveryFee,
    discount: cart.discount,
    totalAmount: cart.total,
    orderItems: cart.items.map(item => ({
      id: `item-${item.id}`,
      orderId,
      menuItemId: item.menuItemId,
      menuItem: item.menuItem,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specialInstructions: item.specialInstructions,
      customizations: item.customizations,
      status: 'confirmed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })),
    deliveryInstructions: 'Parent QA checkout order',
    contactPhone: '+91 9876543210',
    allergyInfo: cart.items.find(item => item.allergyInfo)?.allergyInfo,
    statusHistory: [
      {
        id: `status-${orderId}`,
        orderId,
        status: 'confirmed',
        notes: 'Order confirmed through the local QA checkout flow',
        updatedBy: 'parent',
        timestamp: now.toISOString(),
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function saveParentTestOrder(order: Order): void {
  if (typeof window === 'undefined') return;

  const existing = getParentTestOrders();
  const withoutDuplicate = existing.filter(item => item.id !== order.id);
  window.localStorage.setItem(
    TEST_ORDERS_STORAGE_KEY,
    JSON.stringify([order, ...withoutDuplicate].slice(0, 20))
  );
}
