/**
 * Administrator Setup Step - Epic 2 Story 2
 * Configure administrator account with role-based permissions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { _FormProvider, useFormContext } from 'react-hook-form';
import {
  UserPlus,
  Crown,
  Shield,
  Settings,
  Briefcase,
  _Mail,
  _Phone,
  User,
  GraduationCap,
  Languages,
  _Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AdminSetupStepProps {
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const AdminSetupStep: React.FC<AdminSetupStepProps> = ({ _onNext, _onPrev, _isLoading }) => {
  const form = useFormContext();
  const {
    register,
    formState: { errors },
    watch,
  } = form;

  const selectedRole = watch('role');
  const experience = watch('experience');

  const roleOptions = [
    {
      value: 'principal',
      title: 'Principal',
      description: 'Full system access and administrative control',
      icon: Crown,
      color: 'purple',
      permissions: ['All Access', 'User Management', 'Financial Reports', 'System Configuration'],
    },
    {
      value: 'admin',
      title: 'Administrator',
      description: 'Day-to-day operations and user management',
      icon: Shield,
      color: 'blue',
      permissions: ['User Management', 'Order Management', 'Reports', 'Student Data'],
    },
    {
      value: 'food_director',
      title: 'Food Service Director',
      description: 'Kitchen operations and meal program management',
      icon: Briefcase,
      color: 'green',
      permissions: ['Kitchen Management', 'Menu Planning', 'Inventory', 'Nutrition Reports'],
    },
  ];

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Administrator Setup</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configure your administrator account with the right permissions and preferences for
          seamless school management
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <User className="w-6 h-6 mr-3 text-purple-600" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">First Name *</label>
            <input
              {...register('firstName')}
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Rajesh"
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Last Name *</label>
            <input
              {...register('lastName')}
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Kumar"
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Email Address *</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., rajesh.kumar@school.edu.in"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Mobile Number *</label>
            <input
              type="tel"
              {...register('phone')}
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 9876543210"
              maxLength={10}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Department *</label>
            <select
              {...register('department')}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            >
              <option value="">Select Department</option>
              <option value="administration">Administration</option>
              <option value="academics">Academics</option>
              <option value="food_service">Food Service</option>
              <option value="operations">Operations</option>
              <option value="finance">Finance</option>
              <option value="student_affairs">Student Affairs</option>
            </select>
            {errors.department && (
              <p className="text-red-600 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.department.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Years of Experience
            </label>
            <input
              type="number"
              {...register('experience', { valueAsNumber: true })}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              placeholder="e.g., 10"
              min="0"
              max="50"
            />
            {experience >= 0 && (
              <p className="text-sm text-gray-600 mt-2 flex items-center">
                <GraduationCap className="w-4 h-4 mr-1" />
                {experience === 0
                  ? 'New to education administration'
                  : experience < 5
                    ? 'Growing experience in education'
                    : experience < 15
                      ? 'Experienced education professional'
                      : 'Veteran education leader'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Crown className="w-6 h-6 mr-3 text-yellow-600" />
          Administrative Role
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleOptions.map(role => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.value;

            return (
              <motion.label
                key={role.value}
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `border-${role.color}-500 bg-${role.color}-50`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input type="radio" value={role.value} {...register('role')} className="sr-only" />

                <div className="text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                      isSelected ? `bg-${role.color}-500` : 'bg-gray-200'
                    }`}
                  >
                    <IconComponent
                      className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                    />
                  </div>

                  <div>
                    <h4
                      className={`font-semibold text-lg ${
                        isSelected ? `text-${role.color}-900` : 'text-gray-900'
                      }`}
                    >
                      {role.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">{role.description}</p>
                  </div>

                  <div className="space-y-2">
                    {role.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-center text-xs">
                        <CheckCircle2
                          className={`w-3 h-3 mr-1 ${
                            isSelected ? `text-${role.color}-600` : 'text-gray-400'
                          }`}
                        />
                        <span className={isSelected ? `text-${role.color}-800` : 'text-gray-600'}>
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-2 -right-2 w-6 h-6 bg-${role.color}-500 rounded-full flex items-center justify-center`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.label>
            );
          })}
        </div>

        {errors.role && (
          <p className="text-red-600 text-sm mt-4 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.role.message}
          </p>
        )}
      </div>

      {/* Language Preference */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Languages className="w-6 h-6 mr-3 text-blue-600" />
          Preferred Interface Language
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {languageOptions.map(lang => {
            const isSelected = watch('preferredLanguage') === lang.code;

            return (
              <motion.label
                key={lang.code}
                className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  value={lang.code}
                  {...register('preferredLanguage')}
                  className="sr-only"
                />

                <span className="text-3xl">{lang.flag}</span>

                <div className="flex-1">
                  <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {lang.name}
                  </span>
                </div>

                {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </motion.label>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-amber-600 mt-1" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">Security & Privacy Notice</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              Your administrator account will have access to sensitive student and school data. We
              use enterprise-grade security measures including multi-factor authentication,
              encrypted data storage, and audit logging to protect all information. You'll receive
              login credentials and security setup instructions via email after this setup is
              complete.
            </p>
          </div>
        </div>
      </div>

      {/* Permission Preview */}
      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-xl p-6"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Your Access Permissions
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleOptions
              .find(r => r.value === selectedRole)
              ?.permissions.map((permission, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">{permission}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminSetupStep;
