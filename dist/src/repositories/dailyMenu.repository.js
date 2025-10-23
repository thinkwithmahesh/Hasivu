"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyMenuRepository = void 0;
const client_1 = require("@prisma/client");
class DailyMenuRepository {
    static prisma;
    static initialize() {
        if (!DailyMenuRepository.prisma) {
            DailyMenuRepository.prisma = new client_1.PrismaClient();
        }
    }
    constructor() {
        DailyMenuRepository.initialize();
    }
    static async findAll(schoolId) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findMany({
            where: schoolId ? { menuPlan: { schoolId } } : {},
            orderBy: { date: 'desc' },
        });
    }
    static async findById(id) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findUnique({
            where: { id },
        });
    }
    static async findBySchool(schoolId) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findMany({
            where: { menuPlan: { schoolId } },
            orderBy: { date: 'desc' },
        });
    }
    static async findByDate(schoolId, date) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findFirst({
            where: {
                menuPlan: { schoolId },
                date,
            },
        });
    }
    static async findByDateRange(schoolId, startDate, endDate) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findMany({
            where: {
                menuPlan: { schoolId },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'asc' },
        });
    }
    static async create(data) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.create({
            data: data,
        });
    }
    static async update(id, data) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.update({
            where: { id },
            data,
        });
    }
    static async delete(id) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.delete({
            where: { id },
        });
    }
    static async getUpcoming(schoolId, limit = 7) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.prisma.dailyMenu.findMany({
            where: {
                menuPlan: { schoolId },
                date: {
                    gte: new Date(),
                },
            },
            orderBy: { date: 'asc' },
            take: limit,
        });
    }
    static async findByIdWithItems(id) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.findById(id);
    }
    static async findManyWithItems(filters) {
        DailyMenuRepository.initialize();
        return await DailyMenuRepository.findByDateRange(filters.schoolId, filters.dateFrom, filters.dateTo);
    }
}
exports.DailyMenuRepository = DailyMenuRepository;
exports.default = DailyMenuRepository;
//# sourceMappingURL=dailyMenu.repository.js.map