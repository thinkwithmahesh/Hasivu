'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Soup, School } from 'lucide-react';

export interface HeroSectionProps {
  showCTA?: boolean;
  headline?: string;
  subheadline?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  showCTA = true,
  headline = 'School meals coordinated with care, safety, and clarity',
  subheadline = 'HASIVU connects parents, students, schools, kitchens, and vendors through cookie-secured ordering, RFID delivery verification, and operational dashboards.',
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-orange-600 text-white">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-orange-300/10 blur-2xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-28">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
            Warm school-meal operations, built for real roles
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">{headline}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">{subheadline}</p>

          {showCTA && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 py-3 font-semibold text-stone-950 transition hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-emerald-800">
                Request a demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-800">
                View workflows
              </button>
            </div>
          )}

          <div className="mt-10 grid gap-4 text-sm text-white/90 sm:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-200" /> Cookie-secured auth
            </span>
            <span className="inline-flex items-center gap-2">
              <Soup className="h-5 w-5 text-orange-200" /> Meal ordering
            </span>
            <span className="inline-flex items-center gap-2">
              <School className="h-5 w-5 text-orange-200" /> School workflows
            </span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/20 bg-white/12 p-6 shadow-2xl backdrop-blur">
          <div className="rounded-3xl bg-stone-50 p-5 text-stone-950">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Today at lunch
            </p>
            <div className="mt-5 space-y-3">
              {['Parent order confirmed', 'Kitchen preparing meals', 'RFID pickup ready'].map(item => (
                <div key={item} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                  <p className="font-semibold">{item}</p>
                  <p className="mt-1 text-sm text-stone-600">Clear status without noisy animation.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
