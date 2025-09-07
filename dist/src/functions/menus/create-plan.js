"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenuPlanHandler = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const database_service_1 = require("../shared/database.service");
const response_utils_1 = require("../shared/response.utils");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const logger = logger_service_1.LoggerService.getInstance();
const validator = validation_service_1.ValidationService.getInstance();
const db = database_service_1.LambdaDatabaseService.getInstance();
async function validateSchoolAccess(schoolId, userId) {
    try {
        const school = await db.prisma.school.findFirst({
            where: { id: schoolId },
            select: {
                id: true,
                name: true,
                isActive: true,
                users: {
                    where: { id: userId },
                    select: {
                        id: true,
                        role: true,
                        isActive: true
                    }
                }
            }
        });
        if (!school) {
            throw new Error('School not found');
        }
        if (!school.isActive) {
            throw new Error('School is not active');
        }
        const userAccess = school.users[0];
        if (!userAccess) {
            throw new Error('User does not have access to this school');
        }
        if (!userAccess.isActive) {
            throw new Error('User access is not active');
        }
        const allowedRoles = ['school_admin', 'admin', 'super_admin', 'staff'];
        if (!allowedRoles.includes(userAccess.role)) {
            throw new Error('Insufficient permissions to create menu plans');
        }
        return { school, user: userAccess };
    }
    catch (error) {
        logger.error('School access validation failed', { schoolId, userId, error: error.message });
        throw error;
    }
}
function validateDateRange(startDate, endDate) {
    const now = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(now.getFullYear() + 1);
    if (startDate < now) {
        throw new Error('Start date cannot be in the past');
    }
    if (endDate <= startDate) {
        throw new Error('End date must be after start date');
    }
    if (endDate > maxFutureDate) {
        throw new Error('End date cannot be more than 1 year in the future');
    }
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 365) {
        throw new Error('Menu plan duration cannot exceed 365 days');
    }
}
async function checkForOverlappingPlans(schoolId, startDate, endDate, excludePlanId) {
    try {
        const overlappingPlans = await db.prisma.menuPlan.findMany({
            where: {
                schoolId,
                status: { not: 'cancelled' },
                OR: [
                    {
                        AND: [
                            { startDate: { lte: startDate } },
                            { endDate: { gte: startDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: endDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { gte: startDate } },
                            { endDate: { lte: endDate } }
                        ]
                    }
                ],
                ...(excludePlanId && { id: { not: excludePlanId } })
            },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true
            }
        });
        if (overlappingPlans.length > 0) {
            const conflictingPlan = overlappingPlans[0];
            throw new Error(`Menu plan conflicts with existing plan: ${conflictingPlan.name} (${conflictingPlan.startDate.toISOString().split('T')[0]} to ${conflictingPlan.endDate.toISOString().split('T')[0]})`);
        }
    }
    catch (error) {
        logger.error('Overlap check failed', { schoolId, startDate, endDate, error: error.message });
        throw error;
    }
}
function validateMealTypes(mealTypes) {
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!mealTypes || mealTypes.length === 0) {
        throw new Error('At least one meal type must be specified');
    }
    for (const mealType of mealTypes) {
        if (!validMealTypes.includes(mealType)) {
            throw new Error(`Invalid meal type: ${mealType}. Valid types: ${validMealTypes.join(', ')}`);
        }
    }
    const uniqueMealTypes = [...new Set(mealTypes)];
    if (uniqueMealTypes.length !== mealTypes.length) {
        throw new Error('Duplicate meal types are not allowed');
    }
}
async function validateTemplateReference(templateId, schoolId) {
    try {
        const template = await db.prisma.menuPlan.findFirst({
            where: {
                id: templateId,
                schoolId,
                isTemplate: true,
                status: 'active'
            },
            select: {
                id: true,
                name: true
            }
        });
        if (!template) {
            throw new Error('Template not found or not accessible');
        }
        return template;
    }
    catch (error) {
        logger.error('Template validation failed', { templateId, schoolId, error: error.message });
        throw error;
    }
}
async function createMenuPlan(planData, userId) {
    try {
        const startDate = new Date(planData.startDate);
        const endDate = new Date(planData.endDate);
        const settings = planData.settings || {
            defaultPortionSize: 1,
            allowModifications: true,
            nutritionTargets: {},
            restrictions: []
        };
        const menuPlan = await db.prisma.menuPlan.create({
            data: {
                name: planData.name.trim(),
                description: planData.description?.trim(),
                schoolId: planData.schoolId,
                startDate,
                endDate,
                status: 'draft',
                isTemplate: planData.isTemplate || false,
                metadata: JSON.stringify({
                    mealTypes: planData.mealTypes,
                    settings: settings,
                    templateId: planData.templateId || null
                }),
                createdBy: userId
            },
            select: {
                id: true,
                name: true,
                description: true,
                schoolId: true,
                startDate: true,
                endDate: true,
                status: true,
                isTemplate: true,
                metadata: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!planData.isTemplate) {
            await createMealSlots(menuPlan.id, startDate, endDate, planData.mealTypes);
        }
        const metadata = menuPlan.metadata ? JSON.parse(menuPlan.metadata) : {};
        return {
            ...menuPlan,
            startDate: menuPlan.startDate.toISOString(),
            endDate: menuPlan.endDate.toISOString(),
            createdAt: menuPlan.createdAt.toISOString(),
            updatedAt: menuPlan.updatedAt.toISOString(),
            mealTypes: metadata.mealTypes || [],
            settings: metadata.settings || {},
            templateId: metadata.templateId || null
        };
    }
    catch (error) {
        logger.error('Menu plan creation failed', { planData, userId, error: error.message });
        throw error;
    }
}
async function createMealSlots(menuPlanId, startDate, endDate, mealTypes) {
    try {
        const slots = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            for (const mealType of mealTypes) {
                slots.push({
                    menuPlanId,
                    date: new Date(currentDate),
                    mealType,
                    status: 'empty',
                    isAvailable: true
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        logger.info('Meal slots created', { menuPlanId, slotsCount: slots.length });
    }
    catch (error) {
        logger.error('Meal slots creation failed', { menuPlanId, error: error.message });
        throw error;
    }
}
const createMenuPlanHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger.info('Create menu plan request started', { requestId });
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)(405, 'Method not allowed', undefined, 'METHOD_NOT_ALLOWED');
        }
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = (0, response_utils_1.parseRequestBody)(event.body);
        if (!requestBody) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid request body', undefined, 'INVALID_REQUEST_BODY');
        }
        const planData = requestBody;
        const validationErrors = [];
        if (!planData.name || planData.name.trim().length === 0) {
            validationErrors.push('Name is required');
        }
        if (!planData.schoolId) {
            validationErrors.push('School ID is required');
        }
        if (!planData.startDate) {
            validationErrors.push('Start date is required');
        }
        if (!planData.endDate) {
            validationErrors.push('End date is required');
        }
        if (!planData.mealTypes || !Array.isArray(planData.mealTypes)) {
            validationErrors.push('Meal types array is required');
        }
        if (validationErrors.length > 0) {
            logger.warn('Menu plan validation failed', { requestId, errors: validationErrors });
            return (0, response_utils_1.createErrorResponse)(400, `Validation failed: ${validationErrors.join(', ')}`, undefined, 'VALIDATION_FAILED');
        }
        if (planData.name.trim().length > 100) {
            return (0, response_utils_1.createErrorResponse)(400, 'Name cannot exceed 100 characters', undefined, 'NAME_TOO_LONG');
        }
        if (planData.description && planData.description.trim().length > 500) {
            return (0, response_utils_1.createErrorResponse)(400, 'Description cannot exceed 500 characters', undefined, 'DESCRIPTION_TOO_LONG');
        }
        await validateSchoolAccess(planData.schoolId, authenticatedUser.userId);
        validateMealTypes(planData.mealTypes);
        const startDate = new Date(planData.startDate);
        const endDate = new Date(planData.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid date format', undefined, 'INVALID_DATE_FORMAT');
        }
        validateDateRange(startDate, endDate);
        await checkForOverlappingPlans(planData.schoolId, startDate, endDate);
        if (planData.templateId) {
            await validateTemplateReference(planData.templateId, planData.schoolId);
        }
        const menuPlan = await createMenuPlan(planData, authenticatedUser.userId);
        const duration = Date.now() - startTime;
        logger.info('Menu plan created successfully', {
            requestId,
            menuPlanId: menuPlan.id,
            duration
        });
        return (0, response_utils_1.createSuccessResponse)({
            menuPlan
        }, 'Menu plan created successfully', 201);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Create menu plan request failed', {
            requestId,
            duration,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, requestId);
    }
};
exports.createMenuPlanHandler = createMenuPlanHandler;
//# sourceMappingURL=create-plan.js.map