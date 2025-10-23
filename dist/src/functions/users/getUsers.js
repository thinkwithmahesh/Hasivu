"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
const getUsersSchema = joi_1.default.object({
    query: joi_1.default.string().optional().allow('').max(100),
    role: joi_1.default.string()
        .valid('student', 'parent', 'teacher', 'staff', 'school_admin', 'admin', 'super_admin')
        .optional(),
    schoolId: joi_1.default.string().uuid().optional(),
    isActive: joi_1.default.boolean().optional(),
    parentId: joi_1.default.string().uuid().optional(),
    hasChildren: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string().valid('firstName', 'lastName', 'email', 'createdAt', 'updatedAt').optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional(),
    page: joi_1.default.number().integer().min(1).max(1000).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
const getUsersHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Get users request started', {
            requestId,
            queryParams: event.queryStringParameters,
            userAgent: event.headers['User-Agent'],
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger_1.logger.warn('Unauthorized access attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'));
        }
        const queryParams = event.queryStringParameters || {};
        const filters = {
            search: queryParams.query || undefined,
            role: queryParams.role || undefined,
            schoolId: queryParams.schoolId || undefined,
            isActive: queryParams.isActive ? queryParams.isActive === 'true' : undefined,
            page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
            limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50,
        };
        const additionalFilters = {
            query: queryParams.query || undefined,
            parentId: queryParams.parentId || undefined,
            hasChildren: queryParams.hasChildren ? queryParams.hasChildren === 'true' : undefined,
            sortBy: queryParams.sortBy || 'createdAt',
            sortOrder: queryParams.sortOrder || 'desc',
        };
        const validation = validation_service_1.ValidationService.validateObject(filters, getUsersSchema);
        if (!validation.isValid) {
            logger_1.logger.warn('Invalid query parameters', {
                requestId,
                errors: validation.errors,
                filters,
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`));
        }
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger_1.logger.error('Requesting user not found', new Error('User not found'), {
                requestId,
                userId: userContext.userId,
            });
            return (0, response_utils_1.handleError)(new Error('User not found'));
        }
        if (!['admin', 'super_admin'].includes(requestingUser.role)) {
            filters.schoolId = requestingUser.schoolId ?? undefined;
            if (requestingUser.role === 'parent' && !additionalFilters.parentId) {
                additionalFilters.parentId = requestingUser.id;
            }
        }
        logger_1.logger.info('Searching users with filters', {
            requestId,
            userId: userContext.userId,
            role: requestingUser.role,
            appliedFilters: filters,
        });
        const result = await user_service_1.UserService.searchUsers(filters);
        const transformedUsers = result.users.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            schoolId: user.schoolId ?? undefined,
            school: null,
            parentId: user.parentId ?? undefined,
            parent: null,
            children: [],
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
        const totalPages = Math.ceil(result.total / result.limit);
        logger_1.logger.info('Get users request completed', {
            requestId,
            userId: userContext.userId,
            resultCount: result.users.length,
            total: result.total,
            page: result.page,
            totalPages,
        });
        return (0, response_utils_1.createSuccessResponse)({
            users: transformedUsers,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages,
                hasNext: result.page < totalPages,
                hasPrev: result.page > 1,
            },
            filters: {
                query: additionalFilters.query,
                role: filters.role,
                schoolId: filters.schoolId,
                isActive: filters.isActive,
                parentId: additionalFilters.parentId,
                hasChildren: additionalFilters.hasChildren,
                sortBy: additionalFilters.sortBy,
                sortOrder: additionalFilters.sortOrder,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Get users request failed', error, {
            requestId,
        });
        return (0, response_utils_1.handleError)(error);
    }
};
exports.getUsersHandler = getUsersHandler;
exports.default = exports.getUsersHandler;
//# sourceMappingURL=getUsers.js.map