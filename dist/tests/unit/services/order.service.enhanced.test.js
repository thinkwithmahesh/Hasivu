"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_service_enhanced_1 = require("../../../src/services/order.service.enhanced");
const ServiceContainer_1 = require("../../../src/container/ServiceContainer");
describe('EnhancedOrderService', () => {
    let orderService;
    let container;
    let mockContainer;
    beforeEach(() => {
        container = (0, ServiceContainer_1.getTestContainer)();
        mockContainer = container;
        orderService = new order_service_enhanced_1.EnhancedOrderService(container);
        jest.clearAllMocks();
    });
    describe('createOrder', () => {
        const validOrderInput = {
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
            deliveryDate: new Date(Date.now() + 86400000),
            deliveryType: 'pickup'
        };
        it('should create order successfully with valid input', async () => {
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
            mockContainer.menuItemRepository.findMany.mockResolvedValue({
                items: [mockMenuItem],
                total: 1
            });
            mockContainer.userRepository.findById.mockResolvedValue(mockStudent);
            mockContainer.databaseService.transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    order: {
                        create: jest.fn().mockResolvedValue(mockOrder)
                    }
                };
                return await callback(mockTx);
            });
            mockContainer.orderItemRepository.createMany.mockResolvedValue({
                count: 1
            });
            mockContainer.redisService.del.mockResolvedValue();
            mockContainer.notificationService.sendOrderConfirmation.mockResolvedValue();
            const result = await orderService.createOrder(validOrderInput);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockOrder);
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
            mockContainer.menuItemRepository.findMany.mockResolvedValue({
                items: [],
                total: 0
            });
            const result = await orderService.createOrder(validOrderInput);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ITEMS_UNAVAILABLE');
            expect(result.error?.message).toContain('Menu items not available');
            expect(mockContainer.databaseService.transaction).not.toHaveBeenCalled();
            expect(mockContainer.notificationService.sendOrderConfirmation).not.toHaveBeenCalled();
        });
        it('should validate delivery date is not in the past', async () => {
            const invalidInput = {
                ...validOrderInput,
                deliveryDate: new Date(Date.now() - 86400000)
            };
            const result = await orderService.createOrder(invalidInput);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_DELIVERY_DATE');
            expect(mockContainer.menuItemRepository.findMany).not.toHaveBeenCalled();
        });
        it('should validate order cutoff time', async () => {
            const cutoffInput = {
                ...validOrderInput,
                deliveryDate: new Date(Date.now() + 3600000)
            };
            const result = await orderService.createOrder(cutoffInput);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ORDER_CUTOFF_PASSED');
        });
        it('should validate quantity limits', async () => {
            const invalidQuantityInput = {
                ...validOrderInput,
                items: [
                    {
                        menuItemId: 'menu-item-123',
                        quantity: 15,
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
            mockContainer.menuItemRepository.findMany.mockResolvedValue({
                items: [mockMenuItem],
                total: 1
            });
            mockContainer.userRepository.findById.mockResolvedValue({
                id: 'student-123'
            });
            const result = await orderService.createOrder(invalidQuantityInput);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('QUANTITY_EXCEEDED');
            expect(result.error?.message).toContain('exceeds maximum allowed');
        });
    });
    describe('addToCart', () => {
        const validCartInput = {
            studentId: 'student-123',
            menuItemId: 'menu-item-123',
            quantity: 2,
            specialInstructions: 'Extra cheese'
        };
        it('should add item to cart successfully', async () => {
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
            mockContainer.menuItemRepository.findById.mockResolvedValue(mockMenuItem);
            mockContainer.redisService.get.mockResolvedValue(existingCart);
            mockContainer.redisService.set.mockResolvedValue();
            const result = await orderService.addToCart(validCartInput);
            expect(result.success).toBe(true);
            expect(result.data?.items).toHaveLength(1);
            expect(result.data?.items[0].menuItemId).toBe('menu-item-123');
            expect(result.data?.items[0].quantity).toBe(2);
            expect(result.data?.items[0].price).toBe(350.00);
            expect(result.data?.totalAmount).toBe(700.00);
            expect(mockContainer.redisService.get).toHaveBeenCalledWith('cart:student-123');
            expect(mockContainer.redisService.set).toHaveBeenCalledWith('cart:student-123', expect.any(String), 3600);
        });
        it('should return error when menu item is not available', async () => {
            mockContainer.menuItemRepository.findById.mockResolvedValue(null);
            const result = await orderService.addToCart(validCartInput);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ITEM_UNAVAILABLE');
            expect(mockContainer.redisService.get).not.toHaveBeenCalled();
            expect(mockContainer.redisService.set).not.toHaveBeenCalled();
        });
        it('should validate quantity limits for cart items', async () => {
            const invalidCartInput = {
                ...validCartInput,
                quantity: 15
            };
            const mockMenuItem = {
                id: 'menu-item-123',
                name: 'Test Pizza',
                price: 350.00,
                available: true
            };
            mockContainer.menuItemRepository.findById.mockResolvedValue(mockMenuItem);
            const result = await orderService.addToCart(invalidCartInput);
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
            mockContainer.menuItemRepository.findById.mockResolvedValue(mockMenuItem);
            mockContainer.redisService.get.mockResolvedValue(existingCart);
            mockContainer.redisService.set.mockResolvedValue();
            const result = await orderService.addToCart(validCartInput);
            expect(result.success).toBe(true);
            expect(result.data?.items).toHaveLength(1);
            expect(result.data?.items[0].quantity).toBe(3);
            expect(result.data?.items[0].specialInstructions).toBe('Extra cheese');
            expect(result.data?.totalAmount).toBe(1050.00);
        });
    });
    describe('getCart', () => {
        it('should return null for non-existent cart', async () => {
            mockContainer.redisService.get.mockResolvedValue(null);
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
            mockContainer.redisService.get.mockResolvedValue(JSON.stringify(cartData));
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
                expiresAt: new Date(Date.now() - 1000)
            };
            mockContainer.redisService.get.mockResolvedValue(JSON.stringify(expiredCartData));
            mockContainer.redisService.del.mockResolvedValue();
            const result = await orderService.getCart('student-123');
            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
            expect(mockContainer.redisService.del).toHaveBeenCalledWith('cart:student-123');
        });
    });
    describe('clearCart', () => {
        it('should clear cart successfully', async () => {
            mockContainer.redisService.del.mockResolvedValue();
            await orderService.clearCart('student-123');
            expect(mockContainer.redisService.del).toHaveBeenCalledWith('cart:student-123');
        });
        it('should handle Redis errors gracefully', async () => {
            mockContainer.redisService.del.mockRejectedValue(new Error('Redis connection failed'));
            await expect(orderService.clearCart('student-123')).resolves.toBeUndefined();
        });
    });
    describe('Dependency Injection Benefits', () => {
        it('should allow easy mocking of all dependencies', () => {
            expect(jest.isMockFunction(mockContainer.orderRepository.create)).toBe(true);
            expect(jest.isMockFunction(mockContainer.menuItemRepository.findById)).toBe(true);
            expect(jest.isMockFunction(mockContainer.userRepository.findByEmail)).toBe(true);
            expect(jest.isMockFunction(mockContainer.databaseService.transaction)).toBe(true);
            expect(jest.isMockFunction(mockContainer.notificationService.sendOrderConfirmation)).toBe(true);
            expect(jest.isMockFunction(mockContainer.paymentService.processPayment)).toBe(true);
            expect(jest.isMockFunction(mockContainer.redisService.get)).toBe(true);
        });
        it('should enable isolated testing without external dependencies', async () => {
            const isolatedContainer = (0, ServiceContainer_1.getTestContainer)({
                menuItemRepository: {
                    ...mockContainer.menuItemRepository,
                    findById: jest.fn().mockResolvedValue({ id: 'isolated-item', available: false })
                }
            });
            const isolatedService = new order_service_enhanced_1.EnhancedOrderService(isolatedContainer);
            const result = await isolatedService.addToCart({
                studentId: 'test',
                menuItemId: 'isolated-item',
                quantity: 1
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ITEM_UNAVAILABLE');
        });
        it('should support testing with partial mock overrides', () => {
            const customContainer = (0, ServiceContainer_1.getTestContainer)({
                menuItemRepository: {
                    ...mockContainer.menuItemRepository,
                    nameExists: jest.fn().mockResolvedValue(true)
                }
            });
            const customService = new order_service_enhanced_1.EnhancedOrderService(customContainer);
            expect(jest.isMockFunction(customContainer.menuItemRepository.nameExists)).toBe(true);
            expect(jest.isMockFunction(customContainer.menuItemRepository.findById)).toBe(true);
        });
    });
});
//# sourceMappingURL=order.service.enhanced.test.js.map