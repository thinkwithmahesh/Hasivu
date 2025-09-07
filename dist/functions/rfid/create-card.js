"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRfidCardHandler = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../shared/utils/logger");
// import { ValidationService } from '../shared/validation.service'; // Not available
// import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils'; // Not available
const lambda_auth_middleware_1 = require("../../shared/middleware/lambda-auth.middleware");
const crypto = require("crypto");
// Initialize database client
const prisma = new client_1.PrismaClient();
/**
 * Generate secure unique RFID card number
 * Format: RFID-{school_code}-{timestamp}-{random}
 */
function generateCardNumber(schoolCode) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RFID-${schoolCode}-${timestamp}-${random}`;
}
/**
 * Validate student exists and belongs to school
 */
async function validateStudent(studentId, requestingUser, schoolId) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
            school: {
                select: { id: true, name: true, code: true }
            },
            rfidCards: {
                where: { isActive: true },
                select: { id: true, cardNumber: true }
            }
        }
    });
    if (!student) {
        throw new Error('Student not found');
    }
    if (student.role !== 'student') {
        throw new Error('User is not a student');
    }
    if (!student.isActive) {
        throw new Error('Student account is inactive');
    }
    if (!student.school) {
        throw new Error('Student is not associated with any school');
    }
    // Note: School isActive field not available in schema
    // if (!student.school.isActive) {
    //   throw new Error('Student\'s school is inactive');
    // }
    // Check if school ID matches (if provided)
    if (schoolId && student.schoolId !== schoolId) {
        throw new Error('Student does not belong to specified school');
    }
    // Authorization check - ensure user can create cards for this student
    if (!canCreateCardForStudent(requestingUser, student)) {
        throw new Error('Insufficient permissions to create RFID card for this student');
    }
    // Check if student already has an active RFID card
    if (student.rfidCards.length > 0) {
        throw new Error(`Student already has an active RFID card: ${student.rfidCards[0].cardNumber}`);
    }
    return student;
}
/**
 * Check if user can create RFID card for student
 */
function canCreateCardForStudent(requestingUser, student) {
    const userRole = requestingUser.role;
    // Super admin and admin can create cards for any student
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    // School admin can create cards for students in their school
    if (userRole === 'school_admin' && requestingUser.schoolId === student.schoolId) {
        return true;
    }
    // Staff can create cards for students in their school  
    if (userRole === 'staff' && requestingUser.schoolId === student.schoolId) {
        return true;
    }
    return false;
}
/**
 * Create audit log entry for RFID card creation
 */
async function createAuditLog(cardId, userId, action, details) {
    await prisma.auditLog.create({
        data: {
            entityType: 'RFIDCard',
            entityId: cardId,
            action,
            changes: JSON.stringify(details),
            userId,
            createdById: userId,
            metadata: JSON.stringify({
                timestamp: new Date().toISOString(),
                action: 'RFID_CARD_CREATED'
            })
        }
    });
}
/**
 * Create RFID Card Lambda Handler
 * POST /api/v1/rfid/cards
 */
const createRfidCardHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('RFID card creation request started', { requestId });
        // Authenticate request
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        // Parse and validate request body
        const requestBody = JSON.parse(event.body || '{}');
        // Manual validation (Joi not available)
        if (!requestBody.studentId) {
            logger_1.logger.warn('Invalid request data: missing studentId', { requestId });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'studentId is required' })
            };
        }
        const { studentId, schoolId, expiresAt, metadata, cardType } = requestBody;
        // Validate student and permissions
        const student = await validateStudent(studentId, authenticatedUser.user, schoolId);
        const targetSchoolId = schoolId || student.schoolId;
        // Generate unique card number
        const cardNumber = generateCardNumber(student.school.code);
        // Ensure card number is unique (very unlikely collision, but safety first)
        const existingCard = await prisma.rFIDCard.findUnique({
            where: { cardNumber }
        });
        if (existingCard) {
            // Retry with new number (extremely rare case)
            const retryCardNumber = generateCardNumber(student.school.code);
            logger_1.logger.warn('Card number collision detected, retrying', {
                requestId,
                originalNumber: cardNumber,
                retryNumber: retryCardNumber
            });
        }
        // Create RFID card
        const rfidCard = await prisma.rFIDCard.create({
            data: {
                cardNumber: existingCard ? generateCardNumber(student.school.code) : cardNumber,
                studentId,
                schoolId: targetSchoolId,
                isActive: true,
                issuedAt: new Date(),
                expiresAt: expiresAt || null,
                metadata: JSON.stringify(metadata || {})
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        // Create audit log
        await createAuditLog(rfidCard.id, authenticatedUser.id, 'CREATE', {
            cardNumber: rfidCard.cardNumber,
            studentId,
            schoolId: targetSchoolId,
            cardType,
            createdBy: authenticatedUser.email,
            timestamp: new Date().toISOString()
        });
        // Format response
        const response = {
            id: rfidCard.id,
            cardNumber: rfidCard.cardNumber,
            studentId: rfidCard.studentId,
            schoolId: rfidCard.schoolId,
            isActive: rfidCard.isActive,
            issuedAt: rfidCard.issuedAt,
            expiresAt: rfidCard.expiresAt || undefined,
            metadata: JSON.parse(rfidCard.metadata),
            student: rfidCard.student,
            school: {
                id: student.school.id,
                name: student.school.name,
                code: student.school.code
            }
        };
        logger_1.logger.info('RFID card created successfully', {
            requestId,
            cardId: rfidCard.id,
            cardNumber: rfidCard.cardNumber,
            studentId,
            createdBy: authenticatedUser.email
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'RFID card created successfully',
                data: response
            })
        };
    }
    catch (error) {
        logger_1.logger.error('RFID card creation failed', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to create RFID card',
                message: error.message
            })
        };
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.createRfidCardHandler = createRfidCardHandler;
