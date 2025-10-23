export interface PaymentOrder {
    id: string;
    paymentId: string;
    orderId: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PaymentOrderRepository {
    private static instance;
    private prisma;
    constructor();
    static getInstance(): PaymentOrderRepository;
    findAll(): Promise<PaymentOrder[]>;
    findById(_id: string): Promise<PaymentOrder | null>;
    findByPayment(_paymentId: string): Promise<PaymentOrder[]>;
    findByOrder(_orderId: string): Promise<PaymentOrder[]>;
    create(data: Omit<PaymentOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentOrder>;
    static create(data: any): Promise<any>;
    static findByOrderId(orderId: string): Promise<any>;
    static update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<PaymentOrder>;
}
export default PaymentOrderRepository;
//# sourceMappingURL=paymentOrder.repository.d.ts.map