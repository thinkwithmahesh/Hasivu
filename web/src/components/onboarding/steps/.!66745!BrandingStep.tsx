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
      description: 'Google's signature font',
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
              {watchedValues.customGreeting || 'Welcome to our school food service'}
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
