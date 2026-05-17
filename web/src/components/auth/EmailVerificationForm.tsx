'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, ArrowLeft, Send as Send, CheckCircle, RefreshCw } from 'lucide-react';
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

import { emailVerificationSchema, type EmailVerificationFormData } from './schemas';

interface EmailVerificationFormProps {
  onSubmit: (data: EmailVerificationFormData) => Promise<void>;
  onResendCode?: () => Promise<void>;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string | null;
  success?: boolean;
  email: string;
  className?: string;
}

export function EmailVerificationForm({
  onSubmit,
  onResendCode,
  isLoading = false,
  isResending = false,
  error,
  success = false,
  email,
  className,
}: EmailVerificationFormProps) {
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);

  const form = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // Countdown timer for resend functionality
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleSubmit = async (data: EmailVerificationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleResendCode = async () => {
    if (onResendCode && canResend) {
      try {
        await onResendCode();
        setTimeLeft(60);
        setCanResend(false);
        form.reset();
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    form.setValue('code', value);

    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      form.handleSubmit(handleSubmit)();
    }
  };

  if (success) {
    return (
      <Card className={className} aria-label="Email verification success">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-success-600">Email Verified!</CardTitle>
          <CardDescription className="text-gray-600">
            Your email has been successfully verified. Welcome to HASIVU!
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>

          <div className="p-4 bg-success-50 border border-success-200 rounded-md">
            <p className="text-sm text-success-700">
              Your account is now active and you can start using all features of the HASIVU
              platform.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center">
          <Link href="/dashboard">
            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
              Continue to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className} aria-label="Email verification form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-primary-600">Verify Your Email</CardTitle>
        <CardDescription className="text-gray-600">
          We've sent a 6-digit verification code to your email address
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-600">Verification code sent to:</p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>
        </div>

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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 text-center block">
                    Enter 6-Digit Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleCodeInput}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5"
              disabled={isLoading || form.watch('code').length !== 6}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center space-y-3">
          <div className="text-sm text-gray-600">Didn't receive the code?</div>

          {canResend ? (
            <Button
              variant="outline"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-primary-600 border-primary-300 hover:bg-primary-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-gray-500">Resend available in {timeLeft} seconds</p>
          )}
        </div>

        <div className="p-3 bg-info-50 border border-info-200 rounded-md">
          <div className="text-sm text-info-700">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="space-y-1 text-left">
              <li>• Check your spam/junk folder</li>
              <li>• Code expires in 10 minutes</li>
              <li>• Make sure to enter all 6 digits</li>
            </ul>
          </div>
        </div>
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
