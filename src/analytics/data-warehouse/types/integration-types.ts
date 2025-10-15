/**
 * Data Warehouse Integration Types
 *
 * Type definitions for system integrations and connectors
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  enabled: boolean;
  connection: ConnectionConfig;
  mapping: DataMapping;
  schedule?: SyncSchedule;
  retryPolicy: RetryPolicy;
  healthCheck: HealthCheckConfig;
}

// Extended integration configuration for orchestrator
export interface OrchestrationConfig {
  systems: {
    enabled: string[];
  };
  sync: DataSyncConfig;
  streaming: EventStreamConfig;
  apiGateway: APIGatewayConfig;
  serviceMesh: ServiceMeshConfig;
  dataFlow: DataFlowConfig;
  tracing: TracingConfig;
  healthCheck: HealthCheckConfig;
}

export interface DataFlowConfig {
  enabled: boolean;
  maxConcurrent: number;
  retryAttempts: number;
  timeout: number;
  maxConcurrentFlows: number;
  enableScheduling: boolean;
  metricsInterval: number;
  healthCheckInterval: number;
  metricsEnabled: boolean;
}

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  endpoint?: string;
  sampleRate: number;
}

export type IntegrationType =
  | 'hasivu_system'
  | 'predictive_analytics'
  | 'business_intelligence'
  | 'performance_monitoring'
  | 'vendor_marketplace'
  | 'authentication'
  | 'kitchen_management';

export interface ConnectionConfig {
  endpoint: string;
  method: 'REST' | 'GraphQL' | 'gRPC' | 'WebSocket' | 'Database';
  authentication: AuthConfig;
  timeout: number;
  rateLimits?: RateLimitConfig;
  ssl?: SSLConfig;
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'jwt';
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  burst?: number;
}

export interface SSLConfig {
  enabled: boolean;
  cert?: string;
  key?: string;
  ca?: string;
  rejectUnauthorized: boolean;
}

export interface DataMapping {
  source: MappingDefinition;
  target: MappingDefinition;
  transformations: TransformationRule[];
}

export interface MappingDefinition {
  schema: string;
  table?: string;
  fields: FieldMapping[];
}

export interface FieldMapping {
  source: string;
  target: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface TransformationRule {
  type: 'cast' | 'format' | 'calculate' | 'lookup' | 'filter';
  field: string;
  expression: string;
  parameters?: Record<string, any>;
}

export interface ValidationRule {
  pattern?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  enum?: any[] | undefined | undefined;
}

export interface SyncSchedule {
  enabled: boolean;
  frequency: 'realtime' | 'continuous' | 'hourly' | 'daily' | 'weekly';
  cron?: string;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  endpoint?: string;
  interval: number; // seconds
  timeout: number; // seconds
  expectedStatus?: number;
  expectedResponse?: string;
}

export interface SyncResult {
  integrationId: string;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: SyncError[];
  metrics: SyncMetrics;
}

export interface SyncError {
  type: 'connection' | 'authentication' | 'data' | 'transformation' | 'validation';
  message: string;
  record?: any;
  field?: string;
  timestamp: Date;
}

export interface SyncMetrics {
  duration: number; // milliseconds
  throughput: number; // records per second
  dataVolume: number; // bytes
  networkLatency: number; // milliseconds
  errorRate: number; // 0-1
}

export interface ConnectorStatus {
  integrationId: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'maintenance';
  lastSync: Date;
  nextSync?: Date;
  health: HealthStatus;
  metrics: ConnectorMetrics;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  lastUpdated: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number; // milliseconds
  message?: string;
}

export interface ConnectorMetrics {
  uptime: number; // seconds
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number; // milliseconds
  totalRecords: number;
  errorRate: number; // 0-1
}

export interface DataFlowDefinition {
  id: string;
  name: string;
  description: string;
  source: FlowEndpoint;
  target: FlowEndpoint;
  transformations: DataTransformation[];
  triggers: FlowTrigger[];
  enabled: boolean;
}

export interface FlowEndpoint {
  type: 'integration' | 'database' | 'api' | 'file' | 'stream';
  config: ConnectionConfig;
  schema: DataSchema;
}

export interface DataSchema {
  format: 'json' | 'xml' | 'csv' | 'avro' | 'protobuf';
  structure: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  children?: SchemaField[];
}

export interface DataTransformation {
  id: string;
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'split' | 'merge';
  config: TransformationConfig;
  order: number;
}

export interface TransformationConfig {
  expression?: string;
  conditions?: FilterCondition[];
  groupBy?: string[];
  aggregations?: AggregationFunction[];
  joinKey?: string;
  parameters?: Record<string, any>;
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'regex';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface AggregationFunction {
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  field: string;
  alias: string;
}

export interface FlowTrigger {
  type: 'schedule' | 'event' | 'manual' | 'webhook';
  config: TriggerConfig;
  enabled: boolean;
}

export interface TriggerConfig {
  schedule?: string; // cron expression
  event?: string;
  webhook?: WebhookConfig;
  conditions?: TriggerCondition[];
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: AuthConfig;
}

export interface TriggerCondition {
  field: string;
  operator: string;
  value: any;
}

// Additional types for integration orchestrator
export interface SystemConnector {
  id: string;
  name: string;
  type: IntegrationType;
  status: 'connected' | 'disconnected' | 'error';
  config: ConnectionConfig;
  lastSync?: Date;
  health: HealthStatus;
  healthEndpoint?: string;
  capabilities?: string[];

  // Methods
  initialize(): Promise<void>;
  getHealthStatus(): Promise<HealthStatus>;
  connect(): Promise<boolean | void>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
}

export interface DataSyncConfig {
  enabled: boolean;
  frequency: string;
  batchSize: number;
  retryAttempts: number;
  timeout: number;
}

export interface EventStreamConfig {
  enabled: boolean;
  topics: string[];
  bufferSize: number;
  compression: boolean;
}

export interface APIGatewayConfig {
  endpoint: string;
  version: string;
  rateLimit: RateLimitConfig;
  authentication: AuthConfig;
}

export interface ServiceMeshConfig {
  enabled: boolean;
  discovery: boolean;
  loadBalancing: 'round_robin' | 'least_connections' | 'random';
  circuitBreaker: boolean;
}

export interface IntegrationEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  processed: boolean;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  components: Record<string, HealthStatus>;
  uptime: number;
  lastCheck: Date;
  systemId: string;
  details?: Record<string, any>;
}

export interface DataFlow {
  id: string;
  source: string;
  target: string;
  status: 'created' | 'running' | 'paused' | 'failed' | 'stopped';
  throughput: number;
  lastSync?: Date;
  createdAt: Date;
  startedAt?: Date;
  sourceSystem: string;
  targetSystem: string;
  dataType: string;
  realtime?: boolean;
}

export interface ServiceRegistry {
  services: Record<string, SystemConnector>;
  discovery: boolean;
  loadBalancer?: string;
  healthCheck: boolean;
}
