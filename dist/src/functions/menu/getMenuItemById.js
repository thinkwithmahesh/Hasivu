"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenuItemVariantsHandler = exports.getMenuItemByIdHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
async function getMenuItemWithDetails(menuItemId) {
    const database = database_service_1.DatabaseService.getInstance();
    const query = `
    SELECT 
      mi.id, mi.name, mi.description, mi.category, mi.price, mi.schoolId,
      mi.nutritionalInfo, mi.allergens, mi.isVegetarian, mi.isVegan,
      mi.isGlutenFree, mi.isDairyFree, mi.ingredients, mi.servingSize,
      mi.preparationTime, mi.availableDays, mi.customizations,
      mi.images, mi.isActive, mi.createdAt, mi.updatedAt,
      s.id as school_id, s.name as school_name, s.code as school_code
    FROM menu_items mi
    LEFT JOIN schools s ON mi.schoolId = s.id
    WHERE mi.id = $1 AND mi.isActive = true
  `;
    const result = await database.query(query, [menuItemId]);
    if (result.rows.length === 0) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price,
        schoolId: row.schoolId,
        nutritionalInfo: row.nutritionalInfo,
        allergens: row.allergens,
        isVegetarian: row.isVegetarian,
        isVegan: row.isVegan,
        isGlutenFree: row.isGlutenFree,
        isDairyFree: row.isDairyFree,
        ingredients: row.ingredients,
        servingSize: row.servingSize,
        preparationTime: row.preparationTime,
        availableDays: row.availableDays,
        customizations: row.customizations,
        images: row.images,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        school: row.school_id ? {
            id: row.school_id,
            name: row.school_name,
            code: row.school_code
        } : undefined
    };
}
async function getMenuItemAvailability(menuItemId) {
    const database = database_service_1.DatabaseService.getInstance();
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    const query = `
    SELECT availableDays, preparationTime
    FROM menu_items
    WHERE id = $1 AND isActive = true
  `;
    const result = await database.query(query, [menuItemId]);
    if (result.rows.length === 0) {
        return {
            isAvailableToday: false,
            nextAvailableDate: null,
            preparationTime: 0
        };
    }
    const { availableDays, preparationTime } = result.rows[0];
    const isAvailableToday = availableDays.includes(todayName);
    let nextAvailableDate = null;
    if (!isAvailableToday && availableDays.length > 0) {
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const futureDayName = dayNames[futureDate.getDay()];
            if (availableDays.includes(futureDayName)) {
                nextAvailableDate = futureDate.toISOString().split('T')[0];
                break;
            }
        }
    }
    return {
        isAvailableToday,
        nextAvailableDate,
        preparationTime
    };
}
const getMenuItemByIdHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Get menu item by ID request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const menuItemId = event.pathParameters?.id;
        if (!menuItemId) {
            logger.warn('Missing menu item ID in path parameters', { requestId });
            return (0, response_utils_1.createErrorResponse)('Menu item ID is required', 400, 'MISSING_MENU_ITEM_ID');
        }
        const validationService = validation_service_1.ValidationService.getInstance();
        try {
            validationService.validateUUID(menuItemId, 'Menu item ID');
        }
        catch (error) {
            logger.warn('Invalid menu item ID format', { requestId, menuItemId, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return (0, response_utils_1.createErrorResponse)('Invalid menu item ID format', 400, 'INVALID_MENU_ITEM_ID');
        }
        logger.info('Processing get menu item by ID request', { requestId, menuItemId });
        const menuItem = await getMenuItemWithDetails(menuItemId);
        if (!menuItem) {
            logger.warn('Menu item not found', { requestId, menuItemId });
            return (0, response_utils_1.createErrorResponse)('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
        }
        const availability = await getMenuItemAvailability(menuItemId);
        const duration = Date.now() - startTime;
        logger.info('Menu item retrieved successfully', {
            requestId,
            menuItemId,
            menuItemName: menuItem.name,
            schoolId: menuItem.schoolId,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                menuItem: {
                    id: menuItem.id,
                    name: menuItem.name,
                    description: menuItem.description,
                    category: menuItem.category,
                    price: menuItem.price,
                    nutritionalInfo: menuItem.nutritionalInfo,
                    allergens: menuItem.allergens,
                    isVegetarian: menuItem.isVegetarian,
                    isVegan: menuItem.isVegan,
                    isGlutenFree: menuItem.isGlutenFree,
                    isDairyFree: menuItem.isDairyFree,
                    ingredients: menuItem.ingredients,
                    servingSize: menuItem.servingSize,
                    preparationTime: menuItem.preparationTime,
                    customizations: menuItem.customizations,
                    availableDays: menuItem.availableDays,
                    isAvailableToday: availability.isAvailableToday,
                    nextAvailableDate: availability.nextAvailableDate,
                    images: menuItem.images,
                    isActive: menuItem.isActive,
                    createdAt: menuItem.createdAt,
                    updatedAt: menuItem.updatedAt,
                    school: menuItem.school
                },
                availability: {
                    isAvailableToday: availability.isAvailableToday,
                    nextAvailableDate: availability.nextAvailableDate,
                    estimatedPreparationTime: `${availability.preparationTime} minutes`
                }
            },
            message: 'Menu item retrieved successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Get menu item by ID request failed', {
            requestId,
            menuItemId: event.pathParameters?.id,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve menu item');
    }
};
exports.getMenuItemByIdHandler = getMenuItemByIdHandler;
const getMenuItemVariantsHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Get menu item variants request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const menuItemId = event.pathParameters?.id;
        if (!menuItemId) {
            return (0, response_utils_1.createErrorResponse)('Menu item ID is required', 400, 'MISSING_MENU_ITEM_ID');
        }
        const validationService = validation_service_1.ValidationService.getInstance();
        validationService.validateUUID(menuItemId, 'Menu item ID');
        const mainMenuItem = await getMenuItemWithDetails(menuItemId);
        if (!mainMenuItem) {
            return (0, response_utils_1.createErrorResponse)('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
        }
        const database = database_service_1.DatabaseService.getInstance();
        const variantsQuery = `
      SELECT 
        id, name, description, price, preparationTime,
        allergens, isVegetarian, isVegan, isGlutenFree, isDairyFree,
        customizations, images, availableDays
      FROM menu_items
      WHERE schoolId = $1 
        AND category = $2 
        AND isActive = true
        AND (name ILIKE $3 OR description ILIKE $3)
        AND id != $4
      ORDER BY name, price
    `;
        const searchPattern = `%${mainMenuItem.name.split(' ')[0]}%`;
        const variantsResult = await database.query(variantsQuery, [
            mainMenuItem.schoolId,
            mainMenuItem.category,
            searchPattern,
            menuItemId
        ]);
        const variants = variantsResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            preparationTime: row.preparationTime,
            allergens: row.allergens,
            dietaryFlags: {
                isVegetarian: row.isVegetarian,
                isVegan: row.isVegan,
                isGlutenFree: row.isGlutenFree,
                isDairyFree: row.isDairyFree
            },
            customizations: row.customizations,
            images: row.images,
            availableDays: row.availableDays
        }));
        const duration = Date.now() - startTime;
        logger.info('Menu item variants retrieved successfully', {
            requestId,
            menuItemId,
            variantCount: variants.length,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                mainItem: {
                    id: mainMenuItem.id,
                    name: mainMenuItem.name,
                    price: mainMenuItem.price
                },
                variants,
                total: variants.length
            },
            message: 'Menu item variants retrieved successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Get menu item variants request failed', {
            requestId,
            menuItemId: event.pathParameters?.id,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve menu item variants');
    }
};
exports.getMenuItemVariantsHandler = getMenuItemVariantsHandler;
//# sourceMappingURL=getMenuItemById.js.map