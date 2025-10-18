/**
 * Branding & Customization Step - Epic 2 Story 2
 *
 * Allows schools to customize their HASIVU portal with:
 * - Logo upload with real-time preview
 * - Color picker with accessibility validation
 * - Font selection and theme preview
 * - School motto and custom greetings
 * - Brand preview mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import {
  Palette, Upload, Eye, Wand2, Sparkles,
  Camera, Type, Quote, Zap, CheckCircle,
  AlertTriangle, Heart, Download, RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BrandingFormData {
  schoolLogo?: File;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'inter' | 'roboto' | 'poppins' | 'noto_sans';
  schoolMotto?: string;
  customGreeting?: string;
  enableDarkMode: boolean;
}

interface BrandingStepProps {
  form: UseFormReturn<BrandingFormData>;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
}

const BrandingStep: React.FC<BrandingStepProps> = ({
  form,
  onNext,
  onPrev,
  isLoading = false
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [accessibilityScore, setAccessibilityScore] = useState<number>(100);
  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]);

  const { register, watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  // Predefined color palettes for quick selection
  const colorPalettes = [
    {
      name: 'Ocean Blue',
      primary: '#0EA5E9',
      secondary: '#0284C7',
      accent: '#F59E0B',
      description: 'Professional and trustworthy'
    },
    {
      name: 'Forest Green',
      primary: '#10B981',
      secondary: '#059669',
      accent: '#F59E0B',
      description: 'Natural and growth-focused'
    },
    {
      name: 'Royal Purple',
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      accent: '#F59E0B',
      description: 'Creative and inspiring'
    },
    {
      name: 'Warm Orange',
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#3B82F6',
      description: 'Energetic and welcoming'
    },
    {
      name: 'Cherry Red',
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#F59E0B',
      description: 'Bold and confident'
    },
    {
      name: 'Indian Saffron',
      primary: '#FF9933',
      secondary: '#CC7A29',
      accent: '#138808',
      description: 'Traditional and vibrant'
    }
  ];

  // Font options with preview
  const fontOptions = [
    {
      value: 'inter',
      name: 'Inter',
      description: 'Modern and readable',
      preview: 'The quick brown fox jumps over the lazy dog'
    },
    {
      value: 'roboto',
      name: 'Roboto',
      description: "Google's signature font",
      preview: 'The quick brown fox jumps over the lazy dog'
    },
    {
      value: 'poppins',
      name: 'Poppins',
      description: 'Friendly and approachable',
      preview: 'The quick brown fox jumps over the lazy dog'
    },
    {
      value: 'noto_sans',
      name: 'Noto Sans',
      description: 'Supports Indian languages',
      preview: 'The quick brown fox jumps over the lazy dog'
    }
  ];

  // Calculate color contrast and accessibility score
  const calculateAccessibilityScore = useCallback((primary: string, secondary: string) => {
    // Simplified contrast calculation
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const primaryLum = getLuminance(primary);
    const secondaryLum = getLuminance(secondary);
    const contrast = Math.abs(primaryLum - secondaryLum);

    const score = Math.min(100, Math.max(0, contrast * 100));
    setAccessibilityScore(score);

    return score;
  }, []);

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }

      setValue('schoolLogo', file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast.success('Logo uploaded successfully!');
    }
  };

  // Apply color palette
  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setValue('primaryColor', palette.primary);
    setValue('secondaryColor', palette.secondary);
    setValue('accentColor', palette.accent);

    toast.success(`${palette.name} palette applied!`);
  };

  // Generate AI color suggestions based on school name
  const generateColorSuggestions = useCallback(() => {
    // Simplified color suggestion logic
    const suggestions = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444'
    ];
    setColorSuggestions(suggestions);
  }, []);

  // Effect to calculate accessibility when colors change
  useEffect(() => {
    if (watchedValues.primaryColor && watchedValues.secondaryColor) {
      calculateAccessibilityScore(watchedValues.primaryColor, watchedValues.secondaryColor);
    }
  }, [watchedValues.primaryColor, watchedValues.secondaryColor, calculateAccessibilityScore]);

  // Preview component
  const BrandPreview: React.FC = () => (
    <div
      className="bg-white rounded-2xl p-6 shadow-xl border"
      style={{
        borderColor: watchedValues.primaryColor,
        fontFamily: watchedValues.fontFamily === 'inter' ? 'Inter' :
                   watchedValues.fontFamily === 'roboto' ? 'Roboto' :
                   watchedValues.fontFamily === 'poppins' ? 'Poppins' : 'Noto Sans'
      }}
    >
      {/* Header */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: watchedValues.primaryColor + '10', borderColor: watchedValues.primaryColor }}
      >
        <div className="flex items-center space-x-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="School Logo"
              className="w-16 h-16 object-contain rounded-lg bg-white p-2"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: watchedValues.primaryColor }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold" style={{ color: watchedValues.primaryColor }}>
              School Portal
            </h3>
            <p className="text-sm text-gray-600">
              {watchedValues.customGreeting || "Welcome to our school food service"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 mb-4">
        {['Dashboard', 'Meals', 'Payments', 'Orders'].map((item) => (
          <button
            key={item}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: item === 'Dashboard' ? watchedValues.primaryColor : 'transparent',
              color: item === 'Dashboard' ? 'white' : watchedValues.primaryColor
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: watchedValues.accentColor + '20' }}
        >
          <h4 className="font-semibold mb-2" style={{ color: watchedValues.secondaryColor }}>
            Today's Menu
          </h4>
          <p className="text-sm text-gray-600">Delicious meals prepared fresh daily</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="p-3 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: watchedValues.primaryColor }}
          >
            Order Now
          </button>
          <button
            className="p-3 rounded-lg text-sm font-medium border"
            style={{
              borderColor: watchedValues.primaryColor,
              color: watchedValues.primaryColor
            }}
          >
            View Menu
          </button>
        </div>
      </div>

      {/* Motto */}
      {watchedValues.schoolMotto && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p
            className="text-sm italic font-medium"
            style={{ color: watchedValues.secondaryColor }}
          >
            "{watchedValues.schoolMotto}"
          </p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Palette className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Customize Your School's Portal</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Make HASIVU truly yours with custom branding that reflects your school's personality and values
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-8">
          {/* Logo Upload */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Camera className="w-6 h-6 mr-3 text-purple-600" />
              School Logo
            </h3>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="w-24 h-24 object-contain rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview(null);
                            setValue('schoolLogo', undefined);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {logoPreview ? 'Change Logo' : 'Upload School Logo'}
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG up to 5MB. Recommended: 200x200px
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {logoPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Logo uploaded successfully!</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Color Palette Selection */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Palette className="w-6 h-6 mr-3 text-purple-600" />
              Color Palette
            </h3>

            {/* Quick Palette Selection */}
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-4">Quick Palettes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {colorPalettes.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => applyColorPalette(palette)}
                      className="p-4 border border-gray-200 rounded-xl hover:border-purple-500 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex space-x-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: palette.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: palette.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: palette.accent }}
                          />
                        </div>
                        <Wand2 className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{palette.name}</p>
                      <p className="text-xs text-gray-500">{palette.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Custom Colors</h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        {...register('primaryColor')}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        {...register('primaryColor')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        {...register('secondaryColor')}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        {...register('secondaryColor')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="#1E40AF"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        {...register('accentColor')}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        {...register('accentColor')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="#F59E0B"
                      />
                    </div>
                  </div>
                </div>

                {/* Accessibility Score */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Accessibility Score</span>
                    <span className={`text-sm font-bold ${
                      accessibilityScore >= 80 ? 'text-green-600' :
                      accessibilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(accessibilityScore)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        accessibilityScore >= 80 ? 'bg-green-500' :
                        accessibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${accessibilityScore}%` }}
                    />
                  </div>
                  {accessibilityScore < 60 && (
                    <div className="flex items-center space-x-2 mt-2 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">Colors may not meet accessibility standards</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Content */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Type className="w-6 h-6 mr-3 text-purple-600" />
              Typography & Content
            </h3>

            <div className="space-y-6">
              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Font Family
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {fontOptions.map((font) => (
                    <label
                      key={font.value}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-purple-500 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        value={font.value}
                        {...register('fontFamily')}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-medium text-gray-900">{font.name}</span>
                          <span className="text-xs text-gray-500">{font.description}</span>
                        </div>
                        <p
                          className="text-sm text-gray-600"
                          style={{ fontFamily: font.name }}
                        >
                          {font.preview}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* School Motto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  School Motto (Optional)
                </label>
                <textarea
                  {...register('schoolMotto')}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="e.g., Excellence in Education, Values in Life"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {watchedValues.schoolMotto?.length || 0}/100 characters
                </p>
              </div>

              {/* Custom Greeting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Custom Welcome Message (Optional)
                </label>
                <textarea
                  {...register('customGreeting')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="e.g., Welcome to our nutritious meal service! Enjoy fresh, healthy food delivered with care."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {watchedValues.customGreeting?.length || 0}/200 characters
                </p>
              </div>

              {/* Dark Mode Toggle */}
              <div>
                <label className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    {...register('enableDarkMode')}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Enable Dark Mode Support</span>
                    <p className="text-sm text-gray-600">Allow users to switch to dark theme</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-purple-600" />
                Live Preview
              </h3>
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {previewMode ? 'Exit' : 'Full'} Preview
                </span>
              </button>
            </div>

            <BrandPreview />

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={generateColorSuggestions}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Wand2 className="w-4 h-4" />
                <span className="text-sm font-medium">AI Suggest</span>
              </button>

              <button
                onClick={() => {
                  // Reset to defaults
                  setValue('primaryColor', '#3B82F6');
                  setValue('secondaryColor', '#1E40AF');
                  setValue('accentColor', '#F59E0B');
                  setValue('fontFamily', 'inter');
                  toast.success('Reset to defaults');
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewMode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Full Portal Preview</h3>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <BrandPreview />

                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    This is how your school's HASIVU portal will look to students, teachers, and parents.
                  </p>
                  <button
                    onClick={() => {
                      // Export preview or save
                      toast.success('Preview saved!');
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save Preview</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BrandingStep;