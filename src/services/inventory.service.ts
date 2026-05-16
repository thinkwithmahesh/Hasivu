/**
 * Inventory Service
 * Database-backed school inventory, supplier, purchase order, and reservation operations.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

type InventoryFilters = {
  category?: unknown;
  status?: unknown;
  search?: unknown;
  page?: number;
  limit?: number;
};

type OrderLineInput = {
  menuItemId?: string;
  itemId?: string;
  inventoryItemId?: string;
  quantity?: number;
};

type PurchaseOrderLineInput = {
  itemId?: string;
  inventoryItemId?: string;
  name?: string;
  quantity: number;
  unit?: string;
  price?: number;
  unitPrice?: number;
};

function decimal(value: unknown, fallback = 0): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  const numeric = typeof value === 'number' || typeof value === 'string' ? value : fallback;
  return new Prisma.Decimal(numeric || fallback);
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return value instanceof Prisma.Decimal ? value.toNumber() : value;
}

function stockStatus(quantity: Prisma.Decimal, minStock: Prisma.Decimal): string {
  if (quantity.lessThanOrEqualTo(0)) return 'out_of_stock';
  if (quantity.lessThanOrEqualTo(minStock)) return 'low_stock';
  return 'active';
}

function parseString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class InventoryService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('InventoryService initialized');
  }

  async getInventory(): Promise<any[]> {
    const result = await this.getKitchenInventory('');
    return result.items;
  }

  async getKitchenInventory(schoolId: string, options: InventoryFilters = {}): Promise<any> {
    if (!schoolId) {
      return { items: [], total: 0, lowStock: 0, nearExpiry: 0, totalValue: 0, alerts: [] };
    }

    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const search = parseString(options.search);
    const category = parseString(options.category);
    const requestedStatus = parseString(options.status);

    const where: Prisma.InventoryItemWhereInput = {
      schoolId,
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(requestedStatus && requestedStatus !== 'all' ? { status: requestedStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total, allItems] = await Promise.all([
      this.db.inventoryItem.findMany({
        where,
        include: { supplier: true },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.inventoryItem.count({ where }),
      this.db.inventoryItem.findMany({
        where: { schoolId, deletedAt: null },
        select: {
          quantity: true,
          minStock: true,
          price: true,
          expiryDate: true,
          status: true,
          name: true,
        },
      }),
    ]);

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const lowStock = allItems.filter(item => item.quantity.lessThanOrEqualTo(item.minStock)).length;
    const nearExpiry = allItems.filter(
      item => item.expiryDate && item.expiryDate.getTime() - now <= sevenDays
    ).length;
    const totalValue = allItems.reduce(
      (sum, item) => sum + item.quantity.mul(item.price).toNumber(),
      0
    );

    return {
      items: items.map(item => this.toInventoryDto(item)),
      total,
      lowStock,
      nearExpiry,
      totalValue,
      alerts: this.buildAlerts(allItems),
    };
  }

  async updateInventory(data: any): Promise<any> {
    const schoolId = parseString(data.schoolId);
    if (!schoolId) throw Object.assign(new Error('schoolId is required'), { statusCode: 400 });

    if (data.action === 'create' || !data.id) {
      const quantity = decimal(data.quantity);
      const minStock = decimal(data.minStock);
      const created = await this.db.inventoryItem.create({
        data: {
          schoolId,
          menuItemId: parseString(data.menuItemId),
          supplierId: parseString(data.supplierId),
          name: parseString(data.name) || 'Unnamed inventory item',
          sku: parseString(data.sku),
          category: parseString(data.category) || 'general',
          description: parseString(data.description),
          quantity,
          unit: parseString(data.unit) || 'unit',
          minStock,
          maxStock: data.maxStock == null ? undefined : decimal(data.maxStock),
          reorderPoint: data.reorderPoint == null ? undefined : decimal(data.reorderPoint),
          price: decimal(data.price),
          location: parseString(data.location),
          batchNumber: parseString(data.batchNumber),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          status: stockStatus(quantity, minStock),
          createdById: parseString(data.createdById),
          metadata: data.metadata || undefined,
        },
        include: { supplier: true },
      });
      return this.toInventoryDto(created);
    }

    const existing = await this.db.inventoryItem.findFirstOrThrow({
      where: { id: data.id, schoolId, deletedAt: null },
    });
    const nextQuantity = data.quantity == null ? existing.quantity : decimal(data.quantity);
    const nextMinStock = data.minStock == null ? existing.minStock : decimal(data.minStock);

    const updated = await this.db.inventoryItem.update({
      where: { id: existing.id },
      data: {
        menuItemId: parseString(data.menuItemId) ?? existing.menuItemId,
        supplierId: parseString(data.supplierId) ?? existing.supplierId,
        name: parseString(data.name) ?? existing.name,
        sku: parseString(data.sku) ?? existing.sku,
        category: parseString(data.category) ?? existing.category,
        description: parseString(data.description) ?? existing.description,
        quantity: nextQuantity,
        unit: parseString(data.unit) ?? existing.unit,
        minStock: nextMinStock,
        maxStock: data.maxStock == null ? existing.maxStock : decimal(data.maxStock),
        reorderPoint:
          data.reorderPoint == null ? existing.reorderPoint : decimal(data.reorderPoint),
        price: data.price == null ? existing.price : decimal(data.price),
        location: parseString(data.location) ?? existing.location,
        batchNumber: parseString(data.batchNumber) ?? existing.batchNumber,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : existing.expiryDate,
        status: stockStatus(nextQuantity, nextMinStock),
        metadata: data.metadata || existing.metadata,
      },
      include: { supplier: true },
    });

    return this.toInventoryDto(updated);
  }

  async updateStock(itemId: string, quantityDelta: number): Promise<void> {
    const item = await this.db.inventoryItem.findFirstOrThrow({
      where: { id: itemId, deletedAt: null },
    });
    const nextQuantity = item.quantity.plus(quantityDelta);
    if (nextQuantity.lessThan(0)) {
      throw Object.assign(new Error('Stock cannot be negative'), { statusCode: 400 });
    }
    await this.db.inventoryItem.update({
      where: { id: itemId },
      data: {
        quantity: nextQuantity,
        status: stockStatus(nextQuantity, item.minStock),
      },
    });
  }

  async checkLowStock(): Promise<any[]> {
    const items = await this.db.inventoryItem.findMany({
      where: { deletedAt: null, status: { in: ['low_stock', 'out_of_stock'] } },
      include: { supplier: true },
    });
    return items.map(item => this.toInventoryDto(item));
  }

  async getCriticalAlerts(schoolId: string): Promise<any> {
    const inventory = await this.getKitchenInventory(schoolId);
    const critical = inventory.items.filter((item: any) => item.status === 'out_of_stock');
    const low = inventory.items.filter((item: any) => item.status === 'low_stock');
    const nearExpiry = inventory.alerts.filter((alert: any) => alert.type === 'expiry');
    return { critical, low, nearExpiry, total: critical.length + low.length + nearExpiry.length };
  }

  async checkIngredientAvailability(
    items: OrderLineInput[] | undefined
  ): Promise<{ allAvailable: boolean }> {
    if (!items?.length) return { allAvailable: true };
    const itemIds = items
      .map(item => item.inventoryItemId || item.itemId)
      .filter(Boolean) as string[];
    if (!itemIds.length) return { allAvailable: true };

    const inventory = await this.db.inventoryItem.findMany({
      where: { id: { in: itemIds }, deletedAt: null },
    });

    const available = items.every(item => {
      const inventoryItem = inventory.find(
        current => current.id === (item.inventoryItemId || item.itemId)
      );
      return (
        !inventoryItem ||
        inventoryItem.quantity.minus(inventoryItem.reservedQuantity).gte(item.quantity || 1)
      );
    });
    return { allAvailable: available };
  }

  async reserveIngredients(orderId: string): Promise<void> {
    await this.confirmReservation(orderId);
  }

  async checkAvailability(
    items: OrderLineInput[] | undefined,
    schoolId: string,
    _deliveryDate: string
  ): Promise<any> {
    if (!items?.length) return { isAvailable: true, unavailableItems: [] };

    const menuItemIds = items.map(item => item.menuItemId).filter(Boolean) as string[];
    const inventoryItemIds = items
      .map(item => item.inventoryItemId || item.itemId)
      .filter(Boolean) as string[];

    const inventory = await this.db.inventoryItem.findMany({
      where: {
        schoolId,
        deletedAt: null,
        OR: [
          ...(menuItemIds.length ? [{ menuItemId: { in: menuItemIds } }] : []),
          ...(inventoryItemIds.length ? [{ id: { in: inventoryItemIds } }] : []),
        ],
      },
    });

    const unavailableItems: string[] = [];
    for (const item of items) {
      const inventoryItem = inventory.find(
        current =>
          current.id === (item.inventoryItemId || item.itemId) ||
          (item.menuItemId && current.menuItemId === item.menuItemId)
      );
      if (!inventoryItem) continue;
      const requested = decimal(item.quantity || 1);
      if (inventoryItem.quantity.minus(inventoryItem.reservedQuantity).lt(requested)) {
        unavailableItems.push(inventoryItem.name);
      }
    }

    return { isAvailable: unavailableItems.length === 0, unavailableItems };
  }

  async reserveItems(items: OrderLineInput[] | undefined, options: any): Promise<void> {
    if (!items?.length || !options?.orderId) return;

    const order = await this.db.order.findUnique({ where: { id: options.orderId } });
    if (!order) return;

    await this.db.$transaction(async tx => {
      for (const item of items) {
        const requested = decimal(item.quantity || 1);
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            schoolId: order.schoolId,
            deletedAt: null,
            OR: [
              ...(item.inventoryItemId || item.itemId
                ? [{ id: item.inventoryItemId || item.itemId }]
                : []),
              ...(item.menuItemId ? [{ menuItemId: item.menuItemId }] : []),
            ],
          },
        });
        if (!inventoryItem) continue;

        const available = inventoryItem.quantity.minus(inventoryItem.reservedQuantity);
        if (available.lt(requested)) {
          throw Object.assign(new Error(`Insufficient inventory for ${inventoryItem.name}`), {
            statusCode: 400,
          });
        }

        await tx.inventoryReservation.upsert({
          where: {
            orderId_inventoryItemId: {
              orderId: options.orderId,
              inventoryItemId: inventoryItem.id,
            },
          },
          update: {
            quantity: requested,
            status: 'reserved',
            expiresAt: options.expiresAt,
            releasedAt: null,
          },
          create: {
            schoolId: order.schoolId,
            orderId: options.orderId,
            inventoryItemId: inventoryItem.id,
            quantity: requested,
            expiresAt: options.expiresAt,
          },
        });

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { reservedQuantity: inventoryItem.reservedQuantity.plus(requested) },
        });
      }
    });
  }

  async confirmReservation(orderId: string): Promise<void> {
    await this.db.$transaction(async tx => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'reserved' },
        include: { inventoryItem: true },
      });

      for (const reservation of reservations) {
        const nextQuantity = reservation.inventoryItem.quantity.minus(reservation.quantity);
        const nextReserved = reservation.inventoryItem.reservedQuantity.minus(reservation.quantity);
        if (nextQuantity.lt(0)) {
          throw Object.assign(
            new Error(`Insufficient inventory for ${reservation.inventoryItem.name}`),
            {
              statusCode: 400,
            }
          );
        }
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: {
            quantity: nextQuantity,
            reservedQuantity: nextReserved.lessThan(0) ? 0 : nextReserved,
            status: stockStatus(nextQuantity, reservation.inventoryItem.minStock),
          },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'confirmed', confirmedAt: new Date() },
        });
      }
    });
  }

  async releaseReservation(orderId: string): Promise<void> {
    await this.db.$transaction(async tx => {
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId, status: 'reserved' },
        include: { inventoryItem: true },
      });

      for (const reservation of reservations) {
        const nextReserved = reservation.inventoryItem.reservedQuantity.minus(reservation.quantity);
        await tx.inventoryItem.update({
          where: { id: reservation.inventoryItemId },
          data: { reservedQuantity: nextReserved.lessThan(0) ? 0 : nextReserved },
        });
        await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: { status: 'released', releasedAt: new Date() },
        });
      }
    });
  }

  async updateReservation(orderId: string, items: OrderLineInput[] | undefined): Promise<void> {
    await this.releaseReservation(orderId);
    await this.reserveItems(items, { orderId, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
  }

  async getSuppliers(schoolId: string): Promise<any[]> {
    const suppliers = await this.db.inventorySupplier.findMany({
      where: { schoolId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact || supplier.phone || '',
      email: supplier.email,
      phone: supplier.phone,
      status: supplier.status,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    }));
  }

  async createSupplier(schoolId: string, userId: string | undefined, data: any): Promise<any> {
    const supplier = await this.db.inventorySupplier.create({
      data: {
        schoolId,
        name: parseString(data.name) || '',
        contact: parseString(data.contact),
        email: parseString(data.email),
        phone: parseString(data.phone),
        address: parseString(data.address),
        taxId: parseString(data.taxId),
        status: parseString(data.status) || 'active',
        createdById: userId,
        metadata: data.metadata || undefined,
      },
    });
    return supplier;
  }

  async updateSupplier(schoolId: string, supplierId: string, data: any): Promise<any> {
    const existing = await this.db.inventorySupplier.findFirstOrThrow({
      where: { id: supplierId, schoolId, deletedAt: null },
    });
    return this.db.inventorySupplier.update({
      where: { id: existing.id },
      data: {
        name: parseString(data.name) ?? existing.name,
        contact: parseString(data.contact) ?? existing.contact,
        email: parseString(data.email) ?? existing.email,
        phone: parseString(data.phone) ?? existing.phone,
        address: parseString(data.address) ?? existing.address,
        taxId: parseString(data.taxId) ?? existing.taxId,
        status: parseString(data.status) ?? existing.status,
        metadata: data.metadata || existing.metadata,
      },
    });
  }

  async updateItem(schoolId: string, itemId: string, data: any): Promise<any> {
    return this.updateInventory({ ...data, id: itemId, schoolId });
  }

  async deleteItem(schoolId: string, itemId: string): Promise<void> {
    const existing = await this.db.inventoryItem.findFirstOrThrow({
      where: { id: itemId, schoolId, deletedAt: null },
    });
    await this.db.inventoryItem.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
  }

  async getPurchaseOrders(schoolId: string, filters: any = {}): Promise<any> {
    const where: Prisma.InventoryPurchaseOrderWhereInput = {
      schoolId,
      deletedAt: null,
      ...(parseString(filters.status) ? { status: parseString(filters.status) } : {}),
      ...(parseString(filters.supplierId) ? { supplierId: parseString(filters.supplierId) } : {}),
    };
    const [orders, total] = await Promise.all([
      this.db.inventoryPurchaseOrder.findMany({
        where,
        include: { supplier: true, items: true },
        orderBy: { orderDate: 'desc' },
        take: Math.min(parseInt(filters.limit, 10) || 50, 100),
        skip: ((parseInt(filters.page, 10) || 1) - 1) * (parseInt(filters.limit, 10) || 50),
      }),
      this.db.inventoryPurchaseOrder.count({ where }),
    ]);
    return {
      data: orders.map(order => this.toPurchaseOrderDto(order)),
      pagination: {
        total,
        page: parseInt(filters.page, 10) || 1,
        limit: parseInt(filters.limit, 10) || 50,
      },
    };
  }

  async createPurchaseOrder(schoolId: string, userId: string | undefined, data: any): Promise<any> {
    const supplier = await this.db.inventorySupplier.findFirst({
      where: { id: data.supplierId, schoolId, deletedAt: null },
    });
    if (!supplier) {
      throw Object.assign(new Error('Supplier not found'), { statusCode: 404 });
    }

    const lines = (data.items || []) as PurchaseOrderLineInput[];
    const total = lines.reduce(
      (sum, item) => sum.plus(decimal(item.price ?? item.unitPrice).mul(decimal(item.quantity))),
      new Prisma.Decimal(0)
    );
    const orderNumber = await this.nextPurchaseOrderNumber(schoolId);

    const order = await this.db.inventoryPurchaseOrder.create({
      data: {
        schoolId,
        supplierId: supplier.id,
        orderNumber,
        status: parseString(data.status) || 'draft',
        expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
        totalAmount: total,
        notes: parseString(data.notes),
        createdById: userId,
        metadata: data.metadata || undefined,
        items: {
          create: lines.map(item => {
            const quantity = decimal(item.quantity);
            const unitPrice = decimal(item.price ?? item.unitPrice);
            return {
              inventoryItemId: item.inventoryItemId || item.itemId,
              name: parseString(item.name) || 'Purchase item',
              quantity,
              unit: parseString(item.unit) || 'unit',
              unitPrice,
              totalPrice: quantity.mul(unitPrice),
            };
          }),
        },
      },
      include: { supplier: true, items: true },
    });

    return this.toPurchaseOrderDto(order);
  }

  async updatePurchaseOrderStatus(schoolId: string, orderId: string, status: string): Promise<any> {
    const existing = await this.db.inventoryPurchaseOrder.findFirstOrThrow({
      where: { id: orderId, schoolId, deletedAt: null },
      include: { items: true },
    });

    const updated = await this.db.inventoryPurchaseOrder.update({
      where: { id: existing.id },
      data: {
        status,
        receivedAt:
          status === 'received' || status === 'completed' ? new Date() : existing.receivedAt,
      },
      include: { supplier: true, items: true },
    });

    if (status === 'received' || status === 'completed') {
      await this.receivePurchaseOrderItems(updated.id);
    }

    return this.toPurchaseOrderDto(updated);
  }

  private async receivePurchaseOrderItems(purchaseOrderId: string): Promise<void> {
    const order = await this.db.inventoryPurchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });
    if (!order) return;

    await this.db.$transaction(async tx => {
      for (const line of order.items) {
        if (!line.inventoryItemId) continue;
        const item = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
        if (!item) continue;
        const nextQuantity = item.quantity.plus(line.quantity);
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: nextQuantity,
            price: line.unitPrice,
            status: stockStatus(nextQuantity, item.minStock),
          },
        });
      }
    });
  }

  private async nextPurchaseOrderNumber(schoolId: string): Promise<string> {
    const count = await this.db.inventoryPurchaseOrder.count({ where: { schoolId } });
    return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }

  private buildAlerts(
    items: Array<{
      name: string;
      quantity: Prisma.Decimal;
      minStock: Prisma.Decimal;
      expiryDate: Date | null;
    }>
  ): any[] {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return items.flatMap(item => {
      const alerts = [];
      if (item.quantity.lessThanOrEqualTo(item.minStock)) {
        alerts.push({
          type: 'stock',
          severity: item.quantity.lte(0) ? 'critical' : 'warning',
          item: item.name,
        });
      }
      if (item.expiryDate && item.expiryDate.getTime() - now <= sevenDays) {
        alerts.push({
          type: 'expiry',
          severity: 'warning',
          item: item.name,
          expiryDate: item.expiryDate,
        });
      }
      return alerts;
    });
  }

  private toInventoryDto(item: any): any {
    const quantity = decimal(item.quantity);
    const minStock = decimal(item.minStock);
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      description: item.description,
      quantity: toNumber(quantity),
      reservedQuantity: toNumber(item.reservedQuantity),
      availableQuantity: toNumber(quantity.minus(decimal(item.reservedQuantity))),
      unit: item.unit,
      minStock: toNumber(minStock),
      maxStock: toNumber(item.maxStock),
      reorderPoint: toNumber(item.reorderPoint),
      price: toNumber(item.price),
      currency: item.currency,
      supplierId: item.supplierId,
      supplier: item.supplier?.name,
      location: item.location,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate?.toISOString(),
      status: item.status || stockStatus(quantity, minStock),
      createdAt: item.createdAt?.toISOString?.() || item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() || item.updatedAt,
    };
  }

  private toPurchaseOrderDto(order: any): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplier: order.supplier?.name,
      items: order.items.map((item: any) => ({
        id: item.id,
        itemId: item.inventoryItemId,
        name: item.name,
        quantity: toNumber(item.quantity),
        unit: item.unit,
        price: toNumber(item.unitPrice),
        totalPrice: toNumber(item.totalPrice),
      })),
      status: order.status,
      orderDate: order.orderDate.toISOString(),
      expectedDelivery: order.expectedDelivery?.toISOString(),
      totalAmount: toNumber(order.totalAmount),
      createdBy: order.createdById,
    };
  }
}

const inventoryServiceInstance = new InventoryService();
export const inventoryService = inventoryServiceInstance;
export const _inventoryService = inventoryServiceInstance;
export default inventoryServiceInstance;
