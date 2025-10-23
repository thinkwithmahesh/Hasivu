import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  Star,
  Sparkles,
} from 'lucide-react';
import { hasiviApi } from '../services/api/hasivu-api.service';
import { toast } from 'react-hot-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
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
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const renderWelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to HASIVU!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We're excited to help you transform your school's food service with our AI-powered
          delivery platform. This quick setup will get you running in under 30 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">99.7% Fraud Prevention</h3>
          <p className="text-sm text-gray-600">Advanced AI protects every transaction</p>
        </div>

        <div className="bg-green-50 rounded-lg p-6 text-center">
          <Radio className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">RFID Verification</h3>
          <p className="text-sm text-gray-600">Instant student identification and delivery</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">8-Minute Average</h3>
          <p className="text-sm text-gray-600">Lightning-fast delivery times</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <Star className="w-5 h-5 text-yellow-600" />
          <div className="text-left">
            <p className="font-medium text-gray-900">30-Day Free Trial</p>
            <p className="text-sm text-gray-600">
              Full access to all features, no commitment required
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSchoolInfoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <Building className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
        <p className="text-gray-600">Help us understand your school's needs and current setup</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
          <input
            type="text"
            value={schoolInfo.name}
            onChange={e => setSchoolInfo(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123 Education Street"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            value={schoolInfo.city}
            onChange={e => setSchoolInfo(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Springfield"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            value={schoolInfo.state}
            onChange={e => setSchoolInfo(prev => ({ ...prev, state: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Free/Reduced Lunch Program</span>
          </label>
        </div>
      </div>
    </motion.div>
  );

  const renderCompletionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Setup Complete!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Congratulations! Your HASIVU system is now configured and ready to revolutionize your
          school's food service delivery.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">RFID Cards Ordered</p>
              <p className="text-sm text-gray-600">
                Your RFID cards will arrive within 3-5 business days
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Training Session Scheduled</p>
              <p className="text-sm text-gray-600">
                Our team will contact you to schedule staff training
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Dashboard Access Ready</p>
              <p className="text-sm text-gray-600">
                Start exploring your admin dashboard immediately
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
        <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>View Dashboard</span>
        </button>

        <button className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Download Guide</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">HASIVU Setup</h1>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {steps[currentStep].id === 'welcome' && renderWelcomeStep()}
          {steps[currentStep].id === 'school_info' && renderSchoolInfoStep()}
          {steps[currentStep].id === 'completion' && renderCompletionStep()}

          {/* Add other step renderers as needed */}
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
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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
