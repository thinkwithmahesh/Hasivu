# HASIVU Navigation & Layout Components

Comprehensive navigation and layout system for the HASIVU school platform, built with Next.js, TypeScript, and ShadCN/UI components.

## Overview

This component library provides a complete navigation and layout solution for different user roles in the HASIVU school platform:

- **Students**: Order meals, view schedules, track orders
- **Parents**: Manage children's meals, payments, reports
- **Admin**: Full system management, analytics, user administration
- **Kitchen**: Order management, menu planning, inventory
- **Teachers**: Student management, lunch schedules, reports

## Core Features

✅ **Role-based Navigation** - Different menus and layouts per user role  
✅ **Responsive Design** - Mobile-first with bottom tab navigation  
✅ **Real-time Notifications** - Bell icon with unread counts and urgency indicators  
✅ **Shopping Cart Integration** - Cart icon with item counts for meal ordering  
✅ **Emergency Alert System** - Banner notifications for school emergencies  
✅ **RFID Status Monitoring** - Real-time connectivity status display  
✅ **Collapsible Sidebar** - Space-efficient admin/kitchen navigation  
✅ **Automatic Breadcrumbs** - Context-aware navigation breadcrumbs  
✅ **Touch Optimization** - 44px minimum touch targets for mobile  
✅ **HASIVU Brand Integration** - Consistent brand colors and styling

## Component Architecture

### Layout Components

- **`AppLayout`** - Base layout with header and optional bottom navigation
- **`DashboardLayout`** - Enhanced layout with title, subtitle, and actions
- **`SidebarLayout`** - Admin/kitchen layout with collapsible sidebar
- **`AuthLayout`** - Clean layout for authentication pages
- **`MealOrderLayout`** - Specialized layout for meal ordering with cart sidebar

### Navigation Components

- **`MainHeader`** - Primary header with logo, navigation, notifications, and user menu
- **`NavigationMenu`** - Desktop navigation with role-based menu items
- **`MobileMenu`** - Mobile slide-out menu with user info and status
- **`BottomTabNav`** - Mobile bottom tab navigation
- **`SidebarNav`** - Collapsible sidebar for admin/kitchen dashboards
- **`BreadcrumbNav`** - Automatic breadcrumb generation

## Usage Examples

### Basic App Layout

```tsx
import { AppLayout } from '@/components/layout';

function MyPage() {
  return (
    <AppLayout
      user={currentUser}
      notifications={notifications}
      cartItems={cartItems}
      schoolStatus={schoolStatus}
      onLogout={handleLogout}
    >
      <div className="container mx-auto px-4 py-6">
        <h1>Welcome to HASIVU</h1>
        {/* Your page content */}
      </div>
    </AppLayout>
  );
}
```

### Dashboard Layout with Actions

```tsx
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

function Dashboard() {
  const actions = (
    <div className="flex gap-2">
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add New
      </Button>
    </div>
  );

  return (
    <DashboardLayout
      user={currentUser}
      notifications={notifications}
      schoolStatus={schoolStatus}
      title="Student Dashboard"
      subtitle="Welcome back! Here's what's happening today."
      actions={actions}
    >
      {/* Dashboard content */}
    </DashboardLayout>
  );
}
```

### Admin Dashboard with Sidebar

```tsx
import { AdminDashboardLayout } from '@/components/layout';

function AdminDashboard() {
  return (
    <AdminDashboardLayout
      user={adminUser}
      notifications={notifications}
      schoolStatus={schoolStatus}
      title="System Overview"
      subtitle="Monitor and manage your school's operations"
    >
      {/* Admin dashboard content */}
    </AdminDashboardLayout>
  );
}
```

### Kitchen Dashboard

```tsx
import { KitchenDashboardLayout } from '@/components/layout';

function KitchenDashboard() {
  return (
    <KitchenDashboardLayout
      user={kitchenUser}
      notifications={notifications}
      schoolStatus={schoolStatus}
      title="Kitchen Operations"
      subtitle="Manage orders, menu, and inventory"
    >
      {/* Kitchen dashboard content */}
    </KitchenDashboardLayout>
  );
}
```

### Authentication Layout

```tsx
import { AuthLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function LoginPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>{/* Login form */}</CardContent>
      </Card>
    </AuthLayout>
  );
}
```

## Type Definitions

### User Types

```typescript
type UserRole = 'student' | 'parent' | 'admin' | 'kitchen' | 'teacher';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  grade?: string; // For students
  studentId?: string; // For parents to link to student
  rfidConnected?: boolean;
}
```

### Navigation Types

```typescript
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles: UserRole[];
  children?: NavigationItem[];
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  urgent?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'lunch' | 'snack' | 'beverage';
  image?: string;
  allergens?: string[];
}

interface SchoolStatus {
  mealServiceActive: boolean;
  lunchBreakTime: string;
  rfidSystemStatus: 'online' | 'offline' | 'maintenance';
  emergencyMode: boolean;
  emergencyMessage?: string;
}
```

## Role-based Navigation

### Student Navigation

- Home Dashboard
- Meals (Menu, Order, History)
- Schedule
- Reports
- Profile

### Parent Navigation

- Home Dashboard
- My Children (Meals, Schedule, Reports)
- Payments
- Profile

### Admin Navigation

- Dashboard
- User Management (Students, Parents, Staff)
- Meal Management (Menu, Orders, Inventory, Nutrition)
- Payments (Transactions, Billing, Refunds)
- Analytics (Overview, Meals, Financial)
- Reports
- Security (Logs, Permissions)
- Settings

### Kitchen Navigation

- Kitchen Dashboard
- Orders (Pending, Preparing, Ready, Completed)
- Menu Management (Current, Upcoming, Recipes)
- Inventory (Current Stock, Low Stock, Purchase Orders)
- Schedule
- Reports

### Teacher Navigation

- Home Dashboard
- Students
- Lunch Schedule
- Reports
- Profile

## Mobile Optimization

### Bottom Tab Navigation

- Touch-optimized with 44px minimum touch targets
- Role-specific tab items
- Badge indicators for cart items
- Safe area padding for devices with home indicators
- Hidden on authentication pages

### Mobile Header

- Hamburger menu for navigation
- Notification bell with urgency indicators
- Shopping cart with item counts
- User profile dropdown
- Emergency banner when active
- RFID and meal service status indicators

### Responsive Behavior

- Mobile-first design approach
- Bottom navigation on mobile, desktop navigation on larger screens
- Collapsible sidebar on admin/kitchen layouts
- Touch-friendly interactions and hover states

## Emergency Features

### Emergency Alert System

- School-wide emergency banner
- Configurable emergency messages
- Visual priority with red background and alert icon
- Dismissible but persistent until emergency cleared

### RFID System Monitoring

- Real-time connectivity status
- Visual indicators (green for online, red for offline)
- Integration with school's RFID payment system

## Brand Integration

### HASIVU Brand Colors

- Primary: Green theme (`#4CAF50`) for main actions
- Secondary: Purple theme (`#9C27B0`) for secondary actions
- Accent: Orange theme (`#FF9800`) for highlights and cart
- Semantic colors for success, warning, error, and info states

### Typography

- Display font: Poppins for headings and brand elements
- Body font: Inter for readable content
- Consistent spacing and sizing scales

## Accessibility Features

- WCAG 2.1 AA compliance
- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Minimum touch target sizes (44px)

## Performance Optimizations

- Lazy loading of navigation components
- Optimized re-renders with React.memo
- Efficient state management
- Progressive enhancement
- Mobile-optimized animations
- Compressed assets and icons

## Demo

Visit `/layout-demo` in your development environment to see an interactive showcase of all navigation and layout components with different user roles and states.

## Installation & Setup

1. Ensure ShadCN/UI components are installed:

   ```bash
   npx shadcn-ui@latest add navigation-menu dropdown-menu sheet avatar button
   ```

2. Import the layout components:

   ```tsx
   import { AppLayout, DashboardLayout } from '@/components/layout';
   ```

3. Provide required props (user, notifications, schoolStatus)

4. Customize with your own content and styling

## Contributing

When contributing to the navigation system:

1. Follow the existing TypeScript patterns
2. Ensure mobile responsiveness
3. Test with different user roles
4. Maintain accessibility standards
5. Update type definitions as needed
6. Test emergency and status scenarios

## File Structure

```
src/components/layout/
├── index.ts                          # Main exports
├── app-layout.tsx                    # Base layouts
├── sidebar-layout.tsx                # Admin/kitchen layouts
├── header/
│   ├── main-header.tsx              # Primary header component
│   ├── navigation-menu.tsx          # Desktop navigation
│   └── mobile-menu.tsx              # Mobile slide-out menu
├── navigation/
│   ├── bottom-tab-nav.tsx           # Mobile bottom tabs
│   └── breadcrumb-nav.tsx           # Breadcrumb navigation
├── sidebar/
│   └── sidebar-nav.tsx              # Collapsible sidebar
└── README.md                        # This documentation

src/types/
└── navigation.ts                     # Type definitions
```
