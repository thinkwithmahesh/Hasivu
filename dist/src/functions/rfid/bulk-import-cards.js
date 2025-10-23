"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportRfidCardsHandler = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const crypto = __importStar(require("crypto"));
const prisma = new client_1.PrismaClient();
function generateCardNumber(schoolCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RFID-${schoolCode}-${timestamp}-${random}`;
}
function canPerformBulkImport(requestingUser, schoolId) {
    const userRole = requestingUser.role;
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    if (userRole === 'school_admin' && requestingUser.schoolId === schoolId) {
        return true;
    }
    if (userRole === 'staff' && requestingUser.schoolId === schoolId) {
        return true;
    }
    return false;
}
async function validateSchool(schoolId) {
    const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
            id: true,
            name: true,
            code: true,
        },
    });
    if (!school) {
        throw new Error('School not found');
    }
    return school;
}
async function parseCSVData(csvData, schoolId) {
    const validCards = [];
    const errors = [];
    try {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must contain at least a header row and one data row');
        }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['studentid'];
        const optionalHeaders = ['studentemail', 'expirydate', 'metadata'];
        const hasStudentId = headers.includes('studentid');
        const hasStudentEmail = headers.includes('studentemail');
        if (!hasStudentId && !hasStudentEmail) {
            throw new Error('CSV must contain either studentId or studentEmail column');
        }
        const students = await prisma.user.findMany({
            where: {
                schoolId,
                role: 'student',
                isActive: true,
            },
            include: {
                rfidCards: {
                    where: { isActive: true },
                    select: { id: true, cardNumber: true },
                },
            },
        });
        const studentsByEmail = new Map(students.map(s => [s.email.toLowerCase(), s]));
        const studentsById = new Map(students.map(s => [s.id, s]));
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
                const cardData = {};
                let student = null;
                const studentIdIndex = headers.indexOf('studentid');
                if (studentIdIndex >= 0 && values[studentIdIndex]) {
                    cardData.studentId = values[studentIdIndex];
                    student = studentsById.get(cardData.studentId);
                }
                const studentEmailIndex = headers.indexOf('studentemail');
                if (studentEmailIndex >= 0 && values[studentEmailIndex]) {
                    cardData.studentEmail = values[studentEmailIndex].toLowerCase();
                    if (!student) {
                        student = studentsByEmail.get(cardData.studentEmail);
                        if (student) {
                            cardData.studentId = student.id;
                        }
                    }
                }
                if (!student) {
                    errors.push({
                        row: i + 1,
                        studentId: cardData.studentId,
                        studentEmail: cardData.studentEmail,
                        error: 'Student not found or not active in this school',
                    });
                    continue;
                }
                if (student.rfidCards.length > 0) {
                    errors.push({
                        row: i + 1,
                        studentId: student.id,
                        studentEmail: student.email,
                        error: `Student already has an active RFID card: ${student.rfidCards[0].cardNumber}`,
                    });
                    continue;
                }
                const expiryDateIndex = headers.indexOf('expirydate');
                if (expiryDateIndex >= 0 && values[expiryDateIndex]) {
                    const expiryStr = values[expiryDateIndex];
                    const expiryDate = new Date(expiryStr);
                    if (isNaN(expiryDate.getTime())) {
                        errors.push({
                            row: i + 1,
                            studentId: student.id,
                            studentEmail: student.email,
                            error: `Invalid expiry date format: ${expiryStr}. Use YYYY-MM-DD format`,
                        });
                        continue;
                    }
                    if (expiryDate <= new Date()) {
                        errors.push({
                            row: i + 1,
                            studentId: student.id,
                            studentEmail: student.email,
                            error: 'Expiry date must be in the future',
                        });
                        continue;
                    }
                    cardData.expiryDate = expiryStr;
                }
                const metadataIndex = headers.indexOf('metadata');
                if (metadataIndex >= 0 && values[metadataIndex]) {
                    try {
                        cardData.metadata = JSON.parse(values[metadataIndex]);
                    }
                    catch (metaError) {
                        errors.push({
                            row: i + 1,
                            studentId: student.id,
                            studentEmail: student.email,
                            error: 'Invalid JSON format in metadata column',
                        });
                        continue;
                    }
                }
                validCards.push({
                    ...cardData,
                    student,
                });
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
    return { validCards, errors };
}
async function createCardsInBatch(validCards, school, cardType, expiryDays, createdByUserId) {
    const result = {
        successful: [],
        errors: [],
        duplicates: [],
    };
    const batchSize = 50;
    for (let i = 0; i < validCards.length; i += batchSize) {
        const batch = validCards.slice(i, i + batchSize);
        for (const cardData of batch) {
            try {
                let cardNumber = generateCardNumber(school.code);
                let attempts = 0;
                while (attempts < 3) {
                    const existing = await prisma.rFIDCard.findUnique({
                        where: { cardNumber },
                    });
                    if (!existing)
                        break;
                    cardNumber = generateCardNumber(school.code);
                    attempts++;
                }
                if (attempts >= 3) {
                    result.errors.push({
                        row: 0,
                        studentId: cardData.student.id,
                        studentEmail: cardData.student.email,
                        error: 'Failed to generate unique card number after multiple attempts',
                    });
                    continue;
                }
                let expiresAt = null;
                if (cardData.expiryDate) {
                    expiresAt = new Date(cardData.expiryDate);
                }
                else if (expiryDays) {
                    expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + expiryDays);
                }
                const rfidCard = await prisma.rFIDCard.create({
                    data: {
                        cardNumber,
                        studentId: cardData.student.id,
                        schoolId: school.id,
                        isActive: true,
                        issuedAt: new Date(),
                        expiresAt,
                        metadata: JSON.stringify({
                            cardType,
                            bulkImported: true,
                            importedAt: new Date().toISOString(),
                            ...(cardData.metadata || {}),
                        }),
                    },
                });
                await prisma.auditLog.create({
                    data: {
                        entityType: 'RFIDCard',
                        entityId: rfidCard.id,
                        action: 'CREATE',
                        changes: JSON.stringify({
                            cardNumber: rfidCard.cardNumber,
                            studentId: cardData.student.id,
                            schoolId: school.id,
                            bulkImported: true,
                            createdBy: createdByUserId,
                        }),
                        userId: createdByUserId || 'system',
                        createdById: createdByUserId || 'system',
                        metadata: JSON.stringify({
                            action: 'BULK_RFID_CARD_CREATED',
                            timestamp: new Date().toISOString(),
                        }),
                    },
                });
                result.successful.push({
                    cardId: rfidCard.id,
                    cardNumber: rfidCard.cardNumber,
                    studentId: cardData.student.id,
                    studentName: `${cardData.student.firstName} ${cardData.student.lastName}`,
                    studentEmail: cardData.student.email,
                });
            }
            catch (createError) {
                result.errors.push({
                    row: 0,
                    studentId: cardData.student.id,
                    studentEmail: cardData.student.email,
                    error: `Card creation failed: ${createError.message}`,
                });
            }
        }
    }
    return result;
}
const bulkImportRfidCardsHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('Bulk import RFID cards request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        if (!requestBody.csvData) {
            logger_1.logger.warn('Invalid request data: missing csvData', { requestId });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'csvData is required' }),
            };
        }
        if (!requestBody.schoolId) {
            logger_1.logger.warn('Invalid request data: missing schoolId', { requestId });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'schoolId is required' }),
            };
        }
        const { csvData, schoolId, previewMode, skipDuplicates, updateExisting, cardType, expiryDays } = requestBody;
        if (!canPerformBulkImport(authenticatedUser.user, schoolId)) {
            logger_1.logger.warn('Unauthorized bulk import attempt', {
                requestId,
                userId: authenticatedUser.user?.id,
                schoolId,
                userRole: authenticatedUser.user?.role,
            });
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: 'Insufficient permissions to perform bulk RFID card import for this school',
                }),
            };
        }
        const school = await validateSchool(schoolId);
        const csvSizeBytes = Buffer.byteLength(csvData, 'utf8');
        const maxSizeMB = 10;
        if (csvSizeBytes > maxSizeMB * 1024 * 1024) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `CSV data too large. Maximum size: ${maxSizeMB}MB` }),
            };
        }
        logger_1.logger.info('Processing bulk import CSV data', {
            requestId,
            csvSizeBytes,
            schoolId,
            schoolCode: school.code,
            previewMode: previewMode || false,
        });
        const parseResult = await parseCSVData(csvData, schoolId);
        if (parseResult.errors.length > 0) {
            logger_1.logger.warn('CSV parsing errors detected', {
                requestId,
                errorCount: parseResult.errors.length,
                errors: parseResult.errors.slice(0, 10),
            });
        }
        if (previewMode) {
            logger_1.logger.info('Bulk import preview completed', {
                requestId,
                validCardsCount: parseResult.validCards.length,
                errorCount: parseResult.errors.length,
            });
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Bulk import preview completed successfully',
                    data: {
                        previewMode: true,
                        summary: {
                            totalRows: parseResult.validCards.length + parseResult.errors.length,
                            validCards: parseResult.validCards.length,
                            errors: parseResult.errors.length,
                        },
                        validCards: parseResult.validCards.map(card => ({
                            studentId: card.student.id,
                            studentName: `${card.student.firstName} ${card.student.lastName}`,
                            studentEmail: card.student.email,
                            expiryDate: card.expiryDate,
                            metadata: card.metadata,
                        })),
                        errors: parseResult.errors,
                    },
                }),
            };
        }
        if (parseResult.validCards.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No valid cards found in CSV data' }),
            };
        }
        const importResult = await createCardsInBatch(parseResult.validCards, school, cardType || 'standard', expiryDays, authenticatedUser.userId);
        logger_1.logger.info('Bulk RFID card import completed', {
            requestId,
            successCount: importResult.successful.length,
            errorCount: importResult.errors.length,
            duplicateCount: importResult.duplicates.length,
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Bulk RFID card import completed successfully',
                data: {
                    previewMode: false,
                    summary: {
                        totalProcessed: parseResult.validCards.length,
                        successful: importResult.successful.length,
                        errors: importResult.errors.length + parseResult.errors.length,
                        duplicates: importResult.duplicates.length,
                    },
                    results: {
                        successful: importResult.successful,
                        errors: [...importResult.errors, ...parseResult.errors],
                        duplicates: importResult.duplicates,
                    },
                },
            }),
        };
    }
    catch (error) {
        logger_1.logger.error('Bulk import RFID cards failed', error instanceof Error ? error : new Error(String(error)), {
            requestId,
        });
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to bulk import RFID cards',
                message: error.message,
            }),
        };
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.bulkImportRfidCardsHandler = bulkImportRfidCardsHandler;
//# sourceMappingURL=bulk-import-cards.js.map