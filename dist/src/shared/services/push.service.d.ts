export interface PushMessagePayload {
    title: string;
    body: string;
    data?: Record<string, string>;
    image?: string;
    icon?: string;
    badge?: string;
    sound?: string;
    clickAction?: string;
    tag?: string;
}
export interface DeviceTokenRegistration {
    userId: string;
    deviceToken: string;
    platform: 'ios' | 'android' | 'web';
    deviceId: string;
    appVersion?: string;
    osVersion?: string;
    lastActive: number;
    tags?: string[];
}
export interface PushNotificationTemplate {
    id: string;
    name: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    image?: string;
    sound?: string;
    badge?: string;
    category?: string;
    variables?: string[];
    defaultLanguage: string;
    translations?: Record<string, {
        title: string;
        body: string;
    }>;
}
export interface BatchPushRequest {
    deviceTokens: string[];
    payload: PushMessagePayload;
    templateId?: string;
    templateVariables?: Record<string, string>;
    scheduleTime?: number;
    priority?: 'normal' | 'high';
    ttl?: number;
}
export interface TopicPushRequest {
    topic: string;
    payload: PushMessagePayload;
    condition?: string;
    templateId?: string;
    templateVariables?: Record<string, string>;
    scheduleTime?: number;
    priority?: 'normal' | 'high';
}
export interface PushNotificationResult {
    messageId?: string;
    success: boolean;
    error?: string;
    deviceToken?: string;
    timestamp: number;
    retryable?: boolean;
}
export interface BatchPushResult {
    successCount: number;
    failureCount: number;
    results: PushNotificationResult[];
    invalidTokens: string[];
    retryableTokens: string[];
}
export declare class PushServiceError extends Error {
    readonly code: string;
    readonly retryable: boolean;
    readonly details: any;
    constructor(message: string, code?: string, retryable?: boolean, details?: any);
}
export declare class PushNotificationService {
    private static instance;
    private app;
    private messaging;
    private readonly deviceTokens;
    private readonly templates;
    private readonly rateLimitMap;
    private readonly maxRateLimit;
    private readonly retryConfig;
    private constructor();
    static getInstance(): PushNotificationService;
    private initializeFirebase;
    private loadDefaultTemplates;
    registerDeviceToken(registration: DeviceTokenRegistration): void;
    unregisterDeviceToken(deviceToken: string): void;
    getUserDeviceTokens(userId: string): string[];
    sendToDevice(deviceToken: string, payload: PushMessagePayload): Promise<PushNotificationResult>;
    sendToMultipleDevices(request: BatchPushRequest): Promise<BatchPushResult>;
    sendToTopic(request: TopicPushRequest): Promise<PushNotificationResult>;
    subscribeToTopic(deviceTokens: string[], topic: string): Promise<void>;
    unsubscribeFromTopic(deviceTokens: string[], topic: string): Promise<void>;
    private applyTemplate;
    private isRetryableError;
    private isRateLimited;
    private updateRateLimit;
    private cleanupRateLimits;
    private cleanupExpiredTokens;
    addTemplate(template: PushNotificationTemplate): void;
    getTemplates(): PushNotificationTemplate[];
    getTemplate(templateId: string): PushNotificationTemplate | undefined;
    getStatistics(): {
        registeredDevices: number;
        activeTemplates: number;
        rateLimitEntries: number;
        devicesByPlatform: Record<string, number>;
    };
    healthCheck(): {
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        configuration: {
            firebaseInitialized: boolean;
            messagingConfigured: boolean;
            templatesLoaded: number;
            registeredDevices: number;
        };
        error?: string;
    };
}
export declare const pushNotificationService: PushNotificationService;
//# sourceMappingURL=push.service.d.ts.map