// Dashboard Type Definitions for HASIVU School Platform

export interface MealOrder {
  id: string;
  studentId: string;
  studentName: string;
  class?: string;
  section?: string;
  mealType: string;
  items: MealItem[];
  status: string;
  orderDate: string;
  pickupTime?: string;
  totalAmount: number;
  priority: string;
}

export interface MealItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  nutritionalInfo: NutritionalInfo;
  isVegetarian: boolean;
  allergens?: string[];
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

export interface Student {
  id: string;
  name: string;
  grade?: string;
  class: string;
  section: string;
  rollNumber?: string;
  avatar?: string;
  rfidCode?: string;
}

export interface SchoolAnalytics {
  totalStudents: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularMeals: PopularMeal[];
  nutritionCompliance: number;
  wasteReduction: number;
}

export interface PopularMeal {
  name: string;
  orders: number;
  revenue: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  supplier: string;
  expiryDate?: string;
  cost: number;
  status: string;
}

export interface KitchenOperation {
  id: string;
  operationType: string;
  description: string;
  assignedTo: string;
  startTime: string;
  estimatedDuration: number;
  status: string;
  priority: string;
}

export interface PaymentHistory {
  id: string;
  studentId: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  status: string;
  orderId?: string;
}

export interface WalletBalance {
  studentId: string;
  balance: number;
  lastUpdated: string;
  lowBalanceThreshold: number;
}

export interface SpendingAnalytics {
  studentId: string;
  period: string;
  data: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
  totalSpent: number;
  averagePerDay: number;
  trends: {
    direction: string;
    percentage: number;
  };
}

export interface DailyNutrition {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium?: number;
    sugar?: number;
  };
  goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  percentage: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  category: string;
}
