/**
 * Create Menu Item Lambda Function
 * Handles: POST /menu/items
 * Implements Story 2.1: Product Catalog Foundation - Menu Item Creation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '../../shared/response.utils';
import { databaseService } from '../../shared/database.service';
import { validateMenuItem } from '../../utils/validation';

/**
 * Menu item creation interface
 */
interface CreateMenuItemInput {
  name: string;
  description: string;
  category: string;
  price: number;
  schoolId: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  ingredients: string[];
  servingSize: string;
  preparationTime: number;
  availableDays: string[];
  customizations: Array<{
    name: string;
    options: string[];
    priceModifier: number;
  }>;
  images: string[];
  isActive: boolean;
}

/**
 * Create Menu Item Lambda Function Handler
 * Creates a new menu item with validation
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('createMenuItemHandler started', { requestId: context.awsRequestId, httpMethod: event.httpMethod });

  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse(
        'Method not allowed',
        405,
        'METHOD_NOT_ALLOWED'
      );
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    logger.info('Processing create menu item request', { body });

    // Validate input data
    const validation = validateMenuItem(body);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed',
        400,
        'VALIDATION_FAILED'
      );
    }

    const menuItemData: CreateMenuItemInput = body;
    const db = databaseService.getPrismaClient();

    // Check if menu item with same name exists for this school
    const existingItem = await db.menuItem.findFirst({
      where: {
        name: menuItemData.name,
        schoolId: menuItemData.schoolId,
        available: true
      }
    });

    if (existingItem) {
      return createErrorResponse(
        'Menu item with this name already exists for this school',
        409,
        'MENU_ITEM_EXISTS'
      );
    }

    // Validate school exists
    const school = await db.school.findUnique({
      where: { id: menuItemData.schoolId },
      select: { id: true, isActive: true }
    });

    if (!school) {
      return createErrorResponse(
        'School not found',
        404,
        'SCHOOL_NOT_FOUND'
      );
    }

    if (!school.isActive) {
      return createErrorResponse(
        'School is not active',
        400,
        'SCHOOL_INACTIVE'
      );
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
    logger.info('createMenuItemHandler completed successfully', { requestId: context.awsRequestId, statusCode: 201, duration });
    logger.info('Menu item created successfully', { menuItemId: createdMenuItem.id });

    // Parse stored metadata for response
    let storedMetadata = {};
    try {
      storedMetadata = JSON.parse(createdMenuItem.metadata);
    } catch (e) {
      storedMetadata = {};
    }

    return createSuccessResponse({
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

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('createMenuItemHandler failed', { requestId: context.awsRequestId, statusCode: 500, duration, error: error.message });
    return handleError(error, 'Failed to create menu item');
  }
};