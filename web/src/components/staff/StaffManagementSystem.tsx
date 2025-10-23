'use client';

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
  Loader2,
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
    isActive: true,
  },
  {
    id: 'shift-2',
    name: 'Afternoon Shift',
    startTime: '14:00',
    endTime: '22:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    isActive: true,
  },
  {
    id: 'shift-3',
    name: 'Weekend Shift',
    startTime: '08:00',
    endTime: '16:00',
    days: ['saturday', 'sunday'],
    isActive: true,
  },
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
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
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
    location: 'Main Kitchen',
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
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
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
    location: 'Prep Area',
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
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
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
    location: 'Storage Area',
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
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
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
    location: 'Office',
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Prepare lunch menu for 200 students',
    description:
      'Coordinate with team to prepare balanced lunch menu including main course, sides, and beverages',
    assignedTo: 'staff-1',
    assignedBy: 'staff-4',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-01-15T12:00:00Z',
    estimatedHours: 4,
    actualHours: 2.5,
    category: 'Food Preparation',
    tags: ['urgent', 'lunch', 'coordination'],
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
    tags: ['inventory', 'audit', 'stock'],
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
    tags: ['cleaning', 'sanitization', 'maintenance'],
  },
];

const mockMetrics: StaffMetrics = {
  totalStaff: 12,
  activeStaff: 8,
  averageEfficiency: 89.5,
  totalHoursWorked: 2840,
  tasksCompleted: 173,
  attendanceRate: 94.7,
  turnoverRate: 8.3,
  averageSalary: 38750,
};

// Utility functions
const getStatusColor = (status: StaffMember['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'break':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'offline':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'sick':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'vacation':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTaskStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleIcon = (role: StaffMember['role']) => {
  switch (role) {
    case 'chef':
      return '👨‍🍳';
    case 'assistant':
      return '👩‍🍳';
    case 'prep':
      return '🔪';
    case 'manager':
      return '👔';
    case 'server':
      return '🍽️';
    case 'cleaner':
      return '🧹';
    default:
      return '👤';
  }
};

// Staff Member Card Component
const StaffMemberCard = ({ staff }: { staff: StaffMember }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="pt-4">
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={staff.avatar} alt={staff.name} />
              <AvatarFallback className="text-lg">
                {staff.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 text-2xl">{getRoleIcon(staff.role)}</div>
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                staff.status === 'active'
                  ? 'bg-green-500'
                  : staff.status === 'break'
                    ? 'bg-yellow-500'
                    : staff.status === 'offline'
                      ? 'bg-gray-500'
                      : staff.status === 'sick'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
              }`}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{staff.name}</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {staff.role} • {staff.department}
                </p>
                <p className="text-xs text-gray-500">{staff.employeeId}</p>
              </div>
              <Badge className={`${getStatusColor(staff.status)} border`}>{staff.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-600">Efficiency</p>
                <div className="flex items-center space-x-2">
                  <Progress value={staff.efficiency} className="h-2 flex-1" />
                  <span className="font-semibold">{staff.efficiency}%</span>
                </div>
              </div>
              <div>
                <p className="text-gray-600">Rating</p>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-semibold">{staff.performanceRating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {staff.currentTask && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Current Task</span>
            </div>
            <p className="text-sm text-blue-700">{staff.currentTask}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{staff.hoursWorked}h</div>
            <div className="text-xs text-gray-600">Hours Worked</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{staff.tasksCompleted}</div>
            <div className="text-xs text-gray-600">Tasks Done</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{staff.attendanceRate}%</div>
            <div className="text-xs text-gray-600">Attendance</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span className="flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {staff.location}
          </span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {staff.shift.name}
          </span>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-3 border-t"
          >
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {staff.email}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {staff.phone}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {staff.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-1">
                {staff.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex space-x-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsExpanded(!isExpanded)}>
            <Eye className="w-3 h-3 mr-1" />
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Task Card Component
const TaskCard = ({ task, staffMembers }: { task: Task; staffMembers: StaffMember[] }) => {
  const assignedStaff = staffMembers.find(s => s.id === task.assignedTo);
  const assignedByStaff = staffMembers.find(s => s.id === task.assignedBy);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          </div>
          <Badge className={`${getTaskStatusColor(task.status)} border ml-2`}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <p className="text-gray-600">Assigned to</p>
            <div className="flex items-center space-x-2">
              {assignedStaff?.avatar && (
                <Avatar className="w-6 h-6">
                  <AvatarImage src={assignedStaff.avatar} alt={assignedStaff.name} />
                  <AvatarFallback className="text-xs">
                    {assignedStaff.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="font-medium">{assignedStaff?.name}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600">Priority</p>
            <Badge
              className={`${
                task.priority === 'urgent'
                  ? 'bg-red-100 text-red-800'
                  : task.priority === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : task.priority === 'medium'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {task.priority}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Due: {new Date(task.dueDate).toLocaleString()}
          </span>
          <span>{task.actualHours ? `${task.actualHours}h` : `Est: ${task.estimatedHours}h`}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Staff Management System Component
export const StaffManagementSystem: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Live data
  const { data: staffData, loading: staffLoading, error: staffError } = useStaffMembers();
  const { data: metricsData, loading: metricsLoading, error: metricsError } = useStaffMetrics();

  const staff: any[] = staffData || [];
  const metrics: any = metricsData || {
    totalStaff: staff.length,
    activeStaff: staff.filter((s: any) => s.status === 'active').length,
    averageEfficiency: 0,
    totalHoursWorked: 0,
    tasksCompleted: 0,
    attendanceRate: 0,
    turnoverRate: 0,
    averageSalary: 0,
  };

  // Filter staff members
  const filteredStaff = useMemo(() => {
    return staff.filter((s: any) => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || (s.role || '').toLowerCase() === filterRole;
      const matchesStatus =
        filterStatus === 'all' || (s.status || '').toLowerCase() === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, searchTerm, filterRole, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="staff-header">
              Staff Management
            </h1>
            <p className="text-gray-600">
              Manage staff scheduling, tasks, and performance tracking
            </p>
            {(staffError || metricsError) && (
              <div className="mt-2 p-3 rounded bg-red-50 border border-red-200 text-red-800">
                Failed to load staff data.
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.totalStaff ?? '-'}</p>
                  <p className="text-gray-600">Total Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.activeStaff ?? 0}</p>
                  <p className="text-gray-600">Currently Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.averageEfficiency ?? 0}%</p>
                  <p className="text-gray-600">Avg Efficiency</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.attendanceRate ?? 0}%</p>
                  <p className="text-gray-600">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="staff">Staff Members</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Staff Members Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search staff by name, ID, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                className="px-3 py-2 border border-gray-200 rounded-md"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="chef">Chef</option>
                <option value="assistant">Assistant</option>
                <option value="prep">Prep Cook</option>
                <option value="manager">Manager</option>
                <option value="server">Server</option>
                <option value="cleaner">Cleaner</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-200 rounded-md"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="break">On Break</option>
                <option value="offline">Offline</option>
                <option value="sick">Sick</option>
                <option value="vacation">Vacation</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((s: any) => (
                <div data-testid="staff-card" key={s.id}>
                  {/* Narrow mapping to StaffMember shape where possible */}
                  <StaffMemberCard
                    staff={{
                      id: s.id,
                      employeeId: s.employeeId || s.id,
                      name: s.name || 'Staff',
                      email: s.email || '-',
                      phone: s.phone || '-',
                      role: (s.role || 'chef') as any,
                      department: (s.department || 'kitchen') as any,
                      status: (s.status || 'active') as any,
                      avatar: s.avatar,
                      hireDate: s.hireDate || new Date().toISOString(),
                      salary: s.salary || 0,
                      efficiency: s.efficiency || 0,
                      hoursWorked: s.hoursWorked || 0,
                      tasksCompleted: s.tasksCompleted || 0,
                      currentTask: s.currentTask,
                      shift: {
                        id: 'shift',
                        name: 'Shift',
                        startTime: '09:00',
                        endTime: '17:00',
                        days: [],
                        isActive: true,
                      },
                      skills: s.skills || [],
                      certifications: s.certifications || [],
                      performanceRating: s.performanceRating || 0,
                      attendanceRate: s.attendanceRate || 0,
                      lastLogin: s.lastLogin || new Date().toISOString(),
                      location: s.location || 'Kitchen',
                    }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
              <Button disabled>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
            <div className="p-3 rounded bg-gray-50 border border-gray-200 text-gray-700">
              Live tasks integration will appear here once backend endpoints are connected.
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Staff Schedule</h2>
              <Button disabled>
                <Calendar className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </div>
            <div className="p-3 rounded bg-gray-50 border border-gray-200 text-gray-700">
              Live scheduling integration will appear here once backend endpoints are connected.
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Average Efficiency</span>
                        <span className="font-semibold">{metrics.averageEfficiency ?? 0}%</span>
                      </div>
                      <Progress value={metrics.averageEfficiency ?? 0} className="h-3" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Attendance Rate</span>
                        <span className="font-semibold">{metrics.attendanceRate ?? 0}%</span>
                      </div>
                      <Progress value={metrics.attendanceRate ?? 0} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {metrics.tasksCompleted}
                        </div>
                        <div className="text-sm text-gray-600">Tasks Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {metrics.totalHoursWorked}h
                        </div>
                        <div className="text-sm text-gray-600">Total Hours</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        Rs.{(metrics.averageSalary ?? 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Average Salary</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {metrics.turnoverRate}%
                        </div>
                        <div className="text-xs text-gray-600">Turnover Rate</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">Rs.465K</div>
                        <div className="text-xs text-gray-600">Monthly Payroll</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffManagementSystem;
