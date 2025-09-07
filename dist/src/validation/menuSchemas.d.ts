import Joi from 'joi';
export declare const MENU_CATEGORIES: readonly ["BREAKFAST", "LUNCH", "SNACK", "BEVERAGE", "DESSERT", "SPECIAL"];
export type MenuCategory = typeof MENU_CATEGORIES[number];
export declare const DIETARY_TYPES: readonly ["VEG", "NON_VEG", "VEGAN", "JAIN"];
export type DietaryType = typeof DIETARY_TYPES[number];
export declare const SPICE_LEVELS: readonly ["MILD", "MEDIUM", "SPICY", "EXTRA_SPICY"];
export type SpiceLevel = typeof SPICE_LEVELS[number];
export declare const ALLERGEN_TYPES: readonly ["MILK", "EGGS", "FISH", "SHELLFISH", "TREE_NUTS", "PEANUTS", "WHEAT", "SOYBEANS", "SESAME", "SULPHITES", "MUSTARD", "CELERY"];
export type AllergenType = typeof ALLERGEN_TYPES[number];
declare const MENU_SAFE_PATTERNS: {
    menuName: RegExp;
    description: RegExp;
    imageUrl: RegExp;
    tag: RegExp;
    portionSize: RegExp;
    currency: RegExp;
    vendorCode: RegExp;
};
export declare const createMenuItemSchema: Joi.ObjectSchema<any>;
export declare const updateMenuItemSchema: Joi.ObjectSchema<any>;
export declare const menuItemQuerySchema: Joi.ObjectSchema<any>;
export declare const menuItemIdSchema: Joi.ObjectSchema<any>;
export declare const bulkMenuItemImportSchema: Joi.ObjectSchema<any>;
export declare const menuItemAvailabilitySchema: Joi.ObjectSchema<any>;
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
export interface UpdateMenuItemSchema extends Partial<CreateMenuItemSchema> {
}
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
export { MENU_SAFE_PATTERNS };
declare const _default: {
    createMenuItemSchema: Joi.ObjectSchema<any>;
    updateMenuItemSchema: Joi.ObjectSchema<any>;
    menuItemQuerySchema: Joi.ObjectSchema<any>;
    menuItemIdSchema: Joi.ObjectSchema<any>;
    bulkMenuItemImportSchema: Joi.ObjectSchema<any>;
    menuItemAvailabilitySchema: Joi.ObjectSchema<any>;
    MENU_CATEGORIES: readonly ["BREAKFAST", "LUNCH", "SNACK", "BEVERAGE", "DESSERT", "SPECIAL"];
    DIETARY_TYPES: readonly ["VEG", "NON_VEG", "VEGAN", "JAIN"];
    SPICE_LEVELS: readonly ["MILD", "MEDIUM", "SPICY", "EXTRA_SPICY"];
    ALLERGEN_TYPES: readonly ["MILK", "EGGS", "FISH", "SHELLFISH", "TREE_NUTS", "PEANUTS", "WHEAT", "SOYBEANS", "SESAME", "SULPHITES", "MUSTARD", "CELERY"];
    MENU_SAFE_PATTERNS: {
        menuName: RegExp;
        description: RegExp;
        imageUrl: RegExp;
        tag: RegExp;
        portionSize: RegExp;
        currency: RegExp;
        vendorCode: RegExp;
    };
};
export default _default;
//# sourceMappingURL=menuSchemas.d.ts.map