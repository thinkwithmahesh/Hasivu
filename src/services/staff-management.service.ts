/**
 * Staff Management Service
 * School-scoped staff availability and status derived from user and order data.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

const STAFF_ROLES = ['kitchen', 'kitchen_staff', 'staff', 'delivery_staff', 'school_admin'];

export class StaffManagementService {
  constructor(private readonly db: PrismaClient = defaultPrisma) {
    logger.info('StaffManagementService initialized');
  }

  async getStaffSchedule(schoolId?: string): Promise<any[]> {
    const staff = await this.getStaffUsers(schoolId);
    return staff.map(user => ({
      staffId: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      role: user.role,
      status: user.isActive ? 'available' : 'inactive',
      shift: 'day',
    }));
  }

  async updateStaffStatus(staffId: string, status: string): Promise<void> {
    await this.db.user.update({
      where: { id: staffId },
      data: { isActive: !['inactive', 'absent', 'suspended'].includes(status) },
    });
  }

  async getAvailableStaff(schoolId?: string): Promise<any[]> {
    const staff = await this.getStaffUsers(schoolId, true);
    return staff.map(user => ({
      id: user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      email: user.email,
      role: user.role,
      status: 'available',
    }));
  }

  async getCurrentStaffStatus(schoolId: string): Promise<any> {
    const [staff, assignedOrders] = await Promise.all([
      this.getStaffUsers(schoolId),
      this.db.order.count({
        where: {
          schoolId,
          assignedStaffId: { not: null },
          status: { in: ['pending', 'confirmed', 'preparing', 'ready'] },
        },
      }),
    ]);
    const present = staff.filter(user => user.isActive).length;
    const absent = staff.length - present;
    return {
      present,
      absent,
      onBreak: 0,
      assignedOrders,
      averageEfficiency: present === 0 ? 0 : Math.max(0, Math.min(100, 100 - assignedOrders * 3)),
    };
  }

  private getStaffUsers(schoolId?: string, activeOnly = false) {
    return this.db.user.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        role: { in: STAFF_ROLES },
        ...(activeOnly ? { isActive: true, status: 'ACTIVE' } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }],
    });
  }
}

const staffManagementServiceInstance = new StaffManagementService();
export const staffManagementService = staffManagementServiceInstance;
export const _staffManagementService = staffManagementServiceInstance;
export default staffManagementServiceInstance;
