'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, ArrowLeft, Send, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordFormData } from './schemas';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  className?: string;
}

export function ForgotPasswordForm({
  onSubmit,
  isLoading = false,
  error,
  success = false,
  className,
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const email = form.watch('email');

  return (
    <Card className={className} aria-label="Forgot password form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-primary-600">
          {success ? 'Check Your Email' : 'Forgot Password?'}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {success
            ? "We've sent password reset instructions to your email"
            : "Enter your email address and we'll send you instructions to reset your password"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">We've sent password reset instructions to:</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>

            <div className="p-4 bg-info-50 border border-info-200 rounded-md">
              <div className="text-sm text-info-700">
                <p className="font-medium mb-1">Didn't receive the email?</p>
                <ul className="space-y-1 text-left">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• The link expires in 15 minutes</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => form.handleSubmit(handleSubmit)()}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Resend Email
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="p-3 rounded-md bg-error-50 border border-error-200 text-error-700 text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email address"
                            className="pl-10"
                            autoComplete="email"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending instructions...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reset Instructions
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium focus:outline-none focus:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

// Reset Password Form Component
interface ResetPasswordFormProps {
  onSubmit: (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: boolean;
  token: string;
  className?: string;
}

export function ResetPasswordForm({
  onSubmit,
  isLoading = false,
  error,
  success = false,
  token,
  className,
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit({ ...data, token });
    } catch (error) {
      // Error handled silently
    }
  };

  if (success) {
    return (
      <Card className={className} aria-label="Password reset success">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-success-600">
            Password Reset Successfully
          </CardTitle>
          <CardDescription className="text-gray-600">
            Your password has been updated. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center">
          <Link href="/auth/login">
            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
              Continue to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className} aria-label="Reset password form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-primary-600">Reset Your Password</CardTitle>
        <CardDescription className="text-gray-600">Enter your new password below</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div
            className="p-3 rounded-md bg-error-50 border border-error-200 text-error-700 text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        className="pr-10"
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        className="pr-10"
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
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

            <div className="p-3 bg-info-50 border border-info-200 rounded-md">
              <p className="text-sm text-info-700">
                <span className="font-medium">Password requirements:</span>
                <br />
                • At least 8 characters long
                <br />• Mix of letters, numbers, and special characters recommended
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium focus:outline-none focus:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
