 * Demo data for HASIVU Platform dashboards
 * This file contains comprehensive mock data for testing all dashboard functionalities
export const demoSchool = {}
  // Student demo data
export const demoStudents = []
];
  // Parent demo data
export const demoParents = []
    ]
];
  // Admin demo data
export const demoAdmins = []
];
  // Kitchen staff demo data
export const demoKitchenStaff = []
];
  // Meal categories and items
export const demoMealCategories = []
];
export const demoMealItems = []
    ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Spices', 'Ghee'],
    preparationTime: 15,
    isPopular: true
    ingredients: ['Chicken Breast', 'Rice', 'Salad', 'Herbs'],
    preparationTime: 18,
    isPopular: true
];
  // Order statuses and types
export const orderStatuses = []
] as const;
export const orderPriorities = []
] as const;
  // Nutrition targets by age group
export const nutritionTargets = {}
  '9-13': {}
  '14-18': {}
  // Kitchen stations configuration
export const kitchenStations = []
];
  // Achievement categories and badges
export const achievementCategories = []
] as const;
export const demoAchievements = []
];
  // Helper functions for demo data
export const getCurrentDate = () => new Date().toISOString().split('T')[0];
export const getRandomElement = <T>(array: T[]): T => {}
// TODO: Refactor this function - it may be too long
export const
generateOrderId = (
  return `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}``