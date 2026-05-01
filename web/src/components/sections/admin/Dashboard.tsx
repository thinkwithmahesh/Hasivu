'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const display = useTransform(rounded, latest => `${prefix}${latest.toLocaleString()}${suffix}`);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{display}</motion.span>;
}

export function Dashboard() {
  return (
    <div className="flex flex-col gap-8 pb-12 w-full animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-hero text-[36px] text-pm-text-primary leading-tight">Overview</h1>
          <p className="font-ui text-pm-text-secondary text-[14px]">
            Welcome back to the admin portal.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">System Operations: Normal</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="elevated">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="font-ui font-semibold text-pm-text-secondary text-[14px]">
              Total Revenue (Today)
            </div>
            <div className="font-hero text-[42px] text-pm-primary-800 leading-none mt-4">
              <AnimatedCounter value={42500} prefix="₹" />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="font-ui font-semibold text-pm-text-secondary text-[14px]">
              Active Orders
            </div>
            <div className="font-hero text-[42px] text-pm-primary-800 leading-none mt-4">
              <AnimatedCounter value={842} />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="font-ui font-semibold text-pm-text-secondary text-[14px]">
              Students Fed
            </div>
            <div className="font-hero text-[42px] text-pm-text-primary leading-none mt-4">
              <AnimatedCounter value={1250} />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
            <div className="font-ui font-semibold text-pm-text-secondary text-[14px]">
              Dietary Alternates
            </div>
            <div className="font-hero text-[42px] text-pm-semantic-warning leading-none mt-4">
              <AnimatedCounter value={65} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders Matrix</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-64 text-pm-text-tertiary">
            Chart View integration point
            <br />
            (ApexCharts / Recharts wrapper goes here)
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kitchen Activity Live</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center py-2 border-b border-pm-neutral-100 last:border-0">
              <span className="font-body text-[14px]">Grade 1A Batch</span>
              <Badge variant="success">Completed</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-pm-neutral-100 last:border-0">
              <span className="font-body text-[14px]">Grade 2B Batch</span>
              <Badge variant="warning">Preparing</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-pm-neutral-100 last:border-0">
              <span className="font-body text-[14px]">Grade 3C Batch</span>
              <Badge variant="neutral">Queued</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
