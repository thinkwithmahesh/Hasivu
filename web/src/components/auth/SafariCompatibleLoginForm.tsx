'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LoginFormData } from './schemas';
import { UserRole, USER_ROLE_CONFIG } from '@/types/auth';

// Dynamic imports for Safari compatibility
const _Form = dynamic(() => import('@/components/ui/form').then(mod => ({ default: mod.Form })), {
  ssr: false,
  loading: () => <div className="animate-pulse">Loading form...</div>,
});

const _FormField = dynamic(
  () => import('@/components/ui/form').then(mod => ({ default: mod.FormField })),
  {
    ssr: false,
  }
);

const _FormItem = dynamic(
  () => import('@/components/ui/form').then(mod => ({ default: mod.FormItem })),
  {
    ssr: false,
  }
);

const _FormLabel = dynamic(
  () => import('@/components/ui/form').then(mod => ({ default: mod.FormLabel })),
  {
    ssr: false,
  }
);

const _FormControl = dynamic(
  () => import('@/components/ui/form').then(mod => ({ default: mod.FormControl })),
  {
    ssr: false,
  }
);

const _FormMessage = dynamic(
  () => import('@/components/ui/form').then(mod => ({ default: mod.FormMessage })),
  {
    ssr: false,
  }
);

const Input = dynamic(() => import('@/components/ui/input').then(mod => ({ default: mod.Input })), {
  ssr: false,
});

const Button = dynamic(
  () => import('@/components/ui/button').then(mod => ({ default: mod.Button })),
  {
    ssr: false,
  }
);

const Tabs = dynamic(() => import('@/components/ui/tabs').then(mod => ({ default: mod.Tabs })), {
  ssr: false,
});

const TabsList = dynamic(
  () => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsList })),
  {
    ssr: false,
  }
);

const TabsTrigger = dynamic(
  () => import('@/components/ui/tabs').then(mod => ({ default: mod.TabsTrigger })),
  {
    ssr: false,
  }
);

// Icons with dynamic loading
const Mail = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Mail })), {
  ssr: false,
});

const Lock = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Lock })), {
  ssr: false,
});

const Eye = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Eye })), {
  ssr: false,
});

const EyeOff = dynamic(() => import('lucide-react').then(mod => ({ default: mod.EyeOff })), {
  ssr: false,
});

// Role icons
const Crown = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Crown })), {
  ssr: false,
});

const School = dynamic(() => import('lucide-react').then(mod => ({ default: mod.School })), {
  ssr: false,
});

const UserCheck = dynamic(() => import('lucide-react').then(mod => ({ default: mod.UserCheck })), {
  ssr: false,
});

const Users = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), {
  ssr: false,
});

const GraduationCap = dynamic(
  () => import('lucide-react').then(mod => ({ default: mod.GraduationCap })),
  {
    ssr: false,
  }
);

const Store = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Store })), {
  ssr: false,
});

const ChefHat = dynamic(() => import('lucide-react').then(mod => ({ default: mod.ChefHat })), {
  ssr: false,
});

interface SafariCompatibleLoginFormProps {
  onSubmit: (data: LoginFormData & { role: UserRole }) => Promise<void>;
  onSocialLogin?: (provider: 'google' | 'facebook') => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  showRememberMe?: boolean;
  showSocialLogin?: boolean;
  showRoleSelection?: boolean;
  defaultRole?: UserRole;
  className?: string;
}

export function SafariCompatibleLoginForm({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error = null,
  showRememberMe = true,
  showSocialLogin = true,
  showRoleSelection = true,
  defaultRole = UserRole.STUDENT,
  className = '',
}: SafariCompatibleLoginFormProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Ensure component only renders after hydration to prevent Safari issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData, role: selectedRole });
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Don't render anything until mounted (Safari compatibility)
  if (!isMounted) {
    return (
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md space-y-8 ${className}`} suppressHydrationWarning={true}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showRoleSelection && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">Select Your Role</label>
          <Tabs
            value={selectedRole}
            onValueChange={value => setSelectedRole(value as UserRole)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 mb-4" data-testid="role-selector">
              {Object.entries(USER_ROLE_CONFIG).map(([role, config]) => {
                let Icon = Crown; // Default icon
                if (role === UserRole.SCHOOL_ADMIN) Icon = School;
                else if (role === UserRole.TEACHER) Icon = UserCheck;
                else if (role === UserRole.PARENT) Icon = Users;
                else if (role === UserRole.STUDENT) Icon = GraduationCap;
                else if (role === UserRole.VENDOR) Icon = Store;
                else if (role === UserRole.KITCHEN_STAFF) Icon = ChefHat;

                return (
                  <TabsTrigger
                    key={role}
                    value={role}
                    data-testid={`role-tab-${role}`}
                    className="flex flex-col items-center gap-1 p-3 text-xs"
                    aria-selected={selectedRole === role}
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-700">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              data-testid="email-input"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              data-testid="password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {showRememberMe && (
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.rememberMe}
              onChange={e => handleInputChange('rememberMe', e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
        )}

        <Button
          type="submit"
          data-testid="login-button"
          className="w-full"
          disabled={isLoading || !formData.email || !formData.password}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        {showSocialLogin && onSocialLogin && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSocialLogin('google')}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSocialLogin('facebook')}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
