"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedOrderService = exports.OrderStatus = void 0;
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PREPARING"] = "PREPARING";
    OrderStatus["READY"] = "READY";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class EnhancedOrderService {
    container;
    CACHE_TTL = 300;
    CART_EXPIRY = 3600;
    MAX_QUANTITY_PER_ITEM = 10;
    ORDER_CUTOFF_HOURS = 2;
    VALID_STATUS_TRANSITIONS = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
        [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
    };
    constructor(container) {
        this.container = container;
    }
    async createOrder(input) {
        try {
            logger_1.logger.info('Creating order', {
                studentId: input.studentId,
                itemCount: input.items.length
            });
            const validation = await this.validateOrderInput(input);
            if (!validation.success) {
                return validation;
            }
            const menuItemIds = input.items.map(item => item.menuItemId);
            const menuItems = await this.container.menuItemRepository.findMany({
                where: {
                    id: { in: menuItemIds },
                    schoolId: input.schoolId,
                    available: true
                }
            });
            if (menuItems.items.length !== menuItemIds.length) {
                const foundIds = menuItems.items.map(item => item.id);
                const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
                return {
                    success: false,
                    error: {
                        message: `Menu items not available: ${missingIds.join(', ')}`,
                        code: 'ITEMS_UNAVAILABLE'
                    }
                };
            }
            const student = await this.container.userRepository.findById(input.studentId);
            const dietaryRestrictions = student?.dietaryRestrictions;
            const allergies = student?.allergies;
            if (dietaryRestrictions || allergies) {
                const restrictionCheck = await this.checkDietaryRestrictions(menuItems.items, dietaryRestrictions, allergies);
                if (!restrictionCheck.success) {
                    return restrictionCheck;
                }
            }
            let totalAmount = 0;
            const orderItems = [];
            for (const inputItem of input.items) {
                const menuItem = menuItems.items.find(mi => mi.id === inputItem.menuItemId);
                if (!menuItem)
                    continue;
                if (inputItem.quantity > this.MAX_QUANTITY_PER_ITEM) {
                    return {
                        success: false,
                        error: {
                            message: `Quantity for ${menuItem.name} exceeds maximum allowed (${this.MAX_QUANTITY_PER_ITEM})`,
                            code: 'QUANTITY_EXCEEDED'
                        }
                    };
                }
                const itemTotal = Number(menuItem.price) * inputItem.quantity;
                totalAmount += itemTotal;
                orderItems.push({
                    id: (0, uuid_1.v4)(),
                    menuItemId: inputItem.menuItemId,
                    quantity: inputItem.quantity,
                    unitPrice: Number(menuItem.price),
                    totalPrice: Number(menuItem.price) * inputItem.quantity,
                    notes: inputItem.specialInstructions || null,
                    customizations: inputItem.customizations ? JSON.stringify(inputItem.customizations) : "{}"
                });
            }
            const order = await this.container.databaseService.transaction(async (tx) => {
                const orderData = {
                    id: (0, uuid_1.v4)(),
                    orderNumber: `ORD-${Date.now()}`,
                    user: { connect: { id: input.parentId } },
                    student: { connect: { id: input.studentId } },
                    school: { connect: { id: input.schoolId } },
                    totalAmount: totalAmount,
                    status: 'pending',
                    deliveryDate: input.deliveryDate,
                    metadata: JSON.stringify({
                        deliveryType: input.deliveryType,
                        deliveryTime: input.deliveryTime,
                        deliveryAddress: input.deliveryAddress,
                        specialInstructions: input.specialInstructions,
                        ...input.metadata
                    })
                };
                const createdOrder = await tx.order.create({ data: orderData });
                await this.container.orderItemRepository.createMany(orderItems.map(item => ({
                    ...item,
                    orderId: createdOrder.id
                })));
                return createdOrder;
            });
            await this.clearCart(input.studentId);
            await this.container.notificationService.sendOrderConfirmation({
                orderId: order.id,
                studentId: input.studentId,
                parentId: input.parentId,
                totalAmount: totalAmount,
                deliveryDate: input.deliveryDate
            }).catch(error => {
                logger_1.logger.warn('Failed to send order confirmation notification', error);
            });
            logger_1.logger.info('Order created successfully', {
                orderId: order.id,
                totalAmount: totalAmount
            });
            return {
                success: true,
                data: order
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create order', error, { input });
            if (error instanceof Error && error.message.includes('Unique constraint')) {
                return {
                    success: false,
                    error: {
                        message: 'Order already exists',
                        code: 'DUPLICATE_ORDER'
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: 'Failed to create order',
                    code: 'ORDER_CREATION_FAILED',
                    details: error
                }
            };
        }
    }
    async addToCart(input) {
        try {
            logger_1.logger.info('Adding item to cart', {
                studentId: input.studentId,
                menuItemId: input.menuItemId
            });
            const menuItem = await this.container.menuItemRepository.findById(input.menuItemId);
            if (!menuItem || !menuItem.available) {
                return {
                    success: false,
                    error: {
                        message: `Menu item not available`,
                        code: 'ITEM_UNAVAILABLE'
                    }
                };
            }
            if (input.quantity > this.MAX_QUANTITY_PER_ITEM) {
                return {
                    success: false,
                    error: {
                        message: `Quantity exceeds maximum allowed (${this.MAX_QUANTITY_PER_ITEM})`,
                        code: 'QUANTITY_EXCEEDED'
                    }
                };
            }
            const cartKey = `cart:${input.studentId}`;
            const existingCartData = await this.container.redisService.get(cartKey);
            let cart = existingCartData ?
                JSON.parse(existingCartData) :
                { items: [], totalAmount: 0, lastUpdated: new Date(), expiresAt: new Date() };
            const existingItemIndex = cart.items.findIndex(item => item.menuItemId === input.menuItemId);
            const itemPrice = Number(menuItem.price);
            const cartItem = {
                menuItemId: input.menuItemId,
                quantity: input.quantity,
                price: itemPrice,
                specialInstructions: input.specialInstructions,
                customizations: input.customizations
            };
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += input.quantity;
                cart.items[existingItemIndex].specialInstructions = input.specialInstructions;
                cart.items[existingItemIndex].customizations = input.customizations;
            }
            else {
                cart.items.push(cartItem);
            }
            cart.totalAmount = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            cart.lastUpdated = new Date();
            cart.expiresAt = new Date(Date.now() + this.CART_EXPIRY * 1000);
            await this.container.redisService.set(cartKey, JSON.stringify(cart), this.CART_EXPIRY);
            logger_1.logger.info('Item added to cart successfully', {
                studentId: input.studentId,
                cartTotal: cart.totalAmount,
                itemCount: cart.items.length
            });
            return {
                success: true,
                data: cart
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to add item to cart', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to add item to cart',
                    code: 'CART_UPDATE_FAILED',
                    details: error
                }
            };
        }
    }
    async updateOrderStatus(orderId, newStatus, message) {
        try {
            logger_1.logger.info('Updating order status', { orderId, newStatus });
            const existingOrder = await this.container.orderRepository.findById(orderId);
            if (!existingOrder) {
                return {
                    success: false,
                    error: {
                        message: `Order with ID ${orderId} not found`,
                        code: 'ORDER_NOT_FOUND'
                    }
                };
            }
            const validTransitions = this.VALID_STATUS_TRANSITIONS[existingOrder.status];
            if (!validTransitions.includes(newStatus)) {
                return {
                    success: false,
                    error: {
                        message: `Invalid status transition from ${existingOrder.status} to ${newStatus}`,
                        code: 'INVALID_STATUS_TRANSITION'
                    }
                };
            }
            const updatedOrder = await this.container.orderRepository.update(orderId, {
                status: newStatus,
                updatedAt: new Date()
            });
            await this.container.notificationService.sendOrderStatusUpdate({
                orderId: orderId,
                studentId: existingOrder.studentId,
                parentId: existingOrder.parentId || existingOrder.userId,
                newStatus: newStatus,
                message: message
            }).catch(error => {
                logger_1.logger.warn('Failed to send status update notification', error);
            });
            logger_1.logger.info('Order status updated successfully', { orderId, newStatus });
            return {
                success: true,
                data: updatedOrder
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update order status', error, { orderId, newStatus });
            return {
                success: false,
                error: {
                    message: 'Failed to update order status',
                    code: 'STATUS_UPDATE_FAILED',
                    details: error
                }
            };
        }
    }
    async processOrderPayment(input) {
        try {
            logger_1.logger.info('Processing order payment', {
                orderId: input.orderId,
                paymentMethod: input.paymentMethod
            });
            const order = await this.container.orderRepository.findById(input.orderId);
            if (!order) {
                return {
                    success: false,
                    error: {
                        message: `Order with ID ${input.orderId} not found`,
                        code: 'ORDER_NOT_FOUND'
                    }
                };
            }
            const paymentOrderData = {
                id: (0, uuid_1.v4)(),
                razorpayOrderId: `razorpay_${(0, uuid_1.v4)()}`,
                userId: order.userId,
                orderId: input.orderId,
                amount: Math.round(order.totalAmount * 100),
                currency: 'INR',
                status: 'pending',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                metadata: JSON.stringify(input.paymentDetails || {})
            };
            const paymentOrder = await this.container.paymentOrderRepository.create(paymentOrderData);
            let paymentResult;
            if (input.paymentMethod === 'cash') {
                paymentResult = {
                    success: true,
                    data: {
                        paymentId: paymentOrder.id,
                        status: 'captured',
                        paymentMethod: 'cash'
                    }
                };
            }
            else {
                paymentResult = await this.container.paymentService.processPayment({
                    orderId: input.orderId,
                    amount: Number(order.totalAmount),
                    currency: 'INR',
                    paymentMethodId: input.paymentMethod
                });
            }
            if (!paymentResult.success) {
                await this.container.paymentOrderRepository.update(paymentOrder.id, {
                    status: 'failed',
                    metadata: JSON.stringify({
                        error: paymentResult.error?.message,
                        failedAt: new Date().toISOString()
                    })
                });
                return {
                    success: false,
                    error: {
                        message: paymentResult.error?.message || 'Payment failed',
                        code: 'PAYMENT_FAILED',
                        details: paymentResult.error
                    }
                };
            }
            await this.container.paymentOrderRepository.update(paymentOrder.id, {
                status: paymentResult.data.status,
                metadata: JSON.stringify({
                    paymentId: paymentResult.data.paymentId,
                    paidAt: new Date().toISOString(),
                    paymentDetails: paymentResult.data
                })
            });
            if (paymentResult.data.status === 'captured') {
                await this.updateOrderStatus(input.orderId, OrderStatus.CONFIRMED, 'Payment confirmed');
            }
            logger_1.logger.info('Order payment processed successfully', {
                orderId: input.orderId,
                paymentStatus: paymentResult.data.status
            });
            return {
                success: true,
                data: {
                    paymentId: paymentResult.data.paymentId,
                    paymentStatus: paymentResult.data.status,
                    paymentMethod: input.paymentMethod
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process order payment', error, { input });
            return {
                success: false,
                error: {
                    message: 'Failed to process payment',
                    code: 'PAYMENT_PROCESSING_FAILED',
                    details: error
                }
            };
        }
    }
    async clearCart(studentId) {
        try {
            const cartKey = `cart:${studentId}`;
            await this.container.redisService.del(cartKey);
            logger_1.logger.info('Cart cleared', { studentId });
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear cart', { studentId, error });
        }
    }
    async getCart(studentId) {
        try {
            const cartKey = `cart:${studentId}`;
            const cartData = await this.container.redisService.get(cartKey);
            if (!cartData) {
                return {
                    success: true,
                    data: null
                };
            }
            const cart = JSON.parse(cartData);
            if (new Date() > new Date(cart.expiresAt)) {
                await this.container.redisService.del(cartKey);
                return {
                    success: true,
                    data: null
                };
            }
            return {
                success: true,
                data: cart
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get cart', error, { studentId });
            return {
                success: false,
                error: {
                    message: 'Failed to get cart',
                    code: 'CART_FETCH_FAILED',
                    details: error
                }
            };
        }
    }
    async validateOrderInput(input) {
        if (input.deliveryDate < new Date()) {
            return {
                success: false,
                error: {
                    message: 'Delivery date cannot be in the past',
                    code: 'INVALID_DELIVERY_DATE'
                }
            };
        }
        const cutoffTime = new Date(input.deliveryDate);
        cutoffTime.setHours(cutoffTime.getHours() - this.ORDER_CUTOFF_HOURS);
        if (new Date() > cutoffTime) {
            return {
                success: false,
                error: {
                    message: 'Order cutoff time has passed for the selected delivery date',
                    code: 'ORDER_CUTOFF_PASSED'
                }
            };
        }
        if (!input.items || input.items.length === 0) {
            return {
                success: false,
                error: {
                    message: 'Order must contain at least one item',
                    code: 'NO_ITEMS'
                }
            };
        }
        for (const item of input.items) {
            if (item.quantity <= 0) {
                return {
                    success: false,
                    error: {
                        message: 'Item quantity must be greater than 0',
                        code: 'INVALID_QUANTITY'
                    }
                };
            }
        }
        return { success: true };
    }
    async checkDietaryRestrictions(menuItems, dietaryRestrictions, allergies) {
        if (!dietaryRestrictions && !allergies) {
            return { success: true };
        }
        const userRestrictions = dietaryRestrictions ?
            JSON.parse(dietaryRestrictions) : [];
        const userAllergies = allergies ?
            JSON.parse(allergies) : [];
        for (const menuItem of menuItems) {
            if (menuItem.allergens && userAllergies.length > 0) {
                const itemAllergens = JSON.parse(menuItem.allergens);
                const conflictingAllergens = itemAllergens.filter((allergen) => userAllergies.includes(allergen));
                if (conflictingAllergens.length > 0) {
                    return {
                        success: false,
                        error: {
                            message: `Item "${menuItem.name}" contains allergens that conflict with dietary restrictions or allergies`,
                            code: 'DIETARY_RESTRICTION_CONFLICT'
                        }
                    };
                }
            }
        }
        return { success: true };
    }
}
exports.EnhancedOrderService = EnhancedOrderService;
//# sourceMappingURL=order.service.enhanced.js.map