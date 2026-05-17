/**
 * Data Warehouse Security Types
 *
 * Type definitions for security and compliance framework
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 */

export interface SecurityPolicy {
  id: string;
  name: string;
  type: 'access_control' | 'data_masking' | 'encryption' | 'audit';
  enabled: boolean;
  rules: SecurityRule[];
  scope: SecurityScope;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'mask' | 'encrypt' | 'audit';
  priority: number;
  parameters?: Record<string, any>;
}

export interface SecurityScope {
  tables?: string[];
  columns?: string[];
  users?: string[];
  roles?: string[];
  tenants?: string[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  category: 'personal' | 'financial' | 'health' | 'operational' | 'technical';
  tags: string[];
  retention?: {
    period: number; // days
    action: 'archive' | 'anonymize' | 'delete';
  };
}

export interface AccessControlMatrix {
  userId: string;
  role: string;
  permissions: {
    tables: Record<string, AccessLevel>;
    columns: Record<string, AccessLevel>;
    operations: Record<string, boolean>;
  };
  conditions?: AccessCondition[];
}

export type AccessLevel = 'none' | 'read' | 'write' | 'admin';

export interface AccessCondition {
  type: 'time' | 'location' | 'tenant' | 'custom';
  rule: string;
  parameters: Record<string, any>;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogEntry {
  event: string;
  userId?: string;
  tenantId?: string;
  keyId?: string;
  timestamp: Date;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceFramework {
  name: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCIDSS';
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'non_compliant' | 'partial';
  lastAssessed: Date;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  implemented: boolean;
  controls: string[];
  evidence?: string[];
}

export interface EncryptionConfig {
  algorithm: 'AES-256' | 'RSA-2048' | 'ChaCha20';
  keyRotation: {
    enabled: boolean;
    frequency: number; // days
  };
  keyManagement: 'local' | 'aws_kms' | 'azure_kv' | 'gcp_kms';
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  response: 'log' | 'alert' | 'block';
}

export interface SecurityMetrics {
  accessAttempts: {
    successful: number;
    failed: number;
    blocked: number;
  };
  dataAccess: {
    reads: number;
    writes: number;
    deletes: number;
  };
  violations: {
    count: number;
    severity: Record<string, number>;
  };
  compliance: {
    score: number; // 0-100
    frameworks: Record<string, boolean>;
  };
}

// Additional security types for compliance framework
export interface SecurityConfig {
  encryption: EncryptionConfig & { enabled: boolean };
  accessControl: {
    enabled: boolean;
    defaultDeny: boolean;
    sessionTimeout: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'basic' | 'detailed' | 'verbose';
  };
  monitoring: {
    enabled: boolean;
    realTimeAlerts: boolean;
    thresholds: Record<string, number>;
  };
  compliance: {
    gdpr: { enabled: boolean };
    coppa: { enabled: boolean };
  };
  zeroTrust: { enabled: boolean };
  rls?: any;
  cls?: any;
  masking?: any;
  classification?: any;
  privacy?: any;
  threatDetection?: any;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  scope: SecurityScope;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceRule {
  id: string;
  framework: string;
  requirement: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  implemented: boolean;
  controls: string[];
  validationQuery?: string;
  automatedCheck: boolean;
}

export interface PrivacyConfig {
  dataMinimization: boolean;
  purposeLimitation: boolean;
  consentManagement: {
    enabled: boolean;
    granular: boolean;
    withdrawal: boolean;
  };
  dataSubjectRights: {
    access: boolean;
    rectification: boolean;
    erasure: boolean;
    portability: boolean;
  };
  retention: {
    defaultPeriod: number; // days
    policies: Record<string, number>;
  };
}

export interface DataMaskingRule {
  id: string;
  name: string;
  column: string;
  table: string;
  maskingType: 'partial' | 'full' | 'hash' | 'tokenize' | 'format_preserve';
  pattern?: string;
  preserveFormat: boolean;
  conditions?: string[];
  enabled: boolean;
}

export interface AccessRequest {
  id: string;
  userId: string;
  resource: string;
  action: string;
  timestamp: Date;
  approved: boolean;
  approver?: string;
  reason?: string;
  duration?: number; // minutes
  conditions?: Record<string, any>;
  tenantId?: string;
  data?: any;
}

export interface SecurityViolation {
  id: string;
  type:
    | 'access'
    | 'data'
    | 'policy'
    | 'compliance'
    | 'untrusted_access_attempt'
    | 'unauthorized_access_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reason?: string;
  userId?: string;
  resource: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: string[];
}

export interface ComplianceReport {
  id: string;
  framework: string;
  generated: Date;
  period: {
    start: Date;
    end: Date;
  };
  score: number; // 0-100
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: {
    violations: SecurityViolation[];
    recommendations: string[];
    requirements: ComplianceRequirement[];
  };
  evidence: Record<string, any>;
  tenantId?: string;
}

export interface DataSubjectRights {
  userId: string;
  subjectId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restrict';
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restrict';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  data?: any;
  reason?: string;
  verificationMethod: string;
  tenantId?: string;
}
