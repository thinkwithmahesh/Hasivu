"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitor = void 0;
const logger_1 = require("../../../../shared/utils/logger");
class HealthMonitor {
    constructor(_config) {
        logger_1.logger.info('HealthMonitor initialized');
    }
    async checkHealth() {
        return { status: 'healthy' };
    }
}
exports.HealthMonitor = HealthMonitor;
exports.default = HealthMonitor;
//# sourceMappingURL=health-monitor.js.map