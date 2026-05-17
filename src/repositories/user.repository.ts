/**
 * User Repository
 * Data access layer for user operations
 */

import { PrismaClient, User } from '@prisma/client';

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(filters?: { role?: string; schoolId?: string }): Promise<User[]> {
    const where: any = {};

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

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findBySchool(schoolId: string): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRole(role: string): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await this.prisma.user.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async search(query: string): Promise<User[]> {
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

  static async findById(id: string): Promise<User | null> {
    const prisma = new PrismaClient();
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default UserRepository;
