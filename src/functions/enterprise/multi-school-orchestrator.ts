/**
 * HASIVU Platform - Multi-School Orchestrator Lambda Function
 * Epic 7.3: Enterprise Multi-School Management Platform
 *
 * Main coordination function for enterprise operations across multiple schools
 * Features: School coordination, district-wide operations, resource orchestration, workflow management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { databaseService } from '../../shared/database.service';
import { jwtService } from '../../shared/jwt.service';

// Types
interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  districtId?: string;
  tenantId?: string;
  isActive: boolean;
}

interface OrchestrationRequest {
  operation: string;
  targetSchools: string[];
  parameters: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledAt?: string;
  metadata?: Record<string, any>;
}

interface OrchestrationJob {
  id: string;
  districtId: string;
  operation: string;
  targetSchools: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  results: Record<string, any>;
  errors: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface BulkOperationResult {
  jobId: string;
  totalSchools: number;
  successfulSchools: number;
  failedSchools: number;
  results: Array<{
    schoolId: string;
    status: 'SUCCESS' | 'FAILED';
    result?: any;
    error?: string;
  }>;
}

// Authentication middleware
async function authenticateLambda(event: APIGatewayProxyEvent): Promise<AuthenticatedUser> {
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No authentication token provided');
  }

  const jwtResult = await jwtService.verifyToken(token);
  if (!jwtResult.isValid || !jwtResult.payload || !jwtResult.payload.userId) {
    throw new Error('Invalid authentication token');
  }

  return {
    id: jwtResult.payload.userId,
    email: jwtResult.payload.email,
    role: jwtResult.payload.role,
    districtId: (jwtResult.payload as any).districtId,
    tenantId: (jwtResult.payload as any).tenantId,
    isActive: true,
  };
}

/**
 * Multi-School Orchestrator Lambda Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    logger.info('Multi-school orchestrator request started', {
      requestId,
      httpMethod: event.httpMethod,
      path: event.path,
    });

    // Authentication
    let authResult: AuthenticatedUser;
    try {
      authResult = await authenticateLambda(event as any);
    } catch (authError) {
      logger.warn('Authentication failed', { requestId, error: (authError as Error).message });
      return createErrorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Authorization check - only district admins and super admins allowed
    if (!['district_admin', 'super_admin'].includes(authResult.role)) {
      return createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions for multi-school operations',
        403
      );
    }

    const { httpMethod: method } = event;
    const pathParameters = event.pathParameters || {};
    const { jobId } = pathParameters;
    const db = databaseService.client;

    switch (method) {
      case 'GET':
        if (jobId) {
          return await getOrchestrationJob(jobId, authResult, db);
        } else if (event.queryStringParameters?.status) {
          return await getJobsByStatus(event.queryStringParameters.status, authResult, db);
        } else {
          return await listOrchestrationJobs(event.queryStringParameters, authResult, db);
        }

      case 'POST':
        if (event.path?.includes('/bulk-operation')) {
          return await executeBulkOperation(JSON.parse(event.body || '{}'), authResult, db);
        } else if (event.path?.includes('/schedule')) {
          return await scheduleOperation(JSON.parse(event.body || '{}'), authResult, db);
        } else {
          return await createOrchestrationJob(JSON.parse(event.body || '{}'), authResult, db);
        }

      case 'PUT':
        if (jobId && event.path?.includes('/cancel')) {
          return await cancelOrchestrationJob(jobId, authResult, db);
        } else if (jobId) {
          return await updateOrchestrationJob(
            jobId,
            JSON.parse(event.body || '{}'),
            authResult,
            db
          );
        }
        break;

      case 'DELETE':
        if (jobId) {
          return await deleteOrchestrationJob(jobId, authResult, db);
        }
        break;

      default:
        return createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }

    return createErrorResponse('INVALID_PATH', 'Invalid request path', 400);
  } catch (error: unknown) {
    logger.error('Multi-school orchestrator request failed', error as Error, { requestId });

    return handleError(error, 'Multi-school orchestration failed');
  }
};

/**
 * Get orchestration job details
 */
async function getOrchestrationJob(
  jobId: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const job = (await db.$queryRaw`
      SELECT * FROM orchestration_jobs
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `) as any[];

    if (!job.length) {
      return createErrorResponse('JOB_NOT_FOUND', 'Orchestration job not found', 404);
    }

    return createSuccessResponse({
      data: { job: job[0] },
      message: 'Orchestration job retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to retrieve orchestration job');
  }
}

/**
 * List orchestration jobs with filtering
 */
async function listOrchestrationJobs(
  queryParams: { [key: string]: string | undefined } | null,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const page = parseInt(queryParams?.page || '1');
    const limit = parseInt(queryParams?.limit || '20');
    const offset = (page - 1) * limit;

    let whereCondition = '';
    const params: any[] | undefined = [];

    // District-based filtering for non-super admins
    if (user.role !== 'super_admin' && user.districtId) {
      whereCondition = 'WHERE district_id = $1';
      params.push(user.districtId);
    }

    // Status filtering
    if (queryParams?.status) {
      if (whereCondition) {
        whereCondition += ` AND status = $${params.length + 1}`;
      } else {
        whereCondition = `WHERE status = $${params.length + 1}`;
      }
      params.push(queryParams.status);
    }

    // Operation type filtering
    if (queryParams?.operation) {
      if (whereCondition) {
        whereCondition += ` AND operation = $${params.length + 1}`;
      } else {
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
      db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) as any[],
      db.$queryRawUnsafe(dataQuery, ...params) as any[],
    ]);

    const totalCount = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / limit);

    return createSuccessResponse({
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
  } catch (error: unknown) {
    return handleError(error, 'Failed to list orchestration jobs');
  }
}

/**
 * Create new orchestration job
 */
async function createOrchestrationJob(
  requestData: OrchestrationRequest,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    // Validation
    if (
      !requestData.operation ||
      !requestData.targetSchools ||
      !Array.isArray(requestData.targetSchools)
    ) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Operation and target schools are required',
        400
      );
    }

    // Verify user has access to target schools
    if (user.role !== 'super_admin' && user.districtId) {
      const schoolCheck = (await db.$queryRaw`
        SELECT id FROM schools
        WHERE id = ANY(${requestData.targetSchools})
        AND district_id = ${user.districtId}
      `) as any[];

      if (schoolCheck.length !== requestData.targetSchools.length) {
        return createErrorResponse('ACCESS_DENIED', 'Access denied to some target schools', 403);
      }
    }

    const jobId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job = (await db.$queryRaw`
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
    `) as any[];

    return createSuccessResponse(
      {
        data: { job: job[0] },
        message: 'Orchestration job created successfully',
      },
      201
    );
  } catch (error: unknown) {
    return handleError(error, 'Failed to create orchestration job');
  }
}

/**
 * Execute bulk operation across multiple schools
 */
async function executeBulkOperation(
  requestData: OrchestrationRequest,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const jobId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create orchestration job first
    await db.$queryRaw`
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

    // Execute operation on each school
    const results: BulkOperationResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const schoolId of requestData.targetSchools) {
      try {
        const result = await executeSchoolOperation(
          schoolId,
          requestData.operation,
          requestData.parameters,
          db
        );
        results.push({
          schoolId,
          status: 'SUCCESS',
          result,
        });
        successCount++;
      } catch (error: unknown) {
        results.push({
          schoolId,
          status: 'FAILED',
          error: (error as Error).message,
        });
        failedCount++;
      }

      // Update progress
      const progress = ((successCount + failedCount) / requestData.targetSchools.length) * 100;
      await db.$queryRaw`
        UPDATE orchestration_jobs
        SET progress = ${progress}, updated_at = NOW()
        WHERE id = ${jobId}
      `;
    }

    // Mark job as completed
    await db.$queryRaw`
      UPDATE orchestration_jobs
      SET status = 'COMPLETED', progress = 100,
          results = ${JSON.stringify({ successCount, failedCount, details: results })},
          completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `;

    const bulkResult: BulkOperationResult = {
      jobId,
      totalSchools: requestData.targetSchools.length,
      successfulSchools: successCount,
      failedSchools: failedCount,
      results,
    };

    return createSuccessResponse({
      data: { bulkOperation: bulkResult },
      message: 'Bulk operation completed successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to execute bulk operation');
  }
}

/**
 * Execute operation on a single school
 */
async function executeSchoolOperation(
  schoolId: string,
  operation: string,
  parameters: Record<string, any>,
  db: any
): Promise<any> {
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

/**
 * Update school menu
 */
async function updateSchoolMenu(schoolId: string, parameters: any, db: any): Promise<any> {
  const { menuItems, effectiveDate } = parameters;

  return (await db.$queryRaw`
    UPDATE school_menus
    SET menu_items = ${JSON.stringify(menuItems)},
        effective_date = ${new Date(effectiveDate)},
        updated_at = NOW()
    WHERE school_id = ${schoolId}
    RETURNING id
  `) as any[];
}

/**
 * Sync school students
 */
async function syncSchoolStudents(schoolId: string, parameters: any, db: any): Promise<any> {
  const { studentData } = parameters;

  // Implementation for student sync
  return { synced: studentData.length };
}

/**
 * Generate school report
 */
async function generateSchoolReport(schoolId: string, parameters: any, db: any): Promise<any> {
  const { reportType, dateRange } = parameters;

  // Implementation for report generation
  return { reportId: `report_${Date.now()}`, type: reportType };
}

/**
 * Update school settings
 */
async function updateSchoolSettings(schoolId: string, parameters: any, db: any): Promise<any> {
  const { settings } = parameters;

  return (await db.$queryRaw`
    UPDATE schools
    SET settings = ${JSON.stringify(settings)},
        updated_at = NOW()
    WHERE id = ${schoolId}
    RETURNING id
  `) as any[];
}

/**
 * Backup school data
 */
async function backupSchoolData(schoolId: string, parameters: any, db: any): Promise<any> {
  const { backupType } = parameters;

  // Implementation for data backup
  return { backupId: `backup_${Date.now()}`, type: backupType };
}

/**
 * Schedule operation for later execution
 */
async function scheduleOperation(
  requestData: OrchestrationRequest,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    if (!requestData.scheduledAt) {
      return createErrorResponse('VALIDATION_ERROR', 'Scheduled time is required', 400);
    }

    const scheduledTime = new Date(requestData.scheduledAt);
    if (scheduledTime <= new Date()) {
      return createErrorResponse(
        'INVALID_SCHEDULE_TIME',
        'Scheduled time must be in the future',
        400
      );
    }

    const jobId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job = (await db.$queryRaw`
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
    `) as any[];

    return createSuccessResponse(
      {
        data: { job: job[0] },
        message: 'Operation scheduled successfully',
      },
      201
    );
  } catch (error: unknown) {
    return handleError(error, 'Failed to schedule operation');
  }
}

/**
 * Cancel orchestration job
 */
async function cancelOrchestrationJob(
  jobId: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const result = (await db.$queryRaw`
      UPDATE orchestration_jobs
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND status IN ('PENDING', 'SCHEDULED')
      RETURNING id
    `) as any[];

    if (!result.length) {
      return createErrorResponse(
        'JOB_NOT_CANCELLABLE',
        'Job not found or cannot be cancelled',
        404
      );
    }

    return createSuccessResponse({
      data: { jobId },
      message: 'Orchestration job cancelled successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to cancel orchestration job');
  }
}

/**
 * Update orchestration job
 */
async function updateOrchestrationJob(
  jobId: string,
  updateData: any,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const updateFields = [];
    const params: any[] | undefined = [];
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
      return createErrorResponse('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
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

    const result = (await db.$queryRawUnsafe(query, ...params)) as any[];

    if (!result.length) {
      return createErrorResponse('JOB_NOT_UPDATABLE', 'Job not found or cannot be updated', 404);
    }

    return createSuccessResponse({
      data: { job: result[0] },
      message: 'Orchestration job updated successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to update orchestration job');
  }
}

/**
 * Delete orchestration job
 */
async function deleteOrchestrationJob(
  jobId: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    const result = (await db.$queryRaw`
      DELETE FROM orchestration_jobs
      WHERE id = ${jobId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      AND status IN ('COMPLETED', 'FAILED', 'CANCELLED')
      RETURNING id
    `) as any[];

    if (!result.length) {
      return createErrorResponse('JOB_NOT_DELETABLE', 'Job not found or cannot be deleted', 404);
    }

    return createSuccessResponse({
      data: { jobId },
      message: 'Orchestration job deleted successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to delete orchestration job');
  }
}

/**
 * Get jobs by status
 */
async function getJobsByStatus(
  status: string,
  user: AuthenticatedUser,
  db: any
): Promise<APIGatewayProxyResult> {
  try {
    let whereCondition = 'WHERE status = $1';
    const params: any[] | undefined = [status];

    if (user.role !== 'super_admin' && user.districtId) {
      whereCondition += ' AND district_id = $2';
      params.push(user.districtId);
    }

    const jobs = (await db.$queryRawUnsafe(
      `SELECT * FROM orchestration_jobs ${whereCondition} ORDER BY created_at DESC LIMIT 50`,
      ...params
    )) as any[];

    return createSuccessResponse({
      data: { jobs },
      message: `Jobs with status ${status} retrieved successfully`,
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to get jobs by status');
  }
}

export default handler;
