"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Shield, 
  Zap, 
  _CheckCircle, 
  Star, 
  ArrowRight, 
  Calendar,
  Users,
  TrendingUp,
  _Lock,
  Award,
  Smartphone
} from 'lucide-react';

// MagicUI Components (to be installed: npm install @magicui/react)
import { BentoGrid, BentoGridItem } from '@/components/magicui/bento-grid';
import { Marquee } from '@/components/magicui/marquee';
import { _AnimatedList } from '@/components/magicui/animated-list';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { _TextGenerateEffect } from '@/components/magicui/text-generate-effect';
import { BackgroundBeams } from '@/components/magicui/background-beams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, _CardDescription, _CardHeader, _CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Custom Hooks
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed]);
  
  return displayText;
};

// Data
const schoolLogos = [
  { name: "Springfield Unified", logo: "/logos/springfield.png", students: "12,000" },
  { name: "Oak Valley Schools", logo: "/logos/oak-valley.png", students: "8,500" },
  { name: "Riverside District", logo: "/logos/riverside.png", students: "15,200" },
  { name: "Lincoln Elementary", logo: "/logos/lincoln.png", students: "3,400" },
  { name: "Central High Network", logo: "/logos/central.png", students: "22,000" },
];

const testimonials = [
  {
    quote: "HASIVU eliminated our payment fraud entirely. 180 vulnerabilities fixed means we finally sleep well at night.",
    author: "Dr. Sarah Chen",
    title: "IT Director",
    school: "Springfield Unified School District",
    students: "12,000 students",
    avatar: "/testimonials/sarah-chen.jpg",
    rating: 5
  },
  {
    quote: "Parents can see their child get their meal in real-time. The RFID system has eliminated every delivery dispute.",
    author: "Marcus Rodriguez",
    title: "Food Service Director", 
    school: "Lincoln Elementary",
    students: "3,400 students",
    avatar: "/testimonials/marcus-rodriguez.jpg",
    rating: 5
  },
  {
    quote: "67% faster meal pickups and zero manual errors. Our staff actually enjoys their job now.",
    author: "Jennifer Park",
    title: "Cafeteria Manager",
    school: "Oak Valley Schools", 
    students: "8,500 students",
    avatar: "/testimonials/jennifer-park.jpg",
    rating: 5
  }
];

const features = [
  {
    title: "AI Fraud Detection",
    description: "99.7% accuracy with real-time transaction monitoring and behavioral analysis",
    icon: Shield,
    stats: "₹2.3M saved annually",
    demo: "/demos/fraud-detection.mp4"
  },
  {
    title: "RFID Verification",
    description: "Real-time delivery confirmation with photo proof and parent notifications",
    icon: Zap,
    stats: "99.9% delivery accuracy",
    demo: "/demos/rfid-demo.mp4"
  },
  {
    title: "Predictive Analytics",
    description: "ML-powered insights for menu optimization and demand forecasting",
    icon: TrendingUp,
    stats: "94% churn prediction",
    demo: "/demos/analytics.mp4"
  },
  {
    title: "Mobile-First Platform",
    description: "Native apps for students, parents, and staff with offline capability",
    icon: Smartphone,
    stats: "4.9★ app rating",
    demo: "/demos/mobile-app.mp4"
  }
];

const faqData = {
  "Implementation & Setup": [
    {
      question: "How long does implementation take?",
      answer: "Complete implementation in 3 weeks: Week 1 (Setup & Training), Week 2 (Testing & Integration), Week 3 (Go-Live & Optimization). Zero disruption to daily operations with our parallel rollout approach."
    },
    {
      question: "What training is required for staff?",  
      answer: "2-hour training session covers everything. Our intuitive interface requires minimal learning. 95% of staff are fully proficient within 2 days. 24/7 support during transition period."
    }
  ],
  "Security & Privacy": [
    {
      question: "How secure is student data?",
      answer: "Bank-level security: SOC 2 Type II certified, FERPA compliant, ISO 27001 framework. All data encrypted in transit and at rest. 180 security vulnerabilities proactively addressed."
    }
  ],
  "Costs & ROI": [
    {
      question: "What's the total cost of ownership?",
      answer: "Transparent pricing: Setup fee + monthly per-student cost. No hidden fees. Average ROI of 47% cost reduction within 6 months. Financing options available."
    }
  ]
};

const HASIVULandingPage: React.FC = () => {
  const [selectedTestimonial, setSelectedTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const heroHeadline = useTypewriter("The World's First AI-Powered RFID School Food Platform");
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* HERO SECTION - Phase 1 */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <BackgroundBeams />
        <div className="max-w-7xl mx-auto text-center z-10">
          
          {/* Main Headline with Typewriter Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {heroHeadline}
              </span>
            </h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
            >
              99.7% fraud detection • Real-time delivery verification • 47% cost reduction guaranteed
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Demo - See It Live
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 hover:border-green-600 px-8 py-4 text-lg transition-all"
              onClick={() => setIsVideoPlaying(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch 2-Min Demo
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.8 }}
          >
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-green-600" />
              <NumberTicker value={50000} />+ Students Served
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-1 text-blue-600" />
              SOC 2 Type II Certified
            </div>
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-1 text-purple-600" />
              <NumberTicker value={180} /> Security Fixes
            </div>
          </motion.div>

          {/* Current Testimonial */}
          <motion.div
            className="mt-16 max-w-2xl mx-auto"
            key={selectedTestimonial}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white/80 backdrop-blur border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-4 italic">
                  "{testimonials[selectedTestimonial].quote}"
                </p>
                <div className="flex items-center justify-center">
                  <img 
                    src={testimonials[selectedTestimonial].avatar}
                    alt={testimonials[selectedTestimonial].author}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <div className="text-left">
                    <div className="font-semibold">{testimonials[selectedTestimonial].author}</div>
                    <div className="text-sm text-gray-600">
                      {testimonials[selectedTestimonial].title}, {testimonials[selectedTestimonial].school}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* LOGO MARQUEE - Phase 2 */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-600 mb-8">Trusted by 100+ school districts nationwide</p>
          <Marquee className="py-4">
            {schoolLogos.map((school, index) => (
              <div key={index} className="mx-8 flex items-center space-x-3">
                <img src={school.logo} alt={school.name} className="h-12 opacity-60 hover:opacity-100 transition-opacity" />
                <div className="text-sm text-gray-500">
                  <div className="font-semibold">{school.name}</div>
                  <div>{school.students} students</div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* PROBLEM AGITATION - Phase 3 */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              School Food Service Is Broken. 
              <span className="text-red-600 block mt-2">Everyone Knows It.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every day you delay fixing these problems costs your school money, staff sanity, and parent trust.
            </p>
          </motion.div>

          <BentoGrid className="max-w-4xl mx-auto">
            {[
