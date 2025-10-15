/**
 * Menu Plan Repository
 * Data access layer for menu plans
 */

import { PrismaClient, MenuPlan } from '@prisma/client';

export class MenuPlanRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(schoolId?: string): Promise<MenuPlan[]> {
    return await this.prisma.menuPlan.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<MenuPlan | null> {
    return await this.prisma.menuPlan.findUnique({
      where: { id },
    });
  }

  async findBySchool(schoolId: string): Promise<MenuPlan[]> {
    return await this.prisma.menuPlan.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(schoolId: string): Promise<MenuPlan[]> {
    return await this.prisma.menuPlan.findMany({
      where: {
        schoolId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<MenuPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuPlan> {
    return await this.prisma.menuPlan.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<MenuPlan>): Promise<MenuPlan> {
    return await this.prisma.menuPlan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<MenuPlan> {
    return await this.prisma.menuPlan.delete({
      where: { id },
    });
  }

  async activate(id: string): Promise<MenuPlan> {
    return await this.prisma.menuPlan.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async deactivate(id: string): Promise<MenuPlan> {
    return await this.prisma.menuPlan.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  static async findOverlapping(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string
  ): Promise<MenuPlan[]> {
    const prisma = new (await import('@prisma/client')).PrismaClient();
    const where: any = {
      schoolId,
      OR: [
        // Plan starts within the range
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Plan ends within the range
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Plan encompasses the entire range
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

  static async create(data: Omit<MenuPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuPlan> {
    const prisma = new PrismaClient();
    try {
      return await prisma.menuPlan.create({
        data: data as any,
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async findById(id: string): Promise<MenuPlan | null> {
    const prisma = new PrismaClient();
    try {
      return await prisma.menuPlan.findUnique({
        where: { id },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async update(id: string, data: Partial<MenuPlan>): Promise<MenuPlan> {
    const prisma = new PrismaClient();
    try {
      return await prisma.menuPlan.update({
        where: { id },
        data,
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async updateStatus(id: string, status: string): Promise<MenuPlan> {
    const prisma = new PrismaClient();
    try {
      return await prisma.menuPlan.update({
        where: { id },
        data: { status: status as any },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  static async getStatistics(schoolId?: string): Promise<any> {
    const prisma = new PrismaClient();
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
        byStatus: statusStats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count.status;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default MenuPlanRepository;
