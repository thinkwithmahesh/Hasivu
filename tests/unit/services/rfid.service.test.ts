/**
 * RfidService — tests aligned with DatabaseService.client + cache usage.
 */

const prismaMock = {
  rFIDCard: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  rFIDReader: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
  deliveryVerification: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

jest.mock('../../../src/services/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({ client: prismaMock })),
    client: prismaMock,
  },
}));

jest.mock('../../../src/utils/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-fixed',
}));

import RfidService from '../../../src/services/rfid.service';
import { cache } from '../../../src/utils/cache';

describe('RfidService', () => {
  beforeEach(() => {
    RfidService.resetInstanceForTests();
    jest.clearAllMocks();
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.setex as jest.Mock).mockResolvedValue('OK');
  });

  const student = {
    id: 'student-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'j@school.edu',
    schoolId: 'school-1',
  };

  const activeCard = {
    id: 'card-1',
    cardNumber: 'RFID-ABCD-12',
    cardType: 'student',
    isActive: true,
    studentId: 'student-1',
    schoolId: 'school-1',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    lastUsedAt: null,
    metadata: '{}',
    student: {
      id: 'student-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'j@school.edu',
      schoolId: 'school-1',
    },
  };

  describe('registerCard', () => {
    it('rejects invalid card number format', async () => {
      const svc = RfidService.getInstance();
      const out = await svc.registerCard({
        cardNumber: 'bad lower',
        studentId: 'student-1',
        schoolId: 'school-1',
      });
      expect(out.success).toBe(false);
      expect(out.error?.code).toBe('INVALID_CARD_FORMAT');
    });

    it('registers when student exists and no duplicate', async () => {
      prismaMock.rFIDCard.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(student as never);
      prismaMock.rFIDCard.findFirst.mockResolvedValue(null);
      prismaMock.rFIDCard.create.mockResolvedValue(activeCard as never);

      const svc = RfidService.getInstance();
      const out = await svc.registerCard({
        cardNumber: 'RFID-ABCD-12',
        studentId: 'student-1',
        schoolId: 'school-1',
        cardType: 'student',
        expiryDate: new Date(Date.now() + 86400000),
      });

      expect(out.success).toBe(true);
      expect(out.data?.cardNumber).toBe('RFID-ABCD-12');
      expect(prismaMock.rFIDCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cardNumber: 'RFID-ABCD-12',
            studentId: 'student-1',
            schoolId: 'school-1',
            isActive: true,
          }),
        })
      );
      expect(cache.setex).toHaveBeenCalled();
    });

    it('rejects when card number already exists', async () => {
      prismaMock.rFIDCard.findUnique.mockResolvedValue({ id: 'existing' } as never);
      const svc = RfidService.getInstance();
      const out = await svc.registerCard({
        cardNumber: 'RFID-DUP-99',
        studentId: 'student-1',
        schoolId: 'school-1',
      });
      expect(out.success).toBe(false);
      expect(out.error?.code).toBe('CARD_ALREADY_EXISTS');
    });

    it('rejects when student is missing', async () => {
      prismaMock.rFIDCard.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);
      const svc = RfidService.getInstance();
      const out = await svc.registerCard({
        cardNumber: 'RFID-NEW-01',
        studentId: 'missing',
        schoolId: 'school-1',
      });
      expect(out.success).toBe(false);
      expect(out.error?.code).toBe('STUDENT_NOT_FOUND');
    });
  });

  describe('verifyDelivery', () => {
    it('returns success without reader or order', async () => {
      prismaMock.rFIDCard.findUnique.mockResolvedValue(activeCard as never);
      prismaMock.deliveryVerification.create.mockResolvedValue({
        id: 'ver-1',
        verifiedAt: new Date(),
      } as never);
      prismaMock.rFIDCard.update.mockResolvedValue(activeCard as never);
      prismaMock.user.findUnique.mockResolvedValue({ firstName: 'Jane', lastName: 'Doe' } as never);

      const svc = RfidService.getInstance();
      const out = await svc.verifyDelivery({
        cardNumber: 'RFID-ABCD-12',
        signalStrength: 90,
        readDuration: 200,
      });

      expect(out.success).toBe(true);
      expect(out.data?.verificationId).toBe('ver-1');
      expect(out.data?.signalQuality).toBe('excellent');
    });

    it('returns CARD_NOT_FOUND when card missing', async () => {
      prismaMock.rFIDCard.findUnique.mockResolvedValue(null);
      const svc = RfidService.getInstance();
      const out = await svc.verifyDelivery({ cardNumber: 'RFID-MISSING' });
      expect(out.success).toBe(false);
      expect(out.error?.code).toBe('CARD_NOT_FOUND');
    });
  });
});
