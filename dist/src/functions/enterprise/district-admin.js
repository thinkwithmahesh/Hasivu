"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/services/jwt.service");
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    const jwtResult = await jwt_service_1.jwtService.verifyToken(token);
    if (!jwtResult.isValid || !jwtResult.payload.userId) {
        throw new Error('Invalid authentication token');
    }
    return {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        firstName: '',
        lastName: '',
        role: jwtResult.payload.role,
        schoolId: jwtResult.payload.schoolId,
        isActive: true
    };
}
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('District admin request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path
        });
        let authResult;
        try {
            authResult = await authenticateLambda(event);
        }
        catch (authError) {
            logger_1.logger.warn('Authentication failed', { requestId, error: authError.message });
            return {
                statusCode: 401,
                body: JSON.stringify({
                    error: 'Authentication required',
                    code: 'UNAUTHORIZED'
                })
            };
        }
        const { httpMethod: method } = event;
        const pathParameters = event.pathParameters || {};
        const adminId = pathParameters.adminId;
        const db = database_service_1.databaseService.getPrismaClient();
        switch (method) {
            case 'GET':
                if (adminId) {
                    const admin = await db.user.findUnique({
                        where: {
                            id: adminId,
                            role: 'district_admin'
                        },
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            metadata: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    });
                    if (!admin) {
                        return {
                            statusCode: 404,
                            body: JSON.stringify({
                                error: 'District admin not found',
                                code: 'DISTRICT_ADMIN_NOT_FOUND'
                            })
                        };
                    }
                    let metadata = {};
                    try {
                        metadata = JSON.parse(admin.metadata);
                    }
                    catch (e) {
                        metadata = {};
                    }
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            data: {
                                admin: {
                                    id: admin.id,
                                    email: admin.email,
                                    firstName: admin.firstName || '',
                                    lastName: admin.lastName || '',
                                    role: admin.role,
                                    schoolAccess: metadata.schoolAccess || [],
                                    isActive: admin.isActive,
                                    createdAt: admin.createdAt,
                                    updatedAt: admin.updatedAt
                                }
                            }
                        })
                    };
                }
                else if (event.queryStringParameters?.overview === 'true') {
                    const [schools, orders, totalStudents] = await Promise.all([
                        db.school.count({ where: { isActive: true } }),
                        db.order.findMany({
                            select: { totalAmount: true }
                        }),
                        db.user.count({
                            where: {
                                role: { in: ['student'] },
                                isActive: true
                            }
                        })
                    ]);
                    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                    const activeAdmins = await db.user.count({
                        where: {
                            role: 'district_admin',
                            isActive: true
                        }
                    });
                    const overview = {
                        totalSchools: schools,
                        totalStudents,
                        totalOrders: orders.length,
                        revenue,
                        activeAdmins,
                        lastUpdated: new Date().toISOString()
                    };
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            data: { overview }
                        })
                    };
                }
                else {
                    const page = parseInt(event.queryStringParameters?.page || '1');
                    const limit = parseInt(event.queryStringParameters?.limit || '20');
                    const skip = (page - 1) * limit;
                    const whereCondition = {
                        role: 'district_admin'
                    };
                    if (event.queryStringParameters?.active === 'true') {
                        whereCondition.isActive = true;
                    }
                    else if (event.queryStringParameters?.active === 'false') {
                        whereCondition.isActive = false;
                    }
                    const [admins, totalCount] = await Promise.all([
                        db.user.findMany({
                            where: whereCondition,
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                metadata: true,
                                isActive: true,
                                createdAt: true,
                                updatedAt: true
                            },
                            skip,
                            take: limit,
                            orderBy: { createdAt: 'desc' }
                        }),
                        db.user.count({ where: whereCondition })
                    ]);
                    const totalPages = Math.ceil(totalCount / limit);
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            data: {
                                admins: admins.map(admin => {
                                    let metadata = {};
                                    try {
                                        metadata = JSON.parse(admin.metadata);
                                    }
                                    catch (e) {
                                        metadata = {};
                                    }
                                    return {
                                        id: admin.id,
                                        email: admin.email,
                                        firstName: admin.firstName || '',
                                        lastName: admin.lastName || '',
                                        role: admin.role,
                                        schoolAccess: metadata.schoolAccess || [],
                                        isActive: admin.isActive,
                                        createdAt: admin.createdAt,
                                        updatedAt: admin.updatedAt
                                    };
                                })
                            },
                            pagination: {
                                page,
                                limit,
                                total: totalCount,
                                pages: totalPages,
                                hasNext: page < totalPages,
                                hasPrev: page > 1
                            }
                        })
                    };
                }
            case 'POST':
                try {
                    const requestBody = JSON.parse(event.body || '{}');
                    if (!requestBody.email || !requestBody.firstName || !requestBody.lastName || !requestBody.password) {
                        return {
                            statusCode: 400,
                            body: JSON.stringify({
                                error: 'Email, firstName, lastName, and password are required',
                                code: 'VALIDATION_ERROR'
                            })
                        };
                    }
                    const existing = await db.user.findUnique({
                        where: { email: requestBody.email }
                    });
                    if (existing) {
                        return {
                            statusCode: 409,
                            body: JSON.stringify({
                                error: 'User with this email already exists',
                                code: 'USER_ALREADY_EXISTS'
                            })
                        };
                    }
                    const metadata = {
                        schoolAccess: requestBody.schoolAccess || []
                    };
                    const newAdmin = await db.user.create({
                        data: {
                            email: requestBody.email,
                            firstName: requestBody.firstName,
                            lastName: requestBody.lastName,
                            passwordHash: requestBody.password,
                            role: 'district_admin',
                            metadata: JSON.stringify(metadata),
                            isActive: true
                        },
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    });
                    return {
                        statusCode: 201,
                        body: JSON.stringify({
                            data: {
                                admin: {
                                    id: newAdmin.id,
                                    email: newAdmin.email,
                                    firstName: newAdmin.firstName || '',
                                    lastName: newAdmin.lastName || '',
                                    role: newAdmin.role,
                                    schoolAccess: requestBody.schoolAccess || [],
                                    isActive: newAdmin.isActive,
                                    createdAt: newAdmin.createdAt,
                                    updatedAt: newAdmin.updatedAt
                                }
                            }
                        })
                    };
                }
                catch (parseError) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invalid JSON in request body',
                            code: 'PARSE_ERROR'
                        })
                    };
                }
            case 'PUT':
                if (!adminId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Admin ID is required for updates',
                            code: 'MISSING_ADMIN_ID'
                        })
                    };
                }
                try {
                    const requestBody = JSON.parse(event.body || '{}');
                    const existing = await db.user.findUnique({
                        where: {
                            id: adminId,
                            role: 'district_admin'
                        }
                    });
                    if (!existing) {
                        return {
                            statusCode: 404,
                            body: JSON.stringify({
                                error: 'District admin not found',
                                code: 'DISTRICT_ADMIN_NOT_FOUND'
                            })
                        };
                    }
                    const updateData = {};
                    if (requestBody.firstName !== undefined) {
                        updateData.firstName = requestBody.firstName;
                    }
                    if (requestBody.lastName !== undefined) {
                        updateData.lastName = requestBody.lastName;
                    }
                    if (requestBody.isActive !== undefined) {
                        updateData.isActive = requestBody.isActive;
                    }
                    if (requestBody.schoolAccess !== undefined) {
                        let currentMetadata = {};
                        try {
                            currentMetadata = JSON.parse(existing.metadata);
                        }
                        catch (e) {
                            currentMetadata = {};
                        }
                        updateData.metadata = JSON.stringify({
                            ...currentMetadata,
                            schoolAccess: requestBody.schoolAccess
                        });
                    }
                    const updatedAdmin = await db.user.update({
                        where: { id: adminId },
                        data: updateData,
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            metadata: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    });
                    let metadata = {};
                    try {
                        metadata = JSON.parse(updatedAdmin.metadata);
                    }
                    catch (e) {
                        metadata = {};
                    }
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            data: {
                                admin: {
                                    id: updatedAdmin.id,
                                    email: updatedAdmin.email,
                                    firstName: updatedAdmin.firstName || '',
                                    lastName: updatedAdmin.lastName || '',
                                    role: updatedAdmin.role,
                                    schoolAccess: metadata.schoolAccess || [],
                                    isActive: updatedAdmin.isActive,
                                    createdAt: updatedAdmin.createdAt,
                                    updatedAt: updatedAdmin.updatedAt
                                }
                            }
                        })
                    };
                }
                catch (parseError) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Invalid JSON in request body',
                            code: 'PARSE_ERROR'
                        })
                    };
                }
            case 'DELETE':
                if (!adminId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            error: 'Admin ID is required for deletion',
                            code: 'MISSING_ADMIN_ID'
                        })
                    };
                }
                const deletedAdmin = await db.user.update({
                    where: {
                        id: adminId,
                        role: 'district_admin'
                    },
                    data: { isActive: false }
                });
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        data: { adminId },
                        message: 'District admin deleted successfully'
                    })
                };
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({
                        error: 'Method not allowed',
                        code: 'METHOD_NOT_ALLOWED'
                    })
                };
        }
    }
    catch (error) {
        logger_1.logger.error('District admin request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            })
        };
    }
};
exports.handler = handler;
exports.default = exports.handler;
//# sourceMappingURL=district-admin.js.map