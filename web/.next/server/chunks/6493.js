"use strict";
exports.id = 6493;
exports.ids = [6493];
exports.modules = {

/***/ 66493:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AW: () => (/* binding */ useInventoryItems),
/* harmony export */   Bs: () => (/* binding */ useStaffMembers),
/* harmony export */   HT: () => (/* binding */ useKitchenMetrics),
/* harmony export */   HU: () => (/* binding */ useOrderMutations),
/* harmony export */   L0: () => (/* binding */ useInventorySuppliers),
/* harmony export */   MJ: () => (/* binding */ useLowStockAlerts),
/* harmony export */   N5: () => (/* binding */ useStaffMutations),
/* harmony export */   _T: () => (/* binding */ usePurchaseOrders),
/* harmony export */   d9: () => (/* binding */ useInventoryMutations),
/* harmony export */   h5: () => (/* binding */ useWebSocketConnection),
/* harmony export */   nF: () => (/* binding */ useStaffSchedules),
/* harmony export */   pQ: () => (/* binding */ useInventoryMetrics),
/* harmony export */   pb: () => (/* binding */ useKitchenOrders),
/* harmony export */   tY: () => (/* binding */ useWebSocketSubscription)
/* harmony export */ });
/* unused harmony exports useApiData, useStaffTasks, useStaffMetrics, useNotifications, useNotificationSettings, useNotificationMutations, useAuth, useDashboardAnalytics, useRfidDevices, useRfidTransactions, useRfidMetrics */
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _services_api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(10253);
// React hooks for API integration and data management


// Generic hook for API data fetching with loading, error, and caching
function useApiData(apiCall, dependencies = [], options) {
    const [data, setData] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const intervalRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)();
    const fetchData = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async ()=>{
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall();
            setData(response.data);
            options?.onSuccess?.(response.data);
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            options?.onError?.(errorMessage);
        } finally{
            setLoading(false);
        }
    }, [
        apiCall,
        options?.onSuccess,
        options?.onError
    ]);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        if (options?.enabled !== false) {
            fetchData();
        }
        // Setup auto-refetch interval
        if (options?.refetchInterval && options.refetchInterval > 0) {
            intervalRef.current = setInterval(fetchData, options.refetchInterval);
        }
        return ()=>{
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [
        fetchData,
        options?.refetchInterval,
        options?.enabled
    ]);
    // Separate effect for dependency changes to prevent infinite loops
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        if (options?.enabled !== false) {
            fetchData();
        }
    }, dependencies);
    const refetch = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(()=>{
        fetchData();
    }, [
        fetchData
    ]);
    return {
        data,
        loading,
        error,
        refetch
    };
}
// Kitchen Management Hooks
function useKitchenOrders(filters) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .kitchenApi */ .eE.getOrders(filters), [
        filters
    ], {
        refetchInterval: 30000
    } // Refetch every 30 seconds
    );
}
function useKitchenMetrics(period) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .kitchenApi */ .eE.getKitchenMetrics(period), [
        period
    ], {
        refetchInterval: 60000
    } // Refetch every minute
    );
}
function useOrderMutations() {
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const updateOrderStatus = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (orderId, status)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .kitchenApi */ .eE.updateOrderStatus(orderId, status);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const assignOrder = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (orderId, staffId)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .kitchenApi */ .eE.assignOrder(orderId, staffId);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const createOrder = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (orderData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .kitchenApi */ .eE.createOrder(orderData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    return {
        updateOrderStatus,
        assignOrder,
        createOrder,
        loading,
        error
    };
}
// Inventory Management Hooks
function useInventoryItems(filters) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.getItems(filters), [
        filters
    ], {
        refetchInterval: 120000
    } // Refetch every 2 minutes
    );
}
function useInventorySuppliers() {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.getSuppliers(), [], {
        refetchInterval: 300000
    } // Refetch every 5 minutes
    );
}
function usePurchaseOrders(filters) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.getPurchaseOrders(filters), [
        filters
    ], {
        refetchInterval: 120000
    });
}
function useInventoryMetrics() {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.getInventoryMetrics(), [], {
        refetchInterval: 60000
    });
}
function useLowStockAlerts() {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.getLowStockAlerts(), [], {
        refetchInterval: 30000
    } // Check frequently for stock alerts
    );
}
function useInventoryMutations() {
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const createItem = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (itemData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.createItem(itemData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateItem = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (itemId, itemData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.updateItem(itemId, itemData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateStock = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (itemId, quantity, type)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.updateStock(itemId, quantity, type);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const createPurchaseOrder = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (orderData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.createPurchaseOrder(orderData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updatePurchaseOrderStatus = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (orderId, status)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .inventoryApi */ .rx.updatePurchaseOrderStatus(orderId, status);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    return {
        createItem,
        updateItem,
        updateStock,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        loading,
        error
    };
}
// Staff Management Hooks
function useStaffMembers(filters) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.getStaff(filters), [
        filters
    ], {
        refetchInterval: 180000
    } // Refetch every 3 minutes
    );
}
function useStaffTasks(filters) {
    return useApiData(()=>staffApi.getTasks(filters), [
        filters
    ], {
        refetchInterval: 60000
    });
}
function useStaffSchedules(filters) {
    return useApiData(()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.getSchedules(filters), [
        filters
    ], {
        refetchInterval: 300000
    } // Refetch every 5 minutes
    );
}
function useStaffMetrics() {
    return useApiData(()=>staffApi.getStaffMetrics(), [], {
        refetchInterval: 180000
    });
}
function useStaffMutations() {
    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    const createStaff = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (staffData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.createStaff(staffData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateStaff = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (staffId, staffData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.updateStaff(staffId, staffData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateStaffStatus = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (staffId, status)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.updateStaffStatus(staffId, status);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const createTask = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (taskData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.createTask(taskData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateTaskStatus = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (taskId, status)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.updateTaskStatus(taskId, status);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const createSchedule = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (scheduleData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await _services_api__WEBPACK_IMPORTED_MODULE_1__/* .staffApi */ .L2.createSchedule(scheduleData);
            return response.data;
        } catch (err) {
            const errorMessage = (0,_services_api__WEBPACK_IMPORTED_MODULE_1__/* .handleApiError */ .zG)(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    return {
        createStaff,
        updateStaff,
        updateStaffStatus,
        createTask,
        updateTaskStatus,
        createSchedule,
        loading,
        error
    };
}
// Notifications Hooks
function useNotifications(filters) {
    return useApiData(()=>notificationsApi.getNotifications(filters), [
        filters
    ], {
        refetchInterval: 15000
    } // Refetch every 15 seconds
    );
}
function useNotificationSettings() {
    return useApiData(()=>notificationsApi.getSettings(), []);
}
function useNotificationMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const markAsRead = useCallback(async (notificationIds)=>{
        try {
            setLoading(true);
            setError(null);
            await notificationsApi.markAsRead(notificationIds);
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const markAllAsRead = useCallback(async ()=>{
        try {
            setLoading(true);
            setError(null);
            await notificationsApi.markAllAsRead();
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const deleteNotification = useCallback(async (notificationId)=>{
        try {
            setLoading(true);
            setError(null);
            await notificationsApi.deleteNotification(notificationId);
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const updateSettings = useCallback(async (settings)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await notificationsApi.updateSettings(settings);
            return response.data;
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    return {
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updateSettings,
        loading,
        error
    };
}
// Authentication Hooks
function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(()=>{
        // Check for existing auth token on mount
        const token = localStorage.getItem("authToken");
        if (token) {
            userApi.getProfile().then((response)=>{
                setUser(response.data);
                setLoading(false);
            }).catch(()=>{
                localStorage.removeItem("authToken");
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);
    const login = useCallback(async (credentials)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.login(credentials);
            localStorage.setItem("authToken", response.data.token);
            setUser(response.data.user);
            return response.data;
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    const logout = useCallback(async ()=>{
        try {
            await userApi.logout();
        } catch (err) {} finally{
            setUser(null);
            localStorage.removeItem("authToken");
        }
    }, []);
    const register = useCallback(async (userData)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.register(userData);
            return response.data;
        } catch (err) {
            const errorMessage = handleApiError(err);
            setError(errorMessage);
            throw err;
        } finally{
            setLoading(false);
        }
    }, []);
    return {
        user,
        loading,
        error,
        login,
        logout,
        register,
        isAuthenticated: !!user
    };
}
// WebSocket hooks for real-time updates
function useWebSocketConnection() {
    const [connected, setConnected] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        const token = localStorage.getItem("authToken");
        if (token && !_services_api__WEBPACK_IMPORTED_MODULE_1__/* .wsManager */ .Xe.isConnected()) {
            _services_api__WEBPACK_IMPORTED_MODULE_1__/* .wsManager */ .Xe.connect(token);
        }
        // Monitor connection status
        const checkConnection = ()=>{
            setConnected(_services_api__WEBPACK_IMPORTED_MODULE_1__/* .wsManager */ .Xe.isConnected());
        };
        const interval = setInterval(checkConnection, 1000);
        checkConnection(); // Initial check
        return ()=>clearInterval(interval);
    }, []);
    return {
        connected
    };
}
function useWebSocketSubscription(messageType, handler) {
    const handlerRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(handler);
    // Update the ref when handler changes to avoid re-subscriptions
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        handlerRef.current = handler;
    }, [
        handler
    ]);
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        const stableHandler = (data)=>handlerRef.current(data);
        _services_api__WEBPACK_IMPORTED_MODULE_1__/* .wsManager */ .Xe.subscribe(messageType, stableHandler);
        return ()=>_services_api__WEBPACK_IMPORTED_MODULE_1__/* .wsManager */ .Xe.unsubscribe(messageType);
    }, [
        messageType
    ]); // Only re-subscribe when messageType changes
}
// Analytics Hooks
function useDashboardAnalytics(period) {
    return useApiData(()=>analyticsApi.getDashboardMetrics(period), [
        period
    ], {
        refetchInterval: 300000
    } // Refetch every 5 minutes
    );
}
// RFID System Hooks
function useRfidDevices() {
    return useApiData(()=>rfidApi.getDevices(), [], {
        refetchInterval: 60000
    });
}
function useRfidTransactions(filters) {
    return useApiData(()=>rfidApi.getTransactions(filters), [
        filters
    ], {
        refetchInterval: 30000
    });
}
function useRfidMetrics() {
    return useApiData(()=>rfidApi.getRfidMetrics(), [], {
        refetchInterval: 60000
    });
}


/***/ }),

/***/ 10253:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   L2: () => (/* binding */ staffApi),
/* harmony export */   Xe: () => (/* binding */ wsManager),
/* harmony export */   eE: () => (/* binding */ kitchenApi),
/* harmony export */   rx: () => (/* binding */ inventoryApi),
/* harmony export */   zG: () => (/* binding */ handleApiError)
/* harmony export */ });
/* unused harmony exports userApi, rfidApi, notificationsApi, menuApi, analyticsApi, fileApi, WebSocketManager, initializeWebSocket, checkApiHealth */
/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21145);
// Production-level API services for HASIVU platform

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";
// Create axios instance with default configuration
const apiClient = axios__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .Z.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});
// Request interceptor - no longer need to add auth token manually
// since we're using httpOnly cookies for authentication
apiClient.interceptors.request.use((config)=>{
    // CSRF token will be added automatically by the server
    return config;
}, (error)=>{
    return Promise.reject(error);
});
// Response interceptor for error handling
apiClient.interceptors.response.use((response)=>response, (error)=>{
    if (error.response?.status === 401) {
        // Clear any client-side auth state and redirect to login
        window.location.href = "/auth/login";
    }
    return Promise.reject(error);
});
// User Management API
const userApi = {
    // Authentication
    login: async (credentials)=>{
        const response = await apiClient.post("/auth/login", credentials);
        return response.data;
    },
    register: async (userData)=>{
        const response = await apiClient.post("/auth/register", userData);
        return response.data;
    },
    logout: async ()=>{
        const response = await apiClient.post("/auth/logout");
        // No need to remove token from localStorage since we use httpOnly cookies
        return response.data;
    },
    // Profile management
    getProfile: async ()=>{
        const response = await apiClient.get("/users/profile");
        return response.data;
    },
    updateProfile: async (profileData)=>{
        const response = await apiClient.put("/users/profile", profileData);
        return response.data;
    },
    // User management (admin only)
    getUsers: async (params)=>{
        const response = await apiClient.get("/users", {
            params
        });
        return response.data;
    },
    createUser: async (userData)=>{
        const response = await apiClient.post("/users", userData);
        return response.data;
    },
    updateUser: async (userId, userData)=>{
        const response = await apiClient.put(`/users/${userId}`, userData);
        return response.data;
    },
    deleteUser: async (userId)=>{
        const response = await apiClient.delete(`/users/${userId}`);
        return response.data;
    }
};
// Kitchen Management API
const kitchenApi = {
    // Orders
    getOrders: async (params)=>{
        const response = await apiClient.get("/kitchen/orders", {
            params
        });
        return response.data;
    },
    createOrder: async (orderData)=>{
        const response = await apiClient.post("/kitchen/orders", orderData);
        return response.data;
    },
    updateOrderStatus: async (orderId, status)=>{
        const response = await apiClient.patch(`/kitchen/orders/${orderId}/status`, {
            status
        });
        return response.data;
    },
    assignOrder: async (orderId, staffId)=>{
        const response = await apiClient.patch(`/kitchen/orders/${orderId}/assign`, {
            staffId
        });
        return response.data;
    },
    // Kitchen metrics
    getKitchenMetrics: async (period)=>{
        const response = await apiClient.get("/kitchen/metrics", {
            params: {
                period
            }
        });
        return response.data;
    }
};
// Inventory Management API
const inventoryApi = {
    // Items
    getItems: async (params)=>{
        const response = await apiClient.get("/inventory/items", {
            params
        });
        return response.data;
    },
    createItem: async (itemData)=>{
        const response = await apiClient.post("/inventory/items", itemData);
        return response.data;
    },
    updateItem: async (itemId, itemData)=>{
        const response = await apiClient.put(`/inventory/items/${itemId}`, itemData);
        return response.data;
    },
    deleteItem: async (itemId)=>{
        const response = await apiClient.delete(`/inventory/items/${itemId}`);
        return response.data;
    },
    updateStock: async (itemId, quantity, type)=>{
        const response = await apiClient.patch(`/inventory/items/${itemId}/stock`, {
            quantity,
            type
        });
        return response.data;
    },
    // Suppliers
    getSuppliers: async ()=>{
        const response = await apiClient.get("/inventory/suppliers");
        return response.data;
    },
    createSupplier: async (supplierData)=>{
        const response = await apiClient.post("/inventory/suppliers", supplierData);
        return response.data;
    },
    updateSupplier: async (supplierId, supplierData)=>{
        const response = await apiClient.put(`/inventory/suppliers/${supplierId}`, supplierData);
        return response.data;
    },
    // Purchase Orders
    getPurchaseOrders: async (params)=>{
        const response = await apiClient.get("/inventory/purchase-orders", {
            params
        });
        return response.data;
    },
    createPurchaseOrder: async (orderData)=>{
        const response = await apiClient.post("/inventory/purchase-orders", orderData);
        return response.data;
    },
    updatePurchaseOrderStatus: async (orderId, status)=>{
        const response = await apiClient.patch(`/inventory/purchase-orders/${orderId}/status`, {
            status
        });
        return response.data;
    },
    // Inventory metrics
    getInventoryMetrics: async ()=>{
        const response = await apiClient.get("/inventory/metrics");
        return response.data;
    },
    getLowStockAlerts: async ()=>{
        const response = await apiClient.get("/inventory/low-stock-alerts");
        return response.data;
    }
};
// Staff Management API
const staffApi = {
    // Staff members
    getStaff: async (params)=>{
        const response = await apiClient.get("/staff/members", {
            params
        });
        return response.data;
    },
    createStaff: async (staffData)=>{
        const response = await apiClient.post("/staff/members", staffData);
        return response.data;
    },
    updateStaff: async (staffId, staffData)=>{
        const response = await apiClient.put(`/staff/members/${staffId}`, staffData);
        return response.data;
    },
    updateStaffStatus: async (staffId, status)=>{
        const response = await apiClient.patch(`/staff/members/${staffId}/status`, {
            status
        });
        return response.data;
    },
    // Tasks
    getTasks: async (params)=>{
        const response = await apiClient.get("/staff/tasks", {
            params
        });
        return response.data;
    },
    createTask: async (taskData)=>{
        const response = await apiClient.post("/staff/tasks", taskData);
        return response.data;
    },
    updateTask: async (taskId, taskData)=>{
        const response = await apiClient.put(`/staff/tasks/${taskId}`, taskData);
        return response.data;
    },
    updateTaskStatus: async (taskId, status)=>{
        const response = await apiClient.patch(`/staff/tasks/${taskId}/status`, {
            status
        });
        return response.data;
    },
    // Schedules
    getSchedules: async (params)=>{
        const response = await apiClient.get("/staff/schedules", {
            params
        });
        return response.data;
    },
    createSchedule: async (scheduleData)=>{
        const response = await apiClient.post("/staff/schedules", scheduleData);
        return response.data;
    },
    updateSchedule: async (scheduleId, scheduleData)=>{
        const response = await apiClient.put(`/staff/schedules/${scheduleId}`, scheduleData);
        return response.data;
    },
    // Staff metrics
    getStaffMetrics: async ()=>{
        const response = await apiClient.get("/staff/metrics");
        return response.data;
    },
    getAttendanceReport: async (params)=>{
        const response = await apiClient.get("/staff/attendance", {
            params
        });
        return response.data;
    }
};
// RFID System API
const rfidApi = {
    // RFID devices
    getDevices: async ()=>{
        const response = await apiClient.get("/rfid/devices");
        return response.data;
    },
    updateDeviceStatus: async (deviceId, status)=>{
        const response = await apiClient.patch(`/rfid/devices/${deviceId}/status`, {
            status
        });
        return response.data;
    },
    // RFID transactions
    getTransactions: async (params)=>{
        const response = await apiClient.get("/rfid/transactions", {
            params
        });
        return response.data;
    },
    verifyRfidScan: async (scanData)=>{
        const response = await apiClient.post("/rfid/verify", scanData);
        return response.data;
    },
    // RFID metrics
    getRfidMetrics: async ()=>{
        const response = await apiClient.get("/rfid/metrics");
        return response.data;
    },
    // RFID card management
    registerCard: async (cardData)=>{
        const response = await apiClient.post("/rfid/cards", cardData);
        return response.data;
    },
    bulkRegisterCards: async (bulkData)=>{
        const response = await apiClient.post("/rfid/cards/bulk-register", bulkData);
        return response.data;
    },
    deactivateCard: async (cardId)=>{
        const response = await apiClient.post(`/rfid/cards/${cardId}/deactivate`);
        return response.data;
    },
    getVerificationHistory: async (params)=>{
        const response = await apiClient.get("/rfid/verifications", {
            params
        });
        return response.data;
    },
    getCardAnalytics: async (params)=>{
        const response = await apiClient.get("/rfid/analytics", {
            params
        });
        return response.data;
    }
};
// Notifications API
const notificationsApi = {
    // Get notifications
    getNotifications: async (params)=>{
        const response = await apiClient.get("/notifications", {
            params
        });
        return response.data;
    },
    markAsRead: async (notificationIds)=>{
        const response = await apiClient.patch("/notifications/mark-read", {
            notificationIds
        });
        return response.data;
    },
    markAllAsRead: async ()=>{
        const response = await apiClient.patch("/notifications/mark-all-read");
        return response.data;
    },
    deleteNotification: async (notificationId)=>{
        const response = await apiClient.delete(`/notifications/${notificationId}`);
        return response.data;
    },
    // Notification settings
    getSettings: async ()=>{
        const response = await apiClient.get("/notifications/settings");
        return response.data;
    },
    updateSettings: async (settings)=>{
        const response = await apiClient.put("/notifications/settings", settings);
        return response.data;
    }
};
// Menu Management API
const menuApi = {
    // Menus
    getMenus: async (params)=>{
        const response = await apiClient.get("/menus", {
            params
        });
        return response.data;
    },
    createMenu: async (menuData)=>{
        const response = await apiClient.post("/menus", menuData);
        return response.data;
    },
    updateMenu: async (menuId, menuData)=>{
        const response = await apiClient.put(`/menus/${menuId}`, menuData);
        return response.data;
    },
    deleteMenu: async (menuId)=>{
        const response = await apiClient.delete(`/menus/${menuId}`);
        return response.data;
    },
    // Menu items
    getMenuItems: async (menuId)=>{
        const response = await apiClient.get(`/menus/${menuId}/items`);
        return response.data;
    },
    addMenuItem: async (menuId, itemData)=>{
        const response = await apiClient.post(`/menus/${menuId}/items`, itemData);
        return response.data;
    },
    updateMenuItem: async (menuId, itemId, itemData)=>{
        const response = await apiClient.put(`/menus/${menuId}/items/${itemId}`, itemData);
        return response.data;
    },
    removeMenuItem: async (menuId, itemId)=>{
        const response = await apiClient.delete(`/menus/${menuId}/items/${itemId}`);
        return response.data;
    }
};
// Analytics API
const analyticsApi = {
    // Dashboard analytics
    getDashboardMetrics: async (period)=>{
        const response = await apiClient.get("/analytics/dashboard", {
            params: {
                period
            }
        });
        return response.data;
    },
    // Revenue analytics
    getRevenueAnalytics: async (params)=>{
        const response = await apiClient.get("/analytics/revenue", {
            params
        });
        return response.data;
    },
    // Order analytics
    getOrderAnalytics: async (params)=>{
        const response = await apiClient.get("/analytics/orders", {
            params
        });
        return response.data;
    },
    // Student analytics
    getStudentAnalytics: async (params)=>{
        const response = await apiClient.get("/analytics/students", {
            params
        });
        return response.data;
    },
    // Performance reports
    getPerformanceReport: async (type, params)=>{
        const response = await apiClient.get(`/analytics/reports/${type}`, {
            params
        });
        return response.data;
    },
    // Export data
    exportData: async (type, params)=>{
        const response = await apiClient.get(`/analytics/export/${type}`, {
            params,
            responseType: "blob"
        });
        return response.data;
    }
};
// File Upload API
const fileApi = {
    uploadFile: async (file, category)=>{
        const formData = new FormData();
        formData.append("file", file);
        if (category) formData.append("category", category);
        const response = await apiClient.post("/files/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },
    uploadMultipleFiles: async (files, category)=>{
        const formData = new FormData();
        files.forEach((file)=>formData.append("files", file));
        if (category) formData.append("category", category);
        const response = await apiClient.post("/files/upload-multiple", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    },
    deleteFile: async (filename)=>{
        const response = await apiClient.delete(`/files/${filename}`);
        return response.data;
    }
};
// WebSocket connection manager
class WebSocketManager {
    connect(token) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }
        try {
            this.ws = new WebSocket(WS_BASE_URL);
            this.ws.onopen = ()=>{
                this.reconnectAttempts = 0;
                // Send authentication token
                if (token) {
                    this.send("auth", {
                        token
                    });
                }
            };
            this.ws.onmessage = (event)=>{
                try {
                    const message = JSON.parse(event.data);
                    const handler = this.messageHandlers.get(message.type);
                    if (handler) {
                        handler(message.data);
                    }
                } catch (error) {
                // Silently handle parse errors
                }
            };
            this.ws.onclose = ()=>{
                this.attemptReconnect();
            };
            this.ws.onerror = (error)=>{
            // Silently handle WebSocket errors
            };
        } catch (error) {
            this.attemptReconnect();
        }
    }
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(()=>{
                this.connect();
            }, this.reconnectInterval);
        }
    }
    send(type, data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type,
                data
            }));
        }
    }
    subscribe(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }
    unsubscribe(messageType) {
        this.messageHandlers.delete(messageType);
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.messageHandlers.clear();
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    constructor(){
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.messageHandlers = new Map();
    }
}
// Create singleton WebSocket manager
const wsManager = new WebSocketManager();
// Initialize WebSocket connection on app start
const initializeWebSocket = ()=>{
    // WebSocket will authenticate via cookies, no need to pass token
    wsManager.connect();
};
// Error handler utility
const handleApiError = (error)=>{
    if (error && typeof error === "object" && "response" in error) {
        const axiosError = error;
        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }
    }
    if (error && typeof error === "object" && "message" in error) {
        const errorWithMessage = error;
        return errorWithMessage.message;
    }
    return "An unexpected error occurred";
};
// API status checker
const checkApiHealth = async ()=>{
    try {
        const response = await apiClient.get("/health");
        return response.data.status === "ok";
    } catch (error) {
        return false;
    }
};
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (apiClient)));


/***/ })

};
;