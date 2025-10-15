"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._webSocketService = exports.webSocketService = exports.WebSocketService = void 0;
const logger_1 = require("../utils/logger");
class WebSocketService {
    constructor() {
        logger_1.logger.info('WebSocketService initialized (stub)');
    }
    async broadcast(event, data) {
        logger_1.logger.info(`Broadcasting ${event} event`, { data });
    }
    async sendToUser(userId, event, data) {
        logger_1.logger.info(`Sending ${event} to user ${userId}`, { data });
    }
    async getConnectedUsers() {
        return [];
    }
    async emitToKitchen(schoolId, event, data) {
        logger_1.logger.info(`Emitting ${event} to kitchen ${schoolId}`, { data });
    }
    async emitToUser(userId, event, data) {
        logger_1.logger.info(`Emitting ${event} to user ${userId}`, { data });
    }
    async emitToSchool(schoolId, event, data) {
        logger_1.logger.info(`Emitting ${event} to school ${schoolId}`, { data });
    }
}
exports.WebSocketService = WebSocketService;
const webSocketServiceInstance = new WebSocketService();
exports.webSocketService = webSocketServiceInstance;
exports._webSocketService = webSocketServiceInstance;
exports.default = webSocketServiceInstance;
//# sourceMappingURL=websocket.service.js.map