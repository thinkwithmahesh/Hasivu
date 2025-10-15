'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Camera,
  QrCode,
  Navigation,
  Locate,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  RotateCcw,
  Zap,
  Vibrate,
} from 'lucide-react';

// Geolocation Hook with enhanced accuracy
export const useGeolocation = (enableHighAccuracy = true) => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this device');
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setLoading(false);
      },
      error => {
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }

        setError(errorMessage);
        setLoading(false);
      },
      options
    );
  }, [enableHighAccuracy]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      error => {},
      options
    );
  }, [enableHighAccuracy]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    error,
    loading,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
};

// Delivery Tracking Component
interface DeliveryTrackingProps {
  orderID: string;
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  className?: string;
}

export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
  orderID,
  deliveryLocation,
  onLocationUpdate,
  className,
}) => {
  const { location, error, loading, getCurrentPosition, startWatching, stopWatching } =
    useGeolocation(true);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  useEffect(() => {
    if (location && deliveryLocation) {
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      );
      setDistance(dist);

      // Estimate delivery time (assuming 5 km/h walking speed)
      setEstimatedTime(Math.round((dist / 5) * 60)); // in minutes

      onLocationUpdate?.(location);
    }
  }, [location, deliveryLocation, calculateDistance, onLocationUpdate]);

  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopWatching();
      setIsTracking(false);
    } else {
      startWatching();
      setIsTracking(true);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [isTracking, startWatching, stopWatching]);

  return (
    <Card className={cn('p-4 bg-gradient-to-br from-blue-50 to-purple-50', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Delivery Tracking</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Order #{orderID.slice(-6)}
          </Badge>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {location && distance !== null && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </p>
              <p className="text-xs text-gray-600">Distance</p>
            </div>
            <div className="text-center p-3 bg-white/70 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {estimatedTime ? `${estimatedTime}min` : '--'}
              </p>
              <p className="text-xs text-gray-600">ETA</p>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={getCurrentPosition} disabled={loading} className="flex-1" size="sm">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Locate className="h-4 w-4 mr-2" />
            )}
            Get Location
          </Button>

          <Button
            onClick={toggleTracking}
            variant={isTracking ? 'destructive' : 'outline'}
            size="sm"
            className="flex-1"
          >
            {isTracking ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
        </div>

        {location && (
          <div className="text-xs text-gray-500 text-center">
            Accuracy: {Math.round(location.accuracy)}m
          </div>
        )}
      </div>
    </Card>
  );
};

// Camera Component for QR/Barcode Scanning
interface CameraScannerProps {
  onScanResult: (result: string, type: 'qr' | 'barcode' | 'rfid') => void;
  onError?: (error: string) => void;
  scanType?: 'qr' | 'barcode' | 'rfid' | 'all';
  className?: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanResult,
  onError,
  scanType = 'all',
  className,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };

      // Add torch/flash support if available
      if (flashOn && 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
        constraints.video = {
          ...constraints.video,
          // @ts-ignore - advanced constraints may not be typed
          advanced: [{ torch: true }],
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setHasPermission(true);
      setIsActive(true);

      // Start scanning process
      startScanning();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      setHasPermission(false);
      onError?.(errorMessage);
    }
  }, [facingMode, flashOn, onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    if (isActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [isActive, stopCamera, startCamera]);

  const toggleFlash = useCallback(async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];

      try {
        // Check if torch is supported
        const capabilities = videoTrack.getCapabilities();

        if ('torch' in capabilities) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashOn }],
          });
          setFlashOn(!flashOn);
        }
      } catch (err) {}
    }
  }, [flashOn]);

  // Mock scanning function - in production, integrate with a real barcode/QR scanner library
  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const scan = () => {
      if (!isActive) return;

      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // In production, use a barcode/QR code scanning library here
      // For demo purposes, we'll simulate scanning

      // Mock scanning logic - replace with actual scanning library
      if (Math.random() < 0.01) {
        // 1% chance to simulate successful scan
        const mockResults = [
          { result: 'RFID_123456789', type: 'rfid' as const },
          { result: 'https://hasivu.com/student/123', type: 'qr' as const },
          { result: '1234567890123', type: 'barcode' as const },
        ];

        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];

        if (scanType === 'all' || scanType === randomResult.type) {
          onScanResult(randomResult.result, randomResult.type);

          // Haptic feedback on successful scan
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50]);
          }

          stopCamera();
          return;
        }
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    scan();
  }, [isActive, scanType, onScanResult, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!hasPermission && hasPermission !== null) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please allow camera access to scan QR codes and barcodes
        </p>
        <Button onClick={startCamera} size="sm">
          Grant Camera Access
        </Button>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden bg-black', className)}>
      <div className="relative">
        {/* Video Preview */}
        <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />

        {/* Scanning Canvas (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white rounded-lg relative">
              {/* Scanning animation corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400" />

              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 animate-pulse" />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm text-center bg-black/50 p-2 rounded">
                Position {scanType === 'all' ? 'code' : scanType.toUpperCase()} within the frame
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!isActive ? (
              <Button onClick={startCamera} size="sm" className="bg-green-600 hover:bg-green-700">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
            ) : (
              <Button onClick={stopCamera} size="sm" variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>

          {isActive && (
            <div className="flex space-x-2">
              <Button onClick={switchCamera} size="sm" variant="ghost" className="text-white">
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button onClick={toggleFlash} size="sm" variant="ghost" className="text-white">
                <Zap className={cn('h-4 w-4', flashOn && 'text-yellow-400')} />
              </Button>
            </div>
          )}
        </div>

        {isActive && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="text-xs">
              Scanning for {scanType === 'all' ? 'QR/Barcode/RFID' : scanType.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

// Haptic Feedback Component
interface HapticFeedbackProps {
  pattern?: number | number[];
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  pattern = 50,
  children,
  className,
  disabled = false,
}) => {
  const triggerHaptic = useCallback(() => {
    if (disabled || !('vibrate' in navigator)) return;

    navigator.vibrate(pattern);
  }, [pattern, disabled]);

  return (
    <div className={cn('cursor-pointer', className)} onClick={triggerHaptic}>
      {children}
    </div>
  );
};

// Native Share API Component
interface NativeShareProps {
  title: string;
  text: string;
  url?: string;
  files?: File[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
}

export const NativeShare: React.FC<NativeShareProps> = ({
  title,
  text,
  url = window.location.href,
  files = [],
  onSuccess,
  onError,
  children,
}) => {
  const handleShare = useCallback(async () => {
    if ('share' in navigator) {
      try {
        const shareData: ShareData = { title, text, url };

        // Add files if supported and provided
        if (files.length > 0 && 'canShare' in navigator && navigator.canShare({ files })) {
          shareData.files = files;
        }

        await navigator.share(shareData);
        onSuccess?.();

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          onError?.(error.message);
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        onSuccess?.();
      } catch (error) {
        onError?.('Unable to share or copy to clipboard');
      }
    }
  }, [title, text, url, files, onSuccess, onError]);

  return (
    <div onClick={handleShare} className="cursor-pointer">
      {children}
    </div>
  );
};
