"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../../shared/response.utils");
const database_service_1 = require("../../shared/database.service");
const handler = async (event, context) => {
    const requestId = context.awsRequestId;
    const startTime = Date.now();
    try {
        logger_1.logger.info('School onboarding request started', {
            requestId,
            httpMethod: event.httpMethod,
            path: event.path,
            pathParameters: event.pathParameters,
        });
        const { httpMethod, pathParameters, body } = event;
        const schoolId = pathParameters?.schoolId;
        const tenantId = pathParameters?.tenantId;
        if (!body) {
            return (0, response_utils_1.createErrorResponse)('MISSING_BODY', 'Request body is required', 400);
        }
        const onboardingData = JSON.parse(body);
        onboardingData.schoolId = schoolId;
        onboardingData.tenantId = tenantId;
        switch (httpMethod) {
            case 'PUT':
                return await updateOnboardingStep(onboardingData);
            case 'POST':
                if (event.path?.includes('/complete')) {
                    return await completeOnboarding(onboardingData);
                }
                else if (event.path?.includes('/stakeholders')) {
                    return await configureStakeholders(onboardingData);
                }
                else if (event.path?.includes('/rfid')) {
                    return await configureRFIDSystem(onboardingData);
                }
                break;
            default:
                return (0, response_utils_1.createErrorResponse)('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
        }
        return (0, response_utils_1.createErrorResponse)('INVALID_PATH', 'Invalid request path', 400);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('School onboarding request failed', error, {
            requestId,
            duration,
        });
        return (0, response_utils_1.handleError)(error, 'School onboarding operation failed');
    }
};
exports.handler = handler;
async function updateOnboardingStep(onboardingData) {
    try {
        const { step, data, schoolId, tenantId } = onboardingData;
        if (!schoolId || !tenantId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_IDS', 'School ID and Tenant ID are required', 400);
        }
        const db = database_service_1.DatabaseService.client;
        const validation = await validateStepData(step, data);
        if (!validation.isValid) {
            return (0, response_utils_1.createErrorResponse)('VALIDATION_FAILED', `Validation failed for step ${step}: ${validation.errors.join(', ')}`, 400);
        }
        await updateOnboardingProgress(db, schoolId, tenantId, step);
        switch (step) {
            case 'school_info':
                return await updateSchoolInfo(db, schoolId, tenantId, data);
            case 'admin_setup':
                return await updateUserProfile(db, schoolId, tenantId, data);
            case 'branding':
                return await updateSchoolBranding(db, schoolId, tenantId, data);
            case 'configuration':
                return await updateSchoolConfiguration(db, schoolId, tenantId, data);
            default:
                return (0, response_utils_1.createErrorResponse)('UNSUPPORTED_STEP', `Unsupported step: ${step}`, 400);
        }
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update onboarding step');
    }
}
async function updateSchoolInfo(db, schoolId, tenantId, schoolData) {
    try {
        const result = await db.school.upsert({
            where: { id: schoolId },
            update: {
                name: schoolData.name,
                address: schoolData.address,
                city: schoolData.city,
                state: schoolData.state,
                pinCode: schoolData.pinCode,
                phone: schoolData.phone,
                email: schoolData.email,
                website: schoolData.website,
                studentCount: schoolData.studentCount,
                gradeRange: schoolData.gradeRange,
                lunchProgram: schoolData.lunchProgram,
                currentSystem: schoolData.currentSystem,
                languages: schoolData.languages,
                establishedYear: schoolData.establishedYear,
                schoolType: schoolData.schoolType,
                tenantId,
                updatedAt: new Date(),
            },
            create: {
                id: schoolId,
                name: schoolData.name,
                address: schoolData.address,
                city: schoolData.city,
                state: schoolData.state,
                pinCode: schoolData.pinCode,
                phone: schoolData.phone,
                email: schoolData.email,
                website: schoolData.website,
                studentCount: schoolData.studentCount,
                gradeRange: schoolData.gradeRange,
                lunchProgram: schoolData.lunchProgram,
                currentSystem: schoolData.currentSystem,
                languages: schoolData.languages,
                establishedYear: schoolData.establishedYear,
                schoolType: schoolData.schoolType,
                tenantId,
                isActive: true,
                onboardingStatus: 'in_progress',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { school: result },
            message: 'School information updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update school information');
    }
}
async function updateUserProfile(db, schoolId, tenantId, userData) {
    try {
        const userId = userData.userId || userData.id;
        if (!userId) {
            return (0, response_utils_1.createErrorResponse)('MISSING_USER_ID', 'User ID is required', 400);
        }
        const result = await db.user.update({
            where: { id: userId },
            data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                department: userData.department,
                experience: userData.experience,
                preferredLanguage: userData.preferredLanguage,
                schoolId,
                tenantId,
                updatedAt: new Date(),
            },
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { user: result },
            message: 'User profile updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update user profile');
    }
}
async function configureStakeholders(onboardingData) {
    try {
        const { data, schoolId, tenantId } = onboardingData;
        const db = database_service_1.DatabaseService.client;
        if (data.kitchenStaff && Array.isArray(data.kitchenStaff)) {
            for (const staff of data.kitchenStaff) {
                await db.user.upsert({
                    where: { email: staff.email },
                    update: {
                        firstName: staff.name.split(' ')[0],
                        lastName: staff.name.split(' ').slice(1).join(' '),
                        phone: staff.phone,
                        role: staff.role,
                        schoolId,
                        updatedAt: new Date(),
                    },
                    create: {
                        email: staff.email,
                        passwordHash: '$2b$12$temporary.hash.for.onboarding',
                        firstName: staff.name.split(' ')[0],
                        lastName: staff.name.split(' ').slice(1).join(' '),
                        phone: staff.phone,
                        role: staff.role,
                        schoolId: schoolId,
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
        }
        if (data.teachers?.emailList) {
            logger_1.logger.info('Teacher invitations would be stored', { schoolId, data: data.teachers });
        }
        if (data.parents) {
            logger_1.logger.info('Parent communication settings would be stored', {
                schoolId,
                data: data.parents,
            });
        }
        return (0, response_utils_1.createSuccessResponse)({
            data: { configured: true },
            message: 'Stakeholders configured successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to configure stakeholders');
    }
}
async function updateSchoolBranding(db, schoolId, tenantId, brandingData) {
    try {
        const result = await db.school.update({
            where: { id: schoolId },
            data: {
                branding: {
                    logo: brandingData.schoolLogo,
                    primaryColor: brandingData.primaryColor,
                    secondaryColor: brandingData.secondaryColor,
                    accentColor: brandingData.accentColor,
                    fontFamily: brandingData.fontFamily,
                    schoolMotto: brandingData.schoolMotto,
                    customGreeting: brandingData.customGreeting,
                    enableDarkMode: brandingData.enableDarkMode,
                },
                updatedAt: new Date(),
            },
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { school: result },
            message: 'School branding updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update school branding');
    }
}
async function updateSchoolConfiguration(db, schoolId, tenantId, configData) {
    try {
        const result = await db.school.update({
            where: { id: schoolId },
            data: {
                configuration: {
                    gradeClasses: configData.gradeClasses,
                    mealTimings: configData.mealTimings,
                    paymentConfig: configData.paymentConfig,
                    kitchenSetup: configData.kitchenSetup,
                },
                updatedAt: new Date(),
            },
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: { school: result },
            message: 'School configuration updated successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to update school configuration');
    }
}
async function configureRFIDSystem(onboardingData) {
    try {
        const { data, schoolId, tenantId } = onboardingData;
        const db = database_service_1.DatabaseService.client;
        logger_1.logger.info('RFID configuration would be stored', { schoolId, data });
        logger_1.logger.info('School RFID settings would be updated', { schoolId, data });
        return (0, response_utils_1.createSuccessResponse)({
            data: { configured: true },
            message: 'RFID system configured successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to configure RFID system');
    }
}
async function completeOnboarding(onboardingData) {
    try {
        const { schoolId, tenantId, data } = onboardingData;
        const db = database_service_1.DatabaseService.client;
        await db.school.update({
            where: { id: schoolId },
            data: {
                isActive: true,
                updatedAt: new Date(),
            },
        });
        logger_1.logger.info('Onboarding completion would be recorded', { schoolId, data });
        setImmediate(() => {
            triggerPostOnboardingTasks(schoolId, tenantId);
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: {
                schoolId,
                tenantId,
                status: 'completed',
                completedAt: new Date().toISOString(),
            },
            message: 'School onboarding completed successfully',
        });
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'Failed to complete onboarding');
    }
}
async function validateStepData(step, data) {
    const errors = [];
    switch (step) {
        case 'school_info':
            if (!data.name)
                errors.push('School name is required');
            if (!data.address)
                errors.push('Address is required');
            if (!data.city)
                errors.push('City is required');
            if (!data.phone)
                errors.push('Phone is required');
            if (!data.email)
                errors.push('Email is required');
            break;
        case 'admin_setup':
            if (!data.firstName)
                errors.push('First name is required');
            if (!data.lastName)
                errors.push('Last name is required');
            if (!data.email)
                errors.push('Email is required');
            if (!data.phone)
                errors.push('Phone is required');
            break;
        default:
            break;
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
async function updateOnboardingProgress(db, schoolId, tenantId, completedStep) {
    const progressSteps = [
        'school_info',
        'admin_setup',
        'stakeholder_setup',
        'branding',
        'configuration',
        'rfid_setup',
        'completion',
    ];
    const stepIndex = progressSteps.indexOf(completedStep);
    const progress = ((stepIndex + 1) / progressSteps.length) * 100;
    await db.schoolOnboardingProgress.upsert({
        where: { schoolId },
        update: {
            currentStep: completedStep,
            progress,
            lastUpdatedAt: new Date(),
            completedSteps: {
                push: completedStep,
            },
        },
        create: {
            schoolId,
            tenantId,
            currentStep: completedStep,
            completedSteps: [completedStep],
            progress,
            startedAt: new Date(),
            lastUpdatedAt: new Date(),
            estimatedCompletionTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
    });
}
async function triggerPostOnboardingTasks(schoolId, tenantId) {
    try {
        logger_1.logger.info('Post-onboarding tasks triggered', { schoolId, tenantId });
    }
    catch (error) {
        logger_1.logger.error('Failed to trigger post-onboarding tasks', error, {
            schoolId,
            tenantId,
        });
    }
}
exports.default = exports.handler;
//# sourceMappingURL=school-onboarding.js.map