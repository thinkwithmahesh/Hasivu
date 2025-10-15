'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  LogIn,
  School,
  Users,
  Shield,
  ChefHat,
  GraduationCap,
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { enhancedLoginSchema, detectRoleFromEmail, type EnhancedLoginFormData } from './schemas';

interface EnhancedSchoolLoginFormProps {
  onSubmit: (data: EnhancedLoginFormData) => Promise<void>;
  onSocialLogin?: (provider: 'google' | 'microsoft') => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  showRememberMe?: boolean;
  showSocialLogin?: boolean;
  className?: string;
}

const ROLE_CONFIG = {
  student: {
    icon: GraduationCap,
    label: 'Student',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Access meal ordering and account management',
  },
  parent: {
    icon: Users,
    label: 'Parent/Guardian',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: "Manage children's accounts and meal preferences",
  },
  admin: {
    icon: Shield,
    label: 'Administrator',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full system administration access',
  },
  kitchen: {
    icon: ChefHat,
    label: 'Kitchen Staff',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Meal preparation and order management',
  },
  teacher: {
    icon: School,
    label: 'Teacher/Staff',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Educational staff portal access',
  },
};

export function EnhancedSchoolLoginForm({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error,
  showRememberMe = true,
  showSocialLogin = true,
  className,
}: EnhancedSchoolLoginFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [detectedRole, setDetectedRole] = React.useState<string | null>(null);
  const [emailValidated, setEmailValidated] = React.useState(false);

  const form = useForm<EnhancedLoginFormData>({
    resolver: zodResolver(enhancedLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
      detectedRole: undefined,
    },
  });

  const watchEmail = form.watch('email');

  // Role detection on email change
  React.useEffect(() => {
    if (watchEmail && watchEmail.includes('@hasivu.edu')) {
      const role = detectRoleFromEmail(watchEmail);
      setDetectedRole(role);
      setEmailValidated(true);

      if (role) {
        form.setValue('detectedRole', role as any);
      }
    } else {
      setDetectedRole(null);
      setEmailValidated(false);
      form.setValue('detectedRole', undefined);
    }
  }, [watchEmail, form]);

  const handleSubmit = async (data: EnhancedLoginFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    if (onSocialLogin) {
      try {
        await onSocialLogin(provider);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const renderRoleBadge = () => {
    if (!detectedRole || !emailValidated) return null;

    const config = ROLE_CONFIG[detectedRole as keyof typeof ROLE_CONFIG];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div className="mt-2 p-3 rounded-lg border bg-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <IconComponent className="h-4 w-4" />
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>
    );
  };

  return (
    <Card className={className} aria-label="HASIVU School Login">
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <School className="h-8 w-8 text-primary-600" />
            <div className="text-left">
              <CardTitle className="text-2xl font-bold text-primary-600">HASIVU Platform</CardTitle>
              <p className="text-sm text-gray-500">School Meal Management</p>
            </div>
          </div>
        </div>
        <CardDescription className="text-gray-600">
          Sign in with your school email address to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">School Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="your.name@hasivu.edu"
                        className="pl-10"
                        autoComplete="email"
                        disabled={isLoading}
                      />
                      {emailValidated && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <School className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  {renderRoleBadge()}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
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
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label className="text-sm text-gray-600">Keep me signed in</Label>
                      </div>
                    </FormItem>
                  )}
                />

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to HASIVU
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
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
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
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin('microsoft')}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
                Microsoft
              </Button>
            </div>
          </>
        )}

        {/* School Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">New to HASIVU Platform?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Students: Use format student.{'{ID}'}@hasivu.edu</li>
            <li>• Parents: Use format parent.{'{name}'}@hasivu.edu</li>
            <li>• Staff: Use your assigned school email address</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
        <p>
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="text-primary-600 hover:text-primary-500 font-medium focus:outline-none focus:underline"
          >
            Register with your school
          </Link>
        </p>
        <p className="text-xs text-gray-500">
          Need help? Contact{' '}
          <a href="mailto:support@hasivu.edu" className="text-primary-600 hover:underline">
            support@hasivu.edu
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
