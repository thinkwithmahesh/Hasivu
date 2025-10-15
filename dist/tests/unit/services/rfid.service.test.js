"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rfid_service_1 = require("../../../src/services/rfid.service");
const database_service_1 = require("../../../src/services/database.service");
const redis_service_1 = require("../../../src/services/redis.service");
const cache_1 = require("../../../src/utils/cache");
const logger_1 = require("../../../src/utils/logger");
jest.mock('../../../src/services/database.service', () => ({
    DatabaseService: {
        client: {
            rFIDCard: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn()
            },
            rFIDReader: {
                findUnique: jest.fn(),
                update: jest.fn()
            },
            user: {
                findUnique: jest.fn()
            },
            order: {
                findUnique: jest.fn()
            },
            deliveryVerification: {
                create: jest.fn(),
                findMany: jest.fn(),
                count: jest.fn(),
                groupBy: jest.fn()
            }
        },
        getInstance: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        getHealth: jest.fn(),
        isConnected: jest.fn()
    }
}));
jest.mock('../../../src/services/redis.service', () => ({
    RedisService: {
        get: jest.fn(),
        set: jest.fn(),
        setex: jest.fn(),
        del: jest.fn(),
        exists: jest.fn()
    }
}));
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
jest.mock('../../../src/utils/cache', () => ({
    cache: {
        get: jest.fn(),
        setex: jest.fn(),
        del: jest.fn()
    }
}));
jest.mock('uuid', () => ({
    v4: () => 'mocked-uuid-1234'
}));
const MockedDatabaseService = jest.mocked(database_service_1.DatabaseService);
const MockedRedisService = jest.mocked(redis_service_1.RedisService);
describe('RFIDService', () => {
    const mockSchool = {
        id: 'school-123',
        name: 'Test School',
        address: '123 School St'
    };
    const mockUser = {
        id: 'student-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@school.edu',
        schoolId: 'school-123',
        school: mockSchool
    };
    const mockRFIDCard = {
        id: 'card-id-123',
        cardNumber: 'RFID12345678',
        cardType: 'student',
        isActive: true,
        studentId: 'student-123',
        schoolId: 'school-123',
        issuedAt: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        deactivatedAt: null,
        deactivationReason: null,
        lastUsedAt: null,
        metadata: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
            id: 'student-123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@school.edu',
            schoolId: 'school-123'
        }
    };
    const mockRFIDReader = {
        id: 'reader-123',
        name: 'Cafeteria Reader 1',
        location: 'Main Cafeteria',
        status: 'online',
        schoolId: 'school-123',
        lastPing: new Date(),
        metadata: '{}',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const mockOrder = {
        id: 'order-123',
        studentId: 'student-123',
        status: 'CONFIRMED',
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalAmount: 250
    };
    const mockDeliveryVerification = {
        id: 'verification-123',
        verifiedAt: new Date(),
        location: 'Main Cafeteria',
        signalStrength: 85,
        readDuration: 350,
        rfidCardId: 'card-id-123',
        rfidReaderId: 'reader-123',
        orderId: 'order-123',
        metadata: '{}'
    };
    beforeEach(() => {
        jest.clearAllMocks();
        rfid_service_1.RfidService.verificationCache = new Map();
    });
    describe('Card Registration', () => {
        describe('registerCard', () => {
            const validCardInput = {
                cardNumber: 'RFID12345678',
                studentId: 'student-123',
                schoolId: 'school-123',
                cardType: 'student',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            };
            beforeEach(() => {
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(null);
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(mockUser);
                MockedDatabaseService.client.rFIDCard.findFirst.mockResolvedValue(null);
                MockedDatabaseService.client.rFIDCard.create.mockResolvedValue(mockRFIDCard);
                cache_1.cache.setex.mockResolvedValue('OK');
            });
            it('should register a new RFID card successfully', async () => {
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(true);
                expect(result.data).toEqual(mockRFIDCard);
                expect(MockedDatabaseService.client.rFIDCard.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        id: 'mocked-uuid-1234',
                        cardNumber: 'RFID12345678',
                        cardType: 'student',
                        isActive: true,
                        user: { connect: { id: 'student-123' } },
                        school: { connect: { id: 'school-123' } }
                    }),
                    include: expect.any(Object)
                });
                expect(cache_1.cache.setex).toHaveBeenCalled();
            });
            it('should reject invalid card number format', async () => {
                const invalidInput = { ...validCardInput, cardNumber: '123' };
                const result = await rfid_service_1.RfidService.getInstance().registerCard(invalidInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('INVALID_CARD_FORMAT');
                expect(MockedDatabaseService.client.rFIDCard.create).not.toHaveBeenCalled();
            });
            it('should reject duplicate card number', async () => {
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_ALREADY_EXISTS');
                expect(result.error?.details?.existingCardId).toBe('card-id-123');
            });
            it('should reject non-existent student', async () => {
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('STUDENT_NOT_FOUND');
            });
            it('should reject student from different school', async () => {
                const differentSchoolUser = { ...mockUser, schoolId: 'different-school-123' };
                MockedDatabaseService.client.user.findUnique.mockResolvedValue(differentSchoolUser);
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('SCHOOL_MISMATCH');
                expect(result.error?.details?.studentSchool).toBe('different-school-123');
                expect(result.error?.details?.requestedSchool).toBe('school-123');
            });
            it('should reject student who already has active card', async () => {
                const existingCard = { ...mockRFIDCard, cardNumber: 'EXISTING123' };
                MockedDatabaseService.client.rFIDCard.findFirst.mockResolvedValue(existingCard);
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('STUDENT_HAS_ACTIVE_CARD');
                expect(result.error?.details?.existingCardNumber).toBe('EXISTING123');
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.rFIDCard.create.mockRejectedValue(new Error('Database error'));
                const result = await rfid_service_1.RfidService.getInstance().registerCard(validCardInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_REGISTRATION_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to register RFID card', expect.any(Error), { input: validCardInput });
            });
        });
    });
    describe('Delivery Verification', () => {
        describe('verifyDelivery', () => {
            const validVerificationInput = {
                cardNumber: 'RFID12345678',
                readerId: 'reader-123',
                orderId: 'order-123',
                signalStrength: 85,
                readDuration: 350,
                location: 'Main Cafeteria',
                timestamp: new Date()
            };
            beforeEach(() => {
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(mockRFIDReader);
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
                MockedDatabaseService.client.order.findUnique.mockResolvedValue(mockOrder);
                MockedDatabaseService.client.deliveryVerification.create.mockResolvedValue(mockDeliveryVerification);
                MockedDatabaseService.client.rFIDCard.update.mockResolvedValue(mockRFIDCard);
                cache_1.cache.get.mockResolvedValue(null);
                cache_1.cache.setex.mockResolvedValue('OK');
            });
            it('should verify delivery successfully with all validations', async () => {
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(true);
                expect(result.data).toMatchObject({
                    success: true,
                    cardNumber: 'RFID12345678',
                    studentId: 'student-123',
                    studentName: 'John Doe',
                    schoolId: 'school-123',
                    verificationId: 'verification-123',
                    signalQuality: 'excellent'
                });
                expect(MockedDatabaseService.client.deliveryVerification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        id: 'mocked-uuid-1234',
                        signalStrength: 85,
                        readDuration: 350,
                        rfidCard: { connect: { id: 'card-id-123' } },
                        rfidReader: { connect: { id: 'reader-123' } },
                        order: { connect: { id: 'order-123' } }
                    })
                });
                expect(MockedDatabaseService.client.rFIDCard.update).toHaveBeenCalledWith({
                    where: { id: 'card-id-123' },
                    data: { lastUsedAt: expect.any(Date) }
                });
            });
            it('should verify delivery without order ID', async () => {
                const { orderId, ...inputWithoutOrder } = validVerificationInput;
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(inputWithoutOrder);
                expect(result.success).toBe(true);
                expect(result.data?.orderInfo).toBeUndefined();
                expect(MockedDatabaseService.client.deliveryVerification.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        order: undefined
                    })
                });
            });
            it('should reject verification with non-existent reader', async () => {
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('READER_NOT_FOUND');
                expect(result.error?.details?.readerId).toBe('reader-123');
            });
            it('should reject verification with offline reader', async () => {
                const offlineReader = { ...mockRFIDReader, status: 'offline' };
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(offlineReader);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('READER_OFFLINE');
                expect(result.error?.details?.status).toBe('offline');
            });
            it('should reject verification with non-existent card', async () => {
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_NOT_FOUND');
                expect(result.error?.details?.cardNumber).toBe('RFID12345678');
            });
            it('should reject verification with inactive card', async () => {
                const inactiveCard = { ...mockRFIDCard, isActive: false };
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(inactiveCard);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_INACTIVE');
                expect(result.error?.details?.isActive).toBe(false);
            });
            it('should reject verification with expired card', async () => {
                const expiredCard = {
                    ...mockRFIDCard,
                    expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
                };
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(expiredCard);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_EXPIRED');
                expect(result.error?.details?.expiryDate).toEqual(expiredCard.expiryDate);
            });
            it('should reject verification with school mismatch', async () => {
                const differentSchoolReader = { ...mockRFIDReader, schoolId: 'different-school-123' };
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(differentSchoolReader);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('SCHOOL_MISMATCH');
                expect(result.error?.details?.cardSchool).toBe('school-123');
                expect(result.error?.details?.readerSchool).toBe('different-school-123');
            });
            it('should reject verification with non-existent order', async () => {
                MockedDatabaseService.client.order.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('ORDER_NOT_FOUND');
                expect(result.error?.details?.orderId).toBe('order-123');
            });
            it('should reject verification with order-student mismatch', async () => {
                const differentStudentOrder = { ...mockOrder, studentId: 'different-student-123' };
                MockedDatabaseService.client.order.findUnique.mockResolvedValue(differentStudentOrder);
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('ORDER_STUDENT_MISMATCH');
                expect(result.error?.details?.orderStudentId).toBe('different-student-123');
                expect(result.error?.details?.cardStudentId).toBe('student-123');
            });
            it('should assess signal quality correctly', async () => {
                const excellentInput = { ...validVerificationInput, signalStrength: 90, readDuration: 300 };
                let result = await rfid_service_1.RfidService.getInstance().verifyDelivery(excellentInput);
                expect(result.data?.signalQuality).toBe('excellent');
                const goodInput = { ...validVerificationInput, signalStrength: 70, readDuration: 800 };
                result = await rfid_service_1.RfidService.getInstance().verifyDelivery(goodInput);
                expect(result.data?.signalQuality).toBe('good');
                const fairInput = { ...validVerificationInput, signalStrength: 50, readDuration: 1500 };
                result = await rfid_service_1.RfidService.getInstance().verifyDelivery(fairInput);
                expect(result.data?.signalQuality).toBe('fair');
                const poorInput = { ...validVerificationInput, signalStrength: 30, readDuration: 3000 };
                result = await rfid_service_1.RfidService.getInstance().verifyDelivery(poorInput);
                expect(result.data?.signalQuality).toBe('poor');
            });
            it('should use cached reader data when available', async () => {
                const cachedReader = JSON.stringify(mockRFIDReader);
                cache_1.cache.get.mockResolvedValueOnce(cachedReader);
                await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(cache_1.cache.get).toHaveBeenCalledWith('rfid_reader:reader-123');
                expect(MockedDatabaseService.client.rFIDReader.findUnique).not.toHaveBeenCalled();
            });
            it('should use cached card data when available', async () => {
                const cachedCard = JSON.stringify(mockRFIDCard);
                cache_1.cache.get
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(cachedCard);
                await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(cache_1.cache.get).toHaveBeenCalledWith('rfid_card:RFID12345678');
                expect(MockedDatabaseService.client.rFIDCard.findUnique).not.toHaveBeenCalled();
            });
            it('should handle verification cache management', async () => {
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(true);
                expect(cache_1.cache.setex).toHaveBeenCalledWith('verification:verification-123', 86400, expect.stringContaining('RFID12345678'));
                const { verificationCache } = rfid_service_1.RfidService;
                expect(verificationCache.size).toBe(1);
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.deliveryVerification.create.mockRejectedValue(new Error('Database error'));
                const result = await rfid_service_1.RfidService.getInstance().verifyDelivery(validVerificationInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('VERIFICATION_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to verify RFID delivery', expect.any(Error), { input: validVerificationInput });
            });
        });
    });
    describe('Reader Management', () => {
        describe('updateReaderStatus', () => {
            const statusUpdateInput = {
                readerId: 'reader-123',
                status: 'maintenance',
                location: 'Updated Location',
                metadata: { maintenance_reason: 'Scheduled maintenance' }
            };
            beforeEach(() => {
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(mockRFIDReader);
                MockedDatabaseService.client.rFIDReader.update.mockResolvedValue({
                    ...mockRFIDReader,
                    status: 'maintenance',
                    location: 'Updated Location'
                });
                cache_1.cache.del.mockResolvedValue(1);
            });
            it('should update reader status successfully', async () => {
                const result = await rfid_service_1.RfidService.getInstance().updateReaderStatus(statusUpdateInput);
                expect(result.success).toBe(true);
                expect(result.data?.status).toBe('maintenance');
                expect(result.data?.location).toBe('Updated Location');
                expect(MockedDatabaseService.client.rFIDReader.update).toHaveBeenCalledWith({
                    where: { id: 'reader-123' },
                    data: expect.objectContaining({
                        status: 'maintenance',
                        location: 'Updated Location',
                        lastPing: expect.any(Date),
                        metadata: JSON.stringify({ maintenance_reason: 'Scheduled maintenance' }),
                        updatedAt: expect.any(Date)
                    })
                });
                expect(cache_1.cache.del).toHaveBeenCalledWith('rfid_reader:reader-123');
            });
            it('should update reader status without changing location', async () => {
                const { location, ...inputWithoutLocation } = statusUpdateInput;
                const result = await rfid_service_1.RfidService.getInstance().updateReaderStatus(inputWithoutLocation);
                expect(result.success).toBe(true);
                expect(MockedDatabaseService.client.rFIDReader.update).toHaveBeenCalledWith({
                    where: { id: 'reader-123' },
                    data: expect.objectContaining({
                        location: 'Main Cafeteria'
                    })
                });
            });
            it('should reject update for non-existent reader', async () => {
                MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().updateReaderStatus(statusUpdateInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('READER_NOT_FOUND');
                expect(MockedDatabaseService.client.rFIDReader.update).not.toHaveBeenCalled();
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.rFIDReader.update.mockRejectedValue(new Error('Database error'));
                const result = await rfid_service_1.RfidService.getInstance().updateReaderStatus(statusUpdateInput);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('READER_UPDATE_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to update reader status', expect.any(Error), { input: statusUpdateInput });
            });
        });
    });
    describe('Verification History', () => {
        describe('getVerificationHistory', () => {
            const mockVerifications = [
                {
                    ...mockDeliveryVerification,
                    rfidCard: mockRFIDCard,
                    rfidReader: mockRFIDReader,
                    order: mockOrder
                }
            ];
            beforeEach(() => {
                MockedDatabaseService.client.deliveryVerification.findMany.mockResolvedValue(mockVerifications);
                MockedDatabaseService.client.deliveryVerification.count.mockResolvedValue(1);
            });
            it('should get verification history with default pagination', async () => {
                const query = {};
                const result = await rfid_service_1.RfidService.getInstance().getVerificationHistory(query);
                expect(result.success).toBe(true);
                expect(result.data?.verifications).toEqual(mockVerifications);
                expect(result.data?.pagination).toEqual({
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1
                });
            });
            it('should filter by card number', async () => {
                const query = { cardNumber: 'RFID12345678' };
                await rfid_service_1.RfidService.getInstance().getVerificationHistory(query);
                expect(MockedDatabaseService.client.deliveryVerification.findMany).toHaveBeenCalledWith({
                    where: { rfidCard: { cardNumber: 'RFID12345678' } },
                    include: expect.any(Object),
                    orderBy: { verifiedAt: 'desc' },
                    skip: 0,
                    take: 20
                });
            });
            it('should filter by multiple criteria', async () => {
                const query = {
                    cardNumber: 'RFID12345678',
                    studentId: 'student-123',
                    schoolId: 'school-123',
                    readerId: 'reader-123',
                    orderId: 'order-123',
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-12-31')
                };
                await rfid_service_1.RfidService.getInstance().getVerificationHistory(query);
                expect(MockedDatabaseService.client.deliveryVerification.findMany).toHaveBeenCalledWith({
                    where: {
                        rfidCard: {
                            cardNumber: 'RFID12345678',
                            studentId: 'student-123',
                            schoolId: 'school-123'
                        },
                        rfidReaderId: 'reader-123',
                        orderId: 'order-123',
                        verifiedAt: {
                            gte: new Date('2024-01-01'),
                            lte: new Date('2024-12-31')
                        }
                    },
                    include: expect.any(Object),
                    orderBy: { verifiedAt: 'desc' },
                    skip: 0,
                    take: 20
                });
            });
            it('should handle custom pagination', async () => {
                const query = { page: 2, limit: 10 };
                await rfid_service_1.RfidService.getInstance().getVerificationHistory(query);
                expect(MockedDatabaseService.client.deliveryVerification.findMany).toHaveBeenCalledWith({
                    where: {},
                    include: expect.any(Object),
                    orderBy: { verifiedAt: 'desc' },
                    skip: 10,
                    take: 10
                });
            });
            it('should limit maximum page size to 100', async () => {
                const query = { limit: 200 };
                await rfid_service_1.RfidService.getInstance().getVerificationHistory(query);
                expect(MockedDatabaseService.client.deliveryVerification.findMany).toHaveBeenCalledWith({
                    where: {},
                    include: expect.any(Object),
                    orderBy: { verifiedAt: 'desc' },
                    skip: 0,
                    take: 100
                });
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.deliveryVerification.findMany.mockRejectedValue(new Error('Database error'));
                const result = await rfid_service_1.RfidService.getInstance().getVerificationHistory({});
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('HISTORY_FETCH_FAILED');
            });
        });
    });
    describe('Card Management', () => {
        describe('deactivateCard', () => {
            const cardId = 'card-id-123';
            const reason = 'Lost card';
            beforeEach(() => {
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
                MockedDatabaseService.client.rFIDCard.update.mockResolvedValue({
                    ...mockRFIDCard,
                    isActive: false,
                    deactivatedAt: new Date(),
                    deactivationReason: reason
                });
                cache_1.cache.del.mockResolvedValue(1);
            });
            it('should deactivate card successfully', async () => {
                const result = await rfid_service_1.RfidService.getInstance().deactivateCard(cardId, reason);
                expect(result.success).toBe(true);
                expect(result.data?.isActive).toBe(false);
                expect(result.data?.deactivationReason).toBe(reason);
                expect(MockedDatabaseService.client.rFIDCard.update).toHaveBeenCalledWith({
                    where: { id: cardId },
                    data: expect.objectContaining({
                        isActive: false,
                        deactivatedAt: expect.any(Date),
                        deactivationReason: reason,
                        updatedAt: expect.any(Date)
                    })
                });
                expect(cache_1.cache.del).toHaveBeenCalledWith('rfid_card:RFID12345678');
            });
            it('should reject deactivation of non-existent card', async () => {
                MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(null);
                const result = await rfid_service_1.RfidService.getInstance().deactivateCard(cardId, reason);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_NOT_FOUND');
                expect(MockedDatabaseService.client.rFIDCard.update).not.toHaveBeenCalled();
            });
            it('should handle database errors gracefully', async () => {
                MockedDatabaseService.client.rFIDCard.update.mockRejectedValue(new Error('Database error'));
                const result = await rfid_service_1.RfidService.getInstance().deactivateCard(cardId, reason);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('CARD_DEACTIVATION_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to deactivate RFID card', expect.any(Error), { cardId, reason });
            });
        });
        describe('bulkRegisterCards', () => {
            const bulkInput = {
                schoolId: 'school-123',
                cards: [
                    { cardNumber: 'CARD001', studentId: 'student-1', cardType: 'student' },
                    { cardNumber: 'CARD002', studentId: 'student-2', cardType: 'student' },
                    { cardNumber: 'INVALID', studentId: 'student-3', cardType: 'student' }
                ]
            };
            beforeEach(() => {
                const registerCardSpy = jest.spyOn(rfid_service_1.RfidService.prototype, 'registerCard');
                registerCardSpy
                    .mockResolvedValueOnce({ success: true, data: { ...mockRFIDCard, cardNumber: 'CARD001' } })
                    .mockResolvedValueOnce({ success: true, data: { ...mockRFIDCard, cardNumber: 'CARD002' } })
                    .mockResolvedValueOnce({
                    success: false,
                    error: { message: 'Invalid card format', code: 'INVALID_CARD_FORMAT' }
                });
            });
            it('should process bulk registration with mixed results', async () => {
                const result = await rfid_service_1.RfidService.getInstance().bulkRegisterCards(bulkInput);
                expect(result.success).toBe(true);
                expect(result.data?.successful).toHaveLength(2);
                expect(result.data?.failed).toHaveLength(1);
                expect(result.data?.successful[0].cardNumber).toBe('CARD001');
                expect(result.data?.successful[1].cardNumber).toBe('CARD002');
                expect(result.data?.failed[0]).toEqual({
                    cardNumber: 'INVALID',
                    studentId: 'student-3',
                    error: { message: 'Invalid card format', code: 'INVALID_CARD_FORMAT' }
                });
            });
        });
    });
    describe('Analytics', () => {
        describe('getCardAnalytics', () => {
            const analyticsQuery = {
                schoolId: 'school-123',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                groupBy: 'day'
            };
            const mockAnalyticsData = [
                {
                    rfidCardId: 'card-1',
                    _count: { id: 5 },
                    _min: { verifiedAt: new Date('2024-01-01') },
                    _max: { verifiedAt: new Date('2024-01-31') }
                },
                {
                    rfidCardId: 'card-2',
                    _count: { id: 3 },
                    _min: { verifiedAt: new Date('2024-02-01') },
                    _max: { verifiedAt: new Date('2024-02-15') }
                }
            ];
            beforeEach(() => {
                MockedDatabaseService.client.deliveryVerification.groupBy.mockResolvedValue(mockAnalyticsData);
            });
            it('should get card analytics successfully', async () => {
                const result = await rfid_service_1.RfidService.getInstance().getCardAnalytics(analyticsQuery);
                expect(result.success).toBe(true);
                expect(result.data?.totalVerifications).toBe(2);
                expect(result.data?.uniqueCards).toBe(2);
                expect(result.data?.verificationsByCard).toHaveLength(2);
                expect(result.data?.verificationsByCard[0]).toEqual({
                    cardId: 'card-1',
                    count: 5,
                    firstVerification: new Date('2024-01-01'),
                    lastVerification: new Date('2024-01-31')
                });
            });
            it('should filter analytics by school', async () => {
                await rfid_service_1.RfidService.getInstance().getCardAnalytics(analyticsQuery);
                expect(MockedDatabaseService.client.deliveryVerification.groupBy).toHaveBeenCalledWith({
                    by: ['rfidCardId'],
                    where: {
                        verifiedAt: {
                            gte: new Date('2024-01-01'),
                            lte: new Date('2024-12-31')
                        },
                        rfidCard: { schoolId: 'school-123' }
                    },
                    _count: { id: true },
                    _min: { verifiedAt: true },
                    _max: { verifiedAt: true }
                });
            });
            it('should get analytics without school filter', async () => {
                const { schoolId, ...queryWithoutSchool } = analyticsQuery;
                await rfid_service_1.RfidService.getInstance().getCardAnalytics(queryWithoutSchool);
                expect(MockedDatabaseService.client.deliveryVerification.groupBy).toHaveBeenCalledWith({
                    by: ['rfidCardId'],
                    where: {
                        verifiedAt: {
                            gte: new Date('2024-01-01'),
                            lte: new Date('2024-12-31')
                        }
                    },
                    _count: { id: true },
                    _min: { verifiedAt: true },
                    _max: { verifiedAt: true }
                });
            });
            it('should handle analytics errors gracefully', async () => {
                MockedDatabaseService.client.deliveryVerification.groupBy.mockRejectedValue(new Error('Analytics error'));
                const result = await rfid_service_1.RfidService.getInstance().getCardAnalytics(analyticsQuery);
                expect(result.success).toBe(false);
                expect(result.error?.code).toBe('ANALYTICS_FAILED');
                expect(logger_1.logger.error).toHaveBeenCalledWith('Failed to get card analytics', expect.any(Error), { query: analyticsQuery });
            });
        });
    });
    describe('Private Helper Methods', () => {
        describe('Card number validation', () => {
            it('should validate valid card numbers', () => {
                const validNumbers = [
                    'ABCD1234',
                    'RFID12345678',
                    'A1B2C3D4E5F6',
                    'TEST12345'
                ];
                validNumbers.forEach(cardNumber => {
                    const isValid = rfid_service_1.RfidService.isValidCardNumber(cardNumber);
                    expect(isValid).toBe(true);
                });
            });
            it('should reject invalid card numbers', () => {
                const invalidNumbers = [
                    '123',
                    'abcd1234',
                    'CARD-123',
                    'VERYLONGCARDNUMBER123456789',
                    '',
                    'CARD 123'
                ];
                invalidNumbers.forEach(cardNumber => {
                    const isValid = rfid_service_1.RfidService.isValidCardNumber(cardNumber);
                    expect(isValid).toBe(false);
                });
            });
        });
        describe('Signal quality assessment', () => {
            it('should assess signal quality correctly', () => {
                expect(rfid_service_1.RfidService.assessSignalQuality(85, 400)).toBe('excellent');
                expect(rfid_service_1.RfidService.assessSignalQuality(70, 800)).toBe('good');
                expect(rfid_service_1.RfidService.assessSignalQuality(50, 1500)).toBe('fair');
                expect(rfid_service_1.RfidService.assessSignalQuality(30, 3000)).toBe('poor');
                expect(rfid_service_1.RfidService.assessSignalQuality(90, 2500)).toBe('poor');
                expect(rfid_service_1.RfidService.assessSignalQuality(20, 200)).toBe('poor');
            });
        });
    });
    describe('Cache Management', () => {
        beforeEach(() => {
            cache_1.cache.get.mockResolvedValue(null);
            cache_1.cache.setex.mockResolvedValue('OK');
            cache_1.cache.del.mockResolvedValue(1);
        });
        it('should cache and retrieve reader data', async () => {
            MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(mockRFIDReader);
            const reader1 = await rfid_service_1.RfidService.getReaderById('reader-123');
            expect(MockedDatabaseService.client.rFIDReader.findUnique).toHaveBeenCalledWith({
                where: { id: 'reader-123' }
            });
            expect(cache_1.cache.setex).toHaveBeenCalledWith('rfid_reader:reader-123', 600, JSON.stringify(mockRFIDReader));
            expect(reader1).toEqual(mockRFIDReader);
            cache_1.cache.get.mockResolvedValue(JSON.stringify(mockRFIDReader));
            jest.clearAllMocks();
            const reader2 = await rfid_service_1.RfidService.getReaderById('reader-123');
            expect(MockedDatabaseService.client.rFIDReader.findUnique).not.toHaveBeenCalled();
            const expectedReader = JSON.parse(JSON.stringify(mockRFIDReader));
            expect(reader2).toEqual(expectedReader);
        });
        it('should cache and retrieve card data', async () => {
            MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
            const card1 = await rfid_service_1.RfidService.getCardByNumber('RFID12345678');
            expect(MockedDatabaseService.client.rFIDCard.findUnique).toHaveBeenCalledWith({
                where: { cardNumber: 'RFID12345678' },
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
            });
            expect(cache_1.cache.setex).toHaveBeenCalledWith('rfid_card:RFID12345678', 600, JSON.stringify(mockRFIDCard));
            expect(card1).toEqual(mockRFIDCard);
            cache_1.cache.get.mockResolvedValue(JSON.stringify(mockRFIDCard));
            jest.clearAllMocks();
            const card2 = await rfid_service_1.RfidService.getCardByNumber('RFID12345678');
            expect(MockedDatabaseService.client.rFIDCard.findUnique).not.toHaveBeenCalled();
            const expectedCard = JSON.parse(JSON.stringify(mockRFIDCard));
            expect(card2).toEqual(expectedCard);
        });
        it('should clear card cache on deactivation', async () => {
            MockedDatabaseService.client.rFIDCard.findUnique.mockResolvedValue(mockRFIDCard);
            MockedDatabaseService.client.rFIDCard.update.mockResolvedValue({ ...mockRFIDCard, isActive: false });
            await rfid_service_1.RfidService.getInstance().deactivateCard('card-id-123', 'Test reason');
            expect(cache_1.cache.del).toHaveBeenCalledWith('rfid_card:RFID12345678');
        });
        it('should clear reader cache on status update', async () => {
            MockedDatabaseService.client.rFIDReader.findUnique.mockResolvedValue(mockRFIDReader);
            MockedDatabaseService.client.rFIDReader.update.mockResolvedValue({ ...mockRFIDReader, status: 'offline' });
            await rfid_service_1.RfidService.getInstance().updateReaderStatus({ readerId: 'reader-123', status: 'offline' });
            expect(cache_1.cache.del).toHaveBeenCalledWith('rfid_reader:reader-123');
        });
    });
});
//# sourceMappingURL=rfid.service.test.js.map