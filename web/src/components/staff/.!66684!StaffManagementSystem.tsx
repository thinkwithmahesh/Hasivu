"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  UserPlus,
  UserMinus,
  Target,
  Zap,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

// API hooks
import { useStaffMembers, useStaffMetrics } from '@/hooks/useApiIntegration';

// TypeScript interfaces for Staff Management
interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'chef' | 'assistant' | 'prep' | 'manager' | 'server' | 'cleaner';
  department: 'kitchen' | 'service' | 'management' | 'maintenance';
  status: 'active' | 'break' | 'offline' | 'sick' | 'vacation';
  avatar?: string;
  hireDate: string;
  salary: number;
  efficiency: number;
  hoursWorked: number;
  tasksCompleted: number;
  currentTask?: string;
  shift: Shift;
  skills: string[];
  certifications: string[];
  performanceRating: number;
  attendanceRate: number;
  lastLogin: string;
  location: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
  isActive: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  estimatedHours: number;
  actualHours?: number;
  category: string;
  tags: string[];
}

interface Schedule {
  id: string;
  staffId: string;
  date: string;
  shiftId: string;
  status: 'scheduled' | 'confirmed' | 'absent' | 'sick';
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  notes?: string;
}

interface StaffMetrics {
  totalStaff: number;
  activeStaff: number;
  averageEfficiency: number;
  totalHoursWorked: number;
  tasksCompleted: number;
  attendanceRate: number;
  turnoverRate: number;
  averageSalary: number;
}

// Mock data for staff management
const mockShifts: Shift[] = [
  {
    id: 'shift-1',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true
  },
  {
    id: 'shift-2',
    name: 'Afternoon Shift',
    startTime: '14:00',
    endTime: '22:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true
  },
  {
    id: 'shift-3',
    name: 'Weekend Shift',
    startTime: '08:00',
    endTime: '16:00',
    days: ['saturday', 'sunday'],
    isActive: true
  }
];

const mockStaffMembers: StaffMember[] = [
  {
    id: 'staff-1',
    employeeId: 'EMP001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@hasivu.com',
    phone: '+91-9876543210',
    role: 'chef',
    department: 'kitchen',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    hireDate: '2023-01-15',
    salary: 45000,
    efficiency: 92,
    hoursWorked: 160,
    tasksCompleted: 48,
    currentTask: 'Preparing lunch orders',
    shift: mockShifts[0],
    skills: ['Indian Cuisine', 'Grilling', 'Food Safety', 'Team Leadership'],
    certifications: ['Food Safety Certificate', 'Culinary Arts Diploma'],
    performanceRating: 4.8,
    attendanceRate: 96,
    lastLogin: '2024-01-15T08:30:00Z',
    location: 'Main Kitchen'
  },
  {
    id: 'staff-2',
    employeeId: 'EMP002',
    name: 'Sunita Devi',
    email: 'sunita.devi@hasivu.com',
    phone: '+91-9876543211',
    role: 'assistant',
    department: 'kitchen',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    hireDate: '2023-03-20',
    salary: 28000,
    efficiency: 88,
    hoursWorked: 168,
    tasksCompleted: 62,
    currentTask: 'Cleaning prep station',
    shift: mockShifts[0],
    skills: ['Food Prep', 'Cleaning', 'Inventory Management'],
    certifications: ['Hygiene Certificate'],
    performanceRating: 4.5,
    attendanceRate: 94,
    lastLogin: '2024-01-15T07:45:00Z',
    location: 'Prep Area'
  },
  {
    id: 'staff-3',
    employeeId: 'EMP003',
    name: 'Mohammed Ali',
    email: 'mohammed.ali@hasivu.com',
    phone: '+91-9876543212',
    role: 'prep',
    department: 'kitchen',
    status: 'break',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    hireDate: '2023-06-10',
    salary: 25000,
    efficiency: 85,
    hoursWorked: 120,
    tasksCompleted: 35,
    shift: mockShifts[1],
    skills: ['Vegetable Prep', 'Meat Processing', 'Stock Management'],
    certifications: ['Food Handler Certificate'],
    performanceRating: 4.2,
    attendanceRate: 91,
    lastLogin: '2024-01-15T14:15:00Z',
    location: 'Storage Area'
  },
  {
    id: 'staff-4',
    employeeId: 'EMP004',
    name: 'Priya Sharma',
    email: 'priya.sharma@hasivu.com',
    phone: '+91-9876543213',
    role: 'manager',
    department: 'management',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    hireDate: '2022-09-01',
    salary: 65000,
    efficiency: 95,
    hoursWorked: 180,
    tasksCompleted: 28,
    currentTask: 'Monthly performance review',
    shift: mockShifts[0],
    skills: ['Team Management', 'Operations', 'Analytics', 'Training'],
    certifications: ['Management Certificate', 'HR Certification'],
    performanceRating: 4.9,
    attendanceRate: 98,
    lastLogin: '2024-01-15T09:00:00Z',
    location: 'Office'
  }
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Prepare lunch menu for 200 students',
    description: 'Coordinate with team to prepare balanced lunch menu including main course, sides, and beverages',
    assignedTo: 'staff-1',
    assignedBy: 'staff-4',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-01-15T12:00:00Z',
    estimatedHours: 4,
    actualHours: 2.5,
    category: 'Food Preparation',
    tags: ['urgent', 'lunch', 'coordination']
  },
  {
    id: 'task-2',
    title: 'Inventory check for dry goods',
    description: 'Complete inventory audit for all dry goods and update stock levels in system',
    assignedTo: 'staff-2',
    assignedBy: 'staff-4',
    priority: 'medium',
    status: 'completed',
    dueDate: '2024-01-15T10:00:00Z',
    estimatedHours: 2,
    actualHours: 1.8,
    category: 'Inventory',
    tags: ['inventory', 'audit', 'stock']
  },
  {
    id: 'task-3',
    title: 'Deep clean prep area',
    description: 'Thorough cleaning and sanitization of all prep surfaces and equipment',
    assignedTo: 'staff-3',
    assignedBy: 'staff-1',
    priority: 'medium',
    status: 'pending',
    dueDate: '2024-01-15T16:00:00Z',
    estimatedHours: 3,
    category: 'Cleaning',
    tags: ['cleaning', 'sanitization', 'maintenance']
  }
];

const mockMetrics: StaffMetrics = {
  totalStaff: 12,
  activeStaff: 8,
  averageEfficiency: 89.5,
  totalHoursWorked: 2840,
  tasksCompleted: 173,
  attendanceRate: 94.7,
  turnoverRate: 8.3,
  averageSalary: 38750
};

// Utility functions
const getStatusColor = (status: StaffMember['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'sick': return 'bg-red-100 text-red-800 border-red-200';
    case 'vacation': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTaskStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleIcon = (role: StaffMember['role']) => {
  switch (role) {
