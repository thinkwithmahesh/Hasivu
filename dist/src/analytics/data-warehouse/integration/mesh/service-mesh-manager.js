"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceMeshManager = void 0;
const logger_1 = require("../../../../shared/utils/logger");
class ServiceMeshManager {
    constructor(_config) {
        logger_1.logger.info('ServiceMeshManager initialized');
    }
    async start() {
        logger_1.logger.info('ServiceMeshManager started');
    }
    async stop() {
        logger_1.logger.info('ServiceMeshManager stopped');
    }
}
exports.ServiceMeshManager = ServiceMeshManager;
exports.default = ServiceMeshManager;
//# sourceMappingURL=service-mesh-manager.js.map