/**
 * HASIVU Platform - Feature Flags Management Admin Page
 * Admin interface for managing feature flags with rollout controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Alert as _Alert, AlertDescription as _AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Settings,
  Flag,
  Users,
  BarChart3,
  Play,
  Pause,
  Edit,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useFeatureFlagAnalytics } from '@/hooks/useFeatureFlag';
import { FeatureFlag, UserSegment, FeatureFlagRolloutStrategy, FeatureFlagEnvironment } from '@/types/feature-flags';
import { cn } from '@/lib/utils';

interface FeatureFlagFormData {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  category: 'payment' | 'notification' | 'analytics' | 'ui' | 'experimental';
  priority: 'low' | 'medium' | 'high' | 'critical';
  rules: {
    strategy: FeatureFlagRolloutStrategy;
    percentage?: number;
    environments: FeatureFlagEnvironment[];
    segments?: string[];
  }[];
}

const STRATEGY_ICONS = {
  percentage: Target,
  'user-segment': Users,
  environment: Shield,
  gradual: TrendingUp
};

const CATEGORY_ICONS = {
