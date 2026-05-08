/**
 * HASIVU Platform - Tenant Management Lambda Function
 * Enterprise multi-tenant administration and configuration
 * Implements: Tenant CRUD operations, configuration management, resource allocation
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Prisma } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  handleError,
} from '../../shared/response.utils';
import { databaseService } from '../../shared/database.service';

/**
 * Tenant interface
 */
interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  isActive: boolean;
  configuration: TenantConfiguration;
  resources: TenantResources;
  billing: TenantBilling;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant configuration interface
 */
interface TenantConfiguration {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
  };
  features: {
    rfidEnabled: boolean;
    paymentsEnabled: boolean;
    notificationsEnabled: boolean;
    analyticsEnabled: boolean;
  };
  integrations: {
    paymentGateway: string;
    smsProvider: string;
    emailProvider: string;
  };
}

/**
 * Tenant resources interface
 */
interface TenantResources {
  maxSchools: number;
  maxStudents: number;
  maxOrders: number;
  storageLimit: number;
  bandwidthLimit: number;
}

/**
 * Tenant billing interface
 */
interface TenantBilling {
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  monthlyFee: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
}

/**
 * Main tenant manager handler
 * Routes requests based on HTTP method and path
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('tenantManagerHandler started', {
    httpMethod: event.httpMethod,
    pathParameters: event.pathParameters,
  });

  try {
    const { httpMethod, pathParameters, queryStringParameters, body } = event;
    const tenantId = pathParameters?.tenantId;

    // Route based on HTTP method and path
    switch (httpMethod) {
      case 'GET':
        if (tenantId) {
          return await getTenant(tenantId);
        } else {
          return await listTenants(queryStringParameters || {});
        }

      case 'POST':
        return await createTenant(JSON.parse(body || '{}'));

      case 'PUT':
        return await updateTenant(tenantId!, JSON.parse(body || '{}'));

      case 'DELETE':
        return await deleteTenant(tenantId!);

      default:
        return createErrorResponse('TENANT_METHOD_NOT_ALLOWED', 'Method not allowed', 405);
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logger.error('tenantManagerHandler failed', error as Error, { duration });
    return handleError(error, 'Tenant operation failed');
  }
};

/**
 * Get tenant details
 */
async function getTenant(tenantId: string): Promise<APIGatewayProxyResult> {
  try {
    const db = databaseService.client;

    // Using Prisma raw query for external tenant database
    const result = (await db.$queryRaw`
      SELECT * FROM tenants WHERE id = ${tenantId}
    `) as any[];

    if (!result.length) {
      return createErrorResponse('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }

    const tenant = result[0];

    return createSuccessResponse({
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
          updatedAt: tenant.updatedAt,
        },
      },
      message: 'Tenant retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to get tenant');
  }
}

/**
 * List tenants with filtering and pagination
 */
async function listTenants(queryParams?: {
  [key: string]: string | undefined;
}): Promise<APIGatewayProxyResult> {
  try {
    const db = databaseService.client;

    const page = parseInt(queryParams?.page || '1');
    const limit = parseInt(queryParams?.limit || '20');
    const offset = (page - 1) * limit;
    const isActive =
      queryParams?.active === 'true' ? true : queryParams?.active === 'false' ? false : undefined;

    // Get total count and paginated results
    let countResult: any[];
    let result: any[];

    if (isActive !== undefined) {
      countResult =
        (await db.$queryRaw`SELECT COUNT(*) as total FROM tenants WHERE isActive = ${isActive}`) as any[];
      result = (await db.$queryRaw`
        SELECT * FROM tenants 
        WHERE isActive = ${isActive}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as any[];
    } else {
      countResult = (await db.$queryRaw`SELECT COUNT(*) as total FROM tenants`) as any[];
      result = (await db.$queryRaw`
        SELECT * FROM tenants 
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `) as any[];
    }

    const totalCount = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / limit);

    return createSuccessResponse({
      data: {
        tenants: result.map((row: any) => ({
          id: row.id,
          name: row.name,
          domain: row.domain,
          subdomain: row.subdomain,
          isActive: row.isActive,
          configuration: row.configuration,
          resources: row.resources,
          billing: row.billing,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
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
      message: 'Tenants retrieved successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to list tenants');
  }
}

/**
 * Create new tenant
 */
async function createTenant(tenantData: any): Promise<APIGatewayProxyResult> {
  try {
    // Basic validation
    if (!tenantData.name || !tenantData.domain) {
      return createErrorResponse('TENANT_VALIDATION_FAILED', 'Name and domain are required', 400);
    }

    const db = databaseService.client;

    // Set default configuration if not provided
    const defaultConfiguration: TenantConfiguration = {
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        logo: '/default-logo.png',
        favicon: '/default-favicon.ico',
      },
      features: {
        rfidEnabled: true,
        paymentsEnabled: true,
        notificationsEnabled: true,
        analyticsEnabled: true,
      },
      integrations: {
        paymentGateway: 'razorpay',
        smsProvider: 'twilio',
        emailProvider: 'sendgrid',
      },
    };

    // Set default resources based on plan
    const defaultResources: TenantResources = {
      maxSchools:
        tenantData.billing?.plan === 'enterprise'
          ? 100
          : tenantData.billing?.plan === 'premium'
            ? 25
            : tenantData.billing?.plan === 'standard'
              ? 5
              : 1,
      maxStudents:
        tenantData.billing?.plan === 'enterprise'
          ? 50000
          : tenantData.billing?.plan === 'premium'
            ? 10000
            : tenantData.billing?.plan === 'standard'
              ? 2000
              : 500,
      maxOrders:
        tenantData.billing?.plan === 'enterprise'
          ? 100000
          : tenantData.billing?.plan === 'premium'
            ? 20000
            : tenantData.billing?.plan === 'standard'
              ? 5000
              : 1000,
      storageLimit:
        tenantData.billing?.plan === 'enterprise'
          ? 1000
          : tenantData.billing?.plan === 'premium'
            ? 500
            : tenantData.billing?.plan === 'standard'
              ? 100
              : 50, // GB
      bandwidthLimit:
        tenantData.billing?.plan === 'enterprise'
          ? 10000
          : tenantData.billing?.plan === 'premium'
            ? 5000
            : tenantData.billing?.plan === 'standard'
              ? 1000
              : 500, // GB
    };

    // Set default billing if not provided
    const defaultBilling: TenantBilling = {
      plan: tenantData.billing?.plan || 'basic',
      monthlyFee: tenantData.billing?.monthlyFee || 29.99,
      currency: tenantData.billing?.currency || 'INR',
      billingCycle: tenantData.billing?.billingCycle || 'monthly',
      nextBillingDate:
        tenantData.billing?.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    // Merge with user provided data
    const configuration = { ...defaultConfiguration, ...tenantData.configuration };
    const resources = { ...defaultResources, ...tenantData.resources };
    const billing = { ...defaultBilling, ...tenantData.billing };

    // Generate tenant ID
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create tenant in external database
    const result = (await db.$queryRaw`
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
    `) as any[];

    const createdTenant = result[0];

    return createSuccessResponse({
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
          updatedAt: createdTenant.updatedAt,
        },
      },
      message: 'Tenant created successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to create tenant');
  }
}

/**
 * Update tenant
 */
async function updateTenant(tenantId: string, updateData: any): Promise<APIGatewayProxyResult> {
  try {
    const db = databaseService.client;

    // Check if tenant exists
    const existing = (await db.$queryRaw`
      SELECT id FROM tenants WHERE id = ${tenantId}
    `) as any[];

    if (!existing.length) {
      return createErrorResponse('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }

    // Build update query dynamically
    const updateFields = [];
    const params: any[] = [];

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
    let result: any[];
    if (updateFields.length === 0) {
      // No fields to update, just return current tenant
      result = (await db.$queryRaw`
        SELECT * FROM tenants WHERE id = ${tenantId}
      `) as any[];
    } else {
      // Perform conditional update based on fields
      if (updateFields.includes('name') && updateFields.includes('domain')) {
        result = (await db.$queryRaw`
          UPDATE tenants 
          SET name = ${params[0]}, domain = ${params[1]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `) as any[];
      } else if (updateFields.includes('name')) {
        result = (await db.$queryRaw`
          UPDATE tenants 
          SET name = ${params[0]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `) as any[];
      } else if (updateFields.includes('domain')) {
        result = (await db.$queryRaw`
          UPDATE tenants 
          SET domain = ${params[0]}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `) as any[];
      } else if (updateFields.includes('isActive')) {
        const activeValue =
          updateFields.indexOf('isActive') !== -1 ? params[updateFields.indexOf('isActive')] : null;
        result = (await db.$queryRaw`
          UPDATE tenants 
          SET isActive = ${activeValue}, updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `) as any[];
      } else {
        // Fallback: update all provided fields
        result = (await db.$queryRaw`
          UPDATE tenants 
          SET updatedAt = NOW()
          WHERE id = ${tenantId}
          RETURNING *
        `) as any[];
      }
    }

    const updatedTenant = result[0];

    return createSuccessResponse({
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
          updatedAt: updatedTenant.updatedAt,
        },
      },
      message: 'Tenant updated successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to update tenant');
  }
}

/**
 * Delete tenant
 */
async function deleteTenant(tenantId: string): Promise<APIGatewayProxyResult> {
  try {
    const db = databaseService.client;

    const result = (await db.$queryRaw`
      DELETE FROM tenants WHERE id = ${tenantId} RETURNING id
    `) as any[];

    if (!result.length) {
      return createErrorResponse('TENANT_NOT_FOUND', 'Tenant not found', 404);
    }

    return createSuccessResponse({
      data: { tenantId },
      message: 'Tenant deleted successfully',
    });
  } catch (error: unknown) {
    return handleError(error, 'Failed to delete tenant');
  }
}
