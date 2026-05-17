'use client';

import React from 'react';
import { ArrowRight, Phone } from 'lucide-react';

export interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  showContactButton?: boolean;
  variant?: 'default' | 'gradient';
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onContactClick?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to review HASIVU for your school?",
  subtitle = 'Request a guided walkthrough of parent ordering, admin operations, kitchen workflows, RFID verification, and vendor coordination.',
  primaryButtonText = 'Request Demo',
  secondaryButtonText = 'View Product Flow',
  showContactButton = true,
  variant = 'gradient',
  onPrimaryClick,
  onSecondaryClick,
  onContactClick,
}) => {
  const isGradient = variant === 'gradient';

  return (
    <section className={isGradient ? 'relative overflow-hidden bg-gradient-to-br from-emerald-800 to-orange-600 py-20 text-white' : 'bg-orange-50 py-20 text-stone-950'}>
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold md:text-5xl">{title}</h2>
        <p className={isGradient ? 'mt-5 text-lg leading-8 text-white/85' : 'mt-5 text-lg leading-8 text-stone-600'}>
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPrimaryClick}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 py-3 font-semibold text-stone-950 transition hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-emerald-800"
          >
            {primaryButtonText}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSecondaryClick}
            className={isGradient ? 'inline-flex min-h-11 items-center justify-center rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800' : 'inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-700 px-6 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'}
          >
            {secondaryButtonText}
          </button>
        </div>
        {showContactButton && (
          <div className={isGradient ? 'mt-8 border-t border-white/20 pt-6' : 'mt-8 border-t border-stone-200 pt-6'}>
            <p className={isGradient ? 'text-sm text-white/80' : 'text-sm text-stone-600'}>
              Need help getting started?
            </p>
            <button
              type="button"
              onClick={onContactClick}
              className="mt-3 inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Contact our team
            </button>
          </div>
        )}
      </div>
      {isGradient && <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />}
    </section>
  );
};

export default CTASection;
