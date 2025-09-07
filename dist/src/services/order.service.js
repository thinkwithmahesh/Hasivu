"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = exports.OrderStatus = void 0;
const order_repository_1 = require("../repositories/order.repository");
const orderItem_repository_1 = require("../repositories/orderItem.repository");
const paymentOrder_repository_1 = require("../repositories/paymentOrder.repository");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const user_repository_1 = require("../repositories/user.repository");
const database_service_1 = require("./database.service");
const payment_service_1 = require("./payment.service");
const notification_service_1 = require("./notification.service");
const redis_service_1 = require("./redis.service");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
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
class OrderService {
    static CACHE_TTL = 300;
    static CART_EXPIRY = 3600;
    static MAX_QUANTITY_PER_ITEM = 10;
    static ORDER_CUTOFF_HOURS = 2;
    static VALID_STATUS_TRANSITIONS = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
        [OrderStatus.READY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
    };
    static async createOrder(input) {
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
            const menuItems = await menuItem_repository_1.MenuItemRepository.findMany({
                filters: {
                    schoolId: input.schoolId,
                    available: true
                },
                ids: menuItemIds
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
            const student = await user_repository_1.UserRepository.findById(input.studentId);
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
            const order = await database_service_1.DatabaseService.transaction(async (tx) => {
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
                await tx.orderItem.createMany({
                    data: orderItems.map(item => ({
                        ...item,
                        orderId: createdOrder.id
                    }))
                });
                return createdOrder;
            });
            await this.clearCart(input.studentId);
            await notification_service_1.NotificationService.sendOrderConfirmation({
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
    static async addToCart(input) {
        try {
            logger_1.logger.info('Adding item to cart', {
                studentId: input.studentId,
                menuItemId: input.menuItemId
            });
            const menuItem = await menuItem_repository_1.MenuItemRepository.findById(input.menuItemId);
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
            const existingCartData = await redis_service_1.RedisService.get(cartKey);
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
            await redis_service_1.RedisService.set(cartKey, JSON.stringify(cart), this.CART_EXPIRY);
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
    static async updateOrderStatus(orderId, newStatus, message) {
        try {
            logger_1.logger.info('Updating order status', { orderId, newStatus });
            const existingOrder = await order_repository_1.OrderRepository.findById(orderId);
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
            const currentHistory = existingOrder.statusHistory ?
                JSON.parse(existingOrder.statusHistory) : [];
            const newHistoryEntry = {
                status: newStatus,
                timestamp: new Date(),
                message: message || `Order status updated to ${newStatus}`
            };
            currentHistory.push(newHistoryEntry);
            const updatedOrder = await order_repository_1.OrderRepository.update(orderId, {
                status: newStatus,
                updatedAt: new Date()
            });
            await notification_service_1.NotificationService.sendOrderStatusUpdate({
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
    static async processOrderPayment(input) {
        try {
            logger_1.logger.info('Processing order payment', {
                orderId: input.orderId,
                paymentMethod: input.paymentMethod
            });
            const order = await order_repository_1.OrderRepository.findById(input.orderId);
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
            const paymentOrder = await paymentOrder_repository_1.PaymentOrderRepository.create(paymentOrderData);
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
                paymentResult = await payment_service_1.PaymentService.processPayment({
                    orderId: input.orderId,
                    amount: Number(order.totalAmount),
                    currency: 'INR',
                    paymentMethodId: input.paymentMethod
                });
            }
            if (!paymentResult.success) {
                await paymentOrder_repository_1.PaymentOrderRepository.update(paymentOrder.id, {
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
            await paymentOrder_repository_1.PaymentOrderRepository.update(paymentOrder.id, {
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
    static async getOrderTracking(orderId) {
        try {
            const cacheKey = `order_tracking:${orderId}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return { success: true, data: JSON.parse(cached) };
            }
            const order = await order_repository_1.OrderRepository.findByIdWithIncludes(orderId, {
                orderItems: {
                    include: {
                        menuItem: true
                    }
                },
                deliveryVerifications: {
                    include: {
                        card: true,
                        reader: true
                    }
                }
            });
            if (!order) {
                return {
                    success: false,
                    error: {
                        message: `Order with ID ${orderId} not found`,
                        code: 'ORDER_NOT_FOUND'
                    }
                };
            }
            const timeline = [];
            let estimatedDelivery;
            if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
                estimatedDelivery = new Date(order.deliveryDate);
                estimatedDelivery.setHours(12, 0, 0, 0);
            }
            const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
            let deliveryDetails;
            const orderWithIncludes = order;
            if (orderWithIncludes.deliveryVerifications && orderWithIncludes.deliveryVerifications.length > 0) {
                const verification = orderWithIncludes.deliveryVerifications[0];
                deliveryDetails = {
                    verifiedAt: verification.verifiedAt,
                    location: verification.rfidReader?.location || 'Unknown',
                    rfidData: {
                        cardNumber: verification.rfidCard?.cardNumber,
                        readerLocation: verification.rfidReader?.location
                    }
                };
            }
            const trackingData = {
                ...order,
                timeline,
                estimatedDelivery,
                canCancel,
                deliveryDetails
            };
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(trackingData));
            return {
                success: true,
                data: trackingData
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get order tracking', error, { orderId });
            return {
                success: false,
                error: {
                    message: 'Failed to get order tracking',
                    code: 'TRACKING_FAILED',
                    details: error
                }
            };
        }
    }
    static async getOrdersByStudent(studentId, query = {}) {
        try {
            const page = query.page || 1;
            const limit = Math.min(query.limit || 10, 50);
            const skip = (page - 1) * limit;
            const filters = { studentId };
            if (query.status)
                filters.status = query.status;
            if (query.dateFrom || query.dateTo) {
                filters.createdAt = {};
                if (query.dateFrom)
                    filters.createdAt.gte = query.dateFrom;
                if (query.dateTo)
                    filters.createdAt.lte = query.dateTo;
            }
            if (query.schoolId)
                filters.schoolId = query.schoolId;
            const result = await order_repository_1.OrderRepository.findMany({
                filters,
                skip,
                take: limit,
                sortBy: query.sortBy || 'createdAt',
                sortOrder: query.sortOrder || 'desc',
                include: {
                    orderItems: {
                        include: {
                            menuItem: true
                        }
                    }
                }
            });
            const total = await order_repository_1.OrderRepository.count(filters);
            const totalPages = Math.ceil(total / limit);
            return {
                success: true,
                data: {
                    orders: result.items,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages
                    }
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get orders by student', error, { studentId, query });
            return {
                success: false,
                error: {
                    message: 'Failed to get orders',
                    code: 'ORDERS_FETCH_FAILED',
                    details: error
                }
            };
        }
    }
    static async cancelOrder(orderId, reason) {
        try {
            logger_1.logger.info('Cancelling order', { orderId, reason });
            const order = await order_repository_1.OrderRepository.findById(orderId);
            if (!order) {
                return {
                    success: false,
                    error: {
                        message: `Order with ID ${orderId} not found`,
                        code: 'ORDER_NOT_FOUND'
                    }
                };
            }
            if (!['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)) {
                return {
                    success: false,
                    error: {
                        message: `Order with status ${order.status} cannot be cancelled`,
                        code: 'CANCELLATION_NOT_ALLOWED'
                    }
                };
            }
            let refundResult;
            const paymentOrder = await paymentOrder_repository_1.PaymentOrderRepository.findByOrderId(orderId);
            if (paymentOrder && paymentOrder.status === 'captured') {
                const metadata = JSON.parse(paymentOrder.metadata || '{}');
                const paymentId = metadata.paymentId || '';
                refundResult = {
                    success: false,
                    error: { message: 'Refund processing not implemented', code: 'NOT_IMPLEMENTED' }
                };
                if (!refundResult.success) {
                    logger_1.logger.warn('Refund processing failed', { orderId, error: refundResult.error });
                }
            }
            const cancelledOrder = await this.updateOrderStatus(orderId, OrderStatus.CANCELLED, `Cancelled: ${reason}`);
            if (!cancelledOrder.success) {
                return cancelledOrder;
            }
            const result = {
                ...cancelledOrder.data,
                refundStatus: refundResult?.success ? refundResult.data?.status : 'not_applicable'
            };
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel order', error, { orderId, reason });
            return {
                success: false,
                error: {
                    message: 'Failed to cancel order',
                    code: 'CANCELLATION_FAILED',
                    details: error
                }
            };
        }
    }
    static async getOrderAnalytics(query) {
        try {
            const filters = {
                createdAt: {
                    gte: query.startDate,
                    lte: query.endDate
                }
            };
            if (query.schoolId)
                filters.schoolId = query.schoolId;
            const analytics = await order_repository_1.OrderRepository.getAnalytics(filters, query.groupBy);
            const result = {
                totalOrders: analytics.totalOrders,
                totalRevenue: analytics.totalRevenue,
                deliveryRate: (analytics.deliveredOrders / analytics.totalOrders) * 100,
                cancellationRate: (analytics.cancelledOrders / analytics.totalOrders) * 100,
                averageOrderValue: analytics.totalRevenue / analytics.totalOrders,
                ordersByStatus: {
                    [OrderStatus.PENDING]: analytics.ordersByStatus?.[OrderStatus.PENDING] || 0,
                    [OrderStatus.CONFIRMED]: analytics.ordersByStatus?.[OrderStatus.CONFIRMED] || 0,
                    [OrderStatus.PREPARING]: analytics.ordersByStatus?.[OrderStatus.PREPARING] || 0,
                    [OrderStatus.READY]: analytics.ordersByStatus?.[OrderStatus.READY] || 0,
                    [OrderStatus.OUT_FOR_DELIVERY]: analytics.ordersByStatus?.[OrderStatus.OUT_FOR_DELIVERY] || 0,
                    [OrderStatus.DELIVERED]: analytics.ordersByStatus?.[OrderStatus.DELIVERED] || 0,
                    [OrderStatus.CANCELLED]: analytics.ordersByStatus?.[OrderStatus.CANCELLED] || 0
                },
                revenueByDay: analytics.revenueByDay
            };
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get order analytics', error, { query });
            return {
                success: false,
                error: {
                    message: 'Failed to get analytics',
                    code: 'ANALYTICS_FAILED',
                    details: error
                }
            };
        }
    }
    static async getPopularItems(query) {
        try {
            const filters = {};
            if (query.schoolId)
                filters.schoolId = query.schoolId;
            if (query.startDate || query.endDate) {
                filters.createdAt = {};
                if (query.startDate)
                    filters.createdAt.gte = query.startDate;
                if (query.endDate)
                    filters.createdAt.lte = query.endDate;
            }
            const popularItems = await orderItem_repository_1.OrderItemRepository.getPopularItems(filters, query.limit || 10);
            return {
                success: true,
                data: popularItems
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get popular items', error, { query });
            return {
                success: false,
                error: {
                    message: 'Failed to get popular items',
                    code: 'POPULAR_ITEMS_FAILED',
                    details: error
                }
            };
        }
    }
    static async clearCart(studentId) {
        try {
            const cartKey = `cart:${studentId}`;
            await redis_service_1.RedisService.del(cartKey);
            logger_1.logger.info('Cart cleared', { studentId });
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear cart', { studentId, error });
        }
    }
    static async getCart(studentId) {
        try {
            const cartKey = `cart:${studentId}`;
            const cartData = await redis_service_1.RedisService.get(cartKey);
            if (!cartData) {
                return {
                    success: true,
                    data: null
                };
            }
            const cart = JSON.parse(cartData);
            if (new Date() > new Date(cart.expiresAt)) {
                await redis_service_1.RedisService.del(cartKey);
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
    static async validateOrderInput(input) {
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
    static async checkDietaryRestrictions(menuItems, dietaryRestrictions, allergies) {
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
            if (menuItem.tags && userRestrictions.length > 0) {
                const itemTags = JSON.parse(menuItem.tags);
            }
        }
        return { success: true };
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order.service.js.map