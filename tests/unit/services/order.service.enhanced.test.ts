/**
 * HASIVU Platform - Enhanced Order Service Tests
 * Demonstrates proper dependency injection and test isolation
 * Service Layer Architecture Enhancement - Phase 2
 */

import { EnhancedOrderService, CreateOrderInput, AddToCartInput } from '../../../src/services/order.service.enhanced';
import { ServiceContainer, getTestContainer } from '../../../src/container/ServiceContainer';
import { IServiceContainer } from '../../../src/container/ServiceContainer';

describe('EnhancedOrderService', () => {
  let orderService: EnhancedOrderService;
  let container: ServiceContainer;
  let mockContainer: IServiceContainer;

  beforeEach(() => {
    // Create test container with mocked dependencies
    container = getTestContainer();
    mockContainer = container as any; // Access mocked methods
    orderService = new EnhancedOrderService(container);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const validOrderInput: CreateOrderInput = {
      studentId: 'student-123',
      parentId: 'parent-123',
      schoolId: 'school-123',
      items: [
        {
          menuItemId: 'menu-item-123',
          quantity: 2,
          specialInstructions: 'No onions'
        }
      ],
      deliveryDate: new Date(Date.now() + 86400000), // Tomorrow
      deliveryType: 'pickup'
    };

    it('should create order successfully with valid input', async () => {
      // Setup mocks
      const mockMenuItem = {
        id: 'menu-item-123',
        name: 'Test Burger',
        price: 250.00,
        available: true,
        schoolId: 'school-123'
      };

      const mockStudent = {
        id: 'student-123',
        email: 'student@test.com'
      };

      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-123456',
        studentId: 'student-123',
        userId: 'parent-123',
        schoolId: 'school-123',
        totalAmount: 500.00,
        status: 'pending',
        deliveryDate: validOrderInput.deliveryDate
      };

      (mockContainer.menuItemRepository.findMany as jest.Mock).mockResolvedValue({
        items: [mockMenuItem],
        total: 1
      });

      (mockContainer.userRepository.findById as jest.Mock).mockResolvedValue(mockStudent);

      (mockContainer.databaseService.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const mockTx = {
            order: {
              create: jest.fn().mockResolvedValue(mockOrder)
            }
          };
          return await callback(mockTx);
        }
      );

      (mockContainer.orderItemRepository.createMany as jest.Mock).mockResolvedValue({
        count: 1
      });

      (mockContainer.redisService.del as jest.Mock).mockImplementation(() => Promise.resolve());
      (mockContainer.notificationService.sendOrderConfirmation as jest.Mock).mockImplementation(() => Promise.resolve());

      // Execute
      const result = await orderService.createOrder(validOrderInput);

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);

      // Verify dependencies were called correctly
      expect(mockContainer.menuItemRepository.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['menu-item-123'] },
          schoolId: 'school-123',
          available: true
        }
      });

      expect(mockContainer.userRepository.findById).toHaveBeenCalledWith('student-123');
      expect(mockContainer.databaseService.transaction).toHaveBeenCalled();
      expect(mockContainer.orderItemRepository.createMany).toHaveBeenCalled();
      expect(mockContainer.redisService.del).toHaveBeenCalledWith('cart:student-123');
      expect(mockContainer.notificationService.sendOrderConfirmation).toHaveBeenCalledWith({
        orderId: 'order-123',
        studentId: 'student-123',
        parentId: 'parent-123',
        totalAmount: 500.00,
        deliveryDate: validOrderInput.deliveryDate
      });
    });

    it('should return error when menu items are not available', async () => {
      // Setup mocks - empty menu items result
      (mockContainer.menuItemRepository.findMany as jest.Mock).mockResolvedValue({
        items: [],
        total: 0
      });

      // Execute
      const result = await orderService.createOrder(validOrderInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ITEMS_UNAVAILABLE');
      expect(result.error?.message).toContain('Menu items not available');

      // Verify no order creation was attempted
      expect(mockContainer.databaseService.transaction).not.toHaveBeenCalled();
      expect(mockContainer.notificationService.sendOrderConfirmation).not.toHaveBeenCalled();
    });

    it('should validate delivery date is not in the past', async () => {
      const invalidInput = {
        ...validOrderInput,
        deliveryDate: new Date(Date.now() - 86400000) // Yesterday
      };

      // Execute
      const result = await orderService.createOrder(invalidInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_DELIVERY_DATE');

      // Verify no repository calls were made
      expect(mockContainer.menuItemRepository.findMany).not.toHaveBeenCalled();
    });

    it('should validate order cutoff time', async () => {
      const cutoffInput = {
        ...validOrderInput,
        deliveryDate: new Date(Date.now() + 3600000) // 1 hour from now (less than 2-hour cutoff)
      };

      // Execute
      const result = await orderService.createOrder(cutoffInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ORDER_CUTOFF_PASSED');
    });

    it('should validate quantity limits', async () => {
      const invalidQuantityInput = {
        ...validOrderInput,
        items: [
          {
            menuItemId: 'menu-item-123',
            quantity: 15, // Exceeds MAX_QUANTITY_PER_ITEM (10)
            specialInstructions: 'Too many'
          }
        ]
      };

      const mockMenuItem = {
        id: 'menu-item-123',
        name: 'Test Burger',
        price: 250.00,
        available: true,
        schoolId: 'school-123'
      };

      (mockContainer.menuItemRepository.findMany as jest.Mock).mockResolvedValue({
        items: [mockMenuItem],
        total: 1
      });

      (mockContainer.userRepository.findById as jest.Mock).mockResolvedValue({
        id: 'student-123'
      });

      // Execute
      const result = await orderService.createOrder(invalidQuantityInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUANTITY_EXCEEDED');
      expect(result.error?.message).toContain('exceeds maximum allowed');
    });
  });

  describe('addToCart', () => {
    const validCartInput: AddToCartInput = {
      studentId: 'student-123',
      menuItemId: 'menu-item-123',
      quantity: 2,
      specialInstructions: 'Extra cheese'
    };

    it('should add item to cart successfully', async () => {
      // Setup mocks
      const mockMenuItem = {
        id: 'menu-item-123',
        name: 'Test Pizza',
        price: 350.00,
        available: true
      };

      const existingCart = JSON.stringify({
        items: [],
        totalAmount: 0,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      });

      (mockContainer.menuItemRepository.findById as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockContainer.redisService.get as jest.Mock).mockResolvedValue(existingCart);
      (mockContainer.redisService.set as jest.Mock).mockImplementation(() => Promise.resolve());

      // Execute
      const result = await orderService.addToCart(validCartInput);

      // Verify
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.items[0].menuItemId).toBe('menu-item-123');
      expect(result.data?.items[0].quantity).toBe(2);
      expect(result.data?.items[0].price).toBe(350.00);
      expect(result.data?.totalAmount).toBe(700.00);

      // Verify Redis operations
      expect(mockContainer.redisService.get).toHaveBeenCalledWith('cart:student-123');
      expect(mockContainer.redisService.set).toHaveBeenCalledWith(
        'cart:student-123',
        expect.any(String),
        3600
      );
    });

    it('should return error when menu item is not available', async () => {
      (mockContainer.menuItemRepository.findById as jest.Mock).mockResolvedValue(null);

      // Execute
      const result = await orderService.addToCart(validCartInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ITEM_UNAVAILABLE');

      // Verify Redis was not called
      expect(mockContainer.redisService.get).not.toHaveBeenCalled();
      expect(mockContainer.redisService.set).not.toHaveBeenCalled();
    });

    it('should validate quantity limits for cart items', async () => {
      const invalidCartInput = {
        ...validCartInput,
        quantity: 15 // Exceeds limit
      };

      const mockMenuItem = {
        id: 'menu-item-123',
        name: 'Test Pizza',
        price: 350.00,
        available: true
      };

      (mockContainer.menuItemRepository.findById as jest.Mock).mockResolvedValue(mockMenuItem);

      // Execute
      const result = await orderService.addToCart(invalidCartInput);

      // Verify
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('QUANTITY_EXCEEDED');
    });

    it('should update existing cart item quantity', async () => {
      const mockMenuItem = {
        id: 'menu-item-123',
        name: 'Test Pizza',
        price: 350.00,
        available: true
      };

      const existingCart = JSON.stringify({
        items: [{
          menuItemId: 'menu-item-123',
          quantity: 1,
          price: 350.00,
          specialInstructions: 'Original instruction'
        }],
        totalAmount: 350.00,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      });

      (mockContainer.menuItemRepository.findById as jest.Mock).mockResolvedValue(mockMenuItem);
      (mockContainer.redisService.get as jest.Mock).mockResolvedValue(existingCart);
      (mockContainer.redisService.set as jest.Mock).mockImplementation(() => Promise.resolve());

      // Execute
      const result = await orderService.addToCart(validCartInput);

      // Verify - quantity should be updated (1 + 2 = 3)
      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.items[0].quantity).toBe(3);
      expect(result.data?.items[0].specialInstructions).toBe('Extra cheese'); // Updated
      expect(result.data?.totalAmount).toBe(1050.00); // 350 * 3
    });
  });

  describe('getCart', () => {
    it('should return null for non-existent cart', async () => {
      (mockContainer.redisService.get as jest.Mock).mockResolvedValue(null);

      const result = await orderService.getCart('student-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return existing cart data', async () => {
      const cartData = {
        items: [{
          menuItemId: 'menu-item-123',
          quantity: 2,
          price: 350.00
        }],
        totalAmount: 700.00,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };

      (mockContainer.redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(cartData));

      const result = await orderService.getCart('student-123');

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.totalAmount).toBe(700.00);
    });

    it('should handle expired cart by deleting it', async () => {
      const expiredCartData = {
        items: [],
        totalAmount: 0,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      };

      (mockContainer.redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(expiredCartData));
      (mockContainer.redisService.del as jest.Mock).mockImplementation(() => Promise.resolve());

      const result = await orderService.getCart('student-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(mockContainer.redisService.del).toHaveBeenCalledWith('cart:student-123');
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      (mockContainer.redisService.del as jest.Mock).mockImplementation(() => Promise.resolve());

      await orderService.clearCart('student-123');

      expect(mockContainer.redisService.del).toHaveBeenCalledWith('cart:student-123');
    });

    it('should handle Redis errors gracefully', async () => {
      (mockContainer.redisService.del as jest.Mock).mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw - method handles errors internally
      await expect(orderService.clearCart('student-123')).resolves.toBeUndefined();
    });
  });

  describe('Dependency Injection Benefits', () => {
    it('should allow easy mocking of all dependencies', () => {
      // Verify all dependencies are mockable
      expect(jest.isMockFunction(mockContainer.orderRepository.create)).toBe(true);
      expect(jest.isMockFunction(mockContainer.menuItemRepository.findById)).toBe(true);
      expect(jest.isMockFunction(mockContainer.userRepository.findByEmail)).toBe(true);
      expect(jest.isMockFunction(mockContainer.databaseService.transaction)).toBe(true);
      expect(jest.isMockFunction(mockContainer.notificationService.sendOrderConfirmation)).toBe(true);
      expect(jest.isMockFunction(mockContainer.paymentService.processPayment)).toBe(true);
      expect(jest.isMockFunction(mockContainer.redisService.get)).toBe(true);
    });

    it('should enable isolated testing without external dependencies', async () => {
      // This test demonstrates that the service can be tested in complete isolation
      const isolatedContainer = getTestContainer({
        menuItemRepository: {
          ...mockContainer.menuItemRepository,
          findById: jest.fn().mockResolvedValue({ id: 'isolated-item', available: false })
        }
      });

      const isolatedService = new EnhancedOrderService(isolatedContainer);

      const result = await isolatedService.addToCart({
        studentId: 'test',
        menuItemId: 'isolated-item',
        quantity: 1
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ITEM_UNAVAILABLE');
    });

    it('should support testing with partial mock overrides', () => {
      const customContainer = getTestContainer({
        menuItemRepository: {
          ...mockContainer.menuItemRepository,
          nameExists: jest.fn().mockResolvedValue(true) // Custom mock for this test
        }
      });

      const customService = new EnhancedOrderService(customContainer);
      
      // Verify custom mock was applied
      expect(jest.isMockFunction(customContainer.menuItemRepository.nameExists)).toBe(true);
      
      // Verify other mocks are still defaults
      expect(jest.isMockFunction(customContainer.menuItemRepository.findById)).toBe(true);
    });
  });
});