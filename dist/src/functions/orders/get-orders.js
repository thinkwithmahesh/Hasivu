"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/services/database.service");
async function validateUserAccess(userId) {
    const database = database_service_1.DatabaseService.getInstance();
    const userResult = await database.query(`
    SELECT id, role, schoolId, isActive
    FROM users 
    WHERE id = $1 AND isActive = true
  `, [userId]);
    const user = userResult.rows[0];
    if (!user) {
        throw new Error('User not found or inactive');
    }
    if (['admin', 'super_admin'].includes(user.role)) {
        return {
            userRole: user.role,
            isAdmin: true
        };
    }
    if (['school_admin', 'staff', 'kitchen_staff'].includes(user.role)) {
        return {
            userRole: user.role,
            schoolId: user.schoolId,
            isAdmin: true
        };
    }
    if (user.role === 'parent') {
        const childrenResult = await database.query(`
      SELECT id FROM users 
      WHERE parentId = $1 AND isActive = true
    `, [userId]);
        const studentIds = childrenResult.rows.map(row => row.id);
        return {
            userRole: user.role,
            studentIds: studentIds,
            isAdmin: false
        };
    }
    if (user.role === 'student') {
        return {
            userRole: user.role,
            studentIds: [userId],
            isAdmin: false
        };
    }
    throw new Error('Not authorized to view orders');
}
function buildOrderQuery(filters, userAccess) {
    let whereConditions = [];
    let queryValues = [];
    let paramCounter = 1;
    if (!userAccess.isAdmin) {
        if (userAccess.studentIds && userAccess.studentIds.length > 0) {
            const studentPlaceholders = userAccess.studentIds.map(() => `$${paramCounter++}`).join(', ');
            whereConditions.push(`o.studentId IN (${studentPlaceholders})`);
            queryValues.push(...userAccess.studentIds);
        }
        else {
            whereConditions.push('1 = 0');
        }
    }
    else if (userAccess.schoolId) {
        whereConditions.push(`o.schoolId = $${paramCounter}`);
        queryValues.push(userAccess.schoolId);
        paramCounter++;
    }
    if (filters.status) {
        whereConditions.push(`o.status = $${paramCounter}`);
        queryValues.push(filters.status);
        paramCounter++;
    }
    if (filters.paymentStatus) {
        whereConditions.push(`o.paymentStatus = $${paramCounter}`);
        queryValues.push(filters.paymentStatus);
        paramCounter++;
    }
    if (filters.studentId && userAccess.isAdmin) {
        whereConditions.push(`o.studentId = $${paramCounter}`);
        queryValues.push(filters.studentId);
        paramCounter++;
    }
    if (filters.schoolId && userAccess.isAdmin) {
        whereConditions.push(`o.schoolId = $${paramCounter}`);
        queryValues.push(filters.schoolId);
        paramCounter++;
    }
    if (filters.mealPeriod) {
        whereConditions.push(`o.mealPeriod = $${paramCounter}`);
        queryValues.push(filters.mealPeriod);
        paramCounter++;
    }
    if (filters.dateFrom) {
        whereConditions.push(`o.deliveryDate >= $${paramCounter}`);
        queryValues.push(filters.dateFrom);
        paramCounter++;
    }
    if (filters.dateTo) {
        whereConditions.push(`o.deliveryDate <= $${paramCounter}`);
        queryValues.push(filters.dateTo);
        paramCounter++;
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    const validSortFields = ['createdAt', 'updatedAt', 'deliveryDate', 'totalAmount', 'status'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';
    const baseQuery = `
    FROM orders o
    LEFT JOIN users s ON o.studentId = s.id
    LEFT JOIN schools sc ON o.schoolId = sc.id
    ${whereClause}
  `;
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const limit = Math.min(filters.limit || 50, 100);
    const offset = ((filters.page || 1) - 1) * limit;
    const query = `
    SELECT o.id, o.orderNumber, o.studentId, o.schoolId, o.deliveryDate, 
           o.mealPeriod, o.status, o.paymentStatus, o.totalAmount,
           o.createdAt, o.updatedAt,
           s.firstName as student_firstName, s.lastName as student_lastName,
           s.grade, s.section,
           sc.name as school_name,
           (SELECT COUNT(*) FROM order_items WHERE orderId = o.id) as itemCount
    ${baseQuery}
    ORDER BY o.${safeSortBy} ${safeSortOrder}
    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
  `;
    queryValues.push(limit, offset);
    return { query, values: queryValues, countQuery };
}
function parseQueryFilters(queryParams) {
    if (!queryParams)
        return {};
    const filters = {};
    if (queryParams.status) {
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'];
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
    if (queryParams.mealPeriod) {
        const validMealPeriods = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (validMealPeriods.includes(queryParams.mealPeriod)) {
            filters.mealPeriod = queryParams.mealPeriod;
        }
    }
    if (queryParams.dateFrom) {
        const dateFrom = new Date(queryParams.dateFrom);
        if (!isNaN(dateFrom.getTime())) {
            filters.dateFrom = dateFrom.toISOString().split('T')[0];
        }
    }
    if (queryParams.dateTo) {
        const dateTo = new Date(queryParams.dateTo);
        if (!isNaN(dateTo.getTime())) {
            filters.dateTo = dateTo.toISOString().split('T')[0];
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
        filters.sortOrder = queryParams.sortOrder.toUpperCase();
    }
    return filters;
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('getOrdersHandler', { event, context });
    try {
        if (event.httpMethod !== 'GET') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const userId = event.requestContext?.authorizer?.userId || event.headers?.['x-user-id'];
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('User authentication required', 401, 'AUTHENTICATION_REQUIRED');
        }
        const filters = parseQueryFilters(event.queryStringParameters);
        logger_1.logger.info('Processing get orders request', { userId, filters });
        const userAccess = await validateUserAccess(userId);
        const database = database_service_1.DatabaseService.getInstance();
        const { query, values, countQuery } = buildOrderQuery(filters, userAccess);
        const countResult = await database.query(countQuery, values.slice(0, -2));
        const total = parseInt(countResult.rows[0].total, 10);
        const ordersResult = await database.query(query, values);
        const orders = ordersResult.rows.map(row => ({
            id: row.id,
            orderNumber: row.orderNumber,
            studentId: row.studentId,
            student: {
                id: row.studentId,
                firstName: row.student_firstName,
                lastName: row.student_lastName,
                grade: row.grade,
                section: row.section
            },
            school: {
                id: row.schoolId,
                name: row.school_name
            },
            deliveryDate: row.deliveryDate,
            mealPeriod: row.mealPeriod,
            status: row.status,
            paymentStatus: row.paymentStatus,
            totalAmount: parseFloat(row.totalAmount),
            itemCount: parseInt(row.itemCount, 10),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        }));
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const totalPages = Math.ceil(total / limit);
        const response = {
            orders: orders,
            pagination: {
                total: total,
                page: page,
                limit: limit,
                totalPages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                status: filters.status,
                paymentStatus: filters.paymentStatus,
                studentId: filters.studentId,
                schoolId: filters.schoolId,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                mealPeriod: filters.mealPeriod
            }
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 200, duration });
        logger_1.logger.info('Orders retrieved successfully', {
            userId: userId,
            userRole: userAccess.userRole,
            ordersCount: orders.length,
            total: total,
            page: page
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: response,
            message: `Retrieved ${orders.length} orders (page ${page} of ${totalPages})`
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd("handler", { statusCode: 500, duration });
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve orders');
    }
};
exports.handler = handler;
//# sourceMappingURL=get-orders.js.map