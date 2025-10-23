"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._invoiceService = exports.invoiceService = exports.InvoiceService = void 0;
const logger_1 = require("../utils/logger");
class InvoiceService {
    static instance;
    constructor() {
        logger_1.logger.info('InvoiceService initialized (stub)');
    }
    static getInstance() {
        if (!InvoiceService.instance) {
            InvoiceService.instance = new InvoiceService();
        }
        return InvoiceService.instance;
    }
    async generateInvoice(orderId) {
        logger_1.logger.info(`Generated invoice for order ${orderId}`);
        return {
            invoiceId: `inv-${orderId}`,
            orderId,
            amount: 100,
            status: 'generated',
            createdAt: new Date(),
        };
    }
    async getInvoice(invoiceId) {
        return {
            invoiceId,
            orderId: 'order-123',
            amount: 100,
            status: 'generated',
            createdAt: new Date(),
        };
    }
}
exports.InvoiceService = InvoiceService;
const invoiceServiceInstance = new InvoiceService();
exports.invoiceService = invoiceServiceInstance;
exports._invoiceService = invoiceServiceInstance;
exports.default = invoiceServiceInstance;
//# sourceMappingURL=invoice.service.js.map