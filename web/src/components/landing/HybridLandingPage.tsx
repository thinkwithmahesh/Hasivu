'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChefHat,
  Clock3,
  GraduationCap,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Star,
  Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LandingDemoVideoDialog } from '@/components/landing/LandingDemoVideoDialog';
import { TrustMetricsStrip } from '@/components/landing/TrustMetricsStrip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { events } from '@/lib/analytics';

type Feature = { title: string; text: string; icon: React.ComponentType<{ className?: string }> };
type PersonaCard = {
  id: 'parent' | 'admin' | 'kitchen';
  title: string;
  description: string;
  href: string;
  cta: string;
};

const features: Feature[] = [
  {
    title: 'Natural Ingredients',
    text: 'Fresh meals prepared daily with age-appropriate nutrition and clean ingredients.',
    icon: Leaf,
  },
  {
    title: 'Nutritionist Reviewed',
    text: 'Balanced portions planned by experts for school-age children and dietary needs.',
    icon: GraduationCap,
  },
  {
    title: 'Chef + Parent Approved',
    text: 'Meals children enjoy, with consistency schools can rely on during busy mornings.',
    icon: ChefHat,
  },
];

const personas: PersonaCard[] = [
  {
    id: 'parent',
    title: 'For Parents',
    description: 'Order fast, reorder in one tap, and manage allergies safely.',
    href: '/menu',
    cta: 'Order meals',
  },
  {
    id: 'admin',
    title: 'For School Admins',
    description: 'Manage menus, cutoffs, classes, and exports without spreadsheet chaos.',
    href: '/auth/login/admin',
    cta: 'Provisioned admin login',
  },
  {
    id: 'kitchen',
    title: 'For Kitchen Staff',
    description: 'View counts clearly, track served status, and avoid prep confusion.',
    href: '/auth/login/kitchen',
    cta: 'Provisioned kitchen login',
  },
];

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
  const [activePersonaId, setActivePersonaId] = useState<PersonaCard['id']>('parent');

  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  const trustStats = useMemo(
    () => [
      { value: 'Daily', label: 'Fresh school meals' },
      { value: 'Midnight', label: 'Change cutoff' },
      { value: 'RFID', label: 'Delivery verification' },
      { value: '0', label: 'Artificial colors added' },
    ],
    []
  );
  const activePersona = useMemo(
    () => personas.find(persona => persona.id === activePersonaId) || personas[0],
    [activePersonaId]
  );
  const heroNarrative = useMemo(() => {
    if (activePersonaId === 'admin') {
      return {
        title: 'Control menus and cutoffs with confidence.',
        detail: 'One clear workspace for approvals, roster updates, and parent communication.',
      };
    }
    if (activePersonaId === 'kitchen') {
      return {
        title: 'Prep smarter with real-time meal counts.',
        detail: 'Reduce confusion on the line with clear by-class and by-meal views.',
      };
    }
    return {
      title: 'Warm meals at school, on time.',
      detail: 'Fast ordering for parents with allergy-safe choices and midnight flexibility.',
    };
  }, [activePersonaId]);

  return (
    <div className="min-h-screen bg-pm-page-bg text-pm-text-primary">
      <header className="sticky top-0 z-40 w-full border-b border-pm-neutral-200/80 bg-pm-surface-1/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-ui text-xl font-bold tracking-tight text-pm-primary-700">
            HASIVU
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#how"
              className="text-sm font-semibold text-pm-text-secondary hover:text-pm-text-primary"
            >
              How it works
            </Link>
            <Link
              href="#roles"
              className="text-sm font-semibold text-pm-text-secondary hover:text-pm-text-primary"
            >
              Who it is for
            </Link>
            <Link
              href="#faqs"
              className="text-sm font-semibold text-pm-text-secondary hover:text-pm-text-primary"
            >
              FAQs
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-pm-text-secondary hover:text-pm-text-primary"
            >
              Login
            </Link>
            <Link href="/menu">
              <Button
                size="sm"
                className="rounded-xl bg-pm-primary-600 text-white hover:bg-pm-primary-800"
                onClick={() => events.ctaClick('landing_header_order', { location: 'header' })}
              >
                Order now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-pm-neutral-200/70">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:py-14 md:grid-cols-12 md:py-20 md:px-6 lg:px-8">
            <div className="md:col-span-7">
              <Badge className="mb-4 border-transparent bg-pm-primary-50 text-pm-primary-700">
                School meals done right
              </Badge>
              <div className="mb-5 flex flex-wrap gap-2">
                {personas.map(persona => {
                  const isActive = persona.id === activePersonaId;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActivePersonaId(persona.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                        isActive
                          ? 'border-pm-primary-300 bg-pm-primary-50 text-pm-primary-700'
                          : 'border-pm-neutral-200 bg-pm-surface-1 text-pm-text-secondary hover:text-pm-text-primary'
                      }`}
                    >
                      {persona.title.replace('For ', '')}
                    </button>
                  );
                })}
              </div>
              <h1 className="text-3xl font-bold leading-tight text-pm-text-primary sm:text-4xl md:text-5xl lg:text-6xl">
                {heroNarrative.title}
                <span className="block text-pm-text-secondary">{heroNarrative.detail}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-pm-text-secondary md:text-lg">
                Order a single meal or subscribe. Change, pause, or cancel by midnight with full
                control from your dashboard.
              </p>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                <Link href={activePersona.href}>
                  <Button
                    size="lg"
                    className="max-w-full min-w-[180px] rounded-2xl bg-pm-primary-600 px-7 text-white hover:bg-pm-primary-800"
                    onClick={() =>
                      events.ctaClick('landing_hero_order', {
                        location: 'hero',
                        persona: activePersona.id,
                      })
                    }
                  >
                    {activePersona.cta} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="max-w-full min-w-[180px] rounded-2xl border-pm-neutral-300 bg-pm-surface-1 text-pm-text-primary hover:bg-pm-surface-2 hover:text-pm-text-primary"
                  onClick={() => {
                    events.ctaClick('landing_hero_watch', { location: 'hero' });
                    setVideoOpen(true);
                  }}
                >
                  Watch guided demo
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-pm-surface-1 px-3 py-1 text-xs font-semibold text-pm-text-secondary">
                  <Utensils className="mr-1.5 h-4 w-4 text-pm-primary-600" /> Delivered warm to
                  class
                </span>
                <span className="inline-flex items-center rounded-full bg-pm-surface-1 px-3 py-1 text-xs font-semibold text-pm-text-secondary">
                  <Clock3 className="mr-1.5 h-4 w-4 text-pm-secondary-600" /> Recess-time delivery
                </span>
              </div>
            </div>
            <div className="md:col-span-5 md:self-start">
              <TrustMetricsStrip stats={trustStats} className="md:sticky md:top-24" />
            </div>
          </div>
        </section>

        <section id="roles" className="border-b border-pm-neutral-200/70 bg-pm-surface-1">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-pm-text-primary md:text-3xl">
              Built for every school role
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {personas.map(persona => (
                <Card
                  key={persona.title}
                  className="rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary"
                >
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-pm-text-primary">{persona.title}</h3>
                    <p className="mt-2 text-sm text-pm-text-secondary">{persona.description}</p>
                    <Link
                      href={persona.href}
                      className="mt-4 inline-flex text-sm font-semibold text-pm-primary-700 hover:text-pm-primary-800"
                    >
                      {persona.cta} <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-pm-neutral-200/70">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-pm-text-primary md:text-3xl">
              How it works
            </h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {['Choose meals', 'Delivered warm', 'Manage anytime'].map((title, i) => (
                <Card
                  key={title}
                  className="rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary"
                >
                  <CardContent className="p-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-pm-text-tertiary">
                      Step {i + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-pm-text-primary">{title}</h3>
                    <p className="mt-2 text-sm text-pm-text-secondary">
                      {i === 0 &&
                        'Pick single meals or set a weekly plan based on child preferences and allergies.'}
                      {i === 1 &&
                        'Meals are prepared fresh and delivered to class before recess every day.'}
                      {i === 2 &&
                        'Pause, swap, or cancel until midnight from your parent dashboard.'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-pm-neutral-200/70 bg-pm-surface-1">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-12 md:px-6 md:py-16 lg:px-8">
            <div className="md:col-span-5">
              <h2 className="mb-3 text-2xl font-bold text-pm-text-primary md:text-3xl">
                Why families choose HASIVU
              </h2>
              <p className="mb-5 text-sm text-pm-text-secondary md:text-base">
                Nutrition quality, operational reliability, and flexible ordering in one flow.
              </p>
              <div className="space-y-4">
                {features.map(feature => (
                  <Card
                    key={feature.title}
                    className="rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary shadow-sm"
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pm-secondary-50 text-pm-secondary-600">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-pm-text-primary">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm text-pm-text-secondary">{feature.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="md:col-span-7">
              <h3 className="mb-4 text-xl font-bold text-pm-text-primary md:text-2xl">
                Loved by busy families
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {testimonials.map(t => (
                  <Card
                    key={t.author}
                    className="rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary shadow-sm"
                  >
                    <CardContent className="p-5">
                      <div className="mb-2 flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`${t.author}-${i}`}
                            className="h-4 w-4 fill-current text-pm-semantic-warning"
                          />
                        ))}
                      </div>
                      <p className="text-sm italic text-pm-text-secondary">“{t.quote}”</p>
                      <p className="mt-3 text-sm font-semibold text-pm-text-primary">{t.author}</p>
                      <p className="text-xs text-pm-text-tertiary">{t.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faqs" className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="mb-6 text-2xl font-bold text-pm-text-primary md:text-3xl">
            Questions parents ask
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can I pause or cancel a subscription?</AccordionTrigger>
              <AccordionContent>
                Yes. You can change, pause, or cancel meals until midnight for the next school day.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Are meals delivered warm to classrooms?</AccordionTrigger>
              <AccordionContent>
                Yes. Meals are packed for heat retention and delivered just before recess.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How are allergies handled?</AccordionTrigger>
              <AccordionContent>
                Allergy flags are linked to child profiles. Incompatible items are clearly blocked
                in ordering.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <footer className="border-t border-pm-neutral-200 bg-pm-surface-1">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="text-xl font-semibold text-pm-text-primary">Ready when you are</h3>
            <p className="text-sm text-pm-text-secondary">
              Order a single meal or subscribe to save.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-pm-neutral-200 px-3 py-1 text-sm text-pm-text-secondary transition-colors hover:bg-pm-surface-2 hover:text-pm-primary-700"
              >
                Instagram
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-pm-neutral-200 px-3 py-1 text-sm text-pm-text-secondary transition-colors hover:bg-pm-surface-2 hover:text-pm-primary-700"
              >
                Twitter
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-pm-neutral-200 px-3 py-1 text-sm text-pm-text-secondary transition-colors hover:bg-pm-surface-2 hover:text-pm-primary-700"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <Card className="rounded-2xl border-pm-neutral-200 bg-pm-surface-1 text-pm-text-primary">
            <CardContent className="space-y-2 p-5 text-sm text-pm-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-pm-text-primary" /> support@hasivu.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-pm-text-primary" /> +91 91361 47011
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-pm-text-primary" /> Bangalore, India
              </div>
              <Link href="/menu" className="inline-flex">
                <Button
                  className="mt-4 rounded-xl bg-pm-primary-600 text-white hover:bg-pm-primary-800"
                  onClick={() => events.ctaClick('landing_footer_order', { location: 'footer' })}
                >
                  Order now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </footer>

      <LandingDemoVideoDialog open={videoOpen} onOpenChange={setVideoOpen} />
    </div>
  );
}
