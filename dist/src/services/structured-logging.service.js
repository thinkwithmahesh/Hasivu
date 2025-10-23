"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredLogger = exports.StructuredLoggingService = void 0;
class StructuredLoggingService {
    context = {};
    constructor() {
    }
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    clearContext() {
        this.context = {};
    }
    generateRequestId() {
        const requestId = Math.random().toString(36).substr(2, 9);
        this.setContext({ requestId });
        return requestId;
    }
    info(message, metadata) {
        console.info(`[INFO] ${message}`, { ...metadata, context: this.context });
    }
    warn(message, metadata) {
        console.warn(`[WARN] ${message}`, { ...metadata, context: this.context });
    }
    error(message, error, metadata) {
        console.error(`[ERROR] ${message}`, {
            ...metadata,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                }
                : undefined,
            context: this.context,
        });
    }
    debug(message, metadata) {
        console.debug(`[DEBUG] ${message}`, { ...metadata, context: this.context });
    }
    audit(entry) {
        const auditLog = {
            type: 'audit',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
        };
        console.info('[AUDIT]', auditLog);
    }
    security(entry) {
        const securityLog = {
            type: 'security',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
        };
        console.warn('[SECURITY]', securityLog);
    }
    performance(entry) {
        const performanceLog = {
            type: 'performance',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
        };
        console.info('[PERFORMANCE]', performanceLog);
    }
    business(entry) {
        const businessLog = {
            type: 'business',
            timestamp: new Date().toISOString(),
            ...entry,
            context: { ...this.context, ...entry.context },
        };
        console.info('[BUSINESS]', businessLog);
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
            error: error
                ? {
                    message: error.message,
                    code: error.code,
                }
                : undefined,
            context: this.context,
        };
        if (error || status === 'failed') {
            console.error('[PAYMENT FAILED]', paymentLog);
        }
        else {
            console.info('[PAYMENT]', paymentLog);
        }
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
            error: error
                ? {
                    message: error.message,
                }
                : undefined,
            context: this.context,
        };
        if (error || verificationStatus === 'failed') {
            console.warn('[RFID ISSUE]', rfidLog);
        }
        else {
            console.info('[RFID]', rfidLog);
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
        };
        console.info('[USER ACTIVITY]', activityLog);
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
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).substring(0, 8);
    }
}
exports.StructuredLoggingService = StructuredLoggingService;
exports.structuredLogger = new StructuredLoggingService();
//# sourceMappingURL=structured-logging.service.js.map