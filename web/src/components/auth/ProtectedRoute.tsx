'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, AlertTriangle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { User, UserRole, Permission } from '@/types/auth';
import { ROLE_PERMISSIONS as _ROLE_PERMISSIONS, PermissionChecker } from '@/types/auth';
import { useAuth as useAuthContext } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;

  // Authentication requirements
  requireAuth?: boolean;

  // Role-based access
  allowedRoles?: UserRole[];

  // Permission-based access
  requiredPermissions?: Permission[];

  // Email verification requirement
  requireEmailVerification?: boolean;

  // Redirect options
  redirectTo?: string;
  redirectOnSuccess?: string;

  // Loading and error customization
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;

  // Layout options
  fallbackLayout?: boolean;

  className?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkPermission: (permission: Permission) => boolean;
  checkRole: (role: UserRole) => boolean;
}

// Use the actual auth context
const useAuth = (): AuthContextType => {
  const { user, isLoading, isAuthenticated } = useAuthContext();

  const checkPermission = (permission: Permission): boolean => {
    return PermissionChecker.hasPermission(user, permission);
  };

  const checkRole = (role: UserRole): boolean => {
    return PermissionChecker.hasRole(user, role);
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    checkPermission,
    checkRole,
  };
};

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles = [],
  requiredPermissions = [],
  requireEmailVerification = false,
  redirectTo = '/auth/login',
  redirectOnSuccess,
  loadingComponent,
  unauthorizedComponent,
  fallbackLayout = true,
  className,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, checkPermission, checkRole } = useAuth();
  const router = useRouter();

  // Handle redirection
  React.useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        const currentPath = window.location.pathname;
        const redirectPath = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.replace(redirectPath);
        return;
      }

      if (redirectOnSuccess && isAuthenticated) {
        router.replace(redirectOnSuccess);
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, redirectOnSuccess, router]);

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return <LoadingScreen fallbackLayout={fallbackLayout} className={className} />;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Redirect will handle this
  }

  // Check email verification
  if (requireEmailVerification && user && !user.emailVerified) {
    return (
      <UnauthorizedScreen
        type="email-verification"
        user={user}
        fallbackLayout={fallbackLayout}
        className={className}
      />
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.some(role => checkRole(role));
    if (!hasAllowedRole) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>;
      }

      return (
        <UnauthorizedScreen
          type="role"
          user={user}
          allowedRoles={allowedRoles}
          fallbackLayout={fallbackLayout}
          className={className}
        />
      );
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0 && user) {
    const hasAllPermissions = requiredPermissions.every(permission => checkPermission(permission));

    if (!hasAllPermissions) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>;
      }

      return (
        <UnauthorizedScreen
          type="permission"
          user={user}
          requiredPermissions={requiredPermissions}
          fallbackLayout={fallbackLayout}
          className={className}
        />
      );
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

// Loading Screen Component
interface LoadingScreenProps {
  fallbackLayout?: boolean;
  className?: string;
}

function LoadingScreen({ fallbackLayout = true, className }: LoadingScreenProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
        <p className="text-gray-600">Please wait while we load your content</p>
      </div>
    </div>
  );

  if (!fallbackLayout) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-gray-50', className)}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    </div>
  );
}

// Unauthorized Screen Component
interface UnauthorizedScreenProps {
  type: 'role' | 'permission' | 'email-verification';
  user?: User | null;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallbackLayout?: boolean;
  className?: string;
}

function UnauthorizedScreen({
  type,
  user,
  allowedRoles = [],
  requiredPermissions: _requiredPermissions = [],
  fallbackLayout = true,
  className,
}: UnauthorizedScreenProps) {
  const router = useRouter();

  const getContent = () => {
    switch (type) {
      case 'email-verification':
        return {
          icon: <Shield className="w-8 h-8 text-warning-600" />,
          title: 'Email Verification Required',
          description: 'Please verify your email address to access this page.',
          action: (
            <Button
              onClick={() => router.push('/auth/verify-email')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Verify Email
            </Button>
          ),
        };

      case 'role':
        return {
          icon: <Lock className="w-8 h-8 text-error-600" />,
          title: 'Access Denied',
          description: `This page requires ${allowedRoles.length > 1 ? 'one of the following roles' : 'the following role'}: ${allowedRoles.join(', ')}.`,
          action: (
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          ),
        };

      case 'permission':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-error-600" />,
          title: 'Insufficient Permissions',
          description: "You don't have the required permissions to access this page.",
          action: (
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          ),
        };

      default:
        return {
          icon: <Lock className="w-8 h-8 text-error-600" />,
          title: 'Access Denied',
          description: "You don't have permission to access this page.",
          action: (
            <Button variant="outline" onClick={() => router.push('/')}>
              Go Home
            </Button>
          ),
        };
    }
  };

  const { icon, title, description, action } = getContent();

  const content = (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {user && (
        <CardContent className="text-center">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
            <p className="text-sm text-gray-600">
              Role: <span className="font-medium capitalize">{user.role}</span>
            </p>
          </div>
        </CardContent>
      )}

      <CardFooter className="flex flex-col space-y-2">
        {action}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/auth/logout')}
          className="text-gray-600"
        >
          Sign out
        </Button>
      </CardFooter>
    </Card>
  );

  if (!fallbackLayout) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-gray-50 p-4', className)}>
      {content}
    </div>
  );
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for checking permissions in components
export function usePermissions() {
  const { checkPermission, checkRole, user } = useAuth();

  return {
    checkPermission,
    checkRole,
    hasRole: (role: UserRole) => checkRole(role),
    hasPermission: (permission: Permission) => checkPermission(permission),
    hasAnyRole: (roles: UserRole[]) => roles.some(role => checkRole(role)),
    hasAllPermissions: (permissions: Permission[]) =>
      permissions.every(permission => checkPermission(permission)),
    user,
  };
}

// Utility components for conditional rendering
interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback = null }: ConditionalRenderProps) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

export function RequireRole({
  children,
  roles,
  fallback = null,
}: ConditionalRenderProps & { roles: UserRole[] }) {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole(roles) ? <>{children}</> : <>{fallback}</>;
}

export function RequirePermission({
  children,
  permissions,
  fallback = null,
}: ConditionalRenderProps & { permissions: Permission[] }) {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
}
