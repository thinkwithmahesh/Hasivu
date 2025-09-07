/// <reference types="node" />
/// <reference types="node" />
export type WhatsAppMessageType = 'text' | 'template' | 'media' | 'interactive' | 'location' | 'contacts';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
export type WhatsAppMediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';
export type WhatsAppTemplateComponentType = 'header' | 'body' | 'footer' | 'button';
export interface WhatsAppTemplateParameter {
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
}
export interface WhatsAppTemplateComponent {
    type: WhatsAppTemplateComponentType;
    parameters?: WhatsAppTemplateParameter[];
    sub_type?: 'quick_reply' | 'url' | 'phone_number';
    index?: number;
}
export interface WhatsAppTemplate {
    name: string;
    language: {
        code: string;
    };
    components?: WhatsAppTemplateComponent[];
}
export interface WhatsAppMedia {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
}
export interface WhatsAppInteractiveButton {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
}
export interface WhatsAppInteractiveRow {
    id: string;
    title: string;
    description?: string;
}
export interface WhatsAppInteractiveSection {
    title?: string;
    rows: WhatsAppInteractiveRow[];
}
export interface WhatsAppInteractive {
    type: 'button' | 'list';
    header?: {
        type: 'text' | 'image' | 'video' | 'document';
        text?: string;
        image?: WhatsAppMedia;
        video?: WhatsAppMedia;
        document?: WhatsAppMedia;
    };
    body: {
        text: string;
    };
    footer?: {
        text: string;
    };
    action: {
        buttons?: WhatsAppInteractiveButton[];
        button?: string;
        sections?: WhatsAppInteractiveSection[];
    };
}
export interface WhatsAppLocation {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
}
export interface WhatsAppContact {
    name: {
        formatted_name: string;
        first_name?: string;
        last_name?: string;
    };
    phones?: Array<{
        phone: string;
        type?: string;
        wa_id?: string;
    }>;
    emails?: Array<{
        email: string;
        type?: string;
    }>;
    org?: {
        company?: string;
        department?: string;
        title?: string;
    };
    urls?: Array<{
        url: string;
        type?: string;
    }>;
}
export interface WhatsAppMessageRequest {
    messaging_product: 'whatsapp';
    recipient_type?: 'individual' | 'group';
    to: string;
    type: WhatsAppMessageType;
    text?: {
        preview_url?: boolean;
        body: string;
    };
    template?: WhatsAppTemplate;
    image?: WhatsAppMedia;
    video?: WhatsAppMedia;
    audio?: WhatsAppMedia;
    document?: WhatsAppMedia;
    sticker?: WhatsAppMedia;
    interactive?: WhatsAppInteractive;
    location?: WhatsAppLocation;
    contacts?: WhatsAppContact[];
    context?: {
        message_id: string;
    };
}
export interface WhatsAppMessageResponse {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
        message_status?: WhatsAppMessageStatus;
    }>;
}
export interface WhatsAppWebhookMessage {
    id: string;
    from: string;
    timestamp: string;
    type: WhatsAppMessageType;
    text?: {
        body: string;
    };
    image?: WhatsAppMedia & {
        id: string;
        mime_type: string;
        sha256: string;
    };
    video?: WhatsAppMedia & {
        id: string;
        mime_type: string;
        sha256: string;
    };
    audio?: WhatsAppMedia & {
        id: string;
        mime_type: string;
        sha256: string;
    };
    document?: WhatsAppMedia & {
        id: string;
        mime_type: string;
        sha256: string;
    };
    sticker?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
    location?: WhatsAppLocation;
    contacts?: WhatsAppContact[];
    interactive?: {
        type: string;
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
    context?: {
        from: string;
        id: string;
    };
}
export interface WhatsAppWebhookStatus {
    id: string;
    status: WhatsAppMessageStatus;
    timestamp: string;
    recipient_id: string;
    pricing?: {
        billable: boolean;
        pricing_model: string;
        category: string;
    };
    conversation?: {
        id: string;
        expiration_timestamp?: string;
        origin: {
            type: string;
        };
    };
    errors?: Array<{
        code: number;
        title: string;
        message: string;
        error_data?: {
            details: string;
        };
    }>;
}
export interface WhatsAppWebhookEvent {
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
                messages?: WhatsAppWebhookMessage[];
                statuses?: WhatsAppWebhookStatus[];
            };
            field: string;
        }>;
    }>;
}
export declare class WhatsAppServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly whatsappCode?: number;
    constructor(message: string, code?: string, statusCode?: number, whatsappCode?: number);
}
export declare class WhatsAppService {
    private static instance;
    private readonly client;
    private readonly phoneNumberId;
    private readonly accessToken;
    private readonly webhookVerifyToken;
    private readonly apiVersion;
    private readonly baseUrl;
    private templateCache;
    private templateCacheExpiry;
    private readonly templateCacheDuration;
    private constructor();
    static getInstance(): WhatsAppService;
    sendTextMessage(to: string, text: string, previewUrl?: boolean, contextMessageId?: string): Promise<WhatsAppMessageResponse>;
    sendTemplateMessage(to: string, templateName: string, languageCode?: string, components?: WhatsAppTemplateComponent[]): Promise<WhatsAppMessageResponse>;
    sendMediaMessage(to: string, mediaType: WhatsAppMediaType, media: WhatsAppMedia, caption?: string, contextMessageId?: string): Promise<WhatsAppMessageResponse>;
    sendInteractiveMessage(to: string, interactive: WhatsAppInteractive, contextMessageId?: string): Promise<WhatsAppMessageResponse>;
    sendLocationMessage(to: string, location: WhatsAppLocation, contextMessageId?: string): Promise<WhatsAppMessageResponse>;
    sendContactMessage(to: string, contacts: WhatsAppContact[], contextMessageId?: string): Promise<WhatsAppMessageResponse>;
    uploadMedia(file: Buffer, mimeType: string, filename?: string): Promise<{
        id: string;
    }>;
    getMediaUrl(mediaId: string): Promise<{
        url: string;
        mime_type: string;
        sha256: string;
        file_size: number;
    }>;
    downloadMedia(mediaUrl: string): Promise<Buffer>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    processWebhookEvent(event: WhatsAppWebhookEvent): {
        messages: WhatsAppWebhookMessage[];
        statuses: WhatsAppWebhookStatus[];
    };
    getMessageTemplates(limit?: number): Promise<any[]>;
    private handleError;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: number;
        phoneNumberId: string;
        apiVersion: string;
        templatesCount?: number;
        error?: string;
    }>;
    getServiceInfo(): {
        phoneNumberId: string;
        apiVersion: string;
        baseUrl: string;
        templateCacheSize: number;
        configured: boolean;
    };
    clearTemplateCache(): void;
}
export declare const whatsappService: WhatsAppService;
//# sourceMappingURL=whatsapp.service.d.ts.map