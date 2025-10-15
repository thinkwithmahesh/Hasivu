/**
 * HASIVU Platform - Enhanced Parent Dashboard for RFID Tracking
 * Real-time delivery tracking and RFID scan history
 * Story 2.4: Parent Mobile Integration
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, isToday, isYesterday, _subDays, _startOfDay, _endOfDay } from 'date-fns';
import {
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  _UserIcon,
  BellIcon,
  _CameraIcon,
  ChartBarIcon,
  CalendarIcon,
  _ArrowDownIcon,
  ExclamationTriangleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, BellIcon as BellSolid } from '@heroicons/react/24/solid';

// Components and hooks
import { useAuth } from '../../contexts/auth-context';
import { useRealTimeNotifications } from '../../hooks/use-realtime-notifications';
import { usePushNotifications } from '../../services/push-notifications.service';
import DeliveryTracking from './DeliveryTracking';
import { api } from '../../lib/api-client';

/**
 * Student data interface
 */
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  schoolName: string;
  cardNumber?: string;
  cardStatus: 'active' | 'inactive' | 'expired' | 'not_issued';
  lastDelivery?: {
    date: Date;
    location: string;
    orderId: string;
  };
}

/**
 * Dashboard statistics interface
 */
interface DashboardStats {
  totalDeliveries: number;
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  successRate: number;
  averageDeliveryTime: string;
  lastDeliveryTime?: Date;
  upcomingOrders: number;
}

/**
 * Recent activity interface
 */
interface RecentActivity {
  id: string;
  type: 'delivery' | 'order' | 'notification' | 'photo';
  title: string;
  description: string;
  timestamp: Date;
  studentId: string;
  studentName: string;
  status: 'success' | 'pending' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Notification settings interface
 */
interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  deliveryPhotos: boolean;
  dailySummary: boolean;
  orderReminders: boolean;
}

/**
 * Props for the ParentDashboard component
 */
interface ParentDashboardProps {
  className?: string;
}

/**
 * Enhanced Parent Dashboard Component
 */
export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  className = ''
}) => {
  const { user, _hasPermission } = useAuth();
  const { isConnected, lastMessage } = useRealTimeNotifications();
  const { isSupported, permission, isRegistered, requestPermission } = usePushNotifications();

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalDeliveries: 0,
    todayDeliveries: 0,
    weekDeliveries: 0,
    monthDeliveries: 0,
    successRate: 0,
    averageDeliveryTime: '0 min',
    upcomingOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
    deliveryPhotos: true,
    dailySummary: true,
    orderReminders: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'history' | 'settings'>('overview');

  /**
   * Load parent dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load students and their data
      const studentsResponse = await api.get(`/api/v1/users/${user.id}/children`);

      if (studentsResponse.data.success) {
        const studentData = studentsResponse.data.data.map((student: any) => ({
          ...student,
          lastDelivery: student.lastDelivery ? {
            ...student.lastDelivery,
            date: new Date(student.lastDelivery.date)
          } : undefined
        }));

        setStudents(studentData);

        if (studentData.length > 0 && !selectedStudent) {
          setSelectedStudent(studentData[0]);
        }
      }

      // Load dashboard statistics
      const statsResponse = await api.get(`/rfid/parent/${user.id}/dashboard`);

      if (statsResponse.data.success) {
        const statsData = statsResponse.data.data;
        setStats({
          ...statsData,
          lastDeliveryTime: statsData.lastDeliveryTime ? new Date(statsData.lastDeliveryTime) : undefined
        });
      }

      // Load recent activity
      const activityResponse = await api.get(`/rfid/delivery-history?parentId=${user.id}&limit=10`);

      if (activityResponse.data.success) {
        const activities = activityResponse.data.data.verifications.map((verification: any) => ({
          id: verification.id,
          type: 'delivery' as const,
          title: 'Meal Delivered',
          description: `${verification.rfidCard.user.firstName}'s meal delivered at ${verification.reader.location}`,
          timestamp: new Date(verification.verifiedAt),
          studentId: verification.studentId,
          studentName: verification.rfidCard.user.firstName,
          status: 'success' as const,
          metadata: {
            orderId: verification.orderId,
            location: verification.reader.location,
            cardNumber: verification.rfidCard.cardNumber
          }
        }));

        setRecentActivity(activities);
      }

      // Load notification settings
      const settingsResponse = await api.get(`/api/v1/users/${user.id}/notification-settings`);

      if (settingsResponse.data.success) {
        setNotificationSettings(settingsResponse.data.data);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedStudent]);

  /**
   * Handle real-time delivery updates
   */
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'delivery_verification') {
      const verificationData = lastMessage.data;

      // Update statistics
      setStats(prevStats => ({
        ...prevStats,
        todayDeliveries: prevStats.todayDeliveries + 1,
        totalDeliveries: prevStats.totalDeliveries + 1,
        lastDeliveryTime: new Date(verificationData.timestamp)
      }));

      // Add to recent activity
      const newActivity: RecentActivity = {
        id: verificationData.verificationId,
        type: 'delivery',
        title: 'Meal Delivered ✅',
        description: `${verificationData.studentName}'s meal delivered at ${verificationData.location}`,
        timestamp: new Date(verificationData.timestamp),
        studentId: verificationData.studentId,
        studentName: verificationData.studentName,
        status: 'success',
        metadata: {
          orderId: verificationData.orderId,
          location: verificationData.location,
          readerName: verificationData.readerName
        }
      };

      setRecentActivity(prevActivity => [newActivity, ...prevActivity.slice(0, 9)]);

      // Update student last delivery
      setStudents(prevStudents =>
        prevStudents.map(student => {
          if (student.id === verificationData.studentId) {
            return {
              ...student,
              lastDelivery: {
                date: new Date(verificationData.timestamp),
                location: verificationData.location,
                orderId: verificationData.orderId
              }
            };
          }
          return student;
        })
      );

      // Show success notification
      toast.success(
        `🍽️ ${verificationData.studentName}'s meal delivered!`,
        {
          duration: 5000,
