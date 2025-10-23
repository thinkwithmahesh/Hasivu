"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = exports.OrderStatus = void 0;
const client_1 = require("@prisma/client");
const order_repository_1 = require("../repositories/order.repository");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const user_repository_1 = require("../repositories/user.repository");
const redis_service_1 = require("./redis.service");
const notification_service_1 = require("./notification.service");
const payment_service_1 = require("./payment.service");
const paymentOrder_repository_1 = require("../repositories/paymentOrder.repository");
const orderItem_repository_1 = require("../repositories/orderItem.repository");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY"] = "ready";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["COMPLETED"] = "completed";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class OrderService {
    static instance;
    prisma;
    orderRepo;
    menuItemRepo;
    userRepo;
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.orderRepo = new order_repository_1.OrderRepository();
        this.menuItemRepo = new menuItem_repository_1.MenuItemRepository();
        this.userRepo = new user_repository_1.UserRepository();
    }
    static getInstance() {
        if (!OrderService.instance) {
            OrderService.instance = new OrderService();
        }
        return OrderService.instance;
    }
    static async createOrder(orderData) {
        try {
            if (orderData.deliveryDate <= new Date()) {
                return {
                    success: false,
                    error: { message: 'Delivery date cannot be in the past', code: 'INVALID_DELIVERY_DATE' },
                };
            }
            const menuItemIds = orderData.items.map(item => item.menuItemId);
            const menuItemsResult = await menuItem_repository_1.MenuItemRepository.findMany({
                filters: { schoolId: orderData.schoolId, available: true, ids: menuItemIds },
            });
            if (menuItemsResult.items.length !== orderData.items.length) {
                return {
                    success: false,
                    error: { message: 'Some menu items are not available', code: 'ITEMS_UNAVAILABLE' },
                };
            }
            let totalAmount = 0;
            const itemsWithPrices = orderData.items.map(item => {
                const menuItem = menuItemsResult.items.find((mi) => mi.id === item.menuItemId);
                if (!menuItem)
                    throw new Error('Menu item not found');
                const price = Number(menuItem.price);
                totalAmount += price * item.quantity;
                return {
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price,
                };
            });
            const createData = {
                schoolId: orderData.schoolId,
                studentId: orderData.studentId,
                items: itemsWithPrices,
                totalAmount,
                deliveryTime: orderData.deliveryDate,
            };
            const order = await this.getInstance().create(createData);
            return { success: true, data: order };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to create order',
                    code: 'ORDER_CREATION_FAILED',
                },
            };
        }
    }
    static async addToCart(cartData) {
        try {
            const menuItem = await menuItem_repository_1.MenuItemRepository.findById(cartData.menuItemId);
            if (!menuItem || !menuItem.available) {
                return {
                    success: false,
                    error: { message: 'Menu item not available', code: 'ITEM_UNAVAILABLE' },
                };
            }
            const cartKey = `cart:${cartData.studentId}`;
            let cart = {
                items: [],
                totalAmount: 0,
                lastUpdated: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
            };
            const existingCart = await redis_service_1.RedisService.get(cartKey);
            if (existingCart) {
                const parsed = JSON.parse(existingCart);
                cart = {
                    ...parsed,
                    lastUpdated: new Date(parsed.lastUpdated),
                    expiresAt: new Date(parsed.expiresAt),
                };
            }
            const existingItemIndex = cart.items.findIndex(item => item.menuItemId === cartData.menuItemId);
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += cartData.quantity;
            }
            else {
                cart.items.push({
                    menuItemId: cartData.menuItemId,
                    quantity: cartData.quantity,
                    price: Number(menuItem.price),
                    specialInstructions: cartData.specialInstructions,
                });
            }
            cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            cart.lastUpdated = new Date();
            cart.expiresAt = new Date(Date.now() + 3600000);
            await redis_service_1.RedisService.set(cartKey, JSON.stringify(cart), 3600);
            return { success: true, data: cart };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to add to cart', code: 'CART_UPDATE_FAILED' },
            };
        }
    }
    static async updateOrderStatus(orderId, newStatus, message) {
        try {
            const order = await this.getInstance().orderRepo.findById(orderId);
            if (!order) {
                return {
                    success: false,
                    error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
                };
            }
            if (!this.isValidStatusTransition(order.status, newStatus)) {
                return {
                    success: false,
                    error: { message: 'Invalid status transition', code: 'INVALID_STATUS_TRANSITION' },
                };
            }
            const updatedOrder = await this.getInstance().orderRepo.updateStatus(orderId, newStatus);
            await notification_service_1.NotificationService.sendOrderStatusUpdate({
                orderId,
                studentId: order.studentId,
                parentId: order.userId,
                newStatus,
                message,
            });
            return { success: true, data: updatedOrder };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to update order status',
                    code: 'STATUS_UPDATE_FAILED',
                },
            };
        }
    }
    static async processOrderPayment(paymentData) {
        try {
            const order = await this.getInstance().orderRepo.findById(paymentData.orderId);
            if (!order) {
                return {
                    success: false,
                    error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
                };
            }
            await paymentOrder_repository_1.PaymentOrderRepository.create({
                razorpayOrderId: `order_${paymentData.orderId}_${Date.now()}`,
                amount: Math.round(order.totalAmount * 100),
                currency: 'INR',
                status: 'created',
                userId: order.userId,
                orderId: paymentData.orderId,
                metadata: JSON.stringify(paymentData.paymentDetails || {}),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });
            const paymentResult = await payment_service_1.PaymentService.processPayment({
                orderId: paymentData.orderId,
                amount: order.totalAmount,
                currency: 'INR',
                paymentMethod: paymentData.paymentMethod,
                paymentDetails: paymentData.paymentDetails,
            });
            if (!paymentResult.success) {
                return {
                    success: false,
                    error: {
                        message: paymentResult.error?.message || 'Payment failed',
                        code: 'PAYMENT_FAILED',
                    },
                };
            }
            await this.updateOrderStatus(paymentData.orderId, 'confirmed');
            return {
                success: true,
                data: {
                    paymentStatus: 'captured',
                    paymentId: paymentResult.data?.paymentId,
                    orderId: paymentData.orderId,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Payment processing failed',
                    code: 'PAYMENT_PROCESSING_FAILED',
                },
            };
        }
    }
    static async getOrderTracking(orderId) {
        try {
            const order = (await this.getInstance().orderRepo.findByIdWithIncludes(orderId));
            if (!order) {
                return {
                    success: false,
                    error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
                };
            }
            const timeline = this.buildOrderTimeline(order);
            const estimatedDelivery = order.deliveryDate
                ? new Date(order.deliveryDate.getTime() + 30 * 60 * 1000)
                : null;
            const canCancel = ['pending', 'confirmed'].includes(order.status);
            const trackingData = {
                id: order.id,
                status: order.status,
                timeline,
                estimatedDelivery,
                canCancel,
                items: order.orderItems?.map((item) => ({
                    name: item.menuItem?.name,
                    quantity: item.quantity,
                })) || [],
            };
            if (order.status === 'delivered' && order.deliveryVerifications?.length > 0) {
                const verification = order.deliveryVerifications[0];
                trackingData.deliveryDetails = {
                    verifiedAt: verification.verifiedAt,
                    location: verification.location,
                    cardNumber: verification.card?.cardNumber,
                };
            }
            return { success: true, data: trackingData };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to get order tracking',
                    code: 'TRACKING_FAILED',
                },
            };
        }
    }
    static async getOrdersByStudent(studentId, query) {
        try {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;
            const result = await this.getInstance().orderRepo.findMany({
                filters: {
                    studentId,
                    ...(query.status && { status: query.status }),
                },
                skip,
                take: limit,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            const totalPages = Math.ceil(result.total / limit);
            return {
                success: true,
                data: {
                    orders: result.items,
                    pagination: {
                        total: result.total,
                        page,
                        limit,
                        totalPages,
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to get orders', code: 'ORDERS_FETCH_FAILED' },
            };
        }
    }
    static async cancelOrder(orderId, cancellationReason) {
        try {
            const order = await this.getInstance().findById(orderId);
            if (!order) {
                return {
                    success: false,
                    error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' },
                };
            }
            if (order.status === 'completed' || order.status === 'cancelled') {
                return {
                    success: false,
                    error: {
                        message: `Cannot cancel ${order.status} order`,
                        code: 'CANCELLATION_NOT_ALLOWED',
                    },
                };
            }
            const cancelledOrder = await this.getInstance().updateStatus(orderId, 'cancelled');
            let paymentStatus = 'none';
            const paymentOrder = await paymentOrder_repository_1.PaymentOrderRepository.findByOrderId(orderId);
            if (paymentOrder && paymentOrder.status === 'captured') {
                const refundResult = await payment_service_1.PaymentService.refundPayment({
                    paymentId: paymentOrder.razorpayPaymentId || paymentOrder.id,
                    amount: paymentOrder.amount / 100,
                    reason: cancellationReason,
                });
                if (refundResult.success) {
                    paymentStatus = 'refunded';
                    await paymentOrder_repository_1.PaymentOrderRepository.update(paymentOrder.id, { status: 'refunded' });
                }
            }
            return {
                success: true,
                data: {
                    ...cancelledOrder,
                    paymentStatus,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to cancel order', code: 'CANCELLATION_FAILED' },
            };
        }
    }
    static async getOrderAnalytics(query) {
        try {
            const analytics = await this.getInstance().orderRepo.getAnalytics(query.schoolId, query.startDate, query.endDate);
            const deliveryRate = analytics.totalOrders > 0 ? (analytics.deliveredOrders / analytics.totalOrders) * 100 : 0;
            const cancellationRate = analytics.totalOrders > 0 ? (analytics.cancelledOrders / analytics.totalOrders) * 100 : 0;
            const averageOrderValue = analytics.totalOrders > 0 ? analytics.totalRevenue / analytics.totalOrders : 0;
            return {
                success: true,
                data: {
                    ...analytics,
                    deliveryRate,
                    cancellationRate,
                    averageOrderValue,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: { message: error.message || 'Failed to get analytics', code: 'ANALYTICS_FAILED' },
            };
        }
    }
    static async getPopularItems(query) {
        try {
            const popularItems = await orderItem_repository_1.OrderItemRepository.getPopularItems(query);
            return {
                success: true,
                data: popularItems,
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to get popular items',
                    code: 'POPULAR_ITEMS_FAILED',
                },
            };
        }
    }
    static buildOrderTimeline(order) {
        const timeline = [];
        timeline.push({
            status: order.status,
            timestamp: order.updatedAt || order.createdAt,
            description: this.getStatusDescription(order.status),
        });
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed'];
        const currentIndex = statusOrder.indexOf(order.status);
        for (let i = 0; i < currentIndex; i++) {
            timeline.unshift({
                status: statusOrder[i],
                timestamp: new Date(order.createdAt.getTime() + i * 10 * 60 * 1000),
                description: this.getStatusDescription(statusOrder[i]),
            });
        }
        return timeline;
    }
    static getStatusDescription(status) {
        const descriptions = {
            pending: 'Order placed successfully',
            confirmed: 'Order confirmed by kitchen',
            preparing: 'Order is being prepared',
            ready: 'Order is ready for delivery',
            delivered: 'Order delivered successfully',
            completed: 'Order completed',
            cancelled: 'Order cancelled',
        };
        return descriptions[status] || 'Status updated';
    }
    static isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['delivered'],
            delivered: ['completed'],
            cancelled: [],
            completed: [],
        };
        return validTransitions[currentStatus]?.includes(newStatus) ?? false;
    }
    async findById(id) {
        return await this.orderRepo.findById(id);
    }
    async findBySchool(schoolId) {
        return await this.orderRepo.findBySchool(schoolId);
    }
    async findByStudent(studentId) {
        return await this.orderRepo.findByStudent(studentId);
    }
    async findByStatus(schoolId, status) {
        return await this.orderRepo.findByStatus(schoolId, status);
    }
    async findAll(filters) {
        if (filters?.startDate && filters?.endDate && filters?.schoolId) {
            return await this.orderRepo.findByDateRange(filters.schoolId, filters.startDate, filters.endDate);
        }
        if (filters?.status && filters?.schoolId) {
            return await this.orderRepo.findByStatus(filters.schoolId, filters.status);
        }
        if (filters?.studentId) {
            return await this.orderRepo.findByStudent(filters.studentId);
        }
        if (filters?.schoolId) {
            return await this.orderRepo.findBySchool(filters.schoolId);
        }
        return await this.orderRepo.findAll();
    }
    async create(data) {
        const order = await this.orderRepo.create({
            schoolId: data.schoolId,
            studentId: data.studentId,
            totalAmount: data.totalAmount,
            status: 'pending',
            deliveryTime: data.deliveryTime,
            items: JSON.stringify(data.items),
        });
        return order;
    }
    async updateStatus(id, status) {
        return await this.orderRepo.updateStatus(id, status);
    }
    async confirmOrder(id) {
        return await this.updateStatus(id, 'confirmed');
    }
    async prepareOrder(id) {
        return await this.updateStatus(id, 'preparing');
    }
    async completeOrder(id) {
        return await this.updateStatus(id, 'completed');
    }
    async cancelOrder(id) {
        const order = await this.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }
        if (order.status === 'completed' || order.status === 'cancelled') {
            throw new Error(`Cannot cancel ${order.status} order`);
        }
        return await this.updateStatus(id, 'cancelled');
    }
    async getPendingOrders(schoolId) {
        return await this.orderRepo.getPendingOrders(schoolId);
    }
    async getActiveOrders(schoolId) {
        return await this.orderRepo.getActiveOrders(schoolId);
    }
    async getOrderStats(schoolId, startDate, endDate) {
        const orders = startDate && endDate
            ? await this.orderRepo.findByDateRange(schoolId, startDate, endDate)
            : await this.orderRepo.findBySchool(schoolId);
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const statusBreakdown = {};
        orders.forEach(order => {
            statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
        });
        return {
            totalOrders,
            totalRevenue,
            averageOrderValue,
            statusBreakdown,
        };
    }
    async getParentChildren(parentId) {
        const parentChildren = await this.prisma.parentChild.findMany({
            where: { parentId },
            include: { child: true },
        });
        return parentChildren.map(pc => pc.child);
    }
    async findMany(filters) {
        const where = {};
        if (filters.schoolId)
            where.schoolId = filters.schoolId;
        if (filters.studentId)
            where.studentId = filters.studentId;
        if (filters.status)
            where.status = filters.status;
        if (filters.startDate && filters.endDate) {
            where.createdAt = {
                gte: filters.startDate,
                lte: filters.endDate,
            };
        }
        const total = await this.prisma.order.count({ where });
        const items = await this.prisma.order.findMany({
            where,
            skip: filters.skip || 0,
            take: filters.take || 10,
            orderBy: filters.sortBy
                ? { [filters.sortBy]: filters.sortOrder || 'desc' }
                : { createdAt: 'desc' },
        });
        return { items, total };
    }
    async getTrackingInfo(orderId) {
        const order = await this.orderRepo.findById(orderId);
        if (!order)
            return null;
        return {
            id: order.id,
            status: order.status,
            estimatedDelivery: order.deliveryDate,
            trackingNumber: `TRK${order.id.substring(0, 8).toUpperCase()}`,
        };
    }
    async estimateDeliveryTime(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return null;
        return new Date(order.createdAt.getTime() + 30 * 60 * 1000);
    }
    async getStatusCounts(schoolId) {
        const orders = await this.findByStatus(schoolId, '');
        const counts = {};
        orders.forEach(order => {
            counts[order.status] = (counts[order.status] || 0) + 1;
        });
        return counts;
    }
    async getDetailedTrackingInfo(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return null;
        return {
            id: order.id,
            status: order.status,
            timeline: [
                { status: 'pending', timestamp: order.createdAt, description: 'Order placed' },
                { status: order.status, timestamp: order.updatedAt, description: 'Current status' },
            ],
            estimatedDelivery: order.deliveryDate,
        };
    }
    async getDeliveryStatus(orderId) {
        const order = await this.findById(orderId);
        return order?.status || 'unknown';
    }
    async getPreparationInfo(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return null;
        return {
            id: order.id,
            status: order.status,
            preparationStart: order.createdAt,
            estimatedReady: new Date(order.createdAt.getTime() + 15 * 60 * 1000),
        };
    }
    async canUserAccessOrder(userId, orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        if (order.userId === userId)
            return true;
        const children = await this.getParentChildren(userId);
        return children.some((child) => child.id === order.studentId);
    }
    async canCancelOrder(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        return ['pending', 'confirmed'].includes(order.status);
    }
    async canModifyOrder(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        return order.status === 'pending';
    }
    async isRefundEligible(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        return ['cancelled', 'pending'].includes(order.status);
    }
    async validateDeliverySlot(deliveryDate, deliveryTimeSlot) {
        const now = new Date();
        const minAdvanceTime = 2 * 60 * 60 * 1000;
        const maxAdvanceTime = 7 * 24 * 60 * 60 * 1000;
        if (deliveryDate <= new Date(now.getTime() + minAdvanceTime)) {
            return { valid: false, message: 'Delivery slot must be at least 2 hours in advance' };
        }
        if (deliveryDate > new Date(now.getTime() + maxAdvanceTime)) {
            return { valid: false, message: 'Delivery slot cannot be more than 7 days in advance' };
        }
        const validTimeSlots = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (!validTimeSlots.includes(deliveryTimeSlot)) {
            return { valid: false, message: 'Invalid delivery time slot' };
        }
        return { valid: true };
    }
    async validateOrderItems(items) {
        const errors = [];
        for (const item of items) {
            if (!item.menuItemId) {
                errors.push('Menu item ID is required');
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push('Quantity must be greater than 0');
            }
        }
        return { valid: errors.length === 0, errors };
    }
    async calculateOrderPricing(items) {
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }
        const tax = subtotal * 0.18;
        const total = subtotal + tax;
        return { subtotal, tax, total };
    }
    async validatePaymentMethod(paymentMethodId) {
        return { valid: true };
    }
    async processRefund(orderId, amount, reason) {
        try {
            return {
                success: true,
                refundId: `refund_${Date.now()}`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Refund processing failed',
            };
        }
    }
    async canUserUpdateOrder(userId, orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        return order.userId === userId && order.status === 'pending';
    }
    async canChangeStatus(orderId, newStatus) {
        const order = await this.findById(orderId);
        if (!order)
            return false;
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['delivered'],
            delivered: ['completed'],
        };
        return validTransitions[order.status]?.includes(newStatus) ?? false;
    }
    async validateItemModification(orderId, modifications) {
        const order = await this.findById(orderId);
        if (!order) {
            return { valid: false, errors: ['Order not found'] };
        }
        if (order.status !== 'pending') {
            return { valid: false, errors: ['Order cannot be modified at this stage'] };
        }
        return { valid: true };
    }
    async update(orderId, updates) {
        return await this.orderRepo.update(orderId, updates);
    }
    async handleStatusUpdate(orderId, newStatus) {
        await this.updateStatus(orderId, newStatus);
    }
    async canParentOrderForStudent(parentId, studentId) {
        const children = await this.getParentChildren(parentId);
        return children.some(child => child.id === studentId);
    }
    async createOrder(orderData) {
        try {
            const order = await this.create(orderData);
            return { success: true, data: order };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    message: error.message || 'Failed to create order',
                    code: 'ORDER_CREATION_FAILED',
                },
            };
        }
    }
    async getComprehensiveTrackingInfo(orderId) {
        const order = await this.findById(orderId);
        if (!order)
            return null;
        return {
            id: order.id,
            status: order.status,
            timeline: [
                { status: 'pending', timestamp: order.createdAt, description: 'Order placed' },
                { status: order.status, timestamp: order.updatedAt, description: 'Current status' },
            ],
            estimatedDelivery: order.deliveryDate,
        };
    }
}
exports.OrderService = OrderService;
exports.orderService = OrderService.getInstance();
exports.default = OrderService;
//# sourceMappingURL=order.service.js.map