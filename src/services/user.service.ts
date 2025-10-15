/**
 * User Service
 * Business logic for user management operations
 */

import { PrismaClient, User } from '@prisma/client';

export interface UserFilters {
  role?: string;
  schoolId?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  isActive?: boolean;
  schoolId?: string;
}

export interface UserSearchFilters {
  email?: string;
  role?: string;
  schoolId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserWithChildren extends User {
  children?: User[];
}

export class UserService {
  private static instance: UserService;
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
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

  async findAll(filters?: UserFilters): Promise<User[]> {
    const where: any = {};

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

  async bulkCreate(users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const result = await this.prisma.user.createMany({
      data: users as any[],
    });
    return result.count;
  }

  async getChildren(parentId: string): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: {
        parentId,
        role: 'student',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addChild(parentId: string, childId: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id: childId },
      data: { parentId },
    });
  }

  async removeChild(childId: string): Promise<User> {
    return await this.prisma.user.update({
      where: { id: childId },
      data: { parentId: null },
    });
  }

  async getUserById(userId: string): Promise<User> {
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

  async searchUsers(filters: UserSearchFilters): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {};

    if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' };
    if (filters.role) where.role = filters.role;
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
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

  async bulkImportUsers(users: CreateUserRequest[]): Promise<{
    success: User[];
    failed: Array<{ userData: CreateUserRequest; error: string }>;
  }> {
    const results = {
      success: [] as User[],
      failed: [] as Array<{ userData: CreateUserRequest; error: string }>,
    };

    for (const userData of users) {
      try {
        const user = await this.create(userData as any);
        results.success.push(user);
      } catch (error) {
        results.failed.push({ userData, error: (error as Error).message });
      }
    }

    return results;
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { school: true },
    });

    return user;
  }

  async updateChildrenAssociations(
    parentId: string,
    childIds: string[]
  ): Promise<{ success: boolean }> {
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

  async getUserAuditLogs(_userId: string): Promise<any[]> {
    // Implement audit log retrieval when audit log system is available
    return [];
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return await this.create(data as any);
  }

  // Static convenience methods that delegate to the singleton instance
  static async getUserById(userId: string): Promise<User> {
    return UserService.getInstance().getUserById(userId);
  }

  static async searchUsers(filters: UserSearchFilters): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    return UserService.getInstance().searchUsers(filters);
  }

  static async bulkImportUsers(users: CreateUserRequest[]): Promise<{
    success: User[];
    failed: Array<{ userData: CreateUserRequest; error: string }>;
  }> {
    return UserService.getInstance().bulkImportUsers(users);
  }

  static async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    return UserService.getInstance().updateUser(userId, data);
  }

  static async updateChildrenAssociations(
    parentId: string,
    childIds: string[]
  ): Promise<{ success: boolean }> {
    return UserService.getInstance().updateChildrenAssociations(parentId, childIds);
  }

  static async getUserAuditLogs(userId: string): Promise<any[]> {
    return UserService.getInstance().getUserAuditLogs(userId);
  }

  static async createUser(data: CreateUserRequest): Promise<User> {
    return UserService.getInstance().createUser(data);
  }

  async createSchool(data: any): Promise<any> {
    return await this.prisma.school.create({
      data: data as any,
    });
  }

  static async createSchool(data: any): Promise<any> {
    return UserService.getInstance().createSchool(data);
  }
}

export const userService = UserService.getInstance();
export default UserService;
