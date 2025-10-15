/**
 * Stakeholder Setup Step - Epic 2 Story 2
 * Multi-stakeholder onboarding for Kitchen Staff, Teachers, and Parent Communication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  Users,
  ChefHat,
  GraduationCap,
  Home,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Bell,
  Upload,
  CheckCircle2,
  UserPlus,
  FileText,
  Smartphone,
  Languages,
  Settings,
} from 'lucide-react';

interface StakeholderSetupStepProps {
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const StakeholderSetupStep: React.FC<StakeholderSetupStepProps> = ({
  onNext: _onNext,
  onPrev: _onPrev,
  isLoading: _isLoading,
}) => {
  const form = useFormContext();
  const { register, control, watch } = form;
  const [activeTab, setActiveTab] = useState<'kitchen' | 'teachers' | 'parents'>('kitchen');

  // Kitchen Staff Array Management
  const {
    fields: kitchenStaffFields,
    append: addKitchenStaff,
    remove: removeKitchenStaff,
  } = useFieldArray({
    control,
    name: 'kitchenStaff',
  });

  const tabs = [
    {
      id: 'kitchen' as const,
      title: 'Kitchen Staff',
      icon: ChefHat,
      description: 'Add kitchen staff members and assign roles',
      color: 'orange',
    },
    {
      id: 'teachers' as const,
      title: 'Teachers',
      icon: GraduationCap,
      description: 'Invite teachers to the platform',
      color: 'blue',
    },
    {
      id: 'parents' as const,
      title: 'Parent Communication',
      icon: Home,
      description: 'Configure parent communication settings',
      color: 'green',
    },
  ];

  const kitchenRoles = [
    {
      value: 'head_chef',
      label: 'Head Chef',
      description: 'Kitchen supervisor and menu coordinator',
    },
    {
      value: 'assistant_chef',
      label: 'Assistant Chef',
      description: 'Food preparation and cooking',
    },
    {
      value: 'kitchen_assistant',
      label: 'Kitchen Assistant',
      description: 'Food prep and cleaning support',
    },
  ];

  const shifts = [
    { value: 'morning', label: 'Morning (7 AM - 1 PM)', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)', icon: '☀️' },
    { value: 'both', label: 'Full Day (7 AM - 6 PM)', icon: '🕐' },
  ];

  const communicationMethods = [
    {
      value: 'sms',
      label: 'SMS',
      description: 'Text messages for quick updates',
      icon: MessageSquare,
      popular: true,
    },
    { value: 'email', label: 'Email', description: 'Detailed reports and newsletters', icon: Mail },
    {
      value: 'whatsapp',
      label: 'WhatsApp',
      description: 'Instant messaging and media sharing',
      icon: Smartphone,
      popular: true,
    },
    {
      value: 'app',
      label: 'Mobile App',
      description: 'Rich notifications and interactive features',
      icon: Bell,
      recommended: true,
    },
  ];

  const notificationTypes = [
    { id: 'meal_reminders', label: 'Meal Reminders', description: 'Daily meal order reminders' },
    {
      id: 'payment_alerts',
      label: 'Payment Alerts',
      description: 'Low balance and payment confirmations',
    },
    { id: 'menu_updates', label: 'Menu Updates', description: 'New menu items and special offers' },
    {
      id: 'health_reports',
      label: 'Nutrition Reports',
      description: 'Weekly nutrition and health insights',
    },
    {
      id: 'school_events',
      label: 'School Events',
      description: 'Food-related school events and celebrations',
    },
    {
      id: 'emergency_alerts',
      label: 'Emergency Alerts',
      description: 'Urgent food safety or allergy alerts',
    },
  ];

  const renderKitchenStaffTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Kitchen Staff Setup</h3>
          <p className="text-gray-600 mt-1">
            Add your kitchen team members and assign their roles and shifts
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            addKitchenStaff({
              name: '',
              email: '',
              phone: '',
              role: 'kitchen_assistant',
              shift: 'morning',
            })
          }
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {kitchenStaffFields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Kitchen Staff Added Yet</h4>
          <p className="text-gray-600 mb-4">Add your kitchen team members to get started</p>
          <button
            type="button"
            onClick={() =>
              addKitchenStaff({
                name: '',
                email: '',
                phone: '',
                role: 'head_chef',
                shift: 'both',
              })
            }
            className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add First Staff Member</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {kitchenStaffFields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-orange-600" />
                  Staff Member #{index + 1}
                </h4>
                {kitchenStaffFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKitchenStaff(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register(`kitchenStaff.${index}.name`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., Suresh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register(`kitchenStaff.${index}.email`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., suresh@school.edu.in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    {...register(`kitchenStaff.${index}.phone`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g., 9876543210"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    {...register(`kitchenStaff.${index}.role`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {kitchenRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {
                      kitchenRoles.find(r => r.value === watch(`kitchenStaff.${index}.role`))
                        ?.description
                    }
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Work Shift *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {shifts.map(shift => (
                      <label
                        key={shift.value}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          watch(`kitchenStaff.${index}.shift`) === shift.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          value={shift.value}
                          {...register(`kitchenStaff.${index}.shift`)}
                          className="sr-only"
                        />
                        <span className="text-xl">{shift.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{shift.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderTeachersTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Teacher Invitation</h3>
        <p className="text-gray-600 mt-1">
          Choose how you want to invite teachers to the HASIVU platform
        </p>
      </div>

      <div className="space-y-4">
        {/* Invitation Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Invitation Method *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                value: 'bulk_email',
                title: 'Bulk Email List',
                description: 'Enter email addresses separated by commas',
                icon: Mail,
                recommended: true,
              },
              {
                value: 'individual',
                title: 'Individual Invites',
                description: 'Send personalized invitations',
                icon: UserPlus,
              },
              {
                value: 'csv_upload',
                title: 'CSV Upload',
                description: 'Upload a CSV file with teacher data',
                icon: FileText,
              },
            ].map(method => {
              const isSelected = watch('teachers.inviteMethod') === method.value;
              const IconComponent = method.icon;

              return (
                <motion.label
                  key={method.value}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="radio"
                    value={method.value}
                    {...register('teachers.inviteMethod')}
                    className="sr-only"
                  />

                  <div className="text-center space-y-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                      />
                    </div>

                    <div>
                      <h4
                        className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
                      >
                        {method.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    </div>
                  </div>

                  {method.recommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </div>
                  )}

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.label>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Based on Method */}
        <AnimatePresence mode="wait">
          {watch('teachers.inviteMethod') === 'bulk_email' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Teacher Email Addresses
              </label>
              <textarea
                {...register('teachers.emailList')}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter email addresses separated by commas or new lines:&#10;teacher1@school.edu.in, teacher2@school.edu.in&#10;teacher3@school.edu.in"
              />
              <p className="text-sm text-gray-600 mt-2">
                💡 Tip: You can paste email addresses from Excel or Google Sheets
              </p>
            </motion.div>
          )}

          {watch('teachers.inviteMethod') === 'csv_upload' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Teacher Data CSV
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      {...register('teachers.csvFile')}
                      className="hidden"
                      id="teacher-csv-upload"
                    />
                    <label
                      htmlFor="teacher-csv-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Required CSV Format:</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Columns:</strong> Name, Email, Subject, Grade
                    </p>
                    <p>
                      <strong>Example:</strong> John Doe, john@school.edu.in, Mathematics, 5
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Download Sample CSV Template
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderParentsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Parent Communication Setup</h3>
        <p className="text-gray-600 mt-1">
          Configure how you'll communicate with parents about meals and payments
        </p>
      </div>

      {/* Communication Method */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
          Primary Communication Method
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communicationMethods.map(method => {
            const isSelected = watch('parents.communicationMethod') === method.value;
            const IconComponent = method.icon;

            return (
              <motion.label
                key={method.value}
                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <input
                  type="radio"
                  value={method.value}
                  {...register('parents.communicationMethod')}
                  className="sr-only"
                />

                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`}
                    />
                  </div>

                  <div className="flex-1">
                    <h5
                      className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'}`}
                    >
                      {method.label}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  </div>
                </div>

                {method.popular && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}

                {method.recommended && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}

                {isSelected && (
                  <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                )}
              </motion.label>
            );
          })}
        </div>
      </div>

      {/* Language Preferences */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Languages className="w-5 h-5 mr-2 text-blue-600" />
          Communication Languages
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
            { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
            { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
            { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
            { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
          ].map(lang => (
            <label
              key={lang.code}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                value={lang.code}
                {...register('parents.languages')}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium text-gray-700">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-purple-600" />
          Notification Types
        </h4>

        <div className="space-y-3">
          {notificationTypes.map(notification => (
            <label
              key={notification.id}
              className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                value={notification.id}
                {...register('parents.notificationPreferences')}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{notification.label}</span>
                <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-green-600" />
          Communication Preview
        </h4>

        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Primary Method:</strong>{' '}
            {communicationMethods.find(m => m.value === watch('parents.communicationMethod'))
              ?.label || 'Not selected'}
          </p>
          <p>
            <strong>Languages:</strong>{' '}
            {watch('parents.languages')?.length > 0
              ? watch('parents.languages')
                  .map(
                    (code: string) =>
                      [
                        { code: 'en', name: 'English' },
                        { code: 'hi', name: 'Hindi' },
                        { code: 'kn', name: 'Kannada' },
                        { code: 'ta', name: 'Tamil' },
                        { code: 'te', name: 'Telugu' },
                        { code: 'ml', name: 'Malayalam' },
                      ].find(l => l.code === code)?.name
                  )
                  .join(', ')
              : 'None selected'}
          </p>
          <p>
            <strong>Notifications:</strong>{' '}
            {watch('parents.notificationPreferences')?.length > 0
              ? `${watch('parents.notificationPreferences').length} types enabled`
              : 'None selected'}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Team & Stakeholder Setup</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Build your HASIVU team by adding kitchen staff, inviting teachers, and configuring parent
          communication
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:text-gray-700 focus:z-10 focus:outline-none ${
                    isActive
                      ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600`
                      : 'text-gray-500 border-b-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <IconComponent
                      className={`w-5 h-5 ${
                        isActive
                          ? `text-${tab.color}-600`
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                    <span>{tab.title}</span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isActive ? `text-${tab.color}-500` : 'text-gray-400'
                    }`}
                  >
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'kitchen' && renderKitchenStaffTab()}
            {activeTab === 'teachers' && renderTeachersTab()}
            {activeTab === 'parents' && renderParentsTab()}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-4">Setup Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600">{kitchenStaffFields.length}</div>
            <div className="text-sm text-gray-600">Kitchen Staff</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {watch('teachers.inviteMethod') ? '✓' : '−'}
            </div>
            <div className="text-sm text-gray-600">Teacher Invitation</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {watch('parents.communicationMethod') ? '✓' : '−'}
            </div>
            <div className="text-sm text-gray-600">Parent Communication</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StakeholderSetupStep;
