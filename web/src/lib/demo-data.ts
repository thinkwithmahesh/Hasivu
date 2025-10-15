 * Demo data for HASIVU Platform dashboards
 * This file contains comprehensive mock data for testing all dashboard functionalities
export const _demoSchool =  {}
  // Student demo data
export const demoStudents 
  // Parent demo data
export const _demoParents =  []
    ]
];
  // Admin demo data
export const _demoAdmins =  []
];
  // Kitchen staff demo data
export const _demoKitchenStaff =  []
];
  // Meal categories and items
export const _demoMealCategories =  []
];
export const _demoMealItems =  []
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Spices', 'Ghee'],
    preparationTime: 15,
    isPopular: true
    ingredients: ['Chicken Breast', 'Rice', 'Salad', 'Herbs'],
    preparationTime: 18,
    isPopular: true
];
  // Order statuses and types
export const _orderStatuses =  []
] as const;
export const _orderPriorities =  []
] as const;
  // Nutrition targets by age group
export const _nutritionTargets =  {}
  '9-13': {}
  '14-18': {}
  // Kitchen stations configuration
export const kitchenStations 
  // Achievement categories and badges
export const _achievementCategories =  []
] as const;
export const _demoAchievements =  []
];
  // Helper functions for demo data
export const _getCurrentDate =  () 
export const getRandomElement = <T>(array: T[]): T => {}
// TODO: Refactor this function - it may be too long
export const
generateOrderId = (
  return `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}``