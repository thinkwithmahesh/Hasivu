import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { rfidApi } from '@/services/api';

interface VerificationResult {
  success: boolean;
  cardNumber: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  verificationId: string;
  signalQuality: string;
  orderInfo?: {
    orderId: string;
    status: string;
    deliveryDate: string;
  };
}

export const DeliveryVerification: React.FC = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Simulate RFID reader input (in real implementation, this would come from hardware)
  const [simulatedScan, setSimulatedScan] = useState('');

  useEffect(() => {
    // Simulate RFID scan input
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields

      setSimulatedScan(prev => prev + e.key);

      // Auto-submit when card number is complete (simulate RFID scan)
      if (simulatedScan.length >= 10) {
        // Assuming RFID card numbers are ~10 chars
        setCardNumber(simulatedScan);
        setSimulatedScan('');
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [simulatedScan]);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setVerificationResult(null);

    try {
      const response = await rfidApi.verifyRfidScan({
        cardNumber,
        orderId: orderId || undefined,
        location: 'Delivery Station A', // In real implementation, get from GPS/context
        timestamp: new Date().toISOString(),
      });

      setVerificationResult(response.data);
      setSuccess('RFID verification completed successfully');

      // Clear form
      setCardNumber('');
      setOrderId('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getSignalQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSignalQualityBadge = (quality: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    return colors[quality.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RFID Delivery Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-500 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Simulated RFID Reader Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">RFID Reader Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Reader Online</span>
              </div>
              <div className="text-sm text-gray-500">
                Last scan: {new Date().toLocaleTimeString()}
              </div>
            </div>
            {simulatedScan && (
              <div className="mt-2 text-xs text-gray-500">Scanning: {simulatedScan}</div>
            )}
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerification} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardNumber">RFID Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  placeholder="Scan RFID card or enter manually"
                  required
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Press any keys to simulate RFID scan</p>
              </div>
              <div>
                <Label htmlFor="orderId">Order ID (Optional)</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="Enter order ID for verification"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading || !cardNumber.trim()}>
              {loading ? 'Verifying...' : 'Verify Delivery'}
            </Button>
          </form>

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Verification Result</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={verificationResult.success ? 'default' : 'destructive'}>
                          {verificationResult.success ? 'Verified' : 'Failed'}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Card Number:</span>
                        <span className="font-mono text-sm">{verificationResult.cardNumber}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Signal Quality:</span>
                        <Badge className={getSignalQualityBadge(verificationResult.signalQuality)}>
                          {verificationResult.signalQuality}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Student:</span>
                        <span className="text-sm">{verificationResult.studentName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Student ID:</span>
                        <span className="font-mono text-sm">{verificationResult.studentId}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">School ID:</span>
                        <span className="font-mono text-sm">{verificationResult.schoolId}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Verification ID:</span>
                        <span className="font-mono text-xs">
                          {verificationResult.verificationId}
                        </span>
                      </div>

                      {verificationResult.orderInfo && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Order Status:</span>
                          <Badge variant="outline">{verificationResult.orderInfo.status}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {verificationResult.orderInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Order ID:</span>
                        <div className="font-mono">{verificationResult.orderInfo.orderId}</div>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <div>
                          <Badge variant="outline">{verificationResult.orderInfo.status}</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Delivery Date:</span>
                        <div>
                          {new Date(verificationResult.orderInfo.deliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setVerificationResult(null)}>
                  Clear Result
                </Button>
                {verificationResult.orderInfo && (
                  <Button variant="outline">View Order Details</Button>
                )}
              </div>
            </div>
          )}

          {/* Recent Verifications Summary */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="text-sm text-gray-600">
              <p>Today's verifications: 0</p>
              <p>Success rate: 0%</p>
              <p>Average signal quality: N/A</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryVerification;
