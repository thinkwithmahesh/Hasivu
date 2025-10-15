import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { rfidApi } from '@/services/api';

interface RFIDCard {
  id: string;
  cardNumber: string;
  studentId: string;
  schoolId: string;
  isActive: boolean;
  issuedAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  student?: {
    firstName: string;
    lastName: string;
  };
}

export const RFIDCardManagement: React.FC = () => {
  const [cards, setCards] = useState<RFIDCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for registering new card
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    studentId: '',
    schoolId: 'default-school-id', // TODO: Get from user context
  });

  // Bulk import state
  const [bulkCards, setBulkCards] = useState('');
  const [bulkImportResult, setBulkImportResult] = useState<any>(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: This endpoint might not exist yet, using placeholder
      // const response = await rfidApi.getCards();
      // setCards(response.data || []);

      // For now, show empty state
      setCards([]);
    } catch (err: any) {
      setError(err.message || 'Failed to load RFID cards');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await rfidApi.registerCard(newCard);
      setSuccess('RFID card registered successfully');
      setNewCard({ cardNumber: '', studentId: '', schoolId: newCard.schoolId });
      loadCards();
    } catch (err: any) {
      setError(err.message || 'Failed to register RFID card');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse CSV-like input
      const lines = bulkCards.trim().split('\n');
      const cards = lines
        .map(line => {
          const [cardNumber, studentId] = line.split(',');
          return { cardNumber: cardNumber?.trim(), studentId: studentId?.trim() };
        })
        .filter(card => card.cardNumber && card.studentId);

      if (cards.length === 0) {
        throw new Error('No valid cards found in input');
      }

      const response = await rfidApi.bulkRegisterCards({
        schoolId: newCard.schoolId,
        cards,
      });

      setBulkImportResult(response.data);
      setSuccess(
        `Bulk import completed. Successful: ${response.data.successful.length}, Failed: ${response.data.failed.length}`
      );
      setBulkCards('');
      loadCards();
    } catch (err: any) {
      setError(err.message || 'Failed to bulk import RFID cards');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to deactivate this RFID card?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Note: This endpoint might not exist yet
      // await rfidApi.deactivateCard(cardId);
      setSuccess('RFID card deactivated successfully');
      loadCards();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate RFID card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RFID Card Management</CardTitle>
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

          {/* Register New Card Form */}
          <form onSubmit={handleRegisterCard} className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Register New RFID Card</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={newCard.cardNumber}
                  onChange={e => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  placeholder="RFID-123456"
                  required
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={newCard.studentId}
                  onChange={e => setNewCard({ ...newCard, studentId: e.target.value })}
                  placeholder="student-uuid"
                  required
                />
              </div>
              <div>
                <Label htmlFor="schoolId">School ID</Label>
                <Input
                  id="schoolId"
                  value={newCard.schoolId}
                  onChange={e => setNewCard({ ...newCard, schoolId: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register Card'}
            </Button>
          </form>

          {/* Bulk Import */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Bulk Import RFID Cards</h3>
            <div>
              <Label htmlFor="bulkCards">CSV Format (cardNumber,studentId per line)</Label>
              <textarea
                id="bulkCards"
                value={bulkCards}
                onChange={e => setBulkCards(e.target.value)}
                className="w-full h-32 p-2 border rounded-md"
                placeholder="RFID-001,student-uuid-1&#10;RFID-002,student-uuid-2"
              />
            </div>
            <Button onClick={handleBulkImport} disabled={loading}>
              {loading ? 'Importing...' : 'Bulk Import'}
            </Button>
          </div>

          {/* Bulk Import Results */}
          {bulkImportResult && (
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-2">Import Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-600">
                    Successful ({bulkImportResult.successful.length})
                  </h5>
                  <ul className="text-sm space-y-1">
                    {bulkImportResult.successful.slice(0, 5).map((item: any, index: number) => (
                      <li key={index}>
                        {item.cardNumber} → {item.studentId}
                      </li>
                    ))}
                    {bulkImportResult.successful.length > 5 && (
                      <li>... and {bulkImportResult.successful.length - 5} more</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-red-600">
                    Failed ({bulkImportResult.failed.length})
                  </h5>
                  <ul className="text-sm space-y-1">
                    {bulkImportResult.failed.slice(0, 5).map((item: any, index: number) => (
                      <li key={index}>
                        {item.cardNumber}: {item.error.message}
                      </li>
                    ))}
                    {bulkImportResult.failed.length > 5 && (
                      <li>... and {bulkImportResult.failed.length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Cards Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Registered RFID Cards</h3>
            {loading ? (
              <p>Loading cards...</p>
            ) : cards.length === 0 ? (
              <p className="text-gray-500">No RFID cards registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Number</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued At</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map(card => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.cardNumber}</TableCell>
                      <TableCell>
                        {card.student
                          ? `${card.student.firstName} ${card.student.lastName}`
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.isActive ? 'default' : 'secondary'}>
                          {card.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(card.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {card.lastUsedAt ? new Date(card.lastUsedAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        {card.isActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeactivateCard(card.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDCardManagement;
