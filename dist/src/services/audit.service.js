"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._auditService = exports.auditService = exports.AuditService = void 0;
const logger_1 = require("../utils/logger");
class AuditService {
    static instance;
    constructor() {
        logger_1.logger.info('AuditService initialized (stub)');
    }
    static getInstance() {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }
    async logActivity(userId, action, details) {
        logger_1.logger.info(`Audit log: User ${userId} performed ${action}`, details);
    }
    async log(userId, action, details) {
        return this.logActivity(userId, action, details);
    }
    async getAuditLogs(userId) {
        return [
            {
                id: 'audit-1',
                userId: userId || 'user-123',
                action: 'login',
                timestamp: new Date(),
                details: { ip: '127.0.0.1' },
            },
        ];
    }
}
exports.AuditService = AuditService;
const auditServiceInstance = new AuditService();
exports.auditService = auditServiceInstance;
exports._auditService = auditServiceInstance;
exports.default = auditServiceInstance;
//# sourceMappingURL=audit.service.js.map