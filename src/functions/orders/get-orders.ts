/**
 * List Orders Lambda Function
 * Handles: GET /orders
 * Implements Epic 3: Order Processing System - Order Listing with Filtering
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '@/shared/response.utils';
import { prisma, DatabaseManager } from '@/database/DatabaseManager';

/**
 * Order list response interface
 */
interface OrderSummary {
  id: string;
  orderNumber: string;
  studentId: string;
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    grade?: string | null;
    section?: string | null;
  };
  school: {
    id: string;
    name: string;
  };
  deliveryDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order list response interface
 */
interface OrderListResponse {
  orders: OrderSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status?: string;
    paymentStatus?: string;
    studentId?: string;
    schoolId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

/**
 * Query filters interface
 */
interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  studentId?: string;
  schoolId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Validate user access and get authorized filters
 */
async function validateUserAccess(userId: string): Promise<{
  userRole: string;
  schoolId?: string;
  studentIds?: string[];
  isAdmin: boolean;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        role: true,
        schoolId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Admin and super admin can see all orders
    if (['admin', 'super_admin'].includes(user.role)) {
      return {
        userRole: user.role,
        isAdmin: true,
      };
    }

    // School admin can see orders for their school
    if (['school_admin', 'staff', 'kitchen_staff'].includes(user.role)) {
      return {
        userRole: user.role,
        schoolId: user.schoolId || undefined,
        isAdmin: true,
      };
    }

    // Parents can see orders for their children
    if (user.role === 'parent') {
      const children = await prisma.user.findMany({
        where: {
          parentId: userId,
          isActive: true,
        },
        select: { id: true },
      });

      return {
        userRole: user.role,
        studentIds: children.map(child => child.id),
        isAdmin: false,
      };
    }

    // Students can see their own orders
    if (user.role === 'student') {
      return {
        userRole: user.role,
        studentIds: [userId],
        isAdmin: false,
      };
    }

    throw new Error('Not authorized to view orders');
  } catch (error) {
    logger.error(
      'Error validating user access',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    throw error;
  }
}

/**
 * Parse and validate query parameters
 */
function parseQueryFilters(queryParams: { [key: string]: string } | null): OrderFilters {
  if (!queryParams) return {};

  const filters: OrderFilters = {};

  // Status filter
  if (queryParams.status) {
    const validStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'completed',
      'cancelled',
    ];
    if (validStatuses.includes(queryParams.status)) {
      filters.status = queryParams.status;
    }
  }

  // Payment status filter
  if (queryParams.paymentStatus) {
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (validPaymentStatuses.includes(queryParams.paymentStatus)) {
      filters.paymentStatus = queryParams.paymentStatus;
    }
  }

  // Date filters
  if (queryParams.dateFrom) {
    const dateFrom = new Date(queryParams.dateFrom);
    if (!isNaN(dateFrom.getTime())) {
      filters.dateFrom = dateFrom;
    }
  }

  if (queryParams.dateTo) {
    const dateTo = new Date(queryParams.dateTo);
    if (!isNaN(dateTo.getTime())) {
      filters.dateTo = dateTo;
    }
  }

  // ID filters (admin only)
  if (queryParams.studentId) {
    filters.studentId = queryParams.studentId;
  }

  if (queryParams.schoolId) {
    filters.schoolId = queryParams.schoolId;
  }

  // Pagination
  if (queryParams.page) {
    const page = parseInt(queryParams.page, 10);
    if (page > 0) {
      filters.page = page;
    }
  }

  if (queryParams.limit) {
    const limit = parseInt(queryParams.limit, 10);
    if (limit > 0 && limit <= 100) {
      filters.limit = limit;
    }
  }

  // Sorting
  if (queryParams.sortBy) {
    filters.sortBy = queryParams.sortBy;
  }

  if (queryParams.sortOrder) {
    filters.sortOrder = queryParams.sortOrder.toLowerCase() as 'asc' | 'desc';
  }

  return filters;
}

/**
 * Get Orders List Lambda Function Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.logFunctionStart('getOrdersHandler', { event, context });

  try {
    // Only allow GET method
    if (event.httpMethod !== 'GET') {
      return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    // Extract userId from event context (would come from JWT in real implementation)
    const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
    if (!userId) {
      return createErrorResponse('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
    }

    // Parse query parameters
    const filters = parseQueryFilters(
      event.queryStringParameters as { [key: string]: string } | null
    );
    logger.info('Processing get orders request', { userId, filters });

    // Validate user access and get restrictions
    const userAccess = await validateUserAccess(userId);

    // Build Prisma where clause
    const whereClause: any = {};

    // Apply user access restrictions
    if (!userAccess.isAdmin) {
      if (userAccess.studentIds && userAccess.studentIds.length > 0) {
        whereClause.studentId = { in: userAccess.studentIds };
      } else {
        // No students accessible - return empty results
        return createSuccessResponse({
          data: {
            orders: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 50,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
            filters: {},
          },
          message: 'No orders found',
        });
      }
    } else if (userAccess.schoolId) {
      whereClause.schoolId = userAccess.schoolId;
    }

    // Apply additional filters
    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.paymentStatus) {
      whereClause.paymentStatus = filters.paymentStatus;
    }

    if (filters.studentId && userAccess.isAdmin) {
      whereClause.studentId = filters.studentId;
    }

    if (filters.schoolId && userAccess.isAdmin) {
      whereClause.schoolId = filters.schoolId;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.deliveryDate = {};
      if (filters.dateFrom) {
        whereClause.deliveryDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.deliveryDate.lte = filters.dateTo;
      }
    }

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Sorting
    const validSortFields = ['createdAt', 'updatedAt', 'deliveryDate', 'totalAmount', 'status'];
    const sortBy = validSortFields.includes(filters.sortBy || '') ? filters.sortBy : 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    // Get total count
    const total = await prisma.order.count({
      where: whereClause,
    });

    // Get orders with relations
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            grade: true,
            section: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        [sortBy!]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Map to response format
    const orderSummaries: OrderSummary[] = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      studentId: order.studentId,
      student: {
        id: order.student.id,
        firstName: order.student.firstName,
        lastName: order.student.lastName,
        grade: order.student.grade,
        section: order.student.section,
      },
      school: {
        id: order.school.id,
        name: order.school.name,
      },
      deliveryDate: order.deliveryDate.toISOString().split('T')[0],
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: Number(order.totalAmount),
      itemCount: order.orderItems.length,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    const response: OrderListResponse = {
      orders: orderSummaries,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        studentId: filters.studentId,
        schoolId: filters.schoolId,
        dateFrom: filters.dateFrom?.toISOString().split('T')[0],
        dateTo: filters.dateTo?.toISOString().split('T')[0],
      },
    };

    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 200, duration });
    logger.info('Orders retrieved successfully', {
      userId,
      userRole: userAccess.userRole,
      ordersCount: orderSummaries.length,
      total,
      page,
    });

    return createSuccessResponse({
      data: response,
      message: `Retrieved ${orderSummaries.length} orders (page ${page} of ${totalPages})`,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.logFunctionEnd('handler', { statusCode: 500, duration });
    return handleError(error, 'Failed to retrieve orders');
  }
};
