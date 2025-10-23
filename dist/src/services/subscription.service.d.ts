export declare class SubscriptionService {
    private static instance;
    constructor();
    static getInstance(): SubscriptionService;
    getUserSubscription(userId: string): Promise<any>;
    createSubscription(userId: string, planId: string): Promise<any>;
    cancelSubscription(userId: string): Promise<void>;
    checkSubscriptionStatus(_userId: string): Promise<boolean>;
    getAvailablePlans(): Promise<any[]>;
}
declare const subscriptionServiceInstance: SubscriptionService;
export declare const subscriptionService: SubscriptionService;
export declare const _subscriptionService: SubscriptionService;
export default subscriptionServiceInstance;
//# sourceMappingURL=subscription.service.d.ts.map