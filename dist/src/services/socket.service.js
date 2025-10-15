"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const auth_service_1 = require("@/services/auth.service");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
class SocketService {
    static instance;
    io = null;
    authenticatedSockets = new Map();
    userSockets = new Map();
    roomInfo = new Map();
    connectionMetadata = new Map();
    analyticsSubscriptions = new Map();
    messageRateLimit = new Map();
    isInitialized = false;
    RATE_LIMIT = {
        MESSAGES_PER_MINUTE: 60,
        WINDOW_MS: 60000,
        MAX_ROOMS_PER_USER: 50,
        MAX_MESSAGE_LENGTH: 10000
    };
    constructor() { }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    async initialize(server) {
        if (this.isInitialized) {
            logger_1.logger.warn('Socket service already initialized');
            return;
        }
        try {
            logger_1.logger.info('Initializing Socket.IO service');
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: environment_1.config.cors.origins || environment_1.config.cors.origin || '*',
                    methods: ['GET', 'POST'],
                    credentials: true
                },
                pingTimeout: 60000,
                pingInterval: 25000,
                maxHttpBufferSize: 1e6,
                allowEIO3: true,
                transports: ['websocket', 'polling']
            });
            this.setupMiddleware();
            this.setupEventHandlers();
            this.startCleanupTasks();
            this.startAnalyticsBroadcasting();
            this.isInitialized = true;
            logger_1.logger.info('Socket.IO service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Socket.IO service', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
            throw error;
        }
    }
    setupMiddleware() {
        if (!this.io)
            return;
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    logger_1.logger.warn('Socket connection attempt without token', {
                        socketId: socket.id,
                        ip: socket.handshake.address
                    });
                    return next(new Error('Authentication token required'));
                }
                const decoded = typeof auth_service_1.AuthService.verifyToken === 'function'
                    ? await auth_service_1.AuthService.verifyToken(token, 'access')
                    : { userId: 'unknown' };
                const user = typeof auth_service_1.AuthService.getUserById === 'function'
                    ? await auth_service_1.AuthService.getUserById(decoded.userId)
                    : null;
                if (!user || !user.isActive) {
                    logger_1.logger.warn('Socket authentication failed - invalid user', {
                        socketId: socket.id,
                        userId: decoded.userId
                    });
                    return next(new Error('User not found or inactive'));
                }
                socket.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    schoolId: user.schoolId,
                    permissions: user.permissions || []
                };
                socket.isAuthenticated = true;
                socket.sessionId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                socket.connectedAt = new Date();
                socket.lastActivity = new Date();
                this.connectionMetadata.set(socket.id, {
                    connectedAt: socket.connectedAt,
                    lastActivity: socket.lastActivity,
                    roomsJoined: [],
                    messagesSent: 0,
                    messagesReceived: 0,
                    subscriptions: [],
                    ipAddress: socket.handshake.address,
                    userAgent: socket.handshake.headers['user-agent'] || 'Unknown'
                });
                logger_1.logger.info('Socket authenticated successfully', {
                    socketId: socket.id,
                    userId: socket.user.id,
                    email: socket.user.email,
                    role: socket.user.role
                });
                next();
            }
            catch (error) {
                logger_1.logger.error('Socket authentication error', {
                    socketId: socket.id,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
                    ip: socket.handshake.address
                });
                next(new Error('Authentication failed'));
            }
        });
    }
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    handleConnection(socket) {
        if (!socket.user || !socket.isAuthenticated) {
            logger_1.logger.error('Unauthenticated socket connected - this should not happen');
            socket.disconnect();
            return;
        }
        const userId = socket.user.id;
        this.authenticatedSockets.set(socket.id, socket);
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        logger_1.logger.info('Socket connected', {
            socketId: socket.id,
            userId: socket.user.id,
            email: socket.user.email,
            connectedSockets: this.authenticatedSockets.size
        });
        socket.join(`user:${userId}`);
        socket.join(`role:${socket.user.role}`);
        if (socket.user.schoolId) {
            socket.join(`school:${socket.user.schoolId}`);
        }
        this.setupSocketEventHandlers(socket);
        socket.emit('connection_status', {
            status: 'connected',
            timestamp: new Date().toISOString()
        });
        this.updateLastActivity(socket);
    }
    setupSocketEventHandlers(socket) {
        socket.on('authenticate', async (data, callback) => {
            try {
                callback({
                    success: true,
                    user: socket.user,
                    sessionId: socket.sessionId
                });
            }
            catch (error) {
                callback({
                    success: false,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Authentication failed'
                });
            }
        });
        socket.on('join_room', async (data, callback) => {
            try {
                const { room, metadata } = data;
                if (!this.canJoinRoom(socket, room)) {
                    return callback({
                        success: false,
                        error: 'Permission denied or room limit exceeded'
                    });
                }
                await socket.join(room);
                this.updateRoomInfo(room, socket, 'join', metadata);
                const connMetadata = this.connectionMetadata.get(socket.id);
                if (connMetadata) {
                    connMetadata.roomsJoined.push(room);
                }
                const roomSize = this.io?.sockets.adapter.rooms.get(room)?.size || 0;
                logger_1.logger.debug('Socket joined room', {
                    socketId: socket.id,
                    userId: socket.user?.id,
                    room,
                    roomSize
                });
                callback({
                    success: true,
                    room,
                    members: roomSize
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                logger_1.logger.error('Error joining room', {
                    socketId: socket.id,
                    room: data.room,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to join room'
                });
            }
        });
        socket.on('leave_room', async (data, callback) => {
            try {
                const { room } = data;
                await socket.leave(room);
                this.updateRoomInfo(room, socket, 'leave');
                const connMetadata = this.connectionMetadata.get(socket.id);
                if (connMetadata) {
                    const index = connMetadata.roomsJoined.indexOf(room);
                    if (index > -1) {
                        connMetadata.roomsJoined.splice(index, 1);
                    }
                }
                logger_1.logger.debug('Socket left room', {
                    socketId: socket.id,
                    userId: socket.user?.id,
                    room
                });
                callback({ success: true });
                this.updateLastActivity(socket);
            }
            catch (error) {
                logger_1.logger.error('Error leaving room', {
                    socketId: socket.id,
                    room: data.room,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to leave room'
                });
            }
        });
        socket.on('track_order', async (data, callback) => {
            try {
                const { orderId } = data;
                const canTrack = await this.canTrackOrder(socket.user, orderId);
                if (!canTrack) {
                    return callback({
                        success: false,
                        error: 'Permission denied'
                    });
                }
                const order = await this.getOrderDetails(orderId);
                await socket.join(`order:${orderId}`);
                callback({
                    success: true,
                    order,
                    realTimeUpdates: true
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                logger_1.logger.error('Error tracking order', {
                    socketId: socket.id,
                    orderId: data.orderId,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to track order'
                });
            }
        });
        socket.on('ping', (callback) => {
            const timestamp = new Date().toISOString();
            callback({
                pong: 'pong',
                timestamp,
                serverTime: timestamp
            });
            this.updateLastActivity(socket);
        });
        socket.on('typing_start', (data) => {
            const { room } = data;
            if (socket.rooms.has(room)) {
                socket.to(room).emit('typing_indicator', {
                    userId: socket.user.id,
                    room,
                    isTyping: true
                });
            }
            this.updateLastActivity(socket);
        });
        socket.on('typing_stop', (data) => {
            const { room } = data;
            if (socket.rooms.has(room)) {
                socket.to(room).emit('typing_indicator', {
                    userId: socket.user.id,
                    room,
                    isTyping: false
                });
            }
            this.updateLastActivity(socket);
        });
        socket.on('send_message', async (data, callback) => {
            try {
                if (!this.checkRateLimit(socket)) {
                    return callback({
                        success: false,
                        error: 'Rate limit exceeded'
                    });
                }
                const { to, content, type, metadata } = data;
                if (!content || content.length > this.RATE_LIMIT.MAX_MESSAGE_LENGTH) {
                    return callback({
                        success: false,
                        error: 'Invalid message content'
                    });
                }
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await this.storeMessage({
                    id: messageId,
                    from: socket.user.id,
                    to,
                    content,
                    type,
                    metadata,
                    timestamp: new Date().toISOString()
                });
                this.sendMessageToRecipient(to, {
                    id: messageId,
                    from: socket.user.id,
                    to,
                    content,
                    type,
                    timestamp: new Date().toISOString()
                });
                const connMetadata = this.connectionMetadata.get(socket.id);
                if (connMetadata) {
                    connMetadata.messagesSent++;
                }
                callback({
                    success: true,
                    messageId
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                logger_1.logger.error('Error sending message', {
                    socketId: socket.id,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to send message'
                });
            }
        });
        socket.on('subscribe_analytics', async (data, callback) => {
            try {
                if (!this.hasPermission(socket.user, 'analytics:read')) {
                    return callback({
                        success: false,
                        error: 'Permission denied'
                    });
                }
                const { metrics, interval } = data;
                const subscriptionId = `analytics_${socket.id}_${Date.now()}`;
                const intervalId = setInterval(() => {
                    this.sendAnalyticsUpdate(socket, metrics);
                }, Math.max(interval, 5000));
                this.analyticsSubscriptions.set(subscriptionId, {
                    metrics,
                    interval,
                    intervalId
                });
                callback({
                    success: true,
                    subscriptionId
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                callback({
                    success: false,
                    error: 'Failed to subscribe to analytics'
                });
            }
        });
        socket.on('unsubscribe_analytics', (data) => {
            const { subscriptionId } = data;
            const subscription = this.analyticsSubscriptions.get(subscriptionId);
            if (subscription) {
                clearInterval(subscription.intervalId);
                this.analyticsSubscriptions.delete(subscriptionId);
            }
            this.updateLastActivity(socket);
        });
        socket.on('broadcast_announcement', async (data, callback) => {
            try {
                if (!this.hasPermission(socket.user, 'announcements:create')) {
                    return callback({
                        success: false,
                        error: 'Permission denied'
                    });
                }
                const { message, priority, targetRooms, expiresAt } = data;
                const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                let recipientCount = 0;
                const timestamp = new Date().toISOString();
                if (targetRooms && targetRooms.length > 0) {
                    for (const room of targetRooms) {
                        const roomSize = this.io?.sockets.adapter.rooms.get(room)?.size || 0;
                        recipientCount += roomSize;
                        this.io?.to(room).emit('notification', {
                            id: broadcastId,
                            type: 'info',
                            title: 'Announcement',
                            message,
                            timestamp,
                            priority
                        });
                    }
                }
                else {
                    recipientCount = this.authenticatedSockets.size;
                    this.io?.emit('notification', {
                        id: broadcastId,
                        type: 'info',
                        title: 'Announcement',
                        message,
                        timestamp,
                        priority
                    });
                }
                callback({
                    success: true,
                    broadcastId,
                    recipientCount
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                callback({
                    success: false,
                    error: 'Failed to broadcast announcement'
                });
            }
        });
        socket.on('school_notification', async (data) => {
            try {
                if (!this.hasPermission(socket.user, 'school:notify') ||
                    socket.user.schoolId !== data.schoolId) {
                    return;
                }
                const { schoolId, message, priority, targetAudience } = data;
                this.io?.to(`school:${schoolId}`).emit('school_announcement', {
                    id: `school_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    schoolId,
                    message,
                    priority,
                    expiresAt: undefined,
                    targetAudience
                });
                this.updateLastActivity(socket);
            }
            catch (error) {
                logger_1.logger.error('Error sending school notification', {
                    socketId: socket.id,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
                });
            }
        });
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
        socket.on('error', (error) => {
            logger_1.logger.error('Socket error', {
                socketId: socket.id,
                userId: socket.user?.id,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
        });
    }
    handleDisconnection(socket, reason) {
        const userId = socket.user?.id;
        logger_1.logger.info('Socket disconnected', {
            socketId: socket.id,
            userId,
            reason,
            connectedSockets: this.authenticatedSockets.size - 1
        });
        this.authenticatedSockets.delete(socket.id);
        if (userId) {
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
        for (const [subscriptionId, subscription] of this.analyticsSubscriptions.entries()) {
            if (subscriptionId.includes(socket.id)) {
                clearInterval(subscription.intervalId);
                this.analyticsSubscriptions.delete(subscriptionId);
            }
        }
        this.connectionMetadata.delete(socket.id);
        this.messageRateLimit.delete(socket.id);
        socket.emit('connection_status', {
            status: 'disconnected',
            timestamp: new Date().toISOString(),
            reason
        });
    }
    async sendNotificationToUser(userId, notification) {
        try {
            const room = `user:${userId}`;
            this.io?.to(room).emit('notification', {
                ...notification,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send notification to user', {
                userId,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
            return false;
        }
    }
    async sendOrderUpdate(userId, orderUpdate) {
        try {
            const userRoom = `user:${userId}`;
            const orderRoom = `order:${orderUpdate.orderId}`;
            const updateData = {
                orderId: orderUpdate.orderId,
                status: orderUpdate.status,
                timestamp: new Date().toISOString(),
                userId,
                ...orderUpdate.data
            };
            this.io?.to(userRoom).emit('order_status_update', updateData);
            this.io?.to(orderRoom).emit('order_status_update', updateData);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send order update', {
                userId,
                orderId: orderUpdate.orderId,
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
            return false;
        }
    }
    async broadcastSystemMaintenance(maintenanceInfo) {
        try {
            this.io?.emit('system_maintenance', maintenanceInfo);
            logger_1.logger.info('System maintenance notification broadcasted', {
                recipientCount: this.authenticatedSockets.size,
                scheduledAt: maintenanceInfo.scheduledAt
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to broadcast system maintenance', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
        }
    }
    getConnectionStats() {
        return {
            totalConnections: this.io?.sockets.sockets.size || 0,
            authenticatedConnections: this.authenticatedSockets.size,
            uniqueUsers: this.userSockets.size,
            totalRooms: this.roomInfo.size,
            activeSubscriptions: this.analyticsSubscriptions.size
        };
    }
    isServiceInitialized() {
        return this.isInitialized && this.io !== null;
    }
    async healthCheck() {
        try {
            if (!this.isInitialized || !this.io) {
                return false;
            }
            const stats = this.getConnectionStats();
            const isHealthy = stats.totalConnections >= 0;
            return isHealthy;
        }
        catch (error) {
            logger_1.logger.error('Socket service health check failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
            return false;
        }
    }
    async shutdown() {
        try {
            logger_1.logger.info('Shutting down Socket.IO service');
            for (const subscription of this.analyticsSubscriptions.values()) {
                clearInterval(subscription.intervalId);
            }
            this.analyticsSubscriptions.clear();
            if (this.io) {
                this.io.emit('system_maintenance', {
                    message: 'Server is shutting down for maintenance',
                    scheduledAt: new Date().toISOString(),
                    duration: 'Unknown',
                    affectedServices: ['All services']
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.io.disconnectSockets(true);
                this.io.close();
            }
            this.authenticatedSockets.clear();
            this.userSockets.clear();
            this.roomInfo.clear();
            this.connectionMetadata.clear();
            this.messageRateLimit.clear();
            this.isInitialized = false;
            logger_1.logger.info('Socket.IO service shutdown completed');
        }
        catch (error) {
            logger_1.logger.error('Error during Socket.IO service shutdown', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
            });
        }
    }
    canJoinRoom(socket, room) {
        if (!socket.user)
            return false;
        const connMetadata = this.connectionMetadata.get(socket.id);
        if (connMetadata && connMetadata.roomsJoined.length >= this.RATE_LIMIT.MAX_ROOMS_PER_USER) {
            return false;
        }
        return true;
    }
    hasPermission(user, permission) {
        return user.permissions.includes(permission) || user.role === 'admin';
    }
    checkRateLimit(socket) {
        const now = Date.now();
        const limit = this.messageRateLimit.get(socket.id);
        if (!limit || limit.resetAt < now) {
            this.messageRateLimit.set(socket.id, {
                count: 1,
                resetAt: now + this.RATE_LIMIT.WINDOW_MS
            });
            return true;
        }
        if (limit.count >= this.RATE_LIMIT.MESSAGES_PER_MINUTE) {
            socket.emit('rate_limit_warning', {
                remaining: 0,
                resetAt: new Date(limit.resetAt).toISOString(),
                limit: this.RATE_LIMIT.MESSAGES_PER_MINUTE
            });
            return false;
        }
        limit.count++;
        return true;
    }
    updateLastActivity(socket) {
        socket.lastActivity = new Date();
        const metadata = this.connectionMetadata.get(socket.id);
        if (metadata) {
            metadata.lastActivity = socket.lastActivity;
        }
    }
    updateRoomInfo(room, socket, action, metadata) {
        const existing = this.roomInfo.get(room);
        const roomSize = this.io?.sockets.adapter.rooms.get(room)?.size || 0;
        if (action === 'join') {
            if (existing) {
                existing.memberCount = roomSize;
                existing.lastActivity = new Date();
                if (metadata) {
                    existing.metadata = { ...existing.metadata, ...metadata };
                }
            }
            else {
                this.roomInfo.set(room, {
                    name: room,
                    type: this.determineRoomType(room),
                    memberCount: roomSize,
                    createdAt: new Date(),
                    lastActivity: new Date(),
                    metadata
                });
            }
        }
        else if (action === 'leave' && existing) {
            existing.memberCount = roomSize;
            existing.lastActivity = new Date();
            if (roomSize === 0) {
                this.roomInfo.delete(room);
            }
        }
    }
    determineRoomType(room) {
        if (room.startsWith('user:'))
            return 'user';
        if (room.startsWith('order:'))
            return 'order';
        if (room.startsWith('school:'))
            return 'school';
        if (room.startsWith('admin:'))
            return 'admin';
        if (room.startsWith('support:'))
            return 'support';
        return 'user';
    }
    async canTrackOrder(user, orderId) {
        return true;
    }
    async getOrderDetails(orderId) {
        return { id: orderId, status: 'pending' };
    }
    async storeMessage(message) {
    }
    sendMessageToRecipient(recipient, message) {
        if (recipient.startsWith('user:')) {
            this.io?.to(recipient).emit('message', message);
        }
        else {
            this.io?.to(recipient).emit('message', message);
        }
    }
    sendAnalyticsUpdate(socket, metrics) {
        const analyticsData = {
            metric: 'realtime_stats',
            value: {
                activeConnections: this.authenticatedSockets.size,
                uniqueUsers: this.userSockets.size,
                totalRooms: this.roomInfo.size,
                serverUptime: process.uptime()
            },
            timestamp: new Date().toISOString(),
            category: 'system'
        };
        socket.emit('analytics_update', analyticsData);
    }
    startCleanupTasks() {
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.cleanupEmptyRooms();
        }, 60 * 1000);
        setInterval(() => {
            this.cleanupRateLimits();
        }, 60 * 1000);
    }
    cleanupInactiveConnections() {
        const now = Date.now();
        const INACTIVE_THRESHOLD = 30 * 60 * 1000;
        for (const [socketId, metadata] of this.connectionMetadata.entries()) {
            if (now - metadata.lastActivity.getTime() > INACTIVE_THRESHOLD) {
                const socket = this.authenticatedSockets.get(socketId);
                if (socket) {
                    socket.disconnect(true);
                    logger_1.logger.info('Disconnected inactive socket', {
                        socketId,
                        lastActivity: metadata.lastActivity.toISOString()
                    });
                }
            }
        }
    }
    cleanupEmptyRooms() {
        const roomsToDelete = [];
        for (const [roomName, roomInfo] of this.roomInfo.entries()) {
            const actualSize = this.io?.sockets.adapter.rooms.get(roomName)?.size || 0;
            if (actualSize === 0) {
                roomsToDelete.push(roomName);
            }
        }
        for (const roomName of roomsToDelete) {
            this.roomInfo.delete(roomName);
        }
        if (roomsToDelete.length > 0) {
            logger_1.logger.debug('Cleaned up empty rooms', { count: roomsToDelete.length });
        }
    }
    cleanupRateLimits() {
        const now = Date.now();
        const toDelete = [];
        for (const [socketId, limit] of this.messageRateLimit.entries()) {
            if (limit.resetAt < now) {
                toDelete.push(socketId);
            }
        }
        for (const socketId of toDelete) {
            this.messageRateLimit.delete(socketId);
        }
    }
    startAnalyticsBroadcasting() {
        setInterval(() => {
            const stats = this.getConnectionStats();
            this.io?.to('role:admin').emit('realtime_stats', {
                activeOrders: 0,
                activeUsers: stats.uniqueUsers,
                systemLoad: process.cpuUsage().user / 1000000,
                timestamp: new Date().toISOString()
            });
        }, 30 * 1000);
    }
}
exports.SocketService = SocketService;
exports.socketService = SocketService.getInstance();
exports.default = exports.socketService;
//# sourceMappingURL=socket.service.js.map