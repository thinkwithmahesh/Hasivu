/**
 * RFIDInterface Component - RFID Card Pickup Interface
 * Handles RFID-based meal pickup verification
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle, Clock, MapPin, User, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { RFIDInterfaceProps, RFIDPickupInfo } from './types';
import { formatCurrency, formatTime, generatePickupCode } from './utils';

const RFIDInterface: React.FC<RFIDInterfaceProps> = ({
  studentInfo,
  pendingOrders,
  onRFIDScan,
  isScanning = false,
}) => {
  const [manualCardId, setManualCardId] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'error' | 'warning';
    message: string;
    order?: any;
  } | null>(null);
  const [pickupCode, setPickupCode] = useState('');

  // Generate pickup code for first pending order
  useEffect(() => {
    if (pendingOrders.length > 0) {
      const code = generatePickupCode(pendingOrders[0].orderId, studentInfo.id);
      setPickupCode(code);
    }
  }, [pendingOrders, studentInfo.id]);

  const handleManualScan = async () => {
    if (!manualCardId.trim()) {
      setScanResult({
        status: 'error',
        message: 'Please enter a valid RFID card number',
      });
      return;
    }

    try {
      await onRFIDScan(manualCardId.trim());
      setScanResult({
        status: 'success',
        message: 'RFID card scanned successfully! Order verification in progress...',
      });
      setManualCardId('');
    } catch (error) {
      setScanResult({
        status: 'error',
        message: 'Failed to scan RFID card. Please try again.',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  // Clear scan result after 5 seconds
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        setScanResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  return (
    <div className="space-y-6">
      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Student Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="font-medium">{studentInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Grade & Section:</span>
                <span className="font-medium">{studentInfo.grade}-{studentInfo.section}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Roll Number:</span>
                <span className="font-medium">{studentInfo.rollNumber}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Wallet Balance:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(studentInfo.walletBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">RFID Card:</span>
                <span className="font-medium">
                  {studentInfo.rfidCardId ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ✅ Linked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600">
                      ⚠️ Not Linked
                    </Badge>
                  )}
                </span>
              </div>
              {pickupCode && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pickup Code:</span>
                  <span className="font-mono font-bold text-lg text-blue-600">
                    {pickupCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFID Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>RFID Meal Pickup</span>
            {isScanning && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-pulse">📡</div>
                <span className="text-sm">Scanning...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scan Result Display */}
          {scanResult && (
            <Alert 
              variant={scanResult.status === 'error' ? 'destructive' : 'default'}
              className={
                scanResult.status === 'success' ? 'border-green-200 bg-green-50' :
                scanResult.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }
            >
              {scanResult.status === 'success' && <CheckCircle className="h-4 w-4" />}
              {scanResult.status === 'error' && <AlertCircle className="h-4 w-4" />}
              {scanResult.status === 'warning' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{scanResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Manual RFID Input */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                <CreditCard className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tap Your RFID Card</h3>
              <p className="text-gray-600 text-sm mb-4">
                Place your RFID card near the scanner or enter the card number manually
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rfid-input">Manual RFID Entry</Label>
                <div className="flex space-x-2">
                  <Input
                    id="rfid-input"
                    type="text"
                    placeholder="Enter RFID card number"
                    value={manualCardId}
                    onChange={(e) => setManualCardId(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    maxLength={16}
                    className="font-mono"
                  />
                  <Button 
                    onClick={handleManualScan}
                    disabled={isScanning || !manualCardId.trim()}
                  >
                    Scan
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Enter 8-16 character RFID card number (letters and numbers only)
                </p>
              </div>

              {/* QR Code Alternative */}
              <div className="text-center">
                <Separator className="my-4" />
                <p className="text-sm text-gray-600 mb-2">Alternative pickup method</p>
                <Button variant="outline" className="flex items-center space-x-2">
                  <QrCode className="h-4 w-4" />
                  <span>Show QR Code</span>
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Show this to the meal counter staff
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Orders */}
      {pendingOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pending Pickups ({pendingOrders.length})</span>
              </span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                Ready for Pickup
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOrders.map((order) => (
              <div key={order.orderId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">Order #{order.orderId.slice(-6).toUpperCase()}</h4>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{formatCurrency(order.total)}</div>
                    <Badge 
                      variant="secondary"
                      className={`text-xs ${
                        order.status === 'ready' ? 'bg-green-100 text-green-700' :
                        order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status === 'ready' ? '✅ Ready' :
                       order.status === 'preparing' ? '👨‍🍳 Preparing' :
                       '🔄 Confirmed'}
                    </Badge>
                  </div>
                </div>

                {/* Order Items Summary */}
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.mealItem.name}</span>
                      <span>{formatCurrency(item.mealItem.price * item.quantity)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{order.items.length - 3} more items
                    </div>
                  )}
                </div>

                {/* Pickup Instructions */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Pickup Instructions:</p>
                      <p className="text-blue-700">
                        Visit the meal counter with your RFID card or show pickup code: 
                        <span className="font-mono font-bold ml-1">{pickupCode}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* RFID Verification Status */}
                {studentInfo.rfidCardId && (
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>RFID verification enabled</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Verify Pickup
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Orders</h3>
            <p className="text-sm text-gray-500 text-center">
              You don't have any orders ready for pickup right now.
            </p>
          </CardContent>
        </Card>
      )}

      {/* RFID Setup Instructions */}
      {!studentInfo.rfidCardId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>RFID Card Setup Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Your RFID card is not linked to your account. To enable quick pickup:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Visit the school administrative office</li>
                    <li>Bring your student ID and RFID card</li>
                    <li>Request RFID linking to your meal account</li>
                    <li>Test the card with a staff member</li>
                  </ol>
                  <p className="text-sm mt-2">
                    <strong>Note:</strong> You can still use the pickup code method shown above.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 text-center">
              <Button variant="outline">
                Contact Support for RFID Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pickup History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* This would be populated with actual pickup history */}
            <div className="text-center text-gray-500 text-sm py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No recent pickup history available</p>
              <p className="text-xs mt-1">Your pickup history will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDInterface;