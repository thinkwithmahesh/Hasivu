/**
 * HASIVU Platform - Inventory Routes
 * Inventory management API endpoints for kitchen and procurement
 */

import express, { Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';

const router = express.Router();

function getAuthenticatedUser(
  req: AuthenticatedRequest
): NonNullable<AuthenticatedRequest['user']> {
  if (!req.user) {
    throw Object.assign(new Error('Authenticated user missing'), { statusCode: 401 });
  }
  return req.user;
}

function getSchoolId(req: AuthenticatedRequest): string {
  const requestedSchoolId = typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined;
  const schoolId = requestedSchoolId || getAuthenticatedUser(req).schoolId;

  if (!schoolId) {
    throw Object.assign(new Error('School scope missing'), { statusCode: 400 });
  }

  return schoolId;
}

/**
 * GET /api/v1/inventory/items
 * Get inventory items with optional filters
 */
router.get(
  '/items',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const items = await inventoryService.getKitchenInventory(schoolId, {
        category: req.query.category,
        status: req.query.status,
        search: req.query.search,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });

      res.json({
        success: true,
        data: items.items || [],
        pagination: {
          total: items.total || 0,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 50,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/inventory/items
 * Create a new inventory item
 */
router.post(
  '/items',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const schoolId = getSchoolId(req);
      const result = await inventoryService.updateInventory({
        ...req.body,
        schoolId,
        createdById: user.id,
        action: 'create',
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Inventory item created',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/inventory/items/:id/stock
 * Update stock for an item
 */
router.patch(
  '/items/:id/stock',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { quantity, type } = req.body;
      const itemId = req.params.id;

      if (!quantity || !type) {
        res
          .status(400)
          .json({ success: false, error: 'quantity and type (add/remove) are required' });
        return;
      }

      const effectiveQuantity = type === 'remove' ? -Math.abs(quantity) : Math.abs(quantity);
      await inventoryService.updateStock(itemId, effectiveQuantity);

      res.json({
        success: true,
        data: { itemId, newQuantity: effectiveQuantity },
        message: 'Stock updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

router.put(
  '/items/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const item = await inventoryService.updateItem(schoolId, req.params.id, req.body);

      res.json({
        success: true,
        data: item,
        message: 'Inventory item updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

router.delete(
  '/items/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      await inventoryService.deleteItem(schoolId, req.params.id);

      res.json({
        success: true,
        data: null,
        message: 'Inventory item deleted',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/inventory/suppliers
 * Get supplier list
 */
router.get(
  '/suppliers',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const suppliers = await inventoryService.getSuppliers(schoolId);
      res.json({
        success: true,
        data: suppliers,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/inventory/suppliers
 * Create a supplier
 */
router.post(
  '/suppliers',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const schoolId = getSchoolId(req);
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: 'Supplier name is required' });
        return;
      }

      const supplier = await inventoryService.createSupplier(schoolId, user.id, req.body);
      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

router.put(
  '/suppliers/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const supplier = await inventoryService.updateSupplier(schoolId, req.params.id, req.body);

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/inventory/metrics
 * Get inventory metrics summary
 */
router.get(
  '/metrics',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const inventory = await inventoryService.getKitchenInventory(schoolId);

      res.json({
        success: true,
        data: {
          totalItems: inventory.total || 0,
          totalValue: inventory.totalValue || 0,
          lowStockItems: inventory.lowStock || 0,
          outOfStockItems: 0,
          expiringSoonItems: inventory.nearExpiry || 0,
          averageStockLevel: 0,
          monthlyConsumption: 0,
          costSavings: 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/inventory/low-stock-alerts
 * Get low stock alerts
 */
router.get(
  '/low-stock-alerts',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const alerts = await inventoryService.getCriticalAlerts(schoolId);

      res.json({
        success: true,
        data: alerts,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/inventory/purchase-orders
 * Get purchase orders
 */
router.get(
  '/purchase-orders',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const result = await inventoryService.getPurchaseOrders(schoolId, req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/inventory/purchase-orders
 * Create purchase order
 */
router.post(
  '/purchase-orders',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = getAuthenticatedUser(req);
      const schoolId = getSchoolId(req);
      const { supplierId, items } = req.body;

      if (!supplierId || !items || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'supplierId and items are required',
        });
        return;
      }

      const order = await inventoryService.createPurchaseOrder(schoolId, user.id, req.body);

      logger.info('Purchase order created', { orderId: order.id, supplierId });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Purchase order created',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

router.patch(
  '/purchase-orders/:id/status',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const schoolId = getSchoolId(req);
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ success: false, error: 'status is required' });
        return;
      }

      const order = await inventoryService.updatePurchaseOrderStatus(
        schoolId,
        req.params.id,
        status
      );
      res.json({
        success: true,
        data: order,
        message: 'Purchase order status updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default router;
