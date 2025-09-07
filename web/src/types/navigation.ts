export type UserRole = 'student' | 'parent' | 'admin' | 'kitchen' | 'teacher';
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles: UserRole[];
  children?: NavigationItem[];
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  active?: boolean;