'use client';

/**
 * HASIVU Platform - RFID Scan Indicator Component
 * Provides visual feedback for RFID scanning operations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, CheckCircle, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RFIDScanIndicatorProps {
  /** Whether RFID scanning is currently active */
  isScanning?: boolean;
  /** Status of the last scan operation */
  scanStatus?: 'idle' | 'scanning' | 'success' | 'failed' | 'processing';
  /** Optional scan result message */
  statusMessage?: string;
  /** Size variant for the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for styling */
  className?: string;
  /** Callback when scan status changes */
  onScanStatusChange?: (status: 'idle' | 'scanning' | 'success' | 'failed') => void;
}

export function RFIDScanIndicator({
  isScanning = false,
  scanStatus = 'idle',
  statusMessage = '',
  size = 'md',
  className = '',
  onScanStatusChange,
}: RFIDScanIndicatorProps) {
  const [currentStatus, setCurrentStatus] = useState<typeof scanStatus>(scanStatus);
  const [_isAnimating, setIsAnimating] = useState(false);

  // Auto-transition from scanning to result states
  useEffect(() => {
    if (isScanning && currentStatus !== 'scanning') {
      setCurrentStatus('scanning');
      setIsAnimating(true);
      onScanStatusChange?.('scanning');
    } else if (!isScanning && currentStatus === 'scanning') {
      // Simulate scan completion with a brief delay
      setTimeout(() => {
        setCurrentStatus('success'); // Default to success, can be overridden
        setIsAnimating(false);
        onScanStatusChange?.('success');
      }, 500);
    }
  }, [isScanning, currentStatus, onScanStatusChange]);

  // Reset to idle after showing result
  useEffect(() => {
    if (currentStatus === 'success' || currentStatus === 'failed') {
      const timer = setTimeout(() => {
        setCurrentStatus('idle');
        onScanStatusChange?.('idle');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, onScanStatusChange]);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'scanning':
        return {
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          icon: Radio,
          message: statusMessage || 'Scanning RFID card...',
          badgeVariant: 'default' as const,
        };
      case 'success':
        return {
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          icon: CheckCircle,
          message: statusMessage || 'Scan successful!',
          badgeVariant: 'default' as const,
        };
      case 'failed':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          icon: AlertTriangle,
          message: statusMessage || 'Scan failed',
          badgeVariant: 'destructive' as const,
        };
      case 'processing':
        return {
          color: 'orange',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-500',
          icon: Loader2,
          message: statusMessage || 'Processing scan...',
          badgeVariant: 'secondary' as const,
        };
      default:
        return {
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          icon: Radio,
          message: 'Ready for RFID scan',
          badgeVariant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`flex flex-col items-center space-y-3 ${className}`}
      data-testid="rfid-scan-indicator"
    >
      {/* Main scanning circle */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center rounded-full border-2 ${config.borderColor} ${config.bgColor} transition-all duration-300`}
      >
        {/* Scanning pulse animation */}
        <AnimatePresence>
          {currentStatus === 'scanning' && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-blue-500 opacity-75"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.5, 2],
                    opacity: [0.7, 0.3, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Status icon */}
        <motion.div
          animate={{
            rotate: currentStatus === 'scanning' ? 360 : 0,
            scale: currentStatus === 'success' ? [1, 1.2, 1] : 1,
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: currentStatus === 'scanning' ? Infinity : 0,
              ease: 'linear',
            },
            scale: {
              duration: 0.6,
              ease: 'easeInOut',
            },
          }}
        >
          <IconComponent
            size={iconSize[size]}
            className={`text-${config.color}-500 ${
              currentStatus === 'processing' ? 'animate-spin' : ''
            }`}
          />
        </motion.div>

        {/* Success/Error overlay animation */}
        <AnimatePresence>
          {(currentStatus === 'success' || currentStatus === 'failed') && (
            <motion.div
              className="absolute inset-0 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div
                className={`w-full h-full rounded-full border-4 ${config.borderColor} ${config.bgColor} flex items-center justify-center`}
              >
                <IconComponent size={iconSize[size]} className={`text-${config.color}-500`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStatus}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Badge
            variant={config.badgeVariant}
            className="text-xs font-medium"
            data-testid={`scan-status-${currentStatus}`}
          >
            {config.message}
          </Badge>
        </motion.div>
      </AnimatePresence>

      {/* Signal strength indicator for active scanning */}
      {currentStatus === 'scanning' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center space-x-1"
        >
          <Zap size={14} className="text-blue-500" />
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-3 bg-blue-500 rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  height: [8, 12, 8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Hook for managing RFID scan operations
export function useRFIDScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'success' | 'failed' | 'processing'
  >('idle');
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  const startScan = () => {
    setIsScanning(true);
    setScanStatus('scanning');
    setLastScanResult(null);
  };

  const stopScan = (success: boolean = true, result?: any) => {
    setIsScanning(false);
    setScanStatus(success ? 'success' : 'failed');
    setLastScanResult(result);
  };

  const resetScan = () => {
    setIsScanning(false);
    setScanStatus('idle');
    setLastScanResult(null);
  };

  return {
    isScanning,
    scanStatus,
    lastScanResult,
    startScan,
    stopScan,
    resetScan,
  };
}

export default RFIDScanIndicator;
