/**
 * HASIVU Platform - Authentication Components Test Page
 *
 * This page showcases all authentication components for testing and development
 * Visit /test-auth-components to see all components in action
 */

import * as React from 'react';
import { useState } from 'react';
import Head from 'next/head';

import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  EmailVerificationForm,
  MfaForm,
  BackupCodeForm,
  SocialLoginButtons,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type EmailVerificationFormData,
  type MfaFormData,
} from '@/components/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type ComponentType =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'email-verification'
  | 'mfa-authenticator'
  | 'mfa-sms'
  | 'mfa-email'
  | 'backup-code'
  | 'social-login';

export default function TestAuthComponents() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Mock handlers for testing
  const handleAsyncAction = async (actionName: string, data?: any) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate random success/failure for testing
      if (Math.random() > 0.3) {
        setSuccess(true);
      } else {
        throw new Error(`${actionName} failed: Please try again`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    await handleAsyncAction('Login', data);
  };

  const handleRegister = async (data: RegisterFormData) => {
    await handleAsyncAction('Registration', data);
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    await handleAsyncAction('Forgot Password', data);
  };

  const handleResetPassword = async (data: any) => {
    await handleAsyncAction('Reset Password', data);
  };

  const handleEmailVerification = async (data: EmailVerificationFormData) => {
    await handleAsyncAction('Email Verification', data);
  };

  const handleMfaVerification = async (data: MfaFormData) => {
    await handleAsyncAction('MFA Verification', data);
  };

  const handleBackupCode = async (code: string) => {
    await handleAsyncAction('Backup Code', { code });
  };

  const handleSocialLogin = async (provider: string) => {
    await handleAsyncAction(`${provider} Login`, { provider });
  };

  const handleResendCode = async () => {
    await handleAsyncAction('Resend Code');
  };

  const components = [
    { id: 'login', name: 'Login Form', description: 'Email/password login with social options' },
    { id: 'register', name: 'Register Form', description: 'User registration with role selection' },
    { id: 'forgot-password', name: 'Forgot Password', description: 'Password reset request form' },
    { id: 'reset-password', name: 'Reset Password', description: 'New password creation form' },
    {
      id: 'email-verification',
      name: 'Email Verification',
      description: '6-digit email verification code',
    },
    {
      id: 'mfa-authenticator',
      name: 'MFA - Authenticator',
      description: 'Authenticator app verification',
    },
    { id: 'mfa-sms', name: 'MFA - SMS', description: 'SMS code verification' },
    { id: 'mfa-email', name: 'MFA - Email', description: 'Email code verification' },
    { id: 'backup-code', name: 'Backup Code', description: 'MFA backup code entry' },
    { id: 'social-login', name: 'Social Login', description: 'Social authentication buttons' },
  ] as const;

  const renderComponent = () => {
    const commonProps = {
      isLoading,
      error,
      className: 'w-full max-w-md mx-auto',
    };

    switch (selectedComponent) {
      case 'login':
        return (
          <LoginForm
            {...commonProps}
            onSubmit={handleLogin}
            onSocialLogin={handleSocialLogin}
            showRememberMe={true}
            showSocialLogin={true}
          />
        );

      case 'register':
        return (
          <RegisterForm
            {...commonProps}
            onSubmit={handleRegister}
            onSocialLogin={handleSocialLogin}
            availableRoles={['student', 'parent', 'teacher', 'vendor']}
            showSocialLogin={true}
          />
        );

      case 'forgot-password':
        return (
          <ForgotPasswordForm {...commonProps} onSubmit={handleForgotPassword} success={success} />
        );

      case 'reset-password':
        return (
          <ResetPasswordForm
            {...commonProps}
            onSubmit={handleResetPassword}
            token="sample-reset-token"
            success={success}
          />
        );

      case 'email-verification':
        return (
          <EmailVerificationForm
            {...commonProps}
            onSubmit={handleEmailVerification}
            onResendCode={handleResendCode}
            email="test@example.com"
            success={success}
          />
        );

      case 'mfa-authenticator':
        return (
          <MfaForm
            {...commonProps}
            onSubmit={handleMfaVerification}
            method="authenticator"
            onUseBackupCode={() => setSelectedComponent('backup-code')}
          />
        );

      case 'mfa-sms':
        return (
          <MfaForm
            {...commonProps}
            onSubmit={handleMfaVerification}
            onResendCode={handleResendCode}
            method="sms"
            contact="+91 98765 43210"
            onUseBackupCode={() => setSelectedComponent('backup-code')}
          />
        );

      case 'mfa-email':
        return (
          <MfaForm
            {...commonProps}
            onSubmit={handleMfaVerification}
            onResendCode={handleResendCode}
            method="email"
            contact="test@example.com"
            onUseBackupCode={() => setSelectedComponent('backup-code')}
          />
        );

      case 'backup-code':
        return (
          <BackupCodeForm
            {...commonProps}
            onSubmit={handleBackupCode}
            onBackToMfa={() => setSelectedComponent('mfa-authenticator')}
          />
        );

      case 'social-login':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Social Login Options</CardTitle>
              <CardDescription>Test different social login configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Horizontal Layout (2 providers)</h4>
                <SocialLoginButtons
                  onSocialLogin={handleSocialLogin}
                  providers={['google', 'facebook']}
                  orientation="horizontal"
                  isLoading={isLoading}
                />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Vertical Layout (4 providers)</h4>
                <SocialLoginButtons
                  onSocialLogin={handleSocialLogin}
                  providers={['google', 'facebook', 'github', 'apple']}
                  orientation="vertical"
                  isLoading={isLoading}
                />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Grid Layout (3 providers)</h4>
                <SocialLoginButtons
                  onSocialLogin={handleSocialLogin}
                  providers={['google', 'facebook', 'github']}
                  orientation="horizontal"
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return <div>Component not found</div>;
    }
  };

  return (
    <>
      <Head>
        <title>Authentication Components Test - HASIVU</title>
        <meta name="description" content="Test page for HASIVU authentication components" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Authentication Components Test</h1>
            <p className="text-gray-600 mt-2">
              Interactive showcase of all HASIVU authentication components
            </p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Component Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Components</CardTitle>
                  <CardDescription>Select a component to test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {components.map(component => (
                    <Button
                      key={component.id}
                      variant={selectedComponent === component.id ? 'default' : 'ghost'}
                      onClick={() => {
                        setSelectedComponent(component.id as ComponentType);
                        setError(null);
                        setSuccess(false);
                      }}
                      className="w-full justify-start text-left h-auto py-2 px-3"
                    >
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-xs text-muted-foreground">{component.description}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Reset Button */}
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setSuccess(false);
                      setIsLoading(false);
                    }}
                    className="w-full"
                  >
                    Reset State
                  </Button>

                  {/* State Display */}
                  <div className="mt-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Loading:</span>
                      <span className={isLoading ? 'text-blue-600' : 'text-gray-400'}>
                        {isLoading ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success:</span>
                      <span className={success ? 'text-green-600' : 'text-gray-400'}>
                        {success ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span className={error ? 'text-red-600' : 'text-gray-400'}>
                        {error ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Component Display */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Component Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {components.find(c => c.id === selectedComponent)?.name}
                      </h2>
                      <p className="text-gray-600">
                        {components.find(c => c.id === selectedComponent)?.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Component Render */}
                <div className="flex justify-center">{renderComponent()}</div>

                {/* Usage Example */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                    <CardDescription>Basic implementation code for this component</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                      <code>{`import { ${components.find(c => c.id === selectedComponent)?.name.replace(' ', '')} } from '@/components/auth'

function MyComponent() {
  const handleSubmit = async (data) => {
    // Handle form submission
  }

  return (
    <${components.find(c => c.id === selectedComponent)?.name.replace(' ', '')}
      onSubmit={handleSubmit}
      isLoading={false}
      error={null}
    />
  )
}`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
