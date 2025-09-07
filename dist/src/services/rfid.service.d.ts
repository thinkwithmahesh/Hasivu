import { RFIDCard, RFIDReader, DeliveryVerification, Order, User } from '@prisma/client';
export interface RegisterRFIDCardInput {
    cardNumber: string;
    studentId: string;
    schoolId: string;
    cardType: 'student' | 'staff' | 'visitor';
    expiryDate?: Date;
    metadata?: Record<string, any>;
}
export interface RFIDVerificationInput {
    cardNumber: string;
    readerId: string;
    orderId?: string;
    signalStrength?: number;
    readDuration?: number;
    location?: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
export interface RFIDVerificationResult {
    success: boolean;
    cardNumber: string;
    studentId: string;
    studentName: string;
    schoolId: string;
    verificationId: string;
    timestamp: Date;
    location: string;
    readerInfo: {
        id: string;
        name: string;
        location: string;
    };
    orderInfo?: {
        id: string;
        status: string;
        deliveryDate: Date;
    };
    signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export interface UpdateReaderStatusInput {
    readerId: string;
    status: 'online' | 'offline' | 'maintenance';
    location?: string;
    metadata?: Record<string, any>;
}
export interface VerificationHistoryQuery {
    cardNumber?: string;
    studentId?: string;
    schoolId?: string;
    readerId?: string;
    orderId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export interface BulkCardRegistrationInput {
    cards: Array<{
        cardNumber: string;
        studentId: string;
        cardType: 'student' | 'staff' | 'visitor';
        expiryDate?: Date;
    }>;
    schoolId: string;
}
export interface CardAnalyticsQuery {
    schoolId?: string;
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
}
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
}
export interface RFIDCardWithUser extends RFIDCard {
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'schoolId'>;
}
export interface DeliveryVerificationWithIncludes extends DeliveryVerification {
    rfidCard: RFIDCardWithUser;
    rfidReader: RFIDReader;
    order?: Order;
}
export declare class RFIDService {
    private static readonly CACHE_TTL;
    private static readonly VERIFICATION_CACHE_TTL;
    private static readonly MAX_SIGNAL_STRENGTH;
    private static readonly MIN_SIGNAL_STRENGTH;
    private static readonly CARD_EXPIRY_WARNING_DAYS;
    private static verificationCache;
    static registerCard(input: RegisterRFIDCardInput): Promise<ServiceResponse<RFIDCard>>;
    static verifyDelivery(input: RFIDVerificationInput): Promise<ServiceResponse<RFIDVerificationResult>>;
    static updateReaderStatus(input: UpdateReaderStatusInput): Promise<ServiceResponse<RFIDReader>>;
    static getVerificationHistory(query: VerificationHistoryQuery): Promise<ServiceResponse<{
        verifications: DeliveryVerificationWithIncludes[];
        pagination: any;
    }>>;
    static deactivateCard(cardId: string, reason: string): Promise<ServiceResponse<RFIDCard>>;
    static bulkRegisterCards(input: BulkCardRegistrationInput): Promise<ServiceResponse<{
        successful: RFIDCard[];
        failed: any[];
    }>>;
    static getCardAnalytics(query: CardAnalyticsQuery): Promise<ServiceResponse<any>>;
    private static getReaderById;
    private static getCardByNumber;
    private static cacheCardData;
    private static clearCardCache;
    private static updateCardLastUsed;
    private static isValidCardNumber;
    private static assessSignalQuality;
    createCard(input: RegisterRFIDCardInput): Promise<ServiceResponse<RFIDCard>>;
}
export declare const rfidService: RFIDService;
//# sourceMappingURL=rfid.service.d.ts.map