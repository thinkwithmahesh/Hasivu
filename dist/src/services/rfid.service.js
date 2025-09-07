"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfidService = exports.RFIDService = void 0;
const database_service_1 = require("./database.service");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const uuid_1 = require("uuid");
class RFIDService {
    static CACHE_TTL = 600;
    static VERIFICATION_CACHE_TTL = 86400;
    static MAX_SIGNAL_STRENGTH = 100;
    static MIN_SIGNAL_STRENGTH = 10;
    static CARD_EXPIRY_WARNING_DAYS = 30;
    static verificationCache = new Map();
    static async registerCard(input) {
        try {
            logger_1.logger.info('Registering RFID card', {
                cardNumber: input.cardNumber,
                studentId: input.studentId
            });
            if (!this.isValidCardNumber(input.cardNumber)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid card number format',
                        code: 'INVALID_CARD_FORMAT'
                    }
                };
            }
            const existingCard = await database_service_1.DatabaseService.client.rFIDCard.findUnique({
                where: { cardNumber: input.cardNumber }
            });
            if (existingCard) {
                return {
                    success: false,
                    error: {
                        message: 'RFID card number already exists',
                        code: 'CARD_ALREADY_EXISTS',
                        details: { existingCardId: existingCard.id }
                    }
                };
            }
            const student = await database_service_1.DatabaseService.client.user.findUnique({
                where: { id: input.studentId },
                include: { school: true }
            });
            if (!student) {
                return {
                    success: false,
                    error: {
                        message: 'Student not found',
                        code: 'STUDENT_NOT_FOUND'
                    }
                };
            }
            if (student.schoolId !== input.schoolId) {
                return {
                    success: false,
                    error: {
                        message: 'Student does not belong to the specified school',
                        code: 'SCHOOL_MISMATCH',
                        details: {
                            studentSchool: student.schoolId,
                            requestedSchool: input.schoolId
                        }
                    }
                };
            }
            const existingStudentCard = await database_service_1.DatabaseService.client.rFIDCard.findFirst({
                where: {
                    studentId: input.studentId,
                    isActive: true
                }
            });
            if (existingStudentCard) {
                return {
                    success: false,
                    error: {
                        message: 'Student already has an active RFID card',
                        code: 'STUDENT_HAS_ACTIVE_CARD',
                        details: { existingCardNumber: existingStudentCard.cardNumber }
                    }
                };
            }
            const cardData = {
                id: (0, uuid_1.v4)(),
                cardNumber: input.cardNumber,
                ...(input.cardType && { cardType: input.cardType }),
                isActive: true,
                issuedAt: new Date(),
                ...(input.expiryDate && { expiryDate: input.expiryDate }),
                user: {
                    connect: { id: input.studentId }
                },
                school: {
                    connect: { id: input.schoolId }
                },
                metadata: JSON.stringify(input.metadata || {})
            };
            const rfidCard = await database_service_1.DatabaseService.client.rFIDCard.create({
                data: cardData,
                include: {
                    ...(typeof database_service_1.DatabaseService.client.rFIDCard.create.arguments?.[0]?.include?.user !== 'undefined' && {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                schoolId: true
                            }
                        }
                    })
                }
            });
            await this.cacheCardData(rfidCard);
            logger_1.logger.info('RFID card registered successfully', {
                cardId: rfidCard.id,
                cardNumber: input.cardNumber,
                studentId: input.studentId,
                schoolId: input.schoolId
            });
            return {
                success: true,
                data: rfidCard
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to register RFID card', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to register RFID card',
                    code: 'CARD_REGISTRATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async verifyDelivery(input) {
        try {
            logger_1.logger.info('Verifying RFID delivery', {
                cardNumber: input.cardNumber,
                readerId: input.readerId,
                orderId: input.orderId
            });
            const reader = await this.getReaderById(input.readerId);
            if (!reader) {
                return {
                    success: false,
                    error: {
                        message: 'RFID reader not found',
                        code: 'READER_NOT_FOUND',
                        details: { readerId: input.readerId }
                    }
                };
            }
            if (reader.status !== 'online') {
                return {
                    success: false,
                    error: {
                        message: 'RFID reader is not online',
                        code: 'READER_OFFLINE',
                        details: { readerId: input.readerId, status: reader.status }
                    }
                };
            }
            const card = await this.getCardByNumber(input.cardNumber);
            if (!card) {
                return {
                    success: false,
                    error: {
                        message: 'RFID card not found',
                        code: 'CARD_NOT_FOUND',
                        details: { cardNumber: input.cardNumber }
                    }
                };
            }
            if (!card.isActive) {
                return {
                    success: false,
                    error: {
                        message: 'RFID card is not active',
                        code: 'CARD_INACTIVE',
                        details: { cardNumber: input.cardNumber, isActive: card.isActive }
                    }
                };
            }
            const cardExpiryDate = card.expiryDate;
            if (cardExpiryDate && new Date() > new Date(cardExpiryDate)) {
                return {
                    success: false,
                    error: {
                        message: 'RFID card has expired',
                        code: 'CARD_EXPIRED',
                        details: { cardNumber: input.cardNumber, expiryDate: cardExpiryDate }
                    }
                };
            }
            if (card.schoolId !== reader.schoolId) {
                return {
                    success: false,
                    error: {
                        message: 'Card and reader belong to different schools',
                        code: 'SCHOOL_MISMATCH',
                        details: {
                            cardSchool: card.schoolId,
                            readerSchool: reader.schoolId
                        }
                    }
                };
            }
            let orderInfo;
            if (input.orderId) {
                const order = await database_service_1.DatabaseService.client.order.findUnique({
                    where: { id: input.orderId }
                });
                if (!order) {
                    return {
                        success: false,
                        error: {
                            message: 'Order not found',
                            code: 'ORDER_NOT_FOUND',
                            details: { orderId: input.orderId }
                        }
                    };
                }
                if (order.studentId !== card.studentId) {
                    return {
                        success: false,
                        error: {
                            message: 'Order does not belong to the card holder',
                            code: 'ORDER_STUDENT_MISMATCH',
                            details: {
                                orderId: input.orderId,
                                orderStudentId: order.studentId,
                                cardStudentId: card.studentId
                            }
                        }
                    };
                }
                orderInfo = {
                    id: order.id,
                    status: order.status,
                    deliveryDate: order.deliveryDate
                };
            }
            const signalQuality = this.assessSignalQuality(input.signalStrength || 50, input.readDuration || 1000);
            const verificationData = {
                id: (0, uuid_1.v4)(),
                verifiedAt: input.timestamp || new Date(),
                location: input.location || reader.location,
                ...(input.signalStrength && { signalStrength: input.signalStrength }),
                ...(input.readDuration && { readDuration: input.readDuration }),
                rfidCard: {
                    connect: { id: card.id }
                },
                rfidReader: {
                    connect: { id: reader.id }
                },
                order: input.orderId ? {
                    connect: { id: input.orderId }
                } : undefined,
                metadata: JSON.stringify(input.metadata || {})
            };
            const verification = await database_service_1.DatabaseService.client.deliveryVerification.create({
                data: verificationData
            });
            await this.updateCardLastUsed(card.id);
            const result = {
                success: true,
                cardNumber: card.cardNumber,
                studentId: card.studentId,
                studentName: `${card.user.firstName} ${card.user.lastName}`,
                schoolId: card.schoolId,
                verificationId: verification.id,
                timestamp: verification.verifiedAt,
                location: verification.location,
                readerInfo: {
                    id: reader.id,
                    name: reader.name,
                    location: reader.location
                },
                orderInfo,
                signalQuality
            };
            const cacheKey = `verification:${verification.id}`;
            await cache_1.cache.setex(cacheKey, this.VERIFICATION_CACHE_TTL, JSON.stringify(result));
            this.verificationCache.set(`${input.cardNumber}:${Date.now()}`, result);
            if (this.verificationCache.size > 100) {
                const oldestKey = this.verificationCache.keys().next().value;
                this.verificationCache.delete(oldestKey);
            }
            logger_1.logger.info('RFID delivery verification successful', {
                verificationId: verification.id,
                cardNumber: input.cardNumber,
                studentId: card.studentId,
                signalQuality
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify RFID delivery', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to verify delivery',
                    code: 'VERIFICATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async updateReaderStatus(input) {
        try {
            logger_1.logger.info('Updating reader status', {
                readerId: input.readerId,
                status: input.status
            });
            const reader = await database_service_1.DatabaseService.client.rFIDReader.findUnique({
                where: { id: input.readerId }
            });
            if (!reader) {
                return {
                    success: false,
                    error: {
                        message: 'RFID reader not found',
                        code: 'READER_NOT_FOUND'
                    }
                };
            }
            const updatedReader = await database_service_1.DatabaseService.client.rFIDReader.update({
                where: { id: input.readerId },
                data: {
                    status: input.status,
                    location: input.location || reader.location,
                    ...(new Date() && { lastHeartbeat: new Date() }),
                    ...(input.metadata && { configuration: JSON.stringify(input.metadata) }),
                    updatedAt: new Date()
                }
            });
            const cacheKey = `rfid_reader:${input.readerId}`;
            await cache_1.cache.del(cacheKey);
            logger_1.logger.info('Reader status updated successfully', {
                readerId: input.readerId,
                oldStatus: reader.status,
                newStatus: input.status
            });
            return {
                success: true,
                data: updatedReader
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update reader status', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to update reader status',
                    code: 'READER_UPDATE_FAILED',
                    details: error
                }
            };
        }
    }
    static async getVerificationHistory(query) {
        try {
            const page = query.page || 1;
            const limit = Math.min(query.limit || 20, 100);
            const skip = (page - 1) * limit;
            const filters = {};
            if (query.cardNumber) {
                filters.rfidCard = { cardNumber: query.cardNumber };
            }
            if (query.studentId) {
                filters.rfidCard = { ...filters.rfidCard, studentId: query.studentId };
            }
            if (query.schoolId) {
                filters.rfidCard = { ...filters.rfidCard, schoolId: query.schoolId };
            }
            if (query.readerId) {
                filters.rfidReaderId = query.readerId;
            }
            if (query.orderId) {
                filters.orderId = query.orderId;
            }
            if (query.startDate || query.endDate) {
                filters.verifiedAt = {};
                if (query.startDate)
                    filters.verifiedAt.gte = query.startDate;
                if (query.endDate)
                    filters.verifiedAt.lte = query.endDate;
            }
            const [verifications, total] = await Promise.all([
                database_service_1.DatabaseService.client.deliveryVerification.findMany({
                    where: filters,
                    include: {
                        ...(typeof database_service_1.DatabaseService.client.deliveryVerification.findMany.arguments?.[0]?.include?.rfidCard !== 'undefined' && {
                            rfidCard: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            schoolId: true
                                        }
                                    }
                                }
                            }
                        }),
                        ...(typeof database_service_1.DatabaseService.client.deliveryVerification.findMany.arguments?.[0]?.include?.rfidReader !== 'undefined' && {
                            rfidReader: true
                        }),
                        ...(typeof database_service_1.DatabaseService.client.deliveryVerification.findMany.arguments?.[0]?.include?.order !== 'undefined' && {
                            order: true
                        })
                    },
                    orderBy: { verifiedAt: 'desc' },
                    skip,
                    take: limit
                }),
                database_service_1.DatabaseService.client.deliveryVerification.count({ where: filters })
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    verifications: verifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get verification history', error, { query });
            return {
                success: false,
                error: {
                    message: 'Failed to get verification history',
                    code: 'HISTORY_FETCH_FAILED',
                    details: error
                }
            };
        }
    }
    static async deactivateCard(cardId, reason) {
        try {
            logger_1.logger.info('Deactivating RFID card', { cardId, reason });
            const card = await database_service_1.DatabaseService.client.rFIDCard.findUnique({
                where: { id: cardId }
            });
            if (!card) {
                return {
                    success: false,
                    error: {
                        message: 'RFID card not found',
                        code: 'CARD_NOT_FOUND'
                    }
                };
            }
            const updatedCard = await database_service_1.DatabaseService.client.rFIDCard.update({
                where: { id: cardId },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivationReason: reason,
                    updatedAt: new Date()
                }
            });
            await this.clearCardCache(card.cardNumber);
            logger_1.logger.info('RFID card deactivated successfully', {
                cardId,
                cardNumber: card.cardNumber,
                reason
            });
            return {
                success: true,
                data: updatedCard
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to deactivate RFID card', error, { cardId, reason });
            return {
                success: false,
                error: {
                    message: 'Failed to deactivate card',
                    code: 'CARD_DEACTIVATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async bulkRegisterCards(input) {
        try {
            logger_1.logger.info('Bulk registering RFID cards', {
                schoolId: input.schoolId,
                cardCount: input.cards.length
            });
            const successful = [];
            const failed = [];
            for (const cardInput of input.cards) {
                const result = await this.registerCard({
                    ...cardInput,
                    schoolId: input.schoolId
                });
                if (result.success && result.data) {
                    successful.push(result.data);
                }
                else {
                    failed.push({
                        cardNumber: cardInput.cardNumber,
                        studentId: cardInput.studentId,
                        error: result.error
                    });
                }
            }
            logger_1.logger.info('Bulk card registration completed', {
                successful: successful.length,
                failed: failed.length,
                total: input.cards.length
            });
            return {
                success: true,
                data: { successful, failed }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to bulk register cards', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to bulk register cards',
                    code: 'BULK_REGISTRATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async getCardAnalytics(query) {
        try {
            const filters = {
                verifiedAt: {
                    gte: query.startDate,
                    lte: query.endDate
                }
            };
            if (query.schoolId) {
                filters.rfidCard = { schoolId: query.schoolId };
            }
            const analytics = await database_service_1.DatabaseService.client.deliveryVerification.groupBy({
                by: ['cardId'],
                where: filters,
                _count: {
                    id: true
                },
                _min: {
                    verifiedAt: true
                },
                _max: {
                    verifiedAt: true
                }
            });
            return {
                success: true,
                data: {
                    totalVerifications: analytics.length,
                    uniqueCards: analytics.length,
                    verificationsByCard: Array.isArray(analytics) ? analytics.map((item) => ({
                        cardId: item.cardId || item.rfidCardId,
                        count: item._count?.id || 0,
                        firstVerification: item._min?.verifiedAt,
                        lastVerification: item._max?.verifiedAt
                    })) : []
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get card analytics', error, { query });
            return {
                success: false,
                error: {
                    message: 'Failed to get analytics',
                    code: 'ANALYTICS_FAILED',
                    details: error
                }
            };
        }
    }
    static async getReaderById(readerId) {
        const cacheKey = `rfid_reader:${readerId}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const reader = await database_service_1.DatabaseService.client.rFIDReader.findUnique({
            where: { id: readerId }
        });
        if (reader) {
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(reader));
        }
        return reader;
    }
    static async getCardByNumber(cardNumber) {
        const cacheKey = `rfid_card:${cardNumber}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const card = await database_service_1.DatabaseService.client.rFIDCard.findUnique({
            where: { cardNumber },
            include: {
                ...(typeof database_service_1.DatabaseService.client.rFIDCard.findUnique.arguments?.[0]?.include?.user !== 'undefined' && {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            schoolId: true
                        }
                    }
                })
            }
        });
        if (card) {
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(card));
        }
        return card ? {
            ...card,
            user: card.user || null
        } : null;
    }
    static async cacheCardData(card) {
        const cacheKey = `rfid_card:${card.cardNumber}`;
        await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(card));
    }
    static async clearCardCache(cardNumber) {
        const cacheKey = `rfid_card:${cardNumber}`;
        await cache_1.cache.del(cacheKey);
    }
    static async updateCardLastUsed(cardId) {
        await database_service_1.DatabaseService.client.rFIDCard.update({
            where: { id: cardId },
            data: { lastUsedAt: new Date() }
        });
    }
    static isValidCardNumber(cardNumber) {
        return /^[A-Z0-9]{8,16}$/.test(cardNumber);
    }
    static assessSignalQuality(signalStrength, readDuration) {
        if (signalStrength >= 80 && readDuration <= 500)
            return 'excellent';
        if (signalStrength >= 60 && readDuration <= 1000)
            return 'good';
        if (signalStrength >= 40 && readDuration <= 2000)
            return 'fair';
        return 'poor';
    }
    async createCard(input) {
        return await RFIDService.registerCard(input);
    }
}
exports.RFIDService = RFIDService;
exports.rfidService = new RFIDService();
//# sourceMappingURL=rfid.service.js.map