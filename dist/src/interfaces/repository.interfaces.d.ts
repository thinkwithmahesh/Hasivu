import { Order, OrderItem, MenuItem, User, PaymentOrder, Prisma } from '@prisma/client';
export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput = unknown> {
    create(data: CreateInput): Promise<T>;
    findById(id: string): Promise<T | null>;
    findMany(options?: {
        where?: WhereInput;
        skip?: number;
        take?: number;
        orderBy?: unknown;
        include?: unknown;
    }): Promise<{
        items: T[];
        total: number;
    }>;
    update(id: string, data: UpdateInput): Promise<T>;
    delete(id: string): Promise<T>;
    count(where?: WhereInput): Promise<number>;
}
export interface IOrderRepository extends BaseRepository<Order, Prisma.OrderCreateInput, Prisma.OrderUpdateInput, Prisma.OrderWhereInput> {
    findByIdWithIncludes(id: string, include: Prisma.OrderInclude): Promise<Order | null>;
    findByStudentId(studentId: string, options?: unknown): Promise<{
        items: Order[];
        total: number;
    }>;
    findBySchoolId(schoolId: string, options?: unknown): Promise<{
        items: Order[];
        total: number;
    }>;
    findActiveOrders(filters?: unknown, options?: unknown): Promise<{
        items: Order[];
        total: number;
    }>;
    findByDeliveryDate(deliveryDate: Date, options?: unknown): Promise<{
        items: Order[];
        total: number;
    }>;
    updateMany(where: Prisma.OrderWhereInput, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    getAnalytics(filters?: unknown, groupBy?: 'day' | 'week' | 'month'): Promise<{
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        cancelledOrders: number;
        ordersByStatus: Record<string, number>;
        revenueByDay: Array<{
            date: string;
            revenue: number;
            orders: number;
        }>;
    }>;
    getDashboardStats(schoolId?: string, dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        todayOrders: number;
        pendingOrders: number;
        completedOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    }>;
}
export interface IOrderItemRepository extends BaseRepository<OrderItem, Prisma.OrderItemCreateInput, Prisma.OrderItemUpdateInput, Prisma.OrderItemWhereInput> {
    findByOrderId(orderId: string): Promise<OrderItem[]>;
    getPopularItems(filters?: unknown, limit?: number): Promise<unknown[]>;
    createMany(data: Prisma.OrderItemCreateManyInput[]): Promise<Prisma.BatchPayload>;
}
export interface IMenuItemRepository extends BaseRepository<MenuItem, Prisma.MenuItemCreateInput, Prisma.MenuItemUpdateInput, Prisma.MenuItemWhereInput> {
    nameExists(name: string, schoolId: string, excludeId?: string): Promise<boolean>;
    findBySchoolId(schoolId: string, options?: unknown): Promise<{
        items: MenuItem[];
        total: number;
    }>;
    findAvailable(schoolId?: string): Promise<MenuItem[]>;
    search(query: string, schoolId?: string): Promise<MenuItem[]>;
    updateAvailability(id: string, available: boolean): Promise<MenuItem>;
}
export interface IUserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput, Prisma.UserWhereInput> {
    findByEmail(email: string): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    emailExists(email: string, excludeId?: string): Promise<boolean>;
    phoneExists(phone: string, excludeId?: string): Promise<boolean>;
    findStudentsByParentId(parentId: string): Promise<User[]>;
    findByRole(role: string, schoolId?: string): Promise<User[]>;
    updateLastLogin(id: string): Promise<User>;
    deactivateUser(id: string): Promise<User>;
}
export interface IPaymentOrderRepository extends BaseRepository<PaymentOrder, Prisma.PaymentOrderCreateInput, Prisma.PaymentOrderUpdateInput, Prisma.PaymentOrderWhereInput> {
    findByOrderId(orderId: string): Promise<PaymentOrder | null>;
    findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentOrder | null>;
    findByUserId(userId: string, options?: unknown): Promise<{
        items: PaymentOrder[];
        total: number;
    }>;
    findExpiredOrders(): Promise<PaymentOrder[]>;
    updateStatus(id: string, status: string, metadata?: unknown): Promise<PaymentOrder>;
}
export interface IDatabaseService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getHealth(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        responseTime: number;
        connections: unknown;
        performance: unknown;
        tables: unknown[];
        errors: string[];
        timestamp: Date;
    }>;
    transaction<T>(callback: (tx: unknown) => Promise<T>, options?: unknown): Promise<T>;
    executeRaw<T>(query: unknown, ...values: unknown[]): Promise<T>;
    sanitizeQuery(query: string | unknown): string | unknown;
    readonly user: unknown;
    readonly order: unknown;
    readonly menuItem: unknown;
    readonly orderItem: unknown;
    readonly paymentOrder: unknown;
    readonly rfidCard: unknown;
    readonly rfidReader: unknown;
    readonly deliveryVerification: unknown;
    readonly notification: unknown;
    readonly whatsAppMessage: unknown;
}
export interface INotificationService {
    sendOrderConfirmation(data: {
        orderId: string;
        studentId: string;
        parentId: string;
        totalAmount: number;
        deliveryDate: Date;
    }): Promise<void>;
    sendOrderStatusUpdate(data: {
        orderId: string;
        studentId: string;
        parentId: string;
        newStatus: string;
        message?: string;
    }): Promise<{
        success: boolean;
        data?: any;
        error?: {
            message: string;
            code: string;
        };
    }>;
}
export interface IPaymentService {
    processPayment(data: {
        orderId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
    }): Promise<{
        success: boolean;
        data?: {
            paymentId: string;
            status: string;
        };
        error?: {
            message: string;
        };
    }>;
}
export interface IRedisService {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<string>;
    del(key: string): Promise<number>;
}
//# sourceMappingURL=repository.interfaces.d.ts.map