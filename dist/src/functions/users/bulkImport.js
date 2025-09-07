"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportUsersHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
const bulkImportSchema = joi_1.default.object({
    csvData: joi_1.default.string().required().max(10 * 1024 * 1024),
    schoolId: joi_1.default.string().uuid().optional(),
    previewMode: joi_1.default.boolean().optional().default(false),
    skipDuplicates: joi_1.default.boolean().optional().default(true),
    updateExisting: joi_1.default.boolean().optional().default(false)
});
const bulkImportUsersHandler = async (event, context) => {
    const logger = logger_service_1.LoggerService.getInstance();
    const requestId = context.awsRequestId;
    try {
        logger.info('Bulk import users request started', {
            requestId,
            userAgent: event.headers['User-Agent']
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger.warn('Unauthorized bulk import attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'), undefined, 401, requestId);
        }
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger.error('Requesting user not found', {
                requestId,
                userId: userContext.userId
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'), undefined, 404, requestId);
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(requestingUser.role)) {
            logger.warn('Bulk import permission denied', {
                requestId,
                userId: userContext.userId,
                role: requestingUser.role
            });
            return (0, response_utils_1.handleError)(new Error('Insufficient permissions for bulk import'), undefined, 403, requestId);
        }
        let importData;
        try {
            importData = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger.warn('Invalid JSON in request body', {
                requestId,
                error: parseError.message
            });
            return (0, response_utils_1.handleError)(new Error('Invalid JSON in request body'), undefined, 400, requestId);
        }
        const validation = validation_service_1.ValidationService.validateObject(importData, bulkImportSchema);
        if (!validation.isValid) {
            logger.warn('Invalid bulk import data', {
                requestId,
                errors: validation.errors
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`), undefined, 400, requestId);
        }
        let targetSchoolId = importData.schoolId;
        if (requestingUser.role === 'school_admin') {
            targetSchoolId = requestingUser.schoolId;
        }
        else if (!targetSchoolId) {
            return (0, response_utils_1.handleError)(new Error('School ID is required for admin users'), undefined, 400, requestId);
        }
        const csvSizeBytes = Buffer.byteLength(importData.csvData, 'utf8');
        const maxSizeMB = 10;
        if (csvSizeBytes > maxSizeMB * 1024 * 1024) {
            return (0, response_utils_1.handleError)(new Error(`CSV data too large. Maximum size: ${maxSizeMB}MB`), undefined, 400, requestId);
        }
        logger.info('Processing CSV data', {
            requestId,
            csvSizeBytes,
            schoolId: targetSchoolId,
            previewMode: importData.previewMode || false
        });
        const parseResult = await parseCSVData(importData.csvData, targetSchoolId);
        if (parseResult.errors.length > 0) {
            logger.warn('CSV parsing errors detected', {
                requestId,
                errorCount: parseResult.errors.length,
                errors: parseResult.errors.slice(0, 10)
            });
        }
        if (importData.previewMode) {
            logger.info('Bulk import preview completed', {
                requestId,
                validUsersCount: parseResult.validUsers.length,
                errorCount: parseResult.errors.length
            });
            return (0, response_utils_1.createSuccessResponse)({
                previewMode: true,
                summary: {
                    totalRows: parseResult.validUsers.length + parseResult.errors.length,
                    validUsers: parseResult.validUsers.length,
                    errors: parseResult.errors.length
                },
                validUsers: parseResult.validUsers,
                errors: parseResult.errors
            }, 'Preview processed successfully', 200, requestId);
        }
        if (parseResult.validUsers.length === 0) {
            return (0, response_utils_1.handleError)(new Error('No valid users found in CSV data'), undefined, 400, requestId);
        }
        const importResult = await user_service_1.UserService.bulkImportUsers(importData.csvData, userContext.userId, targetSchoolId);
        logger.info('Bulk import completed', {
            requestId,
            successCount: importResult.successCount,
            errorCount: importResult.errorCount,
            totalUsers: importResult.users.length
        });
        return (0, response_utils_1.createSuccessResponse)({
            previewMode: false,
            summary: {
                totalProcessed: importResult.successCount + importResult.errorCount,
                successful: importResult.successCount,
                errors: importResult.errorCount,
                duplicates: 0
            },
            results: {
                successful: importResult.users.map(user => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                })),
                errors: importResult.errors,
                duplicates: []
            },
            csvErrors: parseResult.errors
        }, 'Bulk import completed successfully', 200, requestId);
    }
    catch (error) {
        logger.error('Bulk import request failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return (0, response_utils_1.handleError)(error, undefined, 500, requestId);
    }
};
exports.bulkImportUsersHandler = bulkImportUsersHandler;
async function parseCSVData(csvData, schoolId) {
    const validUsers = [];
    const errors = [];
    try {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must contain at least a header row and one data row');
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['firstname', 'lastname', 'email', 'role'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
        }
        const validRoles = ['student', 'parent', 'teacher', 'staff'];
        const parentEmailIndex = headers.indexOf('parentemail');
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const values = line.split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                errors.push({
                    row: i + 1,
                    error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`
                });
                continue;
            }
            try {
                const userData = {
                    firstName: values[headers.indexOf('firstname')],
                    lastName: values[headers.indexOf('lastname')],
                    email: values[headers.indexOf('email')].toLowerCase(),
                    role: values[headers.indexOf('role')].toLowerCase()
                };
                if (parentEmailIndex >= 0 && values[parentEmailIndex]) {
                    userData.parentEmail = values[parentEmailIndex].toLowerCase();
                }
                if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: 'Missing required fields (firstName, lastName, email, role)'
                    });
                    continue;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userData.email)) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: 'Invalid email format'
                    });
                    continue;
                }
                if (!validRoles.includes(userData.role)) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: `Invalid role: ${userData.role}. Valid roles: ${validRoles.join(', ')}`
                    });
                    continue;
                }
                const createUserRequest = {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    role: userData.role,
                    schoolId,
                    isActive: true,
                    metadata: {
                        importedAt: new Date().toISOString(),
                        csvRow: i + 1
                    }
                };
                if (userData.parentEmail) {
                    createUserRequest.metadata.parentEmail = userData.parentEmail;
                }
                validUsers.push(createUserRequest);
            }
            catch (rowError) {
                errors.push({
                    row: i + 1,
                    error: `Processing error: ${rowError.message}`
                });
            }
        }
    }
    catch (parseError) {
        errors.push({
            row: 0,
            error: `CSV parsing error: ${parseError.message}`
        });
    }
    return { validUsers, errors };
}
exports.default = exports.bulkImportUsersHandler;
//# sourceMappingURL=bulkImport.js.map