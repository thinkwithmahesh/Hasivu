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
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingDemoVideoDialog } from '@/components/landing/LandingDemoVideoDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Star } from 'lucide-react';
import { events } from '@/lib/analytics';
import { GroupScene, Aarav, Meera, Rajan, Priya, Benny } from '@/components/characters/HasivuFriend';
import { useCharacterState } from '@/components/characters/useCharacterState';

// Hasivu Platform Landing Page
// Character-driven, playful, trustworthy, with clear CTAs

const FeatureItem = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-hasivu-primary/10 shadow-warm-sm hover:shadow-warm-md transition-all duration-300 hover:bg-white">
    <div className="flex items-start space-x-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-hasivu-accent/20 text-hasivu-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-hasivu-text-primary mb-2 group-hover:text-hasivu-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-hasivu-text-secondary leading-relaxed">{description}</p>
      </div>
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
  const characterState = useCharacterState({ scrollEnabled: true });

  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  return (
    <div
      className="min-h-screen bg-hasivu-bg-warm font-sans"
      onMouseEnter={() => characterState.setHover(true)}
      onMouseLeave={() => characterState.setHover(false)}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-hasivu-primary/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group relative">
            <div className="w-12 h-12 rounded-2xl bg-hasivu-primary text-white font-bold grid place-items-center shadow-warm-md group-hover:shadow-warm-lg transition-all duration-300">
              <span className="text-xl font-display font-black">H</span>
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-display font-black tracking-tight text-hasivu-primary transition-all duration-300">
                HASIVU
              </div>
              <div className="text-xs text-hasivu-text-secondary font-medium">
                School Meals Done Right
              </div>
            </div>

            {/* Aarav peeks from behind the logo on hover */}
            <div className="absolute -left-4 -bottom-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Aarav state={characterState.state} size={48} />
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#how"
              className="text-hasivu-text-primary hover:text-hasivu-primary font-medium transition-colors duration-200"
            >
              How it works
            </Link>
            <Link
              href="#reasons"
              className="text-hasivu-text-primary hover:text-hasivu-primary font-medium transition-colors duration-200"
            >
              Why HASIVU
            </Link>
            <Link
              href="#faqs"
              className="text-hasivu-text-primary hover:text-hasivu-primary font-medium transition-colors duration-200"
            >
              FAQs
            </Link>
            <Link
              href="/auth/login"
              className="text-hasivu-text-primary hover:text-hasivu-primary font-medium transition-colors duration-200"
            >
              Login
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/auth/login?redirect=/menu">
              <Button
                variant="outline"
                className="rounded-xl border-hasivu-primary/20 text-hasivu-primary hover:bg-hasivu-primary/5 transition-all duration-200"
                onClick={() => events.ctaClick('header_order_online', { location: 'header' })}
              >
                Order Online
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                className="rounded-xl bg-hasivu-primary hover:bg-hasivu-primary/90 text-white shadow-warm-md hover:shadow-warm-lg transition-all duration-300"
                onClick={() => events.ctaClick('header_get_started', { location: 'header' })}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background Graphics - Warm Hasivu Colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-hasivu-accent/10 blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-hasivu-secondary/10 blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <div className="space-y-4">
              <Badge className="bg-hasivu-primary/10 text-hasivu-primary border-hasivu-primary/20 px-4 py-2 rounded-full font-medium">
                ✨ Playful Nutrition Platform
              </Badge>
              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight text-hasivu-text-primary leading-[1.1]">
                School Meals <br />
                <span className="text-hasivu-primary">Done Right</span>
              </h1>
              <p className="text-xl text-hasivu-text-secondary max-w-xl leading-relaxed">
                Join the Hasivu Friends on a journey to better nutrition! Smart meal planning, warm
                deliveries, and happy children — all with complete parental control.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="rounded-2xl px-8 py-6 bg-hasivu-primary hover:bg-[#E55A2B] shadow-warm-lg hover:shadow-warm-xl transition-all duration-300 text-white font-bold text-lg w-full sm:w-auto"
                  onClick={() => events.ctaClick('hero_get_started', { location: 'hero' })}
                >
                  Start the Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-2 border-slate-200 hover:border-hasivu-secondary text-hasivu-text-primary hover:bg-hasivu-secondary/5 px-8 py-6 transition-all duration-300 w-full sm:w-auto group"
                onClick={() => {
                  events.videoOpen({ location: 'hero' });
                  setVideoOpen(true);
                  characterState.triggerSuccess(); // Characters celebrate when video opens
                }}
              >
                <Play className="mr-2 h-5 w-5 text-hasivu-secondary group-hover:scale-110 transition-transform" />
                <span className="font-bold">Watch Demo</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-hasivu-text-secondary">
                <div className="w-8 h-8 rounded-full bg-hasivu-accent/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-hasivu-accent fill-current" />
                </div>
                <span className="text-sm font-medium">Smart AI Menu</span>
              </div>
              <div className="flex items-center gap-2 text-hasivu-text-secondary">
                <div className="w-8 h-8 rounded-full bg-hasivu-success/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-hasivu-success" />
                </div>
                <span className="text-sm font-medium">RFID Safe</span>
              </div>
              <div className="flex items-center gap-2 text-hasivu-text-secondary">
                <div className="w-8 h-8 rounded-full bg-hasivu-secondary/20 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-hasivu-secondary" />
                </div>
                <span className="text-sm font-medium">Warm Delivery</span>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0 flex justify-center items-center group/scene">
            {/* The Hasivu Friends Group Scene */}
            <div className="relative w-full max-w-lg aspect-square">
              <GroupScene
                state={characterState.state}
                size={500}
                className="w-full h-auto drop-shadow-2xl z-10 relative"
                priority
              />

              {/* Interactive Dash Character (Priya runs across on scroll/hover) */}
              <div className="absolute -bottom-8 -left-12 z-20">
                <Priya state={characterState.state} size={140} />
              </div>

              {/* Background glow behind the characters */}
              <div className="absolute inset-0 bg-hasivu-accent/20 rounded-full blur-3xl -z-10 group-hover/scene:bg-hasivu-accent/30 transition-colors duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-hasivu-bg-warm/50 to-white" />

        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-hasivu-secondary/10 rounded-full blur-sm animate-float" />
          <div
            className="absolute bottom-32 right-16 w-16 h-16 bg-hasivu-primary/10 rounded-lg rotate-45 animate-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-12 h-12 bg-hasivu-accent/10 rounded-full animate-float"
            style={{ animationDelay: '4s' }}
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 107, 53, 0.15) 1px, transparent 0)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center mb-16 relative">
            {/* Meera peeking from header */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <Meera state={characterState.state} size={80} />
            </div>

            <Badge className="bg-hasivu-secondary/10 text-hasivu-secondary border-hasivu-secondary/20 px-4 py-2 rounded-full font-medium mb-4">
              🚀 Advanced Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-black text-hasivu-text-primary mb-6">
              Why Choose HASIVU?
            </h2>
            <p className="text-xl text-hasivu-text-secondary max-w-3xl mx-auto">
              Experience the most advanced school nutrition platform with cutting-edge technology
              and unparalleled parental control.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureItem
              icon={Leaf}
              title="AI Nutrition Intelligence"
              description="Advanced AI algorithms analyze nutritional needs and create personalized meal plans optimized for each child's age, health, and preferences."
            />
            <FeatureItem
              icon={GraduationCap}
              title="RFID-Verified Delivery"
              description="Every meal delivery is verified with RFID technology ensuring your child receives the right meal at the right time, every time."
            />
            <FeatureItem
              icon={ChefHat}
              title="Real-Time Kitchen Tracking"
              description="Monitor meal preparation in real-time with live updates from our certified kitchens, maintaining transparency and quality control."
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <FeatureItem
              icon={Clock}
              title="Flexible Scheduling"
              description="Change meal plans, pause subscriptions, or modify orders up to midnight. Complete control in the palm of your hand."
            />
            <FeatureItem
              icon={Shield}
              title="Allergen Safety"
              description="Comprehensive allergen tracking and filtering with instant alerts for any potential cross-contamination risks."
            />
            <FeatureItem
              icon={Utensils}
              title="Warm Meal Guarantee"
              description="Meals arrive warm and fresh to classrooms, maintained at optimal temperatures throughout the delivery process."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 md:py-32 bg-hasivu-bg-warm relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Flowing wave patterns */}
          <svg
            className="absolute top-0 left-0 w-full h-full text-hasivu-primary/5"
            viewBox="0 0 1200 600"
            preserveAspectRatio="none"
          >
            <path
              d="M0,300 Q300,200 600,300 T1200,300 V600 H0 Z"
              className="fill-current animate-wave"
            />
            <path
              d="M0,350 Q300,250 600,350 T1200,350 V600 H0 Z"
              className="fill-current animate-wave"
              style={{ animationDelay: '1s', opacity: 0.6 }}
            />
          </svg>

          {/* Floating particles */}
          <div
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-hasivu-primary/20 rounded-full animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '6s' }}
          />
          <div
            className="absolute top-1/3 right-1/3 w-2 h-2 bg-hasivu-secondary/20 rounded-full animate-bounce"
            style={{ animationDelay: '2s', animationDuration: '8s' }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-hasivu-accent/20 rounded-full animate-bounce"
            style={{ animationDelay: '4s', animationDuration: '7s' }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="text-center mb-16 relative">
            <Badge className="bg-hasivu-accent/20 text-hasivu-primary border-hasivu-accent/30 px-4 py-2 rounded-full font-medium mb-4">
              📋 Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-display font-black text-hasivu-text-primary mb-6">
              How It Works
            </h2>
            <p className="text-xl text-hasivu-text-secondary max-w-3xl mx-auto">
              Getting started is easy. Follow these simple steps to provide your child with
              nutritious, warm meals every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-hasivu-primary/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-warm-sm hover:shadow-warm-md transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-hasivu-primary flex items-center justify-center shadow-md">
                    <Utensils className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-hasivu-text-primary mb-2">
                    1. Choose & Customize
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-hasivu-text-secondary">
                  Select from our AI-curated menu options. Set dietary preferences, allergies, and
                  nutritional requirements for personalized meal planning.
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-hasivu-secondary/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-warm-sm hover:shadow-warm-md transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-hasivu-secondary flex items-center justify-center shadow-md">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-hasivu-text-primary mb-2">
                    2. RFID-Verified Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-hasivu-text-secondary">
                  Meals are prepared fresh and delivered warm to classrooms with RFID tracking.
                  Real-time notifications keep you informed every step of the way.
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -top-12 -right-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Rajan state={characterState.state} size={70} />
              </div>
              <div className="absolute -inset-1 bg-hasivu-accent/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-warm-sm hover:shadow-warm-md transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-hasivu-accent flex items-center justify-center shadow-md">
                    <Repeat className="h-8 w-8 text-hasivu-text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-hasivu-text-primary mb-2">
                    3. Full Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-hasivu-text-secondary">
                  Change plans, pause subscriptions, or modify orders anytime before midnight.
                  Complete flexibility with our intuitive parent dashboard.
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="rounded-2xl px-8 py-4 bg-hasivu-primary hover:bg-[#E55A2B] shadow-warm-lg hover:shadow-warm-xl transition-all duration-300 text-white font-bold text-lg"
                onClick={() => events.ctaClick('how_get_started', { location: 'how_it_works' })}
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto max-w-7xl px-4 py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle geometric patterns */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-hasivu-accent/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-hasivu-secondary/10 rounded-lg rotate-45 blur-xl" />

          {/* Floating dots pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(46, 196, 182, 0.3) 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        </div>
        <div className="text-center mb-10 relative">
          <Badge className="mb-3 bg-hasivu-primary/10 text-hasivu-primary border-hasivu-primary/20">
            Parents say it best
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-black text-hasivu-text-primary">
            Loved by busy families
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card key={i} className="rounded-2xl border-hasivu-primary/10 shadow-warm-sm">
              <CardContent className="p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 text-hasivu-accent fill-current" />
                  ))}
                </div>
                <p className="text-hasivu-text-primary italic">“{t.quote}”</p>
                <div className="mt-4 text-sm text-hasivu-text-primary font-bold">{t.author}</div>
                <div className="text-xs text-hasivu-text-secondary">{t.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social and contact */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-display font-black text-hasivu-text-primary">
              We feed your kids like our own
            </h3>
            <p className="mt-3 text-hasivu-text-secondary">
              Follow us for menu highlights, behind-the-scenes, and nutrition tips.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on Instagram"
                className="inline-flex items-center gap-2 rounded-xl border border-hasivu-primary/10 px-4 py-2 text-hasivu-text-primary hover:bg-hasivu-primary/5 transition-colors"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on Twitter"
                className="inline-flex items-center gap-2 rounded-xl border border-hasivu-primary/10 px-4 py-2 text-hasivu-text-primary hover:bg-hasivu-primary/5 transition-colors"
              >
                <Twitter className="h-4 w-4" /> Twitter
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="HASIVU on LinkedIn"
                className="inline-flex items-center gap-2 rounded-xl border border-hasivu-primary/10 px-4 py-2 text-hasivu-text-primary hover:bg-hasivu-primary/5 transition-colors"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            </div>
          </div>

          <Card className="rounded-2xl border-hasivu-primary/10 shadow-warm-sm">
            <CardHeader>
              <CardTitle className="text-hasivu-text-primary">Let's get talking!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-hasivu-text-secondary">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-hasivu-secondary" aria-hidden="true" />{' '}
                support@hasivu.com
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-hasivu-primary" aria-hidden="true" /> +91 91361 47011
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-hasivu-accent" aria-hidden="true" /> Bangalore,
                India
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQs */}
      <section
        id="faqs"
        className="bg-white border-y border-hasivu-primary/10 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle wave pattern at bottom */}
          <svg
            className="absolute bottom-0 left-0 w-full h-20 text-hasivu-bg-warm"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C300,100 600,20 900,60 C1050,80 1200,40 1200,60 L1200,120 L0,120 Z"
              className="fill-current"
            />
          </svg>

          {/* Floating accent shapes */}
          <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-hasivu-primary/10 rounded-full animate-pulse" />
          <div
            className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-hasivu-secondary/10 rounded-lg rotate-45 animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="text-center mb-8 relative">
            <Badge className="mb-3 bg-hasivu-accent/10 text-hasivu-text-primary border-hasivu-accent/20">
              FAQs
            </Badge>
            <h2 className="text-3xl font-display font-black text-hasivu-text-primary">
              Questions parents ask
            </h2>
            {/* Benny hiding in FAQs */}
            <div className="absolute -bottom-8 -right-16 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
              <Benny state={characterState.state} size={60} />
            </div>
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
      <footer className="border-t border-hasivu-primary/10 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-hasivu-bg-warm to-transparent opacity-50" />

          {/* Geometric patterns */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-hasivu-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-hasivu-primary/10 rounded-full blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-6 items-center">
          <div className="text-sm text-hasivu-text-secondary">
            © {new Date().getFullYear()} HASIVU
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/"
              className="text-hasivu-text-secondary hover:text-hasivu-primary transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="#faqs"
              className="text-hasivu-text-secondary hover:text-hasivu-primary transition-colors duration-200"
            >
              FAQs
            </Link>
            <Link
              href="/privacy"
              className="text-hasivu-text-secondary hover:text-hasivu-primary transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-hasivu-text-secondary hover:text-hasivu-primary transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
          <div className="text-right">
            <Link href="/auth/login?redirect=/menu">
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

      <LandingDemoVideoDialog open={videoOpen} onOpenChange={setVideoOpen} />
    </div>
  );
}
