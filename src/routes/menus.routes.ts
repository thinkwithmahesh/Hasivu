/**
 * Menu Management API Routes
 * Comprehensive menu and menu item management endpoints
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import {
  APIRequest,
  APIResponse,
  validateRequest,
  paginationMiddleware,
  createRateLimiter,
} from '../middleware/api.middleware';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { MenuService } from '../services/menu.service';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const router = express.Router();

// Create service instances
const menuService = MenuService.getInstance();
const auditService = new AuditService();
const cacheService = new CacheService();

// Rate limiters
const readRateLimit = createRateLimiter({ requests: 150, windowMs: 60000 });
const writeRateLimit = createRateLimiter({ requests: 30, windowMs: 60000 });

// Validation Schemas
const createMenuItemSchema = z.object({
  schoolId: z.string().uuid('Invalid school ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be non-negative').max(10000, 'Price too high'),
  category: z.string().min(1, 'Category is required').max(50),
  imageUrl: z.string().url().optional(),
  nutritionalInfo: z
    .object({
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0),
      sodium: z.number().min(0),
    })
    .optional(),
  allergens: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  preparationTime: z.number().min(0).max(120).optional(), // minutes
  available: z.boolean().default(true),
  maxDailyQuantity: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).max(10000).optional(),
  category: z.string().min(1).max(50).optional(),
  imageUrl: z.string().url().optional(),
  nutritionalInfo: z
    .object({
      calories: z.number().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      fiber: z.number().min(0),
      sodium: z.number().min(0),
    })
    .optional(),
  allergens: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  preparationTime: z.number().min(0).max(120).optional(),
  available: z.boolean().optional(),
  maxDailyQuantity: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

const menuItemQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  schoolId: z.string().uuid().optional(),
  category: z.string().optional(),
  available: z
    .string()
    .regex(/^(true|false)$/)
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'category', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  minPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  dietaryRestrictions: z.string().optional(), // comma-separated
  allergens: z.string().optional(), // comma-separated
});

const menuItemParamsSchema = z.object({
  id: z.string().uuid('Invalid menu item ID'),
});

const bulkUpdateSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      updates: updateMenuItemSchema,
    })
  ),
});

const createMenuPlanSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
  mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
});

const addMenuSlotSchema = z.object({
  menuItemId: z.string().uuid(),
  date: z.string().datetime(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  quantity: z.number().min(1),
  price: z.number().min(0),
  isAvailable: z.boolean().default(true),
});

/**
 * GET /api/v1/menus/items
 * List menu items with comprehensive filtering
 */
router.get(
  '/items',
  readRateLimit,
  authMiddleware,
  paginationMiddleware,
  validateRequest({ query: menuItemQuerySchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const currentUser = req.user!;
      const {
        schoolId,
        category,
        available,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        minPrice,
        maxPrice,
        dietaryRestrictions,
        allergens,
      } = req.query as any;

      const { page, limit, offset } = req.pagination!;

      // Build cache key
      const cacheKey = `menu_items:list:${JSON.stringify({
        ...req.query,
        page,
        limit,
        userId: currentUser.id,
        userRole: currentUser.role,
      })}`;

      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Menu items served from cache', { requestId: req.requestId });
        res.json(cached);
        return;
      }

      // Build filters based on user role
      const filters: any = {};

      // Role-based access control
      switch (currentUser.role) {
        case 'student':
        case 'parent':
          // Can only see items from their school
          filters.schoolId = currentUser.schoolId;
          filters.available = true; // Only show available items
          break;
        case 'teacher':
        case 'school_admin':
        case 'kitchen_staff':
          filters.schoolId = currentUser.schoolId;
          break;
        // Admin can see all
      }

      // Apply user-provided filters
      if (schoolId && ['admin'].includes(currentUser.role)) {
        filters.schoolId = schoolId;
      }
      if (category) filters.category = category;
      if (available !== undefined) {
        filters.available = available === 'true';
      }
      if (search) filters.search = search;
      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
      }
      if (dietaryRestrictions) {
        filters.dietaryRestrictions = dietaryRestrictions.split(',');
      }
      if (allergens) {
        filters.allergens = allergens.split(',');
      }

      const result = await menuService.getMenuItems(filters);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to fetch menu items', 500);
      }

      // Apply sorting (client-side for now - could be optimized with database sorting)
      const items = result.data || [];
      items.sort((a: any, b: any) => {
        let aVal: any, bVal: any;

        switch (sortBy) {
          case 'price':
            aVal = a.price;
            bVal = b.price;
            break;
          case 'category':
            aVal = a.category;
            bVal = b.category;
            break;
          case 'createdAt':
            aVal = new Date(a.createdAt);
            bVal = new Date(b.createdAt);
            break;
          default: // name
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        }

        if (sortOrder === 'desc') {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });

      // Apply pagination
      const totalItems = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      const response = {
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages: Math.ceil(totalItems / limit),
          hasNext: page < Math.ceil(totalItems / limit),
          hasPrev: page > 1,
        },
        requestId: req.requestId,
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, response, { ttl: 300 });

      res.json(response);
    } catch (error: unknown) {
      logger.error('Failed to list menu items', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
        query: req.query,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/menus/items/:id
 * Get detailed menu item information
 */
router.get(
  '/items/:id',
  readRateLimit,
  authMiddleware,
  validateRequest({ params: menuItemParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      const result = await menuService.getMenuItem(id);

      if (!result.success) {
        if (result.error?.code === 'ITEM_NOT_FOUND') {
          throw new AppError('Menu item not found', 404);
        }
        throw new AppError(result.error?.message || 'Failed to fetch menu item', 500);
      }

      const item = result.data!;

      // Check access permissions
      if (!['admin'].includes(currentUser.role) && item.schoolId !== currentUser.schoolId) {
        throw new AppError('You do not have permission to view this menu item', 403);
      }

      // Audit log
      await auditService.log(currentUser.id, 'menus.view_item', {
        itemId: id,
        itemName: item.name,
        requestId: req.requestId,
      });

      res.json({
        data: item,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get menu item', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        itemId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/menus/items
 * Create new menu item
 */
router.post(
  '/items',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ body: createMenuItemSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const itemData = req.body;
      const currentUser = req.user!;

      // Check permissions
      if (currentUser.role === 'school_admin' && itemData.schoolId !== currentUser.schoolId) {
        throw new AppError('You can only create menu items for your school', 403);
      }

      const result = await menuService.createMenuItem(itemData);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to create menu item', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('menu_items:*');

      // Audit log
      await auditService.log(currentUser.id, 'menus.create_item', {
        itemId: result.data!.id,
        itemName: itemData.name,
        schoolId: itemData.schoolId,
        requestId: req.requestId,
      });

      logger.info('Menu item created successfully', {
        itemId: result.data!.id,
        itemName: itemData.name,
        schoolId: itemData.schoolId,
        createdBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: result.data,
        message: 'Menu item created successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to create menu item', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        itemData: { ...req.body, description: undefined },
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * PUT /api/v1/menus/items/:id
 * Update menu item
 */
router.put(
  '/items/:id',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({
    params: menuItemParamsSchema,
    body: updateMenuItemSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const currentUser = req.user!;

      // Check if item exists and user has permission
      const existingResult = await menuService.getMenuItem(id);
      if (!existingResult.success) {
        throw new AppError('Menu item not found', 404);
      }

      const existingItem = existingResult.data!;
      if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
        throw new AppError('You can only update menu items from your school', 403);
      }

      const result = await menuService.updateMenuItem({ id, ...updateData });

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to update menu item', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('menu_items:*');
      await cacheService.invalidatePattern(`menu_item:${id}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'menus.update_item', {
        itemId: id,
        changes: Object.keys(updateData),
        previousName: existingItem.name,
        newName: updateData.name || existingItem.name,
        requestId: req.requestId,
      });

      logger.info('Menu item updated successfully', {
        itemId: id,
        changes: Object.keys(updateData),
        updatedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: result.data,
        message: 'Menu item updated successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to update menu item', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        itemId: req.params.id,
        updateData: req.body,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * DELETE /api/v1/menus/items/:id
 * Delete menu item
 */
router.delete(
  '/items/:id',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ params: menuItemParamsSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;

      // Check if item exists and user has permission
      const existingResult = await menuService.getMenuItem(id);
      if (!existingResult.success) {
        throw new AppError('Menu item not found', 404);
      }

      const existingItem = existingResult.data!;
      if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
        throw new AppError('You can only delete menu items from your school', 403);
      }

      const result = await menuService.deleteMenuItem(id);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to delete menu item', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('menu_items:*');
      await cacheService.invalidatePattern(`menu_item:${id}:*`);

      // Audit log
      await auditService.log(currentUser.id, 'menus.delete_item', {
        itemId: id,
        itemName: existingItem.name,
        schoolId: existingItem.schoolId,
        requestId: req.requestId,
      });

      logger.info('Menu item deleted successfully', {
        itemId: id,
        itemName: existingItem.name,
        deletedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        message: 'Menu item deleted successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to delete menu item', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        itemId: req.params.id,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/menus/items/bulk-update
 * Bulk update menu items
 */
router.post(
  '/items/bulk-update',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ body: bulkUpdateSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { items } = req.body;
      const currentUser = req.user!;

      // Validate permissions for all items
      for (const item of items) {
        const existingResult = await menuService.getMenuItem(item.id);
        if (!existingResult.success) {
          throw new AppError(`Menu item ${item.id} not found`, 404);
        }

        const existingItem = existingResult.data!;
        if (currentUser.role === 'school_admin' && existingItem.schoolId !== currentUser.schoolId) {
          throw new AppError(
            `You can only update menu items from your school (item: ${item.id})`,
            403
          );
        }
      }

      const result = await menuService.bulkUpdateMenuItems({ items });

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to bulk update menu items', 500);
      }

      // Invalidate caches
      await cacheService.invalidatePattern('menu_items:*');

      // Audit log
      await auditService.log(currentUser.id, 'menus.bulk_update_items', {
        itemCount: items.length,
        requestId: req.requestId,
      });

      logger.info('Menu items bulk updated successfully', {
        itemCount: items.length,
        updatedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.json({
        data: result.data,
        message: 'Menu items updated successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to bulk update menu items', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        itemCount: req.body.items?.length,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/menus/categories
 * Get menu categories for a school
 */
router.get(
  '/categories',
  readRateLimit,
  authMiddleware,
  validateRequest({
    query: z.object({
      schoolId: z.string().uuid().optional(),
    }),
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { schoolId } = req.query as any;
      const currentUser = req.user!;

      // Determine school ID based on role
      let targetSchoolId = schoolId;
      if (!targetSchoolId) {
        targetSchoolId = currentUser.schoolId;
      } else if (!['admin'].includes(currentUser.role)) {
        targetSchoolId = currentUser.schoolId; // Force user's school
      }

      const result = await menuService.getMenuItems({ schoolId: targetSchoolId });

      if (!result.success) {
        throw new AppError('Failed to fetch menu items', 500);
      }

      // Extract unique categories
      const categories = [...new Set((result.data || []).map((item: any) => item.category))].sort();

      res.json({
        data: categories,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get menu categories', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * GET /api/v1/menus/analytics
 * Get menu analytics
 */
router.get(
  '/analytics',
  readRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({
    query: z.object({
      schoolId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { schoolId, startDate, endDate } = req.query as any;
      const currentUser = req.user!;

      let targetSchoolId = schoolId;
      if (!targetSchoolId) {
        targetSchoolId = currentUser.schoolId;
      } else if (currentUser.role === 'school_admin' && targetSchoolId !== currentUser.schoolId) {
        throw new AppError('You can only view analytics for your school', 403);
      }

      const result = await menuService.getMenuAnalytics(
        targetSchoolId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to get menu analytics', 500);
      }

      res.json({
        data: result.data,
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to get menu analytics', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/menus/plans
 * Create menu plan
 */
router.post(
  '/plans',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({ body: createMenuPlanSchema }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const planData = req.body;
      const currentUser = req.user!;

      if (currentUser.role === 'school_admin' && planData.schoolId !== currentUser.schoolId) {
        throw new AppError('You can only create menu plans for your school', 403);
      }

      const result = await menuService.createMenuPlan(planData);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to create menu plan', 500);
      }

      // Audit log
      await auditService.log(currentUser.id, 'menus.create_plan', {
        planId: result.data!.id,
        planName: planData.name,
        schoolId: planData.schoolId,
        requestId: req.requestId,
      });

      logger.info('Menu plan created successfully', {
        planId: result.data!.id,
        planName: planData.name,
        schoolId: planData.schoolId,
        createdBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: result.data,
        message: 'Menu plan created successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to create menu plan', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        planData: req.body,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

/**
 * POST /api/v1/menus/plans/:planId/slots
 * Add menu slot to plan
 */
router.post(
  '/plans/:planId/slots',
  writeRateLimit,
  authMiddleware,
  requireRole(['school_admin', 'admin']),
  validateRequest({
    params: z.object({ planId: z.string().uuid() }),
    body: addMenuSlotSchema,
  }),
  async (req: APIRequest, res: APIResponse): Promise<void> => {
    try {
      const { planId } = req.params;
      const slotData = { ...req.body, menuPlanId: planId };
      const currentUser = req.user!;

      const result = await menuService.addMenuSlot(slotData);

      if (!result.success) {
        throw new AppError(result.error?.message || 'Failed to add menu slot', 500);
      }

      // Audit log
      await auditService.log(currentUser.id, 'menus.add_slot', {
        planId,
        slotId: result.data!.id,
        menuItemId: slotData.menuItemId,
        date: slotData.date,
        mealType: slotData.mealType,
        requestId: req.requestId,
      });

      logger.info('Menu slot added successfully', {
        planId,
        slotId: result.data!.id,
        menuItemId: slotData.menuItemId,
        addedBy: currentUser.id,
        requestId: req.requestId,
      });

      res.status(201).json({
        data: result.data,
        message: 'Menu slot added successfully',
        requestId: req.requestId,
      });
    } catch (error: unknown) {
      logger.error('Failed to add menu slot', error instanceof Error ? error : undefined, {
        requestId: req.requestId,
        planId: req.params.planId,
        slotData: req.body,
        userId: req.user?.id,
      });
      throw error;
    }
  }
);

export default router;
