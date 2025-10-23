"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._walletService = exports.walletService = exports.WalletService = void 0;
const logger_1 = require("../utils/logger");
class WalletService {
    constructor() {
        logger_1.logger.info('WalletService initialized (stub)');
    }
    async getBalance(_userId) {
        return 0;
    }
    async addFunds(_userId, amount) {
        logger_1.logger.info(`Added ${amount} to wallet for user ${_userId}`);
        return { userId: _userId, amount, balance: amount, timestamp: new Date() };
    }
    async deductFunds(_userId, amount) {
        logger_1.logger.info(`Deducted ${amount} from wallet for user ${_userId}`);
        return { userId: _userId, amount, balance: 0, timestamp: new Date() };
    }
    async getTransactionHistory(_userId) {
        return [];
    }
    async validateSufficientFunds(_userId, _amount) {
        return true;
    }
}
exports.WalletService = WalletService;
const walletServiceInstance = new WalletService();
exports.walletService = walletServiceInstance;
exports._walletService = walletServiceInstance;
exports.default = walletServiceInstance;
//# sourceMappingURL=wallet.service.js.map