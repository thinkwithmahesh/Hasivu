'use client';

import React, { ReactNode } from 'react';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'highlighted';
  onClick?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  variant = 'default',
  onClick,
}) => {
  const highlighted = variant === 'highlighted';

  return (
    <article
      onClick={onClick}
      className={[
        'relative h-full overflow-hidden rounded-3xl border bg-white p-8 shadow-sm transition duration-200',
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : '',
        highlighted
          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-orange-50'
          : 'border-stone-200 hover:border-emerald-300',
      ].join(' ')}
    >
      {highlighted && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 to-orange-500" />}
      <div className="mb-6 inline-flex text-emerald-700 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      <h3 className="mb-3 text-xl font-semibold text-stone-950">{title}</h3>
      <p className="leading-7 text-stone-600">{description}</p>
    </article>
  );
};

export default FeatureCard;
