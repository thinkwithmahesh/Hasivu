import { Order, OrderItem, MenuItem, User, PaymentOrder, Prisma } from '@prisma/client';
export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput = any> {
    create(data: CreateInput): Promise<T>;
    findById(id: string): Promise<T | null>;
    findMany(options?: {
        where?: WhereInput;
        skip?: number;
        take?: number;
        orderBy?: any;
        include?: any;
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
    findByStudentId(studentId: string, options?: any): Promise<{
        items: Order[];
        total: number;
    }>;
    findBySchoolId(schoolId: string, options?: any): Promise<{
        items: Order[];
        total: number;
    }>;
    findActiveOrders(filters?: any, options?: any): Promise<{
        items: Order[];
        total: number;
    }>;
    findByDeliveryDate(deliveryDate: Date, options?: any): Promise<{
        items: Order[];
        total: number;
    }>;
    updateMany(where: Prisma.OrderWhereInput, data: Prisma.OrderUpdateManyMutationInput): Promise<Prisma.BatchPayload>;
    getAnalytics(filters?: any, groupBy?: 'day' | 'week' | 'month'): Promise<{
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
    getPopularItems(filters?: any, limit?: number): Promise<any[]>;
    createMany(data: Prisma.OrderItemCreateManyInput[]): Promise<Prisma.BatchPayload>;
}
export interface IMenuItemRepository extends BaseRepository<MenuItem, Prisma.MenuItemCreateInput, Prisma.MenuItemUpdateInput, Prisma.MenuItemWhereInput> {
    nameExists(name: string, schoolId: string, excludeId?: string): Promise<boolean>;
    findBySchoolId(schoolId: string, options?: any): Promise<{
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
    findByUserId(userId: string, options?: any): Promise<{
        items: PaymentOrder[];
        total: number;
    }>;
    findExpiredOrders(): Promise<PaymentOrder[]>;
    updateStatus(id: string, status: string, metadata?: any): Promise<PaymentOrder>;
}
export interface IDatabaseService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getHealth(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        responseTime: number;
        connections: any;
        performance: any;
        tables: any[];
        errors: string[];
        timestamp: Date;
    }>;
    transaction<T>(callback: (tx: any) => Promise<T>, options?: any): Promise<T>;
    executeRaw<T>(query: any, ...values: any[]): Promise<T>;
    sanitizeQuery(query: string | any): string | any;
    readonly user: any;
    readonly order: any;
    readonly menuItem: any;
    readonly orderItem: any;
    readonly paymentOrder: any;
    readonly rfidCard: any;
    readonly rfidReader: any;
    readonly deliveryVerification: any;
    readonly notification: any;
    readonly whatsAppMessage: any;
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
    }): Promise<void>;
}
export interface IPaymentService {
    processPayment(data: {
        orderId: string;
        amount: number;
        currency: string;
        paymentMethodId: string;
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
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
}
//# sourceMappingURL=repository.interfaces.d.ts.map