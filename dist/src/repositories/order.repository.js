"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const client_1 = require("@prisma/client");
class OrderRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findAll(schoolId) {
        return await this.prisma.order.findMany({
            where: schoolId ? { schoolId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        return await this.prisma.order.findUnique({
            where: { id },
        });
    }
    async findBySchool(schoolId) {
        return await this.prisma.order.findMany({
            where: { schoolId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByStudent(studentId) {
        return await this.prisma.order.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByStatus(schoolId, status) {
        return await this.prisma.order.findMany({
            where: {
                schoolId,
                status,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByDateRange(schoolId, startDate, endDate) {
        return await this.prisma.order.findMany({
            where: {
                schoolId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.order.create({
            data: data,
        });
    }
    async update(id, data) {
        return await this.prisma.order.update({
            where: { id },
            data,
        });
    }
    async updateStatus(id, status) {
        return await this.prisma.order.update({
            where: { id },
            data: { status },
        });
    }
    async delete(id) {
        return await this.prisma.order.delete({
            where: { id },
        });
    }
    async getPendingOrders(schoolId) {
        return await this.prisma.order.findMany({
            where: {
                schoolId,
                status: 'pending',
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getActiveOrders(schoolId) {
        return await this.prisma.order.findMany({
            where: {
                schoolId,
                status: {
                    in: ['pending', 'confirmed', 'preparing'],
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findByIdWithIncludes(id, include) {
        return await this.prisma.order.findUnique({
            where: { id },
            include: include || {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
                deliveryVerifications: true,
            },
        });
    }
    static async findByIdWithIncludes(id, include) {
        const prisma = new (await Promise.resolve().then(() => __importStar(require('@prisma/client')))).PrismaClient();
        return await prisma.order.findUnique({
            where: { id },
            include: include || {
                orderItems: {
                    include: {
                        menuItem: true,
                    },
                },
                deliveryVerifications: true,
            },
        });
    }
    static async findById(id) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.order.findUnique({
                where: { id },
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async update(id, data) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.order.update({
                where: { id },
                data,
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async findMany(options) {
        const prisma = new client_1.PrismaClient();
        try {
            const where = {};
            if (options.filters?.studentId) {
                where.studentId = options.filters.studentId;
            }
            if (options.filters?.status) {
                where.status = options.filters.status;
            }
            if (options.filters?.schoolId) {
                where.schoolId = options.filters.schoolId;
            }
            const [items, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    skip: options.skip || 0,
                    take: options.take || 10,
                    orderBy: { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' },
                }),
                prisma.order.count({ where }),
            ]);
            return { items, total };
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async count(filters) {
        const prisma = new client_1.PrismaClient();
        try {
            const where = {};
            if (filters?.studentId) {
                where.studentId = filters.studentId;
            }
            if (filters?.status) {
                where.status = filters.status;
            }
            if (filters?.schoolId) {
                where.schoolId = filters.schoolId;
            }
            return await prisma.order.count({ where });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async getAnalytics(schoolId, startDate, endDate) {
        const prisma = new client_1.PrismaClient();
        try {
            const where = { schoolId };
            if (startDate && endDate) {
                where.createdAt = {
                    gte: startDate,
                    lte: endDate,
                };
            }
            const orders = await prisma.order.findMany({ where });
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
            const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
            const ordersByStatus = {};
            orders.forEach(order => {
                ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
            });
            const revenueByDay = [];
            const dailyRevenue = {};
            orders.forEach(order => {
                const date = order.createdAt.toISOString().split('T')[0];
                dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
            });
            Object.entries(dailyRevenue).forEach(([date, revenue]) => {
                revenueByDay.push({ date, revenue });
            });
            return {
                totalOrders,
                totalRevenue,
                deliveredOrders,
                cancelledOrders,
                ordersByStatus,
                revenueByDay,
            };
        }
        finally {
            await prisma.$disconnect();
        }
    }
    async findMany(options) {
        const where = {};
        if (options.filters?.studentId) {
            where.studentId = options.filters.studentId;
        }
        if (options.filters?.status) {
            where.status = options.filters.status;
        }
        const [items, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip: options.skip || 0,
                take: options.take || 10,
                orderBy: { [options.sortBy || 'createdAt']: options.sortOrder || 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { items, total };
    }
    async count(filters) {
        const where = {};
        if (filters?.studentId) {
            where.studentId = filters.studentId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        return await this.prisma.order.count({ where });
    }
    async getAnalytics(schoolId, startDate, endDate) {
        const where = { schoolId };
        if (startDate && endDate) {
            where.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }
        const orders = await this.prisma.order.findMany({ where });
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        const ordersByStatus = {};
        orders.forEach(order => {
            ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
        });
        const revenueByDay = [];
        const dailyRevenue = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
        });
        Object.entries(dailyRevenue).forEach(([date, revenue]) => {
            revenueByDay.push({ date, revenue });
        });
        return {
            totalOrders,
            totalRevenue,
            deliveredOrders,
            cancelledOrders,
            ordersByStatus,
            revenueByDay,
        };
    }
}
exports.OrderRepository = OrderRepository;
exports.default = OrderRepository;
//# sourceMappingURL=order.repository.js.map