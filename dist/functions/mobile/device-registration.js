"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceRegistrationHandler = void 0;
const client_1 = require("@prisma/client");
const logger_service_1 = require("../shared/logger.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const joi_1 = require("joi");
const crypto_1 = require("crypto");
// Initialize database client
const prisma = new client_1.PrismaClient();
// Device registration schema
const deviceRegistrationSchema = joi_1.default.object({
    deviceToken: joi_1.default.string().required().min(10).max(500),
    deviceType: joi_1.default.string().valid('ios', 'android', 'web').required(),
    deviceModel: joi_1.default.string().optional().max(100),
    osVersion: joi_1.default.string().optional().max(50),
    appVersion: joi_1.default.string().optional().max(50),
    deviceName: joi_1.default.string().optional().max(100),
    timezone: joi_1.default.string().optional().max(50),
    language: joi_1.default.string().optional().max(10),
    notificationSettings: joi_1.default.object({
        deliveryConfirmations: joi_1.default.boolean().optional().default(true),
        orderUpdates: joi_1.default.boolean().optional().default(true),
        paymentReminders: joi_1.default.boolean().optional().default(true),
        weeklyReports: joi_1.default.boolean().optional().default(true),
        quietHoursStart: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        quietHoursEnd: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional().default({})
});
// Device update schema
const deviceUpdateSchema = joi_1.default.object({
    deviceToken: joi_1.default.string().min(10).max(500).optional(),
    deviceModel: joi_1.default.string().max(100).optional(),
    osVersion: joi_1.default.string().max(50).optional(),
    appVersion: joi_1.default.string().max(50).optional(),
    deviceName: joi_1.default.string().max(100).optional(),
    timezone: joi_1.default.string().max(50).optional(),
    language: joi_1.default.string().max(10).optional(),
    isActive: joi_1.default.boolean().optional(),
    notificationSettings: joi_1.default.object({
        deliveryConfirmations: joi_1.default.boolean().optional(),
        orderUpdates: joi_1.default.boolean().optional(),
        paymentReminders: joi_1.default.boolean().optional(),
        weeklyReports: joi_1.default.boolean().optional(),
        quietHoursStart: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        quietHoursEnd: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional()
});
/**
 * Generate unique device identifier
 */
function generateDeviceId(userId, deviceToken) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(`${userId}:${deviceToken}`);
    return hash.digest('hex').substring(0, 32);
}
/**
 * Register or update mobile device
 */
async function registerMobileDevice(userId, deviceData) {
    const deviceId = generateDeviceId(userId, deviceData.deviceToken);
    // Check if device already exists
    const existingDevice = await prisma.userDevice.findUnique({
        where: { id: deviceId }
    });
    const now = new Date();
    if (existingDevice) {
        // Update existing device
        const updatedDevice = await prisma.userDevice.update({
            where: { id: deviceId },
            data: {
                fcmToken: deviceData.deviceToken, // Map deviceToken to fcmToken for schema compatibility
                deviceModel: deviceData.deviceModel || null,
                osVersion: deviceData.osVersion || null,
                appVersion: deviceData.appVersion || null,
                // Note: deviceName, timezone, language stored in metadata for schema compatibility
                lastSeen: now, // Corrected field name for schema compatibility
                isActive: true,
                notificationSettings: JSON.stringify(deviceData.notificationSettings || {}),
                metadata: JSON.stringify({
                    lastUpdate: now.toISOString(),
                    registrationMethod: 'api_update',
                    deviceName: deviceData.deviceName || null,
                    timezone: deviceData.timezone || null,
                    language: deviceData.language || null
                })
            }
        });
        return updatedDevice;
    }
    else {
        // Create new device
        const newDevice = await prisma.userDevice.create({
            data: {
                id: deviceId,
                deviceId, // Add deviceId field as required by schema
                userId,
                fcmToken: deviceData.deviceToken, // Map deviceToken to fcmToken for schema compatibility
                deviceType: deviceData.deviceType,
                deviceModel: deviceData.deviceModel || null,
                osVersion: deviceData.osVersion || null,
                appVersion: deviceData.appVersion || null,
                // Note: deviceName, timezone, language stored in metadata for schema compatibility
                isActive: true,
                lastSeen: now, // Corrected field name for schema compatibility
                notificationSettings: JSON.stringify(deviceData.notificationSettings || {}),
                metadata: JSON.stringify({
                    registrationDate: now.toISOString(),
                    registrationMethod: 'api_register',
                    initialVersion: deviceData.appVersion || 'unknown',
                    deviceName: deviceData.deviceName || null,
                    timezone: deviceData.timezone || null,
                    language: deviceData.language || null
                })
            }
        }); // Type assertion to resolve complex Prisma type conflicts
        return newDevice;
    }
}
/**
 * Update mobile device
 */
async function updateMobileDevice(deviceId, userId, updateData) {
    // Verify device ownership
    const existingDevice = await prisma.userDevice.findUnique({
        where: { id: deviceId, userId }
    });
    if (!existingDevice) {
        throw new Error('Device not found or access denied');
    }
    // Merge notification settings
    let notificationSettings = {};
    try {
        notificationSettings = JSON.parse(existingDevice.notificationSettings || '{}');
    }
    catch (error) {
        notificationSettings = {};
    }
    if (updateData.notificationSettings) {
        notificationSettings = { ...notificationSettings, ...updateData.notificationSettings };
    }
    const updatedDevice = await prisma.userDevice.update({
        where: { id: deviceId },
        data: {
            ...(updateData.deviceToken && { deviceToken: updateData.deviceToken }),
            ...(updateData.deviceModel !== undefined && { deviceModel: updateData.deviceModel }),
            ...(updateData.osVersion !== undefined && { osVersion: updateData.osVersion }),
            ...(updateData.appVersion !== undefined && { appVersion: updateData.appVersion }),
            ...(updateData.deviceName !== undefined && { deviceName: updateData.deviceName }),
            ...(updateData.timezone !== undefined && { timezone: updateData.timezone }),
            ...(updateData.language !== undefined && { language: updateData.language }),
            ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
            lastSeen: new Date(), // Corrected field name for schema compatibility
            notificationSettings: JSON.stringify(notificationSettings),
            metadata: JSON.stringify({
                ...JSON.parse(existingDevice.metadata || '{}'),
                lastUpdate: new Date().toISOString(),
                updateMethod: 'api_update'
            })
        }
    });
    return updatedDevice;
}
/**
 * Get device notification statistics
 */
async function getDeviceNotificationStats(deviceId) {
    // Note: This would typically query a notifications delivery table
    // For now, we'll return mock statistics
    // Simplified notification statistics to avoid complex groupBy typing issues
    const sentCount = await prisma.notification.count({
        where: {
            data: { contains: deviceId },
            status: 'sent'
        }
    });
    const deliveredCount = await prisma.notification.count({
        where: {
            data: { contains: deviceId },
            status: 'delivered'
        }
    });
    const failedCount = await prisma.notification.count({
        where: {
            data: { contains: deviceId },
            status: 'failed'
        }
    });
    let totalSent = sentCount;
    let totalDelivered = deliveredCount;
    let totalFailed = failedCount;
    const lastNotification = await prisma.notification.findFirst({
        where: {
            data: {
                contains: deviceId
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
    });
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    return {
        totalSent,
        totalDelivered,
        totalFailed,
        lastNotificationAt: lastNotification?.createdAt,
        deliveryRate: Math.round(deliveryRate * 100) / 100
    };
}
/**
 * Format device response
 */
async function formatDeviceResponse(device) {
    let notificationSettings = {};
    try {
        notificationSettings = JSON.parse(device.notificationSettings || '{}');
    }
    catch (error) {
        notificationSettings = {};
    }
    const notificationStats = await getDeviceNotificationStats(device.id);
    return {
        id: device.id,
        deviceToken: device.deviceToken,
        deviceType: device.deviceType,
        deviceModel: device.deviceModel || undefined,
        osVersion: device.osVersion || undefined,
        appVersion: device.appVersion || undefined,
        deviceName: device.deviceName || undefined,
        timezone: device.timezone || undefined,
        language: device.language || undefined,
        isActive: device.isActive,
        lastSeenAt: device.lastSeenAt,
        registeredAt: device.registeredAt,
        notificationSettings,
        notificationStats
    };
}
/**
 * Deactivate mobile device
 */
async function deactivateMobileDevice(deviceId, userId) {
    const device = await prisma.userDevice.findUnique({
        where: { id: deviceId, userId }
    });
    if (!device) {
        throw new Error('Device not found or access denied');
    }
    await prisma.userDevice.update({
        where: { id: deviceId },
        data: {
            isActive: false,
            // Note: deactivatedAt stored in metadata for schema compatibility
            metadata: JSON.stringify({
                ...JSON.parse(device.metadata || '{}'),
                deactivatedAt: new Date().toISOString(),
                deactivationMethod: 'api_delete'
            })
        }
    });
}
/**
 * Create audit log for device operations
 */
async function createDeviceAuditLog(deviceId, action, userId, details) {
    await prisma.auditLog.create({
        data: {
            entityType: 'UserDevice',
            entityId: deviceId,
            action,
            changes: JSON.stringify(details),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                action: `MOBILE_DEVICE_${action}`,
                timestamp: new Date().toISOString()
            })
        }
    });
}
/**
 * Mobile Device Registration Lambda Handler
 */
const deviceRegistrationHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    const httpMethod = event.httpMethod;
    try {
        logger.info('Mobile device registration request started', { requestId, httpMethod });
        // Authenticate request
        const authResult = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        // Check authentication success and extract user
        if (!authResult.success || !authResult.user) {
            logger.warn('Authentication failed', { requestId, error: authResult.error });
            return (0, response_utils_1.createErrorResponse)(401, 'Authentication failed');
        }
        const authenticatedUser = authResult.user;
        switch (httpMethod) {
            case 'POST':
                return await handleDeviceRegistration(event, requestId, authenticatedUser);
            case 'PUT':
                return await handleDeviceUpdate(event, requestId, authenticatedUser);
            case 'DELETE':
                return await handleDeviceDeactivation(event, requestId, authenticatedUser);
            case 'GET':
                return await handleGetDevices(event, requestId, authenticatedUser);
            default:
                return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed');
        }
    }
    catch (error) {
        logger.error('Mobile device registration failed', {
            requestId,
            httpMethod,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, 'Failed to process device registration request');
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.deviceRegistrationHandler = deviceRegistrationHandler;
/**
 * Handle device registration
 */
async function handleDeviceRegistration(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: deviceData } = deviceRegistrationSchema.validate(requestBody);
    if (error) {
        logger.warn('Invalid device registration data', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.details);
    }
    // Register device
    const device = await registerMobileDevice(authenticatedUser.id, deviceData);
    // Create audit log
    await createDeviceAuditLog(device.id, 'REGISTER', authenticatedUser.id, {
        deviceType: device.deviceType,
        deviceModel: device.deviceModel,
        appVersion: device.appVersion
    });
    // Format response
    const deviceResponse = await formatDeviceResponse(device);
    logger.info('Mobile device registered successfully', {
        requestId,
        deviceId: device.id,
        deviceType: device.deviceType,
        userId: authenticatedUser.id
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile device registered successfully',
        data: deviceResponse
    });
}
/**
 * Handle device update
 */
async function handleDeviceUpdate(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    // Extract device ID from path parameters
    const deviceId = event.pathParameters?.deviceId;
    if (!deviceId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Device ID is required');
    }
    // Parse and validate request body
    const requestBody = JSON.parse(event.body || '{}');
    const { error, value: updateData } = deviceUpdateSchema.validate(requestBody);
    if (error) {
        logger.warn('Invalid device update data', { requestId, error: error.details });
        return (0, response_utils_1.createErrorResponse)(400, 'Invalid request data', error.details);
    }
    // Update device
    const device = await updateMobileDevice(deviceId, authenticatedUser.id, updateData);
    // Create audit log
    await createDeviceAuditLog(deviceId, 'UPDATE', authenticatedUser.id, updateData);
    // Format response
    const deviceResponse = await formatDeviceResponse(device);
    logger.info('Mobile device updated successfully', {
        requestId,
        deviceId,
        userId: authenticatedUser.id
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile device updated successfully',
        data: deviceResponse
    });
}
/**
 * Handle device deactivation
 */
async function handleDeviceDeactivation(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    // Extract device ID from path parameters
    const deviceId = event.pathParameters?.deviceId;
    if (!deviceId) {
        return (0, response_utils_1.createErrorResponse)(400, 'Device ID is required');
    }
    // Deactivate device
    await deactivateMobileDevice(deviceId, authenticatedUser.id);
    // Create audit log
    await createDeviceAuditLog(deviceId, 'DEACTIVATE', authenticatedUser.id, {
        reason: 'user_requested',
        timestamp: new Date().toISOString()
    });
    logger.info('Mobile device deactivated successfully', {
        requestId,
        deviceId,
        userId: authenticatedUser.id
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile device deactivated successfully'
    });
}
/**
 * Handle get devices
 */
async function handleGetDevices(event, requestId, authenticatedUser) {
    const logger = logger_service_1.LoggerService.getInstance();
    // Get user's devices
    const devices = await prisma.userDevice.findMany({
        where: {
            userId: authenticatedUser.id,
            isActive: true
        },
        orderBy: { lastSeen: 'desc' } // Corrected field name for schema compatibility
    });
    // Format devices
    const deviceResponses = await Promise.all(devices.map(device => formatDeviceResponse(device)));
    logger.info('User devices retrieved successfully', {
        requestId,
        deviceCount: devices.length,
        userId: authenticatedUser.id
    });
    return (0, response_utils_1.createSuccessResponse)({
        message: 'Mobile devices retrieved successfully',
        data: deviceResponses
    });
}
