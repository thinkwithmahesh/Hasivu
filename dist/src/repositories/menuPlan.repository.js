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
exports.MenuPlanRepository = void 0;
const client_1 = require("@prisma/client");
class MenuPlanRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findAll(schoolId) {
        return await this.prisma.menuPlan.findMany({
            where: schoolId ? { schoolId } : {},
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        return await this.prisma.menuPlan.findUnique({
            where: { id },
        });
    }
    async findBySchool(schoolId) {
        return await this.prisma.menuPlan.findMany({
            where: { schoolId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findActive(schoolId) {
        return await this.prisma.menuPlan.findMany({
            where: {
                schoolId,
                status: 'ACTIVE',
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.menuPlan.create({
            data: data,
        });
    }
    async update(id, data) {
        return await this.prisma.menuPlan.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await this.prisma.menuPlan.delete({
            where: { id },
        });
    }
    async activate(id) {
        return await this.prisma.menuPlan.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });
    }
    async deactivate(id) {
        return await this.prisma.menuPlan.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
    }
    static async findOverlapping(schoolId, startDate, endDate, excludeId) {
        const prisma = new (await Promise.resolve().then(() => __importStar(require('@prisma/client')))).PrismaClient();
        const where = {
            schoolId,
            OR: [
                {
                    startDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    endDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                {
                    AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }],
                },
            ],
        };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        return await prisma.menuPlan.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    static async create(data) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.menuPlan.create({
                data: data,
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async findById(id) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.menuPlan.findUnique({
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
            return await prisma.menuPlan.update({
                where: { id },
                data,
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async updateStatus(id, status) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.menuPlan.update({
                where: { id },
                data: { status: status },
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
    static async getStatistics(schoolId) {
        const prisma = new client_1.PrismaClient();
        try {
            const where = schoolId ? { schoolId } : {};
            const stats = await prisma.menuPlan.aggregate({
                where,
                _count: { id: true },
            });
            const statusStats = await prisma.menuPlan.groupBy({
                by: ['status'],
                where,
                _count: { status: true },
            });
            return {
                total: stats._count.id || 0,
                byStatus: statusStats.reduce((acc, stat) => {
                    acc[stat.status] = stat._count.status;
                    return acc;
                }, {}),
            };
        }
        finally {
            await prisma.$disconnect();
        }
    }
}
exports.MenuPlanRepository = MenuPlanRepository;
exports.default = MenuPlanRepository;
//# sourceMappingURL=menuPlan.repository.js.map