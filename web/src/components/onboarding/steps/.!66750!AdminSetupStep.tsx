/**
 * Administrator Setup Step - Epic 2 Story 2
 * Configure administrator account with role-based permissions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { _FormProvider, useFormContext } from 'react-hook-form';
import {
  UserPlus, Crown, Shield, Settings, Briefcase,
  _Mail, _Phone, User, GraduationCap, Languages,
  _Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

interface AdminSetupStepProps {
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const AdminSetupStep: React.FC<AdminSetupStepProps> = ({ _onNext, _onPrev, _isLoading }) => {
  const form = useFormContext();
  const { register, formState: { errors }, watch } = form;

  const selectedRole = watch('role');
  const experience = watch('experience');

  const roleOptions = [
    {
      value: 'principal',
      title: 'Principal',
      description: 'Full system access and administrative control',
      icon: Crown,
      color: 'purple',
      permissions: ['All Access', 'User Management', 'Financial Reports', 'System Configuration']
    },
    {
      value: 'admin',
      title: 'Administrator',
      description: 'Day-to-day operations and user management',
      icon: Shield,
      color: 'blue',
      permissions: ['User Management', 'Order Management', 'Reports', 'Student Data']
    },
    {
      value: 'food_director',
      title: 'Food Service Director',
      description: 'Kitchen operations and meal program management',
      icon: Briefcase,
      color: 'green',
      permissions: ['Kitchen Management', 'Menu Planning', 'Inventory', 'Nutrition Reports']
    }
  ];

  const languageOptions = [
