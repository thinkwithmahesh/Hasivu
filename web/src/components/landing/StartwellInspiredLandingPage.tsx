'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Utensils,
  Clock,
  Repeat,
  Leaf,
  GraduationCap,
  ChefHat,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Twitter,
  Linkedin,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Star } from 'lucide-react';
import { events } from '@/lib/analytics';

// Startwell-inspired, but original design and copy for HASIVU
// Bright, friendly, trustworthy, with clear CTAs

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

export default function StartwellInspiredLandingPage() {
  const [videoOpen, setVideoOpen] = useState(false);

  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold grid place-items-center shadow-soft">
              H
            </div>
            <div className="leading-tight">
              <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                HASIVU
              </div>
              <div className="text-[11px] text-ink-500 -mt-1">School Meals Done Right</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#how" className="text-ink-600 hover:text-ink-900 font-medium">
              How it works
            </Link>
            <Link href="#reasons" className="text-ink-600 hover:text-ink-900 font-medium">
              Why HASIVU
            </Link>
            <Link href="#faqs" className="text-ink-600 hover:text-ink-900 font-medium">
              FAQs
            </Link>
            <Link href="/auth/login" className="text-ink-600 hover:text-ink-900 font-medium">
              Login
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/menu">
              <Button
                variant="outline"
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => events.ctaClick('header_order_online', { location: 'header' })}
              >
                Order Online
              </Button>
            </Link>
            <Link href="/orders">
              <Button
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-soft"
                onClick={() =>
                  events.ctaClick('header_manage_subscription', { location: 'header' })
                }
              >
                Manage Subscription
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              Warm meals at school, on time
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-ink-900">
              School meals done right
            </h1>
            <p className="mt-4 text-lg md:text-xl text-ink-700 max-w-xl">
              Opt for a single meal or subscribe and save. Change, pause or cancel by midnight —
              full control for busy parents.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/menu">
                <Button
                  size="lg"
                  className="rounded-xl px-7 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-soft"
                  onClick={() => events.ctaClick('hero_order_now', { location: 'hero' })}
                >
                  Order Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-slate-300"
                onClick={() => {
                  events.videoOpen({ location: 'hero' });
                  setVideoOpen(true);
                }}
              >
                <Play className="mr-2 h-5 w-5" /> Guided Video — How to Order
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Pill>
                <Utensils className="mr-2 h-4 w-4 text-emerald-600" /> Meals delivered warm to
                classroom
              </Pill>
              <Pill>
                <Clock className="mr-2 h-4 w-4 text-cyan-600" /> Arrives during recess
              </Pill>
              <Pill>
                <Repeat className="mr-2 h-4 w-4 text-blue-600" /> Pause/cancel until midnight
              </Pill>
            </div>
          </div>

          <div>
            <Card className="rounded-2xl border-slate-200 shadow-medium">
              <CardHeader>
                <CardTitle className="text-ink-900">Parents love the flexibility</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-3xl font-black text-emerald-600 mb-1">4.9★</div>
                  <p className="text-ink-700 text-sm">Average parent rating</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-3xl font-black text-cyan-600 mb-1">99.9%</div>
                  <p className="text-ink-700 text-sm">On-time delivery</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-3xl font-black text-blue-600 mb-1">100%</div>
                  <p className="text-ink-700 text-sm">Flexible subscriptions</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-3xl font-black text-purple-600 mb-1">0</div>
                  <p className="text-ink-700 text-sm">Food colorings added</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reasons to choose HASIVU */}
      <section id="reasons" className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureItem
            icon={Leaf}
            title="Natural Ingredients"
            description="Sustainably sourced whole and fresh ingredients. We keep it clean and simple."
          />
          <FeatureItem
            icon={GraduationCap}
            title="Designed by Nutritionists"
            description="Balanced, age-appropriate meals aligned to recommended dietary allowances."
          />
          <FeatureItem
            icon={ChefHat}
            title="Prepared by Chefs & Parents"
            description="A team of chefs and parents ensure variety, taste and safety every day."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white border-y border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-black text-ink-900 text-center mb-10">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-ink-900">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                  1. Order Online
                </CardTitle>
              </CardHeader>
              <CardContent className="text-ink-700">
                Choose a single meal or subscribe for the week/month. Customize preferences and
                allergies.
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-ink-900">
                  <Clock className="h-5 w-5 text-cyan-600" />
                  2. Delivered Warm
                </CardTitle>
              </CardHeader>
              <CardContent className="text-ink-700">
                Meals arrive to the classroom just before recess. Packed for freshness and warmth.
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-ink-900">
                  <Repeat className="h-5 w-5 text-blue-600" />
                  3. Full Flexibility
                </CardTitle>
              </CardHeader>
              <CardContent className="text-ink-700">
                Change, pause, or cancel by midnight. Manage everything from your dashboard.
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-10">
            <Link href="/menu">
              <Button
                size="lg"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={() => events.ctaClick('how_start_order', { location: 'how_it_works' })}
              >
                Start an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-purple-100 text-purple-700 border-purple-200">
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

      {/* Social and contact */}
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
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on Twitter"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50"
              >
                <Twitter className="h-4 w-4" /> Twitter
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on LinkedIn"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle className="text-ink-900">Let's get talking!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-ink-700">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-600" aria-hidden="true" /> support@hasivu.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-cyan-600" aria-hidden="true" /> +91 91361 47011
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" /> Bangalore, India
              </div>
            </CardContent>
          </Card>
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

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-6 items-center">
          <div className="text-sm text-ink-700">© {new Date().getFullYear()} HASIVU</div>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="text-ink-700 hover:text-ink-900">
              Home
            </Link>
            <Link href="#faqs" className="text-ink-700 hover:text-ink-900">
              FAQs
            </Link>
            <Link href="/privacy" className="text-ink-700 hover:text-ink-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-ink-700 hover:text-ink-900">
              Terms
            </Link>
          </div>
          <div className="text-right">
            <Link href="/menu">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => events.ctaClick('footer_order_now', { location: 'footer' })}
              >
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </footer>

      {/* Video Dialog */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>How to Order</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {/* Replace with a real hosted video URL when available */}
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
