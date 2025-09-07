"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MENU_SAFE_PATTERNS = exports.menuItemAvailabilitySchema = exports.bulkMenuItemImportSchema = exports.menuItemIdSchema = exports.menuItemQuerySchema = exports.updateMenuItemSchema = exports.createMenuItemSchema = exports.ALLERGEN_TYPES = exports.SPICE_LEVELS = exports.DIETARY_TYPES = exports.MENU_CATEGORIES = void 0;
/**
 * HASIVU Platform - Menu Item Validation Schemas
 * Input validation schemas for menu item operations
 * Implements Story 2.1: Product Catalog Foundation
 * ReDoS Protection: All regex patterns use safe constructs with bounded quantifiers
 */
const joi_1 = require("joi");
const userSchemas_1 = require("./userSchemas");
// Menu categories as string constants
exports.MENU_CATEGORIES = ['BREAKFAST', 'LUNCH', 'SNACK', 'BEVERAGE', 'DESSERT', 'SPECIAL'];
// Dietary types
exports.DIETARY_TYPES = ['VEG', 'NON_VEG', 'VEGAN', 'JAIN'];
// Spice levels
exports.SPICE_LEVELS = ['MILD', 'MEDIUM', 'SPICY', 'EXTRA_SPICY'];
// Allergen types
exports.ALLERGEN_TYPES = [
    'MILK', 'EGGS', 'FISH', 'SHELLFISH', 'TREE_NUTS', 'PEANUTS',
    'WHEAT', 'SOYBEANS', 'SESAME', 'SULPHITES', 'MUSTARD', 'CELERY'
];
// Safe patterns for menu validation with ReDoS protection
const MENU_SAFE_PATTERNS = {
    // Menu name: Alphanumeric with common punctuation, bounded length
    menuName: /^[a-zA-Z0-9\s\-\(\)&,'.]{1,100}$/,
    // Description: Extended character set for food descriptions
    description: /^[a-zA-Z0-9\s\-\(\)&,'.!?\n\r]{1,500}$/,
    // Image URL: Basic URL validation with safe characters
    imageUrl: /^https?:\/\/[a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=]{1,500}$/,
    // Tag: Simple alphanumeric with underscore
    tag: /^[a-zA-Z0-9_]{1,50}$/,
    // Portion size: Alphanumeric with common units
    portionSize: /^[a-zA-Z0-9\s.]{1,50}$/,
    // Currency: ISO currency codes
    currency: /^[A-Z]{3}$/,
    // Vendor code: Alphanumeric identifier
    vendorCode: /^[A-Z0-9]{4,20}$/
};
exports.MENU_SAFE_PATTERNS = MENU_SAFE_PATTERNS;
/**
 * Create Menu Item Schema
 */
exports.createMenuItemSchema = joi_1.default.object({
    name: joi_1.default.string()
        .required()
        .max(100)
        .trim()
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.menuName.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .messages({
        'string.pattern.base': 'Menu name contains invalid characters or exceeds length limit'
    }),
    description: joi_1.default.string()
        .optional()
        .max(500)
        .trim()
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.description.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .messages({
        'string.pattern.base': 'Description contains invalid characters or exceeds length limit'
    }),
    category: joi_1.default.string()
        .valid(...exports.MENU_CATEGORIES)
        .required(),
    dietaryType: joi_1.default.string()
        .valid(...exports.DIETARY_TYPES)
        .required(),
    spiceLevel: joi_1.default.string()
        .valid(...exports.SPICE_LEVELS)
        .default('MILD'),
    price: joi_1.default.number()
        .positive()
        .precision(2)
        .max(9999.99)
        .required(),
    originalPrice: joi_1.default.number()
        .positive()
        .precision(2)
        .max(9999.99)
        .greater(joi_1.default.ref('price'))
        .optional(),
    currency: joi_1.default.string()
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.currency.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .default('INR')
        .messages({
        'string.pattern.base': 'Invalid currency code format'
    }),
    available: joi_1.default.boolean().default(true),
    featured: joi_1.default.boolean().default(false),
    imageUrl: joi_1.default.string()
        .uri({ scheme: ['http', 'https'] })
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.imageUrl.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .optional()
        .messages({
        'string.pattern.base': 'Invalid image URL format'
    }),
    // Nutritional information
    nutritionalInfo: joi_1.default.object({
        calories: joi_1.default.number().min(0).max(9999).optional(),
        protein: joi_1.default.number().min(0).max(999).optional(),
        carbs: joi_1.default.number().min(0).max(999).optional(),
        fat: joi_1.default.number().min(0).max(999).optional(),
        fiber: joi_1.default.number().min(0).max(999).optional(),
        sugar: joi_1.default.number().min(0).max(999).optional(),
        sodium: joi_1.default.number().min(0).max(9999).optional()
    }).optional(),
    allergens: joi_1.default.array()
        .items(joi_1.default.string()
        .valid(...exports.ALLERGEN_TYPES))
        .unique()
        .default([]),
    tags: joi_1.default.array()
        .items(joi_1.default.string()
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.tag.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .messages({
        'string.pattern.base': 'Invalid tag format'
    }))
        .unique()
        .max(10)
        .default([]),
    preparationTime: joi_1.default.number()
        .integer()
        .min(1)
        .max(180)
        .optional()
        .messages({
        'number.min': 'Preparation time must be at least 1 minute',
        'number.max': 'Preparation time cannot exceed 180 minutes'
    }),
    portionSize: joi_1.default.string()
        .custom((value, helpers) => {
        if (!MENU_SAFE_PATTERNS.portionSize.test(value)) {
            return helpers.error('string.pattern.base');
        }
        return value;
    })
        .optional()
        .messages({
        'string.pattern.base': 'Invalid portion size format'
    }),
    schoolId: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, userSchemas_1.safeRegexValidator)(value, userSchemas_1.SAFE_PATTERNS.uuid, helpers);
    })
        .optional(),
    vendorId: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, userSchemas_1.safeRegexValidator)(value, userSchemas_1.SAFE_PATTERNS.uuid, helpers);
    })
        .optional(),
    sortOrder: joi_1.default.number()
        .integer()
        .min(0)
        .max(9999)
        .default(0),
    // Age appropriateness
    minGrade: joi_1.default.number().integer().min(1).max(12).default(1),
    maxGrade: joi_1.default.number().integer().min(1).max(12).default(12),
    // Availability timing
    availableFrom: joi_1.default.string().isoDate().optional(),
    availableUntil: joi_1.default.string().isoDate().optional(),
    // Inventory tracking
    maxQuantityPerDay: joi_1.default.number().integer().min(1).optional(),
    maxQuantityPerStudent: joi_1.default.number().integer().min(1).max(10).default(2),
    metadata: joi_1.default.object().optional()
}).custom((value, helpers) => {
    // Validate grade range
    if (value.minGrade > value.maxGrade) {
        return helpers.error('object.invalid', { message: 'minGrade cannot be greater than maxGrade' });
    }
    // Validate availability dates
    if (value.availableFrom && value.availableUntil) {
        if (new Date(value.availableFrom) >= new Date(value.availableUntil)) {
            return helpers.error('object.invalid', { message: 'availableFrom must be before availableUntil' });
        }
    }
    return value;
});
/**
 * Update Menu Item Schema - allows partial updates
 */
exports.updateMenuItemSchema = joi_1.default.object({
    name: exports.createMenuItemSchema.extract('name').optional(),
    description: exports.createMenuItemSchema.extract('description'),
    category: exports.createMenuItemSchema.extract('category').optional(),
    dietaryType: exports.createMenuItemSchema.extract('dietaryType').optional(),
    spiceLevel: exports.createMenuItemSchema.extract('spiceLevel').optional(),
    price: exports.createMenuItemSchema.extract('price').optional(),
    originalPrice: exports.createMenuItemSchema.extract('originalPrice'),
    currency: exports.createMenuItemSchema.extract('currency').optional(),
    available: exports.createMenuItemSchema.extract('available').optional(),
    featured: exports.createMenuItemSchema.extract('featured').optional(),
    imageUrl: exports.createMenuItemSchema.extract('imageUrl'),
    nutritionalInfo: exports.createMenuItemSchema.extract('nutritionalInfo'),
    allergens: exports.createMenuItemSchema.extract('allergens').optional(),
    tags: exports.createMenuItemSchema.extract('tags').optional(),
    preparationTime: exports.createMenuItemSchema.extract('preparationTime'),
    portionSize: exports.createMenuItemSchema.extract('portionSize'),
    sortOrder: exports.createMenuItemSchema.extract('sortOrder').optional(),
    minGrade: exports.createMenuItemSchema.extract('minGrade').optional(),
    maxGrade: exports.createMenuItemSchema.extract('maxGrade').optional(),
    availableFrom: exports.createMenuItemSchema.extract('availableFrom'),
    availableUntil: exports.createMenuItemSchema.extract('availableUntil'),
    maxQuantityPerDay: exports.createMenuItemSchema.extract('maxQuantityPerDay'),
    maxQuantityPerStudent: exports.createMenuItemSchema.extract('maxQuantityPerStudent').optional(),
    metadata: exports.createMenuItemSchema.extract('metadata')
}).min(1).custom((value, helpers) => {
    // Validate grade range
    if (value.minGrade && value.maxGrade && value.minGrade > value.maxGrade) {
        return helpers.error('object.invalid', { message: 'minGrade cannot be greater than maxGrade' });
    }
    // Validate availability dates
    if (value.availableFrom && value.availableUntil) {
        if (new Date(value.availableFrom) >= new Date(value.availableUntil)) {
            return helpers.error('object.invalid', { message: 'availableFrom must be before availableUntil' });
        }
    }
    return value;
});
/**
 * Menu Item Query Schema for filtering and searching
 */
exports.menuItemQuerySchema = joi_1.default.object({
    category: joi_1.default.string().valid(...exports.MENU_CATEGORIES).optional(),
    dietaryType: joi_1.default.string().valid(...exports.DIETARY_TYPES).optional(),
    spiceLevel: joi_1.default.string().valid(...exports.SPICE_LEVELS).optional(),
    available: joi_1.default.boolean().optional(),
    featured: joi_1.default.boolean().optional(),
    schoolId: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, userSchemas_1.safeRegexValidator)(value, userSchemas_1.SAFE_PATTERNS.uuid, helpers);
    })
        .optional(),
    vendorId: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, userSchemas_1.safeRegexValidator)(value, userSchemas_1.SAFE_PATTERNS.uuid, helpers);
    })
        .optional(),
    grade: joi_1.default.number().integer().min(1).max(12).optional(),
    minPrice: joi_1.default.number().min(0).optional(),
    maxPrice: joi_1.default.number().min(0).optional(),
    allergenFree: joi_1.default.array().items(joi_1.default.string().valid(...exports.ALLERGEN_TYPES)).optional(),
    search: joi_1.default.string().max(255).trim().optional(),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional(),
    // Pagination
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string()
        .valid('createdAt', 'updatedAt', 'name', 'price', 'category', 'featured', 'sortOrder')
        .default('sortOrder'),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('asc')
}).custom((value, helpers) => {
    // Validate price range
    if (value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
        return helpers.error('object.invalid', { message: 'minPrice cannot be greater than maxPrice' });
    }
    return value;
});
/**
 * Menu Item ID validation
 */
exports.menuItemIdSchema = joi_1.default.object({
    id: joi_1.default.string()
        .custom((value, helpers) => {
        return (0, userSchemas_1.safeRegexValidator)(value, userSchemas_1.SAFE_PATTERNS.uuid, helpers);
    })
        .required()
});
/**
 * Bulk menu item import schema
 */
exports.bulkMenuItemImportSchema = joi_1.default.object({
    items: joi_1.default.array()
        .items(exports.createMenuItemSchema)
        .min(1)
        .max(100)
        .custom((value, helpers) => {
        // Check for duplicate names within the batch
        const names = value.map((item) => item.name.toLowerCase());
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            return helpers.error('array.unique', { message: 'Duplicate menu item names found in batch' });
        }
        return value;
    })
        .required()
});
/**
 * Menu item availability update schema
 */
exports.menuItemAvailabilitySchema = joi_1.default.object({
    available: joi_1.default.boolean().required(),
    availableFrom: joi_1.default.string().isoDate().optional(),
    availableUntil: joi_1.default.string().isoDate().optional(),
    maxQuantityPerDay: joi_1.default.number().integer().min(1).optional()
});
exports.default = {
    createMenuItemSchema: exports.createMenuItemSchema,
    updateMenuItemSchema: exports.updateMenuItemSchema,
    menuItemQuerySchema: exports.menuItemQuerySchema,
    menuItemIdSchema: exports.menuItemIdSchema,
    bulkMenuItemImportSchema: exports.bulkMenuItemImportSchema,
    menuItemAvailabilitySchema: exports.menuItemAvailabilitySchema,
    MENU_CATEGORIES: exports.MENU_CATEGORIES,
    DIETARY_TYPES: exports.DIETARY_TYPES,
    SPICE_LEVELS: exports.SPICE_LEVELS,
    ALLERGEN_TYPES: exports.ALLERGEN_TYPES,
    MENU_SAFE_PATTERNS
};
