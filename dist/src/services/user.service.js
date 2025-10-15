"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const client_1 = require("@prisma/client");
class UserService {
    static instance;
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
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
    async findAll(filters) {
        const where = {};
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.schoolId) {
            where.schoolId = filters.schoolId;
        }
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters?.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
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
    async bulkCreate(users) {
        const result = await this.prisma.user.createMany({
            data: users,
        });
        return result.count;
    }
    async getChildren(parentId) {
        return await this.prisma.user.findMany({
            where: {
                parentId,
                role: 'student',
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async addChild(parentId, childId) {
        return await this.prisma.user.update({
            where: { id: childId },
            data: { parentId },
        });
    }
    async removeChild(childId) {
        return await this.prisma.user.update({
            where: { id: childId },
            data: { parentId: null },
        });
    }
    async getUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                school: true,
                children: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async searchUsers(filters) {
        const where = {};
        if (filters.email)
            where.email = { contains: filters.email, mode: 'insensitive' };
        if (filters.role)
            where.role = filters.role;
        if (filters.schoolId)
            where.schoolId = filters.schoolId;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const users = await this.prisma.user.findMany({
            where,
            skip: ((filters.page || 1) - 1) * (filters.limit || 10),
            take: filters.limit || 10,
            include: { school: true },
        });
        const total = await this.prisma.user.count({ where });
        return { users, total, page: filters.page || 1, limit: filters.limit || 10 };
    }
    async bulkImportUsers(users) {
        const results = {
            success: [],
            failed: [],
        };
        for (const userData of users) {
            try {
                const user = await this.create(userData);
                results.success.push(user);
            }
            catch (error) {
                results.failed.push({ userData, error: error.message });
            }
        }
        return results;
    }
    async updateUser(userId, data) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data,
            include: { school: true },
        });
        return user;
    }
    async updateChildrenAssociations(parentId, childIds) {
        await this.prisma.user.update({
            where: { id: parentId },
            data: {
                children: {
                    set: childIds.map(id => ({ id })),
                },
            },
        });
        return { success: true };
    }
    async getUserAuditLogs(_userId) {
        return [];
    }
    async createUser(data) {
        return await this.create(data);
    }
    static async getUserById(userId) {
        return UserService.getInstance().getUserById(userId);
    }
    static async searchUsers(filters) {
        return UserService.getInstance().searchUsers(filters);
    }
    static async bulkImportUsers(users) {
        return UserService.getInstance().bulkImportUsers(users);
    }
    static async updateUser(userId, data) {
        return UserService.getInstance().updateUser(userId, data);
    }
    static async updateChildrenAssociations(parentId, childIds) {
        return UserService.getInstance().updateChildrenAssociations(parentId, childIds);
    }
    static async getUserAuditLogs(userId) {
        return UserService.getInstance().getUserAuditLogs(userId);
    }
    static async createUser(data) {
        return UserService.getInstance().createUser(data);
    }
    async createSchool(data) {
        return await this.prisma.school.create({
            data: data,
        });
    }
    static async createSchool(data) {
        return UserService.getInstance().createSchool(data);
    }
}
exports.UserService = UserService;
exports.userService = UserService.getInstance();
exports.default = UserService;
//# sourceMappingURL=user.service.js.map