import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Aarav, Rajan, Benny, GroupScene } from '@/components/characters/HasivuFriend';
import {
  ArrowRight,
  ArrowLeft,
  Building,
  Users,
  CreditCard,
  Radio,
  Settings,
  Shield,
  Clock,
  CheckCircle,
  Loader2,
  Download,
  Star,
  Sparkles,
} from 'lucide-react';
import { hasiviApi } from '../services/api/hasivu-api.service';
import { toast } from 'react-hot-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  estimatedTime: string;
}

interface SchoolInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  studentCount: number;
  lunchProgram: boolean;
  currentSystem: string;
}

interface UserSetup {
  firstName: string;
  lastName: string;
  role: 'admin' | 'food_director' | 'staff';
  email: string;
  phone: string;
  department: string;
}

interface PaymentConfig {
  acceptPayments: boolean;
  paymentMethods: string[];
  minimumBalance: number;
  autoReload: boolean;
  reloadAmount: number;
}

interface RFIDSetup {
  enableRFID: boolean;
  readerCount: number;
  cardQuantity: number;
  locations: string[];
  distributionMethod: 'bulk' | 'individual' | 'gradual';
}

const OnboardingFlow: React.FC<{ onComplete: () => void; onSkip?: () => void }> = ({
  onComplete,
  onSkip,
}) => {
  const shouldReduce = useReducedMotion();
  const [slideDirection, setSlideDirection] = useState(1);
  const [completionSceneAnim, setCompletionSceneAnim] = useState<'celebrate' | 'breathe'>(
    'celebrate'
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    studentCount: 0,
    lunchProgram: true,
    currentSystem: 'manual',
  });

  const [userSetup, setUserSetup] = useState<UserSetup>({
    firstName: '',
    lastName: '',
    role: 'admin',
    email: '',
    phone: '',
    department: '',
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    acceptPayments: true,
    paymentMethods: ['card', 'parent_account'],
    minimumBalance: 5,
    autoReload: false,
    reloadAmount: 25,
  });

  const [rfidSetup, setRFIDSetup] = useState<RFIDSetup>({
    enableRFID: true,
    readerCount: 3,
    cardQuantity: 0,
    locations: [],
    distributionMethod: 'gradual',
  });

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to HASIVU',
      description: "Let's get your school set up with our AI-powered food delivery system",
      icon: Sparkles,
      required: true,
      estimatedTime: '2 min',
    },
    {
      id: 'school_info',
      title: 'School Information',
      description: 'Tell us about your school and current setup',
      icon: Building,
      required: true,
      estimatedTime: '5 min',
    },
    {
      id: 'user_setup',
      title: 'Administrator Setup',
      description: 'Set up your administrator account and permissions',
      icon: Users,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 'payment_config',
      title: 'Payment Configuration',
      description: 'Configure payment methods and account settings',
      icon: CreditCard,
      required: true,
      estimatedTime: '4 min',
    },
    {
      id: 'rfid_setup',
      title: 'RFID System Setup',
      description: 'Configure RFID cards and reader locations',
      icon: Radio,
      required: true,
      estimatedTime: '6 min',
    },
    {
      id: 'integration',
      title: 'System Integration',
      description: 'Connect with existing systems and import data',
      icon: Settings,
      required: false,
      estimatedTime: '8 min',
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      description: 'Set up security policies and compliance settings',
      icon: Shield,
      required: true,
      estimatedTime: '5 min',
    },
    {
      id: 'completion',
      title: 'Setup Complete',
      description: 'Your HASIVU system is ready to go!',
      icon: CheckCircle,
      required: true,
      estimatedTime: '2 min',
    },
  ];

  // Auto-save progress
  useEffect(() => {
    const saveProgress = () => {
      localStorage.setItem(
        'hasivu_onboarding_progress',
        JSON.stringify({
          currentStep,
          schoolInfo,
          userSetup,
          paymentConfig,
          rfidSetup,
          completedSteps: Array.from(completedSteps),
        })
      );
    };

    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [currentStep, schoolInfo, userSetup, paymentConfig, rfidSetup, completedSteps]);

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('hasivu_onboarding_progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setCurrentStep(progress.currentStep || 0);
        setSchoolInfo(progress.schoolInfo || schoolInfo);
        setUserSetup(progress.userSetup || userSetup);
        setPaymentConfig(progress.paymentConfig || paymentConfig);
        setRFIDSetup(progress.rfidSetup || rfidSetup);
        setCompletedSteps(new Set(progress.completedSteps || []));
      } catch (error) {
        // Error handled silently
      }
    }
  }, []);

  useEffect(() => {
    if (steps[currentStep]?.id !== 'completion' || shouldReduce) return;
    setCompletionSceneAnim('celebrate');
    const t = window.setTimeout(() => setCompletionSceneAnim('breathe'), 600);
    return () => window.clearTimeout(t);
  }, [currentStep, shouldReduce, steps]);

  const stepSlideVariants = useMemo(
    () => ({
      enter: (d: number) => ({
        x: shouldReduce ? 0 : d * 40,
        opacity: shouldReduce ? 1 : 0,
      }),
      center: {
        x: 0,
        opacity: 1,
        transition: shouldReduce
          ? { duration: 0.001 }
          : { duration: 0.3, ease: [0.25, 1, 0.5, 1] as const },
      },
      exit: (d: number) => ({
        x: shouldReduce ? 0 : d * -40,
        opacity: shouldReduce ? 1 : 0,
        transition: shouldReduce ? { duration: 0.001 } : { duration: 0.2, ease: 'easeIn' as const },
      }),
    }),
    [shouldReduce]
  );

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (steps[stepIndex].id) {
      case 'school_info':
        if (!schoolInfo.name.trim()) newErrors.schoolName = 'School name is required';
        if (!schoolInfo.email.trim()) newErrors.schoolEmail = 'School email is required';
        if (!schoolInfo.phone.trim()) newErrors.schoolPhone = 'School phone is required';
        if (schoolInfo.studentCount <= 0)
          newErrors.studentCount = 'Student count must be greater than 0';
        break;

      case 'user_setup':
        if (!userSetup.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!userSetup.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!userSetup.email.trim()) newErrors.userEmail = 'Email is required';
        break;

      case 'rfid_setup':
        if (rfidSetup.enableRFID) {
          if (rfidSetup.readerCount <= 0) newErrors.readerCount = 'At least 1 reader required';
          if (rfidSetup.locations.length === 0)
            newErrors.locations = 'At least 1 location required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);

    try {
      // Save current step data to backend
      await saveStepData(currentStep);

      setCompletedSteps(prev => new Set([...prev, currentStep]));

      if (currentStep < steps.length - 1) {
        setSlideDirection(1);
        setCurrentStep(currentStep + 1);
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
      setSlideDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const saveStepData = async (stepIndex: number) => {
    const stepId = steps[stepIndex].id;

    switch (stepId) {
      case 'school_info':
        await hasiviApi.updateSchoolInfo(schoolInfo);
        break;
      case 'user_setup':
        await hasiviApi.updateUserProfile(userSetup);
        break;
      case 'payment_config':
        await hasiviApi.updateSchoolConfiguration(paymentConfig);
        break;
      case 'rfid_setup':
        await hasiviApi.configureRFIDSystem(rfidSetup);
        break;
    }
  };

  const completeOnboarding = async () => {
    try {
      await hasiviApi.completeOnboarding({
        schoolInfo,
        userSetup,
        paymentConfig,
        rfidSetup,
      });

      localStorage.removeItem('hasivu_onboarding_progress');
      toast.success('Onboarding completed successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to complete setup. Please try again.');
    }
  };

  const skipStep = () => {
    if (!steps[currentStep].required) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < steps.length - 1) {
        setSlideDirection(1);
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="mx-auto" aria-hidden="true">
          <Aarav size={96} animation="breathe" respectReducedMotion />
        </div>
        <h2 className="text-3xl font-display font-bold text-hasivu-text-primary">
          Welcome to HASIVU!
        </h2>
        <p className="text-lg text-hasivu-text-secondary max-w-2xl mx-auto">
          We're excited to help you transform your school's food service with our AI-powered
          delivery platform. This quick setup will get you running in under 30 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-hasivu-primary/5 rounded-2xl p-6 text-center">
          <Shield className="w-8 h-8 text-hasivu-primary mx-auto mb-3" />
          <h3 className="font-semibold text-hasivu-text-primary mb-2">99.7% Fraud Prevention</h3>
          <p className="text-sm text-hasivu-text-secondary">
            Advanced AI protects every transaction
          </p>
        </div>

        <div className="bg-hasivu-success/5 rounded-2xl p-6 text-center">
          <Radio className="w-8 h-8 text-hasivu-success mx-auto mb-3" />
          <h3 className="font-semibold text-hasivu-text-primary mb-2">RFID Verification</h3>
          <p className="text-sm text-hasivu-text-secondary">
            Instant student identification and delivery
          </p>
        </div>

        <div className="bg-hasivu-accent/10 rounded-2xl p-6 text-center">
          <Clock className="w-8 h-8 text-hasivu-primary mx-auto mb-3" />
          <h3 className="font-semibold text-hasivu-text-primary mb-2">8-Minute Average</h3>
          <p className="text-sm text-hasivu-text-secondary">Lightning-fast delivery times</p>
        </div>
      </div>

      <div className="bg-hasivu-warning/10 border border-hasivu-warning/30 rounded-2xl p-4 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <Star className="w-5 h-5 text-hasivu-warning" />
          <div className="text-left">
            <p className="font-medium text-hasivu-text-primary">30-Day Free Trial</p>
            <p className="text-sm text-hasivu-text-secondary">
              Full access to all features, no commitment required
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchoolInfoStep = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4" aria-hidden="true">
          <Rajan size={48} animation="breathe" respectReducedMotion />
        </div>
        <h2 className="text-2xl font-display font-bold text-hasivu-text-primary">
          School Information
        </h2>
        <p className="text-hasivu-text-secondary">
          Help us understand your school's needs and current setup
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
          <input
            type="text"
            value={schoolInfo.name}
            onChange={e => setSchoolInfo(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent ${
              errors.schoolName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Lincoln High School"
          />
          {errors.schoolName && <p className="text-sm text-red-600 mt-1">{errors.schoolName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student Count *</label>
          <input
            type="number"
            value={schoolInfo.studentCount || ''}
            onChange={e =>
              setSchoolInfo(prev => ({ ...prev, studentCount: parseInt(e.target.value) || 0 }))
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent ${
              errors.studentCount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1200"
          />
          {errors.studentCount && (
            <p className="text-sm text-red-600 mt-1">{errors.studentCount}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            value={schoolInfo.address}
            onChange={e => setSchoolInfo(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent"
            placeholder="123 Education Street"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={schoolInfo.city}
            onChange={e => setSchoolInfo(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent"
            placeholder="Springfield"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            value={schoolInfo.state}
            onChange={e => setSchoolInfo(prev => ({ ...prev, state: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent"
          >
            <option value="">Select State</option>
            <option value="CA">California</option>
            <option value="TX">Texas</option>
            <option value="NY">New York</option>
            <option value="FL">Florida</option>
            {/* Add more states */}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={schoolInfo.phone}
            onChange={e => setSchoolInfo(prev => ({ ...prev, phone: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent ${
              errors.schoolPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(555) 123-4567"
          />
          {errors.schoolPhone && <p className="text-sm text-red-600 mt-1">{errors.schoolPhone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={schoolInfo.email}
            onChange={e => setSchoolInfo(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent ${
              errors.schoolEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="admin@lincolnhigh.edu"
          />
          {errors.schoolEmail && <p className="text-sm text-red-600 mt-1">{errors.schoolEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current System</label>
          <select
            value={schoolInfo.currentSystem}
            onChange={e => setSchoolInfo(prev => ({ ...prev, currentSystem: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--hasivu-primary)] focus:border-transparent"
          >
            <option value="manual">Manual/Cash Only</option>
            <option value="basic_pos">Basic POS System</option>
            <option value="school_lunch">School Lunch Program</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={schoolInfo.lunchProgram}
              onChange={e => setSchoolInfo(prev => ({ ...prev, lunchProgram: e.target.checked }))}
              className="w-4 h-4 text-[var(--hasivu-primary)] border-gray-300 rounded focus:ring-[var(--hasivu-primary)]"
            />
            <span className="text-sm text-gray-700">Free/Reduced Lunch Program</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderCompletionStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="mx-auto" aria-hidden="true">
          {shouldReduce ? (
            <Image
              src="/characters/group-scene.svg"
              alt=""
              width={96}
              height={96}
              className="object-contain mx-auto"
            />
          ) : (
            <GroupScene size={96} animation={completionSceneAnim} respectReducedMotion={false} />
          )}
        </div>
        <p className="text-2xl font-display font-bold text-hasivu-text-primary max-w-2xl mx-auto leading-snug">
          You&apos;re all set!{' '}
          {userSetup.firstName
            ? `${userSetup.firstName}'s meals are ready to order.`
            : schoolInfo.name
              ? `${schoolInfo.name}'s meals are ready to order.`
              : 'Meals are ready to order.'}
        </p>
      </div>

      <div className="bg-hasivu-success/5 border border-hasivu-success/20 rounded-2xl p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-hasivu-text-primary mb-4">What happens next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-hasivu-success mt-0.5" />
            <div>
              <p className="font-medium text-hasivu-text-primary">RFID Cards Ordered</p>
              <p className="text-sm text-hasivu-text-secondary">
                Your RFID cards will arrive within 3-5 business days
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-hasivu-success mt-0.5" />
            <div>
              <p className="font-medium text-hasivu-text-primary">Training Session Scheduled</p>
              <p className="text-sm text-hasivu-text-secondary">
                Our team will contact you to schedule staff training
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-hasivu-success mt-0.5" />
            <div>
              <p className="font-medium text-hasivu-text-primary">Dashboard Access Ready</p>
              <p className="text-sm text-hasivu-text-secondary">
                Start exploring your admin dashboard immediately
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
        <Link
          href="/menu"
          className="flex-1 bg-hasivu-primary text-white px-6 py-3 rounded-xl hover:bg-hasivu-primary/90 transition-colors flex items-center justify-center space-x-2 text-center font-medium"
        >
          Browse Today&apos;s Menu
        </Link>

        <button
          type="button"
          className="flex-1 bg-hasivu-success text-white px-6 py-3 rounded-xl hover:bg-hasivu-success/90 transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download Guide</span>
        </button>
      </div>
    </div>
  );

  const renderStepBody = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'school_info':
        return renderSchoolInfoStep();
      case 'completion':
        return renderCompletionStep();
      default:
        return (
          <div className="text-center py-12 max-w-lg mx-auto text-hasivu-text-secondary">
            <p className="font-display text-xl text-hasivu-text-primary mb-2">
              {steps[currentStep].title}
            </p>
            <p className="text-sm">Use Continue to save this step and proceed.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-hasivu-bg-warm">
      {/* Progress Header */}
      <div className="bg-hasivu-surface shadow-warm-sm border-b border-hasivu-primary/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-display font-semibold text-hasivu-text-primary">
                HASIVU Setup
              </h1>
              <span className="text-sm text-hasivu-text-secondary">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-hasivu-text-secondary">
                {steps[currentStep].estimatedTime} remaining
              </span>
              {onSkip && !steps[currentStep].required && (
                <button
                  onClick={() => onSkip()}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Skip Setup
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-hasivu-primary/10 rounded-full h-2">
            <div
              className={`bg-hasivu-primary h-2 rounded-full ${
                shouldReduce ? '' : 'transition-all duration-300'
              }`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-center gap-2 mt-3" aria-hidden="true">
            {steps.map((_, i) => (
              <motion.span
                key={i}
                className={`h-2.5 rounded-full ${
                  i === currentStep ? 'bg-hasivu-primary' : 'bg-hasivu-primary/30'
                }`}
                initial={false}
                animate={{
                  scale: i === currentStep ? (shouldReduce ? 1 : 1.3) : 1,
                  width: i === currentStep ? 22 : 10,
                }}
                transition={
                  shouldReduce
                    ? { duration: 0.001 }
                    : { type: 'spring', stiffness: 300, damping: 25 }
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
          <motion.div
            key={steps[currentStep].id}
            custom={slideDirection}
            variants={stepSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {renderStepBody()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            {!steps[currentStep].required && currentStep > 0 && (
              <button onClick={skipStep} className="px-6 py-3 text-gray-600 hover:text-gray-800">
                Skip for now
              </button>
            )}

            <button
              onClick={nextStep}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-hasivu-primary text-white rounded-xl hover:bg-hasivu-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className={`w-4 h-4 ${shouldReduce ? '' : 'animate-spin'}`} />
              ) : (
                <>
                  <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
