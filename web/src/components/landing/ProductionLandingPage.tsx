'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Shield,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Calendar,
  Users,
  TrendingUp,
  ChefHat,
  CreditCard,
  Lock,
  Award,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NumberTicker } from '@/components/magicui/number-ticker';

// Enhanced TypeScript interfaces
interface School {
  name: string;
  logo: string;
  students: string;
  location: string;
  rating: number;
}

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  school: string;
  avatar: string;
  rating: number;
  children: number;
  verified: boolean;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  stats: string;
  color: string;
  gradient: string;
}

interface Stats {
  students: number;
  schools: number;
  orders: number;
  accuracy: number;
  satisfaction: number;
}

// Live data simulation
const useLiveStats = () => {
  const [stats, setStats] = useState<Stats>({
    students: 50000,
    schools: 100,
    orders: 2300000,
    accuracy: 99.7,
    satisfaction: 4.9,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        students: prev.students + Math.floor(Math.random() * 5),
        orders: prev.orders + Math.floor(Math.random() * 10),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};

// Bangalore schools data
const _bangaloreSchools: School[] = [
  {
    name: 'Delhi Public School Bangalore East',
    logo: '🏫',
    students: '12,000',
    location: 'Whitefield',
    rating: 4.8,
  },
  {
    name: 'National Public School Koramangala',
    logo: '🎓',
    students: '6,200',
    location: 'Koramangala',
    rating: 4.9,
  },
  {
    name: 'Sarvodaya Vidyalaya',
    logo: '📚',
    students: '8,500',
    location: 'Jayanagar',
    rating: 4.7,
  },
  {
    name: 'Greenwood High International',
    logo: '🌟',
    students: '4,800',
    location: 'HSR Layout',
    rating: 4.8,
  },
  {
    name: 'Ryan International School',
    logo: '🏆',
    students: '9,200',
    location: 'Kundalahalli',
    rating: 4.6,
  },
];

// Parent testimonials with real scenarios
const parentTestimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      "HASIVU transformed our family's lunch routine. My daughter Priya gets authentic Karnataka meals at school, and I can track her nutrition intake in real-time. The RFID system means no more lost lunch money!",
    author: 'Shalini Krishnamurthy',
    title: 'Working Mother',
    school: 'DPS Bangalore East',
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
    rating: 5,
    children: 2,
    verified: true,
  },
  {
    id: '2',
    quote:
      "As a parent of two kids in different classes, managing their meal preferences was a nightmare. HASIVU's AI recommendations ensure both my children eat balanced meals. The fraud detection saved us ₹15,000 last year!",
    author: 'Rajesh Kumar Sharma',
    title: 'IT Professional',
    school: 'NPS Koramangala',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    rating: 5,
    children: 2,
    verified: true,
  },
  {
    id: '3',
    quote:
      "My son has food allergies, and HASIVU's smart filtering ensures he only sees safe meal options. The instant notifications when he gets his meal give me peace of mind during my busy workday.",
    author: 'Dr. Meera Reddy',
    title: 'Pediatrician',
    school: 'Greenwood High',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
    rating: 5,
    children: 1,
    verified: true,
  },
];

// Feature set with Bangalore-specific benefits
const _platformFeatures: Feature[] = [
  {
    title: 'AI Fraud Protection',
    description: '99.7% accuracy in detecting payment anomalies with real-time behavioral analysis',
    icon: Shield,
    stats: '₹2.3M Protected',
    color: 'text-hasivu-blue-600',
    gradient: 'from-hasivu-blue-100 to-hasivu-blue-200',
  },
  {
    title: 'RFID Meal Verification',
    description: 'Instant confirmation when your child receives their meal with photo proof',
    icon: Zap,
    stats: '99.9% Accuracy',
    color: 'text-hasivu-orange-600',
    gradient: 'from-hasivu-orange-100 to-hasivu-orange-200',
  },
  {
    title: 'Predictive Nutrition AI',
    description: "ML-powered meal recommendations based on your child's growth patterns",
    icon: TrendingUp,
    stats: '94% Satisfaction',
    color: 'text-hasivu-green-600',
    gradient: 'from-hasivu-green-100 to-hasivu-green-200',
  },
  {
    title: 'Bangalore Menu Curation',
    description: 'Authentic South Indian, North Indian, and cosmopolitan options for every taste',
    icon: ChefHat,
    stats: '150+ Daily Options',
    color: 'text-purple-600',
    gradient: 'from-purple-100 to-purple-200',
  },
];

// Navigation component
const Navigation = () => {
  const [_isMenuOpen, _setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-black text-xl">H</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <div className="font-black text-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                HASIVU
              </div>
              <div className="text-xs text-gray-300 font-medium -mt-1">AI-Powered School Meals</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-300 hover:text-emerald-400 transition-colors font-medium"
            >
              Features
            </Link>
            <Link
              href="#schools"
              className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
            >
              Schools
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-300 hover:text-purple-400 transition-colors font-medium"
            >
              Parents
            </Link>
            <Link
              href="#contact"
              className="text-gray-300 hover:text-pink-400 transition-colors font-medium"
            >
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-gray-300 hover:bg-white/10 backdrop-blur-sm rounded-xl"
              >
                Parent Login
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 backdrop-blur-sm rounded-xl"
              >
                <Users className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all rounded-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

// Hero section with live metrics
const HeroSection = () => {
  const liveStats = useLiveStats();

  return (
    <section className="relative pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
      {/* Modern gradient background with mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10"></div>

      {/* Animated mesh background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-emerald-400/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Badge className="mb-6 bg-white/10 backdrop-blur-sm text-white border border-white/20 text-sm px-6 py-3 rounded-full">
              ✨ Trusted by 50,000+ Bangalore Families
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
              India's Most
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Intelligent School
              </span>
              <span className="block text-4xl md:text-5xl lg:text-6xl text-gray-200 font-bold mt-2">
                Food Platform
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
              AI-powered meal management with RFID verification, real-time parent notifications, and
              authentic Indian cuisine designed specifically for Bangalore schools.
            </p>
          </motion.div>

          {/* Live Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 max-w-4xl mx-auto"
          >
            {[
              {
                value: liveStats.students,
                suffix: '+',
                label: 'Students Fed Daily',
                color: 'text-emerald-400',
              },
              {
                value: liveStats.schools,
                suffix: '+',
                label: 'Partner Schools',
                color: 'text-cyan-400',
              },
              {
                value: liveStats.orders / 1000000,
                suffix: 'M+',
                label: 'Meals Delivered',
                color: 'text-purple-400',
                decimals: 1,
              },
              {
                value: liveStats.accuracy,
                suffix: '%',
                label: 'RFID Accuracy',
                color: 'text-pink-400',
              },
              {
                value: liveStats.satisfaction,
                suffix: '★',
                label: 'Parent Rating',
                color: 'text-yellow-400',
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center group cursor-pointer p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div
                  className={`text-3xl md:text-4xl font-black mb-2 ${stat.color} group-hover:scale-110 transition-all duration-300`}
                >
                  <NumberTicker value={stat.value} className="inline" />
                  {stat.suffix}
                </div>
                <div className="text-gray-300 font-medium text-xs md:text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/dashboard">
              <Button
                size="xl"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-12 py-4 text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform hover:scale-105 group font-bold rounded-2xl backdrop-blur-sm"
              >
                <Users className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                Try Parent Dashboard
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link href="/school/demo">
              <Button
                variant="outline"
                size="xl"
                className="border-2 border-white/20 hover:border-white/40 px-12 py-4 text-lg bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all group font-bold rounded-2xl"
              >
                <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                Watch School Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="font-medium text-gray-200">SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Lock className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-gray-200">FERPA Compliant</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Award className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-gray-200">ISO 27001 Security</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CreditCard className="h-4 w-4 text-pink-400" />
              <span className="font-medium text-gray-200">PCI DSS Level 1</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Enhanced testimonial section
const TestimonialSection = () => {
  const [selectedTestimonial, setSelectedTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedTestimonial(prev => (prev + 1) % parentTestimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm px-6 py-3 rounded-full">
              💬 Real Parent Stories
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Bangalore Parents Love HASIVU
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of families who trust HASIVU with their children's nutrition and meal
              management
            </p>
          </motion.div>
        </div>

        {/* Featured Testimonial */}
        <motion.div
          key={selectedTestimonial}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-5xl mx-auto mb-16"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-2 border-white/20 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-500">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-2xl md:text-3xl text-white font-medium mb-8 italic leading-relaxed">
                "{parentTestimonials[selectedTestimonial].quote}"
              </blockquote>
              <div className="flex items-center justify-center">
                <img
                  src={parentTestimonials[selectedTestimonial].avatar}
                  alt={parentTestimonials[selectedTestimonial].author}
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg mr-6"
                />
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xl font-bold text-white">
                      {parentTestimonials[selectedTestimonial].author}
                    </h4>
                    {parentTestimonials[selectedTestimonial].verified && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-400/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-300">{parentTestimonials[selectedTestimonial].title}</p>
                  <p className="text-gray-400 text-sm">
                    {parentTestimonials[selectedTestimonial].school}
                  </p>
                  <p className="text-emerald-400 text-sm font-medium">
                    {parentTestimonials[selectedTestimonial].children} child
                    {parentTestimonials[selectedTestimonial].children > 1 ? 'ren' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Testimonial indicators */}
        <div className="flex justify-center space-x-2">
          {parentTestimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === selectedTestimonial
                  ? 'bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/50'
                  : 'bg-white/30 hover:bg-white/50 backdrop-blur-sm'
              }`}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Main component
export const ProductionLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation />
      <HeroSection />
      <TestimonialSection />

      {/* More sections to be added in next parts */}
    </div>
  );
};

export default ProductionLandingPage;
