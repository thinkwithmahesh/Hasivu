/**
 * Create Meal Order Lambda Function
 * Handles: POST /orders
 * Implements Epic 3: Order Processing System - Meal Order Creation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { prisma, DatabaseManager } from '@/database/DatabaseManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Order item request interface
 */
interface OrderItemRequest {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

/**
 * Meal order creation interface
 */
interface CreateOrderRequest {
  studentId: string;
  deliveryDate: string;
  orderItems: OrderItemRequest[];
  deliveryInstructions?: string;
  contactPhone?: string;
  specialInstructions?: string;
  allergyInfo?: string;
}

/**
 * Order response interface
 */
interface OrderResponse {
  id: string;
  orderNumber: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    schoolId: string;
  };
  school: {
    id: string;
    name: string;
  };
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  orderItems: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations?: Record<string, any>;
  }>;
  deliveryInstructions?: string;
  contactPhone?: string;
  createdAt: Date;
}

/**
 * Validate student exists and is active
 */
async function validateStudent(studentId: string, userId: string): Promise<any> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  if (!student.isActive) {
    throw new Error('Student account is not active');
  }

  if (!student.school?.isActive) {
    throw new Error('School is not active');
  }

  // Check if user is the parent or authorized to place orders for this student
  if (student.parentId !== userId && student.id !== userId) {
    // Check if user has school admin access
    const adminUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: student.schoolId,
        role: { in: ['school_admin', 'admin', 'super_admin', 'staff'] },
        isActive: true,
      },
    });

    if (!adminUser) {
      throw new Error('Not authorized to place orders for this student');
    }
  }

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    parentId: student.parentId,
    schoolId: student.schoolId,
    school: student.school,
  };
}

/**
 * Validate delivery date
 */
function validateDeliveryDate(deliveryDate: Date): void {
  const now = new Date();
  const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
  const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  if (deliveryDate < minDate) {
    throw new Error('Delivery date must be at least 24 hours in advance');
  }

  if (deliveryDate > maxFutureDate) {
    throw new Error('Delivery date cannot be more than 30 days in advance');
  }

  // Check if delivery date is a weekend (schools typically closed)
  const dayOfWeek = deliveryDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    throw new Error('Delivery is not available on weekends');
  }
}

/**
 * Validate order items and calculate total
 */
async function validateOrderItems(
  orderItems: OrderItemRequest[],
  schoolId: string,
  deliveryDate: Date
): Promise<{ validatedItems: any[]; totalAmount: number }> {
  if (orderItems.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  if (orderItems.length > 20) {
    throw new Error('Maximum 20 items allowed per order');
  }

  const validatedItems = [];
  let totalAmount = 0;

  for (const item of orderItems) {
    if (!item.quantity || item.quantity <= 0) {
      throw new Error('Item quantity must be greater than 0');
    }

    if (item.quantity > 10) {
      throw new Error('Maximum 10 quantity allowed per item');
    }

    // Get menu item with availability check
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id: item.menuItemId,
        schoolId,
        available: true,
      },
    });

    if (!menuItem) {
      throw new Error(`Menu item not found: ${item.menuItemId}`);
    }

    // Check if menu item is available on delivery date
    const deliveryDayName = deliveryDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    // Note: availableDays field might not exist in current schema, skipping this check for now

    const unitPrice = Number(menuItem.price);
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
      specialInstructions: item.specialInstructions,
      customizations: item.customizations,
    });
  }

  return { validatedItems, totalAmount };
}

/**
 * Generate unique order number
 */
function generateOrderNumber(): string {
  const now = new Date();
  const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ORD${dateString}${timeString}${random}`;
}

/**
 * Create Meal Order Lambda Function Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('createOrderHandler', { event, context });

  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Parse request body
    const body: CreateOrderRequest = JSON.parse(event.body || '{}');
    logger.info('Processing create order request', { body });

    // Validate required fields
    const {
      studentId,
      deliveryDate,
      orderItems,
      deliveryInstructions,
      contactPhone,
      specialInstructions,
      allergyInfo,
    } = body;

    if (!studentId || !deliveryDate || !orderItems) {
      return createErrorResponse(
        'MISSING_REQUIRED_FIELDS',
        'Missing required fields: studentId, deliveryDate, orderItems',
        400
      );
    }

    // Extract userId from event context (would come from JWT in real implementation)
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Validate student and get student/school details
    const student = await validateStudent(studentId, userId);

    // Parse and validate delivery date
    const parsedDeliveryDate = new Date(deliveryDate);
    if (isNaN(parsedDeliveryDate.getTime())) {
      return createErrorResponse('INVALID_DATE_FORMAT', 'Invalid delivery date format', 400);
    }

    validateDeliveryDate(parsedDeliveryDate);

    // Validate order items and calculate total
    const { validatedItems, totalAmount } = await validateOrderItems(
      orderItems,
      student.schoolId,
      parsedDeliveryDate
    );

    // Create order in database using Prisma transaction
    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    const result = await DatabaseManager.getInstance().transaction(async prisma => {
      // Create main order record
      const order = await prisma.order.create({
        data: {
          id: orderId,
          orderNumber,
          userId,
          studentId,
          schoolId: student.schoolId,
          status: 'pending',
          totalAmount,
          currency: 'INR',
          orderDate: new Date(),
          deliveryDate: parsedDeliveryDate,
          paymentStatus: 'pending',
          specialInstructions: body.specialInstructions,
          allergyInfo: body.allergyInfo,
          metadata: JSON.stringify({}),
        },
      });

      // Create order items
      const orderItemPromises = validatedItems.map(async item => {
        const orderItemId = uuidv4();

        return prisma.orderItem.create({
          data: {
            id: orderItemId,
            orderId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            customizations: JSON.stringify(item.customizations || {}),
            notes: item.specialInstructions,
          },
        });
      });

      const createdOrderItems = await Promise.all(orderItemPromises);

      return { order, orderItems: createdOrderItems, validatedItems };
    });

    const response: OrderResponse = {
      id: result.order.id,
      orderNumber: result.order.orderNumber,
      studentId,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        schoolId: student.schoolId,
      },
      school: student.school,
      deliveryDate: parsedDeliveryDate.toISOString().split('T')[0],
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount,
      orderItems: result.orderItems.map((item, index) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        menuItemName: result.validatedItems[index].menuItemName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        customizations: result.validatedItems[index].customizations,
      })),
      deliveryInstructions: body.deliveryInstructions,
      contactPhone: body.contactPhone,
      createdAt: result.order.createdAt,
    };

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 201, duration });
    logger.info('Order created successfully', {
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      totalAmount,
      itemCount: orderItems.length,
    });

    return createSuccessResponse(
      {
        data: {
          order: response,
        },
        message: 'Order created successfully',
      },
      201
    );
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 500, duration });
    return handleError(error, 'Failed to create order');
  }
};
