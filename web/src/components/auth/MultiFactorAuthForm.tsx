'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Smartphone,
  Shield,
  Key,
  Clock,
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Mail,
  Settings,
  QrCode,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  mfaSchema,
  mfaSetupSchema,
  recoveryCodesSchema,
  type MfaFormData,
  type MfaSetupFormData,
  type RecoveryCodesFormData,
} from './schemas';

interface MultiFactorAuthFormProps {
  // MFA verification
  onMfaVerify: (data: MfaFormData) => Promise<void>;

  // MFA setup
  onMfaSetup?: (data: MfaSetupFormData) => Promise<void>;
  onGenerateRecoveryCodes?: () => Promise<string[]>;
  onSendSmsCode?: (phoneNumber: string) => Promise<void>;
  onGenerateQrCode?: () => Promise<string>; // Returns QR code data URL

  // Recovery
  onUseRecoveryCode?: (code: string) => Promise<void>;
  onRequestNewCode?: (method: 'sms' | 'email') => Promise<void>;

  // State
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  userPhone?: string;
  userEmail?: string;
  mfaEnabled?: boolean;
  mode?: 'verify' | 'setup' | 'emergency';
  className?: string;
}

export function MultiFactorAuthForm({
  onMfaVerify,
  onMfaSetup,
  onGenerateRecoveryCodes,
  onSendSmsCode,
  onGenerateQrCode,
  onUseRecoveryCode,
  onRequestNewCode,
  isLoading = false,
  error,
  success,
  userPhone,
  userEmail,
  mfaEnabled = false,
  mode = 'verify',
  className,
}: MultiFactorAuthFormProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<'sms' | 'app' | 'recovery'>('sms');
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = React.useState(30);
  const [canResend, setCanResend] = React.useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = React.useState(false);

  // Forms
  const mfaForm = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  const setupForm = useForm<MfaSetupFormData>({
    resolver: zodResolver(mfaSetupSchema),
    defaultValues: {
      method: 'sms',
      phoneNumber: userPhone || '',
    },
  });

  const recoveryForm = useForm<RecoveryCodesFormData>({
    resolver: zodResolver(recoveryCodesSchema),
    defaultValues: {
      codes: [],
      acknowledged: false,
    },
  });

  // Timer for resend functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeRemaining > 0 && !canResend) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timeRemaining, canResend]);

  const handleMfaVerify = async (data: MfaFormData) => {
    try {
      await onMfaVerify(data);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleMfaSetup = async (data: MfaSetupFormData) => {
    if (onMfaSetup) {
      try {
        await onMfaSetup(data);
        if (onGenerateRecoveryCodes) {
          const codes = await onGenerateRecoveryCodes();
          setRecoveryCodes(codes);
          recoveryForm.setValue('codes', codes);
        }
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleGenerateQrCode = async () => {
    if (onGenerateQrCode) {
      try {
        const qrData = await onGenerateQrCode();
        setQrCodeData(qrData);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleSendSms = async () => {
    const phone = setupForm.getValues('phoneNumber') || userPhone;
    if (phone && onSendSmsCode) {
      try {
        await onSendSmsCode(phone);
        setTimeRemaining(30);
        setCanResend(false);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleUseRecoveryCode = async (code: string) => {
    if (onUseRecoveryCode) {
      try {
        await onUseRecoveryCode(code);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const handleRequestNewCode = async (method: 'sms' | 'email') => {
    if (onRequestNewCode) {
      try {
        await onRequestNewCode(method);
        setTimeRemaining(30);
        setCanResend(false);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const copyRecoveryCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const copyAllRecoveryCodes = () => {
    const allCodes = recoveryCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
  };

  // MFA Verification Mode
  if (mode === 'verify') {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the verification code to continue</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={selectedMethod} onValueChange={value => setSelectedMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sms" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                SMS
              </TabsTrigger>
              <TabsTrigger value="totp" className="flex items-center gap-1">
                <Smartphone className="h-3 w-3" />
                App
              </TabsTrigger>
              <TabsTrigger value="recovery" className="flex items-center gap-1">
                <Key className="h-3 w-3" />
                Recovery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  We sent a code to {userPhone ? `***-***-${userPhone.slice(-4)}` : 'your phone'}
                </p>
                {!canResend && timeRemaining > 0 && (
                  <Badge variant="outline" className="mb-4">
                    <Clock className="h-3 w-3 mr-1" />
                    Resend in {timeRemaining}s
                  </Badge>
                )}
              </div>

              <Form {...mfaForm}>
                <form onSubmit={mfaForm.handleSubmit(handleMfaVerify)} className="space-y-4">
                  <FormField
                    control={mfaForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="123456"
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                            autoComplete="one-time-code"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <Button
                variant="outline"
                onClick={() => handleRequestNewCode('sms')}
                disabled={!canResend || isLoading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend SMS Code
              </Button>
            </TabsContent>

            <TabsContent value="totp" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Enter the code from your authenticator app
                </p>
              </div>

              <Form {...mfaForm}>
                <form onSubmit={mfaForm.handleSubmit(handleMfaVerify)} className="space-y-4">
                  <FormField
                    control={mfaForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authenticator Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="123456"
                            className="text-center text-lg tracking-widest"
                            maxLength={6}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Enter one of your recovery codes</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Recovery Code</Label>
                  <Input
                    placeholder="Enter 8-character recovery code"
                    className="text-center text-lg tracking-widest"
                    maxLength={8}
                    onChange={e => {
                      if (e.target.value.length === 8) {
                        handleUseRecoveryCode(e.target.value);
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>

                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Recovery codes can only be used once. Make sure to save your remaining codes
                    safely.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Having trouble? Contact{' '}
              <a href="mailto:support@hasivu.edu" className="text-primary-600 hover:underline">
                support@hasivu.edu
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MFA Setup Mode
  if (mode === 'setup') {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Settings className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Setup Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Form {...setupForm}>
            <form onSubmit={setupForm.handleSubmit(handleMfaSetup)} className="space-y-6">
              <FormField
                control={setupForm.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Choose Authentication Method</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        <label
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            field.value === 'sms'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            value="sms"
                            checked={field.value === 'sms'}
                            onChange={field.onChange}
                            className="sr-only"
                          />
                          <Phone className="h-5 w-5 text-primary-600" />
                          <div className="flex-1">
                            <div className="font-medium">SMS Text Message</div>
                            <div className="text-sm text-gray-500">Receive codes via SMS</div>
                          </div>
                        </label>

                        <label
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            field.value === 'totp'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            value="totp"
                            checked={field.value === 'totp'}
                            onChange={field.onChange}
                            className="sr-only"
                          />
                          <Smartphone className="h-5 w-5 text-primary-600" />
                          <div className="flex-1">
                            <div className="font-medium">Authenticator App</div>
                            <div className="text-sm text-gray-500">
                              Use Google Authenticator or similar
                            </div>
                          </div>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {setupForm.watch('method') === 'sms' && (
                <FormField
                  control={setupForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="flex-1"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendSms}
                            disabled={!field.value || isLoading}
                          >
                            Test
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {setupForm.watch('method') === 'totp' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateQrCode}
                      disabled={isLoading}
                      className="mb-4"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </Button>

                    {qrCodeData && (
                      <div className="flex justify-center mb-4">
                        <img
                          src={qrCodeData}
                          alt="QR Code"
                          className="w-48 h-48 border rounded-lg"
                        />
                      </div>
                    )}

                    <p className="text-sm text-gray-600">
                      Scan this QR code with your authenticator app, then enter a code to verify
                      setup.
                    </p>
                  </div>

                  <div>
                    <Label>Verification Code</Label>
                    <Input
                      placeholder="Enter code from your app"
                      className="text-center"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable Two-Factor Auth
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Recovery Codes Display */}
          {recoveryCodes.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-yellow-900">Recovery Codes</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                  >
                    {showRecoveryCodes ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={copyAllRecoveryCodes}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {showRecoveryCodes && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {recoveryCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-white rounded border text-sm font-mono"
                    >
                      <span>{code}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => copyRecoveryCode(code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> Save these recovery codes in a safe place. You can use
                  them to access your account if you lose your phone or authenticator app.
                </AlertDescription>
              </Alert>

              <Form {...recoveryForm}>
                <form className="mt-3">
                  <FormField
                    control={recoveryForm.control}
                    name="acknowledged"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label className="text-sm text-gray-700">
                            I have saved these recovery codes in a safe place
                          </Label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
