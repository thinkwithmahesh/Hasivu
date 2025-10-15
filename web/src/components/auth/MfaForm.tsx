'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Loader2, ArrowLeft, Smartphone, Key, RefreshCw } from 'lucide-react';
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

import { mfaSchema, type MfaFormData } from './schemas';

interface MfaFormProps {
  onSubmit: (data: MfaFormData) => Promise<void>;
  onUseBackupCode?: () => void;
  onResendCode?: () => Promise<void>;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string | null;
  method?: 'authenticator' | 'sms' | 'email';
  contact?: string; // phone number or email for sms/email method
  className?: string;
}

const methodConfig = {
  authenticator: {
    icon: Key,
    title: 'Authenticator App',
    description: 'Enter the 6-digit code from your authenticator app',
    placeholder: '000000',
    inputMode: 'numeric' as const,
  },
  sms: {
    icon: Smartphone,
    title: 'SMS Verification',
    description: 'Enter the 6-digit code sent to your phone',
    placeholder: '000000',
    inputMode: 'numeric' as const,
  },
  email: {
    icon: Shield,
    title: 'Email Verification',
    description: 'Enter the 6-digit code sent to your email',
    placeholder: '000000',
    inputMode: 'numeric' as const,
  },
};

export function MfaForm({
  onSubmit,
  onUseBackupCode,
  onResendCode,
  isLoading = false,
  isResending = false,
  error,
  method = 'authenticator',
  contact,
  className,
}: MfaFormProps) {
  const [timeLeft, setTimeLeft] = React.useState(method === 'authenticator' ? 0 : 60);
  const [canResend, setCanResend] = React.useState(method === 'authenticator');

  const config = methodConfig[method];
  const IconComponent = config.icon;

  const form = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      code: '',
    },
  });

  // Countdown timer for resend functionality (not applicable for authenticator)
  React.useEffect(() => {
    if (method !== 'authenticator' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (method !== 'authenticator' && timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, method]);

  const handleSubmit = async (data: MfaFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleResendCode = async () => {
    if (onResendCode && canResend && method !== 'authenticator') {
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

  const formatContact = (contact: string, method: string) => {
    if (method === 'sms') {
      // Format phone number: +91 98765 ***10
      return contact.replace(/(\+\d{1,3})(\d{3,5})(\d+)(\d{2})/, '$1 $2 ***$4');
    } else if (method === 'email') {
      // Format email: j***@example.com
      const [username, domain] = contact.split('@');
      return `${username.charAt(0)}***@${domain}`;
    }
    return contact;
  };

  return (
    <Card className={className} aria-label="Multi-factor authentication form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-primary-600">{config.title}</CardTitle>
        <CardDescription className="text-gray-600">{config.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-primary-600" />
          </div>

          {contact && method !== 'authenticator' && (
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {method === 'sms' ? 'Code sent to:' : 'Code sent to:'}
              </p>
              <p className="font-medium text-gray-900">{formatContact(contact, method)}</p>
            </div>
          )}
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
                    Authentication Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleCodeInput}
                      placeholder={config.placeholder}
                      className="text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      inputMode={config.inputMode}
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
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify & Continue
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Resend code functionality for SMS/Email */}
        {method !== 'authenticator' && (
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
        )}

        {/* Backup code option */}
        {onUseBackupCode && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onUseBackupCode}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Use backup code instead
            </Button>
          </div>
        )}

        {/* Method-specific tips */}
        <div className="p-3 bg-info-50 border border-info-200 rounded-md">
          <div className="text-sm text-info-700">
            <p className="font-medium mb-1">
              {method === 'authenticator' ? 'Authenticator Tips:' : 'Verification Tips:'}
            </p>
            <ul className="space-y-1 text-left">
              {method === 'authenticator' ? (
                <>
                  <li>• Use Google Authenticator, Authy, or similar app</li>
                  <li>• Make sure your device time is synchronized</li>
                  <li>• Code refreshes every 30 seconds</li>
                </>
              ) : (
                <>
                  <li>• Code expires in 10 minutes</li>
                  <li>• Check spam folder if using email</li>
                  <li>• Make sure to enter all 6 digits</li>
                </>
              )}
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

// Backup Code Form Component
interface BackupCodeFormProps {
  onSubmit: (code: string) => Promise<void>;
  onBackToMfa?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function BackupCodeForm({
  onSubmit,
  onBackToMfa,
  isLoading = false,
  error,
  className,
}: BackupCodeFormProps) {
  const [backupCode, setBackupCode] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.trim()) {
      try {
        await onSubmit(backupCode.trim());
      } catch (error) {
        // Error handled silently
      }
    }
  };

  return (
    <Card className={className} aria-label="Backup code form">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-primary-600">Use Backup Code</CardTitle>
        <CardDescription className="text-gray-600">
          Enter one of your backup codes to sign in
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center">
            <Key className="w-8 h-8 text-warning-600" />
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700 text-center block">Backup Code</Label>
            <Input
              value={backupCode}
              onChange={e => setBackupCode(e.target.value)}
              placeholder="Enter backup code"
              className="text-center font-mono"
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5"
            disabled={isLoading || !backupCode.trim()}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Verify Backup Code
              </>
            )}
          </Button>
        </form>

        {onBackToMfa && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onBackToMfa}
              className="text-sm text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Back to authenticator
            </Button>
          </div>
        )}

        <div className="p-3 bg-warning-50 border border-warning-200 rounded-md">
          <div className="text-sm text-warning-700">
            <p className="font-medium mb-1">Important:</p>
            <ul className="space-y-1 text-left">
              <li>• Each backup code can only be used once</li>
              <li>• Store remaining codes in a safe place</li>
              <li>• Generate new codes after using these</li>
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
