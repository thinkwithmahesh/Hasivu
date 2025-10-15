// Menu-related type definitions for HASIVU platform

export interface MenuItemData {
  id?: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  nutritionalInfo?: any;
  allergens?: string[];
  ingredients?: string[];
  availability?: boolean;
  schoolId?: string;
}

export interface MenuPlanData {
  id?: string;
  name: string;
  description?: string;
  schoolId: string;
  startDate: Date;
  endDate: Date;
  menuItems?: MenuItemData[];
  isActive?: boolean;
}

export interface DailyMenuData {
  id?: string;
  date: Date;
  schoolId: string;
  menuPlanId?: string;
  menuItems: MenuItemData[];
  specialInstructions?: string;
  isPublished?: boolean;
}
