import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type TrustStat = {
  value: string;
  label: string;
};

type TrustMetricsStripProps = {
  stats: TrustStat[];
  className?: string;
};

export function TrustMetricsStrip({ stats, className }: TrustMetricsStripProps) {
  return (
    <Card
      className={`rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary shadow-sm ${className || ''}`}
    >
      <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-pm-neutral-200 bg-pm-surface-1 p-4"
          >
            <div className="text-2xl font-bold text-pm-text-primary">{stat.value}</div>
            <p className="text-xs text-pm-text-secondary">{stat.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
