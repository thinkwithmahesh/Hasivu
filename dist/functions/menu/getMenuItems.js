"use strict";
/**
 * Get Menu Items Lambda Function
 * Handles: GET /menu/items
 * Implements Story 2.1: Product Catalog Foundation - Menu Items Retrieval
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
/**
 * Get Menu Items Lambda Function Handler
 * Supports filtering, searching, and pagination
 */
const handler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Get menu items request started', { requestId });
        // Only allow GET method
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const queryParams = event.queryStringParameters || {};
        logger.info('Processing get menu items request', { requestId, queryParams });
        // Parse and validate query parameters
        const filters = {
            schoolId: queryParams.schoolId,
            category: queryParams.category,
            isVegetarian: queryParams.isVegetarian === 'true',
            isVegan: queryParams.isVegan === 'true',
            isGlutenFree: queryParams.isGlutenFree === 'true',
            isDairyFree: queryParams.isDairyFree === 'true',
            availableDay: queryParams.availableDay,
            search: queryParams.search,
            minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined,
            maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined,
            isActive: queryParams.isActive !== 'false' // Default to true unless explicitly false
        };
        // Handle allergens filter (comma-separated)
        if (queryParams.allergens) {
            filters.allergens = queryParams.allergens.split(',').map(a => a.trim());
        }
        // Parse pagination parameters
        const pagination = {
            page: parseInt(queryParams.page || '1'),
            limit: Math.min(parseInt(queryParams.limit || '20'), 100), // Max 100 items per page
            sortBy: queryParams.sortBy || 'name',
            sortOrder: (queryParams.sortOrder?.toUpperCase() === 'DESC') ? 'DESC' : 'ASC'
        };
        // Validate pagination
        if (pagination.page < 1) {
            return (0, response_utils_1.createErrorResponse)('Page number must be greater than 0', 400, 'INVALID_PAGE');
        }
        if (pagination.limit < 1) {
            return (0, response_utils_1.createErrorResponse)('Limit must be greater than 0', 400, 'INVALID_LIMIT');
        }
        // Validate sort field
        const validSortFields = ['name', 'price', 'category', 'preparationTime', 'createdAt', 'updatedAt'];
        if (!validSortFields.includes(pagination.sortBy)) {
            return (0, response_utils_1.createErrorResponse)(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`, 400, 'INVALID_SORT_FIELD');
        }
        const database = database_service_1.DatabaseService.getInstance();
        // Build dynamic WHERE clause
        const whereConditions = [];
        const queryValues = [];
        let paramCounter = 1;
        // School filter
        if (filters.schoolId) {
            whereConditions.push(`schoolId = $${paramCounter}`);
            queryValues.push(filters.schoolId);
            paramCounter++;
        }
        // Category filter
        if (filters.category) {
            whereConditions.push(`category = $${paramCounter}`);
            queryValues.push(filters.category);
            paramCounter++;
        }
        // Dietary filters
        if (filters.isVegetarian) {
            whereConditions.push(`isVegetarian = $${paramCounter}`);
            queryValues.push(filters.isVegetarian);
            paramCounter++;
        }
        if (filters.isVegan) {
            whereConditions.push(`isVegan = $${paramCounter}`);
            queryValues.push(filters.isVegan);
            paramCounter++;
        }
        if (filters.isGlutenFree) {
            whereConditions.push(`isGlutenFree = $${paramCounter}`);
            queryValues.push(filters.isGlutenFree);
            paramCounter++;
        }
        if (filters.isDairyFree) {
            whereConditions.push(`isDairyFree = $${paramCounter}`);
            queryValues.push(filters.isDairyFree);
            paramCounter++;
        }
        // Price range filters
        if (filters.minPrice !== undefined) {
            whereConditions.push(`price >= $${paramCounter}`);
            queryValues.push(filters.minPrice);
            paramCounter++;
        }
        if (filters.maxPrice !== undefined) {
            whereConditions.push(`price <= $${paramCounter}`);
            queryValues.push(filters.maxPrice);
            paramCounter++;
        }
        // Available day filter
        if (filters.availableDay) {
            whereConditions.push(`$${paramCounter} = ANY(availableDays)`);
            queryValues.push(filters.availableDay);
            paramCounter++;
        }
        // Allergen exclusion filter
        if (filters.allergens && filters.allergens.length > 0) {
            whereConditions.push(`NOT (allergens && $${paramCounter})`);
            queryValues.push(filters.allergens);
            paramCounter++;
        }
        // Active status filter
        if (filters.isActive !== undefined) {
            whereConditions.push(`isActive = $${paramCounter}`);
            queryValues.push(filters.isActive);
            paramCounter++;
        }
        // Search filter (name, description, ingredients)
        if (filters.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            whereConditions.push(`(
        LOWER(name) LIKE $${paramCounter} OR 
        LOWER(description) LIKE $${paramCounter} OR
        EXISTS (
          SELECT 1 FROM unnest(ingredients) AS ingredient 
          WHERE LOWER(ingredient) LIKE $${paramCounter}
        )
      )`);
            queryValues.push(searchTerm);
            paramCounter++;
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        // Calculate offset
        const offset = (pagination.page - 1) * pagination.limit;
        // Get total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total
      FROM menu_items
      ${whereClause}
    `;
        const countResult = await database.query(countQuery, queryValues);
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / pagination.limit);
        // Get menu items with pagination
        const itemsQuery = `
      SELECT 
        id, name, description, category, price, schoolId,
        nutritionalInfo, allergens, isVegetarian, isVegan,
        isGlutenFree, isDairyFree, ingredients, servingSize,
        preparationTime, availableDays, customizations,
        images, isActive, createdAt, updatedAt
      FROM menu_items
      ${whereClause}
      ORDER BY ${pagination.sortBy} ${pagination.sortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
        queryValues.push(pagination.limit, offset);
        const itemsResult = await database.query(itemsQuery, queryValues);
        const duration = Date.now() - startTime;
        logger.info('Menu items retrieved successfully', {
            requestId,
            count: itemsResult.rows.length,
            totalCount,
            filters,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                menuItems: itemsResult.rows.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    category: item.category,
                    price: item.price,
                    schoolId: item.schoolId,
                    nutritionalInfo: item.nutritionalInfo,
                    allergens: item.allergens,
                    isVegetarian: item.isVegetarian,
                    isVegan: item.isVegan,
                    isGlutenFree: item.isGlutenFree,
                    isDairyFree: item.isDairyFree,
                    ingredients: item.ingredients,
                    servingSize: item.servingSize,
                    preparationTime: item.preparationTime,
                    availableDays: item.availableDays,
                    customizations: item.customizations,
                    images: item.images,
                    isActive: item.isActive,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                filters
            },
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: totalCount,
                pages: totalPages,
                hasNext: pagination.page < totalPages,
                hasPrev: pagination.page > 1
            },
            message: 'Menu items retrieved successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Get menu items request failed', {
            requestId,
            error: error.message,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve menu items');
    }
};
exports.handler = handler;
