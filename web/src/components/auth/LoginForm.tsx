'use client';

import * as React from 'react';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  LogIn,
  Users,
  Shield,
  ChefHat,
  GraduationCap,
  Store,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { loginSchema, type LoginFormData } from './schemas';

// Role configuration
const USER_ROLES = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    description: 'Browse meals, track orders, and verify RFID pickup',
    color: 'bg-[var(--hasivu-info)]',
  },
  parent: {
    label: 'Parent',
    icon: Users,
    description: "Manage your child's meals and payments",
    color: 'bg-[var(--hasivu-secondary)]',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'System administration and management',
    color: 'bg-purple-600',
  },
  kitchen: {
    label: 'Kitchen',
    icon: ChefHat,
    description: 'Manage orders and meal preparation',
    color: 'bg-[var(--hasivu-primary)]',
  },
  vendor: {
    label: 'Vendor',
    icon: Store,
    description: 'Manage menu supply, inventory, orders, and payments',
    color: 'bg-[var(--hasivu-accent)]',
  },
} as const;

type UserRole = keyof typeof USER_ROLES;

const loginFormResolver: Resolver<LoginFormData> = async values => {
  const result = loginSchema.safeParse(values);

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    };
  }

  const errors: FieldErrors<LoginFormData> = {};

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0] as keyof LoginFormData | undefined;
    if (fieldName && !errors[fieldName]) {
      errors[fieldName] = {
        type: issue.code,
        message: issue.message,
      };
    }
  }

  return {
    values: {} as LoginFormData,
    errors,
  };
};

interface LoginFormProps {
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

export function LoginForm({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error,
  showRememberMe = true,
  showSocialLogin = true,
  showRoleSelection = true,
  defaultRole = 'parent',
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>(defaultRole);

  React.useEffect(() => {
    setSelectedRole(defaultRole);
  }, [defaultRole]);

  const form = useForm<LoginFormData>({
    resolver: loginFormResolver,
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit({ ...data, role: selectedRole });
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (onSocialLogin) {
      try {
        await onSocialLogin(provider);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  return (
    <Card className={className} aria-label="Login form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-[var(--hasivu-primary)]">
          Welcome Back to HASIVU
        </CardTitle>
        <CardDescription className="text-hasivu-text-secondary">
          {showRoleSelection ? (
            <>Select your role and sign in to continue</>
          ) : (
            <>Sign in to your HASIVU account to continue</>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className={cn('space-y-4', className)}>
        {error && (
          <div
            data-testid="general-error"
            className="p-3 rounded-md bg-error-50 border border-error-200 text-error-700 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {showRoleSelection && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Select Your Role</Label>
            <Tabs
              value={selectedRole}
              onValueChange={value => setSelectedRole(value as UserRole)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4 h-auto">
                {Object.entries(USER_ROLES).map(([role, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger
                      key={role}
                      value={role}
                      data-testid={`role-tab-${role}`}
                      className="flex flex-col items-center gap-1 p-3 text-xs text-hasivu-text-secondary data-[state=active]:text-[var(--hasivu-primary)] data-[state=active]:bg-[var(--hasivu-primary)]/10"
                      aria-selected={selectedRole === role}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Role descriptions */}
              {Object.entries(USER_ROLES).map(([role, config]) => (
                <TabsContent key={role} value={role} className="mt-2">
                  <p className="text-sm text-hasivu-text-secondary text-center bg-hasivu-surface-2 p-2 rounded-md">
                    {config.description}
                  </p>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            aria-label="Login form"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Email Address</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="email-input"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        autoComplete="email"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </div>
                  <FormMessage data-testid="email-error" role="alert" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <button
                      type="button"
                      data-testid="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    >
                      <span className="sr-only">Toggle password visibility</span>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage data-testid="password-error" role="alert" />
                </FormItem>
              )}
            />

            {showRememberMe && (
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          data-testid="remember-me-checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-gray-600">Remember me</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Link
                  href="/auth/forgot-password"
                  data-testid="forgot-password-link"
                  tabIndex={-1}
                  className="text-sm text-[var(--hasivu-primary)] hover:text-[var(--hasivu-primary-dark)] focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              data-testid="login-button"
              className="w-full bg-[var(--hasivu-primary)] hover:bg-[var(--hasivu-primary-dark)] text-white font-medium py-2.5 rounded-xl"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span data-testid="loading-spinner" className="sr-only">
                    Loading
                  </span>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>

        {showSocialLogin && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-hasivu-text-tertiary">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                data-testid="google-login-button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
                Continue with Google
              </Button>

              <Button
                variant="outline"
                data-testid="microsoft-login-button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
        <p>
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            data-testid="signup-link"
            className="text-[var(--hasivu-primary)] hover:text-[var(--hasivu-primary-dark)] font-medium focus:outline-none focus:underline"
          >
            Sign up for free
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
