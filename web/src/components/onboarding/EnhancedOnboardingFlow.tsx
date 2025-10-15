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
  ArrowRight,
  ArrowLeft,
  Building,
  Users,
  Radio,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  Palette,
  UserPlus,
  Heart,
  Trophy,
  Zap,
  FileText,
  Phone,
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
    to: z.string(),
  }),
  lunchProgram: z.boolean(),
  currentSystem: z.string(),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  establishedYear: z.number().min(1800).max(new Date().getFullYear()),
  schoolType: z.enum(['government', 'private', 'aided', 'international']),
});

const adminSetupSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid mobile number required'),
  role: z.enum(['principal', 'admin', 'food_director']),
  department: z.string().min(1, 'Department required'),
  experience: z.number().min(0).max(50),
  preferredLanguage: z.enum(['en', 'hi', 'kn']),
});

const stakeholderSetupSchema = z.object({
  kitchenStaff: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().regex(/^[6-9]\d{9}$/),
      role: z.enum(['head_chef', 'assistant_chef', 'kitchen_assistant']),
      shift: z.enum(['morning', 'afternoon', 'both']),
    })
  ),
  teachers: z.object({
    inviteMethod: z.enum(['bulk_email', 'individual', 'csv_upload']),
    emailList: z.string().optional(),
    csvFile: z.instanceof(File).optional(),
  }),
  parents: z.object({
    communicationMethod: z.enum(['sms', 'email', 'whatsapp', 'app']),
    languages: z.array(z.string()),
    notificationPreferences: z.array(z.string()),
  }),
});

const brandingSchema = z.object({
  schoolLogo: z.instanceof(File).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required'),
  fontFamily: z.enum(['inter', 'roboto', 'poppins', 'noto_sans']),
  schoolMotto: z.string().max(100).optional(),
  customGreeting: z.string().max(200).optional(),
  enableDarkMode: z.boolean(),
});

const configurationSchema = z.object({
  gradeClasses: z.array(
    z.object({
      grade: z.string(),
      sections: z.array(z.string()),
      studentCount: z.number(),
    })
  ),
  mealTimings: z.object({
    breakfast: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string(),
    }),
    lunch: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string(),
    }),
    snacks: z.object({
      enabled: z.boolean(),
      startTime: z.string(),
      endTime: z.string(),
      orderDeadline: z.string(),
    }),
  }),
  paymentConfig: z.object({
    acceptPayments: z.boolean(),
    paymentMethods: z.array(z.string()),
    minimumBalance: z.number().min(0),
    autoReload: z.boolean(),
    reloadAmount: z.number().min(0),
    subscriptionDiscounts: z.boolean(),
    parentAccountRequired: z.boolean(),
  }),
  kitchenSetup: z.object({
    capacity: z.number().min(1),
    equipmentList: z.array(z.string()),
    staffCount: z.number().min(1),
    workflowType: z.enum(['assembly_line', 'station_based', 'hybrid']),
    hygieneCertification: z.boolean(),
    allergenProtocols: z.boolean(),
  }),
});

const rfidSetupSchema = z.object({
  enableRFID: z.boolean(),
  readerLocations: z.array(
    z.object({
      name: z.string(),
      location: z.string(),
      type: z.enum(['entry', 'classroom', 'cafeteria', 'exit']),
    })
  ),
  cardDistribution: z.object({
    method: z.enum(['bulk_grade_wise', 'individual', 'gradual_rollout']),
    timeline: z.string(),
    backupMethod: z.enum(['qr_code', 'mobile_app', 'manual_entry']),
  }),
  securityFeatures: z.object({
    encryptionLevel: z.enum(['basic', 'advanced']),
    biometricBackup: z.boolean(),
    fraudDetection: z.boolean(),
    realTimeMonitoring: z.boolean(),
  }),
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
    lastSavedAt: new Date(),
  });

  // WebSocket for real-time progress tracking
  const [wsConnection, setWsConnection] = useState<WebSocketConnection>({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
  });

  // Form management with React Hook Form + Zod
  const schoolInfoForm = useForm({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      languages: ['en'],
      lunchProgram: true,
      currentSystem: 'manual',
      schoolType: 'private' as const,
      gradeRange: { from: '1', to: '12' },
    },
  });

  const adminSetupForm = useForm({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      role: 'principal' as const,
      preferredLanguage: 'en' as const,
    },
  });

  const stakeholderForm = useForm({
    resolver: zodResolver(stakeholderSetupSchema),
    defaultValues: {
      kitchenStaff: [],
      teachers: { inviteMethod: 'bulk_email' as const },
      parents: {
        communicationMethod: 'sms' as const,
        languages: ['en'],
        notificationPreferences: ['meal_reminders', 'payment_alerts'],
      },
    },
  });

  const brandingForm = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      fontFamily: 'inter' as const,
      enableDarkMode: false,
    },
  });

  const configurationForm = useForm({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      gradeClasses: [],
      mealTimings: {
        breakfast: { enabled: false, startTime: '08:00', endTime: '09:00', orderDeadline: '07:30' },
        lunch: { enabled: true, startTime: '12:00', endTime: '13:00', orderDeadline: '11:30' },
        snacks: { enabled: false, startTime: '15:00', endTime: '16:00', orderDeadline: '14:30' },
      },
      paymentConfig: {
        acceptPayments: true,
        paymentMethods: ['upi', 'card', 'parent_account'],
        minimumBalance: 100,
        autoReload: false,
        reloadAmount: 500,
        subscriptionDiscounts: true,
        parentAccountRequired: true,
      },
      kitchenSetup: {
        capacity: 500,
        equipmentList: [],
        staffCount: 3,
        workflowType: 'station_based' as const,
        hygieneCertification: true,
        allergenProtocols: true,
      },
    },
  });

  const rfidForm = useForm({
    resolver: zodResolver(rfidSetupSchema),
    defaultValues: {
      enableRFID: true,
      readerLocations: [],
      cardDistribution: {
        method: 'bulk_grade_wise' as const,
        timeline: '1_week',
        backupMethod: 'qr_code' as const,
      },
      securityFeatures: {
        encryptionLevel: 'advanced' as const,
        biometricBackup: false,
        fraudDetection: true,
        realTimeMonitoring: true,
      },
    },
  });

  // ============ ONBOARDING STEPS CONFIGURATION ============
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to HASIVU',
      description: "Transform your school's food service with AI-powered delivery",
      icon: Sparkles,
      required: true,
      estimatedTime: '2 min',
      category: 'setup',
    },
    {
      id: 'school_info',
      title: 'School Information',
      description: 'Tell us about your school and current setup',
      icon: Building,
      required: true,
      estimatedTime: '8 min',
      category: 'setup',
    },
    {
      id: 'admin_setup',
      title: 'Administrator Setup',
      description: 'Configure your administrator account and preferences',
      icon: UserPlus,
      required: true,
      estimatedTime: '5 min',
      category: 'setup',
    },
    {
      id: 'stakeholder_setup',
      title: 'Team & Stakeholder Setup',
      description: 'Invite and configure kitchen staff, teachers, and parent communication',
      icon: Users,
      required: true,
      estimatedTime: '12 min',
      category: 'setup',
    },
    {
      id: 'branding',
      title: 'School Branding & Customization',
      description: "Customize your school's portal with logo, colors, and themes",
      icon: Palette,
      required: false,
      estimatedTime: '10 min',
      category: 'customization',
    },
    {
      id: 'configuration',
      title: 'System Configuration',
      description: 'Configure grades, meal timings, payments, and kitchen workflow',
      icon: Settings,
      required: true,
      estimatedTime: '15 min',
      category: 'configuration',
    },
    {
      id: 'rfid_setup',
      title: 'RFID & Security Setup',
      description: 'Configure RFID cards, readers, and security protocols',
      icon: Radio,
      required: true,
      estimatedTime: '12 min',
      category: 'configuration',
    },
    {
      id: 'integration',
      title: 'System Integration & Testing',
      description: 'Connect with existing systems and test all configurations',
      icon: Zap,
      required: false,
      estimatedTime: '15 min',
      category: 'integration',
    },
    {
      id: 'data_import',
      title: 'Data Import & Migration',
      description: 'Import student data, staff information, and migrate from existing systems',
      icon: FileText,
      required: false,
      estimatedTime: '20 min',
      category: 'integration',
    },
    {
      id: 'completion',
      title: 'Setup Complete!',
      description: 'Your HASIVU system is ready to transform school nutrition',
      icon: Trophy,
      required: true,
      estimatedTime: '3 min',
      category: 'completion',
    },
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
            reconnectAttempts: 0,
          }));

          socket.send(
            JSON.stringify({
              type: 'ONBOARDING_STARTED',
              payload: {
                schoolId,
                tenantId,
                currentStep,
                timestamp: new Date().toISOString(),
              },
            })
          );
        };

        socket.onmessage = event => {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        };

        socket.onclose = () => {
          setWsConnection(prev => ({
            ...prev,
            socket: null,
            isConnected: false,
          }));

          // Implement exponential backoff for reconnection
          setTimeout(
            () => {
              if (wsConnection.reconnectAttempts < 5) {
                setWsConnection(prev => ({
                  ...prev,
                  reconnectAttempts: prev.reconnectAttempts + 1,
                }));
                connectWebSocket();
              }
            },
            Math.pow(2, wsConnection.reconnectAttempts) * 1000
          );
        };

        socket.onerror = error => {};
      } catch (error) {
        // Error handled silently
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
          ...message.payload,
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
          icon: '💡',
        });
        break;

      default:
    }
  };

  // ============ PROGRESS TRACKING ============
  const broadcastProgress = useCallback(
    (stepIndex: number, action: string, data?: any) => {
      if (wsConnection.socket && wsConnection.isConnected) {
        wsConnection.socket.send(
          JSON.stringify({
            type: 'ONBOARDING_PROGRESS',
            payload: {
              schoolId,
              tenantId,
              currentStep: stepIndex,
              action,
              data,
              timestamp: new Date().toISOString(),
            },
          })
        );
      }
    },
    [wsConnection, schoolId, tenantId]
  );

  // ============ AUTO-SAVE FUNCTIONALITY ============
  useEffect(() => {
    const saveProgressToStorage = () => {
      const progressData = {
        currentStep,
        completedSteps: Array.from(progress.completedSteps),
        schoolInfo: schoolInfoForm.getValues(),
        adminSetup: adminSetupForm.getValues(),
        stakeholders: stakeholderForm.getValues(),
        branding: brandingForm.getValues(),
        configuration: configurationForm.getValues(),
        rfidSetup: rfidForm.getValues(),
        progress,
      };

      localStorage.setItem(`hasivu_onboarding_${tenantId}`, JSON.stringify(progressData));
      setProgress(prev => ({ ...prev, lastSavedAt: new Date() }));
    };

    const autoSaveTimer = setTimeout(saveProgressToStorage, 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [currentStep, progress.completedSteps, tenantId]);

  // ============ STEP NAVIGATION ============
  const nextStep = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    broadcastProgress(currentStep, 'STEP_COMPLETED');

    try {
      await saveCurrentStepData();

      setProgress(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, currentStep]),
      }));

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        broadcastProgress(currentStep + 1, 'STEP_STARTED');
      } else {
        await completeOnboarding();
      }
    } catch (error) {
      toast.error('Failed to save progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      broadcastProgress(currentStep - 1, 'STEP_RETURNED');
    }
  };

  // ============ VALIDATION ============
  const validateCurrentStep = (): boolean => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'school_info':
        return schoolInfoForm.trigger();
      case 'admin_setup':
        return adminSetupForm.trigger();
      case 'stakeholder_setup':
        return stakeholderForm.trigger();
      case 'branding':
        return brandingForm.trigger();
      case 'configuration':
        return configurationForm.trigger();
      case 'rfid_setup':
        return rfidForm.trigger();
      default:
        return true;
    }
  };

  // ============ DATA PERSISTENCE ============
  const saveCurrentStepData = async () => {
    const stepId = steps[currentStep].id;

    try {
      switch (stepId) {
        case 'school_info':
          await hasiviApi.updateSchoolInfo({
            ...schoolInfoForm.getValues(),
            tenantId,
            schoolId,
          });
          break;

        case 'admin_setup':
          await hasiviApi.updateUserProfile({
            ...adminSetupForm.getValues(),
            tenantId,
            schoolId,
            userId: 'current', // Will be replaced with actual user ID
          });
          break;

        case 'stakeholder_setup':
          await hasiviApi.configureStakeholders({
            ...stakeholderForm.getValues(),
            tenantId,
            schoolId,
          });
          break;

        case 'branding':
          await hasiviApi.updateSchoolBranding({
            ...brandingForm.getValues(),
            tenantId,
            schoolId,
          });
          break;

        case 'configuration':
          await hasiviApi.updateSchoolConfiguration({
            ...configurationForm.getValues(),
            tenantId,
            schoolId,
          });
          break;

        case 'rfid_setup':
          await hasiviApi.configureRFIDSystem({
            ...rfidForm.getValues(),
            tenantId,
            schoolId,
          });
          break;
      }
    } catch (error) {
      throw error;
    }
  };

  // ============ COMPLETION HANDLER ============
  const completeOnboarding = async () => {
    try {
      await hasiviApi.completeOnboarding({
        tenantId,
        schoolId,
        onboardingData: {
          schoolInfo: schoolInfoForm.getValues(),
          adminSetup: adminSetupForm.getValues(),
          stakeholders: stakeholderForm.getValues(),
          branding: brandingForm.getValues(),
          configuration: configurationForm.getValues(),
          rfidSetup: rfidForm.getValues(),
        },
        completedAt: new Date().toISOString(),
      });

      // Clean up local storage
      localStorage.removeItem(`hasivu_onboarding_${tenantId}`);

      // Broadcast completion
      broadcastProgress(currentStep, 'ONBOARDING_COMPLETED');

      toast.success('🎉 Onboarding completed successfully!', {
        duration: 5000,
      });

      onComplete();
    } catch (error) {
      toast.error('Failed to complete setup. Please try again.');
    }
  };

  // ============ STEP RENDERERS ============
  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8"
    >
      <div className="space-y-6">
        <div className="mx-auto w-32 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
          <Sparkles className="w-16 h-16 text-white animate-pulse" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to HASIVU!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your school's food service with India's most advanced AI-powered meal delivery
            platform. We'll get you set up in under 2 hours with zero technical complexity.
          </p>
        </div>
      </div>

      {/* Key Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center border border-blue-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">99.7% Fraud Prevention</h3>
          <p className="text-gray-600 text-sm">
            Advanced AI protects every transaction with real-time monitoring
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 text-center border border-green-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">RFID Smart Cards</h3>
          <p className="text-gray-600 text-sm">
            Instant student identification and contactless meal delivery
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-8 text-center border border-purple-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -5 }}
        >
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">6-Minute Delivery</h3>
          <p className="text-gray-600 text-sm">
            Lightning-fast meal delivery directly to classrooms
          </p>
        </motion.div>
      </div>

      {/* Success Statistics */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Trophy className="w-8 h-8 text-orange-600" />
          <h3 className="text-2xl font-bold text-gray-900">Trusted by Leading Schools</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">500+</div>
            <div className="text-sm text-gray-600">Schools Onboarded</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">2M+</div>
            <div className="text-sm text-gray-600">Students Served</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">98.5%</div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">₹2.5L</div>
            <div className="text-sm text-gray-600">Avg. Monthly Savings</div>
          </div>
        </div>
      </div>

      {/* Quick Setup Promise */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Heart className="w-8 h-8" />
          <span className="text-2xl font-bold">Our Promise</span>
        </div>
        <p className="text-lg text-center leading-relaxed">
          Complete setup in under 2 hours, or we'll handle the configuration for you personally.
          Your success is our commitment.
        </p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">30-Day Free Trial • No Setup Fees • Cancel Anytime</span>
        </div>
      </div>
    </motion.div>
  );

  const renderSchoolInfoStep = () => (
    <FormProvider {...schoolInfoForm}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-8 max-w-4xl mx-auto"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tell Us About Your School</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us understand your school's unique needs so we can customize HASIVU perfectly for
            your community
          </p>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Building className="w-6 h-6 mr-3 text-blue-600" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">School Name *</label>
              <input
                {...schoolInfoForm.register('name')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                placeholder="e.g., Delhi Public School"
              />
              {schoolInfoForm.formState.errors.name && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">School Type *</label>
              <select
                {...schoolInfoForm.register('schoolType')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              >
                <option value="private">Private School</option>
                <option value="government">Government School</option>
                <option value="aided">Government Aided</option>
                <option value="international">International School</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Total Students *
              </label>
              <input
                type="number"
                {...schoolInfoForm.register('studentCount', { valueAsNumber: true })}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., 1200"
                min="1"
                max="10000"
              />
              {schoolInfoForm.formState.errors.studentCount && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.studentCount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Established Year
              </label>
              <input
                type="number"
                {...schoolInfoForm.register('establishedYear', { valueAsNumber: true })}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., 1995"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Grade Range *</label>
              <div className="flex space-x-3">
                <select
                  {...schoolInfoForm.register('gradeRange.from')}
                  className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="nursery">Nursery</option>
                  <option value="lkg">LKG</option>
                  <option value="ukg">UKG</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </option>
                  ))}
                </select>
                <span className="self-center text-gray-500">to</span>
                <select
                  {...schoolInfoForm.register('gradeRange.to')}
                  className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Phone className="w-6 h-6 mr-3 text-green-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                School Address *
              </label>
              <textarea
                {...schoolInfoForm.register('address')}
                rows={3}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                placeholder="Enter complete school address"
              />
              {schoolInfoForm.formState.errors.address && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">City *</label>
              <input
                {...schoolInfoForm.register('city')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., Bangalore"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">State *</label>
              <select
                {...schoolInfoForm.register('state')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              >
                <option value="">Select State</option>
                <option value="KA">Karnataka</option>
                <option value="TN">Tamil Nadu</option>
                <option value="AP">Andhra Pradesh</option>
                <option value="TS">Telangana</option>
                <option value="KL">Kerala</option>
                <option value="DL">Delhi</option>
                <option value="MH">Maharashtra</option>
                <option value="GJ">Gujarat</option>
                <option value="RJ">Rajasthan</option>
                <option value="UP">Uttar Pradesh</option>
                {/* Add more states as needed */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">PIN Code *</label>
              <input
                {...schoolInfoForm.register('pinCode')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., 560001"
                maxLength={6}
              />
              {schoolInfoForm.formState.errors.pinCode && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.pinCode.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Phone Number *</label>
              <input
                type="tel"
                {...schoolInfoForm.register('phone')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., 9876543210"
                maxLength={10}
              />
              {schoolInfoForm.formState.errors.phone && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Email Address *
              </label>
              <input
                type="email"
                {...schoolInfoForm.register('email')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., admin@schoolname.edu.in"
              />
              {schoolInfoForm.formState.errors.email && (
                <p className="text-red-600 text-sm mt-2">
                  {schoolInfoForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Website (Optional)
              </label>
              <input
                type="url"
                {...schoolInfoForm.register('website')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="e.g., https://www.schoolname.edu.in"
              />
            </div>
          </div>
        </div>

        {/* Current Setup & Preferences */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-3 text-purple-600" />
            Current Setup & Preferences
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Food Service System
              </label>
              <select
                {...schoolInfoForm.register('currentSystem')}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              >
                <option value="manual">Manual/Cash Only</option>
                <option value="basic_pos">Basic POS System</option>
                <option value="school_lunch">Existing School Lunch Program</option>
                <option value="canteen">Traditional Canteen</option>
                <option value="tiffin">Tiffin Service</option>
                <option value="other">Other System</option>
                <option value="none">No Current System</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferred Languages for Communication *
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { code: 'en', name: 'English', flag: '🇬🇧' },
                  { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
                  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
                  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
                  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
                  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
                ].map(lang => (
                  <label
                    key={lang.code}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={lang.code}
                      {...schoolInfoForm.register('languages')}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-sm font-medium text-gray-700">{lang.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <input
                  type="checkbox"
                  {...schoolInfoForm.register('lunchProgram')}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Free/Subsidized Lunch Program</span>
                  <p className="text-sm text-gray-600">
                    Check if your school participates in government meal programs
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    </FormProvider>
  );

  // Return the main component JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">HASIVU Setup</h1>
                  <p className="text-sm text-gray-500">
                    Transforming school nutrition, one step at a time
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </div>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {steps[currentStep].category}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* WebSocket Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${wsConnection.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-sm text-gray-600">
                  {wsConnection.isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {steps[currentStep].estimatedTime} remaining
                </div>
                <div className="text-xs text-gray-500">
                  Last saved:{' '}
                  {new Intl.DateTimeFormat('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(progress.lastSavedAt)}
                </div>
              </div>

              {onSkip && !steps[currentStep].required && (
                <button
                  onClick={() => onSkip()}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Skip Setup
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="text-xs font-medium max-w-16 text-center leading-tight">
                    {step.title.split(' ').slice(0, 2).join(' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {steps[currentStep].id === 'welcome' && renderWelcomeStep()}
            {steps[currentStep].id === 'school_info' && renderSchoolInfoStep()}
            {steps[currentStep].id === 'admin_setup' && (
              <AdminSetupStep
                form={adminSetupForm}
                onNext={nextStep}
                onPrev={prevStep}
                isLoading={isLoading}
              />
            )}
            {steps[currentStep].id === 'stakeholder_setup' && (
              <StakeholderSetupStep
                form={stakeholderForm}
                onNext={nextStep}
                onPrev={prevStep}
                isLoading={isLoading}
                schoolInfo={schoolInfoForm.getValues()}
              />
            )}
            {steps[currentStep].id === 'branding' && (
              <BrandingStep
                form={brandingForm}
                onNext={nextStep}
                onPrev={prevStep}
                isLoading={isLoading}
              />
            )}
            {steps[currentStep].id === 'configuration' && (
              <ConfigurationStep
                form={configurationForm}
                onNext={nextStep}
                onPrev={prevStep}
                isLoading={isLoading}
                schoolInfo={{
                  studentCount: schoolInfoForm.getValues().studentCount,
                  schoolType: schoolInfoForm.getValues().schoolType,
                }}
              />
            )}
            {steps[currentStep].id === 'rfid_setup' && (
              <RFIDSetupStep
                form={rfidForm}
                onNext={nextStep}
                onPrev={prevStep}
                isLoading={isLoading}
                schoolInfo={{
                  studentCount: schoolInfoForm.getValues().studentCount,
                }}
              />
            )}
            {steps[currentStep].id === 'completion' && (
              <CompletionStep
                onComplete={onComplete}
                onboardingData={{
                  schoolInfo: {
                    name: schoolInfoForm.getValues().name,
                    studentCount: schoolInfoForm.getValues().studentCount,
                  },
                  completedSteps: Array.from(progress.completedSteps).map(i => steps[i]?.id),
                  startedAt: progress.startedAt,
                  completedAt: new Date(),
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Navigation - Hidden on completion step */}
        {steps[currentStep].id !== 'completion' && (
          <motion.div
            className="flex items-center justify-between mt-16 pt-8 border-t border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-3 px-8 py-4 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-50 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              {!steps[currentStep].required && currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  Skip for now
                </button>
              )}

              <motion.button
                onClick={nextStep}
                disabled={isLoading}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedOnboardingFlow;
