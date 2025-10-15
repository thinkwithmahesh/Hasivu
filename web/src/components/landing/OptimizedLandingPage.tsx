'use client';

import React, { useState, Suspense, lazy } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, Twitter, Linkedin } from 'lucide-react';
import { OptimizedBackground } from '@/components/ui/optimized-background';
import { LandingPageHero } from './LandingPageHero';

// Lazy load heavy components for better performance
const LandingPageFeatures = lazy(() =>
  import('./LandingPageFeatures').then(module => ({ default: module.LandingPageFeatures }))
);

// Loading component for lazy-loaded sections
const SectionSkeleton = () => (
  <div className="py-20 px-4">
    <div className="mx-auto max-w-7xl">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-8"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function OptimizedLandingPage() {
  const [videoOpen, setVideoOpen] = useState(false);

  // Environment variables with defaults
  const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/hasivu';
  const twitterUrl =
    process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/hasivu_official';
  const linkedinUrl =
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://linkedin.com/company/hasivu';

  return (
    <OptimizedBackground variant="gradient" className="min-h-screen">
      {/* Lightweight Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold grid place-items-center shadow-sm">
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
            <Link
              href="/dashboard"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile menu button - simplified */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-ink-700"></div>
              <div className="w-full h-0.5 bg-ink-700"></div>
              <div className="w-full h-0.5 bg-ink-700"></div>
            </div>
          </button>
        </div>
      </header>

      {/* Hero Section - Always loaded for performance */}
      <LandingPageHero videoOpen={videoOpen} setVideoOpen={setVideoOpen} />

      {/* Lazy-loaded Features Section */}
      <Suspense fallback={<SectionSkeleton />}>
        <LandingPageFeatures />
      </Suspense>

      {/* Minimal Footer - Static content only */}
      <footer className="bg-ink-900 text-white py-12 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold grid place-items-center text-sm">
                  H
                </div>
                <span className="text-xl font-bold">HASIVU</span>
              </div>
              <p className="text-slate-400 text-sm">
                Making school meals delicious, nutritious, and convenient for families across India.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4" />
                  <span>hello@hasivu.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4" />
                  <span>Mumbai, India</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <Link href="/about" className="block hover:text-white transition-colors">
                  About Us
                </Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a
                  href={instagramUrl}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a href={twitterUrl} className="text-slate-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href={linkedinUrl} className="text-slate-400 hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; 2024 HASIVU. All rights reserved.</p>
            <p>Made with ❤️ for Indian schools</p>
          </div>
        </div>
      </footer>
    </OptimizedBackground>
  );
}
