interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
interface TestUser {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    schoolId?: string;
    parentId?: string;
    grade?: string;
    phoneNumber?: string;
    role?: string;
}
interface TestOrder {
    id: string;
    userId: string;
    items: any[];
    totalAmount: number;
    schoolId?: string;
    status: string;
    paymentStatus?: string;
    deliveredAt?: Date;
    requiresApproval?: boolean;
    approvalReason?: string;
    metadata?: any;
    cancellationReason?: string;
}
interface TestMenuItem {
    id: string;
    name: string;
    price: number;
    isVegetarian?: boolean;
    isGlutenFree?: boolean;
    allergens?: string[];
    includedInPlan?: boolean;
    metadata?: any;
}
interface TestPayment {
    id: string;
    status: string;
}
declare class MockAuthService {
    registerStudent(data: any): Promise<ApiResponse<{
        user: TestUser;
        verificationToken?: string;
    }>>;
    verifyEmail(token: string): Promise<ApiResponse<any>>;
    login(email: string, password: string): Promise<ApiResponse<{
        token: string;
    }>>;
    registerParent(data: any): Promise<ApiResponse<{
        user: TestUser;
    }>>;
    registerStudentByParent(data: any, token: string): Promise<ApiResponse<{
        student: TestUser;
    }>>;
    updateDietaryPreferences(userId: string, preferences: any, token: string): Promise<ApiResponse<any>>;
    linkStudentToParent(studentId: string, parentId: string): Promise<ApiResponse<any>>;
    updateSchoolPolicies(params: any, token: string): Promise<ApiResponse<{
        policies: any;
    }>>;
    synchronizeSchoolSystems(schoolId: string, token: string): Promise<ApiResponse<{
        synchronizedServices: string[];
    }>>;
    scheduleMaintenanceWindow(params: any, token: string): Promise<ApiResponse<any>>;
    getSystemStatus(schoolId: string): Promise<ApiResponse<{
        mode: string;
        activeAlerts?: any[];
        allServicesHealthy?: boolean;
    }>>;
    enterMaintenanceMode(schoolId: string, token: string): Promise<ApiResponse<any>>;
    exitMaintenanceMode(schoolId: string, token: string): Promise<ApiResponse<any>>;
    syncStudentsFromMIS(params: any, token: string): Promise<ApiResponse<{
        studentsCreated: number;
        studentsUpdated: number;
        createdStudents: TestUser[];
    }>>;
    generateParentAccounts(params: any, token: string): Promise<ApiResponse<{
        parentsGenerated: number;
    }>>;
    generateIntegrationReport(params: any): Promise<ApiResponse<any>>;
    triggerEmergencyAlert(params: any, token: string): Promise<ApiResponse<{
        alertId: string;
    }>>;
    resolveEmergencyAlert(params: any, token: string): Promise<ApiResponse<any>>;
    auditPersonalDataUsage(params: any): Promise<ApiResponse<{
        dataCategories: any[];
    }>>;
    requestDataDeletion(params: any): Promise<ApiResponse<{
        deletionScheduled: boolean;
        completionDate: Date;
    }>>;
    getUserProfile(userId: string): Promise<ApiResponse<any>>;
    generateComplianceReport(params: any): Promise<ApiResponse<{
        deletionRequests: any[];
    }>>;
    attemptLogin(params: any): Promise<ApiResponse<any>>;
    checkSecurityAlerts(params: any): Promise<ApiResponse<{
        activeAlerts: any[];
    }>>;
    getUserSecurityStatus(userId: string): Promise<ApiResponse<{
        isLocked: boolean;
        lockReason?: string;
        securityLevel?: string;
        requiresMFA?: boolean;
    }>>;
    investigateSecurityIncident(params: any, token: string): Promise<ApiResponse<{
        riskLevel: string;
    }>>;
    initiateAccountRecovery(params: any): Promise<ApiResponse<{
        recoveryToken: string;
    }>>;
    completeAccountRecovery(params: any): Promise<ApiResponse<any>>;
    generateSecurityIncidentReport(params: any): Promise<ApiResponse<{
        incident: any;
    }>>;
    createSchoolConfig(params: any, token: string): Promise<ApiResponse<any>>;
    archiveSchoolData(schoolId: string, token: string): Promise<ApiResponse<any>>;
    verifyDataIntegrity(params: any): Promise<ApiResponse<{
        inconsistencies: any[];
    }>>;
    verifySystemConsistency(params: any): Promise<ApiResponse<{
        isConsistent: boolean;
    }>>;
}
declare class MockMenuService {
    getAvailableMenu(params: any): Promise<ApiResponse<TestMenuItem[]>>;
    getPersonalizedMenu(params: any): Promise<ApiResponse<TestMenuItem[]>>;
    suggestAlternatives(params: any): Promise<ApiResponse<{
        suggestions: TestMenuItem[];
    }>>;
    setupDailyMenu(params: any): Promise<ApiResponse<any>>;
    getCachedMenu(params: any): Promise<ApiResponse<TestMenuItem[]>>;
    checkServiceHealth(params: any): Promise<ApiResponse<{
        isHealthy: boolean;
    }>>;
    addMenuItem(schoolId: string, item: any): Promise<ApiResponse<any>>;
    getItemAvailability(itemId: string): Promise<ApiResponse<{
        availableQuantity: number;
        reservedQuantity: number;
    }>>;
    addToWaitlist(params: any): Promise<ApiResponse<any>>;
    processWaitlistPromotion(itemId: string, schoolId: string): Promise<ApiResponse<{
        promotedUsers: Array<{
            userId: string;
        }>;
    }>>;
    generateDemandForecast(params: any): Promise<ApiResponse<{
        forecastDays: Array<{
            date: string;
            expectedOrders: number;
            popularItems: any[];
            recommendedInventory: any;
        }>;
    }>>;
    updateMenuForPolicyCompliance(params: any): Promise<ApiResponse<{
        updatedItems: number;
    }>>;
    getMenuStatus(schoolId: string): Promise<ApiResponse<{
        quarantinedItems: Array<{
            id: string;
            quarantineReason: string;
        }>;
    }>>;
    clearDailyMenu(schoolId: string, adminToken: string): Promise<ApiResponse<any>>;
}
declare class MockPaymentService {
    createOrder(data: any): Promise<ApiResponse<{
        order: TestOrder;
    }>>;
    processPayment(data: any): Promise<ApiResponse<{
        payment: TestPayment;
    }>>;
    getOrderStatus(orderId: string): Promise<ApiResponse<{
        order: TestOrder;
    }>>;
    updateOrderStatus(orderId: string, status: string, token?: string): Promise<ApiResponse<any>>;
    getUserOrderHistory(userId: string): Promise<ApiResponse<{
        orders: TestOrder[];
    }>>;
    addPaymentMethod(userId: string, methodData: any, token: string): Promise<ApiResponse<any>>;
    createMealPlan(data: any, token: string): Promise<ApiResponse<{
        id: string;
    }>>;
    processAutomaticPayment(orderId: string, mealPlanId: string): Promise<ApiResponse<any>>;
    getChildOrderHistory(parentId: string, childId: string, token: string): Promise<ApiResponse<{
        orders: TestOrder[];
    }>>;
    getAvailableSubscriptionPlans(params: any): Promise<ApiResponse<{
        plans: any[];
    }>>;
    createSubscription(data: any, token: string): Promise<ApiResponse<{
        subscription: {
            id: string;
            status: string;
        };
    }>>;
    processSubscriptionPayment(subscriptionId: string): Promise<ApiResponse<any>>;
    createOrderWithSubscription(data: any, token: string): Promise<ApiResponse<{
        order: TestOrder;
    }>>;
    getSubscriptionUsage(subscriptionId: string): Promise<ApiResponse<{
        ordersThisMonth: number;
    }>>;
    processSubscriptionRenewal(subscriptionId: string): Promise<ApiResponse<{
        payment: TestPayment;
    }>>;
    getSubscriptionStatus(subscriptionId: string): Promise<ApiResponse<{
        subscription: {
            status: string;
            currentPeriodEnd: Date;
        };
    }>>;
    validateOrderAgainstDietary(orderId: string, userId: string): Promise<ApiResponse<{
        conflicts: any[];
    }>>;
    updateOrderItems(orderId: string, items: any[], token: string): Promise<ApiResponse<{
        order: TestOrder;
    }>>;
    retryPayment(data: any): Promise<ApiResponse<{
        payment: TestPayment;
    }>>;
    setStudentBudget(data: any, token: string): Promise<ApiResponse<any>>;
    approveOrder(orderId: string, token: string): Promise<ApiResponse<any>>;
    getBudgetUsage(params: any): Promise<ApiResponse<{
        usedAmount: number;
        totalBudget: number;
    }>>;
    getAnonymizedOrderData(params: any): Promise<ApiResponse<{
        orders: any[];
    }>>;
    processEmergencyRefund(orderId: string, params: any): Promise<ApiResponse<any>>;
    cancelOrder(orderId: string, reason: string): Promise<ApiResponse<any>>;
    expediteOrderCompletion(orderId: string, params: any): Promise<ApiResponse<any>>;
    cancelAllPendingOrders(schoolId: string, token: string): Promise<ApiResponse<any>>;
    getSchoolOrderAnalytics(params: any): Promise<ApiResponse<{
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
    }>>;
    createHistoricalOrder(data: any): Promise<ApiResponse<any>>;
    generateComprehensiveAnalytics(params: any, token: string): Promise<ApiResponse<any>>;
    getGradeWiseAnalytics(params: any): Promise<ApiResponse<{
        grades: any[];
    }>>;
    getFinancialAnalytics(params: any): Promise<ApiResponse<any>>;
    exportAnalyticsData(params: any): Promise<ApiResponse<{
        exportUrl: string;
        expiresAt: Date;
        recordCount: number;
    }>>;
    setupGradeBudgets(params: any, token: string): Promise<ApiResponse<any>>;
}
declare class MockRfidService {
    createCard(data: any): Promise<ApiResponse<{
        id: string;
    }>>;
    activateCard(cardId: string): Promise<ApiResponse<any>>;
    verifyDelivery(data: any): Promise<ApiResponse<{
        status: string;
    }>>;
    getDeliveryHistory(userId: string): Promise<ApiResponse<any[]>>;
    registerReader(data: any): Promise<ApiResponse<{
        id: string;
        isOnline: boolean;
    }>>;
    updateReaderStatus(readerId: string, status: any): Promise<ApiResponse<any>>;
    manualDeliveryVerification(data: any, token: string): Promise<ApiResponse<{
        verificationMethod: string;
    }>>;
    getSystemHealth(params: any): Promise<ApiResponse<{
        readersOnline: number;
        systemStatus: string;
    }>>;
    generateIncidentReport(params: any): Promise<ApiResponse<{
        incidents: any[];
    }>>;
    getDeliveryAnalytics(params: any): Promise<ApiResponse<any>>;
    getCardUsageStats(params: any): Promise<ApiResponse<any>>;
    detectAnomalousActivity(params: any): Promise<ApiResponse<{
        rapidScans: any[];
        suspiciousPatterns: any[];
    }>>;
    getReaderLoadAnalytics(params: any): Promise<ApiResponse<any>>;
    bulkGenerateCards(params: any): Promise<ApiResponse<{
        cardsGenerated: number;
    }>>;
    updateVerificationPolicies(params: any): Promise<ApiResponse<any>>;
    deactivateAllCards(schoolId: string, token: string): Promise<ApiResponse<any>>;
}
export declare const E2ETestHelpers: {
    setupTestSchool(schoolId: string, services: {
        authService: MockAuthService;
        menuService: MockMenuService;
        paymentService: MockPaymentService;
        rfidService: MockRfidService;
    }): Promise<void>;
    cleanupTestSchool(schoolId: string, services: {
        authService: MockAuthService;
        menuService: MockMenuService;
        paymentService: MockPaymentService;
        rfidService: MockRfidService;
    }): Promise<void>;
    waitForAsyncProcessing(timeout?: number): Promise<void>;
    verifySystemConsistency(schoolId: string, services: {
        authService: MockAuthService;
    }): Promise<boolean>;
};
export {};
//# sourceMappingURL=complete-user-journey.test.d.ts.map