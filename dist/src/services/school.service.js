"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolService = exports.SchoolService = void 0;
const client_1 = require("@prisma/client");
class SchoolService {
    static instance;
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!SchoolService.instance) {
            SchoolService.instance = new SchoolService();
        }
        return SchoolService.instance;
    }
    async findById(id) {
        return await this.prisma.school.findUnique({
            where: { id },
        });
    }
    async findAll(filters) {
        const where = {};
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { city: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return await this.prisma.school.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return await this.prisma.school.create({
            data: data,
        });
    }
    async update(id, data) {
        return await this.prisma.school.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return await this.prisma.school.delete({
            where: { id },
        });
    }
    async createSchool(data) {
        return await this.create(data);
    }
    static async findById(id) {
        return SchoolService.getInstance().findById(id);
    }
    static async findAll(filters) {
        return SchoolService.getInstance().findAll(filters);
    }
    static async create(data) {
        return SchoolService.getInstance().create(data);
    }
    static async update(id, data) {
        return SchoolService.getInstance().update(id, data);
    }
    static async delete(id) {
        return SchoolService.getInstance().delete(id);
    }
    static async createSchool(data) {
        return SchoolService.getInstance().createSchool(data);
    }
}
exports.SchoolService = SchoolService;
exports.schoolService = SchoolService.getInstance();
exports.default = SchoolService;
//# sourceMappingURL=school.service.js.map