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
exports.createRfidCardHandler = void 0;
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
    if (schoolId && student.schoolId !== schoolId) {
        throw new Error('Student does not belong to specified school');
    }
    if (!canCreateCardForStudent(requestingUser, student)) {
        throw new Error('Insufficient permissions to create RFID card for this student');
    }
    if (student.rfidCards.length > 0) {
        throw new Error(`Student already has an active RFID card: ${student.rfidCards[0].cardNumber}`);
    }
    return student;
}
function canCreateCardForStudent(requestingUser, student) {
    const userRole = requestingUser.role;
    if (['super_admin', 'admin'].includes(userRole)) {
        return true;
    }
    if (userRole === 'school_admin' && requestingUser.schoolId === student.schoolId) {
        return true;
    }
    if (userRole === 'staff' && requestingUser.schoolId === student.schoolId) {
        return true;
    }
    return false;
}
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
const createRfidCardHandler = async (event, context) => {
    const requestId = context.awsRequestId;
    try {
        logger_1.logger.info('RFID card creation request started', { requestId });
        const authenticatedUser = await (0, lambda_auth_middleware_1.authenticateLambda)(event);
        const requestBody = JSON.parse(event.body || '{}');
        if (!requestBody.studentId) {
            logger_1.logger.warn('Invalid request data: missing studentId', { requestId });
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'studentId is required' })
            };
        }
        const { studentId, schoolId, expiresAt, metadata, cardType } = requestBody;
        const student = await validateStudent(studentId, authenticatedUser.user, schoolId);
        const targetSchoolId = schoolId || student.schoolId;
        const cardNumber = generateCardNumber(student.school.code);
        const existingCard = await prisma.rFIDCard.findUnique({
            where: { cardNumber }
        });
        if (existingCard) {
            const retryCardNumber = generateCardNumber(student.school.code);
            logger_1.logger.warn('Card number collision detected, retrying', {
                requestId,
                originalNumber: cardNumber,
                retryNumber: retryCardNumber
            });
        }
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
        await createAuditLog(rfidCard.id, authenticatedUser.id, 'CREATE', {
            cardNumber: rfidCard.cardNumber,
            studentId,
            schoolId: targetSchoolId,
            cardType,
            createdBy: authenticatedUser.email,
            timestamp: new Date().toISOString()
        });
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
//# sourceMappingURL=create-card.js.map