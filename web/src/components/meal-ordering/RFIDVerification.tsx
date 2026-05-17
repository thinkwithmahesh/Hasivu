/**
 * RFID Verification Component
 * Uses InputOTP for RFID card verification and security codes
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Shield,
  CheckCircle,
  XCircle as XCircle,
  Clock,
  Scan,
  AlertTriangle,
  RefreshCw,
  User,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentInfo {
  id: string;
  name: string;
  grade: number;
  section?: string;
  rfidCardId?: string;
  rollNumber?: string;
}

interface RFIDPickupInfo {
  studentId: string;
  orderId: string;
  rfidCardId: string;
  pickupLocation: string;
  pickupTime: string;
  verificationStatus: string;
  pickupCode: string;
  status: 'ready' | 'picked-up' | 'cancelled';
}

interface OrderHistoryItem {
  orderId: string;
  items: any[];
  total: number;
  status: string;
  id?: string;
}

interface RFIDVerificationProps {
  studentInfo: StudentInfo;
  pendingOrders: OrderHistoryItem[];
  onVerificationComplete: (rfidInfo: RFIDPickupInfo) => void;
  onVerificationFailed: (error: string) => void;
  className?: string;
  isScanning?: boolean;
}

interface VerificationState {
  step: 'rfid' | 'security' | 'location' | 'complete';
  rfidCode: string;
  securityCode: string;
  locationCode: string;
  isVerifying: boolean;
  error: string | null;
  progress: number;
  selectedOrder: OrderHistoryItem | null;
}

const VERIFICATION_TIMEOUT = 30000; // 30 seconds
const RFID_CODE_LENGTH = 6;
const SECURITY_CODE_LENGTH = 4;
const LOCATION_CODE_LENGTH = 3;

export function RFIDVerification({
  studentInfo,
  pendingOrders,
  onVerificationComplete,
  onVerificationFailed,
  className,
  isScanning = false,
}: RFIDVerificationProps) {
  const [state, setState] = useState<VerificationState>({
    step: 'rfid',
    rfidCode: '',
    securityCode: '',
    locationCode: '',
    isVerifying: false,
    error: null,
    progress: 0,
    selectedOrder: pendingOrders[0] || null,
  });

  const [timeRemaining, setTimeRemaining] = useState(VERIFICATION_TIMEOUT / 1000);

  // Timeout effect
  useEffect(() => {
    if (!state.isVerifying) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setState(prev => ({ ...prev, isVerifying: false, error: 'Verification timeout' }));
          onVerificationFailed('Verification timeout. Please try again.');
          return VERIFICATION_TIMEOUT / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isVerifying, onVerificationFailed]);

  // Auto-start verification when RFID code is complete
  useEffect(() => {
    if (state.rfidCode.length === RFID_CODE_LENGTH && !state.isVerifying && state.step === 'rfid') {
      handleRFIDVerification();
    }
  }, [state.rfidCode]);

  // Auto-advance when security code is complete
  useEffect(() => {
    if (state.securityCode.length === SECURITY_CODE_LENGTH && state.step === 'security') {
      handleSecurityVerification();
    }
  }, [state.securityCode]);

  // Auto-complete when location code is complete
  useEffect(() => {
    if (state.locationCode.length === LOCATION_CODE_LENGTH && state.step === 'location') {
      handleLocationVerification();
    }
  }, [state.locationCode]);

  const handleRFIDVerification = useCallback(async () => {
    setState(prev => ({ ...prev, isVerifying: true, error: null, progress: 25 }));

    try {
      // Simulate RFID verification API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock verification logic
      if (state.rfidCode === studentInfo.rfidCardId) {
        setState(prev => ({
          ...prev,
          step: 'security',
          isVerifying: false,
          progress: 50,
          error: null,
        }));
        toast.success('RFID verified successfully');
      } else {
        throw new Error('Invalid RFID card');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: 'RFID verification failed',
        progress: 0,
      }));
      onVerificationFailed('RFID verification failed. Please check your card.');
    }
  }, [state.rfidCode, studentInfo.rfidCardId, onVerificationFailed]);

  const handleSecurityVerification = useCallback(async () => {
    setState(prev => ({ ...prev, isVerifying: true, error: null, progress: 75 }));

    try {
      // Simulate security code verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({
        ...prev,
        step: 'location',
        isVerifying: false,
        progress: 85,
      }));
      toast.success('Security code verified');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: 'Invalid security code',
        progress: 50,
      }));
    }
  }, []);

  const handleLocationVerification = useCallback(async () => {
    setState(prev => ({ ...prev, isVerifying: true, error: null, progress: 95 }));

    try {
      // Simulate location verification
      await new Promise(resolve => setTimeout(resolve, 800));

      const rfidInfo: RFIDPickupInfo = {
        studentId: studentInfo.id,
        orderId: state.selectedOrder?.orderId || '',
        rfidCardId: state.rfidCode,
        pickupLocation: `Location-${state.locationCode}`,
        pickupTime: new Date().toISOString(),
        verificationStatus: 'verified',
        pickupCode: `RFID-${state.rfidCode}`,
        status: 'picked-up',
      };

      setState(prev => ({
        ...prev,
        step: 'complete',
        isVerifying: false,
        progress: 100,
      }));

      toast.success('Verification complete! You can now collect your order.');
      onVerificationComplete(rfidInfo);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: 'Location verification failed',
        progress: 75,
      }));
    }
  }, [
    state.rfidCode,
    state.locationCode,
    state.selectedOrder,
    studentInfo.id,
    onVerificationComplete,
  ]);

  const resetVerification = useCallback(() => {
    setState({
      step: 'rfid',
      rfidCode: '',
      securityCode: '',
      locationCode: '',
      isVerifying: false,
      error: null,
      progress: 0,
      selectedOrder: pendingOrders[0] || null,
    });
    setTimeRemaining(VERIFICATION_TIMEOUT / 1000);
  }, [pendingOrders]);

  const getStepTitle = () => {
    switch (state.step) {
      case 'rfid':
        return 'Scan RFID Card';
      case 'security':
        return 'Enter Security Code';
      case 'location':
        return 'Verify Pickup Location';
      case 'complete':
        return 'Verification Complete';
      default:
        return 'Verification';
    }
  };

  const getStepDescription = () => {
    switch (state.step) {
      case 'rfid':
        return 'Please scan your RFID card or enter the card number';
      case 'security':
        return 'Enter the 4-digit security code from your card';
      case 'location':
        return 'Enter the 3-digit location code from pickup point';
      case 'complete':
        return 'Your identity has been verified successfully';
      default:
        return '';
    }
  };

  const getStepIcon = () => {
    switch (state.step) {
      case 'rfid':
        return <CreditCard className="w-6 h-6 text-primary-500" />;
      case 'security':
        return <Shield className="w-6 h-6 text-primary-500" />;
      case 'location':
        return <MapPin className="w-6 h-6 text-primary-500" />;
      case 'complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Scan className="w-6 h-6 text-gray-500" />;
    }
  };

  if (pendingOrders.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-medium mb-2">No pending orders</h3>
            <p className="text-sm">You don't have any orders ready for pickup.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStepIcon()}
            <div>
              <CardTitle className="text-lg">{getStepTitle()}</CardTitle>
              <CardDescription>{getStepDescription()}</CardDescription>
            </div>
          </div>

          {state.isVerifying && (
            <Badge variant="outline" className="text-primary-600">
              <Clock className="w-3 h-3 mr-1" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </Badge>
          )}
        </div>

        {state.progress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Verification Progress</span>
              <span className="text-primary-600">{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Selection */}
        {pendingOrders.length > 1 && state.step === 'rfid' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select Order to Collect:</label>
            <div className="space-y-2">
              {pendingOrders.map(order => (
                <Card
                  key={order.orderId}
                  className={`p-3 cursor-pointer transition-colors ${
                    state.selectedOrder?.orderId === order.orderId
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setState(prev => ({ ...prev, selectedOrder: order }))}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Order #{order.orderId}</div>
                      <div className="text-xs text-gray-600">
                        {order.items.length} items • ₹{order.total}
                      </div>
                    </div>
                    <Badge variant={order.status === 'ready' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Student Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <User className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-sm">{studentInfo.name}</div>
            <div className="text-xs text-gray-600">
              Grade {studentInfo.grade}-{studentInfo.section} • Roll: {studentInfo.rollNumber}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* RFID Input Step */}
        {state.step === 'rfid' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                {isScanning ? (
                  <div className="flex items-center justify-center gap-2 text-primary-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Scanning for RFID card...</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Enter your 6-digit RFID card number</div>
                )}
              </div>

              <InputOTP
                value={state.rfidCode}
                onChange={value => setState(prev => ({ ...prev, rfidCode: value }))}
                maxLength={RFID_CODE_LENGTH}
                disabled={state.isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {/* Security Code Input Step */}
        {state.step === 'security' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 text-sm text-gray-600">
                Enter the 4-digit security code printed on your RFID card
              </div>

              <InputOTP
                value={state.securityCode}
                onChange={value => setState(prev => ({ ...prev, securityCode: value }))}
                maxLength={SECURITY_CODE_LENGTH}
                disabled={state.isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {/* Location Code Input Step */}
        {state.step === 'location' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4 text-sm text-gray-600">
                Enter the 3-digit code displayed at the pickup location
              </div>

              <InputOTP
                value={state.locationCode}
                onChange={value => setState(prev => ({ ...prev, locationCode: value }))}
                maxLength={LOCATION_CODE_LENGTH}
                disabled={state.isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {/* Completion Step */}
        {state.step === 'complete' && (
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="font-semibold text-green-700 mb-2">Verification Successful!</h3>
            <p className="text-sm text-gray-600 mb-4">
              You can now collect your order from the pickup location.
            </p>

            {state.selectedOrder && (
              <Card className="p-3 bg-green-50 border-green-200">
                <div className="text-sm">
                  <div className="font-medium">Order #{state.selectedOrder.orderId}</div>
                  <div className="text-gray-600">
                    Pickup Location: Location-{state.locationCode}
                  </div>
                  <div className="text-gray-600">
                    Verified at: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {state.step !== 'complete' && (
            <Button
              variant="outline"
              onClick={resetVerification}
              disabled={state.isVerifying}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}

          {state.step === 'complete' && (
            <Button onClick={resetVerification} className="flex-1">
              Verify Another Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RFIDVerification;
