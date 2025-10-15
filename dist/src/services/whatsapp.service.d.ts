export type WhatsAppMessageType = 'text' | 'template' | 'media' | 'interactive' | 'location';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type TemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
export type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
export interface WhatsAppTemplate {
    name: string;
    language: string;
    components?: Array<{
        type: TemplateComponentType;
        parameters?: Array<{
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
        }>;
        sub_type?: 'quick_reply' | 'url' | 'phone_number';
        index?: number;
        buttons?: Array<{
            type: ButtonType;
            text: string;
            url?: string;
            phone_number?: string;
        }>;
    }>;
}
export interface WhatsAppMessageRequest {
    messaging_product: 'whatsapp';
    recipient_type?: 'individual';
    to: string;
    type: WhatsAppMessageType;
    text?: {
        preview_url?: boolean;
        body: string;
    };
    template?: WhatsAppTemplate;
    image?: {
        link?: string;
        id?: string;
        caption?: string;
    };
    audio?: {
        link?: string;
        id?: string;
    };
    video?: {
        link?: string;
        id?: string;
        caption?: string;
    };
    document?: {
        link?: string;
        id?: string;
        caption?: string;
        filename?: string;
    };
    location?: {
        longitude: number;
        latitude: number;
        name?: string;
        address?: string;
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
                title?: string;
                rows: Array<{
                    id: string;
                    title: string;
                    description?: string;
                }>;
            }>;
        };
    };
    context?: {
        message_id: string;
    };
    biz_opaque_callback_data?: string;
}
export interface WhatsAppMessage {
    id: string;
    to: string;
    type: WhatsAppMessageType;
    status: WhatsAppMessageStatus;
    template?: WhatsAppTemplate;
    content?: string;
    mediaUrl?: string;
    timestamp: Date;
    deliveredAt?: Date;
    readAt?: Date;
    errorMessage?: string;
    retryCount: number;
    businessData?: Record<string, unknown>;
    context?: {
        messageId?: string;
        from?: string;
        conversationId?: string;
    };
}
export interface WhatsAppWebhookEvent {
    object: 'whatsapp_business_account';
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: 'whatsapp';
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
                    text?: {
                        body: string;
                    };
                    type: string;
                    context?: {
                        from: string;
                        id: string;
                    };
                }>;
                statuses?: Array<{
                    id: string;
                    status: WhatsAppMessageStatus;
                    timestamp: string;
                    recipient_id: string;
                    conversation?: {
                        id: string;
                        expiration_timestamp?: string;
                        origin?: {
                            type: string;
                        };
                    };
                    pricing?: {
                        billable: boolean;
                        pricing_model: string;
                        category: string;
                    };
                    errors?: Array<{
                        code: number;
                        title: string;
                        message?: string;
                        error_data?: {
                            details: string;
                        };
                    }>;
                }>;
            };
            field: string;
        }>;
    }>;
}
export interface WhatsAppApiResponse {
    messaging_product: 'whatsapp';
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
        message_status?: WhatsAppMessageStatus;
    }>;
}
export interface WhatsAppServiceConfig {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken: string;
    webhookUrl: string;
    apiVersion: string;
    baseUrl: string;
    retryCount: number;
    retryDelay: number;
    rateLimitPerMinute: number;
}
export interface MessageDeliveryMetrics {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
    averageDeliveryTime: number;
    failureReasons: Record<string, number>;
}
export declare class WhatsAppService {
    private static instance;
    private client;
    private prisma;
    private redisService;
    private accessToken;
    private phoneNumberId;
    private businessAccountId;
    private rateLimitKey;
    private messageQueue;
    private constructor();
    static getInstance(): WhatsAppService;
    private setupInterceptors;
    private checkRateLimit;
    sendMessage(to: string, type: WhatsAppMessageType, content: any, options?: {
        template?: WhatsAppTemplate;
        context?: {
            messageId: string;
        };
        businessData?: Record<string, unknown>;
    }): Promise<WhatsAppMessage>;
    sendTextMessage(to: string, text: string, options?: {
        previewUrl?: boolean;
        context?: {
            messageId: string;
        };
    }): Promise<WhatsAppMessage>;
    sendTemplateMessage(to: string, template: WhatsAppTemplate, businessData?: Record<string, any>): Promise<WhatsAppMessage>;
    sendMediaMessage(to: string, mediaType: 'image' | 'video' | 'document' | 'audio', mediaUrl: string, options?: {
        caption?: string;
        filename?: string;
    }): Promise<WhatsAppMessage>;
    sendInteractiveMessage(to: string, body: string, buttons: Array<{
        id: string;
        title: string;
    }>, options?: {
        header?: string;
        footer?: string;
    }): Promise<WhatsAppMessage>;
    private buildMessageContent;
    private normalizePhoneNumber;
    private storeMessage;
    private queueMessageForTracking;
    handleWebhook(event: WhatsAppWebhookEvent): Promise<void>;
    private processMessageChanges;
    private updateMessageStatus;
    private processIncomingMessage;
    private triggerAutomatedResponse;
    getMessageTemplates(): Promise<any[]>;
    getDeliveryMetrics(startDate: Date, endDate: Date): Promise<MessageDeliveryMetrics>;
    verifyWebhookSignature(body: string, signature: string): boolean;
    handleWebhookVerification(mode: string, token: string, challenge: string): string | null;
    getConfiguration(): WhatsAppServiceConfig;
}
export default WhatsAppService;
//# sourceMappingURL=whatsapp.service.d.ts.map