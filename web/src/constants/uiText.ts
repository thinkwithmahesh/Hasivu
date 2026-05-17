// web/src/constants/uiText.ts
export const UI_TEXT = {
  parent: {
    tabs: {
      home: 'Home',
      menu: 'Menu',
      orders: 'Orders',
      kids: 'Kids',
      account: 'Account',
    },
    emptyOrdersTitle: 'No orders yet',
    emptyOrdersDescription: "Browse today's menu to get started.",
  },
  admin: {
    sidebar: {
      dashboard: 'Dashboard',
      menus: 'Menus',
      orders: 'Orders',
      students: 'Students',
      reports: 'Reports',
      settings: 'Settings',
    },
    noStudentsTitle: 'No students added',
    noStudentsDescription: 'Import a CSV to get started.',
  },
  kitchen: {
    allServedTitle: 'All meals served!',
    allServedDescription: 'Great job team. Nothing pending right now.',
    tabs: {
      byClass: 'By Class',
      byMeal: 'By Meal',
      served: 'Served',
      pending: 'Pending',
    },
  },
  ordering: {
    closeSoon: 'Ordering closes soon',
    closed: 'Ordering closed for today',
  },
  common: {
    loading: 'Loading...',
    retry: 'Try again',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
  },
} as const;
