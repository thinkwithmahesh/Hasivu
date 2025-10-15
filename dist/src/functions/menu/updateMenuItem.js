"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMenuItemHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
function validateUpdateData(data) {
    const validationService = validation_service_1.ValidationService.getInstance();
    const validated = {};
    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || data.name.trim().length === 0) {
            throw new Error('Name must be a non-empty string');
        }
        if (data.name.length > 200) {
            throw new Error('Name must be less than 200 characters');
        }
        validated.name = data.name.trim();
    }
    if (data.description !== undefined) {
        if (typeof data.description !== 'string') {
            throw new Error('Description must be a string');
        }
        if (data.description.length > 1000) {
            throw new Error('Description must be less than 1000 characters');
        }
        validated.description = data.description.trim();
    }
    if (data.category !== undefined) {
        const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'dessert'];
        if (!validCategories.includes(data.category)) {
            throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
        }
        validated.category = data.category;
    }
    if (data.price !== undefined) {
        const price = parseFloat(data.price);
        if (isNaN(price) || price < 0) {
            throw new Error('Price must be a non-negative number');
        }
        if (price > 10000) {
            throw new Error('Price must be less than $10,000');
        }
        validated.price = price;
    }
    if (data.nutritionalInfo !== undefined) {
        if (typeof data.nutritionalInfo !== 'object' || data.nutritionalInfo === null) {
            throw new Error('Nutritional info must be an object');
        }
        validated.nutritionalInfo = data.nutritionalInfo;
    }
    if (data.allergens !== undefined) {
        if (!Array.isArray(data.allergens)) {
            throw new Error('Allergens must be an array');
        }
        const validAllergens = ['nuts', 'dairy', 'eggs', 'soy', 'wheat', 'fish', 'shellfish', 'sesame'];
        for (const allergen of data.allergens) {
            if (!validAllergens.includes(allergen)) {
                throw new Error(`Invalid allergen: ${allergen}. Must be one of: ${validAllergens.join(', ')}`);
            }
        }
        validated.allergens = data.allergens;
    }
    if (data.isVegetarian !== undefined) {
        validated.isVegetarian = Boolean(data.isVegetarian);
    }
    if (data.isVegan !== undefined) {
        validated.isVegan = Boolean(data.isVegan);
    }
    if (data.isGlutenFree !== undefined) {
        validated.isGlutenFree = Boolean(data.isGlutenFree);
    }
    if (data.isDairyFree !== undefined) {
        validated.isDairyFree = Boolean(data.isDairyFree);
    }
    if (data.ingredients !== undefined) {
        if (!Array.isArray(data.ingredients)) {
            throw new Error('Ingredients must be an array');
        }
        for (const ingredient of data.ingredients) {
            if (typeof ingredient !== 'string' || ingredient.trim().length === 0) {
                throw new Error('Each ingredient must be a non-empty string');
            }
        }
        validated.ingredients = data.ingredients.map((i) => i.trim());
    }
    if (data.servingSize !== undefined) {
        if (typeof data.servingSize !== 'string' || data.servingSize.trim().length === 0) {
            throw new Error('Serving size must be a non-empty string');
        }
        validated.servingSize = data.servingSize.trim();
    }
    if (data.preparationTime !== undefined) {
        const prepTime = parseInt(data.preparationTime);
        if (isNaN(prepTime) || prepTime < 0) {
            throw new Error('Preparation time must be a non-negative number');
        }
        if (prepTime > 480) {
            throw new Error('Preparation time must be less than 480 minutes');
        }
        validated.preparationTime = prepTime;
    }
    if (data.availableDays !== undefined) {
        if (!Array.isArray(data.availableDays)) {
            throw new Error('Available days must be an array');
        }
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (const day of data.availableDays) {
            if (!validDays.includes(day.toLowerCase())) {
                throw new Error(`Invalid day: ${day}. Must be one of: ${validDays.join(', ')}`);
            }
        }
        validated.availableDays = data.availableDays.map((d) => d.toLowerCase());
    }
    if (data.customizations !== undefined) {
        if (typeof data.customizations !== 'object' || data.customizations === null) {
            throw new Error('Customizations must be an object');
        }
        validated.customizations = data.customizations;
    }
    if (data.images !== undefined) {
        if (!Array.isArray(data.images)) {
            throw new Error('Images must be an array');
        }
        for (const image of data.images) {
            if (typeof image !== 'string' || !image.startsWith('http')) {
                throw new Error('Each image must be a valid URL');
            }
        }
        validated.images = data.images;
    }
    if (data.isActive !== undefined) {
        validated.isActive = Boolean(data.isActive);
    }
    return validated;
}
async function getExistingMenuItem(menuItemId, schoolId) {
    const database = database_service_1.DatabaseService.getInstance();
    const query = `
    SELECT 
      id, name, description, category, price, schoolId,
      nutritionalInfo, allergens, isVegetarian, isVegan,
      isGlutenFree, isDairyFree, ingredients, servingSize,
      preparationTime, availableDays, customizations,
      images, isActive, createdAt, updatedAt
    FROM menu_items
    WHERE id = $1 AND isActive = true
    ${schoolId ? 'AND schoolId = $2' : ''}
  `;
    const values = schoolId ? [menuItemId, schoolId] : [menuItemId];
    const result = await database.query(query, values);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}
async function updateMenuItem(menuItemId, updateData) {
    const database = database_service_1.DatabaseService.getInstance();
    const updateFields = [];
    const queryValues = [];
    let paramCounter = 1;
    Object.entries(updateData).forEach(([key, value]) => {
        updateFields.push(`${key} = $${paramCounter}`);
        queryValues.push(value);
        paramCounter++;
    });
    updateFields.push(`updatedAt = CURRENT_TIMESTAMP`);
    const updateQuery = `
    UPDATE menu_items
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCounter} AND isActive = true
    RETURNING 
      id, name, description, category, price, schoolId,
      nutritionalInfo, allergens, isVegetarian, isVegan,
      isGlutenFree, isDairyFree, ingredients, servingSize,
      preparationTime, availableDays, customizations,
      images, isActive, createdAt, updatedAt
  `;
    queryValues.push(menuItemId);
    const result = await database.query(updateQuery, queryValues);
    if (result.rows.length === 0) {
        throw new Error('Menu item not found or update failed');
    }
    return result.rows[0];
}
async function logMenuItemUpdate(menuItemId, originalData, updatedData, userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const changes = {};
    Object.keys(updatedData).forEach(key => {
        if (key !== 'updatedAt' && originalData[key] !== updatedData[key]) {
            changes[key] = {
                from: originalData[key],
                to: updatedData[key]
            };
        }
    });
    const auditQuery = `
    INSERT INTO menu_item_audit_log (
      menuItemId, action, changes, userId, timestamp
    ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `;
    await database.query(auditQuery, [
        menuItemId,
        'update',
        JSON.stringify(changes),
        userId
    ]);
}
const updateMenuItemHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Update menu item request started', { requestId });
        if (event.httpMethod !== 'PUT') {
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
        logger.info('Processing update menu item request', {
            requestId,
            menuItemId,
            updateFields: Object.keys(requestData)
        });
        let validatedData;
        try {
            validatedData = validateUpdateData(requestData);
        }
        catch (error) {
            logger.warn('Validation failed for update data', {
                requestId,
                menuItemId,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return (0, response_utils_1.createErrorResponse)(error instanceof Error ? error.message : String(error), 400, 'VALIDATION_FAILED');
        }
        if (Object.keys(validatedData).length === 0) {
            logger.warn('No valid updates provided', { requestId, menuItemId });
            return (0, response_utils_1.createErrorResponse)('No valid updates provided', 400, 'NO_UPDATES');
        }
        const existingMenuItem = await getExistingMenuItem(menuItemId);
        if (!existingMenuItem) {
            logger.warn('Menu item not found', { requestId, menuItemId });
            return (0, response_utils_1.createErrorResponse)('Menu item not found', 404, 'MENU_ITEM_NOT_FOUND');
        }
        const userId = 'system';
        const updatedMenuItem = await updateMenuItem(menuItemId, validatedData);
        await logMenuItemUpdate(menuItemId, existingMenuItem, updatedMenuItem, userId);
        try {
            const redis = redis_service_1.RedisService;
            await redis.del(`search:*`);
            await redis.del(`menu_item:${menuItemId}`);
            await redis.del(`menu_items:school:${updatedMenuItem.schoolId}`);
        }
        catch (cacheError) {
            logger.warn('Failed to clear cache after menu item update', {
                requestId,
                menuItemId,
                error: cacheError.message
            });
        }
        const duration = Date.now() - startTime;
        logger.info('Menu item updated successfully', {
            requestId,
            menuItemId,
            menuItemName: updatedMenuItem.name,
            schoolId: updatedMenuItem.schoolId,
            updatedFields: Object.keys(validatedData),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                menuItem: {
                    id: updatedMenuItem.id,
                    name: updatedMenuItem.name,
                    description: updatedMenuItem.description,
                    category: updatedMenuItem.category,
                    price: updatedMenuItem.price,
                    schoolId: updatedMenuItem.schoolId,
                    nutritionalInfo: updatedMenuItem.nutritionalInfo,
                    allergens: updatedMenuItem.allergens,
                    isVegetarian: updatedMenuItem.isVegetarian,
                    isVegan: updatedMenuItem.isVegan,
                    isGlutenFree: updatedMenuItem.isGlutenFree,
                    isDairyFree: updatedMenuItem.isDairyFree,
                    ingredients: updatedMenuItem.ingredients,
                    servingSize: updatedMenuItem.servingSize,
                    preparationTime: updatedMenuItem.preparationTime,
                    availableDays: updatedMenuItem.availableDays,
                    customizations: updatedMenuItem.customizations,
                    images: updatedMenuItem.images,
                    isActive: updatedMenuItem.isActive,
                    createdAt: updatedMenuItem.createdAt,
                    updatedAt: updatedMenuItem.updatedAt
                },
                changes: {
                    fieldsUpdated: Object.keys(validatedData),
                    updateCount: Object.keys(validatedData).length
                }
            },
            message: 'Menu item updated successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Update menu item request failed', {
            requestId,
            menuItemId: event.pathParameters?.id,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to update menu item');
    }
};
exports.updateMenuItemHandler = updateMenuItemHandler;
//# sourceMappingURL=updateMenuItem.js.map