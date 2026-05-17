import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const SpinnerWithText: React.FC<SpinnerProps & { text?: string }> = ({
  text = 'Loading...',
  ...props
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Spinner {...props} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
};

export default Spinner;
