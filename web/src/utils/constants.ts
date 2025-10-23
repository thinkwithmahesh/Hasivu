// Re-export UserRole from auth types for backward compatibility
export { UserRole } from '@/types/auth';

// Default export for backward compatibility
export default {
  MEAL_TYPES: [
    { id: 'breakfast', label: 'Breakfast', icon: '☕' },
    { id: 'lunch', label: 'Lunch', icon: '🍽️' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
    { id: 'snack', label: 'Snacks', icon: '🍪' },
  ],
  DIETARY_PREFERENCES: [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍖' },
    { id: 'jain', label: 'Jain', icon: '🕉️' },
    { id: 'eggetarian', label: 'Eggetarian', icon: '🥚' },
    { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
    { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
  ],
  SPICE_LEVELS: [
    { id: 'mild', label: 'Mild', icon: '😌', color: 'green' },
    { id: 'medium', label: 'Medium', icon: '😊', color: 'yellow' },
    { id: 'spicy', label: 'Spicy', icon: '🔥', color: 'orange' },
    { id: 'very-spicy', label: 'Very Spicy', icon: '🌶️', color: 'red' },
  ],
};

// Meal type constants
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '☕' },
  { id: 'lunch', label: 'Lunch', icon: '🍽️' },
  { id: 'dinner', label: 'Dinner', icon: '🌙' },
  { id: 'snack', label: 'Snacks', icon: '🍪' },
] as const;

// Dietary preference constants
export const DIETARY_PREFERENCES = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍖' },
  { id: 'jain', label: 'Jain', icon: '🕉️' },
  { id: 'eggetarian', label: 'Eggetarian', icon: '🥚' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { id: 'nut-free', label: 'Nut-Free', icon: '🥜' },
] as const;

// Spice level constants
export const SPICE_LEVELS = [
  { id: 'mild', label: 'Mild', icon: '😌', color: 'green' },
  { id: 'medium', label: 'Medium', icon: '😊', color: 'yellow' },
  { id: 'spicy', label: 'Spicy', icon: '🔥', color: 'orange' },
  { id: 'very-spicy', label: 'Very Spicy', icon: '🌶️', color: 'red' },
] as const;

// Type exports for the constants
export type MealType = (typeof MEAL_TYPES)[number]['id'];
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number]['id'];
export type SpiceLevel = (typeof SPICE_LEVELS)[number]['id'];
