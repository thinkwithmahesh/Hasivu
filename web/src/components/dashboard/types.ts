// Dashboard Type Definitions for HASIVU School Platform

export interface MealOrder {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  mealType: string;
  items: MealItem[];
  status: string;
  orderDate: string;
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
  grade: string;
  class: string;
  section: string;
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
