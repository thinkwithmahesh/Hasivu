'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Phone,
  Shield,
  HelpCircle,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  School,
  Users,
  Key,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label as Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  forgotPasswordSchema,
  securityQuestionsSchema,
  parentVerificationSchema,
  type ForgotPasswordFormData,
  type SecurityQuestionsFormData,
  type ParentVerificationFormData,
  detectRoleFromEmail,
} from './schemas';

interface EnhancedPasswordRecoveryFormProps {
  onEmailRecovery: (data: ForgotPasswordFormData) => Promise<void>;
  onSecurityQuestions: (data: SecurityQuestionsFormData) => Promise<void>;
  onParentVerification: (data: ParentVerificationFormData) => Promise<void>;
  onSendSMS?: (phone: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  className?: string;
}

const SECURITYQUESTIONS = [
  'What was the name of your first pet?',
  "What is your mother's maiden name?",
  'What was the name of your elementary school?',
  'What is your favorite food?',
  'What was your childhood nickname?',
  'What is the name of your best friend?',
  'What was your first car model?',
  'What city were you born in?',
];

export function EnhancedPasswordRecoveryForm({
  onEmailRecovery,
  onSecurityQuestions,
  onParentVerification,
  onSendSMS,
  isLoading = false,
  error,
  success,
  className,
}: EnhancedPasswordRecoveryFormProps) {
  const [recoveryMethod, setRecoveryMethod] = React.useState<'email' | 'security' | 'parent'>(
    'email'
  );
  const [detectedRole, setDetectedRole] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<'initial' | 'questions' | 'verification' | 'success'>(
    'initial'
  );

  // Email recovery form
  const emailForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Security questions form
  const questionsForm = useForm<SecurityQuestionsFormData>({
    resolver: zodResolver(securityQuestionsSchema),
    defaultValues: {
      question1: SECURITYQUESTIONS[0],
      answer1: '',
      question2: SECURITYQUESTIONS[1],
      answer2: '',
      question3: SECURITYQUESTIONS[2],
      answer3: '',
    },
  });

  // Parent verification form
  const parentForm = useForm<ParentVerificationFormData>({
    resolver: zodResolver(parentVerificationSchema),
    defaultValues: {
      parentEmail: '',
      studentId: '',
      relationshipType: 'parent' as const,
      phoneNumber: '',
      verificationCode: '',
    },
  });

  const watchedEmail = emailForm.watch('email');

  // Role detection from email
  React.useEffect(() => {
    if (watchedEmail && watchedEmail.includes('@hasivu.edu')) {
      const role = detectRoleFromEmail(watchedEmail);
      setDetectedRole(role);

      if (role) {
      }
    } else {
      setDetectedRole(null);
    }
  }, [watchedEmail, emailForm]);

  const handleEmailRecovery = async (data: ForgotPasswordFormData) => {
    try {
      await onEmailRecovery(data);
      setStep('success');
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSecurityQuestions = async (data: SecurityQuestionsFormData) => {
    try {
      await onSecurityQuestions(data);
      setStep('success');
    } catch (error) {
      // Error handled silently
    }
  };

  const handleParentVerification = async (data: ParentVerificationFormData) => {
    try {
      await onParentVerification(data);
      setStep('success');
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSendVerificationCode = async () => {
    const phone = parentForm.getValues('phoneNumber');
    if (phone && onSendSMS) {
      try {
        await onSendSMS(phone);
      } catch (error) {
        // Error handled silently
      }
    }
  };

  const renderRoleBadge = () => {
    if (!detectedRole) return null;

    const roleConfig = {
      student: { label: 'Student', color: 'bg-blue-100 text-blue-800', icon: School },
      parent: { label: 'Parent', color: 'bg-green-100 text-green-800', icon: Users },
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: Shield },
      kitchen: { label: 'Kitchen', color: 'bg-orange-100 text-orange-800', icon: Users },
      teacher: { label: 'Teacher', color: 'bg-indigo-100 text-indigo-800', icon: School },
    };

    const config = roleConfig[detectedRole as keyof typeof roleConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <div className="mt-2 flex items-center gap-2">
        <IconComponent className="h-4 w-4" />
        <Badge variant="outline" className={config.color}>
          Detected: {config.label}
        </Badge>
      </div>
    );
  };

  if (step === 'success') {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-green-900">
            Recovery Instructions Sent
          </CardTitle>
          <CardDescription>
            Please check your email or follow the verification steps provided
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you don't receive instructions within a few minutes, please check your spam folder
              or contact support.
            </p>

            <div className="flex flex-col gap-3">
              <Button asChild variant="default">
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Link>
              </Button>

              <Button asChild variant="outline">
                <a href="mailto:support@hasivu.edu">Contact Support</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Recover Your Account</CardTitle>
        <CardDescription className="text-center">
          Choose your preferred recovery method for your HASIVU account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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

        <Tabs value={recoveryMethod} onValueChange={value => setRecoveryMethod(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Parent Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900">Email Recovery</h3>
              <p className="text-sm text-gray-600">
                Enter your HASIVU email address to receive reset instructions
              </p>
            </div>

            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailRecovery)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HASIVU Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.name@hasivu.edu"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {renderRoleBadge()}
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reset Instructions
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900">Security Questions</h3>
              <p className="text-sm text-gray-600">
                Answer your security questions to reset your password
              </p>
            </div>

            <Form {...questionsForm}>
              <form
                onSubmit={questionsForm.handleSubmit(handleSecurityQuestions)}
                className="space-y-4"
              >
                <FormField
                  control={questionsForm.control}
                  name="answer1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {questionsForm.getValues('question1')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="Your answer"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={questionsForm.control}
                  name="answer2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {questionsForm.getValues('question2')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="Your answer"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={questionsForm.control}
                  name="answer3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {questionsForm.getValues('question3')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="Your answer"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
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
                      Verify Answers
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Answers are case-insensitive and should match what you provided during registration.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="parent" className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-900">Parent Verification</h3>
              <p className="text-sm text-gray-600">
                For student accounts, parent verification can help reset the password
              </p>
            </div>

            <Form {...parentForm}>
              <form
                onSubmit={parentForm.handleSubmit(handleParentVerification)}
                className="space-y-4"
              >
                <FormField
                  control={parentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="student.123@hasivu.edu"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={parentForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    disabled={isLoading || !parentForm.getValues('phoneNumber')}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Code
                  </Button>
                </div>

                <FormField
                  control={parentForm.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="123456"
                            className="pl-10"
                            maxLength={6}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code sent to your phone
                      </p>
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
                      <Users className="w-4 h-4 mr-2" />
                      Verify Parent
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This method requires the parent phone number registered with the student account.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-500 font-medium focus:outline-none focus:underline"
            >
              Sign in instead
            </Link>
          </p>

          <p className="text-xs text-gray-500">
            Still need help? Contact{' '}
            <a href="mailto:support@hasivu.edu" className="text-primary-600 hover:underline">
              support@hasivu.edu
            </a>{' '}
            or call the school office
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
