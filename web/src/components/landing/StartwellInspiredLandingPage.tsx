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
  <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/80">
    <div className="flex items-start space-x-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
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

  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white font-bold grid place-items-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-lg font-black">H</span>
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-700 transition-all duration-300">
                HASIVU
              </div>
              <div className="text-xs text-slate-600 font-medium">School Meals Done Right</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#how"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              How it works
            </Link>
            <Link
              href="#reasons"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Why HASIVU
            </Link>
            <Link
              href="#faqs"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              FAQs
            </Link>
            <Link
              href="/auth/login"
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Login
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Link href="/auth/login?redirect=/menu">
              <Button
                variant="outline"
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-200"
                onClick={() => events.ctaClick('header_order_online', { location: 'header' })}
              >
                Order Online
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => events.ctaClick('header_get_started', { location: 'header' })}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Graphics - Inspired by izum.study */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large gradient orbs */}
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-indigo-400/20 blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-pink-400/20 blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />

          {/* Geometric shapes */}
          <div
            className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg rotate-45 animate-bounce"
            style={{ animationDelay: '1s', animationDuration: '6s' }}
          />
          <div
            className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full animate-bounce"
            style={{ animationDelay: '3s', animationDuration: '8s' }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg rotate-12 animate-bounce"
            style={{ animationDelay: '5s', animationDuration: '7s' }}
          />

          {/* Floating particles */}
          <div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-blue-400/30 rounded-full animate-ping"
            style={{ animationDelay: '0.5s', animationDuration: '4s' }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-ping"
            style={{ animationDelay: '2.5s', animationDuration: '5s' }}
          />
          <div
            className="absolute top-2/3 left-1/3 w-1 h-1 bg-indigo-400/30 rounded-full animate-ping"
            style={{ animationDelay: '4.5s', animationDuration: '6s' }}
          />

          {/* Wave patterns */}
          <svg
            className="absolute bottom-0 left-0 w-full h-32 text-blue-50/50"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
              className="fill-current"
            ></path>
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
              className="fill-current"
            ></path>
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              className="fill-current"
            ></path>
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-4 py-2 rounded-full font-medium">
                ✨ Smart School Nutrition Platform
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                School Meals
                <br />
                <span className="text-slate-800">Done Right</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
                Experience the future of school nutrition with AI-powered meal planning,
                RFID-verified delivery, and complete parental control. Warm, nutritious meals
                delivered to classrooms with real-time tracking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="rounded-2xl px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white font-semibold text-lg"
                  onClick={() => events.ctaClick('hero_get_started', { location: 'hero' })}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl border-2 border-slate-300 hover:border-blue-300 px-8 py-4 transition-all duration-300"
                onClick={() => {
                  events.videoOpen({ location: 'hero' });
                  setVideoOpen(true);
                }}
              >
                <Play className="mr-2 h-5 w-5 text-blue-600" />
                <span className="text-slate-700 font-medium">Watch Demo</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-2xl font-black text-blue-600 mb-1">AI-Powered</div>
                <p className="text-sm text-slate-600">Smart meal planning</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-2xl font-black text-purple-600 mb-1">RFID</div>
                <p className="text-sm text-slate-600">Verified delivery</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg">
                <div className="text-2xl font-black text-indigo-600 mb-1">Real-time</div>
                <p className="text-sm text-slate-600">Live tracking</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl" />
            <Card className="relative rounded-3xl border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Platform Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50">
                  <div className="text-4xl font-black text-blue-600 mb-2">4.9★</div>
                  <p className="text-slate-700 font-medium">Parent Rating</p>
                  <p className="text-sm text-slate-500">Average satisfaction</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50">
                  <div className="text-4xl font-black text-purple-600 mb-2">99.9%</div>
                  <p className="text-slate-700 font-medium">On-Time Delivery</p>
                  <p className="text-sm text-slate-500">Reliability guarantee</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50">
                  <div className="text-4xl font-black text-indigo-600 mb-2">100%</div>
                  <p className="text-slate-700 font-medium">Flexible Control</p>
                  <p className="text-sm text-slate-500">Change anytime</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200/50">
                  <div className="text-4xl font-black text-pink-600 mb-2">AI</div>
                  <p className="text-slate-700 font-medium">Smart Planning</p>
                  <p className="text-sm text-slate-500">Nutrition optimized</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white" />

        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-sm animate-float" />
          <div
            className="absolute bottom-32 right-16 w-16 h-16 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-lg rotate-45 animate-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full animate-float"
            style={{ animationDelay: '4s' }}
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-4 py-2 rounded-full font-medium mb-4">
              🚀 Advanced Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Why Choose HASIVU?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
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
      <section
        id="how"
        className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-blue-50/30 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Flowing wave patterns */}
          <svg
            className="absolute top-0 left-0 w-full h-full text-blue-50/20"
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
            className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400/20 rounded-full animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '6s' }}
          />
          <div
            className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/20 rounded-full animate-bounce"
            style={{ animationDelay: '2s', animationDuration: '8s' }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-indigo-400/20 rounded-full animate-bounce"
            style={{ animationDelay: '4s', animationDuration: '7s' }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 px-4 py-2 rounded-full font-medium mb-4">
              📋 Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Getting started is easy. Follow these simple steps to provide your child with
              nutritious, warm meals every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Utensils className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                    1. Choose & Customize
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  Select from our AI-curated menu options. Set dietary preferences, allergies, and
                  nutritional requirements for personalized meal planning.
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                    2. RFID-Verified Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  Meals are prepared fresh and delivered warm to classrooms with RFID tracking.
                  Real-time notifications keep you informed every step of the way.
                </CardContent>
              </Card>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <Card className="relative rounded-3xl border-0 shadow-xl bg-white/90 backdrop-blur-sm h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Repeat className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                    3. Full Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
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
                className="rounded-2xl px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white font-semibold text-lg"
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
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-100/30 to-indigo-100/30 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-lg rotate-45 blur-xl" />

          {/* Floating dots pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        </div>
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
      <section id="faqs" className="bg-white border-y border-slate-200/70 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle wave pattern at bottom */}
          <svg
            className="absolute bottom-0 left-0 w-full h-20 text-slate-50/50"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C300,100 600,20 900,60 C1050,80 1200,40 1200,60 L1200,120 L0,120 Z"
              className="fill-current"
            />
          </svg>

          {/* Floating accent shapes */}
          <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full animate-pulse" />
          <div
            className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-lg rotate-45 animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>
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
      <footer className="border-t border-slate-200/80 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50/20 to-transparent" />

          {/* Geometric patterns */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-blue-50/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-purple-50/30 to-transparent rounded-full blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-6 items-center">
          <div className="text-sm text-slate-700">© {new Date().getFullYear()} HASIVU</div>
          <div className="flex justify-center gap-6 text-sm">
            <Link
              href="/"
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="#faqs"
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              FAQs
            </Link>
            <Link
              href="/privacy"
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-slate-700 hover:text-blue-600 transition-colors duration-200"
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
