export interface NutritionalInfo {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    vitamins?: {
        A?: number;
        C?: number;
        D?: number;
        K?: number;
        B1?: number;
        B6?: number;
        B12?: number;
        folate?: number;
        B3?: number;
    };
    minerals?: {
        iron?: number;
        calcium?: number;
        magnesium?: number;
        zinc?: number;
    };
    omega3?: number;
    antioxidants?: string;
    saturatedFat?: number;
    transFat?: number;
    glycemicIndex?: number;
}
export type { AllergenInfo, DietaryRestriction, ComplianceRule, ComplianceResult, StudentDietaryProfile, MenuItemCompliance, NutritionScore, PersonalizedRecommendations, MenuImprovements, SafetyAssessment, BatchAnalysisResult, Ingredient, MenuItem as NutritionMenuItem, NutritionalAnalysis, } from './nutrition';
export type { AppError, ValidationError, NotFoundError, ConflictError, AuthenticationError, AuthorizationError, BusinessLogicError, ExternalServiceError, DatabaseError, RateLimitError, } from '../utils/errors';
export { isOperationalError, getErrorMessage, createErrorResponse } from '../utils/errors';
export type { DatabaseConfig, ConnectionStatus, TransactionOptions, } from '../database/DatabaseManager';
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    meta?: Record<string, any>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface FilterParams extends PaginationParams {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}
export interface UserSession {
    id: string;
    userId: string;
    email: string;
    role: 'PARENT' | 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SCHOOL_ADMIN';
    schoolId?: string;
    permissions: string[];
    expiresAt: Date;
    metadata?: Record<string, any>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}
export interface LoginCredentials {
    email: string;
    password: string;
    schoolId?: string;
    rememberMe?: boolean;
}
export interface School {
    id: string;
    name: string;
    code: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    timezone: string;
    settings: SchoolSettings;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SchoolSettings {
    allowParentRegistration: boolean;
    requireRFIDForDelivery: boolean;
    enableNotifications: boolean;
    menuUpdateFrequency: 'daily' | 'weekly' | 'monthly';
    orderCutoffTime: string;
    deliveryTimeSlots: string[];
    paymentMethods: ('card' | 'upi' | 'wallet')[];
    maxOrdersPerDay: number;
}
export interface MenuItem {
    id: string;
    name: string;
    description: string;
    category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    price: number;
    nutritionInfo: NutritionalInfo;
    allergens: string[];
    dietaryTags: string[];
    imageUrl?: string;
    isAvailable: boolean;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DailyMenu {
    id: string;
    date: Date;
    schoolId: string;
    category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
    items: MenuItem[];
    specialOffers?: SpecialOffer[];
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SpecialOffer {
    id: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed' | 'combo';
    discountValue: number;
    validFrom: Date;
    validUntil: Date;
    applicableItems: string[];
    maxUsage?: number;
    currentUsage: number;
}
export interface Order {
    id: string;
    userId: string;
    childId?: string;
    schoolId: string;
    orderDate: Date;
    deliveryDate: Date;
    items: OrderItem[];
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    deliveryStatus: DeliveryStatus;
    specialInstructions?: string;
    allergyNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface OrderItem {
    id: string;
    menuItemId: string;
    menuItem?: MenuItem;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    customizations?: string[];
    specialRequests?: string;
}
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type DeliveryStatus = 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export interface DeliveryAttempt {
    id: string;
    orderId: string;
    deliveryPersonId: string;
    attemptNumber: number;
    timestamp: Date;
    rfidScanRequired: boolean;
    rfidCardId?: string;
    rfidScanStatus?: 'success' | 'failed' | 'not_required';
    location?: GeolocationCoordinates;
    status: 'success' | 'failed' | 'partial';
    failureReason?: string;
    signature?: string;
    photos?: string[];
    notes?: string;
}
export interface RFIDCard {
    id: string;
    cardNumber: string;
    childId: string;
    schoolId: string;
    isActive: boolean;
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface GeolocationCoordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    orderUpdates: boolean;
    menuUpdates: boolean;
    paymentAlerts: boolean;
    schoolAnnouncements: boolean;
    promotionalOffers: boolean;
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channels: NotificationChannel[];
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: Date;
}
export type NotificationType = 'order_confirmation' | 'order_update' | 'payment_success' | 'payment_failed' | 'delivery_update' | 'menu_update' | 'school_announcement' | 'promotion' | 'system_alert';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export interface AnalyticsReport {
    id: string;
    type: ReportType;
    title: string;
    description: string;
    parameters: Record<string, any>;
    data: any;
    generatedAt: Date;
    generatedBy: string;
    schoolId?: string;
    dateRange: DateRange;
    format: 'json' | 'csv' | 'pdf';
    status: 'generating' | 'completed' | 'failed';
}
export type ReportType = 'sales_summary' | 'menu_popularity' | 'user_engagement' | 'payment_analysis' | 'delivery_performance' | 'nutrition_tracking' | 'custom';
export interface DateRange {
    start: Date;
    end: Date;
}
export interface MetricValue {
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
}
export interface PerformanceMetrics {
    orderVelocity: MetricValue[];
    deliverySuccess: MetricValue[];
    paymentSuccess: MetricValue[];
    userSatisfaction: MetricValue[];
    revenueGrowth: MetricValue[];
}
export interface SystemConfiguration {
    maintenance: {
        enabled: boolean;
        message?: string;
        scheduledStart?: Date;
        scheduledEnd?: Date;
    };
    features: {
        rfidDelivery: boolean;
        nutritionTracking: boolean;
        parentalControls: boolean;
        loyaltyProgram: boolean;
        multiSchoolSupport: boolean;
    };
    limits: {
        maxOrdersPerUser: number;
        maxItemsPerOrder: number;
        orderCutoffHours: number;
        maxFileUploadSize: number;
    };
    integrations: {
        paymentGateway: string;
        smsProvider: string;
        emailProvider: string;
        analyticsProvider: string;
    };
    security: {
        sessionTimeout: number;
        passwordMinLength: number;
        enableTwoFactor: boolean;
        loginAttemptLimit: number;
    };
}
export interface ValidationRule {
    field: string;
    type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
}
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
    placeholder?: string;
    options?: {
        label: string;
        value: any;
    }[];
    validation: ValidationRule[];
    defaultValue?: any;
    disabled?: boolean;
    required?: boolean;
}
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: Date;
    context?: string;
    metadata?: Record<string, any>;
    stackTrace?: string;
}
export type Partial<T> = {
    [P in keyof T]?: T[P];
};
export type Required<T> = {
    [P in keyof T]-?: T[P];
};
export type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export declare const USER_ROLES: readonly ["PARENT", "STUDENT", "TEACHER", "ADMIN", "SCHOOL_ADMIN"];
export declare const ORDER_STATUSES: readonly ["draft", "confirmed", "preparing", "ready", "delivered", "cancelled"];
export declare const PAYMENT_STATUSES: readonly ["pending", "processing", "completed", "failed", "refunded", "partially_refunded"];
export declare const DELIVERY_STATUSES: readonly ["scheduled", "in_transit", "delivered", "failed", "returned"];
export declare const NOTIFICATION_TYPES: readonly ["order_confirmation", "order_update", "payment_success", "payment_failed", "delivery_update", "menu_update", "school_announcement", "promotion", "system_alert"];
export declare const NOTIFICATION_CHANNELS: readonly ["email", "sms", "push", "in_app"];
//# sourceMappingURL=index.d.ts.map