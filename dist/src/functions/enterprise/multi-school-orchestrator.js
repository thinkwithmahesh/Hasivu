"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const jwt_service_1 = require("../../shared/jwt.service");
async function authenticateLambda(event) {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        throw new Error('No authentication token provided');
    }
    const jwtResult = await jwt_service_1.jwtService.verifyToken(token);
    if (!jwtResult.isValid || !jwtResult.payload || !jwtResult.payload.userId) {
        throw new Error('Invalid authentication token');
    }
    return {
        id: jwtResult.payload.userId,
        email: jwtResult.payload.email,
        role: jwtResult.payload.role,
        districtId: jwtResult.payload.districtId,
        tenantId: jwtResult.payload.tenantId,
        isActive: true,
    };
}
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Multi-school orchestrator request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path,
        });
        let authResult;
        try {
            authResult = await authenticateLambda(event);
        }
        catch (authError) {
            logger_1.logger.warn('Authentication failed', { requestId, error: authError.message });
            return (0, response_utils_1.createErrorResponse)('UNAUTHORIZED', 'Authentication required', 401);
        }
        if (!['district_admin', 'super_admin'].includes(authResult.role)) {
            return (0, response_utils_1.createErrorResponse)('FORBIDDEN', 'Insufficient permissions for multi-school operations', 403);
        }
        const { httpMethod: method } = event;
        const pathParameters = event.pathParameters || {};
        const { jobId } = pathParameters;
        const db = database_service_1.databaseService.client;
        switch (method) {
            case 'GET':
                if (jobId) {
                    return await getOrchestrationJob(jobId, authResult, db);
                }
                else if (event.queryStringParameters?.status) {
                    return await getJobsByStatus(event.queryStringParameters.status, authResult, db);
                }
                else {
                    return await listOrchestrationJobs(event.queryStringParameters, authResult, db);
                }
            case 'POST':
                if (event.path?.includes('/bulk-operation')) {
                    return await executeBulkOperation(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/schedule')) {
                    return await scheduleOperation(JSON.parse(event.body || '{}'), authResult, db);
                }
                else {
                    return await createOrchestrationJob(JSON.parse(event.body || '{}'), authResult, db);
                }
            case 'PUT':
                if (jobId && event.path?.includes('/cancel')) {
                    return await cancelOrchestrationJob(jobId, authResult, db);
                }
                else if (jobId) {
                    return await updateOrchestrationJob(jobId, JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            case 'DELETE':
                if (jobId) {
                    return await deleteOrchestrationJob(jobId, authResult, db);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        return (0, response_utils_1.createErrorResponse)('INVALID_PATH', 'Invalid request path', 400);
    }
    catch (error) {
        logger_1.logger.error('Multi-school orchestrator request failed', error, { requestId });
        return (0, response_utils_1.handleError)(error, 'Multi-school orchestration failed');
    }
};
exports.handler = handler;
async function getOrchestrationJob(jobId, user, db) {
    try {
        const job = (await db.$queryRaw `
      SELECT * FROM orchestration_jobs
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `);
        if (!job.length) {
            return (0, response_utils_1.createErrorResponse)('JOB_NOT_FOUND', 'Orchestration job not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { job: job[0] },
            message: 'Orchestration job retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve orchestration job');
    }
}
async function listOrchestrationJobs(queryParams, user, db) {
    try {
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '20');
        const offset = (page - 1) * limit;
        let whereCondition = '';
        const params = [];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition = 'WHERE district_id = $1';
            params.push(user.districtId);
        }
        if (queryParams?.status) {
            if (whereCondition) {
                whereCondition += ` AND status = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE status = $${params.length + 1}`;
            }
            params.push(queryParams.status);
        }
        if (queryParams?.operation) {
            if (whereCondition) {
                whereCondition += ` AND operation = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE operation = $${params.length + 1}`;
            }
            params.push(queryParams.operation);
        }
        const countQuery = `SELECT COUNT(*) as total FROM orchestration_jobs ${whereCondition}`;
        const dataQuery = `
      SELECT * FROM orchestration_jobs
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);
        const [countResult, jobs] = await Promise.all([
            db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
            db.$queryRawUnsafe(dataQuery, ...params),
        ]);
        const totalCount = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(totalCount / limit);
        return (0, response_utils_1.createSuccessResponse)({
            data: { jobs },
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            message: 'Orchestration jobs retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to list orchestration jobs');
    }
}
async function createOrchestrationJob(requestData, user, db) {
    try {
        if (!requestData.operation ||
            !requestData.targetSchools ||
            !Array.isArray(requestData.targetSchools)) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Operation and target schools are required', 400);
        }
        if (user.role !== 'super_admin' && user.districtId) {
            const schoolCheck = (await db.$queryRaw `
        SELECT id FROM schools
        WHERE id = ANY(${requestData.targetSchools})
        AND district_id = ${user.districtId}
      `);
            if (schoolCheck.length !== requestData.targetSchools.length) {
                return (0, response_utils_1.createErrorResponse)('ACCESS_DENIED', 'Access denied to some target schools', 403);
            }
        }
        const jobId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = (await db.$queryRaw `
      INSERT INTO orchestration_jobs (
        id, district_id, operation, target_schools,
        parameters, priority, status, progress,
        scheduled_at, metadata, created_by, created_at, updated_at
      ) VALUES (
        ${jobId},
        ${user.districtId || null},
        ${requestData.operation},
        ${JSON.stringify(requestData.targetSchools)},
        ${JSON.stringify(requestData.parameters || {})},
        ${requestData.priority || 'MEDIUM'},
        'PENDING',
        0,
        ${requestData.scheduledAt ? new Date(requestData.scheduledAt) : new Date()},
        ${JSON.stringify(requestData.metadata || {})},
        ${user.id},
        NOW(),
        NOW()
      ) RETURNING *
    `);
        return (0, response_utils_1.createSuccessResponse)({
            data: { job: job[0] },
            message: 'Orchestration job created successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to create orchestration job');
    }
}
async function executeBulkOperation(requestData, user, db) {
    try {
        const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.$queryRaw `
      INSERT INTO orchestration_jobs (
        id, district_id, operation, target_schools,
        parameters, priority, status, progress,
        created_by, created_at, updated_at
      ) VALUES (
        ${jobId},
        ${user.districtId || null},
        ${requestData.operation},
        ${JSON.stringify(requestData.targetSchools)},
        ${JSON.stringify(requestData.parameters || {})},
        ${requestData.priority || 'HIGH'},
        'RUNNING',
        0,
        ${user.id},
        NOW(),
        NOW()
      )
    `;
        const results = [];
        let successCount = 0;
        let failedCount = 0;
        for (const schoolId of requestData.targetSchools) {
            try {
                const result = await executeSchoolOperation(schoolId, requestData.operation, requestData.parameters, db);
                results.push({
                    schoolId,
                    status: 'SUCCESS',
                    result,
                });
                successCount++;
            }
            catch (error) {
                results.push({
                    schoolId,
                    status: 'FAILED',
                    error: error.message,
                });
                failedCount++;
            }
            const progress = ((successCount + failedCount) / requestData.targetSchools.length) * 100;
            await db.$queryRaw `
        UPDATE orchestration_jobs
        SET progress = ${progress}, updated_at = NOW()
        WHERE id = ${jobId}
      `;
        }
        await db.$queryRaw `
      UPDATE orchestration_jobs
      SET status = 'COMPLETED', progress = 100,
          results = ${JSON.stringify({ successCount, failedCount, details: results })},
          completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `;
        const bulkResult = {
            jobId,
            totalSchools: requestData.targetSchools.length,
            successfulSchools: successCount,
            failedSchools: failedCount,
            results,
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { bulkOperation: bulkResult },
            message: 'Bulk operation completed successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to execute bulk operation');
    }
}
async function executeSchoolOperation(schoolId, operation, parameters, db) {
    switch (operation) {
        case 'UPDATE_MENU':
            return await updateSchoolMenu(schoolId, parameters, db);
        case 'SYNC_STUDENTS':
            return await syncSchoolStudents(schoolId, parameters, db);
        case 'GENERATE_REPORT':
            return await generateSchoolReport(schoolId, parameters, db);
        case 'UPDATE_SETTINGS':
            return await updateSchoolSettings(schoolId, parameters, db);
        case 'BACKUP_DATA':
            return await backupSchoolData(schoolId, parameters, db);
        default:
            throw new Error(`Unknown operation: ${operation}`);
    }
}
async function updateSchoolMenu(schoolId, parameters, db) {
    const { menuItems, effectiveDate } = parameters;
    return (await db.$queryRaw `
    UPDATE school_menus
    SET menu_items = ${JSON.stringify(menuItems)},
        effective_date = ${new Date(effectiveDate)},
        updated_at = NOW()
    WHERE school_id = ${schoolId}
    RETURNING id
  `);
}
async function syncSchoolStudents(schoolId, parameters, db) {
    const { studentData } = parameters;
    return { synced: studentData.length };
}
async function generateSchoolReport(schoolId, parameters, db) {
    const { reportType, dateRange } = parameters;
    return { reportId: `report_${Date.now()}`, type: reportType };
}
async function updateSchoolSettings(schoolId, parameters, db) {
    const { settings } = parameters;
    return (await db.$queryRaw `
    UPDATE schools
    SET settings = ${JSON.stringify(settings)},
        updated_at = NOW()
    WHERE id = ${schoolId}
    RETURNING id
  `);
}
async function backupSchoolData(schoolId, parameters, db) {
    const { backupType } = parameters;
    return { backupId: `backup_${Date.now()}`, type: backupType };
}
async function scheduleOperation(requestData, user, db) {
    try {
        if (!requestData.scheduledAt) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Scheduled time is required', 400);
        }
        const scheduledTime = new Date(requestData.scheduledAt);
        if (scheduledTime <= new Date()) {
            return (0, response_utils_1.createErrorResponse)('INVALID_SCHEDULE_TIME', 'Scheduled time must be in the future', 400);
        }
        const jobId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = (await db.$queryRaw `
      INSERT INTO orchestration_jobs (
        id, district_id, operation, target_schools,
        parameters, priority, status, progress,
        scheduled_at, metadata, created_by, created_at, updated_at
      ) VALUES (
        ${jobId},
        ${user.districtId || null},
        ${requestData.operation},
        ${JSON.stringify(requestData.targetSchools)},
        ${JSON.stringify(requestData.parameters || {})},
        ${requestData.priority || 'MEDIUM'},
        'SCHEDULED',
        0,
        ${scheduledTime},
        ${JSON.stringify(requestData.metadata || {})},
        ${user.id},
        NOW(),
        NOW()
      ) RETURNING *
    `);
        return (0, response_utils_1.createSuccessResponse)({
            data: { job: job[0] },
            message: 'Operation scheduled successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to schedule operation');
    }
}
async function cancelOrchestrationJob(jobId, user, db) {
    try {
        const result = (await db.$queryRaw `
      UPDATE orchestration_jobs
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND status IN ('PENDING', 'SCHEDULED')
      RETURNING id
    `);
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('JOB_NOT_CANCELLABLE', 'Job not found or cannot be cancelled', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { jobId },
            message: 'Orchestration job cancelled successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to cancel orchestration job');
    }
}
async function updateOrchestrationJob(jobId, updateData, user, db) {
    try {
        const updateFields = [];
        const params = [];
        let paramIndex = 1;
        if (updateData.priority !== undefined) {
            updateFields.push(`priority = $${paramIndex++}`);
            params.push(updateData.priority);
        }
        if (updateData.scheduledAt !== undefined) {
            updateFields.push(`scheduled_at = $${paramIndex++}`);
            params.push(new Date(updateData.scheduledAt));
        }
        if (updateData.metadata !== undefined) {
            updateFields.push(`metadata = $${paramIndex++}`);
            params.push(JSON.stringify(updateData.metadata));
        }
        if (updateFields.length === 0) {
            return (0, response_utils_1.createErrorResponse)('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
        }
        updateFields.push(`updated_at = NOW()`);
        params.push(jobId);
        params.push(user.districtId || null);
        const query = `
      UPDATE orchestration_jobs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++}
      AND (district_id = $${paramIndex++} OR $${user.role === 'super_admin'})
      AND status IN ('PENDING', 'SCHEDULED')
      RETURNING *
    `;
        const result = (await db.$queryRawUnsafe(query, ...params));
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('JOB_NOT_UPDATABLE', 'Job not found or cannot be updated', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { job: result[0] },
            message: 'Orchestration job updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update orchestration job');
    }
}
async function deleteOrchestrationJob(jobId, user, db) {
    try {
        const result = (await db.$queryRaw `
      DELETE FROM orchestration_jobs
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND status IN ('COMPLETED', 'FAILED', 'CANCELLED')
      RETURNING id
    `);
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('JOB_NOT_DELETABLE', 'Job not found or cannot be deleted', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { jobId },
            message: 'Orchestration job deleted successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to delete orchestration job');
    }
}
async function getJobsByStatus(status, user, db) {
    try {
        let whereCondition = 'WHERE status = $1';
        const params = [status];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition += ' AND district_id = $2';
            params.push(user.districtId);
        }
        const jobs = (await db.$queryRawUnsafe(`SELECT * FROM orchestration_jobs ${whereCondition} ORDER BY created_at DESC LIMIT 50`, ...params));
        return (0, response_utils_1.createSuccessResponse)({
            data: { jobs },
            message: `Jobs with status ${status} retrieved successfully`,
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to get jobs by status');
    }
}
exports.default = exports.handler;
//# sourceMappingURL=multi-school-orchestrator.js.map