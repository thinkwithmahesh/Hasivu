/**
 * OrderService — static createOrder + instance helpers aligned with current implementation.
 */

jest.mock('../../../src/repositories/menuItem.repository', () => {
  const findMany = jest.fn();
  const findById = jest.fn();
  class MenuItemRepository {
    static findMany = findMany;
    static findById = findById;
  }
  return { MenuItemRepository };
});

jest.mock('../../../src/repositories/order.repository');
jest.mock('../../../src/repositories/orderItem.repository');
jest.mock('../../../src/repositories/paymentOrder.repository');
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/redis.service');
jest.mock('../../../src/services/notification.service');
jest.mock('../../../src/services/payment.service', () => ({
  PaymentService: {
    processPayment: jest.fn(),
    refundPayment: jest.fn(),
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

import { OrderService } from '../../../src/services/order.service';
import { MenuItemRepository } from '../../../src/repositories/menuItem.repository';

const findManyMock = MenuItemRepository.findMany as jest.MockedFunction<typeof MenuItemRepository.findMany>;

describe('OrderService', () => {
  const mockCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(OrderService, 'getInstance').mockReturnValue({
      create: mockCreate,
    } as any);
    mockCreate.mockResolvedValue({
      id: 'order-1',
      status: 'pending',
      studentId: 'student-123',
      schoolId: 'school-123',
      totalAmount: 375,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const baseOrderData = () => ({
    studentId: 'student-123',
    parentId: 'parent-123',
    schoolId: 'school-123',
    items: [
      { menuItemId: 'item-1', quantity: 2, specialInstructions: 'No onions' },
      { menuItemId: 'item-2', quantity: 1 },
    ],
    deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    deliveryType: 'pickup' as const,
  });

  describe('createOrder (static)', () => {
    it('returns success when menu items resolve and instance create succeeds', async () => {
      findManyMock.mockResolvedValue({
        items: [
          { id: 'item-1', price: 150, available: true },
          { id: 'item-2', price: 75, available: true },
        ],
        total: 2,
      });

      const result = await OrderService.createOrder(baseOrderData());

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('order-1');
      expect(findManyMock).toHaveBeenCalledWith({
        filters: {
          schoolId: 'school-123',
          available: true,
          ids: ['item-1', 'item-2'],
        },
      });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolId: 'school-123',
          studentId: 'student-123',
          totalAmount: 375,
          items: expect.any(Array),
        })
      );
    });

    it('rejects delivery date in the past', async () => {
      const result = await OrderService.createOrder({
        ...baseOrderData(),
        deliveryDate: new Date(Date.now() - 60 * 60 * 1000),
      });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_DELIVERY_DATE');
    });

    it('rejects when some menu items are missing or unavailable', async () => {
      findManyMock.mockResolvedValue({
        items: [{ id: 'item-1', price: 150, available: true }],
        total: 1,
      });

      const result = await OrderService.createOrder(baseOrderData());
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ITEMS_UNAVAILABLE');
    });
  });
});
