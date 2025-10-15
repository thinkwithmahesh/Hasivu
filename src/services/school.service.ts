/**
 * School Service
 * Business logic for school management operations
 */

import { PrismaClient, School } from '@prisma/client';

export interface SchoolFilters {
  search?: string;
  isActive?: boolean;
}

export interface CreateSchoolRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  settings?: any;
}

export interface UpdateSchoolRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  settings?: any;
  isActive?: boolean;
}

export class SchoolService {
  private static instance: SchoolService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): SchoolService {
    if (!SchoolService.instance) {
      SchoolService.instance = new SchoolService();
    }
    return SchoolService.instance;
  }

  async findById(id: string): Promise<School | null> {
    return await this.prisma.school.findUnique({
      where: { id },
    });
  }

  async findAll(filters?: SchoolFilters): Promise<School[]> {
    const where: any = {};

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

  async create(data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School> {
    return await this.prisma.school.create({
      data: data as any,
    });
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    return await this.prisma.school.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<School> {
    return await this.prisma.school.delete({
      where: { id },
    });
  }

  async createSchool(data: CreateSchoolRequest): Promise<School> {
    return await this.create(data as any);
  }

  // Static convenience methods that delegate to the singleton instance
  static async findById(id: string): Promise<School | null> {
    return SchoolService.getInstance().findById(id);
  }

  static async findAll(filters?: SchoolFilters): Promise<School[]> {
    return SchoolService.getInstance().findAll(filters);
  }

  static async create(data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School> {
    return SchoolService.getInstance().create(data);
  }

  static async update(id: string, data: Partial<School>): Promise<School> {
    return SchoolService.getInstance().update(id, data);
  }

  static async delete(id: string): Promise<School> {
    return SchoolService.getInstance().delete(id);
  }

  static async createSchool(data: CreateSchoolRequest): Promise<School> {
    return SchoolService.getInstance().createSchool(data);
  }
}

export const schoolService = SchoolService.getInstance();
export default SchoolService;
