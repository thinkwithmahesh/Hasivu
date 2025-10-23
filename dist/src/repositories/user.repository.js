"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const client_1 = require("@prisma/client");
class UserRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findAll(filters) {
        const where = {};
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.schoolId) {
            where.schoolId = filters.schoolId;
        }
        return await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        return await this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findBySchool(schoolId) {
        return await this.prisma.user.findMany({
            where: { schoolId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByRole(role) {
        return await this.prisma.user.findMany({
            where: { role },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.user.create({
            data: data,
        });
    }
    async update(id, data) {
        return await this.prisma.user.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await this.prisma.user.delete({
            where: { id },
        });
    }
    async search(query) {
        return await this.prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query } },
                    { firstName: { contains: query } },
                    { lastName: { contains: query } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async findById(id) {
        const prisma = new client_1.PrismaClient();
        try {
            return await prisma.user.findUnique({
                where: { id },
            });
        }
        finally {
            await prisma.$disconnect();
        }
    }
}
exports.UserRepository = UserRepository;
exports.default = UserRepository;
//# sourceMappingURL=user.repository.js.map