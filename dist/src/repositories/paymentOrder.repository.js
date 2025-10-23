"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentOrderRepository = void 0;
const client_1 = require("@prisma/client");
class PaymentOrderRepository {
    static instance;
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!PaymentOrderRepository.instance) {
            PaymentOrderRepository.instance = new PaymentOrderRepository();
        }
        return PaymentOrderRepository.instance;
    }
    async findAll() {
        return [];
    }
    async findById(_id) {
        return null;
    }
    async findByPayment(_paymentId) {
        return [];
    }
    async findByOrder(_orderId) {
        return [];
    }
    async create(data) {
        return {
            id: `po_${Date.now()}`,
            paymentId: data.paymentId,
            orderId: data.orderId,
            amount: data.amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    static async create(data) {
        return await this.getInstance().prisma.paymentOrder.create({
            data: data,
        });
    }
    static async findByOrderId(orderId) {
        return await this.getInstance().prisma.paymentOrder.findFirst({
            where: { orderId },
        });
    }
    static async update(id, data) {
        return await this.getInstance().prisma.paymentOrder.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return {
            id,
            paymentId: '',
            orderId: '',
            amount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
}
exports.PaymentOrderRepository = PaymentOrderRepository;
exports.default = PaymentOrderRepository;
//# sourceMappingURL=paymentOrder.repository.js.map