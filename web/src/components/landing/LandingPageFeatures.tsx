'use client';

import React from 'react';
import { Utensils, Clock, Repeat, Leaf } from 'lucide-react';

const FeatureItem = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="flex items-start space-x-4">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="text-ink-700">{description}</p>
    </div>
  </div>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 text-ink-700 px-3 py-1 text-xs font-medium border border-slate-200">
    {children}
  </span>
);

export function LandingPageFeatures() {
  return (
    <section id="how" className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">How HASIVU works</h2>
          <p className="text-xl text-ink-600 max-w-2xl mx-auto">
            Simple steps to get nutritious meals delivered to your child's classroom
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureItem
            icon={Utensils}
            title="Browse & Order"
            description="Choose from daily-changing, nutritious meal options with clear ingredients and nutrition info."
          />
          <FeatureItem
            icon={Clock}
            title="Scheduled Delivery"
            description="Meals arrive warm at your child's classroom right before lunch time."
          />
          <FeatureItem
            icon={Repeat}
            title="Flexible Changes"
            description="Modify, pause, or cancel orders until midnight before delivery day."
          />
          <FeatureItem
            icon={Leaf}
            title="Quality Guaranteed"
            description="Fresh ingredients, rigorous safety standards, and nutrition-first recipes."
          />
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl font-bold text-ink-900 mb-4">Join thousands of happy families</h3>
          <p className="text-ink-600 mb-6 max-w-2xl mx-auto">
            Parents love the convenience, kids love the food, and schools appreciate the seamless
            process.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Pill>No minimum orders</Pill>
            <Pill>Cancel anytime</Pill>
            <Pill>Allergen-friendly options</Pill>
            <Pill>Parent dashboard</Pill>
          </div>
        </div>
      </div>
    </section>
  );
}
