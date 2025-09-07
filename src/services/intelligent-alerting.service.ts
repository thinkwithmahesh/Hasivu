/**
 * HASIVU Platform - Intelligent Alerting & Notification Service
 * Multi-channel alerting system with smart routing, escalation procedures,
 * and intelligent alert aggregation to reduce noise and improve response times.
 * @author HASIVU Development Team
 * @version 2.0.0
 * @since 2024
 */

import { SNS, SQS } from 'aws-sdk';
import axios from 'axios';
import { Logger } from '../utils/logger';
import { Client } from 'pg';

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
  delay: number; // in minutes
  channels: NotificationChannel[];
  condition: 'unacknowledged' | 'unresolved';
}

export interface ThrottlingRule {
  windowSize: number; // in minutes
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

/**
 * Intelligent Alerting Service
 * Provides multi-channel alerting with smart routing and escalation
 */
export class IntelligentAlertingService {
  private sns: SNS;
  private sqs: SQS;
  private logger: Logger;
  private dbClient: Client;
  private alertConfigurations: Map<string, AlertConfiguration>;
  private activeAlerts: Map<string, Alert>;
  private throttleCounters: Map<string, number>;

  constructor() {
    this.sns = new SNS({ region: process.env.AWS_REGION });
    this.sqs = new SQS({ region: process.env.AWS_REGION });
    this.dbClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    this.logger = Logger.getInstance();
    this.alertConfigurations = new Map();
    this.activeAlerts = new Map();
    this.throttleCounters = new Map();
    this.initializeAlertConfigurations();
  }

  /**
   * Initialize default alert configurations
   */
  private initializeAlertConfigurations(): void {
    // Critical system alerts
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
          delay: 15, // 15 minutes
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
        windowSize: 60, // 1 hour
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

    // High priority alerts
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
          delay: 30, // 30 minutes
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

    // Security alerts
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
          delay: 10, // 10 minutes for security
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

  /**
   * Process and send alert through intelligent routing
   */
  async processAlert(
    alertType: string,
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    tags: string[] = []
  ): Promise<Alert> {
    try {
      this.logger.info(`Processing alert: ${alertType}`, { title, tags });

      const config = this.alertConfigurations.get(alertType);
      if (!config) {
        throw new Error(`Unknown alert type: ${alertType}`);
      }

      const alert = await this.createAlert(alertType, title, message, metadata, tags);
      
      // Check throttling
      if (await this.isThrottled(alert)) {
        this.logger.info(`Alert throttled: ${alert.id}`, { type: alertType });
        return alert;
      }

      // Send notifications
      await this.sendNotifications(alert, config);
      
      // Schedule escalation if needed
      if (config.escalationRules.length > 0) {
        await this.scheduleEscalation(alert, config);
      }

      // Store alert
      await this.persistAlert(alert);
      
      this.logger.info(`Alert processed successfully: ${alert.id}`);
      return alert;

    } catch (error) {
      this.logger.error(`Failed to process alert: ${alertType}`, error);
      throw error;
    }
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: Alert, config: AlertConfiguration): Promise<void> {
    const sortedChannels = config.channels.sort((a, b) => a.priority - b.priority);

    for (const channel of sortedChannels) {
      if (!channel.enabled) continue;

      try {
        await this.sendChannelNotification(alert, channel);
      } catch (error) {
        this.logger.warn(`Notification failed for channel: ${channel.type}`, { 
          alertId: alert.id, 
          error: error.message 
        });
        // Continue with other channels
      }
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendChannelNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to send ${channel.type} notification`, { 
        alertId: alert.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, config: any): Promise<void> {
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

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, config: any): Promise<void> {
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

    await axios.post(config.webhookUrl, payload);
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert, config: any): Promise<void> {
    const message = `HASIVU Alert [${alert.severity.toUpperCase()}]: ${alert.title}. Alert ID: ${alert.id}`;

    for (const phoneNumber of config.phoneNumbers) {
      await this.sns.publish({
        PhoneNumber: phoneNumber,
        Message: message
      }).promise();
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, config: any): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'hasivu-platform'
    };

    await axios({
      method: config.method || 'POST',
      url: config.url,
      data: payload,
      headers: config.headers || { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert, config: any): Promise<void> {
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

    await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
  }

  /**
   * Check if alert should be throttled
   */
  private async isThrottled(alert: Alert): Promise<boolean> {
    const config = this.alertConfigurations.get(alert.type);
    if (!config?.throttling) return false;

    const currentHour = Math.floor(Date.now() / (1000 * 60 * config.throttling.windowSize));
    const throttleKey = `${alert.type}:${currentHour}`;
    
    const currentCount = this.throttleCounters.get(throttleKey) || 0;
    
    if (currentCount >= config.throttling.maxAlerts) {
      return true;
    }

    this.throttleCounters.set(throttleKey, currentCount + 1);
    
    // Clean old throttle counters
    const oldHour = Math.floor((Date.now() - (1000 * 60 * config.throttling.windowSize * 2)) / (1000 * 60 * config.throttling.windowSize));
    const oldThrottleKey = `${alert.type}:${oldHour}`;
    this.throttleCounters.delete(oldThrottleKey);
    
    return false;
  }

  /**
   * Schedule escalation for alert
   */
  private async scheduleEscalation(alert: Alert, config: AlertConfiguration): Promise<void> {
    for (const rule of config.escalationRules) {
      setTimeout(async () => {
        try {
          const currentAlert = this.activeAlerts.get(alert.id);
          if (!currentAlert || currentAlert.status !== 'active') {
            return; // Alert resolved or acknowledged
          }

          this.logger.warn(`Escalating alert: ${alert.id}`, { level: rule.delay });
          await this.escalateAlert(alert, rule);
        } catch (error) {
          this.logger.error(`Failed to escalate alert: ${alert.id}`, error);
        }
      }, rule.delay * 60 * 1000); // Convert minutes to milliseconds
    }
  }

  /**
   * Escalate alert through higher priority channels
   */
  private async escalateAlert(alert: Alert, rule: EscalationRule): Promise<void> {
    alert.escalationLevel++;
    
    // Send escalation notifications
    for (const channel of rule.channels) {
      if (channel.enabled) {
        await this.sendChannelNotification(alert, channel);
      }
    }

    // Update alert status
    await this.updateAlertStatus(alert.id, 'escalated');
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to acknowledge alert: ${alertId}`, error);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to resolve alert: ${alertId}`, error);
      throw error;
    }
  }

  /**
   * Create alert object
   */
  private async createAlert(
    type: string,
    title: string,
    message: string,
    metadata: Record<string, any>,
    tags: string[]
  ): Promise<Alert> {
    const alert: Alert = {
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

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(type: string, metadata: Record<string, any>, tags: string[]): AlertSeverity {
    if (tags.includes('critical') || type.includes('critical')) return 'critical';
    if (tags.includes('high') || type.includes('high')) return 'high';
    if (tags.includes('medium') || type.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Create throttled alert
   */
  private createThrottledAlert(title: string, message: string): Alert {
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

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(alert: Alert): Promise<void> {
    this.logger.info(`Sending escalation notification for alert: ${alert.id}`);
    // Implementation for escalation notification
  }

  /**
   * Create incident for critical alerts
   */
  private async createIncident(alert: Alert): Promise<void> {
    this.logger.info(`Creating incident for alert: ${alert.id}`);
    // Implementation for incident creation
  }

  /**
   * Persist alert to database
   */
  private async persistAlert(alert: Alert): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to persist alert to database', { alertId: alert.id, error });
      // Don't throw - alert processing should continue even if persistence fails
    }
  }

  /**
   * Update alert status
   */
  private async updateAlertStatus(alertId: string, status: string): Promise<void> {
    try {
      await this.dbClient.query(
        'UPDATE alerts SET status = $1 WHERE id = $2',
        [status, alertId]
      );
    } catch (error) {
      this.logger.error('Failed to update alert status', { alertId, status, error });
    }
  }

  /**
   * Format email body
   */
  private formatEmailBody(alert: Alert): string {
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
        : ''
      }
    `;
  }

  /**
   * Get severity emoji for Slack
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis = {
      low: ':information_source:',
      medium: ':warning:',
      high: ':exclamation:',
      critical: ':rotating_light:'
    };
    return emojis[severity];
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      low: 'good',
      medium: 'warning',
      high: 'danger',
      critical: '#ff0000'
    };
    return colors[severity];
  }
}

// Export singleton instance
export const intelligentAlertingService = new IntelligentAlertingService();
export default intelligentAlertingService;