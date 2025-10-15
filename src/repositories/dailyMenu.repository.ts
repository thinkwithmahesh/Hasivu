/**
 * Daily Menu Repository
 * Data access layer for daily menu operations
 */

import { PrismaClient, DailyMenu } from '@prisma/client';

export class DailyMenuRepository {
  private static prisma: PrismaClient;

  static initialize() {
    if (!DailyMenuRepository.prisma) {
      DailyMenuRepository.prisma = new PrismaClient();
    }
  }

  constructor() {
    DailyMenuRepository.initialize();
  }

  static async findAll(schoolId?: string): Promise<DailyMenu[]> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.findMany({
      where: schoolId ? { menuPlan: { schoolId } } : {},
      orderBy: { date: 'desc' },
    });
  }

  static async findById(id: string): Promise<DailyMenu | null> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.findUnique({
      where: { id },
    });
  }

  static async findBySchool(schoolId: string): Promise<DailyMenu[]> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.findMany({
      where: { menuPlan: { schoolId } },
      orderBy: { date: 'desc' },
    });
  }

  static async findByDate(schoolId: string, date: Date): Promise<DailyMenu | null> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.findFirst({
      where: {
        menuPlan: { schoolId },
        date,
      },
    });
  }

  static async findByDateRange(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyMenu[]> {
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

  static async create(data: Omit<DailyMenu, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyMenu> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.create({
      data: data as any,
    });
  }

  static async update(id: string, data: Partial<DailyMenu>): Promise<DailyMenu> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<DailyMenu> {
    DailyMenuRepository.initialize();
    return await DailyMenuRepository.prisma.dailyMenu.delete({
      where: { id },
    });
  }

  static async getUpcoming(schoolId: string, limit: number = 7): Promise<DailyMenu[]> {
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

  static async findByIdWithItems(id: string): Promise<any> {
    DailyMenuRepository.initialize();
    // Simplified implementation - in real app would join with menu items
    return await DailyMenuRepository.findById(id);
  }

  static async findManyWithItems(filters: any): Promise<any[]> {
    DailyMenuRepository.initialize();
    // Simplified implementation - in real app would join with menu items
    return await DailyMenuRepository.findByDateRange(
      filters.schoolId,
      filters.dateFrom,
      filters.dateTo
    );
  }
}

export default DailyMenuRepository;
