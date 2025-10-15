'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  Utensils,
  Clock3,
  Repeat,
  Leaf,
  GraduationCap,
  ChefHat,
  Star,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { events } from '@/lib/analytics';
import { BackgroundBeams } from '@/components/magicui/background-beams';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { Marquee } from '@/components/magicui/marquee';

// Hybrid landing page: Startwell content hierarchy + Sprrrint minimal style

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
    {children}
  </span>
);

const Feature = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="flex items-start gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-slate-600">{text}</p>
    </div>
  </div>
);

const testimonials = [
  {
    quote:
      'HASIVU made school lunches stress-free. My child gets warm meals on time and I can change plans easily!',
    author: 'Shalini K.',
    title: 'Parent, Grade 4',
  },
  {
    quote:
      'The flexibility to pause or swap meals the night before is a game changer for busy families.',
    author: 'Rahul S.',
    title: 'Parent, Grade 7',
  },
  {
    quote: 'Great variety and nutrition. The ordering flow is simple and transparent — love it!',
    author: 'Meera R.',
    title: 'Parent, Grade 2',
  },
];

export default function HybridLandingPage() {
  const [videoOpen, setVideoOpen] = useState(false);
  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle grid background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header (minimal) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-black tracking-tight text-ink-900">
            HASIVU
          </Link>
          <nav className="hidden gap-8 md:flex">
            <Link href="#reasons" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              Why HASIVU
            </Link>
            <Link href="#how" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              How it works
            </Link>
            <Link href="#faqs" className="text-sm font-medium text-ink-600 hover:text-ink-900">
              FAQs
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
                onClick={() => events.ctaClick('nav_order_now_hybrid', { location: 'nav' })}
              >
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero (Startwell copy + Sprrrint styling) */}
      <section className="relative border-b border-slate-200/80">
        <BackgroundBeams />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-7">
            <Badge className="mb-6 bg-slate-900 text-white">School meals done right</Badge>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-ink-900 md:text-6xl">
              Warm meals at school, on time
              <span className="block text-ink-500">
                Opt for a single meal or subscribe and save.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-700">
              Change, pause, or cancel by midnight — full control for busy parents.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="rounded-2xl bg-slate-900 px-7 text-white hover:bg-black"
                  onClick={() => events.ctaClick('hero_order_now_hybrid', { location: 'hero' })}
                >
                  Order Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-slate-300"
                onClick={() => {
                  events.ctaClick('hero_video_open_hybrid', { location: 'hero' });
                  setVideoOpen(true);
                }}
              >
                Guided Video — How to Order
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Pill>
                <Utensils className="mr-2 h-4 w-4" /> Meals delivered warm to classroom
              </Pill>
              <Pill>
                <Clock3 className="mr-2 h-4 w-4" /> Arrives during recess
              </Pill>
              <Pill>
                <Repeat className="mr-2 h-4 w-4" /> Pause/cancel until midnight
              </Pill>
            </div>
          </div>
          <div className="md:col-span-5">
            <Card className="rounded-2xl border-slate-200 shadow-medium">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">
                      <NumberTicker value={4.9} className="inline" />★
                    </div>
                    <p className="text-sm text-ink-700">Average parent rating</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">
                      <NumberTicker value={99.9} className="inline" />%
                    </div>
                    <p className="text-sm text-ink-700">On-time delivery</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">
                      <NumberTicker value={100} className="inline" />%
                    </div>
                    <p className="text-sm text-ink-700">Flexible subscriptions</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-3xl font-black text-ink-900">
                      <NumberTicker value={0} className="inline" />
                    </div>
                    <p className="text-sm text-ink-700">Food colorings added</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="mb-6 text-center text-sm text-ink-500">
            Trusted by families across top schools
          </p>
          <Marquee className="py-2" pauseOnHover>
            {['DPS', 'NPS', 'Ryan', 'Greenwood', 'Sarvodaya', 'Kendriya'].map(n => (
              <div key={n} className="mx-6 text-sm font-semibold text-ink-500">
                {n}
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Reasons (Startwell content) */}
      <section id="reasons" className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <h2 className="mb-10 text-3xl font-black text-ink-900 md:text-4xl">
            We feed your kids like our own
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <Feature
              icon={Leaf}
              title="Natural Ingredients"
              text="Sustainably sourced whole and fresh ingredients. We keep it clean and simple."
            />
            <Feature
              icon={GraduationCap}
              title="Designed by Nutritionists"
              text="Balanced, age-appropriate meals aligned to recommended dietary allowances."
            />
            <Feature
              icon={ChefHat}
              title="Prepared by Chefs & Parents"
              text="A team of chefs and parents ensure variety, taste and safety every day."
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
                    {i === 0 &&
                      'Choose a single meal or subscribe for the week/month. Customize preferences and allergies.'}
                    {i === 1 &&
                      'Meals arrive to the classroom just before recess. Packed for freshness and warmth.'}
                    {i === 2 &&
                      'Change, pause, or cancel by midnight. Manage everything from your dashboard.'}
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
                onClick={() => events.ctaClick('how_start_order_hybrid', { location: 'how' })}
              >
                Start an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials (minimal cards) */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-purple-100 text-purple-700 border border-purple-200">
            Parents say it best
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-ink-900">Loved by busy families</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="rounded-2xl border-slate-200">
              <CardContent className="p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-ink-700 italic">“{t.quote}”</p>
                <div className="mt-4 text-sm text-ink-700 font-medium">{t.author}</div>
                <div className="text-xs text-ink-500">{t.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="bg-white border-y border-slate-200/70">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="text-center mb-8">
            <Badge className="mb-3 bg-slate-100 text-ink-700 border-slate-200">FAQs</Badge>
            <h2 className="text-3xl font-black text-ink-900">Questions parents ask</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can I pause or cancel a subscription?</AccordionTrigger>
              <AccordionContent>
                Yes — change, pause, or cancel meals up to midnight the day before. Your dashboard
                gives you full control.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Are meals delivered warm to classrooms?</AccordionTrigger>
              <AccordionContent>
                Meals are prepared fresh and delivered to classrooms just before recess to keep them
                warm and safe.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How do you handle allergies?</AccordionTrigger>
              <AccordionContent>
                You can set dietary preferences and allergies during ordering. We filter options and
                label allergens clearly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Social + Contact (minimal) */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-ink-900">
              We feed your kids like our own
            </h3>
            <p className="mt-3 text-ink-700">
              Follow us for menu highlights, behind-the-scenes, and nutrition tips.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on Instagram"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7 2C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H7ZM12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7ZM18 7.5C18 6.67157 18.6716 6 19.5 6C20.3284 6 21 6.67157 21 7.5C21 8.32843 20.3284 9 19.5 9C18.6716 9 18 8.32843 18 7.5Z" />
                </svg>
                Instagram
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on Twitter"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.1 1.6-2-.7.4-1.5.7-2.3.9A3.7 3.7 0 0 0 12 7.5c0 .3 0 .6.1.8A10.5 10.5 0 0 1 3 5.2a3.7 3.7 0 0 0 1.1 5 3.6 3.6 0 0 1-1.7-.5v.1c0 1.8 1.3 3.4 3.1 3.7-.3.1-.7.1-1 .1-.2 0-.5 0-.7-.1.5 1.6 2 2.8 3.8 2.8A7.4 7.4 0 0 1 2 18.6 10.4 10.4 0 0 0 7.6 20C15 20 19.1 13.8 19.1 8.3v-.5c.7-.4 1.4-1 1.9-1.7Z" />
                </svg>
                Twitter
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on LinkedIn"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.1h.1c.5-1 1.9-2.1 3.9-2.1 4.2 0 5 2.8 5 6.5V23h-4v-6.5c0-1.6 0-3.6-2.2-3.6-2.2 0-2.6 1.7-2.6 3.5V23h-4V8z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="space-y-3 p-6 text-ink-700">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-ink-900" aria-hidden="true" /> support@hasivu.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-ink-900" aria-hidden="true" /> +91 91361 47011
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-ink-900" aria-hidden="true" /> Bangalore, India
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sticky footer CTA */}
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
              onClick={() => events.ctaClick('footer_order_now_hybrid', { location: 'footer' })}
            >
              Order Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Video Dialog */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>How to Order</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <video
              src="/videos/how-to-order.mp4"
              className="w-full h-full"
              controls
              poster="/videos/how-to-order-poster.jpg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
