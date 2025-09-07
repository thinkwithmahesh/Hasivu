export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export interface Alert {
    id: string;
    type: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: Date;
    metadata: Record<string, any>;
    tags: string[];
    status: 'active' | 'acknowledged' | 'resolved';
    escalationLevel: number;
    attempts: number;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
}
export interface NotificationChannel {
    type: 'email' | 'slack' | 'sms' | 'webhook' | 'pagerduty';
    enabled: boolean;
    priority: number;
    config: any;
}
export interface AlertConfiguration {
    channels: NotificationChannel[];
    escalationRules: EscalationRule[];
    throttling: ThrottlingRule;
    conditions: AlertCondition[];
}
export interface EscalationRule {
    delay: number;
    channels: NotificationChannel[];
    condition: 'unacknowledged' | 'unresolved';
}
export interface ThrottlingRule {
    windowSize: number;
    maxAlerts: number;
    conditions: string[];
}
export interface AlertCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
}
export interface NotificationChannelConfig {
    email?: {
        recipients: string[];
        smtpConfig?: any;
    };
    slack?: {
        webhookUrl: string;
        channel: string;
    };
    sms?: {
        phoneNumbers: string[];
        service: 'sns' | 'twilio';
    };
    webhook?: {
        url: string;
        method: 'POST' | 'PUT';
        headers?: Record<string, string>;
    };
    pagerduty?: {
        integrationKey: string;
        serviceKey: string;
    };
}
export declare class IntelligentAlertingService {
    private sns;
    private sqs;
    private logger;
    private dbClient;
    private alertConfigurations;
    private activeAlerts;
    private throttleCounters;
    constructor();
    private initializeAlertConfigurations;
    processAlert(alertType: string, title: string, message: string, metadata?: Record<string, any>, tags?: string[]): Promise<Alert>;
    private sendNotifications;
    private sendChannelNotification;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendSMSNotification;
    private sendWebhookNotification;
    private sendPagerDutyNotification;
    private isThrottled;
    private scheduleEscalation;
    private escalateAlert;
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void>;
    resolveAlert(alertId: string): Promise<void>;
    private createAlert;
    private generateAlertId;
    private determineSeverity;
    private createThrottledAlert;
    private sendEscalationNotification;
    private createIncident;
    private persistAlert;
    private updateAlertStatus;
    private formatEmailBody;
    private getSeverityEmoji;
    private getSeverityColor;
}
export declare const intelligentAlertingService: IntelligentAlertingService;
export default intelligentAlertingService;
//# sourceMappingURL=intelligent-alerting.service.d.ts.map