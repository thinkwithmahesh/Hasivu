"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._menuService = exports.menuService = exports.MenuService = void 0;
const logger_1 = require("../utils/logger");
class MenuService {
    constructor() {
        logger_1.logger.info('MenuService initialized (stub)');
    }
    async getMenuItems() {
        return [];
    }
    async createMenuItem(item) {
        logger_1.logger.info('Menu item created', { item });
        return { id: 'stub', ...item };
    }
    async updateMenuItem(id, updates) {
        logger_1.logger.info(`Menu item ${id} updated`, { updates });
    }
    async deleteMenuItem(id) {
        logger_1.logger.info(`Menu item ${id} deleted`);
    }
    async getMenuByCategory(_category) {
        return [];
    }
}
exports.MenuService = MenuService;
const menuServiceInstance = new MenuService();
exports.menuService = menuServiceInstance;
exports._menuService = menuServiceInstance;
exports.default = menuServiceInstance;
//# sourceMappingURL=menu.service.js.map