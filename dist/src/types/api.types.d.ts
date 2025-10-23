/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: ApiError;
    timestamp: string;
    requestId?: string;
    version: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    path?: string;
    timestamp: string;
    requestId?: string;
    validation?: ValidationError[];
}
export interface ValidationError {
    field: string;
    value: any;
    message: string;
    constraint: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
        nextPage?: number;
        previousPage?: number;
    };
}
export interface BulkOperationResponse {
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
    errors: BulkOperationError[];
    results: Record<string, any>[];
    timestamp: string;
}
export interface BulkOperationError {
    index: number;
    id?: string;
    error: ApiError;
}
export interface TokenPayload extends JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    schoolId?: string;
    permissions: string[];
    sessionId: string;
    isRefreshToken?: boolean;
}
export interface AuthRequest {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
    rememberMe?: boolean;
}
export interface AuthResponse {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    permissions: string[];
}
export interface RefreshTokenRequest {
    refreshToken: string;
    deviceInfo?: DeviceInfo;
}
export interface PasswordResetRequest {
    email: string;
    clientUrl?: string;
}
export interface PasswordResetConfirmRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
export interface DeviceInfo {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    platform?: string;
    location?: {
        country?: string;
        city?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
}
export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'staff' | 'canteen_manager' | 'accountant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'deleted';
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    status: UserStatus;
    schoolId?: string;
    schoolName?: string;
    avatar?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: Address;
    preferences: UserPreferences;
    permissions: string[];
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
}
export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    schoolId?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: Address;
    initialPassword?: string;
    sendWelcomeEmail?: boolean;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: Address;
    avatar?: string;
    preferences?: Partial<UserPreferences>;
    metadata?: Record<string, any>;
}
export interface UserPreferences {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    notifications: NotificationPreferences;
    theme: 'light' | 'dark' | 'auto';
    accessibility: AccessibilityPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    inApp: boolean;
    digest: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
        timezone?: string;
    };
}
export interface AccessibilityPreferences {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
}
export interface School {
    id: string;
    name: string;
    code: string;
    type: SchoolType;
    status: SchoolStatus;
    address: Address;
    contact: ContactInfo;
    settings: SchoolSettings;
    subscription: SchoolSubscription;
    stats: SchoolStats;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export type SchoolType = 'primary' | 'secondary' | 'high_school' | 'college' | 'university' | 'mixed';
export type SchoolStatus = 'active' | 'inactive' | 'suspended' | 'trial' | 'expired';
export interface SchoolSettings {
    academicYear: {
        startDate: string;
        endDate: string;
        current: boolean;
    };
    workingDays: string[];
    workingHours: {
        start: string;
        end: string;
    };
    breakTimes: {
        name: string;
        start: string;
        end: string;
    }[];
    canteen: {
        enabled: boolean;
        operatingHours: {
            start: string;
            end: string;
        };
        paymentMethods: PaymentMethodType[];
        advanceOrderDays: number;
    };
    rfid: {
        enabled: boolean;
        attendanceTracking: boolean;
        canteenPayments: boolean;
        accessControl: boolean;
    };
    notifications: {
        channels: NotificationChannel[];
        parentNotifications: boolean;
        staffNotifications: boolean;
        emergencyNotifications: boolean;
    };
}
export interface SchoolSubscription {
    planId: string;
    planName: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    features: string[];
    limits: {
        maxUsers: number;
        maxStudents: number;
        maxStorage: number;
    };
    billing: {
        amount: number;
        currency: string;
        cycle: BillingCycle;
        nextBillingDate: string;
        paymentMethod?: PaymentMethodType;
    };
}
export interface SchoolStats {
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
    totalParents: number;
    activeUsers: number;
    canteenTransactions: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        totalAmount: number;
    };
    attendance: {
        todayPresent: number;
        todayAbsent: number;
        avgAttendanceRate: number;
    };
}
export interface MenuItem {
    id: string;
    name: string;
    description: string;
    category: FoodCategory;
    type: FoodType;
    cuisine: string;
    price: number;
    currency: string;
    images: string[];
    nutrition: NutritionInfo;
    allergens: string[];
    dietary: DietaryInfo;
    availability: ItemAvailability;
    ingredients: string[];
    preparation: {
        time: number;
        instructions?: string;
    };
    tags: string[];
    status: ItemStatus;
    schoolId: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export type FoodCategory = 'appetizer' | 'main_course' | 'side_dish' | 'dessert' | 'beverage' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'salad' | 'soup';
export type FoodType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain';
export type ItemStatus = 'active' | 'inactive' | 'out_of_stock' | 'seasonal' | 'discontinued';
export interface NutritionInfo {
    servingSize: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
}
export interface DietaryInfo {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    jainFood: boolean;
    organic: boolean;
    healthy: boolean;
    spicyLevel: 'mild' | 'medium' | 'hot' | 'very_hot';
}
export interface ItemAvailability {
    enabled: boolean;
    schedule: {
        [day: string]: {
            available: boolean;
            startTime?: string;
            endTime?: string;
            maxQuantity?: number;
        };
    };
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    specialDates?: {
        date: string;
        available: boolean;
        maxQuantity?: number;
    }[];
}
export interface DailyMenu {
    id: string;
    date: string;
    schoolId: string;
    categories: MenuCategory[];
    specialOffers?: SpecialOffer[];
    announcements?: string[];
    totalItems: number;
    status: 'draft' | 'published' | 'archived';
    publishedAt?: string;
    publishedBy?: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface MenuCategory {
    id: string;
    name: string;
    description?: string;
    items: MenuItem[];
    displayOrder: number;
    availability: {
        startTime: string;
        endTime: string;
    };
}
export interface SpecialOffer {
    id: string;
    title: string;
    description: string;
    type: 'discount' | 'combo' | 'free_item' | 'bogo';
    value: number;
    applicableItems: string[];
    conditions: {
        minAmount?: number;
        maxDiscount?: number;
        validFrom: string;
        validTo: string;
    };
    status: 'active' | 'inactive' | 'expired';
}
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    schoolId: string;
    items: OrderItem[];
    pricing: OrderPricing;
    delivery: DeliveryInfo;
    payment: PaymentInfo;
    status: OrderStatus;
    timestamps: OrderTimestamps;
    notes?: string;
    metadata: Record<string, any>;
}
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'refunded' | 'failed';
export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: ItemCustomization[];
    specialInstructions?: string;
    subtotal: number;
}
export interface ItemCustomization {
    name: string;
    option: string;
    additionalPrice: number;
}
export interface OrderPricing {
    subtotal: number;
    taxes: TaxBreakdown[];
    discounts: DiscountApplication[];
    deliveryCharges: number;
    totalAmount: number;
    currency: string;
}
export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}
export interface DiscountApplication {
    type: 'coupon' | 'offer' | 'loyalty' | 'bulk';
    name: string;
    amount: number;
    code?: string;
}
export interface DeliveryInfo {
    type: 'pickup' | 'table_service' | 'classroom_delivery';
    location?: string;
    instructions?: string;
    estimatedTime?: string;
    actualTime?: string;
}
export interface OrderTimestamps {
    ordered: string;
    confirmed?: string;
    preparing?: string;
    ready?: string;
    delivered?: string;
    cancelled?: string;
}
export type PaymentMethodType = 'card' | 'upi' | 'wallet' | 'bank_account' | 'rfid' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'trial' | 'suspended';
export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface PaymentInfo {
    id: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    method: PaymentMethodType;
    gateway?: string;
    gatewayTransactionId?: string;
    status: PaymentStatus;
    initiatedAt: string;
    completedAt?: string;
    failureReason?: string;
    refunds?: RefundInfo[];
    metadata: Record<string, any>;
}
export interface PaymentMethod {
    id: string;
    userId: string;
    type: PaymentMethodType;
    isDefault: boolean;
    details: PaymentMethodDetails;
    status: 'active' | 'inactive' | 'expired';
    createdAt: string;
    updatedAt: string;
}
export interface PaymentMethodDetails {
    card?: {
        last4: string;
        brand: string;
        expiryMonth: number;
        expiryYear: number;
        holderName: string;
    };
    upi?: {
        vpa: string;
        verified: boolean;
    };
    wallet?: {
        provider: string;
        balance?: number;
    };
    bankAccount?: {
        accountNumber: string;
        ifsc: string;
        accountHolder: string;
        verified: boolean;
    };
    rfid?: {
        cardNumber: string;
        balance: number;
        lastRecharge?: string;
    };
}
export interface RefundInfo {
    id: string;
    paymentId: string;
    amount: number;
    reason: string;
    status: RefundStatus;
    initiatedAt: string;
    completedAt?: string;
    gatewayRefundId?: string;
    initiatedBy: string;
}
export interface WalletInfo {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    status: 'active' | 'inactive' | 'frozen';
    transactions: WalletTransaction[];
    limits: {
        dailySpend: number;
        monthlySpend: number;
        maxBalance: number;
    };
    metadata: Record<string, any>;
}
export interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    reference?: string;
    timestamp: string;
    balanceAfter: number;
}
export interface RfidCard {
    id: string;
    cardNumber: string;
    userId: string;
    schoolId: string;
    cardType: RfidCardType;
    status: RfidCardStatus;
    balance: number;
    currency: string;
    features: RfidFeature[];
    limits: RfidLimits;
    transactions: RfidTransaction[];
    issuedAt: string;
    expiresAt?: string;
    lastUsed?: string;
    metadata: Record<string, any>;
}
export type RfidCardType = 'student' | 'staff' | 'visitor' | 'contractor';
export type RfidCardStatus = 'active' | 'inactive' | 'blocked' | 'lost' | 'expired';
export type RfidFeature = 'payment' | 'attendance' | 'access_control' | 'library' | 'transport';
export interface RfidLimits {
    dailySpend: number;
    transactionLimit: number;
    rechargeLimit: number;
}
export interface RfidTransaction {
    id: string;
    cardId: string;
    type: RfidTransactionType;
    amount?: number;
    location: string;
    terminal?: string;
    description: string;
    balanceBefore?: number;
    balanceAfter?: number;
    timestamp: string;
    metadata: Record<string, any>;
}
export type RfidTransactionType = 'payment' | 'recharge' | 'refund' | 'attendance_in' | 'attendance_out' | 'access_granted' | 'access_denied' | 'library_checkout' | 'library_return';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';
export interface NotificationTemplate {
    id: string;
    name: string;
    category: NotificationCategory;
    channels: NotificationChannel[];
    priority: NotificationPriority;
    template: {
        subject?: string;
        title: string;
        body: string;
        action?: {
            text: string;
            url: string;
        };
    };
    variables: string[];
    conditions?: NotificationCondition[];
    scheduling: NotificationScheduling;
    isActive: boolean;
    schoolId?: string;
    createdAt: string;
    updatedAt: string;
}
export type NotificationCategory = 'order' | 'payment' | 'attendance' | 'academic' | 'emergency' | 'promotional' | 'system' | 'reminder' | 'announcement';
export interface NotificationCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
    value: any;
}
export interface NotificationScheduling {
    sendImmediately: boolean;
    scheduledAt?: string;
    frequency?: {
        type: 'once' | 'recurring';
        interval?: 'hourly' | 'daily' | 'weekly' | 'monthly';
        endDate?: string;
    };
    quietHours?: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
}
export interface Notification {
    id: string;
    templateId?: string;
    recipientId: string;
    channels: NotificationChannel[];
    priority: NotificationPriority;
    category: NotificationCategory;
    title: string;
    body: string;
    data?: Record<string, any>;
    action?: {
        text: string;
        url: string;
    };
    status: NotificationStatus;
    attempts: NotificationAttempt[];
    scheduledAt?: string;
    sentAt?: string;
    readAt?: string;
    expiresAt?: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface NotificationAttempt {
    channel: NotificationChannel;
    status: NotificationStatus;
    timestamp: string;
    error?: string;
    response?: any;
}
export type WhatsAppMessageType = 'text' | 'template' | 'media' | 'interactive' | 'location';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export interface WhatsAppMessage {
    id: string;
    type: WhatsAppMessageType;
    to: string;
    from: string;
    content: WhatsAppMessageContent;
    status: WhatsAppMessageStatus;
    timestamp: string;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
    metadata: Record<string, any>;
}
export interface WhatsAppMessageContent {
    text?: {
        body: string;
        previewUrl?: boolean;
    };
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: WhatsAppTemplateComponent[];
    };
    media?: {
        type: 'image' | 'video' | 'document' | 'audio';
        url: string;
        caption?: string;
        filename?: string;
    };
    interactive?: {
        type: 'button' | 'list';
        header?: {
            type: 'text' | 'image' | 'video' | 'document';
            text?: string;
            image?: {
                link: string;
            };
            video?: {
                link: string;
            };
            document?: {
                link: string;
                filename?: string;
            };
        };
        body: {
            text: string;
        };
        footer?: {
            text: string;
        };
        action: {
            buttons?: Array<{
                type: 'reply';
                reply: {
                    id: string;
                    title: string;
                };
            }>;
            button?: string;
            sections?: Array<{
                title: string;
                rows: Array<{
                    id: string;
                    title: string;
                    description?: string;
                }>;
            }>;
        };
    };
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
}
export interface WhatsAppTemplateComponent {
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: WhatsAppTemplateParameter[];
}
export interface WhatsAppTemplateParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    date_time?: {
        fallback_value: string;
    };
    image?: {
        link: string;
    };
    document?: {
        link: string;
        filename?: string;
    };
    video?: {
        link: string;
    };
}
export interface WhatsAppWebhookPayload {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: {
                        body: string;
                    };
                    interactive?: any;
                    location?: any;
                    image?: any;
                    video?: any;
                    audio?: any;
                    document?: any;
                }>;
                statuses?: Array<{
                    id: string;
                    status: WhatsAppMessageStatus;
                    timestamp: string;
                    recipient_id: string;
                    pricing?: {
                        billable: boolean;
                        pricing_model: string;
                        category: string;
                    };
                }>;
            };
            field: string;
        }>;
    }>;
}
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    system: SystemMetrics;
    services: ServiceHealthCheck[];
    alerts: Alert[];
    recommendations: Recommendation[];
}
export interface SystemMetrics {
    cpu: {
        usage: number;
        cores: number;
        load: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        usage: number;
    };
    process: {
        pid: number;
        uptime: number;
        memoryUsage: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
    };
}
export interface ServiceHealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastCheck: string;
    details?: Record<string, any>;
    error?: string;
}
export interface Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    source: string;
    timestamp: string;
    resolved: boolean;
    resolvedAt?: string;
    metadata: Record<string, any>;
}
export type AlertType = 'system' | 'database' | 'api' | 'payment' | 'security' | 'performance' | 'storage' | 'network';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface Recommendation {
    id: string;
    type: 'performance' | 'security' | 'maintenance' | 'optimization';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action?: string;
    estimatedImpact: string;
    timestamp: string;
}
export interface PerformanceMetrics {
    api: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        requestsPerSecond: number;
        errorRate: number;
    };
    database: {
        connections: {
            active: number;
            idle: number;
            total: number;
        };
        queryPerformance: {
            averageTime: number;
            slowestQuery: number;
            totalQueries: number;
        };
        replication: {
            lag: number;
            status: 'healthy' | 'lagging' | 'disconnected';
        };
    };
    cache: {
        redis: {
            memoryUsage: number;
            hitRate: number;
            missRate: number;
            connections: number;
        };
    };
    externalServices: Record<string, {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;
        uptime: number;
    }>;
}
export interface BusinessMetrics {
    users: {
        total: number;
        active: number;
        new: number;
        retention: number;
    };
    schools: {
        total: number;
        active: number;
        trial: number;
        churned: number;
    };
    orders: {
        total: number;
        successful: number;
        failed: number;
        averageValue: number;
        revenue: number;
    };
    payments: {
        total: number;
        successful: number;
        failed: number;
        totalAmount: number;
        averageAmount: number;
    };
    rfid: {
        totalCards: number;
        activeCards: number;
        totalTransactions: number;
        totalValue: number;
    };
    notifications: {
        sent: number;
        delivered: number;
        failed: number;
        deliveryRate: number;
    };
}
export interface Address {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
export interface ContactInfo {
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
    socialMedia?: {
        platform: string;
        handle: string;
    }[];
}
export interface FileUpload {
    id: string;
    originalName: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    metadata: Record<string, any>;
    uploadedBy: string;
    uploadedAt: string;
}
export interface AuditLog {
    id: string;
    entity: string;
    entityId: string;
    action: string;
    userId: string;
    changes?: {
        before: Record<string, any>;
        after: Record<string, any>;
    };
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
    school?: School;
    permissions?: string[];
    requestId?: string;
    startTime?: number;
}
export interface ApiResponseObject extends Response {
    sendSuccess: <T>(data?: T, message?: string) => Response;
    sendError: (error: ApiError | string, statusCode?: number) => Response;
    sendValidationError: (errors: ValidationError[]) => Response;
    sendPaginatedResponse: <T>(data: T[], pagination: any) => Response;
}
export type MiddlewareFunction = (req: AuthenticatedRequest, res: ApiResponseObject, next: NextFunction) => void | Promise<void>;
export type RouteHandler = (req: AuthenticatedRequest, res: ApiResponseObject, next: NextFunction) => void | Promise<void>;
export interface QueryParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
    search?: string;
    include?: string[];
    exclude?: string[];
}
export interface QueryResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
//# sourceMappingURL=api.types.d.ts.map