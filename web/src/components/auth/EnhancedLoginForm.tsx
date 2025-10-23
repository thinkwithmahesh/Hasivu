'use client';

/**
 * HASIVU Platform - Enhanced Login Form Component
 * Enhanced version of the existing LoginForm with API integration and real-time features
 * Integrates with the HASIVU backend authentication system
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket as useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

// Enhanced login schema with validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface EnhancedLoginFormProps {
  className?: string;
  redirectTo?: string;
  showSignUpLink?: boolean;
  showForgotPassword?: boolean;
  showSocialLogin?: boolean;
  onLoginSuccess?: (user: any) => void;
  autoFocus?: boolean;
}

export function EnhancedLoginForm({
  className,
  redirectTo,
  showSignUpLink = true,
  showForgotPassword = true,
  showSocialLogin = false,
  onLoginSuccess,
  autoFocus = true,
}: EnhancedLoginFormProps) {
  const { login, isLoading, error, clearAuthError, user } = useAuth();
  const { isConnected } = useSocket();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearAuthError();
      await login(data);

      setIsSuccess(true);
      onLoginSuccess?.(user);

      // Small delay to show success state
      setTimeout(() => {
        const redirectUrl = redirectTo || '' || '/dashboard';
        router.push(redirectUrl);
      }, 1000);
    } catch (error: any) {
      // Error is handled by AuthContext and displayed via error state

      // Reset form on certain errors
      if (error?.code === 'INVALID_CREDENTIALS') {
        form.reset({
          email: data.email,
          password: '',
          rememberMe: data.rememberMe,
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // TODO: Implement social login when backend supports it
  };

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back to HASIVU</CardTitle>
        <CardDescription className="text-gray-600">
          Sign in to order delicious school meals and track your orders in real-time
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Connection Status */}
        {!isConnected && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Real-time features unavailable. You can still login and place orders.
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {isSuccess && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Login successful! Redirecting to your dashboard...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !isSuccess && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {error.includes('credentials') && (
                <div className="mt-2 text-sm">
                  Please check your email and password, or{' '}
                  <Link href="/auth/forgot-password" className="underline hover:no-underline">
                    reset your password
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your school email address"
                        className={cn(
                          'pl-10 h-12',
                          form.formState.errors.email && 'border-red-500 focus:border-red-500',
                          field.value && !form.formState.errors.email && 'border-green-500'
                        )}
                        autoComplete="email"
                        autoFocus={autoFocus}
                        disabled={isLoading || isSuccess}
                        onFocus={() => clearAuthError()}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={cn(
                          'pl-10 pr-12 h-12',
                          form.formState.errors.password && 'border-red-500 focus:border-red-500',
                          field.value && !form.formState.errors.password && 'border-green-500'
                        )}
                        autoComplete="current-password"
                        disabled={isLoading || isSuccess}
                        onFocus={() => clearAuthError()}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-gray-100"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading || isSuccess}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs mt-1" />
                </FormItem>
              )}
            />

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSuccess}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <FormLabel className="text-sm text-gray-600 cursor-pointer">
                      Remember me for 30 days
                    </FormLabel>
                  </FormItem>
                )}
              />

              {showForgotPassword && (
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={cn(
                'w-full h-12 text-base font-medium transition-all duration-200',
                isSuccess
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              )}
              disabled={isLoading || isSuccess || !form.formState.isValid}
            >
              {isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Success! Redirecting...
                </>
              ) : isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In to HASIVU
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Social Login (if enabled) */}
        {showSocialLogin && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || isSuccess}
                className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading || isSuccess}
                className="h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </>
        )}

        {/* Sign Up Link */}
        {showSignUpLink && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to HASIVU?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Create your account
              </Link>
            </p>
          </div>
        )}

        {/* Footer Information */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-center space-y-3">
            <p className="text-xs text-gray-500">
              By signing in, you agree to HASIVU's{' '}
              <Link href="/terms" className="text-orange-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-orange-600 hover:underline">
                Privacy Policy
              </Link>
            </p>

            {/* Security and Features Indicators */}
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure Login</span>
              </div>
              <div className="flex items-center space-x-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-green-500' : 'bg-yellow-500'
                  )}
                ></div>
                <span>Real-time Orders</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>RFID Pickup</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedLoginForm;
