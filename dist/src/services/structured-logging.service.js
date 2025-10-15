"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredLogger = exports.StructuredLoggingService = void 0;
const winston = __importStar(require("winston"));
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
const crypto = __importStar(require("crypto"));
class StructuredLoggingService {
    logger;
    cloudWatchLogs;
    logGroupName;
    context = {};
    constructor() {
        this.cloudWatchLogs = new aws_sdk_1.CloudWatchLogs({ region: process.env.AWS_REGION });
        this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/aws/lambda/hasivu-platform';
        this.initializeLogger();
    }
    initializeLogger() {
        const customFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
            const logEntry = {
                timestamp: info.timestamp,
                level: info.level,
                message: info.message,
                ...(info.meta && typeof info.meta === 'object' ? info.meta : {}),
                ...(info.stack ? { stack: info.stack } : {})
            };
            return JSON.stringify(logEntry);
        }));
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: customFormat,
            transports: [
                new winston.transports.Console(),
                ...(process.env.NODE_ENV === 'production' ? [
                    new winston.transports.File({ filename: '/tmp/app.log' })
                ] : [])
            ],
            exitOnError: false
        });
        this.logger.exceptions.handle(new winston.transports.Console({ format: customFormat }));
        this.logger.rejections.handle(new winston.transports.Console({ format: customFormat }));
    }
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    clearContext() {
        this.context = {};
    }
    generateRequestId() {
        const requestId = (0, uuid_1.v4)();
        this.setContext({ requestId });
        return requestId;
    }
    info(message, metadata) {
        this.logger.info(message, { meta: { ...metadata, context: this.context } });
    }
    warn(message, metadata) {
        this.logger.warn(message, { meta: { ...metadata, context: this.context } });
    }
    error(message, error, metadata) {
        this.logger.error(message, {
            meta: {
                ...metadata,
                error: error ? {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error.stack,
                    name: error.name
                } : undefined,
                context: this.context
            }
        });
    }
    debug(message, metadata) {
        this.logger.debug(message, { meta: { ...metadata, context: this.context } });
    }
    audit(entry) {
        const auditLog = {
            type: 'audit',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
            compliance: {
                gdprRelevant: this.isGDPRRelevant(entry),
                pciRelevant: this.isPCIRelevant(entry),
                retentionPeriod: this.getRetentionPeriod(entry)
            }
        };
        this.logger.info('Audit event', { meta: auditLog });
        this.sendToAuditStream(auditLog);
    }
    security(entry) {
        const securityLog = {
            type: 'security',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
            threatLevel: this.assessThreatLevel(entry),
            requiresInvestigation: entry.severity === 'critical' || entry.outcome === 'blocked'
        };
        this.logger.warn('Security event', { meta: securityLog });
        this.sendToSecurityStream(securityLog);
        if (entry.severity === 'critical') {
            this.triggerSecurityAlert(securityLog);
        }
    }
    performance(entry) {
        const performanceLog = {
            type: 'performance',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
            analysis: {
                grade: this.getPerformanceGrade(entry.duration),
                bottleneck: this.identifyBottleneck(entry.metadata),
                suggestion: this.suggestOptimization(entry)
            }
        };
        this.logger.info('Performance event', { meta: performanceLog });
        this.sendToPerformanceStream(performanceLog);
    }
    business(entry) {
        const businessLog = {
            type: 'business',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
            analytics: {
                impact: this.assessBusinessImpact(entry),
                category: entry.category,
                value: entry.value
            }
        };
        this.logger.info('Business event', { meta: businessLog });
        this.sendToBusinessStream(businessLog);
    }
    payment(transactionId, amount, currency, status, gateway, error) {
        const paymentLog = {
            type: 'payment',
            timestamp: new Date().toISOString(),
            transactionId: this.hashSensitiveData(transactionId),
            amount,
            currency,
            status,
            gateway,
            error: error ? {
                message: error instanceof Error ? error.message : String(error),
                code: error.code
            } : undefined,
            context: this.context,
            compliance: {
                pciCompliant: true,
                masked: true,
                retentionDays: 2555
            },
            analysis: {
                riskLevel: this.assessPaymentRisk(amount, status),
                gateway
            }
        };
        if (error || status === 'failed') {
            this.logger.error('Payment Transaction Failed', { meta: paymentLog });
        }
        else {
            this.logger.info('Payment Transaction', { meta: paymentLog });
        }
        this.sendToPaymentAuditStream(paymentLog);
    }
    rfidVerification(cardId, readerId, verificationStatus, duration, studentId, error) {
        const rfidLog = {
            type: 'rfid',
            timestamp: new Date().toISOString(),
            cardId: this.hashSensitiveData(cardId),
            readerId,
            verificationStatus,
            duration,
            studentId: studentId ? this.hashSensitiveData(studentId) : undefined,
            error: error ? {
                message: error instanceof Error ? error.message : String(error)
            } : undefined,
            context: this.context,
            analysis: {
                performanceGrade: this.getPerformanceGrade(duration),
                status: verificationStatus
            }
        };
        if (error || verificationStatus === 'failed') {
            this.logger.warn('RFID Verification Issue', { meta: rfidLog });
        }
        else {
            this.logger.info('RFID Verification', { meta: rfidLog });
        }
    }
    userActivity(userId, action, resource, metadata) {
        const activityLog = {
            type: 'user_activity',
            timestamp: new Date().toISOString(),
            userId: this.hashSensitiveData(userId),
            action,
            resource,
            metadata: this.sanitizeUserData(metadata || {}),
            context: this.context,
            analytics: {
                userSegment: this.determineUserSegment(userId),
                engagementScore: this.calculateEngagementScore(action),
                retentionImpact: this.assessRetentionImpact(action)
            }
        };
        this.logger.info('User Activity', { meta: activityLog });
        this.sendToUserAnalyticsStream(activityLog);
    }
    sanitizeUserData(data) {
        if (!data || typeof data !== 'object')
            return data;
        const sanitized = { ...data };
        const sensitiveFields = ['email', 'phone', 'address', 'creditCard', 'ssn'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                delete sanitized[field];
            }
        });
        return sanitized;
    }
    hashSensitiveData(data) {
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
    }
    isGDPRRelevant(entry) {
        return ['user_data', 'personal_info', 'profile'].some(keyword => entry.resource.toLowerCase().includes(keyword));
    }
    isPCIRelevant(entry) {
        return ['payment', 'card', 'transaction'].some(keyword => entry.resource.toLowerCase().includes(keyword));
    }
    getRetentionPeriod(entry) {
        if (this.isPCIRelevant(entry))
            return '7_years';
        if (this.isGDPRRelevant(entry))
            return '2_years';
        return '1_year';
    }
    assessThreatLevel(entry) {
        const levels = { low: 1, medium: 2, high: 3, critical: 4 };
        return entry.outcome === 'blocked' ? 'elevated' : entry.severity;
    }
    getPerformanceGrade(duration) {
        if (duration < 100)
            return 'A';
        if (duration < 500)
            return 'B';
        if (duration < 1000)
            return 'C';
        return 'D';
    }
    identifyBottleneck(metrics) {
        if (!metrics)
            return 'unknown';
        if (metrics.dbTime > 500)
            return 'database';
        if (metrics.networkTime > 200)
            return 'network';
        if (metrics.cpuUsage > 80)
            return 'cpu';
        return 'none';
    }
    suggestOptimization(entry) {
        const bottleneck = this.identifyBottleneck(entry.metadata);
        const suggestions = {
            database: 'Consider query optimization or caching',
            network: 'Implement request batching or CDN',
            cpu: 'Consider async processing or load balancing',
            none: 'Performance within acceptable range'
        };
        return suggestions[bottleneck] || 'Monitor performance trends';
    }
    assessBusinessImpact(entry) {
        if (entry.value && entry.value > 1000)
            return 'high';
        if (entry.category === 'conversion')
            return 'medium';
        return 'low';
    }
    assessPaymentRisk(amount, status) {
        if (status === 'failed')
            return 'high';
        if (amount > 10000)
            return 'medium';
        return 'low';
    }
    determineUserSegment(userId) {
        const hash = parseInt(this.hashSensitiveData(userId), 16);
        const segments = ['new', 'active', 'premium', 'at_risk'];
        return segments[hash % segments.length];
    }
    calculateEngagementScore(action) {
        const scores = {
            login: 2,
            purchase: 10,
            view: 1,
            share: 5,
            comment: 3
        };
        return scores[action] || 1;
    }
    assessRetentionImpact(action) {
        const highImpact = ['purchase', 'subscription', 'profile_complete'];
        const mediumImpact = ['share', 'comment', 'favorite'];
        if (highImpact.includes(action))
            return 'high';
        if (mediumImpact.includes(action))
            return 'medium';
        return 'low';
    }
    triggerSecurityAlert(securityLog) {
        console.warn('SECURITY ALERT:', securityLog);
    }
    async sendToAuditStream(auditLog) {
    }
    async sendToSecurityStream(securityLog) {
    }
    async sendToPerformanceStream(performanceLog) {
    }
    async sendToBusinessStream(businessLog) {
    }
    async sendToPaymentAuditStream(paymentLog) {
    }
    async sendToUserAnalyticsStream(activityLog) {
    }
}
exports.StructuredLoggingService = StructuredLoggingService;
exports.structuredLogger = new StructuredLoggingService();
//# sourceMappingURL=structured-logging.service.js.map