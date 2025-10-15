"use strict";
exports.id = 8597;
exports.ids = [8597];
exports.modules = {

/***/ 38597:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   r: () => (/* binding */ hasiviApi)
/* harmony export */ });
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(54829);
/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1427);
/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_0__);
/**
 * HASIVU Platform - Production API Service Layer
 * Complete integration with backend Lambda functions and services
 * Implements authentication, RFID, payments, and all core features
 */ 

// API Configuration
const API_CONFIG = {
    BASE_URL: "http://localhost:3000/api" || 0,
    STAGE: process.env.NEXT_PUBLIC_STAGE || "prod",
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    ENDPOINTS: {
        // Authentication
        AUTH: {
            LOGIN: "/auth/login",
            REGISTER: "/auth/register",
            VERIFY_EMAIL: "/auth/verify-email",
            REFRESH: "/auth/refresh",
            LOGOUT: "/auth/logout",
            FORGOT_PASSWORD: "/auth/forgot-password",
            RESET_PASSWORD: "/auth/reset-password"
        },
        // User Management
        USERS: {
            LIST: "/api/v1/users",
            GET: "/api/v1/users/:id",
            UPDATE: "/api/v1/users/:id",
            DELETE: "/api/v1/users/:id",
            BULK_IMPORT: "/api/v1/users/bulk-import",
            MANAGE_CHILDREN: "/api/v1/users/:id/children",
            PROFILE: "/api/v1/users/profile",
            PREFERENCES: "/api/v1/users/:id/preferences"
        },
        // Payment System
        PAYMENTS: {
            CREATE_ORDER: "/payments/orders",
            VERIFY: "/payments/verify",
            WEBHOOK: "/payments/webhook",
            REFUND: "/payments/refund",
            STATUS: "/payments/status/:orderId",
            METHODS: "/payments/methods",
            ADVANCED: "/payments/advanced",
            RETRY: "/payments/retry/:paymentId",
            SUBSCRIPTION: "/payments/subscription",
            INVOICE: "/payments/invoice/:paymentId",
            ANALYTICS: "/payments/analytics"
        },
        // RFID System
        RFID: {
            CREATE_CARD: "/rfid/cards",
            GET_CARD: "/rfid/cards/:cardId",
            VERIFY_CARD: "/rfid/verify",
            BULK_IMPORT: "/rfid/bulk-import",
            DELIVERY_VERIFICATION: "/rfid/delivery-verification",
            MANAGE_READERS: "/rfid/readers",
            MOBILE_TRACKING: "/rfid/mobile-tracking",
            CARD_ANALYTICS: "/rfid/analytics"
        },
        // Order Management
        ORDERS: {
            CREATE: "/orders",
            GET: "/orders/:orderId",
            UPDATE: "/orders/:orderId",
            CANCEL: "/orders/:orderId/cancel",
            LIST: "/orders",
            TRACK: "/orders/:orderId/track",
            HISTORY: "/orders/history",
            BULK_CREATE: "/orders/bulk"
        },
        // Menu System
        MENU: {
            ITEMS: "/menu/items",
            ITEM: "/menu/items/:itemId",
            CATEGORIES: "/menu/categories",
            SCHEDULE: "/menu/schedule",
            PLANNING: "/menu/planning",
            NUTRITION: "/menu/nutrition/:itemId",
            RECOMMENDATIONS: "/menu/recommendations",
            SEARCH: "/menu/search"
        },
        // Analytics & Reporting
        ANALYTICS: {
            DASHBOARD: "/analytics/dashboard",
            REPORTS: "/analytics/reports/:type",
            METRICS: "/analytics/metrics",
            EXPORT: "/analytics/export",
            REAL_TIME: "/analytics/real-time",
            INSIGHTS: "/analytics/insights"
        },
        // School Management
        SCHOOLS: {
            LIST: "/schools",
            GET: "/schools/:schoolId",
            UPDATE: "/schools/:schoolId",
            STATISTICS: "/schools/:schoolId/stats",
            SETTINGS: "/schools/:schoolId/settings",
            STAFF: "/schools/:schoolId/staff"
        },
        // Notifications
        NOTIFICATIONS: {
            LIST: "/notifications",
            SEND: "/notifications/send",
            MARK_READ: "/notifications/:id/read",
            PREFERENCES: "/notifications/preferences",
            SUBSCRIBE: "/notifications/subscribe",
            UNSUBSCRIBE: "/notifications/unsubscribe"
        }
    }
};
// API Client Class
class HASIVUApiClient {
    constructor(){
        this.refreshPromise = null;
        this.client = axios__WEBPACK_IMPORTED_MODULE_1__/* ["default"] */ .Z.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                "Content-Type": "application/json",
                "X-API-Version": "v1",
                "X-Client-Type": "web"
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor for authentication
        this.client.interceptors.request.use(async (config)=>{
            const session = await (0,next_auth_react__WEBPACK_IMPORTED_MODULE_0__.getSession)();
            if (session?.accessToken) {
                config.headers.Authorization = `Bearer ${session.accessToken}`;
            }
            // Add request ID for tracking
            config.headers["X-Request-ID"] = this.generateRequestId();
            // Add timestamp
            config.headers["X-Request-Timestamp"] = new Date().toISOString();
            return config;
        }, (error)=>Promise.reject(error));
        // Response interceptor for error handling and token refresh
        this.client.interceptors.response.use((response)=>response, async (error)=>{
            const originalRequest = error.config;
            // Handle token expiration
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const tokens = await this.refreshAccessToken();
                    if (tokens) {
                        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                        return this.client(originalRequest);
                    }
                } catch (refreshError) {
                    // Redirect to login
                    await (0,next_auth_react__WEBPACK_IMPORTED_MODULE_0__.signOut)({
                        callbackUrl: "/login"
                    });
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(this.handleApiError(error));
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async refreshAccessToken() {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        this.refreshPromise = this.performTokenRefresh();
        try {
            const tokens = await this.refreshPromise;
            this.refreshPromise = null;
            return tokens;
        } catch (error) {
            this.refreshPromise = null;
            throw error;
        }
    }
    async performTokenRefresh() {
        const session = await (0,next_auth_react__WEBPACK_IMPORTED_MODULE_0__.getSession)();
        if (!session?.refreshToken) {
            throw new Error("No refresh token available");
        }
        const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
            refreshToken: session.refreshToken
        });
        return response.data;
    }
    handleApiError(error) {
        const errorResponse = error.response?.data;
        const errorMessage = errorResponse?.error?.message || error.message || "An unexpected error occurred";
        const errorCode = errorResponse?.error?.code || `HTTP_${error.response?.status || "UNKNOWN"}`;
        const enhancedError = new Error(errorMessage);
        enhancedError.code = errorCode;
        enhancedError.status = error.response?.status || 0;
        enhancedError.details = errorResponse?.error?.details;
        return enhancedError;
    }
    // Authentication Methods
    async login(email, password) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
            email,
            password
        });
        return response.data;
    }
    async register(userData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
        return response.data;
    }
    async verifyEmail(token) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
            token
        });
        return response.data;
    }
    // RFID Methods
    async createRFIDCard(cardData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.RFID.CREATE_CARD, cardData);
        return response.data;
    }
    async verifyRFIDCard(cardNumber, readerId) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.RFID.VERIFY_CARD, {
            cardNumber,
            readerId,
            timestamp: new Date().toISOString()
        });
        return response.data;
    }
    async getRFIDAnalytics(params) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.RFID.CARD_ANALYTICS, {
            params
        });
        return response.data;
    }
    // Payment Methods
    async createPaymentOrder(orderData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.PAYMENTS.CREATE_ORDER, orderData);
        return response.data;
    }
    async verifyPayment(paymentData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY, paymentData);
        return response.data;
    }
    async getPaymentAnalytics(params) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.PAYMENTS.ANALYTICS, {
            params
        });
        return response.data;
    }
    // Order Methods
    async createOrder(orderData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.ORDERS.CREATE, orderData);
        return response.data;
    }
    async getOrder(orderId) {
        const url = API_CONFIG.ENDPOINTS.ORDERS.GET.replace(":orderId", orderId);
        const response = await this.client.get(url);
        return response.data;
    }
    async trackOrder(orderId) {
        const url = API_CONFIG.ENDPOINTS.ORDERS.TRACK.replace(":orderId", orderId);
        const response = await this.client.get(url);
        return response.data;
    }
    // Menu Methods
    async getMenuItems(params) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.ITEMS, {
            params
        });
        return response.data;
    }
    async searchMenu(query) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.SEARCH, {
            params: {
                q: query
            }
        });
        return response.data;
    }
    async getMenuRecommendations(userId) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.MENU.RECOMMENDATIONS, {
            params: {
                userId
            }
        });
        return response.data;
    }
    // Analytics Methods
    async getDashboardData() {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.ANALYTICS.DASHBOARD);
        return response.data;
    }
    async getAnalyticsReport(type, params) {
        const url = API_CONFIG.ENDPOINTS.ANALYTICS.REPORTS.replace(":type", type);
        const response = await this.client.get(url, {
            params
        });
        return response.data;
    }
    async getRealTimeMetrics() {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.ANALYTICS.REAL_TIME);
        return response.data;
    }
    // School Methods
    async getSchoolStatistics(schoolId) {
        const url = API_CONFIG.ENDPOINTS.SCHOOLS.STATISTICS.replace(":schoolId", schoolId);
        const response = await this.client.get(url);
        return response.data;
    }
    async getSchoolList(params) {
        const response = await this.client.get(API_CONFIG.ENDPOINTS.SCHOOLS.LIST, {
            params
        });
        return response.data;
    }
    // Onboarding Methods
    async updateSchoolInfo(schoolData) {
        const response = await this.client.put(API_CONFIG.ENDPOINTS.SCHOOLS.UPDATE.replace(":schoolId", schoolData.schoolId || "current"), {
            ...schoolData,
            step: "school_info"
        });
        return response.data;
    }
    async updateUserProfile(userData) {
        const url = API_CONFIG.ENDPOINTS.USERS.UPDATE.replace(":id", userData.userId || "current");
        const response = await this.client.put(url, {
            ...userData,
            step: "admin_setup"
        });
        return response.data;
    }
    async configureStakeholders(stakeholderData) {
        const response = await this.client.post("/onboarding/stakeholders", {
            ...stakeholderData,
            step: "stakeholder_setup"
        });
        return response.data;
    }
    async updateSchoolBranding(brandingData) {
        const response = await this.client.put(API_CONFIG.ENDPOINTS.SCHOOLS.SETTINGS.replace(":schoolId", brandingData.schoolId || "current"), {
            ...brandingData,
            step: "branding"
        });
        return response.data;
    }
    async updateSchoolConfiguration(configData) {
        const response = await this.client.put(API_CONFIG.ENDPOINTS.SCHOOLS.SETTINGS.replace(":schoolId", configData.schoolId || "current"), {
            ...configData,
            step: "configuration"
        });
        return response.data;
    }
    async configureRFIDSystem(rfidData) {
        const response = await this.client.post(API_CONFIG.ENDPOINTS.RFID.BULK_IMPORT, {
            ...rfidData,
            step: "rfid_setup"
        });
        return response.data;
    }
    async completeOnboarding(onboardingData) {
        const response = await this.client.post("/onboarding/complete", onboardingData);
        return response.data;
    }
    // Demo Booking Methods (for landing page)
    async bookDemo(demoData) {
        // This would typically go to a CRM endpoint or notification service
        const response = await this.client.post("/demo/book", demoData);
        return response.data;
    }
    async requestTrial(trialData) {
        const response = await this.client.post("/trial/request", trialData);
        return response.data;
    }
    // Public Statistics (for landing page)
    async getPublicStatistics() {
        const response = await this.client.get("/public/statistics");
        return response.data;
    }
    // Testimonials (for landing page)
    async getTestimonials() {
        const response = await this.client.get("/public/testimonials");
        return response.data;
    }
}
// Export singleton instance
const hasiviApi = new HASIVUApiClient();


/***/ })

};
;