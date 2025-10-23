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
        logger_1.logger.info('School hierarchy manager request started', {
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
        const { httpMethod: method } = event;
        const pathParameters = event.pathParameters || {};
        const { nodeId } = pathParameters;
        const db = database_service_1.databaseService.client;
        switch (method) {
            case 'GET':
                if (event.path?.includes('/hierarchy')) {
                    return await getOrganizationHierarchy(authResult, db);
                }
                else if (event.path?.includes('/roles')) {
                    return await getRoleAssignments(event.queryStringParameters, authResult, db);
                }
                else if (event.path?.includes('/permissions')) {
                    return await getPermissionMatrix(event.queryStringParameters, authResult, db);
                }
                else if (nodeId) {
                    return await getHierarchyNode(nodeId, authResult, db);
                }
                else {
                    return await listHierarchyNodes(event.queryStringParameters, authResult, db);
                }
            case 'POST':
                if (event.path?.includes('/nodes')) {
                    return await createHierarchyNode(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/roles/assign')) {
                    return await assignRole(JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/bulk-assign')) {
                    return await bulkAssignRoles(JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            case 'PUT':
                if (nodeId && event.path?.includes('/move')) {
                    return await moveHierarchyNode(nodeId, JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (nodeId) {
                    return await updateHierarchyNode(nodeId, JSON.parse(event.body || '{}'), authResult, db);
                }
                else if (event.path?.includes('/roles/update')) {
                    return await updateRoleAssignment(JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            case 'DELETE':
                if (nodeId) {
                    return await deleteHierarchyNode(nodeId, authResult, db);
                }
                else if (event.path?.includes('/roles/revoke')) {
                    return await revokeRole(JSON.parse(event.body || '{}'), authResult, db);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        return (0, response_utils_1.createErrorResponse)('INVALID_PATH', 'Invalid request path', 400);
    }
    catch (error) {
        logger_1.logger.error('School hierarchy manager request failed', error, { requestId });
        return (0, response_utils_1.handleError)(error, 'Hierarchy management operation failed');
    }
};
exports.handler = handler;
async function getOrganizationHierarchy(user, db) {
    try {
        let whereCondition = '';
        const params = [];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition = 'WHERE district_id = $1 OR parent_district_id = $1';
            params.push(user.districtId);
        }
        const nodes = (await db.$queryRawUnsafe(`
      SELECT
        id, name, type, parent_id, level, code,
        metadata, is_active, created_at, updated_at
      FROM hierarchy_nodes
      ${whereCondition}
      ORDER BY level ASC, name ASC
    `, ...params));
        const hierarchy = buildHierarchyTree(nodes);
        return (0, response_utils_1.createSuccessResponse)({
            data: { hierarchy },
            message: 'Organization hierarchy retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve organization hierarchy');
    }
}
function buildHierarchyTree(nodes) {
    if (!nodes || nodes.length === 0) {
        return [];
    }
    const nodeMap = new Map();
    const rootNodes = [];
    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            name: node.name,
            type: node.type,
            parentId: node.parent_id,
            level: node.level,
            code: node.code,
            metadata: JSON.parse(node.metadata || '{}'),
            isActive: node.is_active,
            children: [],
        });
    });
    nodes.forEach(node => {
        const hierarchyNode = nodeMap.get(node.id);
        if (node.parent_id) {
            const parent = nodeMap.get(node.parent_id);
            if (parent) {
                parent.children.push(hierarchyNode);
            }
        }
        else {
            rootNodes.push(hierarchyNode);
        }
    });
    return rootNodes;
}
async function getHierarchyNode(nodeId, user, db) {
    try {
        const node = (await db.$queryRaw `
      SELECT
        id, name, type, parent_id, level, code,
        metadata, is_active, created_at, updated_at
      FROM hierarchy_nodes
      WHERE id = ${nodeId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `);
        if (!node.length) {
            return (0, response_utils_1.createErrorResponse)('NODE_NOT_FOUND', 'Hierarchy node not found', 404);
        }
        const children = (await db.$queryRaw `
      SELECT id, name, type, level, code, is_active
      FROM hierarchy_nodes
      WHERE parent_id = ${nodeId}
      ORDER BY name ASC
    `);
        const nodeData = {
            ...node[0],
            metadata: JSON.parse(node[0].metadata || '{}'),
            children,
        };
        return (0, response_utils_1.createSuccessResponse)({
            data: { node: nodeData },
            message: 'Hierarchy node retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve hierarchy node');
    }
}
async function createHierarchyNode(nodeData, user, db) {
    try {
        if (!nodeData.name || !nodeData.type || !nodeData.code) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Name, type, and code are required', 400);
        }
        let level = 1;
        let parentDistrictId = user.districtId;
        if (nodeData.parentId) {
            const parent = (await db.$queryRaw `
        SELECT level, district_id FROM hierarchy_nodes
        WHERE id = ${nodeData.parentId}
      `);
            if (!parent.length) {
                return (0, response_utils_1.createErrorResponse)('PARENT_NOT_FOUND', 'Parent node not found', 404);
            }
            level = parent[0].level + 1;
            parentDistrictId = parent[0].district_id;
        }
        const existing = (await db.$queryRaw `
      SELECT id FROM hierarchy_nodes
      WHERE code = ${nodeData.code}
      AND district_id = ${parentDistrictId}
    `);
        if (existing.length) {
            return (0, response_utils_1.createErrorResponse)('DUPLICATE_CODE', 'Node with this code already exists', 409);
        }
        const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNode = (await db.$queryRaw `
      INSERT INTO hierarchy_nodes (
        id, name, type, parent_id, level, code,
        metadata, district_id, is_active, created_by, created_at, updated_at
      ) VALUES (
        ${nodeId},
        ${nodeData.name},
        ${nodeData.type},
        ${nodeData.parentId || null},
        ${level},
        ${nodeData.code},
        ${JSON.stringify(nodeData.metadata || {})},
        ${parentDistrictId},
        ${nodeData.isActive !== undefined ? nodeData.isActive : true},
        ${user.id},
        NOW(),
        NOW()
      ) RETURNING *
    `);
        return (0, response_utils_1.createSuccessResponse)({
            data: { node: newNode[0] },
            message: 'Hierarchy node created successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to create hierarchy node');
    }
}
async function updateHierarchyNode(nodeId, updateData, user, db) {
    try {
        const existing = (await db.$queryRaw `
      SELECT id, district_id FROM hierarchy_nodes
      WHERE id = ${nodeId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
    `);
        if (!existing.length) {
            return (0, response_utils_1.createErrorResponse)('NODE_NOT_FOUND', 'Hierarchy node not found', 404);
        }
        const updateFields = [];
        const params = [];
        let paramIndex = 1;
        if (updateData.name !== undefined) {
            updateFields.push(`name = $${paramIndex++}`);
            params.push(updateData.name);
        }
        if (updateData.code !== undefined) {
            updateFields.push(`code = $${paramIndex++}`);
            params.push(updateData.code);
        }
        if (updateData.metadata !== undefined) {
            updateFields.push(`metadata = $${paramIndex++}`);
            params.push(JSON.stringify(updateData.metadata));
        }
        if (updateData.isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex++}`);
            params.push(updateData.isActive);
        }
        if (updateFields.length === 0) {
            return (0, response_utils_1.createErrorResponse)('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
        }
        updateFields.push(`updated_at = NOW()`);
        params.push(nodeId);
        const query = `
      UPDATE hierarchy_nodes
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++}
      RETURNING *
    `;
        const result = (await db.$queryRawUnsafe(query, ...params));
        return (0, response_utils_1.createSuccessResponse)({
            data: { node: result[0] },
            message: 'Hierarchy node updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update hierarchy node');
    }
}
async function moveHierarchyNode(nodeId, moveData, user, db) {
    try {
        const { newParentId } = moveData;
        if (newParentId === nodeId) {
            return (0, response_utils_1.createErrorResponse)('INVALID_MOVE', 'Cannot move node to itself', 400);
        }
        let newLevel = 1;
        if (newParentId) {
            const parent = (await db.$queryRaw `
        SELECT level FROM hierarchy_nodes
        WHERE id = ${newParentId}
      `);
            if (!parent.length) {
                return (0, response_utils_1.createErrorResponse)('PARENT_NOT_FOUND', 'New parent node not found', 404);
            }
            newLevel = parent[0].level + 1;
            const isDescendant = await checkCircularDependency(nodeId, newParentId, db);
            if (isDescendant) {
                return (0, response_utils_1.createErrorResponse)('CIRCULAR_DEPENDENCY', 'Cannot move node to its descendant', 400);
            }
        }
        await db.$transaction(async (tx) => {
            await tx.$queryRaw `
        UPDATE hierarchy_nodes
        SET parent_id = ${newParentId}, level = ${newLevel}, updated_at = NOW()
        WHERE id = ${nodeId}
      `;
            await updateDescendantLevels(nodeId, newLevel, tx);
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { nodeId, newParentId, newLevel },
            message: 'Hierarchy node moved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to move hierarchy node');
    }
}
async function checkCircularDependency(nodeId, newParentId, db) {
    const descendants = (await db.$queryRaw `
    WITH RECURSIVE node_descendants AS (
      SELECT id, parent_id FROM hierarchy_nodes WHERE id = ${nodeId}
      UNION ALL
      SELECT h.id, h.parent_id
      FROM hierarchy_nodes h
      INNER JOIN node_descendants d ON h.parent_id = d.id
    )
    SELECT id FROM node_descendants WHERE id = ${newParentId}
  `);
    return descendants.length > 0;
}
async function updateDescendantLevels(nodeId, baseLevel, tx) {
    await tx.$queryRaw `
    WITH RECURSIVE node_descendants AS (
      SELECT id, level FROM hierarchy_nodes WHERE parent_id = ${nodeId}
      UNION ALL
      SELECT h.id, h.level
      FROM hierarchy_nodes h
      INNER JOIN node_descendants d ON h.parent_id = d.id
    )
    UPDATE hierarchy_nodes h
    SET level = ${baseLevel + 1} + (
      SELECT COUNT(*) FROM hierarchy_nodes ancestors
      WHERE ancestors.id IN (
        WITH RECURSIVE ancestor_chain AS (
          SELECT parent_id, 0 as depth FROM hierarchy_nodes WHERE id = h.id
          UNION ALL
          SELECT hn.parent_id, ac.depth + 1
          FROM hierarchy_nodes hn
          INNER JOIN ancestor_chain ac ON hn.id = ac.parent_id
          WHERE hn.parent_id IS NOT NULL AND ac.depth < 10
        )
        SELECT parent_id FROM ancestor_chain WHERE parent_id IS NOT NULL
      ) AND ancestors.id != ${nodeId}
    ),
    updated_at = NOW()
    WHERE h.id IN (SELECT id FROM node_descendants)
  `;
}
async function getRoleAssignments(queryParams, user, db) {
    try {
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '20');
        const offset = (page - 1) * limit;
        let whereCondition = '';
        const params = [];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition =
                "WHERE (scope_type = 'DISTRICT' AND scope_id = $1) OR (scope_type = 'SCHOOL' AND scope_id IN (SELECT id FROM schools WHERE district_id = $1))";
            params.push(user.districtId);
        }
        if (queryParams?.userId) {
            if (whereCondition) {
                whereCondition += ` AND user_id = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE user_id = $${params.length + 1}`;
            }
            params.push(queryParams.userId);
        }
        if (queryParams?.roleId) {
            if (whereCondition) {
                whereCondition += ` AND role_id = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE role_id = $${params.length + 1}`;
            }
            params.push(queryParams.roleId);
        }
        const countQuery = `SELECT COUNT(*) as total FROM user_administrative_roles ${whereCondition}`;
        const dataQuery = `
      SELECT
        uar.*, ar.role_name, ar.role_code,
        u.email, u.first_name, u.last_name
      FROM user_administrative_roles uar
      JOIN administrative_roles ar ON uar.role_id = ar.id
      JOIN users u ON uar.user_id = u.id
      ${whereCondition}
      ORDER BY uar.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);
        const [countResult, assignments] = await Promise.all([
            db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
            db.$queryRawUnsafe(dataQuery, ...params),
        ]);
        const totalCount = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(totalCount / limit);
        return (0, response_utils_1.createSuccessResponse)({
            data: { assignments },
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            message: 'Role assignments retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve role assignments');
    }
}
async function assignRole(assignmentData, user, db) {
    try {
        const { userId, roleId, scopeType, scopeId, expiresAt } = assignmentData;
        if (!userId || !roleId || !scopeType || !scopeId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'userId, roleId, scopeType, and scopeId are required', 400);
        }
        const existing = (await db.$queryRaw `
      SELECT id FROM user_administrative_roles
      WHERE user_id = ${userId} AND role_id = ${roleId}
      AND scope_type = ${scopeType} AND scope_id = ${scopeId}
      AND is_active = true
    `);
        if (existing.length) {
            return (0, response_utils_1.createErrorResponse)('ROLE_ALREADY_ASSIGNED', 'Role already assigned to user for this scope', 409);
        }
        const assignmentId = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newAssignment = (await db.$queryRaw `
      INSERT INTO user_administrative_roles (
        id, user_id, role_id, scope_type, scope_id,
        assigned_by, expires_at, is_active, created_at, updated_at
      ) VALUES (
        ${assignmentId},
        ${userId},
        ${roleId},
        ${scopeType},
        ${scopeId},
        ${user.id},
        ${expiresAt ? new Date(expiresAt) : null},
        true,
        NOW(),
        NOW()
      ) RETURNING *
    `);
        return (0, response_utils_1.createSuccessResponse)({
            data: { assignment: newAssignment[0] },
            message: 'Role assigned successfully',
        }, 201);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to assign role');
    }
}
async function bulkAssignRoles(bulkData, user, db) {
    try {
        const { assignments } = bulkData;
        if (!Array.isArray(assignments) || assignments.length === 0) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Assignments array is required', 400);
        }
        const results = [];
        const errors = [];
        for (const assignment of assignments) {
            try {
                const assignmentId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await db.$queryRaw `
          INSERT INTO user_administrative_roles (
            id, user_id, role_id, scope_type, scope_id,
            assigned_by, expires_at, is_active, created_at, updated_at
          ) VALUES (
            ${assignmentId},
            ${assignment.userId},
            ${assignment.roleId},
            ${assignment.scopeType},
            ${assignment.scopeId},
            ${user.id},
            ${assignment.expiresAt ? new Date(assignment.expiresAt) : null},
            true,
            NOW(),
            NOW()
          ) ON CONFLICT (user_id, role_id, scope_type, scope_id) DO NOTHING
        `;
                results.push({
                    userId: assignment.userId,
                    roleId: assignment.roleId,
                    status: 'SUCCESS',
                });
            }
            catch (error) {
                errors.push({
                    userId: assignment.userId,
                    roleId: assignment.roleId,
                    error: error.message,
                });
            }
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                successful: results.length,
                failed: errors.length,
                results,
                errors,
            },
            message: 'Bulk role assignment completed',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to perform bulk role assignment');
    }
}
async function getPermissionMatrix(queryParams, user, db) {
    try {
        const roleId = queryParams?.roleId;
        if (roleId) {
            const role = (await db.$queryRaw `
        SELECT
          ar.*,
          parent.role_name as parent_role_name,
          parent.permissions as parent_permissions
        FROM administrative_roles ar
        LEFT JOIN administrative_roles parent ON ar.parent_role_id = parent.id
        WHERE ar.id = ${roleId}
      `);
            if (!role.length) {
                return (0, response_utils_1.createErrorResponse)('ROLE_NOT_FOUND', 'Role not found', 404);
            }
            const roleData = role[0];
            const permissions = JSON.parse(roleData.permissions || '[]');
            const parentPermissions = JSON.parse(roleData.parent_permissions || '[]');
            const capabilities = JSON.parse(roleData.system_capabilities || '[]');
            const canDelegate = JSON.parse(roleData.can_delegate_to_roles || '[]');
            const matrix = {
                roleId,
                permissions,
                inheritedFrom: parentPermissions,
                canDelegate,
                restrictions: [],
            };
            return (0, response_utils_1.createSuccessResponse)({
                data: { permissionMatrix: matrix },
                message: 'Permission matrix retrieved successfully',
            });
        }
        else {
            const roles = (await db.$queryRaw `
        SELECT
          id, role_name, role_code, permissions,
          system_capabilities, can_delegate_to_roles,
          administrative_scope, role_level
        FROM administrative_roles
        WHERE is_active = true
        ORDER BY role_level ASC
      `);
            const matrices = roles.map(role => ({
                roleId: role.id,
                roleName: role.role_name,
                roleCode: role.role_code,
                permissions: JSON.parse(role.permissions || '[]'),
                capabilities: JSON.parse(role.system_capabilities || '[]'),
                canDelegate: JSON.parse(role.can_delegate_to_roles || '[]'),
                scope: role.administrative_scope,
                level: role.role_level,
            }));
            return (0, response_utils_1.createSuccessResponse)({
                data: { permissionMatrices: matrices },
                message: 'Permission matrices retrieved successfully',
            });
        }
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to retrieve permission matrix');
    }
}
async function listHierarchyNodes(queryParams, user, db) {
    try {
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '50');
        const offset = (page - 1) * limit;
        let whereCondition = '';
        const params = [];
        if (user.role !== 'super_admin' && user.districtId) {
            whereCondition = 'WHERE district_id = $1';
            params.push(user.districtId);
        }
        if (queryParams?.type) {
            if (whereCondition) {
                whereCondition += ` AND type = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE type = $${params.length + 1}`;
            }
            params.push(queryParams.type);
        }
        if (queryParams?.level) {
            const level = parseInt(queryParams.level);
            if (whereCondition) {
                whereCondition += ` AND level = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE level = $${params.length + 1}`;
            }
            params.push(level);
        }
        if (queryParams?.active) {
            const isActive = queryParams.active === 'true';
            if (whereCondition) {
                whereCondition += ` AND is_active = $${params.length + 1}`;
            }
            else {
                whereCondition = `WHERE is_active = $${params.length + 1}`;
            }
            params.push(isActive);
        }
        const countQuery = `SELECT COUNT(*) as total FROM hierarchy_nodes ${whereCondition}`;
        const dataQuery = `
      SELECT
        id, name, type, parent_id, level, code,
        metadata, is_active, created_at, updated_at
      FROM hierarchy_nodes
      ${whereCondition}
      ORDER BY level ASC, name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
        params.push(limit, offset);
        const [countResult, nodes] = await Promise.all([
            db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
            db.$queryRawUnsafe(dataQuery, ...params),
        ]);
        const totalCount = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(totalCount / limit);
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                nodes: nodes.map(node => ({
                    ...node,
                    metadata: JSON.parse(node.metadata || '{}'),
                })),
            },
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            message: 'Hierarchy nodes retrieved successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to list hierarchy nodes');
    }
}
async function deleteHierarchyNode(nodeId, user, db) {
    try {
        const children = (await db.$queryRaw `
      SELECT id FROM hierarchy_nodes WHERE parent_id = ${nodeId}
    `);
        if (children.length > 0) {
            return (0, response_utils_1.createErrorResponse)('NODE_HAS_CHILDREN', 'Cannot delete node with children', 400);
        }
        const result = (await db.$queryRaw `
      DELETE FROM hierarchy_nodes
      WHERE id = ${nodeId}
      AND (district_id = ${user.districtId} OR ${user.role === 'super_admin'})
      RETURNING id
    `);
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('NODE_NOT_FOUND', 'Hierarchy node not found or access denied', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { nodeId },
            message: 'Hierarchy node deleted successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to delete hierarchy node');
    }
}
async function updateRoleAssignment(updateData, user, db) {
    try {
        const { assignmentId, expiresAt, isActive } = updateData;
        if (!assignmentId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Assignment ID is required', 400);
        }
        const updateFields = [];
        const params = [];
        let paramIndex = 1;
        if (expiresAt !== undefined) {
            updateFields.push(`expires_at = $${paramIndex++}`);
            params.push(expiresAt ? new Date(expiresAt) : null);
        }
        if (isActive !== undefined) {
            updateFields.push(`is_active = $${paramIndex++}`);
            params.push(isActive);
        }
        if (updateFields.length === 0) {
            return (0, response_utils_1.createErrorResponse)('NO_UPDATE_FIELDS', 'No valid fields to update', 400);
        }
        updateFields.push(`updated_at = NOW()`);
        params.push(assignmentId);
        const query = `
      UPDATE user_administrative_roles
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++}
      RETURNING *
    `;
        const result = (await db.$queryRawUnsafe(query, ...params));
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('ASSIGNMENT_NOT_FOUND', 'Role assignment not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { assignment: result[0] },
            message: 'Role assignment updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update role assignment');
    }
}
async function revokeRole(revokeData, user, db) {
    try {
        const { assignmentId, reason } = revokeData;
        if (!assignmentId) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_ERROR', 'Assignment ID is required', 400);
        }
        const result = (await db.$queryRaw `
      UPDATE user_administrative_roles
      SET is_active = false, revoked_at = NOW(),
          revoked_by = ${user.id}, revocation_reason = ${reason || null},
          updated_at = NOW()
      WHERE id = ${assignmentId}
      RETURNING id, user_id, role_id
    `);
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('ASSIGNMENT_NOT_FOUND', 'Role assignment not found', 404);
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                assignmentId,
                userId: result[0].user_id,
                roleId: result[0].role_id,
            },
            message: 'Role revoked successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to revoke role');
    }
}
exports.default = exports.handler;
//# sourceMappingURL=school-hierarchy-manager.js.map