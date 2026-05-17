/**
 * Data Lake Types - Comprehensive Type Definitions
 *
 * Defines all types and interfaces for data lake operations
 * including storage formats, compression, partitioning, and metadata
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 */

export type StorageFormat =
  | 'parquet'
  | 'delta'
  | 'orc'
  | 'avro'
  | 'json'
  | 'csv'
  | 'iceberg'
  | 'hudi'
  | 'arrow';

export type CompressionFormat =
  | 'gzip'
  | 'snappy'
  | 'lz4'
  | 'zstd'
  | 'brotli'
  | 'lzo'
  | 'uncompressed';

export type PartitionScheme =
  | 'time-based'
  | 'hash-based'
  | 'range-based'
  | 'list-based'
  | 'hybrid'
  | 'dynamic';

export interface PartitionStrategy {
  strategy: PartitionScheme;
  columns: string[];
  buckets?: number;
  pruning?: boolean;
  compaction?: {
    enabled: boolean;
    strategy: string;
    threshold: number;
  };
}

export interface PartitionMetadata {
  id: string;
  path: string;
  strategy: PartitionScheme;
  column: string;
  value: string;
  startValue?: string;
  endValue?: string;
  size: number;
  rowCount: number;
  createdAt: Date;
  lastAccessed: Date;
}

export type DataClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sensitive'
  | 'pii';

export type StorageTier = 'hot' | 'warm' | 'cold' | 'archive' | 'deep-archive';

export type DataFormat = 'structured' | 'semi-structured' | 'unstructured';

export type DataQuality = 'high' | 'medium' | 'low' | 'unknown';

export interface DataCatalogEntry {
  id: string;
  name: string;
  description: string;
  location: string;
  format: StorageFormat;
  compression: CompressionFormat;
  schema: DataSchema;
  partition: PartitionInfo;
  metadata: DataMetadata;
  lineage: DataLineage;
  tags: string[];
  classification: DataClassification;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  steward: string;
  retention: RetentionPolicy;
  accessControl: AccessControlInfo;
  usage: UsageStatistics;
}

export interface DataSchema {
  version: string;
  fields: DataField[];
  constraints: SchemaConstraint[];
  evolution: SchemaEvolution[];
}

export interface DataField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  constraints?: FieldConstraint[];
  metadata?: Record<string, any>;
}

export interface SchemaConstraint {
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'notnull';
  fields: string[];
  description?: string;
  condition?: string;
}

export interface SchemaEvolution {
  version: string;
  changes: SchemaChange[];
  timestamp: Date;
  author: string;
  description: string;
}

export interface SchemaChange {
  operation: 'add' | 'remove' | 'modify' | 'rename';
  field: string;
  oldValue?: any;
  newValue?: any;
  reason: string;
}

export interface FieldConstraint {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'length';
  value: any;
  message?: string;
}

export interface PartitionInfo {
  scheme: PartitionScheme;
  columns: string[];
  buckets?: number;
  ranges?: PartitionRange[];
  options: PartitionOptions;
}

export interface PartitionRange {
  min: any;
  max: any;
  location: string;
}

export interface PartitionOptions {
  maxPartitions: number;
  autoCompaction: boolean;
  compressionRatio: number;
  indexing: boolean;
}

export interface DataMetadata {
  size: number;
  recordCount: number;
  columnCount: number;
  quality: DataQuality;
  freshness: number; // hours since last update
  completeness: number; // percentage of non-null values
  accuracy: number; // percentage of valid values
  consistency: number; // percentage consistency across sources
  uniqueness: number; // percentage of unique values
  profile: DataProfile;
  statistics: DataStatistics;
}

export interface DataProfile {
  nullCounts: Record<string, number>;
  distinctCounts: Record<string, number>;
  minValues: Record<string, any>;
  maxValues: Record<string, any>;
  meanValues: Record<string, number>;
  medianValues: Record<string, number>;
  standardDeviations: Record<string, number>;
  distributions: Record<string, Distribution>;
}

export interface Distribution {
  type: 'normal' | 'uniform' | 'skewed' | 'bimodal' | 'unknown';
  parameters: Record<string, number>;
  histogram: HistogramBin[];
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface DataStatistics {
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  fileCount: number;
  avgFileSize: number;
  lastAccessed: Date;
  accessFrequency: number;
  queryCount: number;
  avgQueryTime: number;
}

export interface DataLineage {
  datasetId: string;
  source: string;
  upstream: DataSource[];
  downstream: DataDestination[];
  transformations: DataTransformation[];
  dependencies: DataDependency[];
  impact: ImpactAnalysis;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'file' | 'api' | 'stream' | 'lake';
  location: string;
  schema: string;
  table?: string;
  lastSync: Date;
  syncFrequency: string;
}

export interface DataDestination {
  id: string;
  name: string;
  type: 'database' | 'file' | 'api' | 'stream' | 'warehouse' | 'mart';
  location: string;
  schema: string;
  table?: string;
  updateFrequency: string;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'etl' | 'elt' | 'streaming' | 'batch';
  description: string;
  logic: string;
  author: string;
  version: string;
  dependencies: string[];
  outputs: string[];
}

export interface DataDependency {
  sourceId: string;
  targetId: string;
  type: 'hard' | 'soft' | 'optional';
  description: string;
  lastValidated: Date;
}

export interface ImpactAnalysis {
  upstreamCount: number;
  downstreamCount: number;
  criticalityScore: number;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  affectedUsers: string[];
  affectedDatasets: string[];
  estimatedRecords: number;
  recoveryTime: number; // minutes
}

export interface RetentionPolicy {
  enabled: boolean;
  type: 'time-based' | 'count-based' | 'size-based' | 'custom';
  value: number;
  unit: 'days' | 'months' | 'years' | 'records' | 'bytes';
  archiveAfter?: number;
  deleteAfter?: number;
  exceptions: RetentionException[];
}

export interface RetentionException {
  condition: string;
  action: 'keep' | 'archive' | 'delete';
  reason: string;
  approvedBy: string;
}

export interface AccessControlInfo {
  enabled: boolean;
  visibility: 'public' | 'internal' | 'restricted';
  permissions: Permission[];
  roles: string[];
  policies: AccessPolicy[];
  encryption: EncryptionInfo;
}

export interface Permission {
  principal: string;
  principalType: 'user' | 'group' | 'role' | 'service';
  actions: string[];
  conditions?: AccessCondition[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  priority: number;
  active: boolean;
}

export interface PolicyRule {
  effect: 'allow' | 'deny';
  principals: string[];
  actions: string[];
  resources: string[];
  conditions?: AccessCondition[];
}

export interface AccessCondition {
  type: 'time' | 'location' | 'attribute' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater' | 'less';
  value: any;
}

export interface EncryptionInfo {
  enabled: boolean;
  algorithm: string;
  keyId: string;
  keyManagement?: string;
  keyRotation: boolean;
  rotationPeriod?: number;
  rotationInterval: number; // days
  encryptionScope: 'file' | 'column' | 'field';
}

export interface UsageStatistics {
  totalAccesses: number;
  uniqueUsers: number;
  avgAccessesPerDay: number;
  peakAccessTime: string;
  topQueries: QueryUsage[];
  errorRate: number;
  performanceMetrics: PerformanceMetrics;
}

export interface QueryUsage {
  query: string;
  count: number;
  avgExecutionTime: number;
  lastExecuted: Date;
  user: string;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number;
  availability: number; // percentage
}

export interface DataLakeManagerConfig {
  storageLocation: StorageLocation;
  defaultFormat: StorageFormat;
  defaultCompression: CompressionFormat;
  defaultPartitioning: PartitionScheme;
  retentionPolicy: RetentionPolicy;
  accessControl: AccessControlInfo;
  encryption: EncryptionInfo;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
  replication: ReplicationConfig;
  backup: BackupConfig;
  governance: DataGovernancePolicy[];
  formats: {
    default: DataFormat;
    supported: DataFormat[];
  };
  compression: {
    default: CompressionFormat;
    supported: CompressionFormat[];
  };
}

export interface DataLakeDataset {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  location: StorageLocation;
  format: StorageFormat;
  compression?: CompressionFormat;
  schema: DataSchema;
  partition?: PartitionInfo;
  version?: DataVersion;
  currentVersion: string;
  partitionScheme?: PartitionScheme;
  catalogEntry?: DataCatalogEntry;
  lineage?: DataLineage;
  quality?: DataQuality;
  size?: number;
  recordCount?: number;
  createdAt: Date;
  updatedAt: Date;
  lastModified?: Date;
  lastAccessed?: Date;
  owner?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface StorageLocation {
  type: 'local' | 's3' | 'azure' | 'gcp' | 'hdfs' | 'ftp';
  path: string;
  region?: string;
  bucket?: string;
  container?: string;
  credentials?: StorageCredentials;
  configuration?: StorageConfiguration;
}

export interface StorageCredentials {
  accessKey?: string;
  secretKey?: string;
  token?: string;
  region?: string;
  profile?: string;
}

export interface StorageConfiguration {
  endpoint?: string;
  ssl?: boolean;
  timeout?: number;
  retries?: number;
  concurrency?: number;
  bufferSize?: number;
}

export interface SchemaInference {
  id: string;
  strategy: 'automatic' | 'manual' | 'hybrid';
  sampleSize: number;
  confidenceThreshold: number;
  rules: InferenceRule[];
  overrides: SchemaOverride[];
}

export interface InferenceRule {
  pattern: string;
  type: string;
  priority: number;
  description: string;
}

export interface SchemaOverride {
  field: string;
  type: string;
  reason: string;
  appliedBy: string;
  appliedAt: Date;
}

export interface DataVersion {
  id: string;
  datasetId: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  label?: string;
  hash: string;
  checksum: string;
  size: number;
  timestamp: Date;
  createdAt: Date;
  createdBy: string;
  author: string;
  message: string;
  changes: VersionChange[];
  compatible: boolean;
  deprecated: boolean;
  metadata?: Record<string, any>;
  location: StorageLocation;
  schema: string; // schema ID reference
}

export interface VersionChange {
  type: 'schema' | 'data' | 'metadata' | 'configuration';
  operation: 'add' | 'remove' | 'modify' | 'rename';
  description: string;
  impact: 'breaking' | 'non-breaking' | 'additive';
}

export interface ReplicationConfig {
  enabled: boolean;
  strategy: 'sync' | 'async' | 'batch';
  targets: ReplicationTarget[];
  schedule?: string;
  compression: boolean;
  encryption: boolean;
  verification: boolean;
  retryPolicy: RetryPolicy;
  consistency: 'eventual' | 'strong' | 'weak';
}

export interface ReplicationTarget {
  id: string;
  name: string;
  location: StorageLocation;
  priority: number;
  filters?: ReplicationFilter[];
  transformations?: DataTransformation[];
}

export interface ReplicationFilter {
  field: string;
  operator: string;
  value: any;
  include: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  strategy: 'linear' | 'exponential' | 'fixed';
}

export interface BackupConfig {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  location: StorageLocation;
  verification: boolean;
  notification: NotificationConfig;
  schedule: string;
}

export interface DataLakeConfiguration {
  storageFormat: StorageFormat;
  compressionFormat: CompressionFormat;
  partitionScheme: PartitionScheme;
  retentionPolicy: RetentionPolicy;
  accessControl: AccessControlInfo;
  encryption: EncryptionInfo;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number; // seconds
  alerting: AlertingConfig;
  logging: LoggingConfig;
  healthChecks: HealthCheckConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThreshold[];
  escalation: EscalationPolicy;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook';
  endpoint: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlertThreshold {
  metric: string;
  operator: 'greater' | 'less' | 'equals';
  value: number;
  window: number; // minutes
  severity: 'warning' | 'error' | 'critical';
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: number; // minutes
}

export interface EscalationLevel {
  level: number;
  recipients: string[];
  delay: number; // minutes
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: 'file' | 'stdout' | 'console' | 'elasticsearch' | 'cloudwatch';
  format: 'json' | 'text';
  retention: number; // days
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // seconds
  endpoints: HealthEndpoint[];
  retries: number;
}

export interface HealthEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number; // seconds
}

export interface OptimizationConfig {
  enabled: boolean;
  autoOptimization: boolean;
  compactionEnabled: boolean;
  compactionThreshold: number; // MB
  indexingEnabled: boolean;
  cacheEnabled: boolean;
  cacheSize: number; // MB
  cachePolicy: 'lru' | 'lfu' | 'fifo';
}

export interface DataLakeOperationResult {
  success: boolean;
  message: string;
  data?: any;
  metadata?: DataMetadata;
  errors?: OperationError[];
  warnings?: OperationWarning[];
  performance?: OperationPerformance;
}

export interface OperationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface OperationWarning {
  code: string;
  message: string;
  recommendation?: string;
  timestamp: Date;
}

export interface OperationPerformance {
  executionTime: number; // milliseconds
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  ioOperations: number;
  networkTransfer: number; // bytes
}

export interface StorageOptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  spaceSaved: number;
  optimizationTime: number;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  type: 'compression' | 'partitioning' | 'indexing' | 'archival';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  savings: number; // percentage
}

export interface DataDiscoveryResult {
  datasets: DataCatalogEntry[];
  totalCount: number;
  searchTime: number;
  filters: SearchFilter[];
  facets: SearchFacet[];
}

export interface SearchFilter {
  field: string;
  operator: string;
  value: any;
  applied: boolean;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: any;
  count: number;
  selected: boolean;
}

export interface DataGovernancePolicy {
  id: string;
  name: string;
  description: string;
  type: 'data_quality' | 'privacy' | 'retention' | 'access' | 'compliance';
  rules: GovernanceRule[];
  enforcement: EnforcementConfig;
  compliance: ComplianceInfo;
  active: boolean;
  version: string;
  author: string;
  approver: string;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface GovernanceRule {
  id: string;
  condition: string;
  action: GovernanceAction;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
}

export interface GovernanceAction {
  type: 'block' | 'warn' | 'log' | 'audit' | 'encrypt' | 'mask' | 'delete';
  parameters: Record<string, any>;
  notification?: NotificationConfig;
}

export interface NotificationConfig {
  enabled: boolean;
  recipients: string[];
  channels: string[];
  template: string;
  immediate: boolean;
}

export interface EnforcementConfig {
  mode: 'monitor' | 'enforce' | 'audit';
  exceptions: string[];
  escalation: EscalationPolicy;
}

export interface ComplianceInfo {
  frameworks: string[]; // GDPR, CCPA, HIPAA, etc.
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'non_compliant' | 'pending' | 'unknown';
  lastAudit: Date;
  nextAudit: Date;
  auditor: string;
}

export interface ComplianceRequirement {
  framework: string;
  requirement: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence: string[];
  notes: string;
  reviewer: string;
  reviewDate: Date;
}

// Additional types for Access Control Manager
export interface UserPermission {
  userId: string;
  role: string;
  resource: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessAuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  result: 'granted' | 'denied';
  reason: string;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Fix for Permission type name collision
export interface SimplePermission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

// Additional interfaces for new functionality
export interface PartitionRecommendation {
  strategy: 'range' | 'hash' | 'list' | 'composite';
  partitionColumns: string[];
  estimatedPartitionCount: number;
  expectedPerformanceGain: number;
  implementation: ImplementationPlan;
}

export interface DataCharacteristics {
  totalRecords: number;
  columns: Record<string, ColumnInfo>;
  dataTypes: string[];
  hasTimestamps: boolean;
}

export interface ColumnInfo {
  type: string;
  cardinality: number;
  selectivity: number;
}

export interface AccessPatternAnalysis {
  queryTypes: string[];
  filterColumns: string[];
  sortColumns: string[];
  timeRangeQueries: boolean;
  pointQueries: boolean;
}

export interface ImplementationPlan {
  steps: string[];
  estimatedTime: string;
  complexity: 'low' | 'medium' | 'high';
  prerequisites: string[];
}
