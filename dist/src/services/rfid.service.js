"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rfidService = exports.RfidService = void 0;
const database_service_1 = require("./database.service");
const cache_1 = require("../utils/cache");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class RfidService {
    static instance;
    prisma;
    verificationCache;
    constructor() {
        this.prisma = database_service_1.DatabaseService.getInstance().client;
        this.verificationCache = new Map();
    }
    static getInstance() {
        if (!RfidService.instance) {
            RfidService.instance = new RfidService();
        }
        return RfidService.instance;
    }
    isValidCardNumber(cardNumber) {
        const cardRegex = /^[A-Z0-9-]{4,20}$/;
        return cardRegex.test(cardNumber);
    }
    assessSignalQuality(signalStrength, readDuration) {
        if (signalStrength >= 80 && readDuration <= 500)
            return 'excellent';
        if (signalStrength >= 60 && readDuration <= 1000)
            return 'good';
        if (signalStrength >= 40 && readDuration <= 2000)
            return 'fair';
        return 'poor';
    }
    async getReaderById(readerId) {
        const cacheKey = `rfid_reader:${readerId}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const reader = await this.prisma.rFIDReader.findUnique({
            where: { id: readerId },
        });
        if (reader) {
            await cache_1.cache.setex(cacheKey, 600, JSON.stringify(reader));
        }
        return reader;
    }
    async getCardByNumber(cardNumber) {
        const cacheKey = `rfid_card:${cardNumber}`;
        const cached = await cache_1.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const card = await this.prisma.rFIDCard.findUnique({
            where: { cardNumber },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        schoolId: true,
                    },
                },
            },
        });
        if (card) {
            await cache_1.cache.setex(cacheKey, 600, JSON.stringify(card));
        }
        return card;
    }
    async registerCard(input) {
        try {
            if (!this.isValidCardNumber(input.cardNumber)) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_CARD_FORMAT',
                        message: 'Card number must be 4-20 characters containing only uppercase letters, numbers, and hyphens',
                    },
                };
            }
            const existingCard = await this.prisma.rFIDCard.findUnique({
                where: { cardNumber: input.cardNumber },
            });
            if (existingCard) {
                return {
                    success: false,
                    error: {
                        code: 'CARD_ALREADY_EXISTS',
                        message: 'RFID card number already exists',
                        details: { existingCardId: existingCard.id },
                    },
                };
            }
            const student = await this.prisma.user.findUnique({
                where: { id: input.studentId },
            });
            if (!student) {
                return {
                    success: false,
                    error: {
                        code: 'STUDENT_NOT_FOUND',
                        message: 'Student not found',
                    },
                };
            }
            if (student.schoolId !== input.schoolId) {
                return {
                    success: false,
                    error: {
                        code: 'SCHOOL_MISMATCH',
                        message: 'Student does not belong to the specified school',
                        details: {
                            studentSchool: student.schoolId,
                            requestedSchool: input.schoolId,
                        },
                    },
                };
            }
            const existingActiveCard = await this.prisma.rFIDCard.findFirst({
                where: {
                    studentId: input.studentId,
                    isActive: true,
                },
            });
            if (existingActiveCard) {
                return {
                    success: false,
                    error: {
                        code: 'STUDENT_HAS_ACTIVE_CARD',
                        message: 'Student already has an active RFID card',
                        details: { existingCardNumber: existingActiveCard.cardNumber },
                    },
                };
            }
            const card = await this.prisma.rFIDCard.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    cardNumber: input.cardNumber,
                    studentId: input.studentId,
                    schoolId: input.schoolId,
                    isActive: true,
                    issuedAt: new Date(),
                    expiresAt: input.expiryDate,
                    metadata: '{}',
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            schoolId: true,
                        },
                    },
                },
            });
            await cache_1.cache.setex(`rfid_card:${input.cardNumber}`, 600, JSON.stringify(card));
            return {
                success: true,
                data: card,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to register RFID card', error, { input });
            return {
                success: false,
                error: {
                    code: 'CARD_REGISTRATION_FAILED',
                    message: 'Failed to register RFID card',
                },
            };
        }
    }
    async verifyDelivery(input) {
        try {
            let reader = null;
            if (input.readerId) {
                reader = await this.getReaderById(input.readerId);
                if (!reader) {
                    return {
                        success: false,
                        error: {
                            code: 'READER_NOT_FOUND',
                            message: 'RFID reader not found',
                            details: { readerId: input.readerId },
                        },
                    };
                }
                if (reader.status !== 'online') {
                    return {
                        success: false,
                        error: {
                            code: 'READER_OFFLINE',
                            message: 'RFID reader is not online',
                            details: { status: reader.status },
                        },
                    };
                }
            }
            const card = await this.getCardByNumber(input.cardNumber);
            if (!card) {
                return {
                    success: false,
                    error: {
                        code: 'CARD_NOT_FOUND',
                        message: 'RFID card not found',
                        details: { cardNumber: input.cardNumber },
                    },
                };
            }
            if (!card.isActive) {
                return {
                    success: false,
                    error: {
                        code: 'CARD_INACTIVE',
                        message: 'RFID card is deactivated',
                        details: { isActive: card.isActive },
                    },
                };
            }
            if (card.expiresAt && card.expiresAt < new Date()) {
                return {
                    success: false,
                    error: {
                        code: 'CARD_EXPIRED',
                        message: 'RFID card has expired',
                        details: { expiryDate: card.expiresAt },
                    },
                };
            }
            if (reader && card.schoolId !== reader.schoolId) {
                return {
                    success: false,
                    error: {
                        code: 'SCHOOL_MISMATCH',
                        message: 'Card and reader belong to different schools',
                        details: {
                            cardSchool: card.schoolId,
                            readerSchool: reader.schoolId,
                        },
                    },
                };
            }
            let order = null;
            if (input.orderId) {
                order = await this.prisma.order.findUnique({
                    where: { id: input.orderId },
                });
                if (!order) {
                    return {
                        success: false,
                        error: {
                            code: 'ORDER_NOT_FOUND',
                            message: 'Order not found',
                            details: { orderId: input.orderId },
                        },
                    };
                }
                if (order.studentId !== card.studentId) {
                    return {
                        success: false,
                        error: {
                            code: 'ORDER_STUDENT_MISMATCH',
                            message: 'Order does not belong to the card holder',
                            details: {
                                orderStudentId: order.studentId,
                                cardStudentId: card.studentId,
                            },
                        },
                    };
                }
            }
            const signalStrength = input.signalStrength || 85;
            const readDuration = input.readDuration || 350;
            const signalQuality = this.assessSignalQuality(signalStrength, readDuration);
            const verificationData = {
                id: (0, uuid_1.v4)(),
                verifiedAt: input.timestamp || new Date(),
                location: input.location || 'Unknown',
                verificationData: JSON.stringify({
                    signalStrength,
                    readDuration,
                    signalQuality,
                    verificationData: {},
                }),
                cardId: card.id,
                studentId: card.studentId,
            };
            if (input.readerId) {
                verificationData.readerId = input.readerId;
            }
            if (input.orderId) {
                verificationData.orderId = input.orderId;
            }
            const verification = await this.prisma.deliveryVerification.create({
                data: verificationData,
            });
            await this.prisma.rFIDCard.update({
                where: { id: card.id },
                data: { lastUsedAt: new Date() },
            });
            await cache_1.cache.setex(`verification:${verification.id}`, 86400, JSON.stringify({
                cardNumber: input.cardNumber,
                verifiedAt: verification.verifiedAt,
                signalQuality,
            }));
            this.verificationCache.set(verification.id, {
                cardNumber: input.cardNumber,
                verifiedAt: verification.verifiedAt,
                signalQuality,
            });
            const student = await this.prisma.user.findUnique({
                where: { id: card.studentId },
                select: { firstName: true, lastName: true },
            });
            const result = {
                success: true,
                cardNumber: input.cardNumber,
                studentId: card.studentId,
                studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
                schoolId: card.schoolId,
                verificationId: verification.id,
                signalQuality,
            };
            if (order) {
                result.orderInfo = {
                    orderId: order.id,
                    status: order.status,
                    deliveryDate: order.deliveryDate,
                };
            }
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify RFID delivery', error, { input });
            return {
                success: false,
                error: {
                    code: 'VERIFICATION_FAILED',
                    message: 'Failed to verify RFID delivery',
                },
            };
        }
    }
    async updateReaderStatus(input) {
        try {
            const existingReader = await this.prisma.rFIDReader.findUnique({
                where: { id: input.readerId },
            });
            if (!existingReader) {
                return {
                    success: false,
                    error: {
                        code: 'READER_NOT_FOUND',
                        message: 'RFID reader not found',
                    },
                };
            }
            const updatedReader = await this.prisma.rFIDReader.update({
                where: { id: input.readerId },
                data: {
                    status: input.status || existingReader.status,
                    location: input.location || existingReader.location,
                    lastHeartbeat: new Date(),
                    configuration: input.metadata
                        ? JSON.stringify(input.metadata)
                        : existingReader.configuration,
                    updatedAt: new Date(),
                },
            });
            await cache_1.cache.del(`rfid_reader:${input.readerId}`);
            return {
                success: true,
                data: updatedReader,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update reader status', error, { input });
            return {
                success: false,
                error: {
                    code: 'READER_UPDATE_FAILED',
                    message: 'Failed to update reader status',
                },
            };
        }
    }
    async getVerificationHistory(query = {}) {
        try {
            const page = Math.max(1, query.page || 1);
            const limit = Math.min(100, Math.max(1, query.limit || 20));
            const skip = (page - 1) * limit;
            const where = {};
            if (query.cardNumber) {
                where.card = { cardNumber: query.cardNumber };
            }
            if (query.studentId) {
                where.studentId = query.studentId;
            }
            if (query.schoolId) {
                where.card = { ...where.card, schoolId: query.schoolId };
            }
            if (query.readerId) {
                where.readerId = query.readerId;
            }
            if (query.orderId) {
                where.orderId = query.orderId;
            }
            if (query.startDate || query.endDate) {
                where.verifiedAt = {};
                if (query.startDate)
                    where.verifiedAt.gte = query.startDate;
                if (query.endDate)
                    where.verifiedAt.lte = query.endDate;
            }
            const [verifications, total] = await Promise.all([
                this.prisma.deliveryVerification.findMany({
                    where,
                    include: {
                        card: true,
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                schoolId: true,
                            },
                        },
                        reader: true,
                        order: true,
                    },
                    orderBy: { verifiedAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.deliveryVerification.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    verifications,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get verification history', error, { query });
            return {
                success: false,
                error: {
                    code: 'HISTORY_FETCH_FAILED',
                    message: 'Failed to fetch verification history',
                },
            };
        }
    }
    async deactivateCard(cardId, reason) {
        try {
            const card = await this.prisma.rFIDCard.findUnique({
                where: { id: cardId },
            });
            if (!card) {
                return {
                    success: false,
                    error: {
                        code: 'CARD_NOT_FOUND',
                        message: 'RFID card not found',
                    },
                };
            }
            const updatedCard = await this.prisma.rFIDCard.update({
                where: { id: cardId },
                data: {
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivationReason: reason,
                    updatedAt: new Date(),
                },
            });
            await cache_1.cache.del(`rfid_card:${card.cardNumber}`);
            return {
                success: true,
                data: updatedCard,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to deactivate RFID card', error, { cardId, reason });
            return {
                success: false,
                error: {
                    code: 'CARD_DEACTIVATION_FAILED',
                    message: 'Failed to deactivate RFID card',
                },
            };
        }
    }
    async bulkRegisterCards(input) {
        const successful = [];
        const failed = [];
        for (const cardInput of input.cards) {
            try {
                const result = await this.registerCard({
                    ...cardInput,
                    schoolId: input.schoolId,
                });
                if (result.success && result.data) {
                    successful.push({
                        cardNumber: cardInput.cardNumber,
                        cardId: result.data.id,
                        studentId: cardInput.studentId,
                    });
                }
                else {
                    failed.push({
                        cardNumber: cardInput.cardNumber,
                        studentId: cardInput.studentId,
                        error: {
                            message: result.error?.message || 'Unknown error',
                            code: result.error?.code || 'UNKNOWN_ERROR',
                        },
                    });
                }
            }
            catch (error) {
                failed.push({
                    cardNumber: cardInput.cardNumber,
                    studentId: cardInput.studentId,
                    error: {
                        message: 'Unexpected error during registration',
                        code: 'REGISTRATION_ERROR',
                    },
                });
            }
        }
        return {
            success: true,
            data: { successful, failed },
        };
    }
    async getCardAnalytics(query) {
        try {
            const where = {};
            if (query.startDate || query.endDate) {
                where.verifiedAt = {};
                if (query.startDate)
                    where.verifiedAt.gte = query.startDate;
                if (query.endDate)
                    where.verifiedAt.lte = query.endDate;
            }
            if (query.schoolId) {
                where.card = { schoolId: query.schoolId };
            }
            const analytics = await this.prisma.deliveryVerification.groupBy({
                by: ['cardId'],
                where,
                _count: { id: true },
                _min: { verifiedAt: true },
                _max: { verifiedAt: true },
            });
            const verificationsByCard = analytics.map(item => ({
                cardId: item.cardId,
                count: item._count?.id || 0,
                firstVerification: item._min?.verifiedAt || new Date(),
                lastVerification: item._max?.verifiedAt || new Date(),
            }));
            return {
                success: true,
                data: {
                    totalVerifications: verificationsByCard.reduce((sum, item) => sum + item.count, 0),
                    uniqueCards: verificationsByCard.length,
                    verificationsByCard,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get card analytics', error, { query });
            return {
                success: false,
                error: {
                    code: 'ANALYTICS_FAILED',
                    message: 'Failed to get card analytics',
                },
            };
        }
    }
}
exports.RfidService = RfidService;
exports.rfidService = RfidService.getInstance();
exports.default = RfidService;
//# sourceMappingURL=rfid.service.js.map