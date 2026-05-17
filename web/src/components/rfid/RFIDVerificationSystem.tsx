'use client';

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  Camera,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Activity,
  Signal,
  Battery,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

import { useRfidDevices, useRfidTransactions } from '@/hooks/useApiIntegration';

// Enhanced TypeScript interfaces for RFID system
interface RFIDDevice {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'error';
  batteryLevel: number;
  signalStrength: number;
  lastPing: string;
  firmware: string;
}

interface RFIDTransaction {
  id: string;
  studentId: string;
  studentName: string;
  avatar: string;
  mealId: string;
  mealName: string;
  timestamp: string;
  status: 'pending' | 'verified' | 'failed' | 'processing';
  deviceId: string;
  location: string;
  nutritionScore: number;
  photoUrl?: string;
  verificationTime?: number; // in seconds
  fraudScore: number;
}

// RFID Scanner Animation Component
const RFIDScannerAnimation = ({
  isScanning,
  status,
}: {
  isScanning: boolean;
  status: RFIDTransaction['status'];
}) => {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Base scanner circle */}
      <div
        className={`absolute inset-0 rounded-full border-4 transition-colors duration-300 ${
          status === 'verified'
            ? 'border-green-500'
            : status === 'failed'
              ? 'border-red-500'
              : status === 'processing'
                ? 'border-[var(--hasivu-primary)]'
                : 'border-gray-300'
        }`}
      />

      {/* Animated scanning rings */}
      <AnimatePresence>
        {isScanning && !reduced && (
          <>
            {[0, 0.5, 1].map((delay, index) => (
              <motion.div
                key={index}
                className={`absolute inset-0 rounded-full border-2 ${
                  status === 'processing'
                    ? 'border-[var(--hasivu-primary)]/60'
                    : 'border-orange-400'
                }`}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 2,
                  delay,
                  repeat: isScanning ? Infinity : 0,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Center icon */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-full ${
          status === 'verified'
            ? 'bg-green-100'
            : status === 'failed'
              ? 'bg-red-100'
              : status === 'processing'
                ? 'bg-[var(--hasivu-primary)]/10'
                : 'bg-gray-100'
        }`}
      >
        {status === 'verified' && <CheckCircle className="w-12 h-12 text-green-600" />}
        {status === 'failed' && <AlertTriangle className="w-12 h-12 text-red-600" />}
        {status === 'processing' && (
          <Zap className="w-12 h-12 text-[var(--hasivu-primary)] animate-pulse" />
        )}
        {status === 'pending' && <Shield className="w-12 h-12 text-gray-600" />}
      </div>
    </div>
  );
};

// Device Status Component
const DeviceStatus = ({ device }: { device: RFIDDevice }) => {
  const getStatusColor = (status: RFIDDevice['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{device.name}</CardTitle>
            <CardDescription className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {device.location}
            </CardDescription>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Battery className={`w-5 h-5 ${getBatteryColor(device.batteryLevel)}`} />
            </div>
            <div className="text-sm font-medium">{device.batteryLevel}%</div>
            <div className="text-xs text-gray-500">Battery</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Signal className="w-5 h-5 text-[var(--hasivu-primary)]" />
            </div>
            <div className="text-sm font-medium">{device.signalStrength}%</div>
            <div className="text-xs text-gray-500">Signal</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Firmware:</span>
            <Badge variant="outline">{device.firmware}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Last Ping:</span>
            <span className="text-xs text-gray-500">
              {new Date(device.lastPing).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Transaction History Component
const TransactionHistory = ({ transactions }: { transactions: RFIDTransaction[] }) => {
  return (
    <div className="space-y-4">
      {transactions.map(transaction => (
        <div
          key={transaction.id}
          className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Avatar className="w-12 h-12">
            <AvatarImage src={transaction.avatar} alt={transaction.studentName} />
            <AvatarFallback>
              {transaction.studentName
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{transaction.studentName}</h4>
              <Badge
                className={`${
                  transaction.status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : transaction.status === 'processing'
                      ? 'bg-[var(--hasivu-primary)]/10 text-[var(--hasivu-primary-dark)]'
                      : transaction.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {transaction.status}
              </Badge>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              {transaction.mealName} • {transaction.location}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{new Date(transaction.timestamp).toLocaleTimeString()}</span>
                {transaction.verificationTime && (
                  <span>Verified in {transaction.verificationTime}s</span>
                )}
                <span>Score: {transaction.nutritionScore}%</span>
              </div>

              <div className="flex items-center space-x-2">
                {transaction.photoUrl && (
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    Photo
                  </Button>
                )}
                {transaction.fraudScore > 0.5 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Flagged
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Real-time RFID Monitor Component
const RealTimeMonitor = ({
  latestTransaction,
  refresh,
  loading,
}: {
  latestTransaction?: RFIDTransaction;
  refresh: () => void;
  loading: boolean;
}) => {
  const reduced = useReducedMotion();
  const scannerStatus = latestTransaction?.status || (loading ? 'processing' : 'pending');
  const isScanning = loading || scannerStatus === 'processing';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-[var(--hasivu-primary)]" />
          Real-Time RFID Monitor
        </CardTitle>
        <CardDescription>Live meal verification system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <RFIDScannerAnimation isScanning={isScanning} status={scannerStatus} />

          <div className="mb-6">
            <div
              className={`text-lg font-semibold mb-2 ${
                scannerStatus === 'verified'
                  ? 'text-green-600'
                  : scannerStatus === 'failed'
                    ? 'text-red-600'
                    : scannerStatus === 'processing'
                      ? 'text-[var(--hasivu-primary)]'
                      : 'text-gray-600'
              }`}
            >
              {scannerStatus === 'verified' && 'Latest Meal Verified Successfully'}
              {scannerStatus === 'failed' && 'Verification Failed'}
              {scannerStatus === 'processing' && 'Syncing RFID Activity...'}
              {scannerStatus === 'pending' && 'Ready to Scan'}
            </div>

            <div className="text-sm text-gray-600">
              {latestTransaction
                ? `${latestTransaction.studentName} at ${latestTransaction.location}`
                : 'No recent RFID activity available'}
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isScanning && !reduced ? 'animate-spin' : ''}`}
              />
              Refresh Activity
            </Button>
            <Button variant="outline" disabled={!latestTransaction?.photoUrl}>
              <Camera className="w-4 h-4 mr-2" />
              View Photo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main RFID Verification System Component
export const RFIDVerificationSystem: React.FC = () => {
  const { data: rawDevices, loading: devicesLoading, refetch: refetchDevices } = useRfidDevices();
  const {
    data: rawTransactions,
    loading: txLoading,
    refetch: refetchTransactions,
  } = useRfidTransactions();

  // Map backend readers to frontend RFIDDevice
  const devices: RFIDDevice[] = React.useMemo(() => {
    if (!rawDevices) return [];
    // Ensure we handle both raw array or { data: [] }
    const deviceList = Array.isArray(rawDevices) ? rawDevices : (rawDevices as any).data || [];
    return deviceList.map((d: any) => ({
      id: d.id,
      name: d.name,
      location: d.location || 'Unknown Location',
      status: d.status as any,
      batteryLevel: d.configuration?.batteryLevel || 100,
      signalStrength: d.configuration?.signalStrength || 100,
      lastPing: d.lastHeartbeat || d.updatedAt || new Date().toISOString(),
      firmware: d.configuration?.firmware || '1.0.0',
    }));
  }, [rawDevices]);

  // Map backend verifications to frontend RFIDTransaction
  const recentTransactions: RFIDTransaction[] = React.useMemo(() => {
    if (!rawTransactions) return [];
    // handle nested structure if necessary
    const txList = Array.isArray(rawTransactions)
      ? rawTransactions
      : (rawTransactions as any).verifications ||
        (rawTransactions as any).data?.verifications ||
        [];

    return txList.map((t: any) => {
      let verificationData: any = {};
      try {
        verificationData =
          typeof t.verificationData === 'string'
            ? JSON.parse(t.verificationData)
            : t.verificationData || {};
      } catch (e) {}

      return {
        id: t.id,
        studentId: t.studentId,
        studentName: t.student ? `${t.student.firstName} ${t.student.lastName}` : 'Unknown',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.student ? t.student.firstName + ' ' + t.student.lastName : 'Unknown')}`,
        mealId: t.orderId || 'unknown',
        mealName: t.order?.items?.[0]?.menuItem?.name || 'School Meal',
        timestamp: t.verifiedAt,
        status: t.status === 'verified' ? 'verified' : t.status === 'failed' ? 'failed' : 'pending',
        deviceId: t.readerId,
        location: t.location || t.reader?.location || 'Unknown Location',
        nutritionScore: verificationData.nutritionScore || 100,
        photoUrl: t.deliveryPhoto || undefined,
        verificationTime: verificationData.readDuration
          ? verificationData.readDuration / 1000
          : 0.5,
        fraudScore: verificationData.fraudScore || 0,
      };
    });
  }, [rawTransactions]);

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalScans = recentTransactions.length;
  const verifiedScans = recentTransactions.filter(t => t.status === 'verified').length;
  const successRate = totalScans === 0 ? 0 : (verifiedScans / totalScans) * 100;
  const avgScanTime =
    totalScans === 0
      ? 0
      : recentTransactions.reduce((sum, tx) => sum + (tx.verificationTime || 0), 0) / totalScans;
  const refreshRfidData = () => {
    refetchDevices();
    refetchTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RFID Verification System</h1>
            <p className="text-gray-600">Real-time meal delivery verification and monitoring</p>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center px-3 py-2 rounded-full ${
                onlineDevices === devices.length
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              <Wifi className="w-4 h-4 mr-2" />
              {onlineDevices}/{devices.length} Online
            </div>
          </div>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-[var(--hasivu-primary)]/10 rounded-full">
                  <Shield className="w-6 h-6 text-[var(--hasivu-primary)]" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{totalScans}</p>
                  <p className="text-gray-600">Total Scans Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
                  <p className="text-gray-600">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{avgScanTime.toFixed(1)}s</p>
                  <p className="text-gray-600">Avg Scan Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{onlineDevices}</p>
                  <p className="text-gray-600">Active Devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Monitor */}
          <div className="lg:col-span-1">
            <RealTimeMonitor
              latestTransaction={recentTransactions[0]}
              refresh={refreshRfidData}
              loading={devicesLoading || txLoading}
            />
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest RFID meal verifications</CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionHistory transactions={recentTransactions} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Device Status Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Device Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {devices.map(device => (
              <DeviceStatus key={device.id} device={device} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFIDVerificationSystem;
