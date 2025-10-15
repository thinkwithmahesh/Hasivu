// Data migration utility for HASIVU platform backend integration
import React from 'react';
import {
  kitchenApi,
  inventoryApi,
  staffApi,
  userApi,
  rfidApi as _rfidApi,
  menuApi,
  handleApiError,
} from '../services/api';

// Migration status tracking
interface MigrationStatus {
  completed: boolean;
  inProgress: boolean;
  error?: string;
  timestamp?: string;
  migratedEntities: {
    users: number;
    orders: number;
    inventory: number;
    staff: number;
    menus: number;
    rfidDevices: number;
  };
}

// Mock data interfaces (simplified versions for migration)
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'student' | 'parent';
  grade?: string;
  rfidTag?: string;
}

interface MockOrder {
  id: string;
  orderNumber: string;
  studentId: string;
  items: any[];
  status: string;
  priority: string;
  orderTime: string;
  totalAmount: number;
}

interface MockInventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  supplier: string;
  costPerUnit: number;
}

interface MockStaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
  shift: string;
}

// Data migration class
export class DataMigration {
  private migrationKey = 'hasivu_migration_status';

  // Get current migration status
  getMigrationStatus(): MigrationStatus {
    const stored = localStorage.getItem(this.migrationKey);
    return stored
      ? JSON.parse(stored)
      : {
          completed: false,
          inProgress: false,
          migratedEntities: {
            users: 0,
            orders: 0,
            inventory: 0,
            staff: 0,
            menus: 0,
            rfidDevices: 0,
          },
        };
  }

  // Update migration status
  private updateMigrationStatus(status: Partial<MigrationStatus>) {
    const current = this.getMigrationStatus();
    const updated = { ...current, ...status, timestamp: new Date().toISOString() };
    localStorage.setItem(this.migrationKey, JSON.stringify(updated));
  }

  // Check if backend is available
  async checkBackendAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Migrate users data
  async migrateUsers(mockUsers: MockUser[]): Promise<number> {
    let migratedCount = 0;

    for (const user of mockUsers) {
      try {
        await userApi.createUser({
          name: user.name,
          email: user.email,
          role: user.role,
          grade: user.grade,
          rfidTag: user.rfidTag,
          // Add default password for demo purposes
          password: 'defaultPassword123',
          active: true,
        });
        migratedCount++;
      } catch (error) {
        // Error handled silently
      }
    }

    return migratedCount;
  }

  // Migrate orders data
  async migrateOrders(mockOrders: MockOrder[]): Promise<number> {
    let migratedCount = 0;

    for (const order of mockOrders) {
      try {
        await kitchenApi.createOrder({
          orderNumber: order.orderNumber,
          studentId: order.studentId,
          items: order.items,
          status: order.status,
          priority: order.priority,
          orderTime: order.orderTime,
          totalAmount: order.totalAmount,
          location: 'Main Cafeteria', // Default location
        });
        migratedCount++;
      } catch (error) {
        // Error handled silently
      }
    }

    return migratedCount;
  }

  // Migrate inventory data
  async migrateInventory(mockInventory: MockInventoryItem[]): Promise<number> {
    let migratedCount = 0;

    for (const item of mockInventory) {
      try {
        await inventoryApi.createItem({
          name: item.name,
          category: item.category,
          currentStock: item.currentStock,
          minStock: item.minStock,
          maxStock: item.maxStock,
          unit: item.unit,
          supplier: item.supplier,
          costPerUnit: item.costPerUnit,
          description: `Migrated ${item.category.toLowerCase()} item`,
          active: true,
        });
        migratedCount++;
      } catch (error) {
        // Error handled silently
      }
    }

    return migratedCount;
  }

  // Migrate staff data
  async migrateStaff(mockStaff: MockStaffMember[]): Promise<number> {
    let migratedCount = 0;

    for (const staff of mockStaff) {
      try {
        await staffApi.createStaff({
          name: staff.name,
          role: staff.role,
          email: staff.email,
          department: staff.department,
          status: staff.status,
          shift: staff.shift,
          phone: '1234567890', // Default phone
          hireDate: new Date().toISOString(),
          active: true,
        });
        migratedCount++;
      } catch (error) {
        // Error handled silently
      }
    }

    return migratedCount;
  }

  // Migrate menu data
  async migrateMenus(mockMenus: any[]): Promise<number> {
    let migratedCount = 0;

    for (const menu of mockMenus) {
      try {
        await menuApi.createMenu({
          name: menu.name,
          description: menu.description,
          category: menu.category,
          date: menu.date,
          items: menu.items,
          active: menu.active || true,
          price: menu.price,
        });
        migratedCount++;
      } catch (error) {
        // Error handled silently
      }
    }

    return migratedCount;
  }

  // Complete migration process
  async runFullMigration(mockData: {
    users?: MockUser[];
    orders?: MockOrder[];
    inventory?: MockInventoryItem[];
    staff?: MockStaffMember[];
    menus?: any[];
  }): Promise<MigrationStatus> {
    // Check if migration already completed
    const status = this.getMigrationStatus();
    if (status.completed) {
      return status;
    }

    // Check backend availability
    const backendAvailable = await this.checkBackendAvailability();
    if (!backendAvailable) {
      const error = 'Backend is not available for migration';
      this.updateMigrationStatus({ error, inProgress: false });
      throw new Error(error);
    }

    // Start migration
    this.updateMigrationStatus({ inProgress: true, error: undefined });

    const migratedEntities = {
      users: 0,
      orders: 0,
      inventory: 0,
      staff: 0,
      menus: 0,
      rfidDevices: 0,
    };

    try {
      // Migrate users first (as they may be referenced by other entities)
      if (mockData.users) {
        migratedEntities.users = await this.migrateUsers(mockData.users);
      }

      // Migrate staff
      if (mockData.staff) {
        migratedEntities.staff = await this.migrateStaff(mockData.staff);
      }

      // Migrate inventory
      if (mockData.inventory) {
        migratedEntities.inventory = await this.migrateInventory(mockData.inventory);
      }

      // Migrate menus
      if (mockData.menus) {
        migratedEntities.menus = await this.migrateMenus(mockData.menus);
      }

      // Migrate orders last (as they may reference users and menu items)
      if (mockData.orders) {
        migratedEntities.orders = await this.migrateOrders(mockData.orders);
      }

      // Mark migration as completed
      const finalStatus = {
        completed: true,
        inProgress: false,
        migratedEntities,
        timestamp: new Date().toISOString(),
      };

      this.updateMigrationStatus(finalStatus);

      return this.getMigrationStatus();
    } catch (error) {
      const errorMessage = handleApiError(error);
      this.updateMigrationStatus({
        error: errorMessage,
        inProgress: false,
        migratedEntities,
      });
      throw new Error(`Migration failed: ${errorMessage}`);
    }
  }

  // Reset migration status (for re-migration or testing)
  resetMigrationStatus(): void {
    localStorage.removeItem(this.migrationKey);
  }

  // Validate migrated data
  async validateMigration(): Promise<{
    valid: boolean;
    issues: string[];
    summary: any;
  }> {
    const issues: string[] = [];
    const summary: any = {};

    try {
      // Check orders
      const ordersResponse = await kitchenApi.getOrders({ limit: 10 });
      summary.orders = ordersResponse.data?.length || 0;
      if (summary.orders === 0) {
        issues.push('No orders found in backend');
      }

      // Check inventory
      const inventoryResponse = await inventoryApi.getItems({ limit: 10 });
      summary.inventory = inventoryResponse.data?.length || 0;
      if (summary.inventory === 0) {
        issues.push('No inventory items found in backend');
      }

      // Check staff
      const staffResponse = await staffApi.getStaff({ limit: 10 });
      summary.staff = staffResponse.data?.length || 0;
      if (summary.staff === 0) {
        issues.push('No staff members found in backend');
      }
    } catch (error) {
      issues.push(`Validation failed: ${handleApiError(error)}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      summary,
    };
  }
}

// Utility functions for components
export const migrationUtils = {
  // Check if we should use mock data or backend data
  shouldUseMockData: (): boolean => {
    const migration = new DataMigration();
    const status = migration.getMigrationStatus();
    return !status.completed;
  },

  // Get migration progress for UI display
  getMigrationProgress: (): MigrationStatus => {
    const migration = new DataMigration();
    return migration.getMigrationStatus();
  },

  // Trigger migration from UI
  startMigration: async (mockData: any): Promise<void> => {
    const migration = new DataMigration();
    await migration.runFullMigration(mockData);
  },
};

// React hook for migration status
export const useMigrationStatus = () => {
  const [status, setStatus] = React.useState<MigrationStatus>(() => {
    const migration = new DataMigration();
    return migration.getMigrationStatus();
  });

  const checkStatus = () => {
    const migration = new DataMigration();
    setStatus(migration.getMigrationStatus());
  };

  const startMigration = async (mockData: any) => {
    const migration = new DataMigration();
    setStatus(migration.getMigrationStatus()); // Update to show in progress
    try {
      await migration.runFullMigration(mockData);
      checkStatus(); // Refresh status after completion
    } catch (error) {
      checkStatus(); // Refresh status to show error
      throw error;
    }
  };

  const resetMigration = () => {
    const migration = new DataMigration();
    migration.resetMigrationStatus();
    checkStatus();
  };

  return {
    status,
    checkStatus,
    startMigration,
    resetMigration,
    shouldUseMockData: !status.completed,
  };
};

export default DataMigration;
