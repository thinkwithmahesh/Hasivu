export interface CustomerProfile {
    id: string;
    userId: string;
    preferences: {
        dietary?: string[];
        allergens?: string[];
        notifications?: boolean;
        language?: string;
    };
    subscription: {
        plan: 'basic' | 'premium' | 'family';
        status: 'active' | 'suspended' | 'cancelled';
        renewalDate?: Date;
    };
    paymentMethods: PaymentMethodInfo[];
    children?: ChildProfile[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ChildProfile {
    id: string;
    name: string;
    schoolId: string;
    grade: string;
    dietary: string[];
    allergens: string[];
    rfidCardId?: string;
}
export interface PaymentMethodInfo {
    id: string;
    type: 'card' | 'upi' | 'wallet';
    last4?: string;
    isDefault: boolean;
    isActive: boolean;
}
export interface CustomerMetrics {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    favoriteItems: string[];
    satisfactionScore?: number;
}
export interface CustomerSearchFilters {
    role?: string;
    schoolId?: string;
    subscriptionStatus?: string;
    registrationDateFrom?: Date;
    registrationDateTo?: Date;
    hasActiveSubscription?: boolean;
    hasChildren?: boolean;
}
export declare class CustomerService {
    private static instance;
    private db;
    private logger;
    private constructor();
    static getInstance(): CustomerService;
    getCustomerProfile(userId: string): Promise<CustomerProfile | null>;
    updateCustomerPreferences(userId: string, preferences: Partial<CustomerProfile['preferences']>): Promise<CustomerProfile>;
    addChild(userId: string, childData: Omit<ChildProfile, 'id'>): Promise<ChildProfile>;
    getCustomerMetrics(userId: string): Promise<CustomerMetrics>;
    searchCustomers(filters: CustomerSearchFilters, limit?: number, offset?: number): Promise<{
        customers: CustomerProfile[];
        total: number;
    }>;
    deactivateCustomer(userId: string, reason: string): Promise<void>;
    private mapToCustomerProfile;
    private mapToChildProfile;
}
//# sourceMappingURL=customer.service.d.ts.map