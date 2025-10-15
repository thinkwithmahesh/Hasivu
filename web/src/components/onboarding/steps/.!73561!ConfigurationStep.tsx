/**
 * Configuration Management Step - Epic 2 Story 2
 *
 * Comprehensive school configuration including:
 * - Grade and class section dynamic setup
 * - Meal timing configuration (breakfast, lunch, snacks)
 * - Payment methods and pricing setup
 * - Kitchen capacity and workflow configuration
 * - Smart defaults based on school size
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import {
  Settings, Users, Clock, CreditCard, ChefHat,
  Plus, Minus, Calendar, IndianRupee, Utensils,
  GraduationCap, MapPin, Zap, CheckCircle,
  AlertCircle, Calculator, TrendingUp, Award,
  Coffee, Sun, Moon, Timer, Smartphone,
  Bell, Shield, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GradeClass {
  grade: string;
  sections: string[];
  studentCount: number;
}

interface MealTiming {
  enabled: boolean;
  startTime: string;
  endTime: string;
  orderDeadline: string;
}

interface PaymentConfig {
  acceptPayments: boolean;
  paymentMethods: string[];
  minimumBalance: number;
  autoReload: boolean;
  reloadAmount: number;
  subscriptionDiscounts: boolean;
  parentAccountRequired: boolean;
}

interface KitchenSetup {
  capacity: number;
  equipmentList: string[];
  staffCount: number;
  workflowType: 'assembly_line' | 'station_based' | 'hybrid';
  hygieneCertification: boolean;
  allergenProtocols: boolean;
}

interface ConfigurationFormData {
  gradeClasses: GradeClass[];
  mealTimings: {
    breakfast: MealTiming;
    lunch: MealTiming;
    snacks: MealTiming;
  };
  paymentConfig: PaymentConfig;
  kitchenSetup: KitchenSetup;
}

interface ConfigurationStepProps {
  form: UseFormReturn<ConfigurationFormData>;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
  schoolInfo?: {
    studentCount: number;
    schoolType: string;
  };
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  form,
  onNext,
  onPrev,
  isLoading = false,
  schoolInfo
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'meals' | 'payments' | 'kitchen'>('grades');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const { register, control, watch, setValue, formState: { errors as _errors } } = form;
  const watchedValues = watch();

  // Field arrays for dynamic grade/class management
  const { fields: gradeFields, append: appendGrade, remove: removeGrade } = useFieldArray({
    control,
    name: 'gradeClasses'
  });

  const { fields: equipmentFields as _equipmentFields, append: appendEquipment as _appendEquipment, remove: removeEquipment as _removeEquipment } = useFieldArray({
    control,
    name: 'kitchenSetup.equipmentList' as any
  });

  // Predefined options
  const gradeOptions = [
    'Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
  ];

  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const paymentMethodOptions = [
    { id: 'upi', name: 'UPI', icon: '📱', description: 'PhonePe, GPay, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
    { id: 'wallet', name: 'Digital Wallet', icon: '💰', description: 'Paytm, Amazon Pay' },
    { id: 'parent_account', name: 'Parent Account', icon: '👪', description: 'Prepaid balance' },
    { id: 'cash', name: 'Cash (Backup)', icon: '💵', description: 'Emergency payments' }
  ];

  const kitchenEquipmentOptions = [
    'Commercial Oven', 'Refrigerator', 'Freezer', 'Food Processor',
    'Mixer/Grinder', 'Induction Cooktop', 'Pressure Cooker', 'Deep Fryer',
    'Food Warmer', 'Dishwasher', 'Water Purifier', 'Storage Containers',
    'Serving Counters', 'Hand Wash Stations', 'CCTV System'
  ];

  // Smart defaults based on school info
  useEffect(() => {
    if (schoolInfo && gradeFields.length === 0) {
      generateSmartDefaults();
    }
  }, [schoolInfo, gradeFields.length]);

  const generateSmartDefaults = useCallback(() => {
    if (!schoolInfo) return;

    const { studentCount, schoolType } = schoolInfo;

    // Generate default grade structure
    const defaultGrades: GradeClass[] = [];
    const avgStudentsPerGrade = Math.ceil(studentCount / 10); // Assume 10 grades on average

    // Common grade structures based on school type
    const gradeStructures = {
      government: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
      private: ['LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
      international: ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      aided: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
    };

    const grades = gradeStructures[schoolType as keyof typeof gradeStructures] || gradeStructures.private;

    grades.forEach((grade) => {
      const sectionsNeeded = Math.max(1, Math.ceil(avgStudentsPerGrade / 40)); // Max 40 students per section
      const sections = sectionOptions.slice(0, sectionsNeeded);

      defaultGrades.push({
        grade,
        sections,
        studentCount: Math.ceil(avgStudentsPerGrade)
      });
    });

    setValue('gradeClasses', defaultGrades);

    // Set smart defaults for other configurations
    setValue('kitchenSetup.capacity', Math.max(200, Math.ceil(studentCount * 0.8))); // 80% participation rate
    setValue('kitchenSetup.staffCount', Math.max(2, Math.ceil(studentCount / 200))); // 1 staff per 200 students

    // Generate recommendations
    const newRecommendations = [
      `Based on ${studentCount} students, we recommend a kitchen capacity of ${Math.ceil(studentCount * 0.8)} meals`,
      `Consider ${Math.max(2, Math.ceil(studentCount / 200))} kitchen staff members`,
      schoolType === 'government' ? 'Enable government meal program integration' : 'Focus on nutrition tracking',
      'Start with lunch service and gradually add breakfast/snacks'
    ];

    setRecommendations(newRecommendations);
    toast.success('Smart defaults applied based on your school profile!');
  }, [schoolInfo, setValue]);

  // Calculate estimated monthly cost
  useEffect(() => {
    const totalStudents = watchedValues.gradeClasses?.reduce((sum, grade) => sum + grade.studentCount, 0) || 0;
    const mealsPerDay = (watchedValues.mealTimings?.breakfast?.enabled ? 1 : 0) +
                       (watchedValues.mealTimings?.lunch?.enabled ? 1 : 0) +
                       (watchedValues.mealTimings?.snacks?.enabled ? 1 : 0);

    const avgMealCost = 35; // ₹35 per meal average
    const workingDays = 22; // Average working days per month
    const participation = 0.75; // 75% participation rate

    const monthlyRevenue = totalStudents * mealsPerDay * avgMealCost * workingDays * participation;
    setEstimatedCost(monthlyRevenue);
  }, [watchedValues.gradeClasses, watchedValues.mealTimings]);

  // Tab content renderers
  const renderGradesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Grade & Class Structure</h3>
          <p className="text-sm text-gray-600">Configure your school's grade levels and class sections</p>
        </div>
        <button
          onClick={() => appendGrade({ grade: '', sections: ['A'], studentCount: 0 })}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grade</span>
        </button>
      </div>

      <div className="space-y-4">
        {gradeFields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-50 rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Grade {index + 1}</h4>
              {gradeFields.length > 1 && (
                <button
                  onClick={() => removeGrade(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  {...register(`gradeClasses.${index}.grade` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sections
                </label>
                <div className="flex flex-wrap gap-2">
                  {sectionOptions.map((section) => (
                    <label
                      key={section}
                      className="flex items-center space-x-2 bg-white px-3 py-2 rounded border cursor-pointer hover:bg-blue-50"
                    >
                      <input
                        type="checkbox"
                        value={section}
                        {...register(`gradeClasses.${index}.sections` as const)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{section}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Students
                </label>
                <input
                  type="number"
                  {...register(`gradeClasses.${index}.studentCount` as const, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 120"
                  min="1"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">Grade Structure Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gradeFields.length}
            </div>
            <div className="text-sm text-blue-700">Total Grades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gradeFields.reduce((sum, grade) => sum + (grade.sections?.length || 0), 0)}
            </div>
            <div className="text-sm text-blue-700">Total Sections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gradeFields.reduce((sum, grade) => sum + (grade.studentCount || 0), 0)}
            </div>
            <div className="text-sm text-blue-700">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(gradeFields.reduce((sum, grade) => sum + (grade.studentCount || 0), 0) / gradeFields.length) || 0}
            </div>
            <div className="text-sm text-blue-700">Avg per Grade</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMealsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Meal Service Configuration</h3>
        <p className="text-sm text-gray-600">Set up meal timings and service schedules</p>
      </div>

      <div className="space-y-6">
        {/* Breakfast */}
        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Coffee className="w-6 h-6 text-yellow-600" />
              <div>
                <h4 className="font-medium text-gray-900">Breakfast Service</h4>
                <p className="text-sm text-gray-600">Morning meal service for early arrivals</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('mealTimings.breakfast.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
            </label>
          </div>

          {watchedValues.mealTimings?.breakfast?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  {...register('mealTimings.breakfast.startTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  {...register('mealTimings.breakfast.endTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Deadline</label>
                <input
                  type="time"
                  {...register('mealTimings.breakfast.orderDeadline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Lunch */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Sun className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Lunch Service</h4>
                <p className="text-sm text-gray-600">Main meal service during lunch break</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('mealTimings.lunch.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {watchedValues.mealTimings?.lunch?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  {...register('mealTimings.lunch.startTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  {...register('mealTimings.lunch.endTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Deadline</label>
                <input
                  type="time"
                  {...register('mealTimings.lunch.orderDeadline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Snacks */}
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Moon className="w-6 h-6 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Evening Snacks</h4>
                <p className="text-sm text-gray-600">Light snacks for after-school activities</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('mealTimings.snacks.enabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {watchedValues.mealTimings?.snacks?.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  {...register('mealTimings.snacks.startTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  {...register('mealTimings.snacks.endTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Deadline</label>
                <input
                  type="time"
                  {...register('mealTimings.snacks.orderDeadline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Meal Service Summary */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">Meal Service Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(watchedValues.mealTimings?.breakfast?.enabled ? 1 : 0) +
               (watchedValues.mealTimings?.lunch?.enabled ? 1 : 0) +
               (watchedValues.mealTimings?.snacks?.enabled ? 1 : 0)}
            </div>
            <div className="text-sm text-blue-700">Active Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ₹{Math.round(estimatedCost / 1000)}K
            </div>
            <div className="text-sm text-blue-700">Est. Monthly Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {gradeFields.reduce((sum, grade) => sum + (grade.studentCount || 0), 0)}
            </div>
            <div className="text-sm text-blue-700">Potential Customers</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
        <p className="text-sm text-gray-600">Configure payment methods and pricing policies</p>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Accepted Payment Methods</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {paymentMethodOptions.map((method) => (
            <label
              key={method.id}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:border-blue-500 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                value={method.id}
                {...register('paymentConfig.paymentMethods')}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl">{method.icon}</span>
                  <span className="font-medium text-gray-900">{method.name}</span>
                </div>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Policies */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Payment Policies</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
