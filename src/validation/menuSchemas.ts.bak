/**
 * HASIVU Platform - Menu Item Validation Schemas
 * Input validation schemas for menu item operations
 * Implements Story 2.1: Product Catalog Foundation
 * ReDoS Protection: All regex patterns use safe constructs with bounded quantifiers
 */
import Joi from 'joi';
import { safeRegexValidator, SAFE_PATTERNS } from './userSchemas';

// Menu categories as string constants
export const MENU_CATEGORIES = ['BREAKFAST', 'LUNCH', 'SNACK', 'BEVERAGE', 'DESSERT', 'SPECIAL'] as const;
export type MenuCategory = typeof MENU_CATEGORIES[number];

// Dietary types
export const DIETARY_TYPES = ['VEG', 'NON_VEG', 'VEGAN', 'JAIN'] as const;
export type DietaryType = typeof DIETARY_TYPES[number];

// Spice levels
export const SPICE_LEVELS = ['MILD', 'MEDIUM', 'SPICY', 'EXTRA_SPICY'] as const;
export type SpiceLevel = typeof SPICE_LEVELS[number];

// Allergen types
export const ALLERGEN_TYPES = [
  'MILK', 'EGGS', 'FISH', 'SHELLFISH', 'TREE_NUTS', 'PEANUTS',
  'WHEAT', 'SOYBEANS', 'SESAME', 'SULPHITES', 'MUSTARD', 'CELERY'
] as const;
export type AllergenType = typeof ALLERGEN_TYPES[number];

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

/**
 * Create Menu Item Schema
 */
export const createMenuItemSchema = Joi.object({
  name: Joi.string()
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
  
  description: Joi.string()
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
  
  category: Joi.string()
    .valid(...MENU_CATEGORIES)
    .required(),
  
  dietaryType: Joi.string()
    .valid(...DIETARY_TYPES)
    .required(),
  
  spiceLevel: Joi.string()
    .valid(...SPICE_LEVELS)
    .default('MILD'),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .max(9999.99)
    .required(),
  
  originalPrice: Joi.number()
    .positive()
    .precision(2)
    .max(9999.99)
    .greater(Joi.ref('price'))
    .optional(),
  
  currency: Joi.string()
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
  
  available: Joi.boolean().default(true),
  featured: Joi.boolean().default(false),
  
  imageUrl: Joi.string()
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
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0).max(9999).optional(),
    protein: Joi.number().min(0).max(999).optional(),
    carbs: Joi.number().min(0).max(999).optional(),
    fat: Joi.number().min(0).max(999).optional(),
    fiber: Joi.number().min(0).max(999).optional(),
    sugar: Joi.number().min(0).max(999).optional(),
    sodium: Joi.number().min(0).max(9999).optional()
  }).optional(),
  
  allergens: Joi.array()
    .items(
      Joi.string()
        .valid(...ALLERGEN_TYPES)
    )
    .unique()
    .default([]),
  
  tags: Joi.array()
    .items(
      Joi.string()
        .custom((value, helpers) => {
          if (!MENU_SAFE_PATTERNS.tag.test(value)) {
            return helpers.error('string.pattern.base');
          }
          return value;
        })
        .messages({
          'string.pattern.base': 'Invalid tag format'
        })
    )
    .unique()
    .max(10)
    .default([]),
  
  preparationTime: Joi.number()
    .integer()
    .min(1)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Preparation time must be at least 1 minute',
      'number.max': 'Preparation time cannot exceed 180 minutes'
    }),
  
  portionSize: Joi.string()
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
  
  schoolId: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .optional(),
  
  vendorId: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .optional(),
  
  sortOrder: Joi.number()
    .integer()
    .min(0)
    .max(9999)
    .default(0),
  
  // Age appropriateness
  minGrade: Joi.number().integer().min(1).max(12).default(1),
  maxGrade: Joi.number().integer().min(1).max(12).default(12),
  
  // Availability timing
  availableFrom: Joi.string().isoDate().optional(),
  availableUntil: Joi.string().isoDate().optional(),
  
  // Inventory tracking
  maxQuantityPerDay: Joi.number().integer().min(1).optional(),
  maxQuantityPerStudent: Joi.number().integer().min(1).max(10).default(2),
  
  metadata: Joi.object().optional()
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
export const updateMenuItemSchema = Joi.object({
  name: createMenuItemSchema.extract('name').optional(),
  description: createMenuItemSchema.extract('description'),
  category: createMenuItemSchema.extract('category').optional(),
  dietaryType: createMenuItemSchema.extract('dietaryType').optional(),
  spiceLevel: createMenuItemSchema.extract('spiceLevel').optional(),
  price: createMenuItemSchema.extract('price').optional(),
  originalPrice: createMenuItemSchema.extract('originalPrice'),
  currency: createMenuItemSchema.extract('currency').optional(),
  available: createMenuItemSchema.extract('available').optional(),
  featured: createMenuItemSchema.extract('featured').optional(),
  imageUrl: createMenuItemSchema.extract('imageUrl'),
  nutritionalInfo: createMenuItemSchema.extract('nutritionalInfo'),
  allergens: createMenuItemSchema.extract('allergens').optional(),
  tags: createMenuItemSchema.extract('tags').optional(),
  preparationTime: createMenuItemSchema.extract('preparationTime'),
  portionSize: createMenuItemSchema.extract('portionSize'),
  sortOrder: createMenuItemSchema.extract('sortOrder').optional(),
  minGrade: createMenuItemSchema.extract('minGrade').optional(),
  maxGrade: createMenuItemSchema.extract('maxGrade').optional(),
  availableFrom: createMenuItemSchema.extract('availableFrom'),
  availableUntil: createMenuItemSchema.extract('availableUntil'),
  maxQuantityPerDay: createMenuItemSchema.extract('maxQuantityPerDay'),
  maxQuantityPerStudent: createMenuItemSchema.extract('maxQuantityPerStudent').optional(),
  metadata: createMenuItemSchema.extract('metadata')
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
export const menuItemQuerySchema = Joi.object({
  category: Joi.string().valid(...MENU_CATEGORIES).optional(),
  dietaryType: Joi.string().valid(...DIETARY_TYPES).optional(),
  spiceLevel: Joi.string().valid(...SPICE_LEVELS).optional(),
  available: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  schoolId: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .optional(),
  
  vendorId: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .optional(),
  
  grade: Joi.number().integer().min(1).max(12).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  allergenFree: Joi.array().items(Joi.string().valid(...ALLERGEN_TYPES)).optional(),
  search: Joi.string().max(255).trim().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'name', 'price', 'category', 'featured', 'sortOrder')
    .default('sortOrder'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
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
export const menuItemIdSchema = Joi.object({
  id: Joi.string()
    .custom((value, helpers) => {
      return safeRegexValidator(value, SAFE_PATTERNS.uuid, helpers);
    })
    .required()
});

/**
 * Bulk menu item import schema
 */
export const bulkMenuItemImportSchema = Joi.object({
  items: Joi.array()
    .items(createMenuItemSchema)
    .min(1)
    .max(100)
    .custom((value, helpers) => {
      // Check for duplicate names within the batch
      const names = value.map((item: any) => item.name.toLowerCase());
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
export const menuItemAvailabilitySchema = Joi.object({
  available: Joi.boolean().required(),
  availableFrom: Joi.string().isoDate().optional(),
  availableUntil: Joi.string().isoDate().optional(),
  maxQuantityPerDay: Joi.number().integer().min(1).optional()
});

// Export interfaces for TypeScript
export interface CreateMenuItemSchema {
  name: string;
  description?: string;
  category: MenuCategory;
  dietaryType: DietaryType;
  spiceLevel?: SpiceLevel;
  price: number;
  originalPrice?: number;
  currency?: string;
  available?: boolean;
  featured?: boolean;
  imageUrl?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  allergens?: AllergenType[];
  tags?: string[];
  preparationTime?: number;
  portionSize?: string;
  schoolId?: string;
  vendorId?: string;
  sortOrder?: number;
  minGrade?: number;
  maxGrade?: number;
  availableFrom?: string;
  availableUntil?: string;
  maxQuantityPerDay?: number;
  maxQuantityPerStudent?: number;
  metadata?: Record<string, any>;
}

export interface UpdateMenuItemSchema extends Partial<CreateMenuItemSchema> {}

export interface MenuItemQuerySchema {
  category?: MenuCategory;
  dietaryType?: DietaryType;
  spiceLevel?: SpiceLevel;
  available?: boolean;
  featured?: boolean;
  schoolId?: string;
  vendorId?: string;
  grade?: number;
  minPrice?: number;
  maxPrice?: number;
  allergenFree?: AllergenType[];
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Export safe patterns for reuse
export { MENU_SAFE_PATTERNS };

export default {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuItemQuerySchema,
  menuItemIdSchema,
  bulkMenuItemImportSchema,
  menuItemAvailabilitySchema,
  MENU_CATEGORIES,
  DIETARY_TYPES,
  SPICE_LEVELS,
  ALLERGEN_TYPES,
  MENU_SAFE_PATTERNS
};