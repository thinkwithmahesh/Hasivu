'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  User,
  Package,
  Clock,
  Camera,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { hasiviApi } from '@/services/api/hasivu-api.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

interface RFIDVerificationResult {
  success: boolean;
  cardNumber: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  verificationId: string;
  timestamp: Date;
  location: string;
  readerInfo: {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'offline' | 'maintenance';
  };
  orderInfo?: {
    id: string;
    status: string;
    deliveryDate: Date;
    items: string[];
  };
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
  verificationTime: number;
  photoUrl?: string;
}

interface DemoRFIDCard {
  cardNumber: string;
  studentName: string;
  schoolName: string;
  grade: string;
  photoUrl: string;
}

// Demo RFID cards for testing
const DEMO_CARDS: DemoRFIDCard[] = [
  {
    cardNumber: 'RFID-2024-0001',
    studentName: 'Emma Johnson',
    schoolName: 'Springfield Elementary',
    grade: '5th Grade',
    photoUrl: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=4CAF50&color=fff',
  },
  {
    cardNumber: 'RFID-2024-0002',
    studentName: 'Michael Chen',
    schoolName: 'Springfield Elementary',
    grade: '4th Grade',
    photoUrl: 'https://ui-avatars.com/api/?name=Michael+Chen&background=2196F3&color=fff',
  },
  {
    cardNumber: 'RFID-2024-0003',
    studentName: 'Sofia Rodriguez',
    schoolName: 'Springfield Elementary',
    grade: '6th Grade',
    photoUrl: 'https://ui-avatars.com/api/?name=Sofia+Rodriguez&background=9C27B0&color=fff',
  },
];

const RFIDLiveDemo: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [readerStatus, setReaderStatus] = useState<'online' | 'offline' | 'connecting'>(
    'connecting'
  );
  const [selectedCard, setSelectedCard] = useState<DemoRFIDCard | null>(null);
  const [verificationResult, setVerificationResult] = useState<RFIDVerificationResult | null>(null);
  const [manualCardNumber, setManualCardNumber] = useState('');
  const [_isManualMode, setIsManualMode] = useState(false);
  const [signalStrength, setSignalStrength] = useState(85);
  const [verificationHistory, setVerificationHistory] = useState<RFIDVerificationResult[]>([]);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // Simulate reader connection
  useEffect(() => {
    const connectReader = async () => {
      setReaderStatus('connecting');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setReaderStatus('online');

      // Simulate signal strength fluctuation
      const interval = setInterval(() => {
        setSignalStrength(prev => {
          const change = (Math.random() - 0.5) * 10;
          const newValue = prev + change;
          return Math.max(60, Math.min(100, newValue));
        });
      }, 2000);

      return () => clearInterval(interval);
    };

    connectReader();
  }, []);

  const simulateRFIDScan = async (card: DemoRFIDCard) => {
    setIsScanning(true);
    setVerificationResult(null);

    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    try {
      // Simulate scanning delay (300-800ms)
      const scanDelay = 300 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, scanDelay));

      // In production, this would call the actual API
      // const response = await hasiviApi.verifyRFIDCard(card.cardNumber, 'demo-reader-001');

      // For demo, simulate the response
      const mockResult: RFIDVerificationResult = {
        success: true,
        cardNumber: card.cardNumber,
        studentId: `STU-${Date.now()}`,
        studentName: card.studentName,
        schoolId: 'demo-school-001',
        verificationId: `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        location: 'Main Cafeteria',
        readerInfo: {
          id: 'demo-reader-001',
          name: 'Cafeteria Reader #1',
          location: 'Main Entrance',
          status: 'online',
        },
        orderInfo: {
          id: `ORD-${Date.now()}`,
          status: 'ready',
          deliveryDate: new Date(),
          items: ['Chicken Sandwich', 'Apple Juice', 'Fresh Fruit Cup'],
        },
        signalQuality: signalStrength > 80 ? 'excellent' : signalStrength > 60 ? 'good' : 'fair',
        verificationTime: scanDelay,
        photoUrl: card.photoUrl,
      };

      setVerificationResult(mockResult);
      setVerificationHistory(prev => [mockResult, ...prev.slice(0, 4)]);

      // Success feedback
      toast.success(`Verified: ${card.studentName}`);

      // Auto-reset after 5 seconds
      scanTimeoutRef.current = setTimeout(() => {
        setVerificationResult(null);
        setSelectedCard(null);
      }, 5000);
    } catch (error) {
      toast.error('Verification failed. Please try again.');

      setVerificationResult({
        success: false,
        cardNumber: card.cardNumber,
        studentId: '',
        studentName: '',
        schoolId: '',
        verificationId: '',
        timestamp: new Date(),
        location: '',
        readerInfo: {
          id: 'demo-reader-001',
          name: 'Cafeteria Reader #1',
          location: 'Main Entrance',
          status: 'online',
        },
        signalQuality: 'poor',
        verificationTime: 0,
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCardSelect = (card: DemoRFIDCard) => {
    setSelectedCard(card);
    setIsManualMode(false);
    simulateRFIDScan(card);
  };

  const handleManualVerification = () => {
    if (!manualCardNumber) {
      toast.error('Please enter a card number');
      return;
    }

    const card = DEMO_CARDS.find(c => c.cardNumber === manualCardNumber);
    if (card) {
      handleCardSelect(card);
    } else {
      toast.error('Invalid card number. Try one of the demo cards.');
    }
  };

  const getSignalIcon = () => {
    if (readerStatus === 'offline') return <WifiOff className="h-5 w-5 text-red-500" />;
    if (readerStatus === 'connecting')
      return <Wifi className="h-5 w-5 text-yellow-500 animate-pulse" />;
    return <Wifi className="h-5 w-5 text-green-500" />;
  };

  const _getSignalColor = () => {
    if (signalStrength > 80) return 'bg-green-500';
    if (signalStrength > 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">RFID Verification Live Demo</h2>
        <p className="text-gray-600">
          Experience our real-time RFID meal delivery verification system
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* RFID Reader Simulation */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                RFID Reader Station
              </CardTitle>
              <div className="flex items-center gap-2">
                {getSignalIcon()}
                <Badge variant={readerStatus === 'online' ? 'default' : 'secondary'}>
                  {readerStatus}
                </Badge>
              </div>
            </div>
            <CardDescription>Cafeteria Main Entrance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Signal Strength */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Signal Strength</span>
                <span className="font-medium">{Math.round(signalStrength)}%</span>
              </div>
              <Progress value={signalStrength} className="h-2" />
            </div>

            {/* Scanning Animation */}
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
              {isScanning ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-blue-400 rounded-full opacity-30 animate-ping" />
                  <CreditCard className="h-24 w-24 text-blue-600" />
                </motion.div>
              ) : selectedCard ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                  <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Card Verified!</p>
                </motion.div>
              ) : (
                <div className="text-center text-gray-400">
                  <CreditCard className="h-24 w-24 mx-auto mb-2" />
                  <p>Tap or select a card to scan</p>
                </div>
              )}
            </div>

            {/* Demo Cards */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Demo RFID Cards:</p>
              <div className="grid gap-2">
                {DEMO_CARDS.map(card => (
                  <Button
                    key={card.cardNumber}
                    variant={selectedCard?.cardNumber === card.cardNumber ? 'default' : 'outline'}
                    className="justify-start text-left h-auto p-3"
                    onClick={() => handleCardSelect(card)}
                    disabled={isScanning}
                  >
                    <img
                      src={card.photoUrl}
                      alt={card.studentName}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{card.studentName}</div>
                      <div className="text-xs text-gray-500">
                        {card.cardNumber} • {card.grade}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700">Manual Entry:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter card number"
                  value={manualCardNumber}
                  onChange={e => setManualCardNumber(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleManualVerification()}
                />
                <Button onClick={handleManualVerification} disabled={isScanning}>
                  Verify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Results */}
        <div className="space-y-4">
          {/* Current Verification */}
          {verificationResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={verificationResult.success ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {verificationResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Verification Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationResult.success && (
                    <>
                      {/* Student Info */}
                      <div className="flex items-center gap-4">
                        {verificationResult.photoUrl && (
                          <img
                            src={verificationResult.photoUrl}
                            alt={verificationResult.studentName}
                            className="w-16 h-16 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{verificationResult.studentName}</p>
                          <p className="text-sm text-gray-600">
                            ID: {verificationResult.studentId}
                          </p>
                        </div>
                      </div>

                      {/* Order Info */}
                      {verificationResult.orderInfo && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Today's Meal</span>
                          </div>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {verificationResult.orderInfo.items.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Verification Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">
                            {new Date(verificationResult.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Speed:</span>
                          <span className="font-medium">
                            {verificationResult.verificationTime}ms
                          </span>
                        </div>
                      </div>

                      {/* Success Message */}
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Meal successfully verified and ready for pickup!
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  {!verificationResult.success && (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        Verification failed. Please try again or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Verification History */}
          {verificationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {verificationHistory.map((history, _index) => (
                    <div
                      key={history.verificationId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={history.photoUrl}
                          alt={history.studentName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">{history.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {history.verificationTime}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live System Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">99.9%</p>
                  <p className="text-xs text-gray-600">Accuracy Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">&lt;1.5s</p>
                  <p className="text-xs text-gray-600">Avg. Verification</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">5M+</p>
                  <p className="text-xs text-gray-600">Total Verifications</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">100+</p>
                  <p className="text-xs text-gray-600">Active Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RFIDLiveDemo;
