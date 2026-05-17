'use client';

import * as React from 'react';
import { Loader2, Github } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: 'google' | 'facebook' | 'github' | 'apple') => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  providers?: ('google' | 'facebook' | 'github' | 'apple')[];
  orientation?: 'horizontal' | 'vertical';
  showSeparator?: boolean;
  separatorText?: string;
  className?: string;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24">
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
    ),
    bgColor: 'bg-white',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    hoverColor: 'hover:bg-gray-50',
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bgColor: 'bg-[#1877F2]',
    textColor: 'text-white',
    borderColor: 'border-[#1877F2]',
    hoverColor: 'hover:bg-[#166FE5]',
  },
  github: {
    name: 'GitHub',
    icon: <Github className="h-4 w-4" />,
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-gray-900',
    hoverColor: 'hover:bg-gray-800',
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-black',
    hoverColor: 'hover:bg-gray-900',
  },
};

export function SocialLoginButtons({
  onSocialLogin,
  isLoading = false,
  disabled = false,
  providers = ['google', 'facebook'],
  orientation = 'horizontal',
  showSeparator = true,
  separatorText = 'Or continue with',
  className,
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);

  const handleSocialLogin = async (provider: keyof typeof providerConfig) => {
    if (disabled || isLoading) return;

    setLoadingProvider(provider);
    try {
      await onSocialLogin(provider);
    } catch (error) {
    } finally {
      setLoadingProvider(null);
    }
  };

  const gridCols =
    orientation === 'horizontal'
      ? providers.length === 1
        ? 'grid-cols-1'
        : providers.length === 2
          ? 'grid-cols-2'
          : providers.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-4'
      : 'grid-cols-1';

  return (
    <div className={cn('space-y-4', className)}>
      {showSeparator && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">{separatorText}</span>
          </div>
        </div>
      )}

      <div className={cn('grid gap-3', gridCols)}>
        {providers.map(provider => {
          const config = providerConfig[provider];
          const isProviderLoading = loadingProvider === provider;

          return (
            <Button
              key={provider}
              variant="outline"
              onClick={() => handleSocialLogin(provider)}
              disabled={disabled || isLoading || isProviderLoading}
              className={cn(
                'relative',
                config.bgColor,
                config.textColor,
                config.borderColor,
                config.hoverColor,
                'transition-colors duration-200'
              )}
              size="lg"
            >
              {isProviderLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="mr-2">{config.icon}</span>
              )}
              {orientation === 'vertical' || providers.length === 1
                ? `Continue with ${config.name}`
                : config.name}
            </Button>
          );
        })}
      </div>

      {/* Privacy notice for social logins */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <a
            href="/legal/terms"
            className="text-primary-600 hover:text-primary-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>{' '}
          and{' '}
          <a
            href="/legal/privacy"
            className="text-primary-600 hover:text-primary-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

// Individual Social Login Button Component
interface SocialLoginButtonProps {
  provider: keyof typeof providerConfig;
  onClick: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function SocialLoginButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
  fullWidth = false,
  size = 'default',
  className,
}: SocialLoginButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading}
      size={size}
      className={cn(
        'relative',
        config.bgColor,
        config.textColor,
        config.borderColor,
        config.hoverColor,
        'transition-colors duration-200',
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <span className="mr-2">{config.icon}</span>
      )}
      Continue with {config.name}
    </Button>
  );
}

// Social Login Grid Component for more complex layouts
interface SocialLoginGridProps {
  onSocialLogin: (provider: keyof typeof providerConfig) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  providers?: (keyof typeof providerConfig)[];
  columns?: 1 | 2 | 3 | 4;
  showLabels?: boolean;
  className?: string;
}

export function SocialLoginGrid({
  onSocialLogin,
  isLoading = false,
  disabled = false,
  providers = ['google', 'facebook'],
  columns = 2,
  showLabels: _showLabels = true,
  className,
}: SocialLoginGridProps) {
  return (
    <div className={cn(`grid grid-cols-${columns} gap-3`, className)}>
      {providers.map(provider => (
        <SocialLoginButton
          key={provider}
          provider={provider}
          onClick={() => onSocialLogin(provider)}
          isLoading={isLoading}
          disabled={disabled}
          fullWidth
        />
      ))}
    </div>
  );
}
