"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence as _AnimatePresence } from 'framer-motion';
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
  Smartphone,
  ChefHat,
  CreditCard,
  Lock,
  Award,
  Globe,
  Target,
  Clock,
  Bell,
  Heart,
  Utensils,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BentoGrid as _BentoGrid, BentoGridItem as _BentoGridItem } from '@/components/magicui/bento-grid';
import { Marquee as _Marquee } from '@/components/magicui/marquee';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { BackgroundBeams as _BackgroundBeams } from '@/components/magicui/background-beams';

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
    satisfaction: 4.9
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
    name: "Delhi Public School Bangalore East",
