'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Utensils, Clock3, Repeat, Star, Users } from 'lucide-react';
import { events } from '@/lib/analytics';

// A minimal, typography-first landing layout inspired by sprrrint.com
// Clean layout, bold type, generous spacing, subtle grid, and strong CTAs

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-ink-700">
    {children}
  </span>
);

const Feature = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-ink-800">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="text-ink-700">{text}</p>
    </div>
  </div>
);

export default function SprrrintInspiredLandingPage() {
  // Social links via env if needed in future — reuse from Startwell page if we add footer socials
  return (
    <div className="min-h-screen bg-white">
      {/* Subtle grid background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-black tracking-tight text-ink-900">
            HASIVU
          </Link>
          <nav className="hidden gap-8 md:flex">
            <Link href="#features" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              Features
            </Link>
            <Link href="#how" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              How it works
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-ink-600 hover:text-ink-900"
            >
              Parents
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-ink-600 hover:text-ink-900"
            >
              Login
            </Link>
            <Link href="/menu">
              <Button
                size="sm"
                className="rounded-xl bg-slate-900 text-white hover:bg-black"
                onClick={() => events.ctaClick('nav_order_now', { location: 'nav' })}
              >
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-200/80">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <Badge className="mb-6 bg-slate-900 text-white">New</Badge>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-ink-900 md:text-6xl">
              School meals, simplified.
              <span className="block text-ink-500">
                Warm, nutritious lunches delivered to the classroom.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-700">
              Subscribe and save or order à la carte. Total flexibility—change, pause, or cancel by
              midnight.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="rounded-2xl bg-slate-900 px-7 text-white hover:bg-black"
                  onClick={() => events.ctaClick('hero_primary_order', { location: 'hero' })}
                >
                  Order Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/orders">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-slate-300"
                  onClick={() => events.ctaClick('hero_secondary_manage', { location: 'hero' })}
                >
                  Manage Subscription
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Pill>
                <Utensils className="mr-2 h-4 w-4" /> Fresh ingredients
              </Pill>
              <Pill>
                <Clock3 className="mr-2 h-4 w-4" /> Delivered at recess
              </Pill>
              <Pill>
                <Repeat className="mr-2 h-4 w-4" /> Edit until midnight
              </Pill>
            </div>
          </div>
          <div className="md:col-span-5">
            <Card className="rounded-2xl border-slate-200 shadow-medium">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">4.9★</div>
                    <p className="text-sm text-ink-700">Parent rating</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">99.9%</div>
                    <p className="text-sm text-ink-700">On-time delivery</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">100%</div>
                    <p className="text-sm text-ink-700">Flexible plans</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">0</div>
                    <p className="text-sm text-ink-700">Artificial colors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Logo row / trust */}
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="mb-6 text-center text-sm text-ink-500">
            Trusted by families across top schools
          </p>
          <div className="grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-3 md:grid-cols-6">
            {['DPS', 'NPS', 'Ryan', 'Greenwood', 'Sarvodaya', 'Kendriya'].map(n => (
              <div key={n} className="text-center text-sm font-semibold text-slate-500">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <h2 className="mb-10 text-3xl font-black text-ink-900 md:text-4xl">
            Everything you need to feel confident
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <Feature
              icon={Shield}
              title="Safe & Verified"
              text="Real-time delivery confirmation and parent notifications."
            />
            <Feature
              icon={Users}
              title="Designed for Families"
              text="Simple flows for ordering, swapping and pausing meals."
            />
            <Feature
              icon={Star}
              title="Balanced & Loved"
              text="Curated by nutritionists, cooked by chefs, loved by kids."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <h2 className="mb-10 text-3xl font-black text-ink-900 md:text-4xl">How it works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {['Order Online', 'Delivered Warm', 'Full Flexibility'].map((t, i) => (
              <Card key={t} className="rounded-2xl border-slate-200">
                <CardContent className="p-6">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Step {i + 1}
                  </div>
                  <div className="text-xl font-semibold text-ink-900">{t}</div>
                  <p className="mt-2 text-ink-700">
                    {i === 0 && 'Choose single meals or subscribe; set preferences and allergies.'}
                    {i === 1 &&
                      'Meals arrive to classrooms just before recess to keep them warm and fresh.'}
                    {i === 2 &&
                      'Change, pause, or cancel by midnight—full control in your dashboard.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/menu">
              <Button
                size="lg"
                className="rounded-2xl bg-slate-900 px-7 text-white hover:bg-black"
                onClick={() => events.ctaClick('how_start_order_sprrrint', { location: 'how' })}
              >
                Start an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Slim footer CTA */}
      <section className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-ink-900">Ready when you are</div>
            <div className="text-xs text-ink-700">Order a single meal or subscribe to save</div>
          </div>
          <Link href="/menu">
            <Button
              size="sm"
              className="rounded-xl bg-slate-900 text-white hover:bg-black"
              onClick={() => events.ctaClick('footer_order_now_sprrrint', { location: 'footer' })}
            >
              Order Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
