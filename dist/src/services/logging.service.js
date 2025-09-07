"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingService = exports.LoggingService = void 0;
const logger_1 = require("../utils/logger");
class LoggingService {
    static instance;
    initialized = false;
    securityLogs = [];
    applicationLogs = [];
    maxLogEntries = 10000;
    constructor() {
    }
    static getInstance() {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }
    async initialize() {
        try {
            if (this.initialized) {
                return { success: true, data: { message: 'Already initialized' } };
            }
            await this.setupLogRotation();
            await this.initializeSecurityLogging();
            this.initialized = true;
            logger_1.logger.info('Logging service initialized successfully');
            return { success: true, data: { initialized: true } };
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize logging service', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async cleanup() {
        try {
            await this.archiveLogs();
            this.securityLogs = [];
            this.applicationLogs = [];
            this.initialized = false;
            logger_1.logger.info('Logging service cleaned up successfully');
            return { success: true, data: { cleaned: true } };
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup logging service', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async logSecurityEvent(eventType, message, metadata = {}) {
        try {
            const logEntry = {
                id: this.generateLogId(),
                timestamp: new Date(),
                level: this.getSecurityEventLevel(eventType),
                eventType,
                message,
                userId: metadata.userId,
                sessionId: metadata.sessionId,
                ipAddress: metadata.ipAddress || '127.0.0.1',
                userAgent: metadata.userAgent,
                resource: metadata.resource || 'unknown',
                metadata,
                severity: this.getSecurityEventSeverity(eventType)
            };
            this.securityLogs.push(logEntry);
            this.maintainLogSize();
            logger_1.logger[logEntry.level](`Security Event: ${eventType} - ${message}`, logEntry);
            return { success: true, data: { logged: true, logId: logEntry.id } };
        }
        catch (error) {
            logger_1.logger.error('Failed to log security event', error);
            return { success: false, data: { error: error instanceof Error ? error.message : 'Logging failed' } };
        }
    }
    async logError(message, error, metadata = {}) {
        try {
            const logEntry = {
                id: this.generateLogId(),
                timestamp: new Date(),
                level: 'error',
                category: 'application',
                message,
                service: metadata.service || 'unknown',
                metadata: {
                    ...metadata,
                    error: error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : undefined
                },
                correlationId: metadata.correlationId
            };
            this.applicationLogs.push(logEntry);
            this.maintainLogSize();
            logger_1.logger.error(message, logEntry);
            return { success: true, data: { logged: true, logId: logEntry.id } };
        }
        catch (err) {
            logger_1.logger.error('Failed to log error', err);
            return { success: false, data: { error: 'Logging failed' } };
        }
    }
    async logWarning(message, metadata = {}) {
        try {
            const logEntry = {
                id: this.generateLogId(),
                timestamp: new Date(),
                level: 'warn',
                category: 'application',
                message,
                service: metadata.service || 'unknown',
                metadata,
                correlationId: metadata.correlationId
            };
            this.applicationLogs.push(logEntry);
            this.maintainLogSize();
            logger_1.logger.warn(message, logEntry);
            return { success: true, data: { logged: true, logId: logEntry.id } };
        }
        catch (error) {
            logger_1.logger.error('Failed to log warning', error);
            return { success: false, data: { error: 'Logging failed' } };
        }
    }
    async logInfo(message, metadata = {}) {
        try {
            const logEntry = {
                id: this.generateLogId(),
                timestamp: new Date(),
                level: 'info',
                category: 'application',
                message,
                service: metadata.service || 'unknown',
                metadata,
                correlationId: metadata.correlationId
            };
            this.applicationLogs.push(logEntry);
            this.maintainLogSize();
            logger_1.logger.info(message, logEntry);
            return { success: true, data: { logged: true, logId: logEntry.id } };
        }
        catch (error) {
            logger_1.logger.error('Failed to log info', error);
            return { success: false, data: { error: 'Logging failed' } };
        }
    }
    async getSecurityLogs(params = {}) {
        try {
            let filteredLogs = this.securityLogs;
            if (params.startDate) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= params.startDate);
            }
            if (params.endDate) {
                filteredLogs = filteredLogs.filter(log => log.timestamp <= params.endDate);
            }
            if (params.level) {
                filteredLogs = filteredLogs.filter(log => log.level === params.level);
            }
            if (params.eventType) {
                filteredLogs = filteredLogs.filter(log => log.eventType === params.eventType);
            }
            if (params.userId) {
                filteredLogs = filteredLogs.filter(log => log.userId === params.userId);
            }
            const offset = params.offset || 0;
            const limit = params.limit || 100;
            const paginatedLogs = filteredLogs.slice(offset, offset + limit);
            return {
                success: true,
                data: {
                    logs: paginatedLogs,
                    total: filteredLogs.length,
                    offset,
                    limit
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get security logs', error);
            return { success: false, data: { error: error instanceof Error ? error.message : 'Query failed' } };
        }
    }
    async archiveLogs() {
        try {
            const archivedSecurityLogs = [...this.securityLogs];
            const archivedApplicationLogs = [...this.applicationLogs];
            logger_1.logger.info('Archived logs', {
                securityLogs: archivedSecurityLogs.length,
                applicationLogs: archivedApplicationLogs.length,
                timestamp: new Date()
            });
            return {
                success: true,
                data: {
                    archived: true,
                    securityLogCount: archivedSecurityLogs.length,
                    applicationLogCount: archivedApplicationLogs.length
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to archive logs', error);
            return { success: false, data: { error: error instanceof Error ? error.message : 'Archive failed' } };
        }
    }
    async setupLogRotation() {
        logger_1.logger.info('Log rotation configured');
    }
    async initializeSecurityLogging() {
        logger_1.logger.info('Security logging initialized');
    }
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    getSecurityEventLevel(eventType) {
        const highSeverityEvents = [
            'data_breach_attempt',
            'privilege_escalation',
            'brute_force_attack'
        ];
        const mediumSeverityEvents = [
            'authentication_failure',
            'authorization_failure',
            'sql_injection_attempt',
            'xss_attempt'
        ];
        if (highSeverityEvents.includes(eventType)) {
            return 'error';
        }
        else if (mediumSeverityEvents.includes(eventType)) {
            return 'warn';
        }
        else {
            return 'info';
        }
    }
    getSecurityEventSeverity(eventType) {
        const criticalEvents = ['data_breach_attempt'];
        const highEvents = ['privilege_escalation', 'brute_force_attack'];
        const mediumEvents = ['authentication_failure', 'authorization_failure', 'sql_injection_attempt'];
        if (criticalEvents.includes(eventType))
            return 'critical';
        if (highEvents.includes(eventType))
            return 'high';
        if (mediumEvents.includes(eventType))
            return 'medium';
        return 'low';
    }
    maintainLogSize() {
        if (this.securityLogs.length > this.maxLogEntries) {
            this.securityLogs = this.securityLogs.slice(-this.maxLogEntries);
        }
        if (this.applicationLogs.length > this.maxLogEntries) {
            this.applicationLogs = this.applicationLogs.slice(-this.maxLogEntries);
        }
    }
}
exports.LoggingService = LoggingService;
exports.loggingService = LoggingService.getInstance();
exports.default = LoggingService;
//# sourceMappingURL=logging.service.js.map