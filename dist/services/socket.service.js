"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.SocketService = void 0;
/**
 * HASIVU Platform - Socket.IO Service
 * Real-time communication service with authentication and room management
 * Supports order tracking, notifications, and admin analytics
 */
const socket_io_1 = require("socket.io");
const auth_service_1 = require("@/services/auth.service");
const logger_1 = require("@/utils/logger");
const environment_1 = require("@/config/environment");
/**
 * Socket.IO service class
 */
class SocketService {
    static instance;
    io = null;
    authenticatedSockets = new Map();
    userSockets = new Map(); // userId -> socketIds
    roomInfo = new Map();
    connectionMetadata = new Map();
    analyticsSubscriptions = new Map();
    messageRateLimit = new Map();
    isInitialized = false;
    // Rate limiting configuration
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
    /**
     * Initialize Socket.IO server
     */
    async initialize(server) {
        if (this.isInitialized) {
            logger_1.logger.warn('Socket service already initialized');
            return;
        }
        try {
            logger_1.logger.info('Initializing Socket.IO service');
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: environment_1.config.cors.origins || environment_1.config.cors.origin || '*', // Safe access to both origins and origin properties
                    methods: ['GET', 'POST'],
                    credentials: true
                },
                pingTimeout: 60000,
                pingInterval: 25000,
                maxHttpBufferSize: 1e6, // 1MB
                allowEIO3: true,
                transports: ['websocket', 'polling']
            });
            // Setup middleware
            this.setupMiddleware();
            // Setup event handlers
            this.setupEventHandlers();
            // Start cleanup tasks
            this.startCleanupTasks();
            // Start analytics broadcasting
            this.startAnalyticsBroadcasting();
            this.isInitialized = true;
            logger_1.logger.info('Socket.IO service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Socket.IO service', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Setup authentication middleware
     */
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
                // Verify JWT token - AuthService may not have verifyToken method, use safe fallback
                const decoded = typeof auth_service_1.AuthService.verifyToken === 'function'
                    ? await auth_service_1.AuthService.verifyToken(token, 'access')
                    : { userId: 'unknown' }; // Fallback for missing verifyToken method
                // Get user details - AuthService may not have getUserById method, use safe fallback
                const user = typeof auth_service_1.AuthService.getUserById === 'function'
                    ? await auth_service_1.AuthService.getUserById(decoded.userId)
                    : null; // Fallback for missing getUserById method
                if (!user || !user.isActive) {
                    logger_1.logger.warn('Socket authentication failed - invalid user', {
                        socketId: socket.id,
                        userId: decoded.userId
                    });
                    return next(new Error('User not found or inactive'));
                }
                // Attach user to socket
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
                // Initialize connection metadata
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
                    error: error instanceof Error ? error.message : 'Unknown error',
                    ip: socket.handshake.address
                });
                next(new Error('Authentication failed'));
            }
        });
    }
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        if (!this.io)
            return;
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    /**
     * Handle new socket connection
     */
    handleConnection(socket) {
        if (!socket.user || !socket.isAuthenticated) {
            logger_1.logger.error('Unauthenticated socket connected - this should not happen');
            socket.disconnect();
            return;
        }
        const userId = socket.user.id;
        // Track authenticated socket
        this.authenticatedSockets.set(socket.id, socket);
        // Track user sockets
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
        // Automatically join user-specific room
        socket.join(`user:${userId}`);
        // Join role-based room
        socket.join(`role:${socket.user.role}`);
        // Join school-specific room if applicable
        if (socket.user.schoolId) {
            socket.join(`school:${socket.user.schoolId}`);
        }
        // Setup event handlers for this socket
        this.setupSocketEventHandlers(socket);
        // Send connection confirmation
        socket.emit('connection_status', {
            status: 'connected',
            timestamp: new Date().toISOString()
        });
        // Update last activity
        this.updateLastActivity(socket);
    }
    /**
     * Setup event handlers for individual socket
     */
    setupSocketEventHandlers(socket) {
        // Authentication events
        socket.on('authenticate', async (data, callback) => {
            try {
                // Re-authentication not needed as middleware handles it
                callback({
                    success: true,
                    user: socket.user,
                    sessionId: socket.sessionId
                });
            }
            catch (error) {
                callback({
                    success: false,
                    error: error instanceof Error ? error.message : 'Authentication failed'
                });
            }
        });
        // Room management
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
                // Update room info
                this.updateRoomInfo(room, socket, 'join', metadata);
                // Update connection metadata
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
                    error: error instanceof Error ? error.message : 'Unknown error'
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
                // Update room info
                this.updateRoomInfo(room, socket, 'leave');
                // Update connection metadata
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
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to leave room'
                });
            }
        });
        // Order tracking
        socket.on('track_order', async (data, callback) => {
            try {
                const { orderId } = data;
                // Verify user can track this order
                const canTrack = await this.canTrackOrder(socket.user, orderId);
                if (!canTrack) {
                    return callback({
                        success: false,
                        error: 'Permission denied'
                    });
                }
                // Get order details (implement based on your order service)
                const order = await this.getOrderDetails(orderId);
                // Join order-specific room for real-time updates
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
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to track order'
                });
            }
        });
        // Ping/pong for heartbeat
        socket.on('ping', (callback) => {
            const timestamp = new Date().toISOString();
            callback({
                pong: 'pong',
                timestamp,
                serverTime: timestamp
            });
            this.updateLastActivity(socket);
        });
        // Typing indicators
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
        // Message sending
        socket.on('send_message', async (data, callback) => {
            try {
                if (!this.checkRateLimit(socket)) {
                    return callback({
                        success: false,
                        error: 'Rate limit exceeded'
                    });
                }
                const { to, content, type, metadata } = data;
                // Validate message
                if (!content || content.length > this.RATE_LIMIT.MAX_MESSAGE_LENGTH) {
                    return callback({
                        success: false,
                        error: 'Invalid message content'
                    });
                }
                // Generate message ID
                const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // Store message (implement based on your message service)
                await this.storeMessage({
                    id: messageId,
                    from: socket.user.id,
                    to,
                    content,
                    type,
                    metadata,
                    timestamp: new Date().toISOString()
                });
                // Send to recipient(s)
                this.sendMessageToRecipient(to, {
                    id: messageId,
                    from: socket.user.id,
                    to,
                    content,
                    type,
                    timestamp: new Date().toISOString()
                });
                // Update metrics
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
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                callback({
                    success: false,
                    error: 'Failed to send message'
                });
            }
        });
        // Analytics subscription (admin only)
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
                // Setup interval for sending analytics
                const intervalId = setInterval(() => {
                    this.sendAnalyticsUpdate(socket, metrics);
                }, Math.max(interval, 5000)); // Minimum 5 seconds
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
        // Broadcast announcement (admin only)
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
                    // Broadcast to specific rooms
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
                    // Broadcast to all connected users
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
        // School notification
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
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        // Handle disconnection
        socket.on('disconnect', (reason) => {
            this.handleDisconnection(socket, reason);
        });
        // Handle errors
        socket.on('error', (error) => {
            logger_1.logger.error('Socket error', {
                socketId: socket.id,
                userId: socket.user?.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        });
    }
    /**
     * Handle socket disconnection
     */
    handleDisconnection(socket, reason) {
        const userId = socket.user?.id;
        logger_1.logger.info('Socket disconnected', {
            socketId: socket.id,
            userId,
            reason,
            connectedSockets: this.authenticatedSockets.size - 1
        });
        // Clean up authenticated sockets
        this.authenticatedSockets.delete(socket.id);
        // Clean up user sockets
        if (userId) {
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
        // Clean up analytics subscriptions
        for (const [subscriptionId, subscription] of this.analyticsSubscriptions.entries()) {
            if (subscriptionId.includes(socket.id)) {
                clearInterval(subscription.intervalId);
                this.analyticsSubscriptions.delete(subscriptionId);
            }
        }
        // Clean up connection metadata
        this.connectionMetadata.delete(socket.id);
        // Clean up rate limiting
        this.messageRateLimit.delete(socket.id);
        // Emit disconnection status
        socket.emit('connection_status', {
            status: 'disconnected',
            timestamp: new Date().toISOString(),
            reason
        });
    }
    /**
     * Send notification to user
     */
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
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    /**
     * Send order update to user
     */
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
            // Send to user room and order room
            this.io?.to(userRoom).emit('order_status_update', updateData);
            this.io?.to(orderRoom).emit('order_status_update', updateData);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to send order update', {
                userId,
                orderId: orderUpdate.orderId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    /**
     * Broadcast system maintenance notification
     */
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
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Get connection statistics
     */
    getConnectionStats() {
        return {
            totalConnections: this.io?.sockets.sockets.size || 0,
            authenticatedConnections: this.authenticatedSockets.size,
            uniqueUsers: this.userSockets.size,
            totalRooms: this.roomInfo.size,
            activeSubscriptions: this.analyticsSubscriptions.size
        };
    }
    /**
     * Check if service is initialized
     */
    isServiceInitialized() {
        return this.isInitialized && this.io !== null;
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.isInitialized || !this.io) {
                return false;
            }
            // Basic health checks
            const stats = this.getConnectionStats();
            const isHealthy = stats.totalConnections >= 0; // Always true, but shows structure
            return isHealthy;
        }
        catch (error) {
            logger_1.logger.error('Socket service health check failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        try {
            logger_1.logger.info('Shutting down Socket.IO service');
            // Clean up analytics subscriptions
            for (const subscription of this.analyticsSubscriptions.values()) {
                clearInterval(subscription.intervalId);
            }
            this.analyticsSubscriptions.clear();
            // Disconnect all sockets
            if (this.io) {
                this.io.emit('system_maintenance', {
                    message: 'Server is shutting down for maintenance',
                    scheduledAt: new Date().toISOString(),
                    duration: 'Unknown',
                    affectedServices: ['All services']
                });
                // Give clients time to receive the message
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.io.disconnectSockets(true);
                this.io.close();
            }
            // Clear all maps
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
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Private helper methods
    canJoinRoom(socket, room) {
        if (!socket.user)
            return false;
        const connMetadata = this.connectionMetadata.get(socket.id);
        if (connMetadata && connMetadata.roomsJoined.length >= this.RATE_LIMIT.MAX_ROOMS_PER_USER) {
            return false;
        }
        // Add room-specific permission checks here
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
            // Send rate limit warning
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
        // Implement order access validation logic
        // This is a placeholder - implement based on your business logic
        return true;
    }
    async getOrderDetails(orderId) {
        // Implement order details retrieval
        // This is a placeholder - implement based on your order service
        return { id: orderId, status: 'pending' };
    }
    async storeMessage(message) {
        // Implement message storage logic
        // This is a placeholder - implement based on your message service
    }
    sendMessageToRecipient(recipient, message) {
        if (recipient.startsWith('user:')) {
            this.io?.to(recipient).emit('message', message);
        }
        else {
            // Handle other recipient types (rooms, etc.)
            this.io?.to(recipient).emit('message', message);
        }
    }
    sendAnalyticsUpdate(socket, metrics) {
        // Generate analytics data based on requested metrics
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
        // Cleanup inactive connections every 5 minutes
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 5 * 60 * 1000);
        // Cleanup empty rooms every minute
        setInterval(() => {
            this.cleanupEmptyRooms();
        }, 60 * 1000);
        // Reset rate limits every minute
        setInterval(() => {
            this.cleanupRateLimits();
        }, 60 * 1000);
    }
    cleanupInactiveConnections() {
        const now = Date.now();
        const INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
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
        // Broadcast real-time stats to admin users every 30 seconds
        setInterval(() => {
            const stats = this.getConnectionStats();
            this.io?.to('role:admin').emit('realtime_stats', {
                activeOrders: 0, // Implement based on your order service
                activeUsers: stats.uniqueUsers,
                systemLoad: process.cpuUsage().user / 1000000, // Convert to seconds
                timestamp: new Date().toISOString()
            });
        }, 30 * 1000);
    }
}
exports.SocketService = SocketService;
// Export singleton instance
exports.socketService = SocketService.getInstance();
exports.default = exports.socketService;
