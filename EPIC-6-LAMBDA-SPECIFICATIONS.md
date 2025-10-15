# Epic 6: Lambda Functions Technical Specifications

## 📋 Epic 6 Lambda Function Architecture

**Total Functions**: 21 Lambda functions across 4 stories  
**Runtime**: Node.js 18.x (ARM64 architecture)  
**Integration**: Extends Epic 5's payment infrastructure  
**Deployment**: Serverless Framework with TypeScript

---

## 🔄 Story 6.1: Multi-Channel Notification Infrastructure (6 Functions)

### 1. notification-orchestrator

**Purpose**: Central routing and channel selection for all notifications  
**Complexity**: High  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/notifications/notification-orchestrator.handler
Events:
  - SNS: communication-notifications-topic
  - HTTP: POST /notifications/send
  - HTTP: POST /notifications/send-bulk
  - Schedule: rate(5 minutes) # Health check and queue processing

Environment Variables:
  FUNCTION_NAME: notification-orchestrator
  USER_PREFERENCES_TABLE: user-notification-preferences-${stage}
  NOTIFICATION_QUEUE_URL: ${cf:hasivu-${stage}-messaging.NotificationQueueUrl}
  ANALYTICS_TOPIC_ARN: ${cf:hasivu-${stage}-messaging.AnalyticsTopicArn}
```

#### Key Features

```typescript
interface NotificationRequest {
  userId: string;
  messageType: 'urgent' | 'important' | 'informational';
  content: {
    subject: string;
    body: string;
    templateId?: string;
    variables?: Record<string, any>;
  };
  channels?: NotificationChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

interface ChannelSelectionStrategy {
  ai_powered: boolean; // ML-based channel selection
  user_preference: boolean; // Respect user channel preferences
  message_urgency: boolean; // Urgency-based channel routing
  fallback_enabled: boolean; // Automatic fallback on failures
}
```

#### Integration Points

- **Epic 5**: Payment event notifications (success, failure, refund)
- **User Preferences**: DynamoDB table for channel preferences
- **Analytics**: Real-time delivery tracking via SNS
- **Template Engine**: Dynamic content rendering

### 2. sms-handler

**Purpose**: SMS delivery via AWS SNS with carrier optimization  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/notifications/sms-handler.handler
Events:
  - SQS: sms-notification-queue
  - HTTP: POST /notifications/sms/send
  - HTTP: GET /notifications/sms/delivery-status/{messageId}

Environment Variables:
  FUNCTION_NAME: sms-handler
  SNS_SMS_ROLE_ARN: ${cf:hasivu-${stage}-iam.SMSDeliveryRoleArn}
  DELIVERY_TRACKING_TABLE: notification-delivery-tracking-${stage}
  DND_REGISTRY_TABLE: dnd-registry-${stage}
```

#### Key Features

```typescript
interface SMSDeliveryRequest {
  phoneNumber: string;
  message: string;
  senderId?: string;
  messageType: 'promotional' | 'transactional';
  templateId?: string;
  variables?: Record<string, any>;
}

interface CarrierOptimization {
  carrier_detection: boolean; // Automatic carrier detection
  route_optimization: boolean; // Best route selection
  delivery_receipt: boolean; // DLR tracking
  cost_optimization: boolean; // Cost-effective routing
}
```

### 3. email-handler

**Purpose**: Email delivery via AWS SES with template management  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 45s

#### Function Specification

```yaml
Handler: src/functions/notifications/email-handler.handler
Events:
  - SQS: email-notification-queue
  - HTTP: POST /notifications/email/send
  - HTTP: POST /notifications/email/send-template
  - HTTP: GET /notifications/email/bounce-list

Environment Variables:
  FUNCTION_NAME: email-handler
  SES_REGION: ${self:provider.region}
  EMAIL_TEMPLATES_BUCKET: hasivu-${stage}-email-templates
  BOUNCE_TRACKING_TABLE: email-bounce-tracking-${stage}
  UNSUBSCRIBE_TABLE: email-unsubscribe-${stage}
```

#### Key Features

```typescript
interface EmailDeliveryRequest {
  recipients: EmailRecipient[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
}

interface EmailTrackingCapabilities {
  open_tracking: boolean; // Email open tracking
  click_tracking: boolean; // Link click tracking
  bounce_handling: boolean; // Bounce and complaint handling
  unsubscribe_handling: boolean; // One-click unsubscribe
}
```

### 4. whatsapp-handler

**Purpose**: WhatsApp Business API integration with template validation  
**Complexity**: High  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/notifications/whatsapp-handler.handler
Events:
  - SQS: whatsapp-notification-queue
  - HTTP: POST /notifications/whatsapp/send
  - HTTP: POST /notifications/whatsapp/send-template
  - HTTP: POST /notifications/whatsapp/webhook
  - HTTP: GET /notifications/whatsapp/templates

Environment Variables:
  FUNCTION_NAME: whatsapp-handler
  WHATSAPP_BUSINESS_API_URL: https://graph.facebook.com/v18.0
  WHATSAPP_ACCESS_TOKEN: ${ssm:/hasivu/${stage}/whatsapp-access-token}
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: ${ssm:/hasivu/${stage}/whatsapp-webhook-token}
  TEMPLATE_CACHE_TABLE: whatsapp-templates-${stage}
```

#### Key Features

```typescript
interface WhatsAppMessageRequest {
  phoneNumber: string;
  messageType: 'text' | 'template' | 'media' | 'interactive';
  content: WhatsAppContent;
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: string[];
}

interface WhatsAppTemplateValidation {
  template_approval_status: boolean; // Check template approval
  parameter_validation: boolean; // Validate template parameters
  rate_limit_check: boolean; // WhatsApp API rate limits
  business_verification: boolean; // Business account verification
}
```

### 5. push-notification-handler

**Purpose**: Mobile push notifications via Firebase/APNS  
**Complexity**: High  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/notifications/push-notification-handler.handler
Events:
  - SQS: push-notification-queue
  - HTTP: POST /notifications/push/send
  - HTTP: POST /notifications/push/send-topic
  - HTTP: PUT /notifications/push/device-token

Environment Variables:
  FUNCTION_NAME: push-notification-handler
  FIREBASE_SERVICE_ACCOUNT: ${ssm:/hasivu/${stage}/firebase-service-account~true}
  APNS_KEY_ID: ${ssm:/hasivu/${stage}/apns-key-id}
  APNS_TEAM_ID: ${ssm:/hasivu/${stage}/apns-team-id}
  DEVICE_TOKENS_TABLE: push-device-tokens-${stage}
```

#### Key Features

```typescript
interface PushNotificationRequest {
  deviceTokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
  actionButtons?: PushActionButton[];
}

interface PushNotificationCapabilities {
  rich_notifications: boolean; // Images and media
  action_buttons: boolean; // Interactive notifications
  scheduled_delivery: boolean; // Time-based delivery
  geofencing: boolean; // Location-based notifications
}
```

### 6. notification-status-tracker

**Purpose**: Delivery status monitoring and retry management  
**Complexity**: Medium  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/notifications/notification-status-tracker.handler
Events:
  - DynamoDB Stream: notification-delivery-tracking-${stage}
  - SNS: delivery-status-updates-topic
  - Schedule: rate(15 minutes) # Retry failed notifications
  - HTTP: GET /notifications/status/{notificationId}

Environment Variables:
  FUNCTION_NAME: notification-status-tracker
  RETRY_QUEUE_URL: ${cf:hasivu-${stage}-messaging.RetryQueueUrl}
  DEAD_LETTER_QUEUE_URL: ${cf:hasivu-${stage}-messaging.DeadLetterQueueUrl}
  MAX_RETRY_ATTEMPTS: 3
  RETRY_DELAY_MINUTES: 15
```

---

## 🔄 Story 6.2: Real-Time Communication Hub (5 Functions)

### 7. websocket-connection-manager

**Purpose**: WebSocket connection lifecycle management  
**Complexity**: High  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/realtime/websocket-connection-manager.handler
Events:
  - WebSocket: $connect
  - WebSocket: $disconnect
  - WebSocket: $default
  - HTTP: POST /realtime/connections/{connectionId}/send

Environment Variables:
  FUNCTION_NAME: websocket-connection-manager
  WEBSOCKET_CONNECTIONS_TABLE: websocket-connections-${stage}
  USER_PRESENCE_TABLE: user-presence-${stage}
  WEBSOCKET_API_ENDPOINT: ${cf:hasivu-${stage}-websocket.WebSocketApiEndpoint}
```

#### Key Features

```typescript
interface WebSocketConnection {
  connectionId: string;
  userId: string;
  schoolId?: string;
  connectedAt: Date;
  lastActivity: Date;
  deviceInfo: DeviceInfo;
  subscriptions: string[]; // Topics/channels subscribed to
}

interface ConnectionManagement {
  authentication: boolean; // JWT token validation
  presence_tracking: boolean; // Online/offline status
  connection_persistence: boolean; // Connection state management
  subscription_management: boolean; // Topic subscription handling
}
```

### 8. real-time-message-router

**Purpose**: Event-driven message routing and broadcasting  
**Complexity**: High  
**Memory**: 1024MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/realtime/real-time-message-router.handler
Events:
  - EventBridge: hasivu-communication-bus
  - WebSocket: message-broadcast
  - HTTP: POST /realtime/broadcast
  - HTTP: POST /realtime/send-to-user/{userId}

Environment Variables:
  FUNCTION_NAME: real-time-message-router
  EVENT_BUS_NAME: hasivu-communication-bus-${stage}
  MESSAGE_HISTORY_TABLE: chat-message-history-${stage}
  WEBSOCKET_API_ENDPOINT: ${cf:hasivu-${stage}-websocket.WebSocketApiEndpoint}
```

#### Key Features

```typescript
interface RealTimeMessage {
  messageId: string;
  fromUserId: string;
  toUserId?: string; // Direct message
  channelId?: string; // Channel/group message
  messageType: 'text' | 'file' | 'image' | 'system';
  content: MessageContent;
  timestamp: Date;
  readBy: string[]; // Users who have read the message
}

interface BroadcastCapabilities {
  direct_messaging: boolean; // One-to-one messaging
  group_messaging: boolean; // One-to-many messaging
  channel_broadcasting: boolean; // Topic-based broadcasting
  presence_awareness: boolean; // Real-time presence updates
}
```

### 9. chat-message-handler

**Purpose**: In-app chat functionality with message persistence  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/realtime/chat-message-handler.handler
Events:
  - WebSocket: chat-message
  - HTTP: POST /chat/messages
  - HTTP: GET /chat/messages/{channelId}
  - HTTP: PUT /chat/messages/{messageId}/read

Environment Variables:
  FUNCTION_NAME: chat-message-handler
  CHAT_MESSAGES_TABLE: chat-messages-${stage}
  CHAT_CHANNELS_TABLE: chat-channels-${stage}
  FILE_UPLOAD_BUCKET: hasivu-${stage}-chat-files
  MESSAGE_ENCRYPTION_KEY: ${ssm:/hasivu/${stage}/chat-encryption-key~true}
```

#### Key Features

```typescript
interface ChatMessage {
  messageId: string;
  channelId: string;
  senderId: string;
  content: ChatContent;
  messageType: 'text' | 'file' | 'image' | 'emoji';
  timestamp: Date;
  editedAt?: Date;
  readReceipts: ReadReceipt[];
  reactions: MessageReaction[];
}

interface ChatCapabilities {
  message_threading: boolean; // Threaded conversations
  file_sharing: boolean; // Document and media sharing
  message_editing: boolean; // Edit sent messages
  message_reactions: boolean; // Emoji reactions
  read_receipts: boolean; // Message read status
  typing_indicators: boolean; // Real-time typing status
}
```

### 10. presence-manager

**Purpose**: Online/offline status tracking and user presence  
**Complexity**: Medium  
**Memory**: 256MB  
**Timeout**: 15s

#### Function Specification

```yaml
Handler: src/functions/realtime/presence-manager.handler
Events:
  - DynamoDB Stream: websocket-connections-${stage}
  - Schedule: rate(5 minutes) # Clean up stale connections
  - HTTP: GET /realtime/presence/{userId}
  - HTTP: POST /realtime/presence/update

Environment Variables:
  FUNCTION_NAME: presence-manager
  USER_PRESENCE_TABLE: user-presence-${stage}
  PRESENCE_TTL_MINUTES: 15
  PRESENCE_UPDATE_TOPIC_ARN: ${cf:hasivu-${stage}-messaging.PresenceTopicArn}
```

### 11. real-time-analytics

**Purpose**: Live communication metrics and engagement tracking  
**Complexity**: Medium  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/realtime/real-time-analytics.handler
Events:
  - Kinesis: communication-events-stream
  - Schedule: rate(1 minute) # Real-time metrics aggregation
  - HTTP: GET /analytics/realtime/dashboard
  - HTTP: GET /analytics/realtime/metrics

Environment Variables:
  FUNCTION_NAME: real-time-analytics
  ANALYTICS_DATA_TABLE: real-time-analytics-${stage}
  METRICS_STREAM_NAME: communication-metrics-stream-${stage}
  DASHBOARD_CACHE_TABLE: analytics-dashboard-cache-${stage}
```

---

## 🎨 Story 6.3: Template Management & Personalization (5 Functions)

### 12. template-manager

**Purpose**: CRUD operations for notification templates  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/templates/template-manager.handler
Events:
  - HTTP: POST /templates
  - HTTP: GET /templates/{templateId}
  - HTTP: PUT /templates/{templateId}
  - HTTP: DELETE /templates/{templateId}
  - HTTP: GET /templates

Environment Variables:
  FUNCTION_NAME: template-manager
  TEMPLATES_TABLE: notification-templates-${stage}
  TEMPLATE_ASSETS_BUCKET: hasivu-${stage}-template-assets
  TEMPLATE_VERSIONS_TABLE: template-versions-${stage}
```

#### Key Features

```typescript
interface NotificationTemplate {
  templateId: string;
  name: string;
  description?: string;
  category: 'payment' | 'order' | 'system' | 'promotional';
  channels: NotificationChannel[];
  content: TemplateContent;
  variables: TemplateVariable[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateContent {
  subject?: string; // For email templates
  body: string;
  htmlBody?: string;
  attachments?: TemplateAttachment[];
  styling?: TemplateStyle;
}
```

### 13. personalization-engine

**Purpose**: AI-powered content personalization  
**Complexity**: High  
**Memory**: 2048MB  
**Timeout**: 120s

#### Function Specification

```yaml
Handler: src/functions/templates/personalization-engine.handler
Events:
  - HTTP: POST /personalization/generate
  - HTTP: POST /personalization/analyze-user
  - HTTP: GET /personalization/recommendations/{userId}
  - Schedule: rate(1 hour) # Update personalization models

Environment Variables:
  FUNCTION_NAME: personalization-engine
  ML_MODEL_BUCKET: hasivu-${stage}-ml-models
  USER_BEHAVIOR_TABLE: user-behavior-analytics-${stage}
  PERSONALIZATION_CACHE_TABLE: personalization-cache-${stage}
  OPENAI_API_KEY: ${ssm:/hasivu/${stage}/openai-api-key~true}
```

#### Key Features

```typescript
interface PersonalizationRequest {
  userId: string;
  templateId: string;
  messageType: string;
  context: PersonalizationContext;
  preferences: UserPreferences;
}

interface PersonalizationContext {
  schoolInfo: SchoolInfo;
  parentInfo: ParentInfo;
  childrenInfo: ChildInfo[];
  recentActivity: ActivityHistory[];
  communicationHistory: CommunicationHistory[];
}

interface AIPersonalizationCapabilities {
  content_generation: boolean; // AI-generated personalized content
  timing_optimization: boolean; // Optimal send time prediction
  channel_optimization: boolean; // Best channel selection
  tone_adaptation: boolean; // Message tone personalization
}
```

### 14. template-renderer

**Purpose**: Dynamic template rendering with context injection  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/templates/template-renderer.handler
Events:
  - HTTP: POST /templates/render
  - HTTP: POST /templates/preview
  - SQS: template-rendering-queue

Environment Variables:
  FUNCTION_NAME: template-renderer
  RENDER_CACHE_TABLE: template-render-cache-${stage}
  ASSET_CDN_URL: ${cf:hasivu-${stage}-cdn.AssetDistributionDomainName}
  TEMPLATE_ENGINE: handlebars
```

#### Key Features

```typescript
interface TemplateRenderRequest {
  templateId: string;
  variables: Record<string, any>;
  channel: NotificationChannel;
  locale?: string;
  personalization?: PersonalizationData;
}

interface RenderingCapabilities {
  variable_substitution: boolean; // Dynamic variable replacement
  conditional_logic: boolean; // If/else template logic
  loop_rendering: boolean; // Array/list rendering
  asset_optimization: boolean; // Image and media optimization
  cache_optimization: boolean; // Rendered template caching
}
```

### 15. content-validator

**Purpose**: Template validation and compliance checking  
**Complexity**: Medium  
**Memory**: 256MB  
**Timeout**: 30s

#### Function Specification

```yaml
Handler: src/functions/templates/content-validator.handler
Events:
  - HTTP: POST /templates/validate
  - HTTP: POST /content/compliance-check
  - Schedule: rate(1 day) # Daily compliance audit

Environment Variables:
  FUNCTION_NAME: content-validator
  COMPLIANCE_RULES_TABLE: content-compliance-rules-${stage}
  VALIDATION_HISTORY_TABLE: content-validation-history-${stage}
```

### 16. localization-handler

**Purpose**: Multi-language support and cultural adaptation  
**Complexity**: Medium  
**Memory**: 512MB  
**Timeout**: 45s

#### Function Specification

```yaml
Handler: src/functions/templates/localization-handler.handler
Events:
  - HTTP: POST /localization/translate
  - HTTP: GET /localization/templates/{templateId}/{locale}
  - HTTP: PUT /localization/templates/{templateId}/{locale}

Environment Variables:
  FUNCTION_NAME: localization-handler
  TRANSLATIONS_TABLE: template-translations-${stage}
  SUPPORTED_LOCALES: en,hi,kn
  TRANSLATION_CACHE_TABLE: translation-cache-${stage}
```

---

## 📊 Story 6.4: Analytics & Delivery Tracking (5 Functions)

### 17. communication-analytics

**Purpose**: Comprehensive communication metrics and insights  
**Complexity**: High  
**Memory**: 2048MB  
**Timeout**: 180s

#### Function Specification

```yaml
Handler: src/functions/analytics/communication-analytics.handler
Events:
  - HTTP: GET /analytics/communication/dashboard
  - HTTP: GET /analytics/communication/reports
  - HTTP: POST /analytics/communication/custom-report
  - Schedule: rate(1 hour) # Metrics aggregation

Environment Variables:
  FUNCTION_NAME: communication-analytics
  ANALYTICS_DATA_TABLE: communication-analytics-${stage}
  REPORTS_BUCKET: hasivu-${stage}-analytics-reports
  DATA_WAREHOUSE_ENDPOINT: ${cf:hasivu-${stage}-data.DataWarehouseEndpoint}
```

### 18. delivery-tracking

**Purpose**: Real-time delivery status aggregation and reporting  
**Complexity**: Medium  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/analytics/delivery-tracking.handler
Events:
  - Kinesis: delivery-events-stream
  - HTTP: GET /analytics/delivery/status/{notificationId}
  - HTTP: GET /analytics/delivery/report
  - Schedule: rate(5 minutes) # Status aggregation

Environment Variables:
  FUNCTION_NAME: delivery-tracking
  DELIVERY_STATUS_TABLE: delivery-status-tracking-${stage}
  DELIVERY_METRICS_TABLE: delivery-metrics-${stage}
```

### 19. engagement-analytics

**Purpose**: User engagement patterns and optimization insights  
**Complexity**: High  
**Memory**: 1024MB  
**Timeout**: 120s

#### Function Specification

```yaml
Handler: src/functions/analytics/engagement-analytics.handler
Events:
  - Kinesis: user-engagement-stream
  - HTTP: GET /analytics/engagement/user/{userId}
  - HTTP: GET /analytics/engagement/trends
  - Schedule: rate(30 minutes) # Engagement metrics update

Environment Variables:
  FUNCTION_NAME: engagement-analytics
  ENGAGEMENT_DATA_TABLE: user-engagement-analytics-${stage}
  ENGAGEMENT_TRENDS_TABLE: engagement-trends-${stage}
```

### 20. ab-testing-engine

**Purpose**: Experiment management for communication optimization  
**Complexity**: High  
**Memory**: 1024MB  
**Timeout**: 60s

#### Function Specification

```yaml
Handler: src/functions/analytics/ab-testing-engine.handler
Events:
  - HTTP: POST /experiments
  - HTTP: GET /experiments/{experimentId}
  - HTTP: POST /experiments/{experimentId}/results
  - HTTP: PUT /experiments/{experimentId}/status

Environment Variables:
  FUNCTION_NAME: ab-testing-engine
  EXPERIMENTS_TABLE: ab-experiments-${stage}
  EXPERIMENT_RESULTS_TABLE: ab-experiment-results-${stage}
  STATISTICAL_SIGNIFICANCE_THRESHOLD: 0.05
```

### 21. ml-communication-insights

**Purpose**: ML-powered communication effectiveness analysis  
**Complexity**: High  
**Memory**: 2048MB  
**Timeout**: 300s

#### Function Specification

```yaml
Handler: src/functions/analytics/ml-communication-insights.handler
Events:
  - HTTP: GET /ml-insights/communication-effectiveness
  - HTTP: POST /ml-insights/train-models
  - HTTP: GET /ml-insights/predictions/{userId}
  - Schedule: rate(1 day) # Daily model updates

Environment Variables:
  FUNCTION_NAME: ml-communication-insights
  ML_MODELS_BUCKET: hasivu-${stage}-ml-models
  TRAINING_DATA_TABLE: ml-training-data-${stage}
  PREDICTIONS_CACHE_TABLE: ml-predictions-cache-${stage}
  SAGEMAKER_ENDPOINT: communication-effectiveness-endpoint-${stage}
```

---

## 🏗️ Infrastructure Requirements

### DynamoDB Tables (12 tables)

```yaml
Tables:
  - user-notification-preferences-${stage} # User channel preferences
  - notification-delivery-tracking-${stage} # Delivery status tracking
  - websocket-connections-${stage} # Active WebSocket connections
  - chat-messages-${stage} # Chat message storage
  - notification-templates-${stage} # Template definitions
  - template-versions-${stage} # Template versioning
  - communication-analytics-${stage} # Analytics data
  - ab-experiments-${stage} # A/B testing experiments
  - user-behavior-analytics-${stage} # User behavior data
  - real-time-analytics-${stage} # Real-time metrics
  - delivery-status-tracking-${stage} # Detailed delivery tracking
  - user-presence-${stage} # User online/offline status
```

### S3 Buckets (4 buckets)

```yaml
Buckets:
  - hasivu-${stage}-email-templates # Email template storage
  - hasivu-${stage}-template-assets # Template images and assets
  - hasivu-${stage}-chat-files # Chat file uploads
  - hasivu-${stage}-analytics-reports # Generated reports
```

### SNS Topics (5 topics)

```yaml
Topics:
  - communication-notifications-${stage} # Main notification distribution
  - delivery-status-updates-${stage} # Delivery status events
  - real-time-events-${stage} # WebSocket events
  - analytics-events-${stage} # Analytics data collection
  - presence-updates-${stage} # User presence changes
```

### SQS Queues (6 queues)

```yaml
Queues:
  - notification-queue-${stage} # Main notification processing
  - sms-notification-queue-${stage} # SMS-specific processing
  - email-notification-queue-${stage} # Email-specific processing
  - whatsapp-notification-queue-${stage} # WhatsApp-specific processing
  - push-notification-queue-${stage} # Push notification processing
  - notification-retry-queue-${stage} # Failed notification retries
```

### EventBridge Custom Bus

```yaml
EventBridge:
  - hasivu-communication-bus-${stage} # Custom event bus for communication events
```

### WebSocket API

```yaml
WebSocket:
  - hasivu-websocket-api-${stage} # Real-time communication API
```

---

## 🔧 Development & Deployment Configuration

### Serverless Framework Configuration

```yaml
# Addition to existing serverless.yml

plugins:
  - serverless-plugin-typescript
  - serverless-offline
  - serverless-plugin-warmup
  - serverless-plugin-split-stacks
  - serverless-associate-waf
  - serverless-websocket-api # New plugin for WebSocket support

custom:
  # Epic 6 specific configurations
  notification:
    channels:
      sms:
        provider: aws-sns
        fallback: twilio
      email:
        provider: aws-ses
        fallback: sendgrid
      whatsapp:
        provider: facebook-business-api
      push:
        android: firebase
        ios: apns

  realtime:
    websocket:
      idle_timeout: 600 # 10 minutes
      max_connections: 50000
      message_size_limit: 128kb

  templates:
    supported_locales: [en, hi, kn]
    cache_ttl: 3600 # 1 hour

  analytics:
    retention_days: 365
    aggregation_intervals: [1h, 1d, 1w, 1m]
```

### Environment-Specific Configuration

```yaml
# Development
dev:
  warmup: false
  tracing: true
  log_level: debug

# Staging
staging:
  warmup: true
  tracing: true
  log_level: info

# Production
prod:
  warmup: true
  tracing: false
  log_level: warn
  reserved_concurrency: 100 # Per function
```

### Monitoring & Observability

```yaml
CloudWatch:
  - Custom metrics for each Lambda function
  - Delivery rate dashboards
  - Real-time communication metrics
  - Cost optimization tracking

X-Ray:
  - End-to-end request tracing
  - Performance bottleneck identification
  - Error root cause analysis

CloudWatch Alarms:
  - High error rates (>1%)
  - Long execution times (>5s)
  - Failed deliveries (>5%)
  - WebSocket connection failures (>10%)
```

**Total Infrastructure**: 21 Lambda functions, 12 DynamoDB tables, 4 S3 buckets, 5 SNS topics, 6 SQS queues, 1 EventBridge bus, 1 WebSocket API

**Epic 6 Technical Readiness**: Comprehensive Lambda function specifications ready for multi-agent parallel development and deployment.
