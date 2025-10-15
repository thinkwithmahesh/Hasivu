/**
 * HASIVU Enhanced School Onboarding Flow - Epic 2 Story 2
 *
 * World-class onboarding experience that transforms how schools adopt HASIVU
 * - Zero-to-live in 2 hours
 * - Multi-stakeholder support (Principal, Kitchen Staff, Teachers, Parents)
 * - Real-time progress tracking with WebSocket integration
 * - Mobile-first responsive design
 * - Accessibility: WCAG 2.1 AA+ compliance
 * - Performance: <3s load time, <500ms interactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  ArrowRight, ArrowLeft, Building, Users, CreditCard,
  Radio, Settings, Shield, Clock, CheckCircle, Loader2,
  Download, Eye, Star, Sparkles, Upload, Palette,
  UserPlus, CalendarDays, CookingPot, Smartphone,
  Globe, Heart, Trophy, Zap, BookOpen, Utensils,
  GraduationCap, Home, Phone, Mail, MapPin,
  ChefHat, Camera, FileText, Languages, IndianRupee
} from 'lucide-react';
import { hasiviApi } from '@/services/api/hasivu-api.service';
import AdminSetupStep from './steps/AdminSetupStep';
import StakeholderSetupStep from './steps/StakeholderSetupStep';
import BrandingStep from './steps/BrandingStep';
import ConfigurationStep from './steps/ConfigurationStep';
import RFIDSetupStep from './steps/RFIDSetupStep';
import CompletionStep from './steps/CompletionStep';

// ============ VALIDATION SCHEMAS ============

const schoolInfoSchema = z.object({
  name: z.string().min(1, 'School name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(50),
  state: z.string().min(1, 'State is required'),
  pinCode: z.string().regex(/^[1-9][0-9]{5}$/, 'Valid PIN code required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian mobile number required'),
  email: z.string().email('Valid email required'),
  website: z.string().url().optional().or(z.literal('')),
  studentCount: z.number().min(1, 'Must have at least 1 student').max(10000),
  gradeRange: z.object({
    from: z.string(),
    to: z.string()
  }),
  lunchProgram: z.boolean(),
  currentSystem: z.string(),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  establishedYear: z.number().min(1800).max(new Date().getFullYear()),
  schoolType: z.enum(['government', 'private', 'aided', 'international'])
});

const adminSetupSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid mobile number required'),
  role: z.enum(['principal', 'admin', 'food_director']),
  department: z.string().min(1, 'Department required'),
  experience: z.number().min(0).max(50),
  preferredLanguage: z.enum(['en', 'hi', 'kn'])
});

const stakeholderSetupSchema = z.object({
  kitchenStaff: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    role: z.enum(['head_chef', 'assistant_chef', 'kitchen_assistant']),
    shift: z.enum(['morning', 'afternoon', 'both'])
  })),
  teachers: z.object({
    inviteMethod: z.enum(['bulk_email', 'individual', 'csv_upload']),
    emailList: z.string().optional(),
    csvFile: z.instanceof(File).optional()
  }),
  parents: z.object({
    communicationMethod: z.enum(['sms', 'email', 'whatsapp', 'app']),
    languages: z.array(z.string()),
    notificationPreferences: z.array(z.string())
  })
});

const brandingSchema = z.object({
  schoolLogo: z.instanceof(File).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  fontFamily: z.enum(['inter', 'roboto', 'poppins', 'noto_sans']),
  schoolMotto: z.string().max(100).optional(),
  customGreeting: z.string().max(200).optional(),
  enableDarkMode: z.boolean()
});

const configurationSchema = z.object({
  gradeClasses: z.array(z.object({
    grade: z.string(),
    sections: z.array(z.string()),
    studentCount: z.number()
  })),
  mealTimings: z.object({
    breakfast: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string()
    }),
    lunch: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string()
    }),
    snacks: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string()
    })
  }),
  paymentConfig: z.object({
    acceptPayments: z.boolean(),
    paymentMethods: z.array(z.string()),
    minimumBalance: z.number().min(0),
    autoReload: z.boolean(),
    reloadAmount: z.number().min(0),
    subscriptionDiscounts: z.boolean(),
    parentAccountRequired: z.boolean()
  }),
  kitchenSetup: z.object({
    capacity: z.number().min(1),
    equipmentList: z.array(z.string()),
    staffCount: z.number().min(1),
    workflowType: z.enum(['assembly_line', 'station_based', 'hybrid']),
    hygieneCertification: z.boolean(),
    allergenProtocols: z.boolean()
  })
});

const rfidSetupSchema = z.object({
  enableRFID: z.boolean(),
  readerLocations: z.array(z.object({
    name: z.string(),
    location: z.string(),
    type: z.enum(['entry', 'classroom', 'cafeteria', 'exit'])
  })),
  cardDistribution: z.object({
    method: z.enum(['bulk_grade_wise', 'individual', 'gradual_rollout']),
    timeline: z.string(),
    backupMethod: z.enum(['qr_code', 'mobile_app', 'manual_entry'])
  }),
  securityFeatures: z.object({
    encryptionLevel: z.enum(['basic', 'advanced']),
    biometricBackup: z.boolean(),
    fraudDetection: z.boolean(),
    realTimeMonitoring: z.boolean()
  })
});

// ============ TYPE DEFINITIONS ============

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  required: boolean;
  estimatedTime: string;
  category: 'setup' | 'configuration' | 'customization' | 'integration' | 'completion';
}

interface OnboardingProgress {
  currentStep: number;
  completedSteps: Set<number>;
  totalEstimatedTime: number;
  timeSpent: number;
  startedAt: Date;
  lastSavedAt: Date;
}

interface WebSocketConnection {
  socket: WebSocket | null;
  isConnected: boolean;
  reconnectAttempts: number;
}

// ============ ENHANCED ONBOARDING COMPONENT ============

const EnhancedOnboardingFlow: React.FC<{
  onComplete: () => void;
  onSkip?: () => void;
  schoolId?: string;
  tenantId?: string;
}> = ({ onComplete, onSkip, schoolId, tenantId }) => {

  // ============ STATE MANAGEMENT ============
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 0,
    completedSteps: new Set(),
    totalEstimatedTime: 120, // 2 hours in minutes
    timeSpent: 0,
    startedAt: new Date(),
    lastSavedAt: new Date()
  });

  // WebSocket for real-time progress tracking
  const [wsConnection, setWsConnection] = useState<WebSocketConnection>({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0
  });

  // Form management with React Hook Form + Zod
  const schoolInfoForm = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      languages: ['en'],
      lunchProgram: true,
      currentSystem: 'manual',
      schoolType: 'private' as const,
      gradeRange: { from: '1', to: '12' }
    }
  });

  const adminSetupForm = useForm({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      role: 'principal' as const,
      preferredLanguage: 'en' as const
    }
  });

  const stakeholderForm = useForm({
    resolver: zodResolver(stakeholderSetupSchema),
    defaultValues: {
      kitchenStaff: [],
      teachers: { inviteMethod: 'bulk_email' as const },
      parents: {
        communicationMethod: 'sms' as const,
        languages: ['en'],
        notificationPreferences: ['meal_reminders', 'payment_alerts']
      }
    }
  });

  const brandingForm = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      fontFamily: 'inter' as const,
      enableDarkMode: false
    }
  });

  const configurationForm = useForm({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      gradeClasses: [],
      mealTimings: {
        breakfast: { enabled: false, startTime: '08:00', endTime: '09:00', orderDeadline: '07:30' },
        lunch: { enabled: true, startTime: '12:00', endTime: '13:00', orderDeadline: '11:30' },
        snacks: { enabled: false, startTime: '15:00', endTime: '16:00', orderDeadline: '14:30' }
      },
      paymentConfig: {
        acceptPayments: true,
        paymentMethods: ['upi', 'card', 'parent_account'],
        minimumBalance: 100,
        autoReload: false,
        reloadAmount: 500,
        subscriptionDiscounts: true,
        parentAccountRequired: true
      },
      kitchenSetup: {
        capacity: 500,
        equipmentList: [],
        staffCount: 3,
        workflowType: 'station_based' as const,
        hygieneCertification: true,
        allergenProtocols: true
      }
    }
  });

  const rfidForm = useForm({
    resolver: zodResolver(rfidSetupSchema),
    defaultValues: {
      enableRFID: true,
      readerLocations: [],
      cardDistribution: {
        method: 'bulk_grade_wise' as const,
        timeline: '1_week',
        backupMethod: 'qr_code' as const
      },
      securityFeatures: {
        encryptionLevel: 'advanced' as const,
        biometricBackup: false,
        fraudDetection: true,
        realTimeMonitoring: true
      }
    }
  });

  // ============ ONBOARDING STEPS CONFIGURATION ============
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to HASIVU',
      description: 'Transform your school\'s food service with AI-powered delivery',
      icon: Sparkles,
      required: true,
      estimatedTime: '2 min',
      category: 'setup'
    },
    {
      id: 'school_info',
      title: 'School Information',
      description: 'Tell us about your school and current setup',
      icon: Building,
      required: true,
      estimatedTime: '8 min',
      category: 'setup'
    },
    {
      id: 'admin_setup',
      title: 'Administrator Setup',
      description: 'Configure your administrator account and preferences',
      icon: UserPlus,
      required: true,
      estimatedTime: '5 min',
      category: 'setup'
    },
    {
      id: 'stakeholder_setup',
      title: 'Team & Stakeholder Setup',
      description: 'Invite and configure kitchen staff, teachers, and parent communication',
      icon: Users,
      required: true,
      estimatedTime: '12 min',
      category: 'setup'
    },
    {
      id: 'branding',
      title: 'School Branding & Customization',
      description: 'Customize your school\'s portal with logo, colors, and themes',
      icon: Palette,
      required: false,
      estimatedTime: '10 min',
      category: 'customization'
    },
    {
      id: 'configuration',
      title: 'System Configuration',
      description: 'Configure grades, meal timings, payments, and kitchen workflow',
      icon: Settings,
      required: true,
      estimatedTime: '15 min',
      category: 'configuration'
    },
    {
      id: 'rfid_setup',
      title: 'RFID & Security Setup',
      description: 'Configure RFID cards, readers, and security protocols',
      icon: Radio,
      required: true,
      estimatedTime: '12 min',
      category: 'configuration'
    },
    {
      id: 'integration',
      title: 'System Integration & Testing',
      description: 'Connect with existing systems and test all configurations',
      icon: Zap,
      required: false,
      estimatedTime: '15 min',
      category: 'integration'
    },
    {
      id: 'data_import',
      title: 'Data Import & Migration',
      description: 'Import student data, staff information, and migrate from existing systems',
      icon: FileText,
      required: false,
      estimatedTime: '20 min',
      category: 'integration'
    },
    {
      id: 'completion',
      title: 'Setup Complete!',
      description: 'Your HASIVU system is ready to transform school nutrition',
      icon: Trophy,
      required: true,
      estimatedTime: '3 min',
      category: 'completion'
    }
  ];

  // ============ WEBSOCKET CONNECTION ============
  useEffect(() => {
    const connectWebSocket = () => {
      if (!tenantId) return;

      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/onboarding/${tenantId}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setWsConnection(prev => ({
            ...prev,
            socket,
            isConnected: true,
            reconnectAttempts: 0
          }));

          socket.send(JSON.stringify({
            type: 'ONBOARDING_STARTED',
            payload: {
              schoolId,
              tenantId,
              currentStep,
              timestamp: new Date().toISOString()
            }
          }));
        };

        socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        };

        socket.onclose = () => {
          setWsConnection(prev => ({
            ...prev,
            socket: null,
            isConnected: false
          }));

          // Implement exponential backoff for reconnection
          setTimeout(() => {
            if (wsConnection.reconnectAttempts < 5) {
              setWsConnection(prev => ({
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1
              }));
              connectWebSocket();
            }
          }, Math.pow(2, wsConnection.reconnectAttempts) * 1000);
        };

        socket.onerror = (error) => {
        };

      } catch (error) {
      }
    };

    connectWebSocket();

    return () => {
      if (wsConnection.socket) {
        wsConnection.socket.close();
      }
    };
  }, [tenantId, schoolId]);

  // ============ WEBSOCKET MESSAGE HANDLER ============
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'PROGRESS_UPDATE':
        setProgress(prev => ({
          ...prev,
          ...message.payload
        }));
        break;

      case 'STEP_VALIDATION_RESULT':
        if (message.payload.isValid) {
          toast.success('Step validation successful!');
        } else {
          toast.error(`Validation failed: ${message.payload.errors.join(', ')}`);
        }
        break;

      case 'REAL_TIME_SUGGESTION':
        toast.info(message.payload.suggestion, {
          duration: 5000,
