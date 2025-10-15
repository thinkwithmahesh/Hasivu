"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const DatabaseManager_1 = require("@/database/DatabaseManager");
async function validateUserAccess(userId) {
    try {
        const user = await DatabaseManager_1.prisma.user.findUnique({
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
        if (['admin', 'super_admin'].includes(user.role)) {
            return {
                userRole: user.role,
                isAdmin: true,
            };
        }
        if (['school_admin', 'staff', 'kitchen_staff'].includes(user.role)) {
            return {
                userRole: user.role,
                schoolId: user.schoolId || undefined,
                isAdmin: true,
            };
        }
        if (user.role === 'parent') {
            const children = await DatabaseManager_1.prisma.user.findMany({
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
        if (user.role === 'student') {
            return {
                userRole: user.role,
                studentIds: [userId],
                isAdmin: false,
            };
        }
        throw new Error('Not authorized to view orders');
    }
    catch (error) {
        logger_1.logger.error('Error validating user access', error instanceof Error ? error : new Error(String(error)), { userId });
        throw error;
    }
}
function parseQueryFilters(queryParams) {
    if (!queryParams)
        return {};
    const filters = {};
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
    if (queryParams.paymentStatus) {
        const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (validPaymentStatuses.includes(queryParams.paymentStatus)) {
            filters.paymentStatus = queryParams.paymentStatus;
        }
    }
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
    if (queryParams.studentId) {
        filters.studentId = queryParams.studentId;
    }
    if (queryParams.schoolId) {
        filters.schoolId = queryParams.schoolId;
    }
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
    if (queryParams.sortBy) {
        filters.sortBy = queryParams.sortBy;
    }
    if (queryParams.sortOrder) {
        filters.sortOrder = queryParams.sortOrder.toLowerCase();
    }
    return filters;
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('getOrdersHandler', { event, context });
    try {
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('AUTHENTICATION_REQUIRED', 'User authentication required', 401);
        }
        const filters = parseQueryFilters(event.queryStringParameters);
        logger_1.logger.info('Processing get orders request', { userId, filters });
        const userAccess = await validateUserAccess(userId);
        const whereClause = {};
        if (!userAccess.isAdmin) {
            if (userAccess.studentIds && userAccess.studentIds.length > 0) {
                whereClause.studentId = { in: userAccess.studentIds };
            }
            else {
                return (0, response_utils_1.createSuccessResponse)({
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
        }
        else if (userAccess.schoolId) {
            whereClause.schoolId = userAccess.schoolId;
        }
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
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100);
        const skip = (page - 1) * limit;
        const validSortFields = ['createdAt', 'updatedAt', 'deliveryDate', 'totalAmount', 'status'];
        const sortBy = validSortFields.includes(filters.sortBy || '') ? filters.sortBy : 'createdAt';
        const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
        const total = await DatabaseManager_1.prisma.order.count({
            where: whereClause,
        });
        const orders = await DatabaseManager_1.prisma.order.findMany({
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
                [sortBy]: sortOrder,
            },
            skip,
            take: limit,
        });
        const orderSummaries = orders.map(order => ({
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
        const totalPages = Math.ceil(total / limit);
        const response = {
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
        logger_1.logger.logFunctionEnd('handler', { statusCode: 200, duration });
        logger_1.logger.info('Orders retrieved successfully', {
            userId,
            userRole: userAccess.userRole,
            ordersCount: orderSummaries.length,
            total,
            page,
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: response,
            message: `Retrieved ${orderSummaries.length} orders (page ${page} of ${totalPages})`,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('handler', { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve orders');
    }
};
exports.handler = handler;
//# sourceMappingURL=get-orders.js.map