"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intelligentAlertingService = exports.IntelligentAlertingService = void 0;
const aws_sdk_1 = require("aws-sdk");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const pg_1 = require("pg");
class IntelligentAlertingService {
    sns;
    sqs;
    logger;
    dbClient;
    alertConfigurations;
    activeAlerts;
    throttleCounters;
    constructor() {
        this.sns = new aws_sdk_1.SNS({ region: process.env.AWS_REGION });
        this.sqs = new aws_sdk_1.SQS({ region: process.env.AWS_REGION });
        this.dbClient = new pg_1.Client({
            connectionString: process.env.DATABASE_URL
        });
        this.logger = logger_1.Logger.getInstance();
        this.alertConfigurations = new Map();
        this.activeAlerts = new Map();
        this.throttleCounters = new Map();
        this.initializeAlertConfigurations();
    }
    initializeAlertConfigurations() {
        this.alertConfigurations.set('system-critical', {
            channels: [
                {
                    type: 'email',
                    enabled: true,
                    priority: 1,
                    config: { recipients: ['admin@hasivu.com', 'ops@hasivu.com'] }
                },
                {
                    type: 'sms',
                    enabled: true,
                    priority: 2,
                    config: { phoneNumbers: ['+1234567890'] }
                },
                {
                    type: 'slack',
                    enabled: !!process.env.SLACK_WEBHOOK_URL_CRITICAL,
                    priority: 3,
                    config: {
                        webhookUrl: process.env.SLACK_WEBHOOK_URL_CRITICAL,
                        channel: '#critical-alerts'
                    }
                }
            ],
            escalationRules: [
                {
                    delay: 15,
                    channels: [
                        {
                            type: 'email',
                            enabled: true,
                            priority: 1,
                            config: { level: 'escalated', recipients: ['cto@hasivu.com'] }
                        }
                    ],
                    condition: 'unacknowledged'
                }
            ],
            throttling: {
                windowSize: 60,
                maxAlerts: 10,
                conditions: [
                    'same_type_and_source'
                ]
            },
            conditions: [
                {
                    field: 'severity',
                    operator: 'equals',
                    value: 'critical'
                }
            ]
        });
        this.alertConfigurations.set('system-high', {
            channels: [
                {
                    type: 'email',
                    enabled: true,
                    priority: 1,
                    config: { recipients: ['admin@hasivu.com'] }
                },
                {
                    type: 'slack',
                    enabled: !!process.env.SLACK_WEBHOOK_URL,
                    priority: 2,
                    config: {
                        webhookUrl: process.env.SLACK_WEBHOOK_URL,
                        channel: '#alerts'
                    }
                }
            ],
            escalationRules: [
                {
                    delay: 30,
                    channels: [
                        {
                            type: 'email',
                            enabled: true,
                            priority: 1,
                            config: { recipients: ['ops@hasivu.com'] }
                        }
                    ],
                    condition: 'unacknowledged'
                }
            ],
            throttling: {
                windowSize: 30,
                maxAlerts: 5,
                conditions: ['same_type']
            },
            conditions: [
                {
                    field: 'severity',
                    operator: 'equals',
                    value: 'high'
                }
            ]
        });
        this.alertConfigurations.set('security', {
            channels: [
                {
                    type: 'email',
                    enabled: true,
                    priority: 1,
                    config: { recipients: ['security@hasivu.com', 'admin@hasivu.com'] }
                },
                {
                    type: 'slack',
                    enabled: !!process.env.SLACK_WEBHOOK_URL_SECURITY,
                    priority: 2,
                    config: {
                        webhookUrl: process.env.SLACK_WEBHOOK_URL_SECURITY,
                        channel: '#security-alerts'
                    }
                }
            ],
            escalationRules: [
                {
                    delay: 10,
                    channels: [
                        {
                            type: 'email',
                            enabled: true,
                            priority: 1,
                            config: { level: 'security-escalated', recipients: ['ciso@hasivu.com'] }
                        }
                    ],
                    condition: 'unacknowledged'
                }
            ],
            throttling: {
                windowSize: 15,
                maxAlerts: 3,
                conditions: [
                    'same_source_ip'
                ]
            },
            conditions: [
                {
                    field: 'tags',
                    operator: 'contains',
                    value: 'security'
                }
            ]
        });
    }
    async processAlert(alertType, title, message, metadata = {}, tags = []) {
        try {
            this.logger.info(`Processing alert: ${alertType}`, { title, tags });
            const config = this.alertConfigurations.get(alertType);
            if (!config) {
                throw new Error(`Unknown alert type: ${alertType}`);
            }
            const alert = await this.createAlert(alertType, title, message, metadata, tags);
            if (await this.isThrottled(alert)) {
                this.logger.info(`Alert throttled: ${alert.id}`, { type: alertType });
                return alert;
            }
            await this.sendNotifications(alert, config);
            if (config.escalationRules.length > 0) {
                await this.scheduleEscalation(alert, config);
            }
            await this.persistAlert(alert);
            this.logger.info(`Alert processed successfully: ${alert.id}`);
            return alert;
        }
        catch (error) {
            this.logger.error(`Failed to process alert: ${alertType}`, error);
            throw error;
        }
    }
    async sendNotifications(alert, config) {
        const sortedChannels = config.channels.sort((a, b) => a.priority - b.priority);
        for (const channel of sortedChannels) {
            if (!channel.enabled)
                continue;
            try {
                await this.sendChannelNotification(alert, channel);
            }
            catch (error) {
                this.logger.warn(`Notification failed for channel: ${channel.type}`, {
                    alertId: alert.id,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
                });
            }
        }
    }
    async sendChannelNotification(alert, channel) {
        try {
            switch (channel.type) {
                case 'email':
                    await this.sendEmailNotification(alert, channel.config);
                    break;
                case 'slack':
                    await this.sendSlackNotification(alert, channel.config);
                    break;
                case 'sms':
                    await this.sendSMSNotification(alert, channel.config);
                    break;
                case 'webhook':
                    await this.sendWebhookNotification(alert, channel.config);
                    break;
                case 'pagerduty':
                    await this.sendPagerDutyNotification(alert, channel.config);
                    break;
                default:
                    this.logger.error(`Channel notification error: ${channel.type}`, { alertId: alert.id });
                    throw new Error(`Unsupported channel type: ${channel.type}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send ${channel.type} notification`, {
                alertId: alert.id,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            throw error;
        }
    }
    async sendEmailNotification(alert, config) {
        const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
        const body = this.formatEmailBody(alert);
        const params = {
            Source: process.env.EMAIL_FROM_ADDRESS || 'noreply@hasivu.com',
            Destination: {
                ToAddresses: config.recipients
            },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: body },
                    Text: { Data: alert.message }
                }
            }
        };
        await this.sns.publish({
            TopicArn: process.env.SNS_EMAIL_TOPIC_ARN,
            Message: JSON.stringify(params)
        }).promise();
    }
    async sendSlackNotification(alert, config) {
        const payload = {
            channel: config.channel || '#alerts',
            username: 'HASIVU Alert Bot',
            icon_emoji: this.getSeverityEmoji(alert.severity),
            attachments: [
                {
                    color: this.getSeverityColor(alert.severity),
                    title: `${alert.severity.toUpperCase()}: ${alert.title}`,
                    text: alert.message,
                    fields: [
                        { title: 'Alert ID', value: alert.id, short: true },
                        { title: 'Timestamp', value: alert.timestamp.toISOString(), short: true },
                        { title: 'Tags', value: alert.tags.join(', '), short: true }
                    ],
                    footer: 'HASIVU Platform',
                    ts: Math.floor(alert.timestamp.getTime() / 1000)
                }
            ]
        };
        await axios_1.default.post(config.webhookUrl, payload);
    }
    async sendSMSNotification(alert, config) {
        const message = `HASIVU Alert [${alert.severity.toUpperCase()}]: ${alert.title}. Alert ID: ${alert.id}`;
        for (const phoneNumber of config.phoneNumbers) {
            await this.sns.publish({
                PhoneNumber: phoneNumber,
                Message: message
            }).promise();
        }
    }
    async sendWebhookNotification(alert, config) {
        const payload = {
            alert,
            timestamp: new Date().toISOString(),
            source: 'hasivu-platform'
        };
        await (0, axios_1.default)({
            method: config.method || 'POST',
            url: config.url,
            data: payload,
            headers: config.headers || { 'Content-Type': 'application/json' }
        });
    }
    async sendPagerDutyNotification(alert, config) {
        const payload = {
            routing_key: config.integrationKey,
            event_action: 'trigger',
            payload: {
                summary: `${alert.title}`,
                source: 'hasivu-platform',
                severity: alert.severity,
                timestamp: alert.timestamp.toISOString(),
                custom_details: {
                    alert_id: alert.id,
                    message: alert.message,
                    metadata: alert.metadata,
                    tags: alert.tags,
                    dashboard_url: `${process.env.DASHBOARD_URL}/alerts/${alert.id}`
                }
            }
        };
        await axios_1.default.post('https://events.pagerduty.com/v2/enqueue', payload);
    }
    async isThrottled(alert) {
        const config = this.alertConfigurations.get(alert.type);
        if (!config?.throttling)
            return false;
        const currentHour = Math.floor(Date.now() / (1000 * 60 * config.throttling.windowSize));
        const throttleKey = `${alert.type}:${currentHour}`;
        const currentCount = this.throttleCounters.get(throttleKey) || 0;
        if (currentCount >= config.throttling.maxAlerts) {
            return true;
        }
        this.throttleCounters.set(throttleKey, currentCount + 1);
        const oldHour = Math.floor((Date.now() - (1000 * 60 * config.throttling.windowSize * 2)) / (1000 * 60 * config.throttling.windowSize));
        const oldThrottleKey = `${alert.type}:${oldHour}`;
        this.throttleCounters.delete(oldThrottleKey);
        return false;
    }
    async scheduleEscalation(alert, config) {
        for (const rule of config.escalationRules) {
            setTimeout(async () => {
                try {
                    const currentAlert = this.activeAlerts.get(alert.id);
                    if (!currentAlert || currentAlert.status !== 'active') {
                        return;
                    }
                    this.logger.warn(`Escalating alert: ${alert.id}`, { level: rule.delay });
                    await this.escalateAlert(alert, rule);
                }
                catch (error) {
                    this.logger.error(`Failed to escalate alert: ${alert.id}`, error);
                }
            }, rule.delay * 60 * 1000);
        }
    }
    async escalateAlert(alert, rule) {
        alert.escalationLevel++;
        for (const channel of rule.channels) {
            if (channel.enabled) {
                await this.sendChannelNotification(alert, channel);
            }
        }
        await this.updateAlertStatus(alert.id, 'escalated');
    }
    async acknowledgeAlert(alertId, acknowledgedBy) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) {
                throw new Error(`Alert not found: ${alertId}`);
            }
            alert.status = 'acknowledged';
            alert.acknowledgedBy = acknowledgedBy;
            alert.acknowledgedAt = new Date();
            await this.persistAlert(alert);
            this.logger.info(`Alert acknowledged: ${alertId}`, { acknowledgedBy });
        }
        catch (error) {
            this.logger.error(`Failed to acknowledge alert: ${alertId}`, error);
            throw error;
        }
    }
    async resolveAlert(alertId) {
        try {
            const alert = this.activeAlerts.get(alertId);
            if (!alert) {
                throw new Error(`Alert not found: ${alertId}`);
            }
            alert.status = 'resolved';
            alert.resolvedAt = new Date();
            await this.persistAlert(alert);
            this.activeAlerts.delete(alertId);
            this.logger.info(`Alert resolved: ${alertId}`);
        }
        catch (error) {
            this.logger.error(`Failed to resolve alert: ${alertId}`, error);
            throw error;
        }
    }
    async createAlert(type, title, message, metadata, tags) {
        const alert = {
            id: this.generateAlertId(),
            type,
            title,
            message,
            severity: this.determineSeverity(type, metadata, tags),
            timestamp: new Date(),
            metadata,
            tags,
            status: 'active',
            escalationLevel: 0,
            attempts: 0
        };
        this.activeAlerts.set(alert.id, alert);
        return alert;
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    determineSeverity(type, metadata, tags) {
        if (tags.includes('critical') || type.includes('critical'))
            return 'critical';
        if (tags.includes('high') || type.includes('high'))
            return 'high';
        if (tags.includes('medium') || type.includes('medium'))
            return 'medium';
        return 'low';
    }
    createThrottledAlert(title, message) {
        return {
            id: this.generateAlertId(),
            type: 'throttled',
            title: `[THROTTLED] ${title}`,
            message: `Alert throttled: ${message}`,
            severity: 'low',
            timestamp: new Date(),
            metadata: {},
            tags: ['throttled'],
            status: 'active',
            escalationLevel: 0,
            attempts: 0
        };
    }
    async sendEscalationNotification(alert) {
        this.logger.info(`Sending escalation notification for alert: ${alert.id}`);
    }
    async createIncident(alert) {
        this.logger.info(`Creating incident for alert: ${alert.id}`);
    }
    async persistAlert(alert) {
        this.logger.debug(`Persisting alert: ${alert.id}`);
        try {
            await this.dbClient.query(`
        INSERT INTO alerts (id, type, title, message, severity, timestamp, metadata, tags, status, escalation_level, attempts, acknowledged_by, acknowledged_at, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          escalation_level = EXCLUDED.escalation_level,
          attempts = EXCLUDED.attempts,
          acknowledged_by = EXCLUDED.acknowledged_by,
          acknowledged_at = EXCLUDED.acknowledged_at,
          resolved_at = EXCLUDED.resolved_at
      `, [
                alert.id,
                alert.type,
                alert.title,
                alert.message,
                alert.severity,
                alert.timestamp,
                JSON.stringify(alert.metadata),
                JSON.stringify(alert.tags),
                alert.status,
                alert.escalationLevel,
                alert.attempts,
                alert.acknowledgedBy,
                alert.acknowledgedAt,
                alert.resolvedAt
            ]);
        }
        catch (error) {
            this.logger.error('Failed to persist alert to database', { alertId: alert.id, error });
        }
    }
    async updateAlertStatus(alertId, status) {
        try {
            await this.dbClient.query('UPDATE alerts SET status = $1 WHERE id = $2', [status, alertId]);
        }
        catch (error) {
            this.logger.error('Failed to update alert status', { alertId, status, error });
        }
    }
    formatEmailBody(alert) {
        return `
      <h2>HASIVU Platform Alert</h2>
      <p><strong>Title:</strong> ${alert.title}</p>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Alert ID:</strong> ${alert.id}</p>
      <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
      <p><strong>Tags:</strong> ${alert.tags.join(', ')}</p>
      ${Object.keys(alert.metadata).length > 0 ?
            `<p><strong>Metadata:</strong> ${JSON.stringify(alert.metadata, null, 2)}</p>`
            : ''}
    `;
    }
    getSeverityEmoji(severity) {
        const emojis = {
            low: ':information_source:',
            medium: ':warning:',
            high: ':exclamation:',
            critical: ':rotating_light:'
        };
        return emojis[severity];
    }
    getSeverityColor(severity) {
        const colors = {
            low: 'good',
            medium: 'warning',
            high: 'danger',
            critical: '#ff0000'
        };
        return colors[severity];
    }
}
exports.IntelligentAlertingService = IntelligentAlertingService;
exports.intelligentAlertingService = new IntelligentAlertingService();
exports.default = exports.intelligentAlertingService;
//# sourceMappingURL=intelligent-alerting.service.js.map