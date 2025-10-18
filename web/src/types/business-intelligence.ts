/**
 * HASIVU Business Intelligence Platform - Type Definitions
 * Epic 3 → Story 2: Complete TypeScript Interface Definitions
 *
 * Comprehensive type definitions for the entire BI platform ensuring
 * type safety, IntelliSense support, and developer productivity.
 */

// Core System Types
export interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  analytics: 'healthy' | 'warning' | 'critical';
  integrations: 'healthy' | 'warning' | 'critical';
  aiservices: 'healthy' | 'warning' | 'critical';
  realtime: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  uptime: number;
}

export interface UserPermissions {
  canViewExecutive: boolean;
  canViewOperational: boolean;
  canManageIntegrations: boolean;
  canConfigureAnalytics: boolean;
  canViewAIInsights: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  role: 'super_admin' | 'school_admin' | 'analyst' | 'viewer' | 'kitchen_staff';
  schools: string[];
  departments: string[];
  data_access_level: 'full' | 'limited' | 'read_only';
}

// Business Intelligence Dashboard Types
export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change_percentage: number;
  change_period: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  last_updated: string;
}

export interface SchoolPerformance {
  school_id: string;
  school_name: string;
  region: string;
  total_students: number;
  enrollment_rate: number;
  attendance_rate: number;
  academic_score: number;
  financial_health: number;
  operational_efficiency: number;
  parent_satisfaction: number;
  teacher_retention: number;
  infrastructure_score: number;
  trend: 'improving' | 'declining' | 'stable';
  last_assessment: string;
}

export interface OperationalMetrics {
  kitchen_efficiency: number;
  supply_chain_score: number;
  maintenance_requests: number;
  energy_consumption: number;
  waste_reduction: number;
  cost_per_meal: number;
  inventory_turnover: number;
  equipment_uptime: number;
  staff_productivity: number;
  compliance_score: number;
}

// Generic types for flexible data structures
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

// Visualization Engine Types
export interface ChartConfig {
  id: string;
  type:
    | 'line'
    | 'bar'
    | 'pie'
    | 'donut'
    | 'scatter'
    | 'heatmap'
    | 'gauge'
    | 'funnel'
    | 'treemap'
    | 'network';
  title: string;
  data_source: string;
  x_axis: string;
  y_axis: string;
  color_scheme: string[];
  width: number;
  height: number;
  responsive: boolean;
  interactive: boolean;
  animation: boolean;
  real_time: boolean;
  refresh_interval: number;
  filters: FilterConfig[];
  customoptions: Record<string, JsonValue>;
}

export interface VisualizationData {
  id: string;
  chart_id: string;
  data: JsonObject[];
  metadata: {
    total_records: number;
    last_updated: string;
    data_quality: number;
    completeness: number;
    source: string;
    processing_time: number;
  };
  schema: {
    columns: ColumnDefinition[];
    primary_key: string;
    relationships: Relationship[];
  };
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  nullable: boolean;
  unique: boolean;
  description: string;
  format?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'length' | 'pattern' | 'custom';
  value: string | number;
  message: string;
}

export interface Relationship {
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  source_column: string;
  target_table: string;
  target_column: string;
  description: string;
}

// AI Insights Platform Types
export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation' | 'alert' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  affected_schools: string[];
  affected_metrics: string[];
  evidence: Evidence[];
  recommendations: Recommendation[];
  created_at: string;
  expires_at?: string;
  status: 'active' | 'dismissed' | 'resolved' | 'investigating';
  assignee?: string;
  tags: string[];
}

export interface Evidence {
  type: 'statistical' | 'comparative' | 'temporal' | 'correlational';
  description: string;
  data: JsonValue;
  confidence: number;
  source: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  resources_required: string[];
  success_metrics: string[];
  dependencies: string[];
  cost_estimate?: number;
  roi_estimate?: number;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering' | 'time_series' | 'anomaly_detection';
  target_variable: string;
  features: string[];
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_date: string;
  last_retrained: string;
  next_retrain: string;
  status: 'active' | 'training' | 'deprecated' | 'error';
  version: string;
  hyperparameters: Record<string, JsonValue>;
  feature_importance: FeatureImportance[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
  category: string;
}

export interface NaturalLanguageQuery {
  id: string;
  query: string;
  intent: string;
  entities: Entity[];
  parsedquery: ParsedQuery;
  results: QueryResult[];
  confidence: number;
  processing_time: number;
  user_feedback?: 'helpful' | 'not_helpful';
  suggested_followups: string[];
}

export interface Entity {
  type: 'metric' | 'school' | 'date' | 'region' | 'category' | 'comparison' | 'aggregation';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface ParsedQuery {
  action: 'show' | 'compare' | 'analyze' | 'predict' | 'summarize' | 'filter';
  subject: string;
  filters: QueryFilter[];
  aggregations: QueryAggregation[];
  timeframe: TimeFrame;
  groupby: string[];
  orderby: OrderBy[];
  limit?: number;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like' | 'between';
  value: JsonValue;
  logical_operator?: 'and' | 'or';
}

export interface QueryAggregation {
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'std' | 'var';
  field: string;
  alias?: string;
}

export interface TimeFrame {
  start: string;
  end: string;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryResult {
  visualization_type: string;
  data: JsonObject[];
  summary: string;
  insights: string[];
  confidence: number;
  execution_time: number;
}

// Self-Service Analytics Types
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  permissions: PermissionConfig;
  created_by: string;
  created_at: string;
  last_modified: string;
  version: string;
  is_public: boolean;
  usage_count: number;
  rating: number;
  thumbnail?: string;
}

export interface WidgetConfig {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'text' | 'filter' | 'image' | 'iframe';
  title: string;
  position: Position;
  size: Size;
  data_source: string;
  configuration: Record<string, JsonValue>;
  filters: FilterConfig[];
  refresh_interval: number;
  cache_duration: number;
  dependencies: string[];
  conditional_formatting: ConditionalFormat[];
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface Size {
  width: number;
  height: number;
  min_width?: number;
  min_height?: number;
  max_width?: number;
  max_height?: number;
}

export interface LayoutConfig {
  grid_size: number;
  margin: number;
  padding: number;
  responsive_breakpoints: ResponsiveBreakpoint[];
  background_color?: string;
  background_image?: string;
}

export interface ResponsiveBreakpoint {
  name: string;
  min_width: number;
  columns: number;
  row_height: number;
}

export interface FilterConfig {
  id: string;
  type: 'dropdown' | 'multiselect' | 'date_range' | 'slider' | 'text' | 'checkbox';
  field: string;
  label: string;
  default_value?: JsonValue;
  options?: FilterOption[];
  validation?: ValidationRule[];
  cascade_filters?: string[];
  apply_to_widgets: string[];
}

export interface FilterOption {
  label: string;
  value: JsonValue;
  group?: string;
  disabled?: boolean;
}

export interface ConditionalFormat {
  condition: string;
  format: {
    color?: string;
    background_color?: string;
    font_weight?: string;
    font_size?: string;
    icon?: string;
  };
}

export interface PermissionConfig {
  view: string[];
  edit: string[];
  delete: string[];
  share: string[];
  export: string[];
}

// Integration API Layer Types
export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'streaming' | 'webhook';
  connection_string: string;
  authentication: AuthConfig;
  schema: DataSourceSchema;
  status: 'active' | 'inactive' | 'error' | 'testing';
  last_sync: string;
  sync_frequency: string;
  data_volume: number;
  error_rate: number;
  latency: number;
  health_score: number;
  configuration: Record<string, JsonValue>;
  tags: string[];
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'certificate';
  credentials: Record<string, string>;
  refresh_token?: string;
  token_expiry?: string;
}

export interface DataSourceSchema {
  tables: TableSchema[];
  relationships: Relationship[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primary_key: string[];
  foreign_keys: ForeignKeyDefinition[];
  row_count: number;
  data_size: number;
  last_updated: string;
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique: boolean;
}

export interface ConstraintDefinition {
  name: string;
  table: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  definition: string;
}

export interface ForeignKeyDefinition {
  column: string;
  references_table: string;
  references_column: string;
  on_delete: 'cascade' | 'set_null' | 'restrict';
  on_update: 'cascade' | 'set_null' | 'restrict';
}

export interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  version: string;
  authentication_required: boolean;
  rate_limit: RateLimit;
  input_schema: JSONSchema;
  output_schema: JSONSchema;
  response_time: number;
  success_rate: number;
  error_rate: number;
  usage_count: number;
  last_called: string;
  status: 'active' | 'deprecated' | 'maintenance';
  tags: string[];
}

export interface RateLimit {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_limit: number;
}

export interface JSONSchema {
  type: string;
  properties: Record<string, JsonValue>;
  required: string[];
  additionalProperties: boolean;
  example?: JsonValue;
}

export interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'paused' | 'failed';
  retry_policy: RetryPolicy;
  last_delivery: string;
  delivery_count: number;
  failure_count: number;
  success_rate: number;
  created_at: string;
  headers: Record<string, string>;
  filters: WebhookFilter[];
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential';
  initial_delay: number;
  max_delay: number;
  timeout: number;
}

export interface WebhookFilter {
  field: string;
  operator: string;
  value: JsonValue;
}

// Real-time Streaming Types
export interface StreamingConnection {
  id: string;
  name: string;
  type: 'kafka' | 'websocket' | 'server_sent_events' | 'redis_streams';
  configuration: StreamingConfig;
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  throughput: number;
  latency: number;
  error_rate: number;
  last_message: string;
  message_count: number;
  consumer_lag?: number;
}

export interface StreamingConfig {
  brokers?: string[];
  topics?: string[];
  consumer_group?: string;
  serialization: 'json' | 'avro' | 'protobuf' | 'binary';
  compression?: 'none' | 'gzip' | 'snappy' | 'lz4';
  batch_size?: number;
  buffer_size?: number;
  timeout?: number;
  security?: SecurityConfig;
}

export interface SecurityConfig {
  ssl: boolean;
  sasl_mechanism?: 'PLAIN' | 'SCRAM-SHA-256' | 'SCRAM-SHA-512';
  username?: string;
  password?: string;
  certificate?: string;
  key?: string;
  ca_certificate?: string;
}

// Alert and Notification Types
export interface Alert {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'anomaly' | 'pattern' | 'system' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: AlertCondition;
  notification_channels: string[];
  escalation_policy: EscalationPolicy;
  status: 'active' | 'paused' | 'resolved' | 'suppressed';
  created_at: string;
  last_triggered: string;
  trigger_count: number;
  false_positive_rate: number;
  tags: string[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  timeframe: string;
  aggregation: string;
  filters: QueryFilter[];
}

export interface EscalationPolicy {
  steps: EscalationStep[];
  repeat: boolean;
  max_escalations: number;
}

export interface EscalationStep {
  delay: number;
  channels: string[];
  assignees: string[];
}

// Export and Reporting Types
export interface ExportRequest {
  id: string;
  type: 'csv' | 'excel' | 'pdf' | 'json' | 'parquet';
  data_source: string;
  filters: QueryFilter[];
  columns: string[];
  formatoptions: FormatOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_size?: number;
  download_url?: string;
  expiry_date?: string;
  created_by: string;
  created_at: string;
}

export interface FormatOptions {
  includeheaders: boolean;
  date_format: string;
  number_format: string;
  encoding: string;
  delimiter?: string;
  compression?: 'none' | 'gzip' | 'zip';
}

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  dashboard_id: string;
  schedule: ScheduleConfig;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  status: 'active' | 'paused' | 'failed';
  last_run: string;
  next_run: string;
  success_count: number;
  failure_count: number;
  created_by: string;
  created_at: string;
}

export interface ScheduleConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  timezone: string;
  days_of_week?: number[];
  days_of_month?: number[];
  months?: number[];
}

// Audit and Compliance Types
export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, JsonValue>;
  ip_address: string;
  user_agent: string;
  session_id: string;
  outcome: 'success' | 'failure' | 'partial';
  risk_level: 'low' | 'medium' | 'high';
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'data_privacy' | 'access_control' | 'data_retention' | 'audit_trail';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  remediation: string;
  automated_fix: boolean;
  status: 'compliant' | 'non_compliant' | 'warning' | 'unknown';
  last_checked: string;
  check_frequency: string;
}

// Utility Types
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortDirection = 'asc' | 'desc';

export interface PaginationConfig {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  errors?: string[];
  pagination?: PaginationConfig;
  metadata?: Record<string, JsonValue>;
}

// Component Props Types
export interface BIComponentProps {
  userPermissions: UserPermissions;
  systemHealth: SystemHealth;
  connectionStatus?: ConnectionStatus;
  className?: string;
  onError?: (error: Error) => void;
  onLoading?: (loading: boolean) => void;
}

// Event Types
export interface BIEvent {
  type: string;
  timestamp: string;
  data: JsonValue;
  source: string;
  user_id?: string;
  session_id?: string;
}

// Configuration Types
export interface PlatformConfig {
  api_base_url: string;
  websocket_url: string;
  refresh_intervals: {
    dashboard: number;
    charts: number;
    health: number;
  };
  limits: {
    max_dashboard_widgets: number;
    max_concurrent_requests: number;
    max_export_rows: number;
  };
  features: {
    ai_insights_enabled: boolean;
    real_time_enabled: boolean;
    export_enabled: boolean;
    alerts_enabled: boolean;
  };
}
