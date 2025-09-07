"use strict";
/**
 * Create Menu Item Lambda Function
 * Handles: POST /menu/items
 * Implements Story 2.1: Product Catalog Foundation - Menu Item Creation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const validation_1 = require("../../utils/validation");
/**
 * Create Menu Item Lambda Function Handler
 * Creates a new menu item with validation
 */
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('createMenuItemHandler started', { requestId: context.awsRequestId, httpMethod: event.httpMethod });
    try {
        // Only allow POST method
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing create menu item request', { body });
        // Validate input data
        const validation = (0, validation_1.validateMenuItem)(body);
        if (!validation.isValid) {
            return (0, response_utils_1.createErrorResponse)('Validation failed', 400, 'VALIDATION_FAILED');
        }
        const menuItemData = body;
        const db = database_service_1.databaseService.getPrismaClient();
        // Check if menu item with same name exists for this school
        const existingItem = await db.menuItem.findFirst({
            where: {
                name: menuItemData.name,
                schoolId: menuItemData.schoolId,
                available: true
            }
        });
        if (existingItem) {
            return (0, response_utils_1.createErrorResponse)('Menu item with this name already exists for this school', 409, 'MENU_ITEM_EXISTS');
        }
        // Validate school exists
        const school = await db.school.findUnique({
            where: { id: menuItemData.schoolId },
            select: { id: true, isActive: true }
        });
        if (!school) {
            return (0, response_utils_1.createErrorResponse)('School not found', 404, 'SCHOOL_NOT_FOUND');
        }
        if (!school.isActive) {
            return (0, response_utils_1.createErrorResponse)('School is not active', 400, 'SCHOOL_INACTIVE');
        }
        // Create menu item with schema-compatible fields
        const metadata = {
            isVegetarian: menuItemData.isVegetarian,
            isVegan: menuItemData.isVegan,
            isGlutenFree: menuItemData.isGlutenFree,
            isDairyFree: menuItemData.isDairyFree,
            ingredients: menuItemData.ingredients,
            servingSize: menuItemData.servingSize,
            availableDays: menuItemData.availableDays,
            customizations: menuItemData.customizations,
            images: menuItemData.images
        };
        const createdMenuItem = await db.menuItem.create({
            data: {
                name: menuItemData.name,
                description: menuItemData.description,
                category: menuItemData.category,
                price: menuItemData.price,
                schoolId: menuItemData.schoolId,
                nutritionalInfo: JSON.stringify(menuItemData.nutritionalInfo || {}),
                allergens: JSON.stringify(menuItemData.allergens || []),
                preparationTime: menuItemData.preparationTime || null,
                portionSize: menuItemData.servingSize || null,
                imageUrl: Array.isArray(menuItemData.images) ? menuItemData.images[0] : menuItemData.images || null,
                available: menuItemData.isActive ?? true,
                metadata: JSON.stringify(metadata)
            }
        });
        const duration = Date.now() - startTime;
        logger_1.logger.info('createMenuItemHandler completed successfully', { requestId: context.awsRequestId, statusCode: 201, duration });
        logger_1.logger.info('Menu item created successfully', { menuItemId: createdMenuItem.id });
        // Parse stored metadata for response
        let storedMetadata = {};
        try {
            storedMetadata = JSON.parse(createdMenuItem.metadata);
        }
        catch (e) {
            storedMetadata = {};
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                menuItem: {
                    id: createdMenuItem.id,
                    name: createdMenuItem.name,
                    description: createdMenuItem.description,
                    category: createdMenuItem.category,
                    price: createdMenuItem.price,
                    schoolId: createdMenuItem.schoolId,
                    nutritionalInfo: createdMenuItem.nutritionalInfo,
                    allergens: createdMenuItem.allergens,
                    preparationTime: createdMenuItem.preparationTime,
                    portionSize: createdMenuItem.portionSize,
                    imageUrl: createdMenuItem.imageUrl,
                    available: createdMenuItem.available,
                    createdAt: createdMenuItem.createdAt,
                    updatedAt: createdMenuItem.updatedAt,
                    // Include additional fields from metadata
                    ...storedMetadata
                }
            },
            message: 'Menu item created successfully'
        }, 201);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('createMenuItemHandler failed', { requestId: context.awsRequestId, statusCode: 500, duration, error: error.message });
        return (0, response_utils_1.handleError)(error, 'Failed to create menu item');
    }
};
exports.handler = handler;
