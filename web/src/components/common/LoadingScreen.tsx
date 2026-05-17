'use client';

import React from 'react';

export interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
  size?: 'small' | 'medium' | 'large';
  backgroundOpacity?: number;
  variant?: 'fullscreen' | 'inline';
  progress?: number;
  details?: string;
  color?: 'primary' | 'secondary';
  speed?: 'slow' | 'normal' | 'fast';
}

const sizeClasses = {
  small: 'h-10 w-10 text-xl',
  medium: 'h-16 w-16 text-2xl',
  large: 'h-20 w-20 text-3xl',
};

const spinnerSizeClasses = {
  small: 'h-8 w-8',
  medium: 'h-12 w-12',
  large: 'h-16 w-16',
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading HASIVU...',
  showLogo = true,
  size = 'medium',
  backgroundOpacity = 0.9,
  variant = 'fullscreen',
  progress,
  details,
  color = 'primary',
}) => {
  const accent = color === 'primary' ? 'border-emerald-600 text-emerald-700' : 'border-orange-500 text-orange-700';
  const content = (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl"
    >
      {showLogo && (
        <div className={`${sizeClasses[size]} mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-emerald-700 font-bold text-white shadow-lg`}>
          H
        </div>
      )}
      <div className={`${spinnerSizeClasses[size]} animate-spin rounded-full border-4 border-stone-200 border-t-current ${accent}`} />
      <p className="mt-5 text-lg font-semibold text-stone-950">{message}</p>
      {details && <p className="mt-2 text-sm leading-6 text-stone-600">{details}</p>}
      {progress !== undefined && (
        <div className="mt-5 w-full">
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-stone-500">{Math.round(progress)}%</p>
        </div>
      )}
      <p className="mt-4 text-xs italic text-stone-400">Preparing the school meal workspace...</p>
    </div>
  );

  if (variant === 'inline') {
    return <div className="flex items-center justify-center px-4 py-12">{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-[2100] flex min-h-screen items-center justify-center px-4 backdrop-blur-md"
      style={{ backgroundColor: `rgba(250, 250, 249, ${backgroundOpacity})` }}
    >
      {content}
    </div>
  );
};

export default LoadingScreen;
