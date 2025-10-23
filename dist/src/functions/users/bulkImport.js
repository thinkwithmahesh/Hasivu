"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportUsersHandler = void 0;
const user_service_1 = require("../../services/user.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../shared/validation.service");
const response_utils_1 = require("../shared/response.utils");
const joi_1 = __importDefault(require("joi"));
const bulkImportSchema = joi_1.default.object({
    csvData: joi_1.default.string()
        .required()
        .max(10 * 1024 * 1024),
    schoolId: joi_1.default.string().uuid().optional(),
    previewMode: joi_1.default.boolean().optional().default(false),
    skipDuplicates: joi_1.default.boolean().optional().default(true),
    updateExisting: joi_1.default.boolean().optional().default(false),
});
const bulkImportUsersHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Bulk import users request started', {
            requestId,
            userAgent: event.headers['User-Agent'],
        });
        const userContext = event.requestContext.authorizer;
        if (!userContext?.userId) {
            logger_1.logger.warn('Unauthorized bulk import attempt', { requestId });
            return (0, response_utils_1.handleError)(new Error('Unauthorized'));
        }
        const requestingUser = await user_service_1.UserService.getUserById(userContext.userId);
        if (!requestingUser) {
            logger_1.logger.error('Requesting user not found', new Error('User not found'), {
                requestId,
                userId: userContext.userId,
            });
            return (0, response_utils_1.handleError)(new Error('Requesting user not found'));
        }
        if (!['admin', 'super_admin', 'school_admin'].includes(requestingUser.role)) {
            logger_1.logger.warn('Bulk import permission denied', {
                requestId,
                userId: userContext.userId,
                role: requestingUser.role,
            });
            return (0, response_utils_1.handleError)(new Error('Insufficient permissions for bulk import'));
        }
        let importData;
        try {
            importData = JSON.parse(event.body || '{}');
        }
        catch (parseError) {
            logger_1.logger.warn('Invalid JSON in request body', {
                requestId,
                error: parseError.message,
            });
            return (0, response_utils_1.handleError)(new Error('Invalid JSON in request body'));
        }
        const validation = validation_service_1.ValidationService.validateObject(importData, bulkImportSchema);
        if (!validation.isValid) {
            logger_1.logger.warn('Invalid bulk import data', {
                requestId,
                errors: validation.errors,
            });
            return (0, response_utils_1.handleError)(new Error(`Validation failed: ${validation.errors?.join(', ')}`));
        }
        let targetSchoolId = importData.schoolId;
        if (requestingUser.role === 'school_admin') {
            targetSchoolId = requestingUser.schoolId ?? undefined;
        }
        else if (!targetSchoolId) {
            return (0, response_utils_1.handleError)(new Error('School ID is required for admin users'));
        }
        const csvSizeBytes = Buffer.byteLength(importData.csvData, 'utf8');
        const maxSizeMB = 10;
        if (csvSizeBytes > maxSizeMB * 1024 * 1024) {
            return (0, response_utils_1.handleError)(new Error(`CSV data too large. Maximum size: ${maxSizeMB}MB`));
        }
        logger_1.logger.info('Processing CSV data', {
            requestId,
            csvSizeBytes,
            schoolId: targetSchoolId,
            previewMode: importData.previewMode || false,
        });
        const parseResult = await parseCSVData(importData.csvData, targetSchoolId);
        if (parseResult.errors.length > 0) {
            logger_1.logger.warn('CSV parsing errors detected', {
                requestId,
                errorCount: parseResult.errors.length,
                errors: parseResult.errors.slice(0, 10),
            });
        }
        if (importData.previewMode) {
            logger_1.logger.info('Bulk import preview completed', {
                requestId,
                validUsersCount: parseResult.validUsers.length,
                errorCount: parseResult.errors.length,
            });
            return (0, response_utils_1.createSuccessResponse)({
                previewMode: true,
                summary: {
                    totalRows: parseResult.validUsers.length + parseResult.errors.length,
                    validUsers: parseResult.validUsers.length,
                    errors: parseResult.errors.length,
                },
                validUsers: parseResult.validUsers,
                errors: parseResult.errors,
            });
        }
        if (parseResult.validUsers.length === 0) {
            return (0, response_utils_1.handleError)(new Error('No valid users found in CSV data'));
        }
        const importResult = await user_service_1.UserService.bulkImportUsers(parseResult.validUsers);
        logger_1.logger.info('Bulk import completed', {
            requestId,
            successCount: importResult.success.length,
            errorCount: importResult.failed.length,
            totalUsers: importResult.success.length,
        });
        return (0, response_utils_1.createSuccessResponse)({
            previewMode: false,
            summary: {
                totalProcessed: importResult.success.length + importResult.failed.length,
                successful: importResult.success.length,
                errors: importResult.failed.length,
                duplicates: 0,
            },
            results: {
                successful: importResult.success.map((user) => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                })),
                errors: importResult.failed,
                duplicates: [],
            },
            csvErrors: parseResult.errors,
        });
    }
    catch (error) {
        logger_1.logger.error('Bulk import request failed', error, {
            requestId,
        });
        return (0, response_utils_1.handleError)(error);
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
                    error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`,
                });
                continue;
            }
            try {
                const userData = {
                    firstName: values[headers.indexOf('firstname')],
                    lastName: values[headers.indexOf('lastname')],
                    email: values[headers.indexOf('email')].toLowerCase(),
                    role: values[headers.indexOf('role')].toLowerCase(),
                };
                if (parentEmailIndex >= 0 && values[parentEmailIndex]) {
                    userData.parentEmail = values[parentEmailIndex].toLowerCase();
                }
                if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: 'Missing required fields (firstName, lastName, email, role)',
                    });
                    continue;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userData.email)) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: 'Invalid email format',
                    });
                    continue;
                }
                if (!validRoles.includes(userData.role)) {
                    errors.push({
                        row: i + 1,
                        email: userData.email,
                        error: `Invalid role: ${userData.role}. Valid roles: ${validRoles.join(', ')}`,
                    });
                    continue;
                }
                const createUserRequest = {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: `temp${Math.random().toString(36).substring(2)}`,
                    role: userData.role,
                    schoolId,
                };
                validUsers.push(createUserRequest);
            }
            catch (rowError) {
                errors.push({
                    row: i + 1,
                    error: `Processing error: ${rowError.message}`,
                });
            }
        }
    }
    catch (parseError) {
        errors.push({
            row: 0,
            error: `CSV parsing error: ${parseError.message}`,
        });
    }
    return { validUsers, errors };
}
exports.default = exports.bulkImportUsersHandler;
//# sourceMappingURL=bulkImport.js.map