"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDailyMenuHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
async function validateMenuPlanAccess(menuPlanId, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const menuPlanQuery = `
    SELECT 
      mp.id, mp.name, mp.schoolId, mp.status, mp.startDate, mp.endDate,
      mp.isActive, mp.metadata,
      s.id as school_id, s.name as school_name, s.code as school_code, s.isActive as school_active
    FROM menu_plans mp
    JOIN schools s ON mp.schoolId = s.id
    WHERE mp.id = $1 AND mp.isActive = true
  `;
    const result = await database.query(menuPlanQuery, [menuPlanId]);
    if (result.rows.length === 0) {
        throw new Error('Menu plan not found or inactive');
    }
    const menuPlan = result.rows[0];
    if (!menuPlan.school_active) {
        throw new Error('School is not active');
    }
    const userAccessQuery = `
    SELECT role, isActive, schoolId
    FROM users
    WHERE id = $1 AND schoolId = $2 AND isActive = true
  `;
    const userResult = await database.query(userAccessQuery, [userId, menuPlan.schoolId]);
    if (userResult.rows.length === 0) {
        throw new Error('User does not have access to this school');
    }
    const userAccess = userResult.rows[0];
    const allowedRoles = ['school_admin', 'admin', 'super_admin', 'staff'];
    if (!allowedRoles.includes(userAccess.role)) {
        throw new Error('Insufficient permissions to create daily menus');
    }
    if (menuPlan.status === 'ARCHIVED') {
        throw new Error('Cannot create daily menu for archived menu plan');
    }
    return {
        menuPlan: {
            id: menuPlan.id,
            name: menuPlan.name,
            schoolId: menuPlan.schoolId,
            status: menuPlan.status,
            startDate: menuPlan.startDate,
            endDate: menuPlan.endDate,
            isActive: menuPlan.isActive,
            metadata: menuPlan.metadata,
            school: {
                id: menuPlan.school_id,
                name: menuPlan.school_name,
                code: menuPlan.school_code
            }
        },
        user: userAccess
    };
}
async function validateDateWithinPlan(date, menuPlan) {
    const targetDate = new Date(date);
    const startDate = new Date(menuPlan.startDate);
    const endDate = new Date(menuPlan.endDate);
    if (targetDate < startDate || targetDate > endDate) {
        throw new Error(`Date must be within menu plan range (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
    }
    const database = database_service_1.DatabaseService.getInstance();
    const existingQuery = `
    SELECT id FROM daily_menus
    WHERE menuPlanId = $1 AND date = $2 AND isActive = true
  `;
    const existing = await database.query(existingQuery, [menuPlan.id, targetDate.toISOString().split('T')[0]]);
    if (existing.rows.length > 0) {
        throw new Error(`Daily menu already exists for ${targetDate.toISOString().split('T')[0]}`);
    }
}
function validateDayType(dayType) {
    const validDayTypes = ['regular', 'special', 'holiday', 'event'];
    if (!validDayTypes.includes(dayType)) {
        throw new Error(`Invalid day type. Must be one of: ${validDayTypes.join(', ')}`);
    }
}
async function validateMenuItems(menuItemIds, schoolId) {
    if (menuItemIds.length === 0) {
        return [];
    }
    const database = database_service_1.DatabaseService.getInstance();
    const placeholders = menuItemIds.map((_, index) => `$${index + 2}`).join(', ');
    const query = `
    SELECT 
      id, name, description, price, category, allergens,
      isVegetarian, isVegan, isGlutenFree, preparationTime,
      images, isActive
    FROM menu_items
    WHERE schoolId = $1 AND id IN (${placeholders}) AND isActive = true
  `;
    const result = await database.query(query, [schoolId, ...menuItemIds]);
    const foundIds = result.rows.map((item) => item.id);
    const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
    if (missingIds.length > 0) {
        throw new Error(`Menu items not found or inactive: ${missingIds.join(', ')}`);
    }
    return result.rows;
}
async function validateMenuSlots(slots, schoolId) {
    const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage'];
    for (const slot of slots) {
        if (!validCategories.includes(slot.category)) {
            throw new Error(`Invalid slot category: ${slot.category}. Must be one of: ${validCategories.join(', ')}`);
        }
        if (slot.menuItemIds && slot.menuItemIds.length > 0) {
            await validateMenuItems(slot.menuItemIds, schoolId);
        }
        if (slot.availableFrom && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.availableFrom)) {
            throw new Error(`Invalid availableFrom time format: ${slot.availableFrom}. Use HH:mm format`);
        }
        if (slot.availableUntil && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.availableUntil)) {
            throw new Error(`Invalid availableUntil time format: ${slot.availableUntil}. Use HH:mm format`);
        }
        if (slot.maxQuantity !== undefined && (slot.maxQuantity < 0 || slot.maxQuantity > 10000)) {
            throw new Error(`Invalid maxQuantity: ${slot.maxQuantity}. Must be between 0 and 10000`);
        }
        if (slot.priority !== undefined && (slot.priority < 1 || slot.priority > 100)) {
            throw new Error(`Invalid priority: ${slot.priority}. Must be between 1 and 100`);
        }
    }
}
async function createDailyMenuInDatabase(data, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        await database.query('BEGIN');
        const dailyMenuQuery = `
      INSERT INTO daily_menus (
        id, menuPlanId, date, dayType, name, description,
        isActive, metadata, createdBy, createdAt, updatedAt
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id, createdAt, updatedAt
    `;
        const menuName = data.name || `Daily Menu - ${data.date}`;
        const menuDescription = data.description || `Daily menu for ${data.date}`;
        const dailyMenuResult = await database.query(dailyMenuQuery, [
            data.menuPlanId,
            data.date,
            data.dayType,
            menuName,
            menuDescription,
            data.isActive !== false,
            JSON.stringify(data.metadata || {}),
            userId
        ]);
        const dailyMenuId = dailyMenuResult.rows[0].id;
        const { createdAt, updatedAt } = dailyMenuResult.rows[0];
        const createdSlots = [];
        for (let i = 0; i < data.slots.length; i++) {
            const slot = data.slots[i];
            const slotQuery = `
        INSERT INTO menu_slots (
          id, dailyMenuId, category, maxQuantity, availableFrom, availableUntil,
          isOptional, priority, metadata, createdAt, updatedAt
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `;
            const slotResult = await database.query(slotQuery, [
                dailyMenuId,
                slot.category,
                slot.maxQuantity || null,
                slot.availableFrom || null,
                slot.availableUntil || null,
                slot.isOptional || false,
                slot.priority || (i + 1) * 10,
                JSON.stringify(slot.metadata || {})
            ]);
            const slotId = slotResult.rows[0].id;
            if (slot.menuItemIds && slot.menuItemIds.length > 0) {
                for (const menuItemId of slot.menuItemIds) {
                    const linkQuery = `
            INSERT INTO menu_slot_items (slotId, menuItemId, createdAt)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
          `;
                    await database.query(linkQuery, [slotId, menuItemId]);
                }
            }
            createdSlots.push({
                id: slotId,
                category: slot.category,
                menuItemIds: slot.menuItemIds || [],
                maxQuantity: slot.maxQuantity || null,
                availableFrom: slot.availableFrom || null,
                availableUntil: slot.availableUntil || null,
                isOptional: slot.isOptional || false,
                priority: slot.priority || (i + 1) * 10,
                metadata: slot.metadata || {}
            });
        }
        await database.query('COMMIT');
        return await getDailyMenuWithDetails(dailyMenuId);
    }
    catch (error) {
        await database.query('ROLLBACK');
        throw error;
    }
}
async function getDailyMenuWithDetails(dailyMenuId) {
    const database = database_service_1.DatabaseService.getInstance();
    const dailyMenuQuery = `
    SELECT 
      dm.id, dm.menuPlanId, dm.date, dm.dayType, dm.name, dm.description,
      dm.isActive, dm.metadata, dm.createdAt, dm.updatedAt,
      mp.id as plan_id, mp.name as plan_name, mp.schoolId, mp.status as plan_status,
      s.id as school_id, s.name as school_name, s.code as school_code
    FROM daily_menus dm
    JOIN menu_plans mp ON dm.menuPlanId = mp.id
    JOIN schools s ON mp.schoolId = s.id
    WHERE dm.id = $1
  `;
    const dailyMenuResult = await database.query(dailyMenuQuery, [dailyMenuId]);
    if (dailyMenuResult.rows.length === 0) {
        throw new Error('Daily menu not found');
    }
    const dailyMenu = dailyMenuResult.rows[0];
    const slotsQuery = `
    SELECT 
      ms.id, ms.category, ms.maxQuantity, ms.availableFrom, ms.availableUntil,
      ms.isOptional, ms.priority, ms.metadata,
      mi.id as item_id, mi.name as item_name, mi.description as item_description,
      mi.price, mi.category as item_category, mi.allergens,
      mi.isVegetarian, mi.isVegan, mi.isGlutenFree, mi.preparationTime, mi.images
    FROM menu_slots ms
    LEFT JOIN menu_slot_items msi ON ms.id = msi.slotId
    LEFT JOIN menu_items mi ON msi.menuItemId = mi.id AND mi.isActive = true
    WHERE ms.dailyMenuId = $1
    ORDER BY ms.priority ASC, ms.category ASC, mi.name ASC
  `;
    const slotsResult = await database.query(slotsQuery, [dailyMenuId]);
    const slotsMap = new Map();
    for (const row of slotsResult.rows) {
        if (!slotsMap.has(row.id)) {
            slotsMap.set(row.id, {
                id: row.id,
                category: row.category,
                maxQuantity: row.maxQuantity,
                availableFrom: row.availableFrom,
                availableUntil: row.availableUntil,
                isOptional: row.isOptional,
                priority: row.priority,
                metadata: row.metadata,
                menuItems: []
            });
        }
        if (row.item_id) {
            slotsMap.get(row.id).menuItems.push({
                id: row.item_id,
                name: row.item_name,
                description: row.item_description,
                price: row.price,
                category: row.item_category,
                allergens: row.allergens,
                isVegetarian: row.isVegetarian,
                isVegan: row.isVegan,
                isGlutenFree: row.isGlutenFree,
                preparationTime: row.preparationTime,
                images: row.images
            });
        }
    }
    return {
        id: dailyMenu.id,
        menuPlanId: dailyMenu.menuPlanId,
        date: dailyMenu.date,
        dayType: dailyMenu.dayType,
        name: dailyMenu.name,
        description: dailyMenu.description,
        isActive: dailyMenu.isActive,
        metadata: dailyMenu.metadata,
        createdAt: dailyMenu.createdAt,
        updatedAt: dailyMenu.updatedAt,
        slots: Array.from(slotsMap.values()),
        menuPlan: {
            id: dailyMenu.plan_id,
            name: dailyMenu.plan_name,
            schoolId: dailyMenu.schoolId,
            status: dailyMenu.plan_status
        },
        school: {
            id: dailyMenu.school_id,
            name: dailyMenu.school_name,
            code: dailyMenu.school_code
        }
    };
}
const createDailyMenuHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Create daily menu request started', { requestId });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        if (!event.body) {
            logger.warn('Missing request body', { requestId });
            return (0, response_utils_1.createErrorResponse)('Request body is required', 400, 'MISSING_REQUEST_BODY');
        }
        let requestData;
        try {
            requestData = JSON.parse(event.body);
        }
        catch (error) {
            logger.warn('Invalid JSON in request body', { requestId, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return (0, response_utils_1.createErrorResponse)('Invalid JSON in request body', 400, 'INVALID_JSON');
        }
        const validationService = validation_service_1.ValidationService.getInstance();
        if (!requestData.menuPlanId) {
            return (0, response_utils_1.createErrorResponse)('Menu plan ID is required', 400, 'MISSING_MENU_PLAN_ID');
        }
        try {
            validationService.validateUUID(requestData.menuPlanId, 'Menu plan ID');
        }
        catch (error) {
            return (0, response_utils_1.createErrorResponse)('Invalid menu plan ID format', 400, 'INVALID_MENU_PLAN_ID');
        }
        if (!requestData.date) {
            return (0, response_utils_1.createErrorResponse)('Date is required', 400, 'MISSING_DATE');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(requestData.date)) {
            return (0, response_utils_1.createErrorResponse)('Invalid date format. Use YYYY-MM-DD', 400, 'INVALID_DATE_FORMAT');
        }
        if (!requestData.dayType) {
            return (0, response_utils_1.createErrorResponse)('Day type is required', 400, 'MISSING_DAY_TYPE');
        }
        if (!requestData.slots || !Array.isArray(requestData.slots)) {
            return (0, response_utils_1.createErrorResponse)('Slots array is required', 400, 'MISSING_SLOTS');
        }
        logger.info('Processing create daily menu request', {
            requestId,
            menuPlanId: requestData.menuPlanId,
            date: requestData.date,
            dayType: requestData.dayType,
            slotsCount: requestData.slots.length,
            userId: authenticatedUser.userId
        });
        if (!authenticatedUser.userId) {
            return (0, response_utils_1.createErrorResponse)('User authentication failed', 401, 'UNAUTHENTICATED');
        }
        const { menuPlan, user } = await validateMenuPlanAccess(requestData.menuPlanId, authenticatedUser.userId);
        validateDayType(requestData.dayType);
        const targetDate = new Date(requestData.date);
        await validateDateWithinPlan(targetDate, menuPlan);
        await validateMenuSlots(requestData.slots, menuPlan.schoolId);
        const dailyMenu = await createDailyMenuInDatabase(requestData, authenticatedUser.userId);
        try {
            const redis = redis_service_1.RedisService;
            await redis.del(`daily_menu:${requestData.menuPlanId}:*`);
            await redis.del(`menu_plan:${requestData.menuPlanId}`);
            await redis.del(`school_menus:${menuPlan.schoolId}`);
        }
        catch (cacheError) {
            logger.warn('Failed to clear cache after daily menu creation', {
                requestId,
                error: cacheError.message
            });
        }
        const duration = Date.now() - startTime;
        logger.info('Daily menu created successfully', {
            requestId,
            dailyMenuId: dailyMenu.id,
            menuPlanId: requestData.menuPlanId,
            date: requestData.date,
            schoolId: menuPlan.schoolId,
            slotsCount: dailyMenu.slots.length,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                dailyMenu
            },
            message: 'Daily menu created successfully'
        }, 201);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Create daily menu request failed', {
            requestId,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to create daily menu');
    }
};
exports.createDailyMenuHandler = createDailyMenuHandler;
//# sourceMappingURL=create-daily-menu.js.map