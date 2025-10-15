/**
 * RFID & Security Setup Step - Epic 2 Story 2
 *
 * Comprehensive RFID and security configuration including:
 * - RFID reader location configuration
 * - Card distribution strategy
 * - Security feature selection
 * - Fraud prevention settings
 * - Real-time monitoring setup
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import {
  Radio,
  Shield,
  MapPin,
  CreditCard,
  _Eye,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Fingerprint,
  Smartphone,
  QrCode,
  Wifi,
  Lock,
  Key,
  Monitor,
  Camera,
  Zap,
  UserCheck,
  _Clock,
  Signal,
  Database,
  _Settings,
  Award,
  Target,
  _TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RFIDLocation {
  name: string;
  location: string;
  type: 'entry' | 'classroom' | 'cafeteria' | 'exit';
}

interface CardDistribution {
  method: 'bulk_grade_wise' | 'individual' | 'gradual_rollout';
  timeline: string;
  backupMethod: 'qr_code' | 'mobile_app' | 'manual_entry';
}

interface SecurityFeatures {
  encryptionLevel: 'basic' | 'advanced';
  biometricBackup: boolean;
  fraudDetection: boolean;
  realTimeMonitoring: boolean;
}

interface RFIDFormData {
  enableRFID: boolean;
  readerLocations: RFIDLocation[];
  cardDistribution: CardDistribution;
  securityFeatures: SecurityFeatures;
}

interface RFIDSetupStepProps {
  form: UseFormReturn<RFIDFormData>;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
  schoolInfo?: {
    studentCount: number;
    gradeClasses?: Array<{ grade: string; studentCount: number }>;
  };
}

const RFIDSetupStep: React.FC<RFIDSetupStepProps> = ({
  form,
  _onNext,
  _onPrev,
  _isLoading = false,
  schoolInfo,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'locations' | 'distribution' | 'security'
  >('overview');
  const [securityScore, setSecurityScore] = useState<number>(85);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const {
    register,
    control,
    watch,
    setValue,
    formState: { _errors },
  } = form;
  const watchedValues = watch();

  // Field array for RFID locations
  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({
    control,
    name: 'readerLocations',
  });

  // Predefined location types
  const locationTypes = [
    {
      type: 'entry' as const,
      name: 'Main Entry',
      icon: '🚪',
      description: 'Track student arrival and departure',
      color: 'blue',
    },
    {
      type: 'classroom' as const,
      name: 'Classroom',
      icon: '📚',
      description: 'Verify student presence during meal time',
      color: 'green',
    },
    {
      type: 'cafeteria' as const,
      name: 'Cafeteria',
      icon: '🍽️',
      description: 'Meal collection and delivery verification',
      color: 'orange',
    },
    {
      type: 'exit' as const,
      name: 'Exit Points',
      icon: '🚶',
      description: 'Security and attendance tracking',
      color: 'red',
    },
  ];

  // Distribution methods
  const distributionMethods = [
    {
      method: 'bulk_grade_wise' as const,
      name: 'Grade-wise Bulk Distribution',
      description: 'Distribute cards grade by grade over multiple days',
      timeline: '1-2 weeks',
      pros: ['Systematic rollout', 'Easier training', 'Gradual adoption'],
      cons: ['Longer implementation', 'Partial coverage initially'],
      recommended: true,
    },
    {
      method: 'individual' as const,
      name: 'Individual Distribution',
      description: 'Distribute cards to individual students as needed',
      timeline: '2-4 weeks',
      pros: ['Personalized approach', 'On-demand distribution', 'Lower initial cost'],
      cons: ['Slower adoption', 'Complex tracking', 'Higher admin overhead'],
      recommended: false,
    },
    {
      method: 'gradual_rollout' as const,
      name: 'Gradual System Rollout',
      description: 'Phase-wise implementation starting with specific areas',
      timeline: '3-6 weeks',
      pros: ['Low risk', 'Learning from pilot', 'Budget-friendly'],
      cons: ['Longer full deployment', 'Mixed systems', 'Complex management'],
      recommended: false,
    },
  ];

  // Backup methods
  const backupMethods = [
    {
      method: 'qr_code' as const,
      name: 'QR Code Backup',
      description: 'Students can use printed QR codes',
      icon: <QrCode className="w-5 h-5" />,
      reliability: 95,
    },
    {
      method: 'mobile_app' as const,
      name: 'Mobile App',
      description: 'Parent/student mobile app verification',
      icon: <Smartphone className="w-5 h-5" />,
      reliability: 90,
    },
    {
      method: 'manual_entry' as const,
      name: 'Manual Entry',
      description: 'Staff manual verification as fallback',
      icon: <UserCheck className="w-5 h-5" />,
      reliability: 85,
    },
  ];

  // Generate smart defaults based on school info
  useEffect(() => {
    if (schoolInfo && locationFields.length === 0) {
      generateSmartDefaults();
    }
  }, [schoolInfo, locationFields.length]);

  const generateSmartDefaults = useCallback(() => {
    if (!schoolInfo) return;

    const { studentCount } = schoolInfo;

    // Suggest optimal reader locations based on school size
    const defaultLocations: RFIDLocation[] = [
      {
        name: 'Main Gate',
        location: 'Primary entrance/exit',
        type: 'entry',
      },
      {
        name: 'Cafeteria Counter',
        location: 'Food service area',
        type: 'cafeteria',
      },
    ];

    // Add classroom readers for larger schools
    if (studentCount > 300) {
      defaultLocations.push({
        name: 'Primary Section',
        location: 'Classes 1-5 corridor',
        type: 'classroom',
      });
      defaultLocations.push({
        name: 'Secondary Section',
        location: 'Classes 6-12 corridor',
        type: 'classroom',
      });
    }

    // Add exit points for very large schools
    if (studentCount > 800) {
      defaultLocations.push({
        name: 'Secondary Exit',
        location: 'Emergency/alternate exit',
        type: 'exit',
      });
    }

    setValue('readerLocations', defaultLocations);

    // Set smart defaults for other configurations
    setValue('cardDistribution', {
      method: studentCount > 500 ? 'bulk_grade_wise' : 'gradual_rollout',
      timeline: studentCount > 500 ? '2_weeks' : '1_week',
      backupMethod: 'qr_code',
    });

    setValue('securityFeatures', {
      encryptionLevel: 'advanced',
      biometricBackup: false,
      fraudDetection: true,
      realTimeMonitoring: true,
    });

    // Calculate estimated cost
    const readerCost = defaultLocations.length * 15000; // ₹15,000 per reader
    const cardCost = studentCount * 50; // ₹50 per card
    const setupCost = 25000; // One-time setup
    setEstimatedCost(readerCost + cardCost + setupCost);

    // Generate recommendations
    const newRecommendations = [
      `${defaultLocations.length} RFID readers recommended for ${studentCount} students`,
      studentCount > 500
        ? 'Grade-wise rollout recommended for large schools'
        : 'Gradual rollout suitable for your school size',
      'Enable fraud detection for enhanced security',
      'QR code backup provides 95% reliability',
    ];

    setRecommendations(newRecommendations);
    toast.success('RFID configuration optimized for your school!');
  }, [schoolInfo, setValue]);

  // Calculate security score
  useEffect(() => {
    let score = 60; // Base score

    if (watchedValues.securityFeatures?.encryptionLevel === 'advanced') score += 20;
    if (watchedValues.securityFeatures?.fraudDetection) score += 15;
    if (watchedValues.securityFeatures?.realTimeMonitoring) score += 15;
    if (watchedValues.securityFeatures?.biometricBackup) score += 10;
    if (locationFields.length >= 3) score += 10;

    setSecurityScore(Math.min(100, score));
  }, [watchedValues.securityFeatures, locationFields.length]);

  // Tab content renderers
  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* RFID Enable/Disable */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">RFID Smart Card System</h3>
              <p className="text-gray-600">Revolutionary contactless meal delivery verification</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register('enableRFID')} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {watchedValues.enableRFID && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Lightning Fast</h4>
                    <p className="text-sm text-gray-600">6-second meal verification</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Students simply tap their card and receive their meal instantly without any delays
                  or queues.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">99.7% Secure</h4>
                    <p className="text-sm text-gray-600">Advanced fraud prevention</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Military-grade encryption and real-time monitoring prevent unauthorized access and
                  fraud.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <Monitor className="w-8 h-8 text-purple-500" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Tracking</h4>
                    <p className="text-sm text-gray-600">Live attendance monitoring</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Parents and teachers get instant notifications when students receive their meals.
                </p>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Implementation Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{locationFields.length}</div>
                  <div className="text-sm text-gray-600">RFID Readers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{Math.round(estimatedCost / 1000)}K
                  </div>
                  <div className="text-sm text-gray-600">Setup Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{securityScore}%</div>
                  <div className="text-sm text-gray-600">Security Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {watchedValues.cardDistribution?.timeline || '2'} weeks
                  </div>
                  <div className="text-sm text-gray-600">Rollout Time</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!watchedValues.enableRFID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-900">RFID System Disabled</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  Without RFID, you'll need alternative verification methods like manual entry or QR
                  codes. This may increase delivery time and reduce security.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => setValue('enableRFID', true)}
                    className="text-sm font-medium text-yellow-700 hover:text-yellow-800"
                  >
                    Learn more about RFID benefits →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && watchedValues.enableRFID && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Smart Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-green-800">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLocationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">RFID Reader Locations</h3>
          <p className="text-sm text-gray-600">
            Configure strategic placement of RFID readers for optimal coverage
          </p>
        </div>
        <button
          onClick={() => appendLocation({ name: '', location: '', type: 'entry' })}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reader</span>
        </button>
      </div>

      {/* Location Type Guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {locationTypes.map(type => (
          <div
            key={type.type}
            className={`bg-${type.color}-50 border border-${type.color}-200 rounded-xl p-4 text-center`}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <h4 className={`font-medium text-${type.color}-900 text-sm`}>{type.name}</h4>
            <p className={`text-xs text-${type.color}-700 mt-1`}>{type.description}</p>
          </div>
        ))}
      </div>

      {/* Reader Configuration */}
      <div className="space-y-4">
        {locationFields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">RFID Reader {index + 1}</h4>
              {locationFields.length > 1 && (
                <button
                  onClick={() => removeLocation(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reader Name</label>
                <input
                  {...register(`readerLocations.${index}.name` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Main Entrance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Location
                </label>
                <input
                  {...register(`readerLocations.${index}.location` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Near security desk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reader Type</label>
                <select
                  {...register(`readerLocations.${index}.type` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {locationTypes.map(type => (
                    <option key={type.type} value={type.type}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reader Status Simulation */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <Signal className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-green-900">Signal: Strong</div>
                <div className="text-xs text-green-700">-45 dBm</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <Wifi className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-blue-900">Range: 2.5m</div>
                <div className="text-xs text-blue-700">Optimal</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <Database className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-purple-900">Status: Ready</div>
                <div className="text-xs text-purple-700">Online</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coverage Analysis */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-4">Coverage Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                (locationFields.length /
                  Math.max(1, Math.ceil((schoolInfo?.studentCount || 500) / 200))) *
                  100
              )}
              %
            </div>
            <div className="text-sm text-blue-700">Area Coverage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{locationFields.length}</div>
            <div className="text-sm text-blue-700">Active Readers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {locationFields.length > 0 ? Math.round(2.5 * locationFields.length) : 0}m
            </div>
            <div className="text-sm text-blue-700">Total Range</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{locationFields.length * 15}K</div>
            <div className="text-sm text-blue-700">Equipment Cost</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDistributionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Card Distribution Strategy</h3>
        <p className="text-sm text-gray-600">
          Choose how to distribute RFID cards to students and staff
        </p>
      </div>

      {/* Distribution Methods */}
      <div className="space-y-4">
        {distributionMethods.map(method => (
          <label
            key={method.method}
            className={`block p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
              watchedValues.cardDistribution?.method === method.method
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start space-x-4">
              <input
                type="radio"
                value={method.method}
                {...register('cardDistribution.method')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  {method.recommended && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      Recommended
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                    {method.timeline}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-green-700 text-xs mb-2">Advantages</h5>
                    <ul className="space-y-1">
                      {method.pros.map((pro, index) => (
                        <li
                          key={index}
                          className="flex items-center space-x-2 text-xs text-green-600"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-orange-700 text-xs mb-2">Considerations</h5>
                    <ul className="space-y-1">
                      {method.cons.map((con, index) => (
                        <li
                          key={index}
                          className="flex items-center space-x-2 text-xs text-orange-600"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Timeline Selection */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Implementation Timeline</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '1_week', label: '1 Week', description: 'Rush deployment' },
            { value: '2_weeks', label: '2 Weeks', description: 'Standard timeline' },
            { value: '1_month', label: '1 Month', description: 'Gradual rollout' },
            { value: '6_weeks', label: '6 Weeks', description: 'Extended pilot' },
          ].map(timeline => (
            <label
              key={timeline.value}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                value={timeline.value}
                {...register('cardDistribution.timeline')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mb-2"
              />
              <span className="font-medium text-gray-900 text-sm">{timeline.label}</span>
              <span className="text-xs text-gray-500 text-center">{timeline.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Backup Methods */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Backup Verification Method</h4>
        <div className="space-y-3">
          {backupMethods.map(backup => (
            <label
              key={backup.method}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                value={backup.method}
                {...register('cardDistribution.backupMethod')}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="text-blue-600">{backup.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{backup.name}</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">{backup.reliability}% reliable</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{backup.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Distribution Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h4 className="font-medium text-purple-900 mb-4">Distribution Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {schoolInfo?.studentCount || 0}
            </div>
            <div className="text-sm text-purple-700">Cards Needed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {watchedValues.cardDistribution?.timeline?.replace('_', ' ') || '2 weeks'}
            </div>
            <div className="text-sm text-purple-700">Timeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ₹{Math.round(((schoolInfo?.studentCount || 0) * 50) / 1000)}K
            </div>
            <div className="text-sm text-purple-700">Card Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {backupMethods.find(m => m.method === watchedValues.cardDistribution?.backupMethod)
                ?.reliability || 95}
              %
            </div>
            <div className="text-sm text-purple-700">Backup Reliability</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Security & Fraud Prevention</h3>
        <p className="text-sm text-gray-600">
          Configure advanced security features to protect your system
        </p>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-green-900">Security Score</h4>
          <div className="text-3xl font-bold text-green-600">{securityScore}%</div>
        </div>
        <div className="w-full bg-green-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${securityScore}%` }}
          />
        </div>
        <p className="text-sm text-green-700 mt-2">
          {securityScore >= 90
            ? 'Excellent security configuration'
            : securityScore >= 75
              ? 'Good security level'
              : 'Consider enabling more security features'}
        </p>
      </div>

      {/* Encryption Level */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Encryption Level</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
            <input
              type="radio"
              value="basic"
              {...register('securityFeatures.encryptionLevel')}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Lock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Basic Encryption</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                  128-bit
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Standard security for most applications</p>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
            <input
              type="radio"
              value="advanced"
              {...register('securityFeatures.encryptionLevel')}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Advanced Encryption</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  256-bit AES
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Military-grade security with RSA key exchange
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Security Features</h4>
        <div className="space-y-4">
          <label className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <input
              type="checkbox"
              {...register('securityFeatures.fraudDetection')}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">AI Fraud Detection</span>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                  +15 points
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Real-time analysis of transaction patterns to detect suspicious activity
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <input
              type="checkbox"
              {...register('securityFeatures.realTimeMonitoring')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Real-time Monitoring</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                  +15 points
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Live dashboard with instant alerts for security events
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <input
              type="checkbox"
              {...register('securityFeatures.biometricBackup')}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Fingerprint className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Biometric Backup</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  +10 points
                </span>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                  Optional
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Fingerprint verification as secondary authentication method
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Security Monitoring */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Monitoring & Alerts</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Video Integration</span>
            </div>
            <div className="pl-8 space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">CCTV sync with RFID events</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">Automatic incident recording</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Alert Preferences</span>
            </div>
            <div className="pl-8 space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="text-sm text-gray-700">Suspicious activity alerts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="text-sm text-gray-700">System status notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">Daily security reports</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Security Configuration Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {watchedValues.securityFeatures?.encryptionLevel === 'advanced' ? '256' : '128'}-bit
            </div>
            <div className="text-sm text-gray-600">Encryption</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {
                [
                  watchedValues.securityFeatures?.fraudDetection,
                  watchedValues.securityFeatures?.realTimeMonitoring,
                  watchedValues.securityFeatures?.biometricBackup,
                ].filter(Boolean).length
              }
            </div>
            <div className="text-sm text-gray-600">Active Features</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">99.7%</div>
            <div className="text-sm text-gray-600">Fraud Prevention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab navigation
  const tabs = [
    { id: 'overview', name: 'Overview', icon: Radio },
    { id: 'locations', name: 'Reader Locations', icon: MapPin },
    { id: 'distribution', name: 'Card Distribution', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Radio className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">RFID & Security Setup</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Configure your intelligent RFID system for seamless, secure meal delivery verification
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'locations' && renderLocationsTab()}
          {activeTab === 'distribution' && renderDistributionTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default RFIDSetupStep;
