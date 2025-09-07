/// <reference types="node" />
import { Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
export interface SocketUser {
    id: string;
    email: string;
    role: string;
    schoolId?: string;
    permissions: string[];
}
export interface AuthenticatedSocket extends Socket {
    user?: SocketUser;
    isAuthenticated?: boolean;
    sessionId?: string;
    connectedAt?: Date;
    lastActivity?: Date;
}
export interface ServerToClientEvents {
    order_status_update: (data: {
        orderId: string;
        status: string;
        timestamp: string;
        userId: string;
    }) => void;
    order_created: (data: {
        orderId: string;
        userId: string;
        timestamp: string;
        items: any[];
    }) => void;
    order_cancelled: (data: {
        orderId: string;
        reason: string;
        timestamp: string;
        userId: string;
    }) => void;
    order_confirmed: (data: {
        orderId: string;
        estimatedDelivery: string;
        timestamp: string;
    }) => void;
    payment_success: (data: {
        orderId: string;
        transactionId: string;
        amount: number;
        timestamp: string;
    }) => void;
    payment_failed: (data: {
        orderId: string;
        error: string;
        timestamp: string;
        retryCount: number;
    }) => void;
    payment_pending: (data: {
        orderId: string;
        gateway: string;
        timestamp: string;
    }) => void;
    delivery_started: (data: {
        orderId: string;
        estimatedTime: string;
        driverId: string;
        driverName: string;
    }) => void;
    delivery_completed: (data: {
        orderId: string;
        deliveredAt: string;
        rfidVerified: boolean;
        signature?: string;
    }) => void;
    delivery_delayed: (data: {
        orderId: string;
        newEstimatedTime: string;
        reason: string;
        compensation?: any;
    }) => void;
    delivery_location_update: (data: {
        orderId: string;
        latitude: number;
        longitude: number;
        timestamp: string;
    }) => void;
    notification: (data: {
        id: string;
        type: 'info' | 'warning' | 'error' | 'success';
        title: string;
        message: string;
        timestamp: string;
        actionUrl?: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
    }) => void;
    system_maintenance: (data: {
        message: string;
        scheduledAt: string;
        duration: string;
        affectedServices: string[];
    }) => void;
    connection_status: (data: {
        status: 'connected' | 'disconnected' | 'reconnecting';
        timestamp: string;
        reason?: string;
    }) => void;
    rate_limit_warning: (data: {
        remaining: number;
        resetAt: string;
        limit: number;
    }) => void;
    analytics_update: (data: {
        metric: string;
        value: any;
        timestamp: string;
        category: 'orders' | 'payments' | 'delivery' | 'users' | 'system';
    }) => void;
    realtime_stats: (data: {
        activeOrders: number;
        activeUsers: number;
        systemLoad: number;
        timestamp: string;
    }) => void;
    error: (data: {
        code: string;
        message: string;
        timestamp: string;
        severity: 'low' | 'medium' | 'high';
    }) => void;
    message: (data: {
        id: string;
        from: string;
        to: string;
        content: string;
        timestamp: string;
        type: 'text' | 'image' | 'file';
    }) => void;
    typing_indicator: (data: {
        userId: string;
        room: string;
        isTyping: boolean;
    }) => void;
    school_announcement: (data: {
        id: string;
        schoolId: string;
        message: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        expiresAt?: string;
        targetAudience: 'all' | 'students' | 'staff' | 'parents';
    }) => void;
    performance_alert: (data: {
        metric: string;
        value: number;
        threshold: number;
        severity: 'warning' | 'critical';
        timestamp: string;
    }) => void;
}
export interface ClientToServerEvents {
    authenticate: (data: {
        token: string;
    }, callback: (response: {
        success: boolean;
        user?: SocketUser;
        error?: string;
        sessionId?: string;
    }) => void) => void;
    join_room: (data: {
        room: string;
        metadata?: any;
    }, callback: (response: {
        success: boolean;
        room?: string;
        members?: number;
        error?: string;
    }) => void) => void;
    leave_room: (data: {
        room: string;
    }, callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    track_order: (data: {
        orderId: string;
    }, callback: (response: {
        success: boolean;
        order?: any;
        realTimeUpdates?: boolean;
        error?: string;
    }) => void) => void;
    ping: (callback: (response: {
        pong: string;
        timestamp: string;
        serverTime: string;
    }) => void) => void;
    typing_start: (data: {
        room: string;
        content?: string;
    }) => void;
    typing_stop: (data: {
        room: string;
    }) => void;
    send_message: (data: {
        to: string;
        content: string;
        type: 'text' | 'image' | 'file';
        metadata?: any;
    }, callback: (response: {
        success: boolean;
        messageId?: string;
        error?: string;
    }) => void) => void;
    broadcast_announcement: (data: {
        message: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        targetRooms?: string[];
        expiresAt?: string;
    }, callback: (response: {
        success: boolean;
        broadcastId?: string;
        recipientCount?: number;
        error?: string;
    }) => void) => void;
    subscribe_analytics: (data: {
        metrics: string[];
        interval: number;
    }, callback: (response: {
        success: boolean;
        subscriptionId?: string;
        error?: string;
    }) => void) => void;
    unsubscribe_analytics: (data: {
        subscriptionId: string;
    }) => void;
    school_notification: (data: {
        schoolId: string;
        message: string;
        priority: 'low' | 'medium' | 'high';
        targetAudience: 'all' | 'students' | 'staff' | 'parents';
    }) => void;
}
export interface SocketConnectionMetadata {
    connectedAt: Date;
    lastActivity: Date;
    roomsJoined: string[];
    messagesSent: number;
    messagesReceived: number;
    subscriptions: string[];
    ipAddress: string;
    userAgent: string;
}
export interface RoomInfo {
    name: string;
    type: 'user' | 'order' | 'school' | 'admin' | 'support';
    memberCount: number;
    createdAt: Date;
    lastActivity: Date;
    metadata?: any;
    permissions?: string[];
}
export declare class SocketService {
    private static instance;
    private io;
    private authenticatedSockets;
    private userSockets;
    private roomInfo;
    private connectionMetadata;
    private analyticsSubscriptions;
    private messageRateLimit;
    private isInitialized;
    private readonly RATE_LIMIT;
    private constructor();
    static getInstance(): SocketService;
    initialize(server: HTTPServer): Promise<void>;
    private setupMiddleware;
    private setupEventHandlers;
    private handleConnection;
    private setupSocketEventHandlers;
    private handleDisconnection;
    sendNotificationToUser(userId: string, notification: {
        id: string;
        type: 'info' | 'warning' | 'error' | 'success';
        title: string;
        message: string;
        actionUrl?: string;
        priority: 'low' | 'medium' | 'high' | 'urgent';
    }): Promise<boolean>;
    sendOrderUpdate(userId: string, orderUpdate: {
        orderId: string;
        status: string;
        data?: any;
    }): Promise<boolean>;
    broadcastSystemMaintenance(maintenanceInfo: {
        message: string;
        scheduledAt: string;
        duration: string;
        affectedServices: string[];
    }): Promise<void>;
    getConnectionStats(): {
        totalConnections: number;
        authenticatedConnections: number;
        uniqueUsers: number;
        totalRooms: number;
        activeSubscriptions: number;
    };
    isServiceInitialized(): boolean;
    healthCheck(): Promise<boolean>;
    shutdown(): Promise<void>;
    private canJoinRoom;
    private hasPermission;
    private checkRateLimit;
    private updateLastActivity;
    private updateRoomInfo;
    private determineRoomType;
    private canTrackOrder;
    private getOrderDetails;
    private storeMessage;
    private sendMessageToRecipient;
    private sendAnalyticsUpdate;
    private startCleanupTasks;
    private cleanupInactiveConnections;
    private cleanupEmptyRooms;
    private cleanupRateLimits;
    private startAnalyticsBroadcasting;
}
export declare const socketService: SocketService;
export default socketService;
//# sourceMappingURL=socket.service.d.ts.map