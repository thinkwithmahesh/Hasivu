"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchMenuItemsHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../services/database.service");
const redis_service_1 = require("../../services/redis.service");
function validateAndSanitizeSearchTerm(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
        throw new Error('Search term is required and must be a string');
    }
    const sanitized = searchTerm
        .trim()
        .replace(/[<>"'&]/g, '')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .substring(0, 100);
    if (sanitized.length < 2) {
        throw new Error('Search term must be at least 2 characters long');
    }
    if (sanitized.length > 100) {
        throw new Error('Search term must be less than 100 characters');
    }
    return sanitized;
}
function generateCacheKey(filters, page, limit) {
    const filterString = JSON.stringify({
        ...filters,
        page,
        limit
    });
    return `search:${Buffer.from(filterString).toString('base64').substring(0, 50)}`;
}
function buildSearchQuery(filters, limit, offset) {
    const whereConditions = [];
    const queryValues = [];
    let paramCounter = 1;
    const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
    whereConditions.push(`(
    LOWER(name) LIKE $${paramCounter} OR 
    LOWER(description) LIKE $${paramCounter} OR
    EXISTS (
      SELECT 1 FROM unnest(ingredients) AS ingredient 
      WHERE LOWER(ingredient) LIKE $${paramCounter}
    ) OR
    LOWER(category) LIKE $${paramCounter}
  )`);
    queryValues.push(searchPattern);
    paramCounter++;
    if (filters.schoolId) {
        whereConditions.push(`schoolId = $${paramCounter}`);
        queryValues.push(filters.schoolId);
        paramCounter++;
    }
    if (filters.category) {
        whereConditions.push(`category = $${paramCounter}`);
        queryValues.push(filters.category);
        paramCounter++;
    }
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
    if (filters.isVegetarian) {
        whereConditions.push(`isVegetarian = true`);
    }
    if (filters.isVegan) {
        whereConditions.push(`isVegan = true`);
    }
    if (filters.isGlutenFree) {
        whereConditions.push(`isGlutenFree = true`);
    }
    if (filters.isDairyFree) {
        whereConditions.push(`isDairyFree = true`);
    }
    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
        whereConditions.push(`NOT (allergens && $${paramCounter})`);
        queryValues.push(filters.excludeAllergens);
        paramCounter++;
    }
    if (filters.availableDay) {
        whereConditions.push(`$${paramCounter} = ANY(availableDays)`);
        queryValues.push(filters.availableDay);
        paramCounter++;
    }
    if (filters.preparationTimeMax) {
        whereConditions.push(`preparationTime <= $${paramCounter}`);
        queryValues.push(filters.preparationTimeMax);
        paramCounter++;
    }
    if (!filters.includeInactive) {
        whereConditions.push(`isActive = true`);
    }
    const whereClause = whereConditions.join(' AND ');
    const query = `
    SELECT 
      id, name, description, category, price, schoolId,
      allergens, isVegetarian, isVegan, isGlutenFree, isDairyFree,
      ingredients, servingSize, preparationTime, availableDays,
      images, isActive,
      CASE 
        WHEN LOWER(name) LIKE $1 THEN 100
        WHEN LOWER(description) LIKE $1 THEN 75
        WHEN LOWER(category) LIKE $1 THEN 50
        WHEN EXISTS (SELECT 1 FROM unnest(ingredients) AS ingredient WHERE LOWER(ingredient) LIKE $1) THEN 25
        ELSE 10
      END as relevance_score,
      CASE 
        WHEN LOWER(name) LIKE $1 THEN 'name'
        WHEN LOWER(description) LIKE $1 THEN 'description'
        WHEN LOWER(category) LIKE $1 THEN 'category'
        ELSE 'ingredient'
      END as match_type
    FROM menu_items
    WHERE ${whereClause}
    ORDER BY relevance_score DESC, name ASC
    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
  `;
    queryValues.push(limit, offset);
    return { query, values: queryValues };
}
async function getSearchResultCount(filters) {
    const database = database_service_1.DatabaseService.getInstance();
    const whereConditions = [];
    const queryValues = [];
    let paramCounter = 1;
    const searchPattern = `%${filters.searchTerm.toLowerCase()}%`;
    whereConditions.push(`(
    LOWER(name) LIKE $${paramCounter} OR 
    LOWER(description) LIKE $${paramCounter} OR
    EXISTS (
      SELECT 1 FROM unnest(ingredients) AS ingredient 
      WHERE LOWER(ingredient) LIKE $${paramCounter}
    ) OR
    LOWER(category) LIKE $${paramCounter}
  )`);
    queryValues.push(searchPattern);
    paramCounter++;
    if (filters.schoolId) {
        whereConditions.push(`schoolId = $${paramCounter}`);
        queryValues.push(filters.schoolId);
        paramCounter++;
    }
    if (filters.category) {
        whereConditions.push(`category = $${paramCounter}`);
        queryValues.push(filters.category);
        paramCounter++;
    }
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
    if (filters.isVegetarian) {
        whereConditions.push(`isVegetarian = true`);
    }
    if (filters.isVegan) {
        whereConditions.push(`isVegan = true`);
    }
    if (filters.isGlutenFree) {
        whereConditions.push(`isGlutenFree = true`);
    }
    if (filters.isDairyFree) {
        whereConditions.push(`isDairyFree = true`);
    }
    if (filters.excludeAllergens && filters.excludeAllergens.length > 0) {
        whereConditions.push(`NOT (allergens && $${paramCounter})`);
        queryValues.push(filters.excludeAllergens);
        paramCounter++;
    }
    if (filters.availableDay) {
        whereConditions.push(`$${paramCounter} = ANY(availableDays)`);
        queryValues.push(filters.availableDay);
        paramCounter++;
    }
    if (filters.preparationTimeMax) {
        whereConditions.push(`preparationTime <= $${paramCounter}`);
        queryValues.push(filters.preparationTimeMax);
        paramCounter++;
    }
    if (!filters.includeInactive) {
        whereConditions.push(`isActive = true`);
    }
    const countQuery = `
    SELECT COUNT(*) as total
    FROM menu_items
    WHERE ${whereConditions.join(' AND ')}
  `;
    const result = await database.query(countQuery, queryValues);
    return parseInt(result.rows[0].total);
}
const searchMenuItemsHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Search menu items request started', { requestId });
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const queryParams = event.queryStringParameters || {};
        const rawSearchTerm = queryParams.q || queryParams.search;
        if (!rawSearchTerm) {
            logger.warn('Missing search term', { requestId });
            return (0, response_utils_1.createErrorResponse)('Search term is required', 400, 'MISSING_SEARCH_TERM');
        }
        let searchTerm;
        try {
            searchTerm = validateAndSanitizeSearchTerm(rawSearchTerm);
        }
        catch (error) {
            logger.warn('Invalid search term', { requestId, error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) });
            return (0, response_utils_1.createErrorResponse)(error instanceof Error ? error.message : String(error), 400, 'INVALID_SEARCH_TERM');
        }
        const page = Math.max(1, parseInt(queryParams.page || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit || '20')));
        const offset = (page - 1) * limit;
        const filters = {
            searchTerm,
            category: queryParams.category,
            schoolId: queryParams.schoolId,
            minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined,
            maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined,
            isVegetarian: queryParams.isVegetarian === 'true',
            isVegan: queryParams.isVegan === 'true',
            isGlutenFree: queryParams.isGlutenFree === 'true',
            isDairyFree: queryParams.isDairyFree === 'true',
            availableDay: queryParams.availableDay,
            preparationTimeMax: queryParams.preparationTimeMax ? parseInt(queryParams.preparationTimeMax) : undefined,
            includeInactive: queryParams.includeInactive === 'true'
        };
        if (queryParams.excludeAllergens) {
            filters.excludeAllergens = queryParams.excludeAllergens.split(',').map(a => a.trim().toLowerCase());
        }
        logger.info('Processing search menu items request', {
            requestId,
            searchTerm: filters.searchTerm,
            filters: {
                category: filters.category,
                schoolId: filters.schoolId,
                priceRange: filters.minPrice || filters.maxPrice ? `${filters.minPrice || 0}-${filters.maxPrice || '∞'}` : undefined,
                dietary: {
                    vegetarian: filters.isVegetarian,
                    vegan: filters.isVegan,
                    glutenFree: filters.isGlutenFree,
                    dairyFree: filters.isDairyFree
                }
            },
            page,
            limit
        });
        const redis = redis_service_1.RedisService;
        const cacheKey = generateCacheKey(filters, page, limit);
        let cachedResult;
        try {
            cachedResult = await redis.get(cacheKey);
            if (cachedResult) {
                logger.info('Returning cached search results', { requestId, cacheKey });
                return (0, response_utils_1.createSuccessResponse)(JSON.parse(cachedResult));
            }
        }
        catch (cacheError) {
            logger.warn('Cache retrieval failed, proceeding with database query', {
                requestId,
                error: cacheError.message
            });
        }
        const { query, values } = buildSearchQuery(filters, limit, offset);
        const database = database_service_1.DatabaseService.getInstance();
        const [searchResults, totalCount] = await Promise.all([
            database.query(query, values),
            getSearchResultCount(filters)
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        const results = searchResults.rows.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            price: row.price,
            schoolId: row.schoolId,
            allergens: row.allergens,
            isVegetarian: row.isVegetarian,
            isVegan: row.isVegan,
            isGlutenFree: row.isGlutenFree,
            isDairyFree: row.isDairyFree,
            ingredients: row.ingredients,
            servingSize: row.servingSize,
            preparationTime: row.preparationTime,
            availableDays: row.availableDays,
            images: row.images,
            isActive: row.isActive,
            relevanceScore: row.relevance_score,
            matchType: row.match_type
        }));
        const response = {
            data: {
                results,
                search: {
                    term: filters.searchTerm,
                    totalResults: totalCount,
                    resultsOnPage: results.length,
                    filters: {
                        category: filters.category,
                        schoolId: filters.schoolId,
                        priceRange: filters.minPrice || filters.maxPrice ? {
                            min: filters.minPrice,
                            max: filters.maxPrice
                        } : undefined,
                        dietary: {
                            vegetarian: filters.isVegetarian,
                            vegan: filters.isVegan,
                            glutenFree: filters.isGlutenFree,
                            dairyFree: filters.isDairyFree
                        },
                        excludeAllergens: filters.excludeAllergens,
                        availableDay: filters.availableDay,
                        maxPreparationTime: filters.preparationTimeMax
                    }
                },
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            },
            message: `Found ${totalCount} menu items matching "${filters.searchTerm}"`
        };
        try {
            await redis.setex(cacheKey, 300, JSON.stringify(response));
        }
        catch (cacheError) {
            logger.warn('Failed to cache search results', {
                requestId,
                error: cacheError.message
            });
        }
        const duration = Date.now() - startTime;
        logger.info('Search menu items completed successfully', {
            requestId,
            searchTerm: filters.searchTerm,
            totalResults: totalCount,
            resultsOnPage: results.length,
            duration: `${duration}ms`
        });
        return (0, response_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Search menu items request failed', {
            requestId,
            searchTerm: event.queryStringParameters?.q || event.queryStringParameters?.search,
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            duration: `${duration}ms`
        });
        return (0, response_utils_1.handleError)(error, 'Failed to search menu items');
    }
};
exports.searchMenuItemsHandler = searchMenuItemsHandler;
//# sourceMappingURL=searchMenuItems.js.map