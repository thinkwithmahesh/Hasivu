"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItemRepository = void 0;
const client_1 = require("@prisma/client");
class OrderItemRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findAll(orderId) {
        return await this.prisma.orderItem.findMany({
            where: orderId ? { orderId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        return await this.prisma.orderItem.findUnique({
            where: { id },
        });
    }
    async findByOrder(orderId) {
        return await this.prisma.orderItem.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findByMenuItem(menuItemId) {
        return await this.prisma.orderItem.findMany({
            where: { menuItemId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.orderItem.create({
            data: data,
        });
    }
    async update(id, data) {
        return await this.prisma.orderItem.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await this.prisma.orderItem.delete({
            where: { id },
        });
    }
    async deleteByOrder(orderId) {
        const result = await this.prisma.orderItem.deleteMany({
            where: { orderId },
        });
        return result.count;
    }
    async getOrderTotal(orderId) {
        const items = await this.findByOrder(orderId);
        return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    }
    static async getPopularItems(_query) {
        return [
            {
                menuItemId: 'item-1',
                menuItemName: 'Popular Meal',
                totalQuantity: 120,
                orderCount: 45,
                revenue: 18000,
            },
            {
                menuItemId: 'item-2',
                menuItemName: 'Favorite Snack',
                totalQuantity: 80,
                orderCount: 30,
                revenue: 6000,
            },
        ];
    }
}
exports.OrderItemRepository = OrderItemRepository;
exports.default = OrderItemRepository;
//# sourceMappingURL=orderItem.repository.js.map