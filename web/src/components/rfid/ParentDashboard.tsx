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
  UserIcon,
  BellIcon,
  CameraIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  BellIcon as BellSolid,
} from '@heroicons/react/24/solid';

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
export const ParentDashboard: React.FC<ParentDashboardProps> = ({ className = '' }) => {
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
    upcomingOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
    deliveryPhotos: true,
    dailySummary: true,
    orderReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'history' | 'settings'>(
    'overview'
  );

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
          lastDelivery: student.lastDelivery
            ? {
                ...student.lastDelivery,
                date: new Date(student.lastDelivery.date),
              }
            : undefined,
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
          lastDeliveryTime: statsData.lastDeliveryTime
            ? new Date(statsData.lastDeliveryTime)
            : undefined,
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
            cardNumber: verification.rfidCard.cardNumber,
          },
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
        lastDeliveryTime: new Date(verificationData.timestamp),
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
          readerName: verificationData.readerName,
        },
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
                orderId: verificationData.orderId,
              },
            };
          }
          return student;
        })
      );

      // Show success notification
      toast.success(`🍽️ ${verificationData.studentName}'s meal delivered!`, {
        duration: 5000,
        icon: '✅',
      });
    }
  }, [lastMessage]);

  /**
   * Handle notification permission request
   */
  const handleEnableNotifications = async () => {
    try {
      await requestPermission();
      // Update settings after successful permission grant
      setNotificationSettings(prev => ({
        ...prev,
        pushEnabled: true,
      }));
    } catch (error) {
      // Error handled silently
    }
  };

  /**
   * Update notification settings
   */
  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...notificationSettings, ...newSettings };

      const response = await api.put(
        `/api/v1/users/${user?.id}/notification-settings`,
        updatedSettings
      );

      if (response.data.success) {
        setNotificationSettings(updatedSettings);
        toast.success('Notification settings updated');
      }
    } catch (error) {
      toast.error('Failed to update notification settings');
    }
  };

  /**
   * Get status color for activities
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (date: Date): string => {
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  /**
   * Initial data load
   */
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-sm text-gray-600">
              Real-time tracking and delivery management
              {!isConnected && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Offline
                </span>
              )}
            </p>
          </div>

          {/* Notification setup prompt */}
          {isSupported && permission !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <BellIcon className="h-4 w-4 mr-2" />
              Enable Notifications
            </button>
          )}
        </div>

        {/* Student selector */}
        {students.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } border`}
                >
                  {student.firstName} {student.lastName}
                  <span className="ml-1 text-xs opacity-75">
                    ({student.grade}-{student.section})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'tracking', label: 'Live Tracking', icon: MapPinIcon },
              { key: 'history', label: 'History', icon: CalendarIcon },
              { key: 'settings', label: 'Settings', icon: BellIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Statistics cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <CheckCircleSolid className="h-8 w-8" />
                    <div className="ml-4">
                      <p className="text-blue-100">Today's Deliveries</p>
                      <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8" />
                    <div className="ml-4">
                      <p className="text-green-100">Success Rate</p>
                      <p className="text-2xl font-bold">{stats.successRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8" />
                    <div className="ml-4">
                      <p className="text-purple-100">Avg. Delivery Time</p>
                      <p className="text-2xl font-bold">{stats.averageDeliveryTime}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8" />
                    <div className="ml-4">
                      <p className="text-orange-100">Upcoming Orders</p>
                      <p className="text-2xl font-bold">{stats.upcomingOrders}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected student info */}
              {selectedStudent && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">School:</span>
                      <p className="text-gray-600">{selectedStudent.schoolName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Class:</span>
                      <p className="text-gray-600">
                        {selectedStudent.grade}-{selectedStudent.section}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">RFID Card:</span>
                      <p
                        className={`text-sm font-medium ${
                          selectedStudent.cardStatus === 'active'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {selectedStudent.cardStatus.toUpperCase()}
                        {selectedStudent.cardNumber && (
                          <span className="text-gray-500 ml-1">
                            (****{selectedStudent.cardNumber.slice(-4)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedStudent.lastDelivery && (
                    <div className="mt-4 p-3 bg-green-50 rounded border-l-4 border-green-400">
                      <p className="text-sm text-green-700">
                        <strong>Last delivery:</strong>{' '}
                        {formatRelativeTime(selectedStudent.lastDelivery.date)} at{' '}
                        {selectedStudent.lastDelivery.location}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recent activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getStatusColor(activity.status)}`}
                        >
                          {activity.type === 'delivery' && <CheckCircleIcon className="h-4 w-4" />}
                          {activity.type === 'photo' && <PhotoIcon className="h-4 w-4" />}
                          {activity.type === 'notification' && <BellSolid className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DeliveryTracking
                studentId={selectedStudent?.id}
                autoRefresh={true}
                showHistorical={false}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DeliveryTracking
                studentId={selectedStudent?.id}
                autoRefresh={false}
                showHistorical={true}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  {[
                    {
                      key: 'pushEnabled',
                      label: 'Push Notifications',
                      description: 'Instant delivery confirmations',
                    },
                    {
                      key: 'emailEnabled',
                      label: 'Email Notifications',
                      description: 'Daily summaries and important updates',
                    },
                    {
                      key: 'smsEnabled',
                      label: 'SMS Notifications',
                      description: 'Critical alerts via text message',
                    },
                    {
                      key: 'deliveryPhotos',
                      label: 'Delivery Photos',
                      description: 'Receive photos of meal deliveries',
                    },
                    {
                      key: 'dailySummary',
                      label: 'Daily Summary',
                      description: 'End-of-day delivery report',
                    },
                    {
                      key: 'orderReminders',
                      label: 'Order Reminders',
                      description: 'Reminders for upcoming meal orders',
                    },
                  ].map(({ key, label, description }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{label}</h4>
                        <p className="text-sm text-gray-600">{description}</p>
                      </div>
                      <button
                        onClick={() =>
                          updateNotificationSettings({
                            [key]: !notificationSettings[key as keyof NotificationSettings],
                          })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          notificationSettings[key as keyof NotificationSettings]
                            ? 'bg-indigo-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            notificationSettings[key as keyof NotificationSettings]
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push notification status */}
              {isSupported && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Push Notification Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Browser Support:</span>
                      <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                        {isSupported ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Permission:</span>
                      <span
                        className={permission === 'granted' ? 'text-green-600' : 'text-red-600'}
                      >
                        {permission.charAt(0).toUpperCase() + permission.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Device Registered:</span>
                      <span className={isRegistered ? 'text-green-600' : 'text-red-600'}>
                        {isRegistered ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  {permission !== 'granted' && (
                    <button
                      onClick={handleEnableNotifications}
                      className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Enable Push Notifications
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentDashboard;
