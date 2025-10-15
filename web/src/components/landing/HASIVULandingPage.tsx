'use client';

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
  Smartphone,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  { name: 'Springfield Unified', logo: '/logos/springfield.png', students: '12,000' },
  { name: 'Oak Valley Schools', logo: '/logos/oak-valley.png', students: '8,500' },
  { name: 'Riverside District', logo: '/logos/riverside.png', students: '15,200' },
  { name: 'Lincoln Elementary', logo: '/logos/lincoln.png', students: '3,400' },
  { name: 'Central High Network', logo: '/logos/central.png', students: '22,000' },
];

const testimonials = [
  {
    quote:
      'HASIVU eliminated our payment fraud entirely. 180 vulnerabilities fixed means we finally sleep well at night.',
    author: 'Dr. Sarah Chen',
    title: 'IT Director',
    school: 'Springfield Unified School District',
    students: '12,000 students',
    avatar: '/testimonials/sarah-chen.jpg',
    rating: 5,
  },
  {
    quote:
      'Parents can see their child get their meal in real-time. The RFID system has eliminated every delivery dispute.',
    author: 'Marcus Rodriguez',
    title: 'Food Service Director',
    school: 'Lincoln Elementary',
    students: '3,400 students',
    avatar: '/testimonials/marcus-rodriguez.jpg',
    rating: 5,
  },
  {
    quote:
      '67% faster meal pickups and zero manual errors. Our staff actually enjoys their job now.',
    author: 'Jennifer Park',
    title: 'Cafeteria Manager',
    school: 'Oak Valley Schools',
    students: '8,500 students',
    avatar: '/testimonials/jennifer-park.jpg',
    rating: 5,
  },
];

const features = [
  {
    title: 'AI Fraud Detection',
    description: '99.7% accuracy with real-time transaction monitoring and behavioral analysis',
    icon: Shield,
    stats: '₹2.3M saved annually',
    demo: '/demos/fraud-detection.mp4',
  },
  {
    title: 'RFID Verification',
    description: 'Real-time delivery confirmation with photo proof and parent notifications',
    icon: Zap,
    stats: '99.9% delivery accuracy',
    demo: '/demos/rfid-demo.mp4',
  },
  {
    title: 'Predictive Analytics',
    description: 'ML-powered insights for menu optimization and demand forecasting',
    icon: TrendingUp,
    stats: '94% churn prediction',
    demo: '/demos/analytics.mp4',
  },
  {
    title: 'Mobile-First Platform',
    description: 'Native apps for students, parents, and staff with offline capability',
    icon: Smartphone,
    stats: '4.9★ app rating',
    demo: '/demos/mobile-app.mp4',
  },
];

const faqData = {
  'Implementation & Setup': [
    {
      question: 'How long does implementation take?',
      answer:
        'Complete implementation in 3 weeks: Week 1 (Setup & Training), Week 2 (Testing & Integration), Week 3 (Go-Live & Optimization). Zero disruption to daily operations with our parallel rollout approach.',
    },
    {
      question: 'What training is required for staff?',
      answer:
        '2-hour training session covers everything. Our intuitive interface requires minimal learning. 95% of staff are fully proficient within 2 days. 24/7 support during transition period.',
    },
  ],
  'Security & Privacy': [
    {
      question: 'How secure is student data?',
      answer:
        'Bank-level security: SOC 2 Type II certified, FERPA compliant, ISO 27001 framework. All data encrypted in transit and at rest. 180 security vulnerabilities proactively addressed.',
    },
  ],
  'Costs & ROI': [
    {
      question: "What's the total cost of ownership?",
      answer:
        'Transparent pricing: Setup fee + monthly per-student cost. No hidden fees. Average ROI of 47% cost reduction within 6 months. Financing options available.',
    },
  ],
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
              99.7% fraud detection • Real-time delivery verification • 47% cost reduction
              guaranteed
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
                      {testimonials[selectedTestimonial].title},{' '}
                      {testimonials[selectedTestimonial].school}
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
          <p className="text-center text-gray-600 mb-8">
            Trusted by 100+ school districts nationwide
          </p>
          <Marquee className="py-4">
            {schoolLogos.map((school, index) => (
              <div key={index} className="mx-8 flex items-center space-x-3">
                <img
                  src={school.logo}
                  alt={school.name}
                  className="h-12 opacity-60 hover:opacity-100 transition-opacity"
                />
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
              Every day you delay fixing these problems costs your school money, staff sanity, and
              parent trust.
            </p>
          </motion.div>

          <BentoGrid className="max-w-4xl mx-auto">
            {[
              {
                title: 'Payment Fraud Crisis',
                problem: 'Manual processing allows fraud',
                cost: '₹50,000 lost monthly',
                icon: '💰',
              },
              {
                title: 'Zero Delivery Visibility',
                problem: 'Parents have no idea if meals delivered',
                cost: '100+ complaints/month',
                icon: '❓',
              },
              {
                title: 'Staff Overwhelm',
                problem: 'Manual verification takes hours daily',
                cost: '67% longer processes',
                icon: '😰',
              },
              {
                title: 'Security Nightmare',
                problem: '180 vulnerabilities in typical systems',
                cost: 'Data breach risk',
                icon: '🚨',
              },
            ].map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={
                  <div className="space-y-2">
                    <p className="text-gray-600">{item.problem}</p>
                    <p className="text-red-600 font-semibold">{item.cost}</p>
                  </div>
                }
                header={
                  <div className="flex items-center justify-center h-20 text-4xl bg-red-50 rounded-lg">
                    {item.icon}
                  </div>
                }
                className="bg-white hover:bg-red-50 transition-colors border-2 border-red-100"
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* SOLUTION REVELATION - Phase 4 */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-green-50 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet HASIVU: <span className="text-green-600">The AI That Solves Everything</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The only platform that combines AI payment intelligence with RFID delivery
              verification to create a completely transparent, secure, and efficient school food
              experience.
            </p>
          </motion.div>

          <BentoGrid className="max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <BentoGridItem
                key={i}
                title={feature.title}
                description={
                  <div className="space-y-3">
                    <p className="text-gray-600">{feature.description}</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {feature.stats}
                    </Badge>
                  </div>
                }
                header={
                  <div className="flex items-center justify-center h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
                    <feature.icon className="h-16 w-16 text-green-600" />
                  </div>
                }
                className="bg-white hover:bg-green-50 transition-all hover:shadow-lg border-2 border-green-100"
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* SOCIAL PROOF GALLERY - Phase 5 */}
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
              Real Results From Real Schools
            </h2>
            <p className="text-xl text-gray-600">
              See why 100+ school districts trust HASIVU with their food service operations
            </p>
          </motion.div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { stat: '99.7%', label: 'Fraud Detection', subtext: 'Industry leading' },
              { stat: '47%', label: 'Cost Reduction', subtext: 'Average savings' },
              { stat: '67%', label: 'Faster Pickups', subtext: 'Time efficiency' },
              { stat: '99.9%', label: 'Delivery Accuracy', subtext: 'RFID verified' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {item.stat}
                </div>
                <div className="text-lg font-semibold text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-600">{item.subtext}</div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="font-semibold text-sm">{testimonial.author}</div>
                        <div className="text-xs text-gray-600">{testimonial.title}</div>
                        <div className="text-xs text-gray-500">{testimonial.school}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION - Phase 6 */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about HASIVU implementation
            </p>
          </motion.div>

          {Object.entries(faqData).map(([category, questions], categoryIndex) => (
            <div key={category} className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">{category}</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {questions.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`${categoryIndex}-${i}`}
                    className="bg-white rounded-lg border border-gray-200"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION - Phase 7 */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your School's Food Service?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 100+ school districts already using AI-powered food service technology. Limited
              implementation slots available for 2024.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book Implementation Demo
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg transition-all"
              >
                Get Custom Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="text-sm opacity-75">
              ✅ 30-day money-back guarantee • ✅ Zero-risk implementation • ✅ 24/7 support
              included
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-4xl w-full aspect-video"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>HASIVU Platform Demo Video</p>
                  <p className="text-sm opacity-75">(Video player would be integrated here)</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HASIVULandingPage;
