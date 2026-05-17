'use client';

import React from 'react';

interface StatItem {
  value: string;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
}

export interface StatsSectionProps {
  title?: string;
  subtitle?: string;
  stats?: StatItem[];
  variant?: 'default' | 'accent';
}

const defaultStats: StatItem[] = [
  { value: '5', label: 'Launch personas' },
  { value: '3', label: 'Core workspaces' },
  { value: '2', label: 'Health endpoints' },
  { value: '1', label: 'Docker-first runtime' },
];

export const StatsSection: React.FC<StatsSectionProps> = ({
  title = 'Operational focus',
  subtitle = 'HASIVU is organized around measurable readiness signals rather than unverifiable marketing metrics.',
  stats = defaultStats,
  variant = 'default',
}) => {
  const accent = variant === 'accent';

  return (
    <section className={accent ? 'bg-orange-50 py-20' : 'bg-stone-50 py-20'}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-stone-950 md:text-4xl">{title}</h2>
          <p className="mt-4 leading-7 text-stone-600">{subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={`${stat.label}-${index}`} className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
              {stat.icon && <div className="mb-3 flex justify-center text-emerald-700">{stat.icon}</div>}
              <div className="text-4xl font-bold text-emerald-700">
                {stat.value}
                {stat.suffix && <span className="text-2xl">{stat.suffix}</span>}
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-stone-600">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
