import { NextRequest, NextResponse } from 'next/server';

const inventoryItems = [
  {
    id: 'inv-rice-001',
    name: 'Brown rice',
    category: 'grain',
    unit: 'kg',
    currentStock: 42,
    minStock: 15,
    status: 'in_stock',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-veg-001',
    name: 'Seasonal vegetables',
    category: 'produce',
    unit: 'kg',
    currentStock: 18,
    minStock: 20,
    status: 'low_stock',
    updatedAt: new Date().toISOString(),
  },
];

const suppliers = [
  {
    id: 'supplier-local-farm',
    name: 'Local Farm Cooperative',
    contact: '+91 90000 00001',
    email: 'orders@localfarm.example',
    status: 'active',
  },
];

const purchaseOrders = [
  {
    id: 'po-weekly-produce',
    supplierId: 'supplier-local-farm',
    items: [{ itemId: 'inv-veg-001', quantity: 25, price: 45 }],
    status: 'draft',
    totalAmount: 1125,
  },
];

function ok(data: unknown) {
  return NextResponse.json({ success: true, data });
}

function notImplemented() {
  return NextResponse.json(
    {
      success: false,
      error: 'Inventory mutations are not enabled in the launch Docker profile',
    },
    { status: 501 }
  );
}

export async function GET(_request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');

  if (path === 'items') {
    return ok(inventoryItems);
  }

  if (path === 'suppliers') {
    return ok(suppliers);
  }

  if (path === 'purchase-orders') {
    return ok(purchaseOrders);
  }

  if (path === 'metrics') {
    return ok({
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.status === 'low_stock').length,
      activeSuppliers: suppliers.length,
      openPurchaseOrders: purchaseOrders.filter(order => order.status !== 'received').length,
    });
  }

  if (path === 'low-stock-alerts') {
    return ok(
      inventoryItems
        .filter(item => item.currentStock <= item.minStock)
        .map(item => ({
          itemId: item.id,
          itemName: item.name,
          currentStock: item.currentStock,
          minStock: item.minStock,
        }))
    );
  }

  return NextResponse.json({ success: false, error: 'Inventory endpoint not found' }, { status: 404 });
}

export async function POST() {
  return notImplemented();
}

export async function PUT() {
  return notImplemented();
}

export async function PATCH() {
  return notImplemented();
}

export async function DELETE() {
  return notImplemented();
}
