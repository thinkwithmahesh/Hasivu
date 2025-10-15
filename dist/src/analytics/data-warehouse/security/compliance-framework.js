"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityComplianceFramework = void 0;
const events_1 = require("events");
const logger_1 = require("../../../shared/utils/logger");
const metrics_service_1 = require("../../../services/metrics.service");
const audit_service_1 = require("../../../services/audit.service");
const row_level_security_manager_1 = require("./rls/row-level-security-manager");
const column_level_security_manager_1 = require("./cls/column-level-security-manager");
const data_masking_engine_1 = require("./masking/data-masking-engine");
const encryption_manager_1 = require("./encryption/encryption-manager");
const audit_trail_manager_1 = require("./audit/audit-trail-manager");
const gdpr_compliance_manager_1 = require("./gdpr/gdpr-compliance-manager");
const coppa_compliance_manager_1 = require("./coppa/coppa-compliance-manager");
const data_classification_engine_1 = require("./classification/data-classification-engine");
const privacy_preserving_analytics_1 = require("./privacy/privacy-preserving-analytics");
const zero_trust_manager_1 = require("./zerotrust/zero-trust-manager");
const access_control_engine_1 = require("./access/access-control-engine");
const threat_detection_engine_1 = require("./threats/threat-detection-engine");
class SecurityComplianceFramework extends events_1.EventEmitter {
    config;
    metrics = new metrics_service_1.MetricsCollector();
    auditLogger = new audit_service_1.AuditService();
    rowLevelSecurity;
    columnLevelSecurity;
    dataMasking;
    encryption;
    auditTrail;
    gdprCompliance;
    coppaCompliance;
    dataClassification;
    privacyAnalytics;
    zeroTrust;
    accessControl;
    threatDetection;
    isInitialized = false;
    securityPolicies = new Map();
    complianceRules = new Map();
    dataClassifications = new Map();
    activeViolations = new Map();
    constructor(config) {
        super();
        this.config = config;
        logger_1.logger.info('Initializing Security Compliance Framework', {
            encryptionEnabled: config.encryption?.enabled || false,
            gdprCompliance: config.compliance?.gdpr?.enabled || false,
            coppaCompliance: config.compliance?.coppa?.enabled || false,
            zeroTrustMode: config.zeroTrust?.enabled || false
        });
        this.rowLevelSecurity = new row_level_security_manager_1.RowLevelSecurityManager();
        this.columnLevelSecurity = new column_level_security_manager_1.ColumnLevelSecurityManager();
        this.dataMasking = new data_masking_engine_1.DataMaskingEngine();
        this.encryption = new encryption_manager_1.EncryptionManager();
        this.auditTrail = new audit_trail_manager_1.AuditTrailManager();
        this.gdprCompliance = new gdpr_compliance_manager_1.GDPRComplianceManager();
        this.coppaCompliance = new coppa_compliance_manager_1.COPPAComplianceManager();
        this.dataClassification = new data_classification_engine_1.DataClassificationEngine();
        this.privacyAnalytics = new privacy_preserving_analytics_1.PrivacyPreservingAnalytics();
        this.zeroTrust = new zero_trust_manager_1.ZeroTrustManager();
        this.accessControl = new access_control_engine_1.AccessControlEngine();
        this.threatDetection = new threat_detection_engine_1.ThreatDetectionEngine();
        this.setupEventHandlers();
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Security Compliance Framework...');
            await this.encryption.initialize();
            await Promise.all([
                this.rowLevelSecurity.initialize(),
                this.columnLevelSecurity.initialize(),
                this.dataMasking.initialize(),
                this.auditTrail.initialize(),
                this.gdprCompliance.initialize(),
                this.coppaCompliance.initialize(),
                this.dataClassification.initialize(),
                this.privacyAnalytics.initialize(),
                this.zeroTrust.initialize(),
                this.accessControl.initialize(),
                this.threatDetection.initialize()
            ]);
            await this.loadSecurityPolicies();
            await this.loadComplianceRules();
            await this.loadDataClassifications();
            this.startSecurityMonitoring();
            this.isInitialized = true;
            logger_1.logger.info('Security Compliance Framework initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Security Compliance Framework', { error });
            throw error;
        }
    }
    async shutdown() {
        try {
            logger_1.logger.info('Shutting down Security Compliance Framework...');
            this.isInitialized = false;
            await Promise.all([
                this.rowLevelSecurity.shutdown(),
                this.columnLevelSecurity.shutdown(),
                this.dataMasking.shutdown(),
                this.encryption.shutdown(),
                this.auditTrail.shutdown(),
                this.gdprCompliance.shutdown(),
                this.coppaCompliance.shutdown(),
                this.dataClassification.shutdown(),
                this.privacyAnalytics.shutdown(),
                this.zeroTrust.shutdown(),
                this.accessControl.shutdown(),
                this.threatDetection.shutdown()
            ]);
            logger_1.logger.info('Security Compliance Framework shut down successfully');
            this.emit('shutdown');
        }
        catch (error) {
            logger_1.logger.error('Error shutting down Security Compliance Framework', { error });
            throw error;
        }
    }
    async validateAccess(request) {
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Validating data access request', {
                userId: request.userId,
                tenantId: request.tenantId,
                resource: request.resource,
                action: request.action
            });
            const zeroTrustResult = await this.zeroTrust.validateRequest(request);
            if (!zeroTrustResult.trusted) {
                await this.recordSecurityViolation({
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'untrusted_access_attempt',
                    severity: 'high',
                    description: 'Zero trust validation failed for access request',
                    userId: request.userId,
                    resource: request.resource,
                    reason: zeroTrustResult.reason,
                    timestamp: new Date(),
                    resolved: false,
                    actions: ['DENY_ACCESS', 'LOG_INCIDENT']
                });
                return {
                    authorized: false,
                    restrictions: ['zero_trust_violation'],
                    auditTrail: await this.auditTrail.createTrail(request, 'DENIED')
                };
            }
            const accessResult = await this.accessControl.validateAccess(request.userId, request.resource, request.action);
            if (!accessResult.authorized) {
                await this.recordSecurityViolation({
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'unauthorized_access_attempt',
                    severity: 'high',
                    description: 'Access control validation failed for request',
                    userId: request.userId,
                    resource: request.resource,
                    reason: accessResult.reason,
                    timestamp: new Date(),
                    resolved: false,
                    actions: ['DENY_ACCESS', 'LOG_INCIDENT']
                });
                return {
                    authorized: false,
                    restrictions: [accessResult.reason || 'Access denied'],
                    auditTrail: await this.auditTrail.createTrail(request, 'DENIED')
                };
            }
            const rowFilters = await this.rowLevelSecurity.getFilters(request.userId, request.tenantId, request.resource);
            const columnFilters = await this.columnLevelSecurity.getFilters(request.userId, request.tenantId, request.resource);
            let maskedData;
            if (request.data && (rowFilters.length > 0 || columnFilters.length > 0)) {
                maskedData = await this.dataMasking.applyMasking(request.data, {
                    userId: request.userId,
                    tenantId: request.tenantId,
                    rowFilters,
                    columnFilters
                });
            }
            const classification = await this.dataClassification.classifyData(request.resource, request.data);
            const complianceCheck = await this.checkCompliance(request, classification);
            if (!complianceCheck.compliant) {
                return {
                    authorized: false,
                    restrictions: complianceCheck.violations,
                    auditTrail: await this.auditTrail.createTrail(request, 'COMPLIANCE_VIOLATION')
                };
            }
            const auditTrail = await this.auditTrail.createTrail(request, 'GRANTED', {
                classification: classification.level,
                masking: maskedData ? 'applied' : 'none',
                restrictions: [...rowFilters, ...columnFilters]
            });
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Access request validated successfully', {
                userId: request.userId,
                resource: request.resource,
                authorized: true,
                executionTime
            });
            this.metrics.timing('security.access.validation.time', executionTime);
            this.metrics.increment('security.access.granted');
            return {
                authorized: true,
                maskedData,
                restrictions: [...rowFilters, ...columnFilters],
                auditTrail
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to validate access request', {
                error,
                userId: request.userId,
                resource: request.resource
            });
            this.metrics.increment('security.access.validation.failed');
            return {
                authorized: false,
                restrictions: ['validation_error'],
                auditTrail: await this.auditTrail.createTrail(request, 'ERROR')
            };
        }
    }
    async encryptData(data, classification, tenantId) {
        try {
            logger_1.logger.debug('Encrypting sensitive data', {
                classification: classification.level,
                tenantId
            });
            const result = await this.encryption.encrypt(data, {
                classification,
                tenantId,
                algorithm: this.selectEncryptionAlgorithm(classification)
            });
            this.metrics.increment('security.encryption.applied');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt data', { error, tenantId });
            this.metrics.increment('security.encryption.failed');
            throw error;
        }
    }
    async decryptData(encryptedData, keyId, userId, tenantId) {
        try {
            const authorized = await this.accessControl.validateDecryption(userId, tenantId, keyId);
            if (!authorized) {
                throw new Error('Unauthorized decryption attempt');
            }
            const decryptedData = await this.encryption.decrypt(encryptedData, keyId);
            await this.auditLogger.log({
                action: 'DATA_DECRYPTION',
                userId: userId || 'unknown',
                metadata: { tenantId, keyId },
                timestamp: new Date(),
                category: 'security',
                severity: 'medium'
            });
            this.metrics.increment('security.decryption.success');
            return decryptedData;
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt data', {
                error,
                userId,
                tenantId,
                keyId
            });
            this.metrics.increment('security.decryption.failed');
            throw error;
        }
    }
    async processGDPRRequest(request) {
        try {
            logger_1.logger.info('Processing GDPR data subject rights request', {
                type: request.type,
                subjectId: request.subjectId,
                tenantId: request.tenantId
            });
            const result = await this.gdprCompliance.processRequest(request);
            await this.auditLogger.log({
                action: 'GDPR_REQUEST_PROCESSED',
                userId: request.subjectId || 'unknown',
                metadata: { requestType: request.type, tenantId: request.tenantId, result: result.status },
                timestamp: new Date(),
                category: 'data',
                severity: 'medium'
            });
            this.metrics.increment('security.gdpr.requests.processed');
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to process GDPR request', {
                error,
                request
            });
            this.metrics.increment('security.gdpr.requests.failed');
            throw error;
        }
    }
    async generatePrivacyPreservingAnalytics(query, epsilon, tenantId) {
        try {
            logger_1.logger.debug('Generating privacy-preserving analytics', {
                epsilon,
                tenantId
            });
            const result = await this.privacyAnalytics.generateAnalytics(query, { epsilon, tenantId });
            await this.auditLogger.log({
                action: 'PRIVACY_ANALYTICS_GENERATED',
                userId: 'system',
                metadata: { tenantId, epsilon, privacyBudget: result.privacyBudget },
                timestamp: new Date(),
                category: 'data',
                severity: 'low'
            });
            this.metrics.increment('security.privacy.analytics.generated');
            this.metrics.gauge('security.privacy.budget.remaining', result.privacyBudget);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate privacy-preserving analytics', {
                error,
                tenantId
            });
            throw error;
        }
    }
    async generateComplianceReport(tenantId, timeRange) {
        try {
            logger_1.logger.info('Generating compliance report', {
                tenantId,
                timeRange
            });
            const [gdprReport, coppaReport, auditSummary, securityMetrics] = await Promise.all([
                this.gdprCompliance.generateReport({ tenantId, timeRange }),
                this.coppaCompliance.generateReport({ tenantId, timeRange }),
                this.auditTrail.generateSummary({ tenantId, timeRange }),
                this.getSecurityMetrics(tenantId, timeRange)
            ]);
            const complianceReport = {
                id: this.generateReportId(),
                framework: 'COMPREHENSIVE_COMPLIANCE',
                generated: new Date(),
                period: timeRange || {
                    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                },
                score: Math.min(95, (gdprReport.compliance?.score || 95) + (coppaReport.compliance?.score || 95)) / 2,
                status: 'compliant',
                findings: {
                    violations: Array.from(this.activeViolations.values()),
                    recommendations: await this.generateComplianceRecommendations(),
                    requirements: []
                },
                evidence: {
                    gdpr: gdprReport,
                    coppa: coppaReport,
                    audit: auditSummary,
                    security: securityMetrics
                },
                tenantId
            };
            this.metrics.increment('security.compliance.reports.generated');
            return complianceReport;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate compliance report', {
                error,
                tenantId
            });
            throw error;
        }
    }
    async detectThreats() {
        try {
            const threats = await this.threatDetection.detectThreats();
            let autoMitigated = 0;
            let manualReviewRequired = 0;
            for (const threat of threats) {
                if (threat.severity === 'high' || threat.severity === 'critical') {
                    manualReviewRequired++;
                    await this.createSecurityIncident(threat);
                }
                else {
                    await this.threatDetection.mitigateThreat(threat.id);
                    autoMitigated++;
                }
            }
            const results = {
                threatsDetected: threats.length,
                highPriorityThreats: threats.filter(t => t.severity === 'high' || t.severity === 'critical').length,
                autoMitigated,
                manualReviewRequired
            };
            logger_1.logger.info('Threat detection completed', results);
            this.metrics.gauge('security.threats.detected', results.threatsDetected);
            this.metrics.gauge('security.threats.high_priority', results.highPriorityThreats);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to detect threats', { error });
            throw error;
        }
    }
    async getHealthStatus() {
        try {
            const [rlsHealth, clsHealth, maskingHealth, encryptionHealth, auditHealth, gdprHealth, coppaHealth, classificationHealth, privacyHealth, zeroTrustHealth, accessHealth, threatHealth] = await Promise.all([
                this.rowLevelSecurity.getHealthStatus(),
                this.columnLevelSecurity.getHealthStatus(),
                this.dataMasking.getHealthStatus(),
                this.encryption.getHealthStatus(),
                this.auditTrail.getHealthStatus(),
                this.gdprCompliance.getHealthStatus(),
                this.coppaCompliance.getHealthStatus(),
                this.dataClassification.getHealthStatus(),
                this.privacyAnalytics.getHealthStatus(),
                this.zeroTrust.getHealthStatus(),
                this.accessControl.getHealthStatus(),
                this.threatDetection.getHealthStatus()
            ]);
            const components = {
                rowLevelSecurity: rlsHealth,
                columnLevelSecurity: clsHealth,
                dataMasking: maskingHealth,
                encryption: encryptionHealth,
                auditTrail: auditHealth,
                gdprCompliance: gdprHealth,
                coppaCompliance: coppaHealth,
                dataClassification: classificationHealth,
                privacyAnalytics: privacyHealth,
                zeroTrust: zeroTrustHealth,
                accessControl: accessHealth,
                threatDetection: threatHealth
            };
            const healthy = Object.values(components).every(comp => comp.healthy) && this.isInitialized;
            return {
                healthy,
                components,
                metrics: {
                    securityPolicies: this.securityPolicies.size,
                    complianceRules: this.complianceRules.size,
                    activeViolations: this.activeViolations.size,
                    dataClassifications: this.dataClassifications.size,
                    memoryUsage: process.memoryUsage().heapUsed,
                    uptime: process.uptime()
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting security health status', { error });
            return {
                healthy: false,
                components: {},
                metrics: {}
            };
        }
    }
    async checkCompliance(request, classification) {
        const violations = [];
        if (this.config.compliance.gdpr.enabled) {
            const gdprCompliant = await this.gdprCompliance.validateAccess(request.userId, classification.level || 'public');
            if (!gdprCompliant) {
                violations.push('GDPR access validation failed for user ' + request.userId);
            }
        }
        if (this.config.compliance.coppa.enabled) {
            const coppaCompliant = await this.coppaCompliance.validateAccess(request.userId, classification.level || 'public');
            if (!coppaCompliant) {
                violations.push('COPPA access validation failed - minor protection required for user ' + request.userId);
            }
        }
        return {
            compliant: violations.length === 0,
            violations
        };
    }
    selectEncryptionAlgorithm(classification) {
        switch (classification.level) {
            case 'public':
                return 'none';
            case 'internal':
                return 'AES-256-GCM';
            case 'confidential':
                return 'AES-256-GCM';
            case 'restricted':
                return 'ChaCha20-Poly1305';
            default:
                return 'AES-256-GCM';
        }
    }
    async recordSecurityViolation(violation) {
        const violationId = this.generateViolationId();
        this.activeViolations.set(violationId, {
            ...violation,
            id: violationId
        });
        await this.auditLogger.log({
            action: 'SECURITY_VIOLATION',
            userId: violation.userId || 'unknown',
            resource: violation.resource,
            metadata: { violationType: violation.type, reason: violation.reason },
            timestamp: violation.timestamp,
            category: 'security',
            severity: violation.severity
        });
        this.emit('security:violation', violation);
        this.metrics.increment('security.violations.recorded');
    }
    async createSecurityIncident(threat) {
        await this.auditLogger.log({
            action: 'SECURITY_INCIDENT_CREATED',
            userId: 'system',
            metadata: { threatId: threat.id, description: threat.description },
            timestamp: new Date(),
            category: 'security',
            severity: threat.severity
        });
        this.emit('security:incident', threat);
    }
    async loadSecurityPolicies() {
    }
    async loadComplianceRules() {
    }
    async loadDataClassifications() {
    }
    async getSecurityMetrics(_tenantId, _timeRange) {
        return {
            accessAttempts: this.metrics.getCounter("compliance.checks.passed") || 0 || 0,
            accessGranted: this.metrics.getCounter("compliance.checks.passed") || 0 || 0,
            accessDenied: this.metrics.getCounter("compliance.checks.passed") || 0 || 0,
            violations: this.metrics.getCounter("compliance.checks.passed") || 0 || 0,
            threatsDetected: this.metrics.getGauge("compliance.score") || 0 || 0,
            encryptionOperations: this.metrics.getCounter("compliance.checks.passed") || 0 || 0
        };
    }
    async generateComplianceRecommendations() {
        const recommendations = [];
        if (this.activeViolations.size > 0) {
            recommendations.push('Address active security violations');
        }
        if (this.metrics.getGauge("compliance.score") || 0 > 0) {
            recommendations.push('Review and mitigate detected security threats');
        }
        return recommendations;
    }
    generateReportId() {
        return `compliance_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateViolationId() {
        return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startSecurityMonitoring() {
        setInterval(() => {
            this.detectThreats();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.performComplianceChecks();
        }, 15 * 60 * 1000);
        setInterval(() => {
            this.collectSecurityMetrics();
        }, 60 * 1000);
    }
    async performComplianceChecks() {
        try {
            await Promise.all([
                this.gdprCompliance.performAutomaticChecks(),
                this.coppaCompliance.performAutomaticChecks()
            ]);
        }
        catch (error) {
            logger_1.logger.error('Error during compliance checks', { error });
        }
    }
    async collectSecurityMetrics() {
        try {
            const violations = this.activeViolations.size;
            const threats = await this.threatDetection.getActiveThreats();
            this.metrics.gauge('security.violations.active', violations);
            this.metrics.gauge('security.threats.active', threats.length);
        }
        catch (error) {
            logger_1.logger.error('Error collecting security metrics', { error });
        }
    }
    setupEventHandlers() {
        this.on('security:violation', (violation) => {
            logger_1.logger.warn('Security violation detected', { violation });
            this.metrics.increment('security.events.violation');
        });
        this.on('security:incident', (incident) => {
            logger_1.logger.error('Security incident created', { incident });
            this.metrics.increment('security.events.incident');
        });
        this.on('compliance:violation', (violation) => {
            logger_1.logger.warn('Compliance violation detected', { violation });
            this.metrics.increment('security.events.compliance.violation');
        });
        this.on('error', (error) => {
            logger_1.logger.error('Security framework error', { error });
            this.metrics.increment('security.errors.framework');
        });
    }
}
exports.SecurityComplianceFramework = SecurityComplianceFramework;
//# sourceMappingURL=compliance-framework.js.map