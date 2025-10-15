/**
 * HASIVU Platform - Communication Preferences Component
 * Epic 6: Notifications & Communication System
 *
 * User communication preferences management with granular control
 * over notification channels, categories, and timing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  BellOff: _BellOff,
  Mail,
  MessageSquare,
  Smartphone,
  Clock: _Clock,
  Save,
  RefreshCw,
  CheckCircle: _CheckCircle,
  AlertTriangle,
  Settings,
  Moon,
  Sun: _Sun
} from 'lucide-react';
import { NotificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/types/feature-flags';

interface CommunicationPreferencesProps {
  userId: string;
  className?: string;
}

interface PreferencesData {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    orders: boolean;
    payments: boolean;
    promotions: boolean;
    system: boolean;
    academic: boolean;
  };
}

const CHANNELS = [
  {
    id: 'email',
    name: 'Email',
    description: 'Receive notifications via email',
    icon: Mail,
    color: 'text-blue-600'
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Receive notifications via SMS',
    icon: MessageSquare,
    color: 'text-green-600'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Receive notifications via WhatsApp',
    icon: MessageSquare,
    color: 'text-green-600'
  },
  {
    id: 'push',
    name: 'Push Notifications',
    description: 'Receive push notifications on mobile',
    icon: Smartphone,
    color: 'text-purple-600'
  },
  {
    id: 'inApp',
    name: 'In-App Notifications',
    description: 'Receive notifications within the app',
    icon: Bell,
    color: 'text-orange-600'
  }
];

const CATEGORIES = [
  {
    id: 'orders',
    name: 'Order Updates',
    description: 'Meal orders, delivery status, cancellations',
