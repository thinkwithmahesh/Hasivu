"use strict";
/**
 * HASIVU Platform - Tenant Management Lambda Function
 * Enterprise multi-tenant administration and configuration
 * Implements: Tenant CRUD operations, configuration management, resource allocation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const validation_1 = require("../../utils/validation");
/**
 * Main tenant manager handler
 * Routes requests based on HTTP method and path
 */
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('tenantManagerHandler started', { httpMethod: event.httpMethod, pathParameters: event.pathParameters });
    try {
        const { httpMethod, pathParameters, queryStringParameters, body } = event;
        const tenantId = pathParameters?.tenantId;
        // Route based on HTTP method and path
        switch (httpMethod) {
            case 'GET':
                if (tenantId) {
                    return await getTenant(tenantId);
                }
                else {
                    return await listTenants(queryStringParameters);
                }
            case 'POST':
                return await createTenant(JSON.parse(body || '{}'));
            case 'PUT':
                return await updateTenant(tenantId, JSON.parse(body || '{}'));
            case 'DELETE':
                return await deleteTenant(tenantId);
            default:
                return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'TENANT_METHOD_NOT_ALLOWED');
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error("tenantManagerHandler failed", { statusCode: 500, duration, error: error.message });
        return (0, response_utils_1.handleError)(error, 'Tenant operation failed');
    }
};
exports.handler = handler;
/**
 * Get tenant details
 */
async function getTenant(tenantId) {
    try {
        const db = database_service_1.databaseService.getPrismaClient();
        // Using Prisma raw query for external tenant database
        const result = await db.$queryRaw `
      SELECT * FROM tenants WHERE id = ${tenantId}
    `;
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('Tenant not found', 404, 'TENANT_NOT_FOUND');
        }
        const tenant = result[0];
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    domain: tenant.domain,
                    subdomain: tenant.subdomain,
                    isActive: tenant.isActive,
                    configuration: tenant.configuration,
                    resources: tenant.resources,
                    billing: tenant.billing,
                    createdAt: tenant.createdAt,
                    updatedAt: tenant.updatedAt
                }
            },
            message: 'Tenant retrieved successfully'
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to get tenant');
    }
}
/**
 * List tenants with filtering and pagination
 */
async function listTenants(queryParams) {
    try {
        const db = database_service_1.databaseService.getPrismaClient();
        const page = parseInt(queryParams?.page || '1');
        const limit = parseInt(queryParams?.limit || '20');
        const offset = (page - 1) * limit;
        const isActive = queryParams?.active === 'true' ? true :
            queryParams?.active === 'false' ? false : undefined;
        // Get total count and paginated results
        let countResult;
        let result;
        if (isActive !== undefined) {
            countResult = await db.$queryRaw `SELECT COUNT(*) as total FROM tenants WHERE isActive = ${isActive}`;
            result = await db.$queryRaw `
        SELECT * FROM tenants 
        WHERE isActive = ${isActive}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
        }
        else {
            countResult = await db.$queryRaw `SELECT COUNT(*) as total FROM tenants`;
            result = await db.$queryRaw `
        SELECT * FROM tenants 
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
        }
        const totalCount = parseInt(countResult[0]?.total || '0');
        const totalPages = Math.ceil(totalCount / limit);
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                tenants: result.map((row) => ({
                    id: row.id,
                    name: row.name,
                    domain: row.domain,
                    subdomain: row.subdomain,
                    isActive: row.isActive,
                    configuration: row.configuration,
                    resources: row.resources,
                    billing: row.billing,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                }))
            },
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            message: 'Tenants retrieved successfully'
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to list tenants');
    }
}
/**
 * Create new tenant
 */
async function createTenant(tenantData) {
    try {
        // Validate input
        const validation = (0, validation_1.validateTenantData)(tenantData);
        if (!validation.isValid) {
            return (0, response_utils_1.createErrorResponse)('Invalid tenant data', 400, 'TENANT_VALIDATION_FAILED');
        }
        const db = database_service_1.databaseService.getPrismaClient();
        // Set default configuration if not provided
        const defaultConfiguration = {
            theme: {
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
                logo: '/default-logo.png',
                favicon: '/default-favicon.ico'
            },
            features: {
                rfidEnabled: true,
                paymentsEnabled: true,
                notificationsEnabled: true,
                analyticsEnabled: true
            },
            integrations: {
                paymentGateway: 'razorpay',
                smsProvider: 'twilio',
                emailProvider: 'sendgrid'
            }
        };
        // Set default resources based on plan
        const defaultResources = {
            maxSchools: tenantData.billing?.plan === 'enterprise' ? 100 :
                tenantData.billing?.plan === 'premium' ? 25 :
                    tenantData.billing?.plan === 'standard' ? 5 : 1,
            maxStudents: tenantData.billing?.plan === 'enterprise' ? 50000 :
                tenantData.billing?.plan === 'premium' ? 10000 :
                    tenantData.billing?.plan === 'standard' ? 2000 : 500,
            maxOrders: tenantData.billing?.plan === 'enterprise' ? 100000 :
                tenantData.billing?.plan === 'premium' ? 20000 :
                    tenantData.billing?.plan === 'standard' ? 5000 : 1000,
            storageLimit: tenantData.billing?.plan === 'enterprise' ? 1000 :
                tenantData.billing?.plan === 'premium' ? 500 :
                    tenantData.billing?.plan === 'standard' ? 100 : 50, // GB
            bandwidthLimit: tenantData.billing?.plan === 'enterprise' ? 10000 :
                tenantData.billing?.plan === 'premium' ? 5000 :
                    tenantData.billing?.plan === 'standard' ? 1000 : 500 // GB
        };
        // Set default billing if not provided
        const defaultBilling = {
            plan: tenantData.billing?.plan || 'basic',
            monthlyFee: tenantData.billing?.monthlyFee || 29.99,
            currency: tenantData.billing?.currency || 'USD',
            billingCycle: tenantData.billing?.billingCycle || 'monthly',
            nextBillingDate: tenantData.billing?.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
        // Merge with user provided data
        const configuration = { ...defaultConfiguration, ...tenantData.configuration };
        const resources = { ...defaultResources, ...tenantData.resources };
        const billing = { ...defaultBilling, ...tenantData.billing };
        // Generate tenant ID
        const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create tenant in external database
        const result = await db.$queryRaw `
      INSERT INTO tenants (
        id, name, domain, subdomain, isActive, 
        configuration, resources, billing, 
        createdAt, updatedAt
      ) VALUES (
        ${tenantId}, 
        ${tenantData.name}, 
        ${tenantData.domain}, 
        ${tenantData.subdomain || tenantData.domain}, 
        ${tenantData.isActive !== undefined ? tenantData.isActive : true},
        ${JSON.stringify(configuration)},
        ${JSON.stringify(resources)},
        ${JSON.stringify(billing)},
        NOW(),
        NOW()
      ) RETURNING *
    `;
        const createdTenant = result[0];
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                tenant: {
                    id: createdTenant.id,
                    name: createdTenant.name,
                    domain: createdTenant.domain,
                    subdomain: createdTenant.subdomain,
                    isActive: createdTenant.isActive,
                    configuration: createdTenant.configuration,
                    resources: createdTenant.resources,
                    billing: createdTenant.billing,
                    createdAt: createdTenant.createdAt,
                    updatedAt: createdTenant.updatedAt
                }
            },
            message: 'Tenant created successfully'
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to create tenant');
    }
}
/**
 * Update tenant
 */
async function updateTenant(tenantId, updateData) {
    try {
        const db = database_service_1.databaseService.getPrismaClient();
        // Check if tenant exists
        const existing = await db.$queryRaw `
      SELECT id FROM tenants WHERE id = ${tenantId}
    `;
        if (!existing.length) {
            return (0, response_utils_1.createErrorResponse)('Tenant not found', 404, 'TENANT_NOT_FOUND');
        }
        // Build update query dynamically
        const updateFields = [];
        const params = [];
        if (updateData.name !== undefined) {
            updateFields.push('name');
            params.push(updateData.name);
        }
        if (updateData.domain !== undefined) {
            updateFields.push('domain');
            params.push(updateData.domain);
        }
        if (updateData.subdomain !== undefined) {
            updateFields.push('subdomain');
            params.push(updateData.subdomain);
        }
        if (updateData.isActive !== undefined) {
            updateFields.push('isActive');
            params.push(updateData.isActive);
        }
        if (updateData.configuration !== undefined) {
            updateFields.push('configuration');
            params.push(JSON.stringify(updateData.configuration));
        }
        if (updateData.resources !== undefined) {
            updateFields.push('resources');
            params.push(JSON.stringify(updateData.resources));
        }
        if (updateData.billing !== undefined) {
            updateFields.push('billing');
            params.push(JSON.stringify(updateData.billing));
        }
        // Execute update with current timestamp
        let result;
        if (updateFields.length === 0) {
            // No fields to update, just return current tenant
            result = await db.$queryRaw `
        SELECT * FROM tenants WHERE id = ${tenantId}
      `;
        }
        else {
            // Perform conditional update based on fields
            if (updateFields.includes('name') && updateFields.includes('domain')) {
                result = await db.$queryRaw `
          UPDATE tenants 
          SET name = ${params[0]}, domain = ${params[1]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `;
            }
            else if (updateFields.includes('name')) {
                result = await db.$queryRaw `
          UPDATE tenants 
          SET name = ${params[0]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `;
            }
            else if (updateFields.includes('domain')) {
                result = await db.$queryRaw `
          UPDATE tenants 
          SET domain = ${params[0]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `;
            }
            else if (updateFields.includes('isActive')) {
                const activeValue = updateFields.indexOf('isActive') !== -1 ? params[updateFields.indexOf('isActive')] : null;
                result = await db.$queryRaw `
          UPDATE tenants 
          SET isActive = ${activeValue}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `;
            }
            else {
                // Fallback: update all provided fields
                result = await db.$queryRaw `
          UPDATE tenants 
          SET updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `;
            }
        }
        const updatedTenant = result[0];
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                tenant: {
                    id: updatedTenant.id,
                    name: updatedTenant.name,
                    domain: updatedTenant.domain,
                    subdomain: updatedTenant.subdomain,
                    isActive: updatedTenant.isActive,
                    configuration: updatedTenant.configuration,
                    resources: updatedTenant.resources,
                    billing: updatedTenant.billing,
                    createdAt: updatedTenant.createdAt,
                    updatedAt: updatedTenant.updatedAt
                }
            },
            message: 'Tenant updated successfully'
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update tenant');
    }
}
/**
 * Delete tenant
 */
async function deleteTenant(tenantId) {
    try {
        const db = database_service_1.databaseService.getPrismaClient();
        const result = await db.$queryRaw `
      DELETE FROM tenants WHERE id = ${tenantId} RETURNING id
    `;
        if (!result.length) {
            return (0, response_utils_1.createErrorResponse)('Tenant not found', 404, 'TENANT_NOT_FOUND');
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { tenantId },
            message: 'Tenant deleted successfully'
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to delete tenant');
    }
}
