/**
 * Stakeholder Setup Step - Epic 2 Story 2
 * Multi-stakeholder onboarding for Kitchen Staff, Teachers, and Parent Communication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  Users, ChefHat, GraduationCap, Home, Plus, Trash2,
  Mail, MessageSquare, Bell, Upload,
  CheckCircle2, UserPlus, FileText,
  Smartphone, Languages, Settings
} from 'lucide-react';

interface StakeholderSetupStepProps {
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const StakeholderSetupStep: React.FC<StakeholderSetupStepProps> = ({ onNext: _onNext, onPrev: _onPrev, isLoading: _isLoading }) => {
  const form = useFormContext();
  const { register, control, watch } = form;
  const [activeTab, setActiveTab] = useState<'kitchen' | 'teachers' | 'parents'>('kitchen');

  // Kitchen Staff Array Management
  const {
    fields: kitchenStaffFields,
    append: addKitchenStaff,
    remove: removeKitchenStaff
  } = useFieldArray({
    control,
    name: 'kitchenStaff'
  });

  const tabs = [
    {
      id: 'kitchen' as const,
      title: 'Kitchen Staff',
      icon: ChefHat,
      description: 'Add kitchen staff members and assign roles',
      color: 'orange'
    },
    {
      id: 'teachers' as const,
      title: 'Teachers',
      icon: GraduationCap,
      description: 'Invite teachers to the platform',
      color: 'blue'
    },
    {
      id: 'parents' as const,
      title: 'Parent Communication',
      icon: Home,
      description: 'Configure parent communication settings',
      color: 'green'
    }
  ];

  const kitchenRoles = [
    { value: 'head_chef', label: 'Head Chef', description: 'Kitchen supervisor and menu coordinator' },
    { value: 'assistant_chef', label: 'Assistant Chef', description: 'Food preparation and cooking' },
    { value: 'kitchen_assistant', label: 'Kitchen Assistant', description: 'Food prep and cleaning support' }
  ];

  const shifts = [
