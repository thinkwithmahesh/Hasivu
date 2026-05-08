import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from './badge';

export interface MealCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  dietaryFlags?: ('veg' | 'nonVeg' | 'nuts' | 'gf' | 'df')[];
  isAllergyConflict?: boolean;
  allergyWarningMessage?: string;
  onAddClick?: () => void;
  actionDisabled?: boolean;
}

export function MealCard({
  name,
  description,
  imageUrl,
  price,
  dietaryFlags = [],
  isAllergyConflict = false,
  allergyWarningMessage,
  onAddClick,
  actionDisabled = false,
}: MealCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={!shouldReduceMotion ? { y: -4, transition: { duration: 0.2 } } : {}}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-pm-surface-1 shadow-sm transition-shadow hover:shadow-md border-2 ${
        isAllergyConflict
          ? 'border-pm-semantic-danger'
          : 'border-pm-neutral-100 hover:border-pm-primary-200'
      }`}
    >
      {/* Allergy Warning Overlay Banner */}
      {isAllergyConflict && (
        <div
          role="alert"
          className="absolute top-0 left-0 right-0 z-10 bg-pm-semantic-danger text-pm-text-inverse px-3 py-1.5 text-[11px] font-ui font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {allergyWarningMessage || 'Allergy Conflict'}
        </div>
      )}

      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full bg-pm-surface-2 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 ${!shouldReduceMotion ? 'group-hover:scale-105' : ''} ${isAllergyConflict ? 'grayscale opacity-75' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pm-text-tertiary">
            <svg
              className="w-8 h-8 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Dietary Flags positioning */}
        {dietaryFlags.length > 0 && (
          <div className={`absolute left-2 flex gap-1 ${isAllergyConflict ? 'bottom-2' : 'top-2'}`}>
            {dietaryFlags.map(flag => (
              <Badge key={flag} variant="outline" className="text-[10px] font-semibold uppercase">
                {flag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-4">
        <h3
          className={`font-ui font-bold text-[16px] leading-tight mb-1 ${isAllergyConflict ? 'text-pm-text-secondary' : 'text-pm-text-primary'}`}
        >
          {name}
        </h3>

        {description && (
          <p className="font-body text-[13px] text-pm-text-tertiary line-clamp-2 mb-3">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span
            className={`font-hero text-[20px] ${isAllergyConflict ? 'text-pm-text-tertiary' : 'text-pm-primary-600'}`}
          >
            ₹{price.toFixed(2)}
          </span>

          <button
            type="button"
            onClick={onAddClick}
            disabled={isAllergyConflict || actionDisabled}
            title={isAllergyConflict ? allergyWarningMessage || 'Not suitable for selected child' : ''}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-primary-600 focus-visible:ring-offset-2 ${
              isAllergyConflict || actionDisabled
                ? 'bg-pm-neutral-200 text-pm-text-tertiary cursor-not-allowed'
                : 'bg-pm-primary-100 text-pm-primary-600 hover:bg-pm-primary-600 hover:text-white'
            }`}
            aria-label={`Add ${name} to order`}
          >
            {isAllergyConflict ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
