import { RFIDCard, RFIDReader, DeliveryVerification } from '@prisma/client';
export interface RfidCardFilters {
    schoolId?: string;
    studentId?: string;
    cardType?: string;
    isActive?: boolean;
}
export interface CreateRfidCardData {
    cardNumber: string;
    studentId: string;
    schoolId: string;
    cardType?: 'student' | 'staff';
    expiryDate?: Date;
}
export interface VerifyCardResult {
    isValid: boolean;
    card?: RFIDCard;
    student?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface RegisterCardInput {
    cardNumber: string;
    studentId: string;
    schoolId: string;
    cardType?: 'student' | 'staff';
    expiryDate?: Date;
}
export interface VerifyDeliveryInput {
    cardNumber: string;
    readerId?: string;
    orderId?: string;
    signalStrength?: number;
    readDuration?: number;
    location?: string;
    timestamp?: Date;
}
export interface VerifyDeliveryResult {
    success: boolean;
    cardNumber: string;
    studentId: string;
    studentName: string;
    schoolId: string;
    verificationId: string;
    signalQuality: string;
    orderInfo?: {
        orderId: string;
        status: string;
        deliveryDate: Date;
    };
}
export interface UpdateReaderStatusInput {
    readerId: string;
    status?: 'online' | 'offline' | 'maintenance';
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
export interface VerificationHistoryResult {
    verifications: DeliveryVerification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface BulkRegisterResult {
    successful: Array<{
        cardNumber: string;
        cardId: string;
        studentId: string;
    }>;
    failed: Array<{
        cardNumber: string;
        studentId: string;
        error: {
            message: string;
            code: string;
        };
    }>;
}
export interface CardAnalyticsQuery {
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'day' | 'week' | 'month';
}
export interface CardAnalyticsResult {
    totalVerifications: number;
    uniqueCards: number;
    verificationsByCard: Array<{
        cardId: string;
        count: number;
        firstVerification: Date;
        lastVerification: Date;
    }>;
}
export declare class RfidService {
    private static instance;
    private prisma;
    private verificationCache;
    private constructor();
    static getInstance(): RfidService;
    private isValidCardNumber;
    private assessSignalQuality;
    private getReaderById;
    private getCardByNumber;
    registerCard(input: RegisterCardInput): Promise<ServiceResponse<RFIDCard>>;
    verifyDelivery(input: VerifyDeliveryInput): Promise<ServiceResponse<VerifyDeliveryResult>>;
    updateReaderStatus(input: UpdateReaderStatusInput): Promise<ServiceResponse<RFIDReader>>;
    getVerificationHistory(query?: VerificationHistoryQuery): Promise<ServiceResponse<VerificationHistoryResult>>;
    deactivateCard(cardId: string, reason?: string): Promise<ServiceResponse<RFIDCard>>;
    bulkRegisterCards(input: {
        schoolId: string;
        cards: Array<{
            cardNumber: string;
            studentId: string;
            cardType?: 'student' | 'staff';
        }>;
    }): Promise<ServiceResponse<BulkRegisterResult>>;
    getCardAnalytics(query: CardAnalyticsQuery): Promise<ServiceResponse<CardAnalyticsResult>>;
}
export declare const rfidService: RfidService;
export default RfidService;
//# sourceMappingURL=rfid.service.d.ts.map